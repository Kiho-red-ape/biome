import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// GET /api/payments/verify-launch-fee?session_id=xxx&experiment_id=yyy
// Called by the experiment page after Stripe redirects back with ?launch_fee=success.
// Verifies the Stripe session is paid and publishes the study directly.
// This is the primary publish path — the webhook is a secondary redundancy layer.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId    = searchParams.get('session_id');
  const experimentId = searchParams.get('experiment_id');

  if (!sessionId || !experimentId) {
    return NextResponse.json({ error: 'session_id and experiment_id required' }, { status: 400 });
  }

  // Verify the session with Stripe
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe session' }, { status: 400 });
  }

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ error: 'Payment not completed', status: session.payment_status }, { status: 402 });
  }

  if (
    session.metadata?.type !== 'launch_fee' ||
    session.metadata?.experiment_id !== experimentId
  ) {
    return NextResponse.json({ error: 'Session does not match this experiment' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Check if already published (idempotent — safe to call multiple times)
  const { data: exp } = await supabase
    .from('experiments')
    .select('id, status, launch_fee_paid')
    .eq('id', experimentId)
    .single();

  if (!exp) return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });

  if (exp.status !== 'draft' && exp.launch_fee_paid) {
    // Already published — return success without re-updating
    return NextResponse.json({ published: true, already: true });
  }

  const recruitmentDays = Math.max(7, Math.min(365, Number(session.metadata?.recruitment_days ?? 30)));
  const now             = new Date();
  const deadline        = new Date(now.getTime() + recruitmentDays * 86_400_000);

  const { error: updateErr } = await supabase
    .from('experiments')
    .update({
      launch_fee_paid:          true,
      launch_fee_paid_at:       now.toISOString(),
      launch_fee_status:        'paid',
      stripe_payment_intent_id: session.payment_intent as string,
      status:                   'recruiting',
      published_at:             now.toISOString(),
      application_deadline:     deadline.toISOString(),
      recruitment_window_days:  recruitmentDays,
    })
    .eq('id', experimentId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ published: true });
}
