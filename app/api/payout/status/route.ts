import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// GET /api/payout/status?privyDid=...
// Called when participant returns from Stripe Connect onboarding.
// Checks Stripe account status and syncs stripe_onboarding_complete to DB.
export async function GET(req: NextRequest) {
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();

  const { data: pp } = await supabase
    .from('participant_profiles')
    .select('user_id, stripe_account_id, stripe_onboarding_complete, payout_method_configured')
    .eq('user_id', privyDid)
    .single();

  if (!pp) return NextResponse.json({ error: 'Participant profile not found' }, { status: 404 });

  if (!pp.stripe_account_id) {
    return NextResponse.json({ configured: false, accountId: null });
  }

  try {
    const account = await stripe.accounts.retrieve(pp.stripe_account_id);
    const complete = account.details_submitted === true;

    // Sync to DB if status changed
    if (complete !== pp.stripe_onboarding_complete || complete !== pp.payout_method_configured) {
      await supabase
        .from('participant_profiles')
        .update({
          stripe_onboarding_complete: complete,
          payout_method_configured:   complete,
        })
        .eq('user_id', privyDid);
    }

    return NextResponse.json({
      configured:   complete,
      accountId:    pp.stripe_account_id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch account status';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
