// POST /api/study/[id]/broadcast  { privyDid, title, message }
// Researcher sends an in-app notification to every enrolled participant of the study.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { canManageExperiment } from '@/lib/org/access';

const ENROLLED = ['approved', 'active', 'enrolled', 'completed'];

const schema = z.object({
  privyDid: z.string().min(1),
  title:    z.string().min(2).max(140),
  message:  z.string().min(1).max(1000),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: experimentId } = await params;
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await req.json()); }
  catch { return NextResponse.json({ error: 'title and message required' }, { status: 400 }); }

  const db = createServiceClient();
  if (!(await canManageExperiment(db, body.privyDid, experimentId))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { data: apps } = await db
    .from('applications')
    .select('participant_id')
    .eq('experiment_id', experimentId)
    .in('status', ENROLLED);

  const recipients = [...new Set(((apps ?? []) as { participant_id: string }[]).map((a) => a.participant_id))];
  if (recipients.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const rows = recipients.map((uid) => ({
    user_id: uid,
    type:    'study_update',
    payload: { title: body.title, message: body.message },
    read:    false,
  }));

  const { error } = await db.from('notifications').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, sent: recipients.length });
}
