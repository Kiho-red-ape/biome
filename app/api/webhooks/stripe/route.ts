import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { headers } from 'next/headers';

// Disable body parsing — raw body required for Stripe signature verification
export const config = { api: { bodyParser: false } };

// POST /api/webhooks/stripe
// Handles Stripe webhook events. Verify the signature before processing.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) {
    return new NextResponse('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new NextResponse('Webhook signature verification failed', { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta    = session.metadata;

      if (meta?.type === 'launch_fee' && meta.experiment_id) {
        const recruitmentDays = Math.max(7, Math.min(365, Number(meta.recruitment_days ?? 30)));
        const now             = new Date();
        const deadline        = new Date(now.getTime() + recruitmentDays * 86_400_000);

        await supabase
          .from('experiments')
          .update({
            launch_fee_paid:          true,
            launch_fee_paid_at:       now.toISOString(),
            launch_fee_status:        'paid',
            publish_fee_status:       'paid',
            stripe_payment_intent_id: session.payment_intent as string,
            // Publish the study
            status:                   'recruiting',
            published_at:             now.toISOString(),
            application_deadline:     deadline.toISOString(),
            recruitment_window_days:  recruitmentDays,
          })
          .eq('id', meta.experiment_id);
      }

      if (meta?.type === 'bounty_deposit' && meta.experiment_id) {
        await supabase
          .from('experiments')
          .update({
            bounty_pool_deposited:          true,
            bounty_pool_deposited_at:       new Date().toISOString(),
            bounty_pool_payment_intent_id:  session.payment_intent as string,
          })
          .eq('id', meta.experiment_id);
      }
      break;
    }

    case 'transfer.created': {
      const transfer = event.data.object as Stripe.Transfer;
      const appId    = transfer.metadata?.application_id;
      if (appId) {
        await supabase
          .from('applications')
          .update({ payout_status: 'processing' })
          .eq('id', appId);
      }
      break;
    }

    case 'payout.paid': {
      // Stripe Connect payouts land in the connected account.
      // We match via stripe_transfer_id stored on applications.
      // Note: payout.paid fires on the connected account — requires Connect webhooks.
      // For now we handle transfer.paid which fires on the platform.
      break;
    }

    case 'transfer.paid': {
      const transfer = event.data.object as Stripe.Transfer;
      const appId    = transfer.metadata?.application_id;
      const userId   = transfer.metadata?.participant_id;
      const netCents = transfer.amount; // already net

      if (appId) {
        const now = new Date().toISOString();
        const net = netCents / 100;

        await supabase
          .from('applications')
          .update({
            payout_status:       'paid',
            payout_completed_at: now,
          })
          .eq('id', appId);

        if (userId && net > 0) {
          await supabase.rpc('increment_total_earned', {
            p_user_id: userId,
            p_amount:  net,
          });
        }
      }
      break;
    }

    case 'transfer.failed': {
      const transfer = event.data.object as Stripe.Transfer;
      const appId    = transfer.metadata?.application_id;
      if (appId) {
        await supabase
          .from('applications')
          .update({ payout_status: 'failed' })
          .eq('id', appId);
      }
      break;
    }

    default:
      // Unhandled event — acknowledge silently
      break;
  }

  return new NextResponse('OK', { status: 200 });
}
