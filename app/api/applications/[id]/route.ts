import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

// PATCH /api/applications/[id]
// Body: { privyDid, status } — experimenter updates application status
// Supports: applied, approved, rejected, waitlisted, enrolled
// Auto-enrolls (skips 'approved') when experiment has no enrollment_url.
export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await req.json() as { privyDid?: string; status?: string };
  const { privyDid, status } = body;

  const ALLOWED = ['applied', 'approved', 'rejected', 'waitlisted', 'enrolled'] as const;
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
    .select('id, experimenter_id, slots_filled, slots_total, status, title, enrollment_url')
    .eq('id', app.experiment_id)
    .single();

  if (!exp) return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
  if (exp.experimenter_id !== privyDid) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  if (exp.status === 'completed' || exp.status === 'cancelled') {
    return NextResponse.json({ error: 'Cannot change status on a completed experiment' }, { status: 400 });
  }

  const prevStatus = app.status as string;
  let   newStatus  = status as string;

  // Auto-enroll: if no enrollment_url and status is being set to 'approved', jump straight to 'enrolled'
  if (newStatus === 'approved' && !exp.enrollment_url) {
    newStatus = 'enrolled';
  }

  const updates: Record<string, unknown> = { status: newStatus };

  if (newStatus === 'approved' && prevStatus !== 'approved') {
    updates.approved_at = new Date().toISOString();
  }
  if (newStatus !== 'approved' && newStatus !== 'enrolled') {
    updates.approved_at = null;
  }

  const { data: updated, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Adjust slots_filled
  let slotsDelta = 0;
  const wasApprovedOrEnrolled = ['approved', 'enrolled'].includes(prevStatus);
  const isApprovedOrEnrolled  = ['approved', 'enrolled'].includes(newStatus);
  if (!wasApprovedOrEnrolled && isApprovedOrEnrolled)  slotsDelta = 1;
  if (wasApprovedOrEnrolled  && !isApprovedOrEnrolled) slotsDelta = -1;

  if (slotsDelta !== 0) {
    await supabase
      .from('experiments')
      .update({ slots_filled: Math.max(0, exp.slots_filled + slotsDelta) })
      .eq('id', exp.id);
  }

  // Notify participant
  const notifType = newStatus === 'enrolled'   ? 'enrollment_confirmed'
                  : newStatus === 'approved'    ? 'application_approved'
                  : newStatus === 'rejected'    ? 'application_rejected'
                  : newStatus === 'waitlisted'  ? 'application_waitlisted'
                  : null;

  const notifTitle = newStatus === 'enrolled'   ? `You're enrolled in "${exp.title}"`
                   : newStatus === 'approved'    ? `Accepted into "${exp.title}" — complete enrollment`
                   : newStatus === 'rejected'    ? `Application to "${exp.title}" was not selected`
                   : newStatus === 'waitlisted'  ? `You've been waitlisted for "${exp.title}"`
                   : null;

  if (notifType && notifTitle) {
    await supabase.from('notifications').insert({
      user_id: app.participant_id as string,
      type:    notifType,
      title:   notifTitle,
      link:    '/dashboard',
    }).then(() => {}, () => {});
  }

  return NextResponse.json({ application: updated, autoEnrolled: newStatus === 'enrolled' && status === 'approved' });
}
