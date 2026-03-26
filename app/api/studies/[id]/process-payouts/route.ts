import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createBatch, addPaymentToBatch, startBatchProcessing } from '@/lib/trolley';

interface Props { params: Promise<{ id: string }> }

// POST /api/studies/[id]/process-payouts
export async function POST(req: NextRequest, { params }: Props) {
  const { id: experimentId } = await params;
  const body = await req.json() as { privyDid?: string };
  const { privyDid } = body;

  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();

  // Verify caller is experimenter or admin
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

  // Fetch participant payout details
  const participantIds = apps.map((a) => a.participant_id as string);
  const { data: ppRows } = await supabase
    .from('participant_profiles')
    .select('user_id, trolley_recipient_id, payout_method_configured')
    .in('user_id', participantIds);

  const ppMap = new Map((ppRows ?? []).map((p) => [p.user_id, p]));

  const gross      = Number(exp.bounty_per_participant);
  const fee        = gross * 0.005;
  const net        = parseFloat((gross - fee).toFixed(2));
  const description = `BIOME Study ${exp.experiment_code ?? experimentId} Payouts`;

  // Create Trolley batch
  let batchId: string;
  try {
    batchId = await createBatch(description);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create batch';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  let initiated = 0;
  let missing   = 0;
  const failures: string[] = [];

  for (const app of apps) {
    const pp = ppMap.get(app.participant_id as string);

    if (!pp?.trolley_recipient_id || !pp.payout_method_configured) {
      // Mark as needing payout method
      await supabase.from('applications')
        .update({ payout_status: 'method_missing' })
        .eq('id', app.id);
      missing++;
      continue;
    }

    try {
      const paymentId = await addPaymentToBatch(batchId, {
        recipientId: pp.trolley_recipient_id,
        amount:      net,
        memo:        `BIOME: ${exp.title}`,
      });

      await supabase.from('applications').update({
        trolley_payment_id:  paymentId,
        trolley_batch_id:    batchId,
        payout_status:       'processing',
        payout_initiated_at: new Date().toISOString(),
        payout_fee_amount:   fee,
        payout_net_amount:   net,
      }).eq('id', app.id);

      initiated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      failures.push(`${app.id}: ${msg}`);
      await supabase.from('applications')
        .update({ payout_status: 'failed' })
        .eq('id', app.id);
    }
  }

  // Start batch processing if any payments were added
  if (initiated > 0) {
    try {
      await startBatchProcessing(batchId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start batch';
      return NextResponse.json({
        batchId, paymentsInitiated: initiated, paymentsMissing: missing,
        totalAmount: initiated * net,
        warning: `Batch created but failed to start: ${msg}`,
      });
    }

    await supabase.from('experiments')
      .update({ escrow_status: 'partially_released' })
      .eq('id', experimentId);
  }

  return NextResponse.json({
    batchId,
    paymentsInitiated: initiated,
    paymentsMissing:   missing,
    paymentsFailed:    failures.length,
    totalAmount:       initiated * net,
    failures:          failures.length > 0 ? failures : undefined,
  });
}
