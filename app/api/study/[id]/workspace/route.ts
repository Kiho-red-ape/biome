// GET /api/study/[id]/workspace?privyDid=did:privy:xxx
// Returns a per-study workspace payload for the participant workspace page.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// ── Local shape types ────────────────────────────────────────────────────────

type ApplicationRow = {
  id: string;
  status: string;
  applied_at: string;
  eligibility_status: string | null;
  study_agreement_accepted_at: string | null;
  experiments: {
    id: string;
    title: string;
    category: string;
    bounty_per_participant: number;
    duration_weeks: number | null;
    compliance_threshold: number | null;
    commenced_at: string | null;
    status: string;
    description: string | null;
    region: string | null;
    is_remote: boolean | null;
  } | null;
};

type ParticipantMilestoneRaw = {
  id: string;
  status: string;
  completed_at: string | null;
  submitted_at: string | null;
  study_milestones: {
    id: string;
    week_number: number;
    title: string;
    description: string | null;
    milestone_type: string;
    sort_order: number;
  } | null;
};

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

type ExperimentUpdate = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

type SampleKit = {
  id: string;
  kit_type: string | null;
  ship_status: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  tracking_number_outbound: string | null;
  collection_status: string | null;
  collection_due_date: string | null;
  collected_at: string | null;
  return_status: string | null;
  return_shipped_at: string | null;
  received_at_lab_at: string | null;
  phlebotomy_status: string | null;
  phlebotomy_appointment_date: string | null;
  phlebotomy_partner: string | null;
  lab_partner_name: string | null;
  results_ready_at: string | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const privyDid = request.nextUrl.searchParams.get('privyDid');
  if (!privyDid) {
    return NextResponse.json({ error: 'privyDid required' }, { status: 400 });
  }

  const { id: experimentId } = await params;
  const db = createServiceClient();

  // ── 1. Fetch application + experiment in one query ─────────────────────────
  const { data: appRaw, error: appErr } = await db
    .from('applications')
    .select(
      'id, status, applied_at, eligibility_status, study_agreement_accepted_at, ' +
      'experiments(id, title, category, bounty_per_participant, duration_weeks, ' +
      'compliance_threshold, commenced_at, status, description, region, is_remote)',
    )
    .eq('participant_id', privyDid)
    .eq('experiment_id', experimentId)
    .maybeSingle();

  if (appErr) {
    return NextResponse.json({ error: appErr.message }, { status: 500 });
  }
  if (!appRaw) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const app = appRaw as unknown as ApplicationRow;
  const exp = app.experiments;
  if (!exp) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
  }

  // ── 2. Parallel queries ────────────────────────────────────────────────────
  const [milestonesRes, updatesRes, kitRes] = await Promise.all([
    db
      .from('participant_milestones')
      .select(
        'id, status, completed_at, submitted_at, ' +
        'study_milestones(id, week_number, title, description, milestone_type, sort_order)',
      )
      .eq('participant_id', privyDid)
      .eq('experiment_id', experimentId),
    db
      .from('experiment_updates')
      .select('id, title, content, created_at')
      .eq('experiment_id', experimentId)
      .order('created_at', { ascending: false })
      .limit(20),
    db
      .from('sample_kits')
      .select(
        'id, kit_type, ship_status, shipped_at, delivered_at, tracking_number_outbound, ' +
        'collection_status, collection_due_date, collected_at, return_status, return_shipped_at, ' +
        'received_at_lab_at, phlebotomy_status, phlebotomy_appointment_date, phlebotomy_partner, ' +
        'lab_partner_name, results_ready_at',
      )
      .eq('participant_id', privyDid)
      .eq('experiment_id', experimentId)
      .maybeSingle(),
  ]);

  // ── 3. Compute currentWeek ─────────────────────────────────────────────────
  const commenced = exp.commenced_at;
  const currentWeek = commenced
    ? Math.max(1, Math.ceil((Date.now() - new Date(commenced).getTime()) / (7 * 86_400_000)))
    : 1;

  // ── 4. Build milestones array ──────────────────────────────────────────────
  const milestonesRaw = (milestonesRes.data ?? []) as unknown as ParticipantMilestoneRaw[];
  const milestones: MRow[] = milestonesRaw
    .filter((r) => r.study_milestones !== null)
    .map((r) => ({
      id:                 r.id,
      study_milestone_id: r.study_milestones!.id,
      status:             r.status,
      completed_at:       r.completed_at,
      submitted_at:       r.submitted_at,
      week_number:        r.study_milestones!.week_number,
      title:              r.study_milestones!.title,
      description:        r.study_milestones!.description,
      milestone_type:     r.study_milestones!.milestone_type,
      sort_order:         r.study_milestones!.sort_order,
    }))
    .sort((a, b) => {
      if (a.week_number !== b.week_number) return a.week_number - b.week_number;
      return a.sort_order - b.sort_order;
    });

  // ── 5. Compute compliance score & payout eligibility ──────────────────────
  const completedCount = milestones.filter((m) =>
    ['submitted', 'completed', 'verified'].includes(m.status),
  ).length;
  const complianceScore =
    milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 100;
  const threshold = exp.compliance_threshold ?? 80;
  const payoutEligible = complianceScore >= threshold;

  // ── 6. Shape response ──────────────────────────────────────────────────────
  const updates = (updatesRes.data ?? []) as ExperimentUpdate[];
  const kit     = (kitRes.data ?? null) as SampleKit | null;

  return NextResponse.json({
    application: {
      id:                          app.id,
      status:                      app.status,
      applied_at:                  app.applied_at,
      eligibility_status:          app.eligibility_status,
      study_agreement_accepted_at: app.study_agreement_accepted_at,
    },
    experiment: {
      id:                    exp.id,
      title:                 exp.title,
      category:              exp.category,
      bounty_per_participant: exp.bounty_per_participant,
      duration_weeks:        exp.duration_weeks,
      compliance_threshold:  exp.compliance_threshold,
      commenced_at:          exp.commenced_at,
      status:                exp.status,
      description:           exp.description,
      region:                exp.region,
      is_remote:             exp.is_remote,
    },
    currentWeek,
    milestones,
    complianceScore,
    payoutEligible,
    updates,
    kit,
  });
}
