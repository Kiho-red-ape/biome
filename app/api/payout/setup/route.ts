import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// POST /api/payout/setup
// Initiates Stripe Connect onboarding for a participant.
// Stripe Connect integration is pending — returns a holding message for now.
export async function POST(req: NextRequest) {
  const body = await req.json() as { privyDid?: string };
  const { privyDid } = body;

  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();

  const { data: pp } = await supabase
    .from('participant_profiles')
    .select('user_id, participant_id, stripe_account_id, stripe_onboarding_complete')
    .eq('user_id', privyDid)
    .single();

  if (!pp) return NextResponse.json({ error: 'Participant profile not found' }, { status: 404 });

  // Stripe Connect is not yet live — return informational response
  return NextResponse.json({
    pending: true,
    message: 'Stripe Connect onboarding is being set up. Check back soon.',
    stripeAccountId: pp.stripe_account_id ?? null,
    configured: pp.stripe_onboarding_complete ?? false,
  });
}
