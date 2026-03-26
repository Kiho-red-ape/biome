import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createRecipient, generateOnboardingLink } from '@/lib/trolley';

// POST /api/payout/setup
// Creates a Trolley recipient for the participant (if not yet created),
// then returns a hosted onboarding link for them to configure their payout method.
export async function POST(req: NextRequest) {
  const body = await req.json() as { privyDid?: string };
  const { privyDid } = body;

  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();

  // Fetch participant profile
  const { data: pp, error: ppErr } = await supabase
    .from('participant_profiles')
    .select('user_id, participant_id, pseudonym, trolley_recipient_id')
    .eq('user_id', privyDid)
    .single();

  if (ppErr || !pp) {
    return NextResponse.json({ error: 'Participant profile not found' }, { status: 404 });
  }

  // Fetch their email from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, display_name')
    .eq('id', privyDid)
    .single();

  const email = profile?.email ?? `${pp.participant_id}@participants.biome.to`;
  const displayName = profile?.display_name ?? pp.pseudonym;
  const nameParts   = displayName.trim().split(' ');
  const firstName   = nameParts[0] ?? displayName;
  const lastName    = nameParts.slice(1).join(' ') || 'Participant';

  let recipientId = pp.trolley_recipient_id;

  // Create Trolley recipient if not yet done
  if (!recipientId) {
    try {
      const recipient = await createRecipient({
        email,
        firstName,
        lastName,
        referenceId: pp.participant_id,
      });
      recipientId = recipient.id;

      await supabase
        .from('participant_profiles')
        .update({ trolley_recipient_id: recipientId })
        .eq('user_id', privyDid);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create recipient';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // Generate hosted onboarding link
  const baseUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://biome-plum.vercel.app';
  const returnUrl = `${baseUrl}/dashboard?payout=configured`;

  try {
    const onboardingUrl = await generateOnboardingLink(recipientId, returnUrl);
    return NextResponse.json({ onboardingUrl, recipientId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate onboarding link';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
