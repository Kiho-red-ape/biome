import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/experiments/[id]/applications?privyDid=...
// Returns all applications for an experiment, with participant profile data.
// Only the experiment owner can call this.
export async function GET(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();

  // Verify ownership
  const { data: exp } = await supabase
    .from('experiments')
    .select('id, experimenter_id, title, category, inclusion_criteria, exclusion_criteria, is_remote, region')
    .eq('id', id)
    .single();

  if (!exp) return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
  if (exp.experimenter_id !== privyDid) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  // Fetch applications
  const { data: apps, error: appsErr } = await supabase
    .from('applications')
    .select('id, participant_id, status, applied_at, approved_at, payout_status')
    .eq('experiment_id', id)
    .order('applied_at', { ascending: true });

  if (appsErr) return NextResponse.json({ error: appsErr.message }, { status: 500 });
  if (!apps || apps.length === 0) return NextResponse.json({ applications: [], experiment: exp });

  const participantDids = apps.map((a) => a.participant_id as string);

  // Fetch participant profiles for all applicants
  const { data: ppRows } = await supabase
    .from('participant_profiles')
    .select(`
      user_id, participant_id, pseudonym, country, year_of_birth, sex_assigned_at_birth,
      gender_identity, smartphone_os, wearable_devices, internet_reliability,
      can_receive_kits, sample_comfort, language_fluency, weekly_availability_hours,
      previous_study_count, completion_rate, reliability_score, recent_interventions,
      washout_sensitive, onboarding_step, verification_status
    `)
    .in('user_id', participantDids);

  const ppMap: Record<string, typeof ppRows extends (infer T)[] | null ? T : never> = {};
  for (const pp of ppRows ?? []) {
    if (pp?.user_id) ppMap[pp.user_id] = pp;
  }

  // Fetch recent application history for each participant (last 5 completed/active)
  const { data: histRows } = await supabase
    .from('applications')
    .select('participant_id, status, applied_at, experiments(id, title, category)')
    .in('participant_id', participantDids)
    .in('status', ['completed', 'approved', 'active', 'rejected', 'withdrawn'])
    .neq('experiment_id', id)
    .order('applied_at', { ascending: false })
    .limit(participantDids.length * 5);

  // Group history by participant
  const histMap: Record<string, typeof histRows extends (infer T)[] | null ? T[] : never[]> = {};
  for (const h of histRows ?? []) {
    if (!h?.participant_id) continue;
    if (!histMap[h.participant_id]) histMap[h.participant_id] = [];
    if (histMap[h.participant_id].length < 5) histMap[h.participant_id].push(h);
  }

  const enrichedApps = apps.map((app) => ({
    ...app,
    participantProfile: ppMap[app.participant_id as string] ?? null,
    applicationHistory: histMap[app.participant_id as string] ?? [],
  }));

  return NextResponse.json({ applications: enrichedApps, experiment: exp });
}
