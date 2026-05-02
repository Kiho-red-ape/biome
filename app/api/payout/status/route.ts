import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/payout/status?privyDid=...
// Returns Stripe Connect onboarding status for the participant.
export async function GET(req: NextRequest) {
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();

  const { data: pp } = await supabase
    .from('participant_profiles')
    .select('user_id, stripe_account_id, stripe_onboarding_complete')
    .eq('user_id', privyDid)
    .single();

  if (!pp) return NextResponse.json({ error: 'Participant profile not found' }, { status: 404 });

  return NextResponse.json({
    configured: pp.stripe_onboarding_complete ?? false,
    stripeAccountId: pp.stripe_account_id ?? null,
  });
}
