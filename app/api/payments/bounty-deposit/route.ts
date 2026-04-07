import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// POST /api/payments/bounty-deposit
// Creates a Stripe Checkout session for the bounty pool deposit.
// Total = bounty_per_participant × approved_count × 1.025 (includes 2.5% platform fee).
export async function POST(req: NextRequest) {
  const body = await req.json() as { experimentId?: string; privyDid?: string };
  const { experimentId, privyDid } = body;

  if (!experimentId || !privyDid) {
    return NextResponse.json({ error: 'experimentId and privyDid required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: exp } = await supabase
    .from('experiments')
    .select('id, title, experimenter_id, bounty_per_participant, bounty_pool_deposited, launch_fee_paid')
    .eq('id', experimentId)
    .single();

  if (!exp) return NextResponse.json({ error: 'Study not found' }, { status: 404 });
  if (exp.experimenter_id !== privyDid) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  if (!exp.launch_fee_paid) {
    return NextResponse.json({ error: 'Study launch fee must be paid first' }, { status: 400 });
  }
  if (exp.bounty_pool_deposited) {
    return NextResponse.json({ error: 'Bounty pool already deposited' }, { status: 400 });
  }

  // Count approved participants
  const { count } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('experiment_id', experimentId)
    .in('status', ['approved', 'enrolled', 'completed']);

  const approvedCount = count ?? 0;
  if (approvedCount === 0) {
    return NextResponse.json({ error: 'No approved participants to fund' }, { status: 400 });
  }

  const bounty         = Number(exp.bounty_per_participant);
  const gross          = bounty * approvedCount;
  const platformFee    = gross * 0.025;
  const total          = gross + platformFee;
  const totalCents     = Math.round(total * 100);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://biome.to';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: totalCents,
          product_data: {
            name: 'BIOME Bounty Pool Deposit',
            description:
              `Payout pool for study: ${exp.title} — ` +
              `${approvedCount} participants × $${bounty.toFixed(2)} + 2.5% platform fee`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/dashboard/experiments/${experimentId}?bounty_deposit=success`,
    cancel_url:  `${baseUrl}/dashboard/experiments/${experimentId}?bounty_deposit=cancelled`,
    metadata: {
      experiment_id:          experimentId,
      type:                   'bounty_deposit',
      participant_count:      String(approvedCount),
      bounty_per_participant: String(bounty),
    },
  });

  return NextResponse.json({
    url:              session.url,
    approvedCount,
    bountyPerPart:    bounty,
    platformFee:      platformFee,
    total,
  });
}
