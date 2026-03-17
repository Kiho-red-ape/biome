import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { ParticipantProfile } from '@/lib/types';
import { z } from 'zod';

// Fields returned publicly — never includes device_fingerprint, duplicate_score, flagged, phone_number
const PUBLIC_COLUMNS =
  'id, user_id, participant_id, pseudonym, email_verified, phone_verified, country, ' +
  'payout_country, payout_currency, verification_status, year_of_birth, sex_assigned_at_birth, ' +
  'gender_identity, ethnicity, nationality, state_region, urbanicity, smartphone_os, ' +
  'wearable_devices, internet_reliability, can_receive_kits, sample_comfort, language_fluency, ' +
  'weekly_availability_hours, previous_study_count, recent_interventions, washout_sensitive, ' +
  'completion_rate, dropout_count, no_show_count, onboarding_step, created_at, updated_at';

const createSchema = z.object({
  privyDid:          z.string().min(1),
  country:           z.string().min(1),
  phoneNumber:       z.string().nullable().optional(),
  phoneVerified:     z.boolean().default(false),
  emailVerified:     z.boolean().default(false),
  deviceFingerprint: z.string().nullable().optional(),
  termsAccepted:     z.literal(true),
});

// ─── GET /api/participant-profile?privyDid=did:privy:xxx ─────────────────────
// Returns the participant's own profile (no sensitive fields).
export async function GET(request: NextRequest) {
  const privyDid = request.nextUrl.searchParams.get('privyDid');
  if (!privyDid) {
    return NextResponse.json({ error: 'privyDid required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('participant_profiles')
    .select(PUBLIC_COLUMNS)
    .eq('user_id', privyDid)
    .single();

  if (error && error.code === 'PGRST116') {
    return NextResponse.json({ profile: null });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data as ParticipantProfile });
}

// ─── POST /api/participant-profile ────────────────────────────────────────────
// Creates a participant_profiles row (Step 1 of participant onboarding).
// DB trigger auto-generates participant_id and pseudonym — never pass them here.
export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { privyDid, country, phoneNumber, phoneVerified, emailVerified, deviceFingerprint } =
    parsed.data;

  const supabase = createServiceClient();

  // Guard: don't create duplicate rows
  const { data: existing } = await supabase
    .from('participant_profiles')
    .select('id')
    .eq('user_id', privyDid)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Profile already exists' }, { status: 409 });
  }

  // ── Silent anti-fraud checks ──────────────────────────────────────────────
  let duplicateScore = 0;

  if (phoneNumber) {
    const { data: phoneMatches } = await supabase
      .from('participant_profiles')
      .select('id')
      .eq('phone_number', phoneNumber);

    if (phoneMatches && phoneMatches.length > 0) {
      duplicateScore = Math.min(1, duplicateScore + 0.5);
      await supabase
        .from('participant_profiles')
        .update({ flagged: true, duplicate_score: 0.5 })
        .in('id', phoneMatches.map((p: { id: string }) => p.id));
    }
  }

  if (deviceFingerprint) {
    const { data: deviceMatches } = await supabase
      .from('participant_profiles')
      .select('id, country')
      .eq('device_fingerprint', deviceFingerprint);

    if (deviceMatches && deviceMatches.length > 0) {
      const sameCountry = deviceMatches.filter(
        (p: { id: string; country: string }) => p.country === country
      );
      if (sameCountry.length > 0) {
        duplicateScore = Math.min(1, duplicateScore + 0.5);
        await supabase
          .from('participant_profiles')
          .update({ flagged: true })
          .in('id', sameCountry.map((p: { id: string }) => p.id));
      }
    }
  }

  const shouldFlag = duplicateScore >= 0.5;

  // Derive verification status from what Privy has confirmed
  let verificationStatus: 'pending' | 'email_verified' | 'phone_verified' | 'fully_verified' =
    'pending';
  if (emailVerified && phoneVerified) verificationStatus = 'fully_verified';
  else if (phoneVerified) verificationStatus = 'phone_verified';
  else if (emailVerified) verificationStatus = 'email_verified';

  // ── Insert — DB trigger sets participant_id and pseudonym ─────────────────
  const { data, error } = await supabase
    .from('participant_profiles')
    .insert({
      user_id:            privyDid,
      country,
      phone_number:       phoneNumber ?? null,
      phone_verified:     phoneVerified,
      email_verified:     emailVerified,
      device_fingerprint: deviceFingerprint ?? null,
      duplicate_score:    duplicateScore,
      flagged:            shouldFlag,
      verification_status: verificationStatus,
      onboarding_step:    1,
    })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data as ParticipantProfile }, { status: 201 });
}
