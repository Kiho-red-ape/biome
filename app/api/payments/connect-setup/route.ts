import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// POST /api/payments/connect-setup
// Creates (or re-uses) a Stripe Connect Express account for the participant,
// then returns a hosted onboarding link.
export async function POST(req: NextRequest) {
  const body = await req.json() as { privyDid?: string };
  const { privyDid } = body;

  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();

  const { data: pp, error: ppErr } = await supabase
    .from('participant_profiles')
    .select('user_id, participant_id, stripe_account_id, stripe_onboarding_complete')
    .eq('user_id', privyDid)
    .single();

  if (ppErr || !pp) {
    return NextResponse.json({ error: 'Participant profile not found' }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', privyDid)
    .single();

  const email = profile?.email ?? `${pp.participant_id}@participants.biome.to`;

  let accountId = pp.stripe_account_id;

  // Create a Stripe Connect Express account if not yet created
  if (!accountId) {
    const account = await stripe.accounts.create({
      type:  'express',
      email,
      metadata: {
        participant_id: pp.participant_id,
        user_id:        privyDid,
      },
    });
    accountId = account.id;

    await supabase
      .from('participant_profiles')
      .update({ stripe_account_id: accountId })
      .eq('user_id', privyDid);
  }

  // Generate the hosted onboarding link
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://biome.to';

  const accountLink = await stripe.accountLinks.create({
    account:     accountId,
    refresh_url: `${baseUrl}/dashboard?stripe=refresh`,
    return_url:  `${baseUrl}/dashboard?stripe=complete`,
    type:        'account_onboarding',
  });

  return NextResponse.json({ onboardingUrl: accountLink.url, accountId });
}
