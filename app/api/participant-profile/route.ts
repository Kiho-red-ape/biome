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
  privyDid:             z.string().min(1),
  country:              z.string().min(1),
  phoneNumber:          z.string().nullable().optional(),
  phoneVerified:        z.boolean().default(false),
  emailVerified:        z.boolean().default(false),
  deviceFingerprint:    z.string().nullable().optional(),
  termsAccepted:        z.literal(true),
  year_of_birth:        z.number().int().min(1920).max(2010).nullable().optional(),
  sex_assigned_at_birth: z.enum(['male', 'female', 'intersex', 'prefer_not_to_say']).nullable().optional(),
  study_alerts:         z.boolean().optional(),
  study_alerts_email:   z.string().email().nullable().optional(),
});

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

  return NextResponse.json({ profile: data as unknown as ParticipantProfile });
}

// DB trigger auto-generates participant_id and pseudonym on insert — never pass them here.
export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    privyDid, country, phoneNumber, phoneVerified, emailVerified, deviceFingerprint,
    year_of_birth, sex_assigned_at_birth, study_alerts, study_alerts_email,
  } = parsed.data;

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

  // Silent anti-fraud checks — run in parallel
  const [phoneScore, deviceScore] = await Promise.all([
    phoneNumber
      ? supabase.from('participant_profiles').select('id').eq('phone_number', phoneNumber).then(async ({ data }) => {
          if (data && data.length > 0) {
            await supabase.from('participant_profiles')
              .update({ flagged: true, duplicate_score: 0.5 })
              .in('id', data.map((p: { id: string }) => p.id));
            return 0.5;
          }
          return 0;
        })
      : Promise.resolve(0),
    deviceFingerprint
      ? supabase.from('participant_profiles').select('id, country').eq('device_fingerprint', deviceFingerprint).then(async ({ data }) => {
          if (data && data.length > 0) {
            const sameCountry = data.filter((p: { id: string; country: string }) => p.country === country);
            if (sameCountry.length > 0) {
              await supabase.from('participant_profiles').update({ flagged: true }).in('id', sameCountry.map((p: { id: string }) => p.id));
              return 0.5;
            }
          }
          return 0;
        })
      : Promise.resolve(0),
  ]);

  const duplicateScore = Math.min(1, phoneScore + deviceScore);
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
      user_id:               privyDid,
      country,
      phone_number:          phoneNumber ?? null,
      phone_verified:        phoneVerified,
      email_verified:        emailVerified,
      device_fingerprint:    deviceFingerprint ?? null,
      duplicate_score:       duplicateScore,
      flagged:               shouldFlag,
      verification_status:   verificationStatus,
      onboarding_step:       1,
      year_of_birth:         year_of_birth ?? null,
      sex_assigned_at_birth: sex_assigned_at_birth ?? null,
    })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (study_alerts && study_alerts_email) {
    const { error: prefErr } = await supabase
      .from('notification_preferences')
      .upsert(
        { user_id: privyDid, email: study_alerts_email, study_alerts: true },
        { onConflict: 'user_id' }
      );
    if (prefErr) console.error('[participant-profile] notification_preferences upsert failed:', prefErr.message);
  }

  return NextResponse.json({ profile: data as unknown as ParticipantProfile }, { status: 201 });
}

// Immutable fields (year_of_birth, sex, ethnicity, nationality) are locked after first set.

const step2Schema = z.object({
  privyDid:             z.string().min(1),
  step:                 z.literal(2),
  year_of_birth:        z.number().int().min(1920).max(2010).nullable().optional(),
  sex_assigned_at_birth: z.enum(['male', 'female', 'intersex', 'prefer_not_to_say']).nullable().optional(),
  gender_identity:      z.string().max(64).nullable().optional(),
  ethnicity:            z.string().max(64).nullable().optional(),
  nationality:          z.string().max(64).nullable().optional(),
  state_region:         z.string().max(64).nullable().optional(),
  urbanicity:           z.enum(['urban', 'suburban', 'rural']).nullable().optional(),
});

