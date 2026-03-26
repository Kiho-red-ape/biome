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
  'sex_assigned_at_birth, payout_method_configured, payout_method_type';

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
    return NextResponse.json({ profile: null, applications: [], activeStudies: [] });
  }
  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  type AppRow = {
    id: string;
    status: string;
    applied_at: string;
    approved_at: string | null;
    completed_at: string | null;
    payout_status: string;
    eligibility_status?: string | null;
    experiments: {
      id: string; title: string; category: string;
      bounty_per_participant: number; status: string;
      compliance_threshold: number | null; duration_weeks: number | null;
      is_remote: boolean | null; region: string | null;
    } | null;
  };

  // Applications with richer experiment details (include compliance + duration for all apps)
  const { data: appsRaw, error: appsErr } = await supabase
    .from('applications')
    .select(
      'id, status, applied_at, approved_at, completed_at, payout_status, ' +
      'trolley_payment_id, payout_initiated_at, payout_completed_at, payout_net_amount, ' +
      'experiments(id, title, category, bounty_per_participant, status, compliance_threshold, duration_weeks, is_remote, region)'
    )
    .eq('participant_id', privyDid)
    .order('applied_at', { ascending: false });

  if (appsErr) {
    return NextResponse.json({ error: appsErr.message }, { status: 500 });
  }

  const apps = (appsRaw ?? []) as unknown as AppRow[];

  // ── Active / enrolled studies with milestone detail ────────────────────────
  const enrolledStatuses = ['enrolled', 'active', 'completed'];
  const enrolledIds = apps
    .filter((a) => enrolledStatuses.includes(a.status))
    .map((a) => a.id);

  let activeStudies: unknown[] = [];

  if (enrolledIds.length > 0) {
    // Richer experiment data for enrolled apps
    const { data: richAppsRaw } = await supabase
      .from('applications')
      .select(
        'id, status, experiment_id, ' +
        'experiments(id, title, category, bounty_per_participant, duration_weeks, ' +
        '            compliance_threshold, commenced_at, status)'
      )
      .in('id', enrolledIds)
      .eq('participant_id', privyDid);

    const richApps = (richAppsRaw ?? []) as unknown as Array<Record<string, unknown>>;

    const expIds = richApps
      .map((a) => {
        const exp = a.experiments as { id?: string } | null;
        return exp?.id;
      })
      .filter((id): id is string => !!id);

    // Participant milestones joined to study milestone metadata
    const { data: pmRowsRaw } = expIds.length > 0
      ? await supabase
          .from('participant_milestones')
          .select(
            'id, status, completed_at, submitted_at, study_milestone_id, experiment_id, ' +
            'study_milestones(id, week_number, title, description, milestone_type, sort_order)'
          )
          .eq('participant_id', privyDid)
          .in('experiment_id', expIds)
      : { data: [] as unknown[] };

    const pmRows = (pmRowsRaw ?? []) as unknown as Array<Record<string, unknown>>;

    // Group milestones by experiment_id
    type MRow = {
      id: string;
      study_milestone_id: string;
      status: string;
      completed_at: string | null;
      submitted_at: string | null;
      week_number: number;
      title: string;
      description: string | null;
      milestone_type: string;
      sort_order: number;
    };

    const milestonesByExp = new Map<string, MRow[]>();
    for (const p of pmRows) {
      const sm = p.study_milestones as Record<string, unknown> | null;
      if (!sm) continue;
      const expId = p.experiment_id as string;
      const row: MRow = {
        id:                 p.id as string,
        study_milestone_id: p.study_milestone_id as string,
        status:             p.status as string,
        completed_at:       p.completed_at as string | null,
        submitted_at:       p.submitted_at as string | null,
        week_number:        sm.week_number as number,
        title:              sm.title as string,
        description:        sm.description as string | null,
        milestone_type:     sm.milestone_type as string,
        sort_order:         sm.sort_order as number,
      };
      if (!milestonesByExp.has(expId)) milestonesByExp.set(expId, []);
      milestonesByExp.get(expId)!.push(row);
    }

    activeStudies = richApps.map((app) => {
      const exp = app.experiments as Record<string, unknown> | null;
      if (!exp) return null;

      const expId     = exp.id as string;
      const milestones = (milestonesByExp.get(expId) ?? [])
        .sort((x, y) => x.week_number - y.week_number || x.sort_order - y.sort_order);

      const completed = milestones.filter((m) => ['submitted', 'completed', 'verified'].includes(m.status)).length;
      const missed    = milestones.filter((m) => ['missed', 'rejected'].includes(m.status)).length;
      const judged    = completed + missed;
      const score     = judged > 0 ? Math.round((completed / judged) * 100) : 100;
      const threshold = (exp.compliance_threshold as number | null) ?? 80;

      const commencedAt = exp.commenced_at as string | null;
      let currentWeek = 0;
      if (commencedAt) {
        const msElapsed = Date.now() - new Date(commencedAt).getTime();
        currentWeek = Math.max(1, Math.ceil(msElapsed / (7 * 86_400_000)));
      }

      return {
        applicationId:     app.id as string,
        applicationStatus: app.status as string,
        experiment: {
          id:                    expId,
          title:                 exp.title as string,
          category:              exp.category as string,
          bounty_per_participant: exp.bounty_per_participant as number,
          duration_weeks:        exp.duration_weeks as number | null,
          compliance_threshold:  threshold,
          commenced_at:          commencedAt,
          status:                exp.status as string,
        },
        currentWeek,
        milestones,
        complianceScore: score,
        payoutEligible:  score >= threshold,
      };
    }).filter(Boolean);
  }

  const p = profile as (typeof profile & { payout_method_configured?: boolean; payout_method_type?: string | null }) | null;

  return NextResponse.json({
    profile,
    applications: apps ?? [],
    activeStudies,
    payoutMethodConfigured: p?.payout_method_configured ?? false,
    payoutMethodType:       p?.payout_method_type ?? null,
  });
}
