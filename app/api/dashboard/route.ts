import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const PROFILE_COLS =
  'participant_id, pseudonym, country, year_of_birth, completion_rate, ' +
  'reliability_score, previous_study_count, onboarding_step, created_at, ' +
  'updated_at, verification_status, phone_verified, email_verified, ' +
  'smartphone_os, wearable_devices, internet_reliability, can_receive_kits, ' +
  'sample_comfort, language_fluency, weekly_availability_hours, ' +
  'recent_interventions, washout_sensitive, dropout_count, no_show_count, ' +
  'nationality, state_region, urbanicity, ethnicity, gender_identity, ' +
  'sex_assigned_at_birth';

// GET /api/dashboard?privyDid=did:privy:xxx
export async function GET(request: NextRequest) {
  const privyDid = request.nextUrl.searchParams.get('privyDid');
  if (!privyDid) {
    return NextResponse.json({ error: 'privyDid required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Profile
  const { data: profile, error: profileErr } = await supabase
    .from('participant_profiles')
    .select(PROFILE_COLS)
    .eq('user_id', privyDid)
    .single();

  if (profileErr && profileErr.code === 'PGRST116') {
    return NextResponse.json({ profile: null, applications: [] });
  }
  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // Applications with experiment details
  const { data: apps, error: appsErr } = await supabase
    .from('applications')
    .select(
      'id, status, applied_at, approved_at, completed_at, payout_status, ' +
      'experiments(id, title, category, bounty_per_participant, status)'
    )
    .eq('participant_id', privyDid)
    .order('applied_at', { ascending: false });

  if (appsErr) {
    return NextResponse.json({ error: appsErr.message }, { status: 500 });
  }

  return NextResponse.json({ profile, applications: apps ?? [] });
}
