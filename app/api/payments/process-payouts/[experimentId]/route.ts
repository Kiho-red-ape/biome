import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

interface Props { params: Promise<{ experimentId: string }> }

// POST /api/payments/process-payouts/[experimentId]
// Sends Stripe transfers to all eligible participants for a completed study.
export async function POST(req: NextRequest, { params }: Props) {
  const { experimentId } = await params;
  const body = await req.json() as { privyDid?: string };
  const { privyDid } = body;

  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();

  const { data: exp } = await supabase
    .from('experiments')
    .select('id, title, status, experimenter_id, bounty_pool_deposited, bounty_per_participant, experiment_code')
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
  if (!exp.bounty_pool_deposited) {
    return NextResponse.json({ error: 'Bounty pool must be deposited before processing payouts' }, { status: 400 });
  }

  // Fetch eligible pending applications
  const { data: apps } = await supabase
    .from('applications')
    .select('id, participant_id, payout_status')
    .eq('experiment_id', experimentId)
    .eq('payout_status', 'pending')
    .in('status', ['completed', 'enrolled', 'approved']);

  if (!apps || apps.length === 0) {
    return NextResponse.json({ message: 'No pending payouts to process', initiated: 0 });
  }

  // Fetch Stripe account info for these participants
  const participantIds = apps.map((a) => a.participant_id as string);
  const { data: ppRows } = await supabase
    .from('participant_profiles')
    .select('user_id, stripe_account_id, stripe_onboarding_complete')
    .in('user_id', participantIds);

  const ppMap = new Map((ppRows ?? []).map((p) => [p.user_id, p]));

  const gross = Number(exp.bounty_per_participant);
  const fee   = gross * 0.005; // 0.5% processing fee
  const net   = parseFloat((gross - fee).toFixed(2));

  let initiated = 0;
  let missing   = 0;
  const failures: string[] = [];

  for (const app of apps) {
    const pp = ppMap.get(app.participant_id as string);

    if (!pp?.stripe_account_id || !pp.stripe_onboarding_complete) {
      await supabase.from('applications')
        .update({ payout_status: 'method_missing' })
        .eq('id', app.id);
      missing++;
      continue;
    }

    try {
      const transfer = await stripe.transfers.create({
        amount:      Math.round(net * 100), // cents
        currency:    'usd',
        destination: pp.stripe_account_id,
        metadata: {
          application_id: app.id as string,
          experiment_id:  experimentId,
          participant_id: app.participant_id as string,
        },
      });

      await supabase.from('applications').update({
        stripe_transfer_id:  transfer.id,
        payout_status:       'processing',
        payout_initiated_at: new Date().toISOString(),
        payout_fee_amount:   fee,
        payout_net_amount:   net,
      }).eq('id', app.id);

      initiated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      failures.push(`${app.id as string}: ${msg}`);
      await supabase.from('applications')
        .update({ payout_status: 'failed' })
        .eq('id', app.id);
    }
  }

  return NextResponse.json({
    initiated,
    missing,
    failed:       failures.length,
    total_amount: initiated * net,
    failures:     failures.length > 0 ? failures : undefined,
  });
}
