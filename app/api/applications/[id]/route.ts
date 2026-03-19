import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

// PATCH /api/applications/[id]
// Body: { privyDid, status: 'approved'|'rejected'|'waitlisted'|'applied' }
// Only the experiment owner can update application status.
export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await req.json() as { privyDid?: string; status?: string };
  const { privyDid, status } = body;

  const ALLOWED = ['applied', 'approved', 'rejected', 'waitlisted'] as const;
  type AllowedStatus = typeof ALLOWED[number];

  if (!privyDid || !status || !ALLOWED.includes(status as AllowedStatus)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fetch application + experiment to verify ownership
  const { data: app } = await supabase
    .from('applications')
    .select('id, experiment_id, participant_id, status')
    .eq('id', id)
    .single();

  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

  const { data: exp } = await supabase
    .from('experiments')
    .select('id, experimenter_id, slots_filled, slots_total, status')
    .eq('id', app.experiment_id)
    .single();

  if (!exp) return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
  if (exp.experimenter_id !== privyDid) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  // Disallow changes once experiment is active/completed
  if (exp.status === 'completed' || exp.status === 'cancelled') {
    return NextResponse.json({ error: 'Cannot change status on a completed experiment' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { status };
  const prevStatus = app.status as string;
  const newStatus  = status as string;

  // Set approved_at when approving
  if (newStatus === 'approved' && prevStatus !== 'approved') {
    updates.approved_at = new Date().toISOString();
  }
  if (newStatus !== 'approved') {
    updates.approved_at = null;
  }

  // Update application
  const { data: updated, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Adjust slots_filled: +1 when newly approved, -1 when unapproved from approved
  let slotsDelta = 0;
  if (newStatus === 'approved' && prevStatus !== 'approved') slotsDelta = 1;
  if (prevStatus === 'approved' && newStatus !== 'approved') slotsDelta = -1;

  if (slotsDelta !== 0) {
    await supabase
      .from('experiments')
      .update({ slots_filled: Math.max(0, exp.slots_filled + slotsDelta) })
      .eq('id', exp.id);
  }

  return NextResponse.json({ application: updated });
}
