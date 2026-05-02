import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface Props { params: Promise<{ id: string }> }

// POST /api/studies/[id]/process-payouts
export async function POST(req: NextRequest, { params }: Props) {
  const { id: experimentId } = await params;
  const body = await req.json() as { privyDid?: string };
  const { privyDid } = body;

  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();

  const { data: exp } = await supabase
    .from('experiments')
    .select('id, title, status, experimenter_id, escrow_status, bounty_per_participant, experiment_code')
    .eq('id', experimentId)
    .single();

  if (!exp) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  const { data: callerProfile } = await supabase
    .from('profiles').select('is_admin').eq('id', privyDid).single();

  const isAdmin = callerProfile?.is_admin === true;
  const isOwner = exp.experimenter_id === privyDid;
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  if (exp.status !== 'completed') {
    return NextResponse.json({ error: 'Study must be completed before processing payouts' }, { status: 400 });
  }
  if (exp.escrow_status !== 'deposited') {
    return NextResponse.json({ error: 'Escrow deposit must be confirmed before processing payouts' }, { status: 400 });
  }

  // Fetch eligible pending applications
  const { data: apps } = await supabase
    .from('applications')
    .select('id, participant_id, payout_status')
    .eq('experiment_id', experimentId)
    .eq('payout_status', 'pending')
    .in('status', ['completed', 'enrolled', 'approved']);

  if (!apps || apps.length === 0) {
    return NextResponse.json({ message: 'No pending payouts to process', paymentsInitiated: 0 });
  }

  // Fetch participant Stripe onboarding status
  const participantIds = apps.map((a) => a.participant_id as string);
  const { data: ppRows } = await supabase
    .from('participant_profiles')
    .select('user_id, stripe_account_id, stripe_onboarding_complete')
    .in('user_id', participantIds);

  type PPRow = { user_id: string; stripe_account_id: string | null; stripe_onboarding_complete: boolean };
  const ppMap = new Map<string, PPRow>();
  for (const p of (ppRows ?? [])) {
    ppMap.set(p.user_id, p as unknown as PPRow);
  }

  const gross = Number(exp.bounty_per_participant);
  const fee   = gross * 0.005;
  const net   = parseFloat((gross - fee).toFixed(2));

  let queued  = 0;
  let missing = 0;

  for (const app of apps) {
    const pp = ppMap.get(app.participant_id as string);

    if (!pp?.stripe_onboarding_complete) {
      await supabase.from('applications')
        .update({ payout_status: 'method_missing' })
        .eq('id', app.id);
      missing++;
      continue;
    }

    // Queue for manual Stripe payout processing
    await supabase.from('applications').update({
      payout_status:       'processing',
      payout_initiated_at: new Date().toISOString(),
      payout_fee_amount:   fee,
      payout_net_amount:   net,
    }).eq('id', app.id);

    queued++;
  }

  if (queued > 0) {
    await supabase.from('experiments')
      .update({ escrow_status: 'partially_released' })
      .eq('id', experimentId);
  }

  return NextResponse.json({
    paymentsQueued:  queued,
    paymentsMissing: missing,
    totalAmount:     queued * net,
    note:            'Payments queued for Stripe processing. Stripe Connect integration pending.',
  });
}