const step3Schema = z.object({
  privyDid:               z.string().min(1),
  step:                   z.literal(3),
  smartphone_os:          z.enum(['ios', 'android', 'both', 'none']).nullable().optional(),
  wearable_devices:       z.array(z.string()).nullable().optional(),
  internet_reliability:   z.enum(['stable', 'intermittent', 'limited']).nullable().optional(),
  can_receive_kits:       z.boolean().nullable().optional(),
  sample_comfort:         z.array(z.string()).nullable().optional(),
  language_fluency:       z.array(z.string()).nullable().optional(),
  weekly_availability_hours: z.number().min(0).max(168).nullable().optional(),
});

const step4Schema = z.object({
  privyDid:              z.string().min(1),
  step:                  z.literal(4),
  previous_study_count:  z.number().int().min(0).optional(),
  recent_interventions:  z.string().nullable().optional(),
  washout_sensitive:     z.boolean().optional(),
});

const patchSchema = z.union([step2Schema, step3Schema, step4Schema]);

export async function PATCH(request: NextRequest) {
  const body: unknown = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { privyDid, step } = parsed.data;
  const supabase = createServiceClient();

  // Fetch existing profile to verify ownership and check immutability
  const { data: existing, error: fetchErr } = await supabase
    .from('participant_profiles')
    .select('id, onboarding_step, year_of_birth, sex_assigned_at_birth, ethnicity, nationality')
    .eq('user_id', privyDid)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Build update payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    onboarding_step: Math.max((existing.onboarding_step as number) ?? 1, step),
  };

  if (step === 2) {
    const d = parsed.data as z.infer<typeof step2Schema>;
    // Immutable fields: only set if not already stored
    if (d.year_of_birth         !== undefined && !existing.year_of_birth)         updates.year_of_birth         = d.year_of_birth;
    if (d.sex_assigned_at_birth !== undefined && !existing.sex_assigned_at_birth) updates.sex_assigned_at_birth = d.sex_assigned_at_birth;
    if (d.ethnicity             !== undefined && !existing.ethnicity)             updates.ethnicity             = d.ethnicity;
    if (d.nationality           !== undefined && !existing.nationality)           updates.nationality           = d.nationality;
    // Mutable fields
    if (d.gender_identity !== undefined) updates.gender_identity = d.gender_identity;
    if (d.state_region    !== undefined) updates.state_region    = d.state_region;
    if (d.urbanicity      !== undefined) updates.urbanicity      = d.urbanicity;
  } else if (step === 3) {
    const d = parsed.data as z.infer<typeof step3Schema>;
    if (d.smartphone_os               !== undefined) updates.smartphone_os               = d.smartphone_os;
    if (d.wearable_devices            !== undefined) updates.wearable_devices            = d.wearable_devices;
    if (d.internet_reliability        !== undefined) updates.internet_reliability        = d.internet_reliability;
    if (d.can_receive_kits            !== undefined) updates.can_receive_kits            = d.can_receive_kits;
    if (d.sample_comfort              !== undefined) updates.sample_comfort              = d.sample_comfort;
    if (d.language_fluency            !== undefined) updates.language_fluency            = d.language_fluency;
    if (d.weekly_availability_hours   !== undefined) updates.weekly_availability_hours   = d.weekly_availability_hours;
  } else {
    const d = parsed.data as z.infer<typeof step4Schema>;
    if (d.previous_study_count !== undefined) updates.previous_study_count = d.previous_study_count;
    if (d.recent_interventions !== undefined) updates.recent_interventions = d.recent_interventions;
    if (d.washout_sensitive    !== undefined) updates.washout_sensitive    = d.washout_sensitive;
  }

  const { data, error } = await supabase
    .from('participant_profiles')
    .update(updates)
    .eq('user_id', privyDid)
    .select(PUBLIC_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data as unknown as ParticipantProfile });
}
