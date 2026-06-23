// GET /api/dashboard/tasks?privyDid=did:privy:xxx
// Aggregates the pending actions a participant must take across all of their
// enrolled studies into a single "Needs Your Attention" feed. Read-only; mirrors
// the batched Promise.all pattern used by /api/ops/dashboard-stats.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { type TaskItem, type TaskKind, URGENCY_RANK, urgencyFromDue } from '@/lib/dashboard/tasks';

const ENROLLED = ['approved', 'active', 'completed', 'enrolled'];

export async function GET(request: NextRequest) {
  const privyDid = request.nextUrl.searchParams.get('privyDid');
  if (!privyDid) {
    return NextResponse.json({ error: 'privyDid required' }, { status: 400 });
  }

  const db = createServiceClient();

  // ── Applications (enrolled-ish) + their experiments ──────────────────────────
  type AppRow = {
    id: string;
    status: string;
    experiment_id: string;
    eligibility_status: string | null;
    study_agreement_accepted_at: string | null;
    experiments: { id: string; title: string; commenced_at: string | null } | null;
  };

  const { data: appsRaw, error: appsErr } = await db
    .from('applications')
    .select('id, status, experiment_id, eligibility_status, study_agreement_accepted_at, ' +
            'experiments(id, title, commenced_at)')
    .eq('participant_id', privyDid)
    .in('status', ENROLLED);

  if (appsErr) return NextResponse.json({ error: appsErr.message }, { status: 500 });

  const apps = (appsRaw ?? []) as unknown as AppRow[];
  if (apps.length === 0) return NextResponse.json({ tasks: [] });

  const expIds  = [...new Set(apps.map((a) => a.experiment_id))];
  const appIds  = apps.map((a) => a.id);
  const titleByExp = new Map<string, string>();
  for (const a of apps) if (a.experiments) titleByExp.set(a.experiments.id, a.experiments.title);
  const studyTitle = (expId: string) => titleByExp.get(expId) ?? 'Study';

  // ── Parallel source queries ──────────────────────────────────────────────────
  const [
    profileRes,
    docsRes,
    kitsRes,
    disputesRes,
    milestonesRes,
    mapRes,
  ] = await Promise.all([
    db.from('participant_profiles')
      .select('stripe_onboarding_complete')
      .eq('user_id', privyDid)
      .maybeSingle(),
    db.from('study_documents')
      .select('id, experiment_id, title, signature_due_date, document_signatures(signer_user_id)')
      .in('experiment_id', expIds)
      .eq('clearance_level', 'participant')
      .eq('requires_signature', true)
      .in('status', ['pending_signature', 'approved', 'signed']),
    db.from('sample_kits')
      .select('id, experiment_id, collection_status, collection_due_date, collected_at, ' +
              'return_status, phlebotomy_status, phlebotomy_appointment_date')
      .eq('participant_id', privyDid)
      .in('experiment_id', expIds),
    db.from('disputes')
      .select('id, experiment_id, subject, status')
      .eq('raised_by', privyDid)
      .in('status', ['open', 'under_review']),
    db.from('participant_milestones')
      .select('id, experiment_id, status, study_milestones(week_number, title, milestone_type)')
      .eq('participant_id', privyDid)
      .eq('status', 'pending')
      .in('experiment_id', expIds),
    db.from('study_participant_map')
      .select('experiment_id, study_participant_id')
      .in('application_id', appIds),
  ]);

  const tasks: TaskItem[] = [];
  const push = (
    kind: TaskKind, sourceId: string, label: string,
    studyId: string, dueDate: string | null, href: string,
  ) => {
    tasks.push({
      id: `${kind}:${sourceId}`,
      kind, label, studyId, studyTitle: studyTitle(studyId),
      urgency: urgencyFromDue(dueDate), dueDate, href,
    });
  };

  // 1. Sign documents — participant-clearance, requires signature, not yet signed by me.
  type DocRow = {
    id: string; experiment_id: string; title: string;
    signature_due_date: string | null;
    document_signatures: { signer_user_id: string }[] | null;
  };
  for (const d of ((docsRes.data ?? []) as unknown as DocRow[])) {
    const signed = (d.document_signatures ?? []).some((s) => s.signer_user_id === privyDid);
    if (signed) continue;
    push('sign_document', d.id, `Sign “${d.title}”`, d.experiment_id,
         d.signature_due_date, `/experiments/${d.experiment_id}`);
  }

  // 2/3. Accept agreement & eligibility — derived from the apps we already have.
  for (const a of apps) {
    if (a.status === 'approved' && !a.study_agreement_accepted_at) {
      push('accept_agreement', a.id, 'Accept study agreement', a.experiment_id, null,
           `/experiments/${a.experiment_id}`);
    }
    if (a.eligibility_status === null) {
      push('eligibility_quiz', a.id, 'Complete pre-study eligibility form', a.experiment_id, null,
           `/experiments/${a.experiment_id}`);
    }
  }

  // 4. Self-report milestones due this/past week.
  type MRow = {
    id: string; experiment_id: string;
    study_milestones: { week_number: number; title: string; milestone_type: string } | null;
  };
  const currentWeekByExp = new Map<string, number>();
  for (const a of apps) {
    const commenced = a.experiments?.commenced_at;
    if (commenced) {
      const wk = Math.max(1, Math.ceil((Date.now() - new Date(commenced).getTime()) / (7 * 86_400_000)));
      currentWeekByExp.set(a.experiment_id, wk);
    }
  }
  for (const m of ((milestonesRes.data ?? []) as unknown as MRow[])) {
    const sm = m.study_milestones;
    if (!sm || sm.milestone_type !== 'self_report') continue;
    const currentWeek = currentWeekByExp.get(m.experiment_id);
    if (currentWeek == null || sm.week_number > currentWeek) continue; // not due yet
    const overdue = sm.week_number < currentWeek;
    tasks.push({
      id: `self_report:${m.id}`,
      kind: 'self_report',
      label: `Submit “${sm.title}”`,
      studyId: m.experiment_id,
      studyTitle: studyTitle(m.experiment_id),
      urgency: overdue ? 'overdue' : 'due_soon',
      dueDate: null,
      href: `/experiments/${m.experiment_id}`,
    });
  }

  // 5/6/7. Sample-kit tasks — branch per kit row.
  type KitRow = {
    id: string; experiment_id: string;
    collection_status: string; collection_due_date: string | null; collected_at: string | null;
    return_status: string; phlebotomy_status: string | null; phlebotomy_appointment_date: string | null;
  };
  for (const k of ((kitsRes.data ?? []) as unknown as KitRow[])) {
    const href = `/experiments/${k.experiment_id}`;
    if (k.collection_status === 'awaiting' && k.collection_due_date) {
      push('collect_sample', k.id, 'Collect your sample', k.experiment_id, k.collection_due_date, href);
    }
    if (k.collection_status === 'collected' && k.return_status === 'not_started') {
      push('ship_sample', k.id, 'Ship your sample back', k.experiment_id, null, href);
    }
    if (k.phlebotomy_status === 'scheduled' && k.phlebotomy_appointment_date) {
      const due = urgencyFromDue(k.phlebotomy_appointment_date, 2);
      tasks.push({
        id: `phlebotomy:${k.id}`,
        kind: 'phlebotomy',
        label: 'Attend phlebotomy appointment',
        studyId: k.experiment_id,
        studyTitle: studyTitle(k.experiment_id),
        urgency: due,
        dueDate: k.phlebotomy_appointment_date,
        href,
      });
    }
  }

  // 8. Unread researcher messages → resolve this participant's per-study ids first.
  const studyIds = ((mapRes.data ?? []) as { study_participant_id: string }[])
    .map((r) => r.study_participant_id);
  if (studyIds.length > 0) {
    const { data: msgRows } = await db
      .from('study_messages')
      .select('id, experiment_id')
      .eq('sender_type', 'researcher')
      .is('read_at', null)
      .in('recipient_study_participant_id', studyIds);
    // De-dupe to one "reply" task per study.
    const seen = new Set<string>();
    for (const msg of ((msgRows ?? []) as { id: string; experiment_id: string }[])) {
      if (seen.has(msg.experiment_id)) continue;
      seen.add(msg.experiment_id);
      push('reply_message', msg.experiment_id, 'New message from the research team',
           msg.experiment_id, null, `/experiments/${msg.experiment_id}`);
    }
  }

  // 9. Configure payout — once, if any enrolled app and onboarding incomplete.
  const stripeDone = (profileRes.data as { stripe_onboarding_complete?: boolean } | null)
    ?.stripe_onboarding_complete ?? false;
  if (!stripeDone) {
    const first = apps[0];
    tasks.push({
      id: 'configure_payout:self',
      kind: 'configure_payout',
      label: 'Set up your payout method',
      studyId: first.experiment_id,
      studyTitle: studyTitle(first.experiment_id),
      urgency: 'due_soon',
      dueDate: null,
      href: '/dashboard#compensation',
    });
  }

  // 10. Open disputes.
  for (const d of ((disputesRes.data ?? []) as { id: string; experiment_id: string; subject: string }[])) {
    push('resolve_dispute', d.id, `Dispute: ${d.subject}`, d.experiment_id, null, `/disputes/${d.id}`);
  }

  // Sort: urgency, then earliest due date.
  tasks.sort((a, b) => {
    const u = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
    if (u !== 0) return u;
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return ad - bd;
  });

  return NextResponse.json({ tasks });
}
