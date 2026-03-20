import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { PP } from '@/components/screening/screening-dashboard';

interface Props {
  params: Promise<{ id: string }>;
}

export type ComplianceMilestone = {
  id: string;
  study_milestone_id: string;
  status: string;
  completed_at: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  week_number: number;
  title: string;
  description: string | null;
  milestone_type: string;
  sort_order: number;
};

export type ComplianceParticipant = {
  applicationId: string;
  participantId: string;  // privy DID
  payoutStatus: string;
  violationFlagged: boolean;
  violationReason: string | null;
  overrideRequested: boolean;
  overrideReason: string | null;
  profile: PP | null;
  milestones: ComplianceMilestone[];
  complianceScore: number;
  payoutEligible: boolean;
};

export type PendingVerification = {
  id: string;             // participant_milestone.id
  applicationId: string;
  participantId: string;
  pseudonym: string;
  participantProfileId: string;
  milestoneTitle: string;
  weekNumber: number;
  submittedAt: string | null;
  milestoneType: string;
};

export type ComplianceData = {
  participants: ComplianceParticipant[];
  pendingVerifications: PendingVerification[];
  currentWeek: number;
  experiment: {
    id: string;
    compliance_threshold: number;
    commenced_at: string | null;
    duration_weeks: number | null;
    status: string;
    bounty_per_participant: number;
  };
};

