import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  notifType: z.string().min(1),
  title:     z.string().min(1).max(200),
  message:   z.string().min(1).max(2000),
  audience:  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('all') }),
    z.object({ kind: z.literal('study'),   study_id: z.string().uuid() }),
    z.object({ kind: z.literal('country'), country: z.string().min(1) }),
    z.object({ kind: z.literal('manual'),  participant_ids: z.array(z.string()).min(1) }),
  ]),
});

export async function POST(req: NextRequest) {
  const body: unknown = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { notifType, title, message, audience } = parsed.data;
  const db = createServiceClient();

  let userIds: string[] = [];

  if (audience.kind === 'all') {
    const { data } = await db.from('participant_profiles').select('user_id');
    userIds = (data ?? []).map(r => (r as { user_id: string }).user_id);

  } else if (audience.kind === 'study') {
    // Notify participants NOT yet enrolled in this study
    const { data: appData } = await db.from('applications').select('participant_id').eq('experiment_id', audience.study_id);
    const enrolled = new Set((appData ?? []).map(r => (r as { participant_id: string }).participant_id));
    const { data: ppData } = await db.from('participant_profiles').select('user_id');
    userIds = (ppData ?? []).map(r => (r as { user_id: string }).user_id).filter(id => !enrolled.has(id));

  } else if (audience.kind === 'country') {
    const { data } = await db.from('participant_profiles').select('user_id').eq('country', audience.country);
    userIds = (data ?? []).map(r => (r as { user_id: string }).user_id);

  } else if (audience.kind === 'manual') {
    // participant_ids are P-XXXX-XXXX codes — look up their user_ids
    const { data } = await db.from('participant_profiles').select('user_id').in('participant_id', audience.participant_ids);
    userIds = (data ?? []).map(r => (r as { user_id: string }).user_id);
  }

  if (userIds.length === 0) return NextResponse.json({ ok: true, count: 0 });

  const rows = userIds.map(user_id => ({
    user_id,
    type:    notifType,
    payload: { title, message },
  }));

  const { error } = await db.from('notifications').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, count: rows.length });
}

// GET: fetch sent notification history (last 50, aggregated)
export async function GET() {
  const db = createServiceClient();
  const { data } = await db
    .from('notifications')
    .select('type, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  return NextResponse.json({ notifications: data ?? [] });
}
