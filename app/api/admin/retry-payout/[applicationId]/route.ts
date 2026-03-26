import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { addPaymentToBatch, createBatch, startBatchProcessing } from '@/lib/trolley';

async function verifyAdmin(privyDid: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', privyDid).single();
  return data?.is_admin === true;
}

interface Props { params: Promise<{ applicationId: string }> }

// POST /api/admin/retry-payout/[applicationId]
// Creates a new Trolley payment for a failed application
export async function POST(req: NextRequest, { params }: Props) {
  const { applicationId } = await params;
  const body = await req.json() as { privyDid?: string };
  const { privyDid } = body;

  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const isAdmin = await verifyAdmin(privyDid);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const supabase = createServiceClient();

  const { data: app } = await supabase
    .from('applications')
    .select('id, participant_id, experiment_id, payout_status, payout_net_amount, experiments(title, bounty_per_participant, experiment_code)')
    .eq('id', applicationId)
    .single();

  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

  if (!['failed', 'method_missing'].includes(app.payout_status as string)) {
    return NextResponse.json({ error: `Cannot retry payout with status: ${app.payout_status as string}` }, { status: 400 });
  }

  const { data: pp } = await supabase
    .from('participant_profiles')
    .select('trolley_recipient_id, payout_method_configured')
    .eq('user_id', app.participant_id as string)
    .single();

  if (!pp?.trolley_recipient_id || !pp.payout_method_configured) {
    return NextResponse.json({ error: 'Participant has not set up payout method' }, { status: 400 });
  }

  const exp  = app.experiments as { title?: string; bounty_per_participant?: number; experiment_code?: string } | null;
  const gross = Number(exp?.bounty_per_participant ?? app.payout_net_amount ?? 0);
  const fee   = gross * 0.005;
  const net   = parseFloat((gross - fee).toFixed(2));

  try {
    const batchId   = await createBatch(`BIOME Retry ${exp?.experiment_code ?? app.experiment_id as string}`);
    const paymentId = await addPaymentToBatch(batchId, {
      recipientId: pp.trolley_recipient_id,
      amount:      net,
      memo:        `BIOME Retry: ${exp?.title ?? 'Study'}`,
    });

    await startBatchProcessing(batchId);

    await supabase.from('applications').update({
      trolley_payment_id:  paymentId,
      trolley_batch_id:    batchId,
      payout_status:       'processing',
      payout_initiated_at: new Date().toISOString(),
      payout_net_amount:   net,
      payout_fee_amount:   fee,
    }).eq('id', applicationId);

    return NextResponse.json({ ok: true, paymentId, batchId, netAmount: net });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create payment';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