// GET /api/experiments/[id]/compliance?privyDid=xxx
export async function GET(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) {
    return NextResponse.json({ error: 'privyDid required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Validate experimenter owns this experiment
  const { data: expRaw } = await supabase
    .from('experiments')
    .select('id, experimenter_id, compliance_threshold, commenced_at, duration_weeks, status, bounty_per_participant')
    .eq('id', id)
    .single();

  if (!expRaw) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const exp = expRaw as Record<string, unknown>;
  if ((exp.experimenter_id as string) !== privyDid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Enrolled / active / completed applications
  const { data: appsRaw } = await supabase
    .from('applications')
    .select('id, participant_id, status, payout_status, violation_flagged, violation_reason, override_requested, override_reason')
    .eq('experiment_id', id)
    .in('status', ['enrolled', 'active', 'completed']);

  const apps = (appsRaw ?? []) as Array<Record<string, unknown>>;

  if (apps.length === 0) {
    return NextResponse.json({
      participants: [],
      pendingVerifications: [],
      currentWeek: 0,
      experiment: {
        id:                    exp.id as string,
        compliance_threshold:  (exp.compliance_threshold as number) ?? 80,
        commenced_at:          exp.commenced_at as string | null,
        duration_weeks:        exp.duration_weeks as number | null,
        status:                exp.status as string,
        bounty_per_participant: exp.bounty_per_participant as number,
      },
    } satisfies ComplianceData);
  }

  const participantIds = apps.map((a) => a.participant_id as string);

  // Participant profiles
  const { data: profilesRaw } = await supabase
    .from('participant_profiles')
    .select(
      'user_id, participant_id, pseudonym, country, year_of_birth, ' +
      'sex_assigned_at_birth, gender_identity, smartphone_os, wearable_devices, ' +
      'internet_reliability, can_receive_kits, sample_comfort, language_fluency, ' +
      'weekly_availability_hours, previous_study_count, completion_rate, ' +
      'reliability_score, recent_interventions, washout_sensitive, onboarding_step, ' +
      'verification_status'
    )
    .in('user_id', participantIds);

  const profileMap = new Map<string, PP>();
  for (const p of (profilesRaw ?? []) as unknown as Array<Record<string, unknown>>) {
    profileMap.set(p.user_id as string, p as unknown as PP);
  }

  // All participant milestones for this experiment
  const { data: pmRaw } = await supabase
    .from('participant_milestones')
    .select(
      'id, participant_id, status, completed_at, submitted_at, verified_at, ' +
      'verified_by, rejection_reason, study_milestone_id, experiment_id, ' +
      'study_milestones(id, week_number, title, description, milestone_type, sort_order)'
    )
    .eq('experiment_id', id);

  const pmRows = (pmRaw ?? []) as unknown as Array<Record<string, unknown>>;

  // Group milestones by participant_id
  const milestonesByParticipant = new Map<string, ComplianceMilestone[]>();
  for (const pm of pmRows) {
    const sm = pm.study_milestones as Record<string, unknown> | null;
    if (!sm) continue;
    const pid = pm.participant_id as string;
    const row: ComplianceMilestone = {
      id:                 pm.id as string,
      study_milestone_id: pm.study_milestone_id as string,
      status:             pm.status as string,
      completed_at:       pm.completed_at as string | null,
      submitted_at:       pm.submitted_at as string | null,
      verified_at:        pm.verified_at as string | null,
      verified_by:        pm.verified_by as string | null,
      rejection_reason:   pm.rejection_reason as string | null,
      week_number:        sm.week_number as number,
      title:              sm.title as string,
      description:        sm.description as string | null,
      milestone_type:     sm.milestone_type as string,
      sort_order:         sm.sort_order as number,
    };
    if (!milestonesByParticipant.has(pid)) milestonesByParticipant.set(pid, []);
    milestonesByParticipant.get(pid)!.push(row);
  }

  const threshold = (exp.compliance_threshold as number) ?? 80;

  // Current week
  const commencedAt = exp.commenced_at as string | null;
  let currentWeek = 0;
  if (commencedAt) {
    const ms = Date.now() - new Date(commencedAt).getTime();
    currentWeek = Math.max(1, Math.ceil(ms / (7 * 86_400_000)));
  }

  // Build participants array
  const participants: ComplianceParticipant[] = apps.map((app) => {
    const pid       = app.participant_id as string;
    const milestones = (milestonesByParticipant.get(pid) ?? [])
      .sort((a, b) => a.week_number - b.week_number || a.sort_order - b.sort_order);

    const done    = milestones.filter((m) => ['submitted', 'completed', 'verified'].includes(m.status)).length;
    const missed  = milestones.filter((m) => ['missed', 'rejected'].includes(m.status)).length;
    const judged  = done + missed;
    const score   = judged > 0 ? Math.round((done / judged) * 100) : 100;

    return {
      applicationId:    app.id as string,
      participantId:    pid,
      payoutStatus:     (app.payout_status as string) ?? 'pending',
      violationFlagged: (app.violation_flagged as boolean) ?? false,
      violationReason:  (app.violation_reason as string | null) ?? null,
      overrideRequested: (app.override_requested as boolean) ?? false,
      overrideReason:   (app.override_reason as string | null) ?? null,
      profile:          profileMap.get(pid) ?? null,
      milestones,
      complianceScore:  score,
      payoutEligible:   score >= threshold,
    };
  });

  // Pending verifications queue (status = 'submitted'), newest first
  const pendingVerifications: PendingVerification[] = [];
  for (const app of apps) {
    const pid      = app.participant_id as string;
    const profile  = profileMap.get(pid);
    const milestones = milestonesByParticipant.get(pid) ?? [];
    for (const m of milestones) {
      if (m.status === 'submitted') {
        pendingVerifications.push({
          id:                   m.id,
          applicationId:        app.id as string,
          participantId:        pid,
          pseudonym:            profile?.pseudonym ?? pid,
          participantProfileId: profile?.participant_id ?? '',
          milestoneTitle:       m.title,
          weekNumber:           m.week_number,
          submittedAt:          m.submitted_at,
          milestoneType:        m.milestone_type,
        });
      }
    }
  }
  pendingVerifications.sort((a, b) =>
    (b.submittedAt ?? '').localeCompare(a.submittedAt ?? '')
  );

  return NextResponse.json({
    participants,
    pendingVerifications,
    currentWeek,
    experiment: {
      id:                    exp.id as string,
      compliance_threshold:  threshold,
      commenced_at:          commencedAt,
      duration_weeks:        exp.duration_weeks as number | null,
      status:                exp.status as string,
      bounty_per_participant: exp.bounty_per_participant as number,
    },
  } satisfies ComplianceData);
}
