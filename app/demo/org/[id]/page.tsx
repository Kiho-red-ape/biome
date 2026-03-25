import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAnonClient } from '@/lib/supabase/anon';
import { SiteHeader } from '@/components/nav/header';
import { DemoOrgClient } from './demo-org-client';
import type { DemoExperiment } from './demo-org-client';
import type { ApplicantRow } from '@/components/screening/screening-dashboard';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DemoOrgPage({ params }: { params: { id: string } }) {
  const supabase = createAnonClient();

  // 1. Fetch experimenter profile by UUID id
  const { data: org } = await supabase
    .from('experimenter_profiles')
    .select('id, user_id, org_name, org_description, expertise_areas, verified_experiments, experiments_posted, screening_status')
    .eq('id', params.id)
    .single();

  if (!org || org.screening_status !== 'approved') notFound();

  // 2. Fetch all experiments for this org
  const { data: rawExps } = await supabase
    .from('experiments')
    .select('id, title, category, status, bounty_per_participant, total_bounty_pool, slots_total, slots_filled, duration_weeks, is_remote, region, is_verified, verification_level, inclusion_criteria, exclusion_criteria, created_at')
    .eq('experimenter_id', org.user_id)
    .order('created_at', { ascending: false });

  const experiments = (rawExps ?? []) as DemoExperiment[];

  // 3. For recruiting + active experiments, fetch applications + participant profiles
  const interactiveIds = experiments
    .filter((e) => e.status === 'recruiting' || e.status === 'active')
    .map((e) => e.id);

  const applicantsPerExp: Record<string, ApplicantRow[]> = {};

  if (interactiveIds.length > 0) {
    const { data: apps } = await supabase
      .from('applications')
      .select('id, experiment_id, participant_id, status, applied_at, approved_at, payout_status, eligibility_status')
      .in('experiment_id', interactiveIds)
      .order('applied_at', { ascending: true });

    const appRows = apps ?? [];

    // Collect unique participant DIDs
    const dids = [...new Set(appRows.map((a) => a.participant_id as string))];

    // Fetch participant profiles
    const { data: ppRows } = dids.length > 0
      ? await supabase
          .from('participant_profiles')
          .select('user_id, participant_id, pseudonym, country, year_of_birth, sex_assigned_at_birth, gender_identity, smartphone_os, wearable_devices, internet_reliability, can_receive_kits, sample_comfort, language_fluency, weekly_availability_hours, previous_study_count, completion_rate, reliability_score, recent_interventions, washout_sensitive, onboarding_step, verification_status')
          .in('user_id', dids)
      : { data: [] };

    const ppMap = new Map((ppRows ?? []).map((pp) => [pp.user_id as string, pp]));

    // Group by experiment
    for (const app of appRows) {
      const expId = app.experiment_id as string;
      if (!applicantsPerExp[expId]) applicantsPerExp[expId] = [];
      applicantsPerExp[expId].push({
        id:                 app.id as string,
        participant_id:     app.participant_id as string,
        status:             app.status as string,
        applied_at:         app.applied_at as string,
        approved_at:        app.approved_at as string | null,
        payout_status:      app.payout_status as string,
        eligibility_status: (app.eligibility_status as string | null) ?? null,
        participantProfile: (ppMap.get(app.participant_id as string) ?? null) as ApplicantRow['participantProfile'],
        applicationHistory: [],
      });
    }
  }

  // 4. Compute stats
  const totalPool    = experiments.reduce((s, e) => s + e.total_bounty_pool, 0);
  const activeCount  = experiments.filter((e) => ['recruiting','active'].includes(e.status)).length;
  const completedCount = experiments.filter((e) => e.status === 'completed').length;

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Demo banner ── */}
        <div
          className="rounded px-5 py-3 mb-6 mono text-xs"
          style={{ border: '1px solid rgba(0,229,255,0.3)', color: 'var(--cyan)', background: 'rgba(0,229,255,0.04)' }}
        >
          // DEMO_VIEW — read-only experimenter dashboard preview. Approve/Deny/Waitlist buttons are visible but disabled.
        </div>

        {/* ── Back link ── */}
        <Link href="/demo" className="mono text-xs no-underline mb-6 inline-block" style={{ color: 'var(--text-dim)' }}>
          ← All orgs
        </Link>

        {/* ── Org header ── */}
        <div className="rounded p-6 mb-6"
          style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span
                  className="mono text-xs px-2 py-0.5 rounded font-bold"
                  style={{ background: 'rgba(77,255,128,0.08)', border: '1px solid rgba(77,255,128,0.2)', color: 'var(--green)' }}
                >
                  ● APPROVED
                </span>
                {org.verified_experiments > 0 && (
                  <span className="mono text-xs px-2 py-0.5 rounded"
                    style={{ background: 'rgba(77,255,128,0.06)', border: '1px solid rgba(77,255,128,0.15)', color: 'var(--green)' }}>
                    ✓ BIOME VERIFIED ORG
                  </span>
                )}
              </div>

              <h1
                className="text-2xl font-black mb-2"
                style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}
              >
                {org.org_name}
              </h1>

              {org.org_description && (
                <p className="text-sm mb-3" style={{ color: 'var(--text-dim)', maxWidth: '56rem' }}>
                  {org.org_description}
                </p>
              )}

              {org.expertise_areas && org.expertise_areas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {org.expertise_areas.map((a: string) => (
                    <span key={a} className="mono text-xs px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.12)', color: 'var(--cyan)' }}>
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 flex-shrink-0">
              {[
                { label: 'TOTAL POOL',  value: `$${(totalPool / 1000).toFixed(0)}K` },
                { label: 'ACTIVE',      value: String(activeCount),      color: 'var(--green)' },
                { label: 'COMPLETED',   value: String(completedCount) },
              ].map((s) => (
                <div key={s.label} className="rounded p-3 text-center"
                  style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.06)' }}>
                  <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>{s.label}</p>
                  <p className="mono text-lg font-bold" style={{ color: s.color ?? 'var(--text-white)' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Study list with tabs ── */}
        <div className="mb-2">
          <p className="mono text-xs mb-4" style={{ color: 'var(--text-dim)' }}>// STUDIES</p>
        </div>
        <DemoOrgClient experiments={experiments} applicantsPerExp={applicantsPerExp} />

      </div>
    </main>
  );
}
