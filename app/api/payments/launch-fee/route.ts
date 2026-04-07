import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// POST /api/payments/launch-fee
// Creates a Stripe Checkout session for the $299 study launch fee.
// Pass recruitmentDays to carry through to the webhook so the study
// can be published automatically on payment confirmation.
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    experimentId?: string;
    privyDid?: string;
    recruitmentDays?: number;
  };
  const { experimentId, privyDid, recruitmentDays = 30 } = body;

  if (!experimentId || !privyDid) {
    return NextResponse.json({ error: 'experimentId and privyDid required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: exp } = await supabase
    .from('experiments')
    .select('id, title, experimenter_id, launch_fee_paid')
    .eq('id', experimentId)
    .single();

  if (!exp) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  if (exp.experimenter_id !== privyDid) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  if (exp.launch_fee_paid) {
    return NextResponse.json({ error: 'Launch fee already paid' }, { status: 400 });
  }

  const clampedDays = Math.max(7, Math.min(365, recruitmentDays));
  const baseUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://biome.to';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: 29900, // $299.00
          product_data: {
            name: 'BIOME Study Launch Fee',
            description: `Launch fee for study: ${exp.title}`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/dashboard/experiments/${experimentId}?launch_fee=success`,
    cancel_url:  `${baseUrl}/dashboard/experiments/${experimentId}?launch_fee=cancelled`,
    metadata: {
      experiment_id:       experimentId,
      type:                'launch_fee',
      recruitment_days:    String(clampedDays),
    },
  });

  return NextResponse.json({ url: session.url });
}
