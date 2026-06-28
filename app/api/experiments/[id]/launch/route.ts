// POST /api/experiments/[id]/launch  { privyDid }
// Researcher requests launch of a draft study. Validates the minimum fields are
// present and an ICF is attached, then flags it for ops payment confirmation.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { canManageExperiment } from '@/lib/org/access';

const schema = z.object({ privyDid: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: experimentId } = await params;
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await req.json()); }
  catch { return NextResponse.json({ error: 'privyDid required' }, { status: 400 }); }

  const db = createServiceClient();
  if (!(await canManageExperiment(db, body.privyDid, experimentId))) {
    return NextResponse.json({ error: 'Not authorized to launch this study' }, { status: 403 });
  }

  const { data: exp } = await db
    .from('experiments')
    .select('status, title, description, slots_total, bounty_per_participant, payment_status')
    .eq('id', experimentId)
    .maybeSingle();
  const e = exp as {
    status: string; title: string | null; description: string | null;
    slots_total: number | null; bounty_per_participant: number | null; payment_status: string | null;
  } | null;
  if (!e) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  if (e.status !== 'draft') {
    return NextResponse.json({ error: 'Only draft studies can be launched' }, { status: 400 });
  }

  // Minimum fields to recruit.
  const missing: string[] = [];
  if (!e.title?.trim()) missing.push('title');
  if (!e.description?.trim()) missing.push('description');
  if (!e.slots_total || e.slots_total < 1) missing.push('participant slots');
  if (!e.bounty_per_participant || e.bounty_per_participant <= 0) missing.push('compensation per participant');

  // Require an approved consent document (ICF) before recruiting.
  const { data: icf } = await db
    .from('study_documents')
    .select('id')
    .eq('experiment_id', experimentId)
    .eq('document_type', 'consent_form')
    .in('status', ['approved', 'signed', 'pending_signature'])
    .not('content_html', 'is', null)
    .limit(1)
    .maybeSingle();
  if (!icf) missing.push('an approved consent document (ICF)');

  if (missing.length > 0) {
    return NextResponse.json({ error: 'Complete these before launching: ' + missing.join(', '), missing }, { status: 422 });
  }

  const now = new Date().toISOString();
  await db.from('experiments')
    .update({ payment_status: 'launch_requested', launch_requested_at: now, launch_requested_by: body.privyDid })
    .eq('id', experimentId);

  return NextResponse.json({ ok: true, status: 'launch_requested' });
}
