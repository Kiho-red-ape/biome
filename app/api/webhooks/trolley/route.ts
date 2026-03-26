import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// POST /api/webhooks/trolley
// Configure in Trolley dashboard: https://biome-plum.vercel.app/api/webhooks/trolley
export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const sigHeader = req.headers.get('x-pr-signature') ?? '';
  const secret   = process.env.TROLLEY_WEBHOOK_SECRET ?? '';

  // Verify HMAC-SHA256 signature
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (sigHeader !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  type WebhookPayload = {
    event: string;
    data?: {
      payment?: {
        id: string;
        status: string;
        targetAmount?: { value: string };
        recipient?: { id: string };
      };
    };
  };

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { event, data } = payload;
  const payment = data?.payment;

  if (!payment?.id) {
    // Unhandled event type — acknowledge silently
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceClient();

  // Find application by trolley_payment_id
  const { data: app } = await supabase
    .from('applications')
    .select('id, participant_id, experiment_id, payout_net_amount, experiments(title)')
    .eq('trolley_payment_id', payment.id)
    .maybeSingle();

  if (!app) {
    // Payment not in our system — still acknowledge
    return NextResponse.json({ ok: true });
  }

  if (event === 'payment.completed') {
    await supabase.from('applications').update({
      payout_status:        'paid',
      payout_completed_at:  new Date().toISOString(),
    }).eq('id', app.id);

    // Increment participant total_earned if column exists
    if (app.payout_net_amount) {
      await supabase.rpc('increment_total_earned', {
        p_user_id: app.participant_id,
        p_amount:  app.payout_net_amount,
      }).then(() => {/* non-fatal */});
    }
  }

  if (event === 'payment.failed' || event === 'payment.returned') {
    await supabase.from('applications').update({
      payout_status: 'failed',
    }).eq('id', app.id);
  }

  return NextResponse.json({ ok: true });
}
