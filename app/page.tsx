import { createAnonClient } from '@/lib/supabase/anon';
import { SiteHeader } from '@/components/nav/header';
import { TickerBar } from '@/components/dashboard/ticker-bar';
import { HeroCompact } from '@/components/hero/hero-compact';
import { ExperimentGrid } from '@/components/home/experiment-grid';
import { Leaderboard } from '@/components/dashboard/leaderboard';
import { CtaBlock } from '@/components/home/cta-block';
import type { Experiment } from '@/lib/types';

export type OrgEntry = { id: string; org_name: string };
export type OrgMap = Record<string, OrgEntry>; // keyed by user_id (= experiments.experimenter_id)

function computeStats(experiments: Experiment[]) {
  const totalBountyPool = experiments.reduce((s, e) => s + e.total_bounty_pool, 0);
  const totalEarned = experiments
    .filter((e) => e.status === 'active' || e.status === 'completed')
    .reduce((s, e) => s + e.bounty_per_participant * e.slots_filled, 0);
  const activeCount = experiments.filter(
    (e) => e.status === 'recruiting' || e.status === 'active'
  ).length;
  const totalParticipants = experiments.reduce((s, e) => s + e.slots_filled, 0);
  return { totalBountyPool, totalEarned, activeCount, totalParticipants };
}

export default async function HomePage() {
  const supabase = createAnonClient();

  const [expResult, orgResult] = await Promise.all([
    supabase.from('experiments').select('*').neq('status', 'draft').order('created_at', { ascending: false }),
    supabase
      .from('experimenter_profiles')
      .select('id, user_id, org_name')
      .eq('screening_status', 'approved'),
  ]);

  const experiments = (expResult.data ?? []) as Experiment[];
  const stats       = computeStats(experiments);

  const orgMap: OrgMap = {};
  for (const o of (orgResult.data ?? []) as { id: string; user_id: string; org_name: string }[]) {
    orgMap[o.user_id] = { id: o.id, org_name: o.org_name };
  }

  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />
      <HeroCompact stats={stats} experimentCount={experiments.length} />
      <div className="flex-1 max-w-screen-xl mx-auto w-full">
        <ExperimentGrid experiments={experiments} orgMap={orgMap} />
        <TickerBar
          experiments={experiments}
          totalPool={stats.totalBountyPool}
          activeCount={stats.activeCount}
          totalParticipants={stats.totalParticipants}
        />
        <Leaderboard />
        <CtaBlock />
      </div>
      <footer
        className="px-4 sm:px-10"
        style={{
          paddingTop: 16, paddingBottom: 16,
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between', gap: 16,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16,
          letterSpacing: '4px', textTransform: 'uppercase',
        }}>
          <span style={{ color: '#b7ff61' }}>BIO</span><span style={{ color: '#22d3ee' }}>ME</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <a href="/legal/tos"                              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', textDecoration: 'none' }}>Terms</a>
          <a href="/privacy"                                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', textDecoration: 'none' }}>Privacy</a>
          <a href="/legal/participant-agreement/view"       style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', textDecoration: 'none' }}>Participant Agreement</a>
          <a href="/legal/experimenter-agreement/view"     style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', textDecoration: 'none' }}>Experimenter Agreement</a>
          <a href="/payout-policy"                          style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', textDecoration: 'none' }}>Payout Policy</a>
          <a href="/docs"                                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', textDecoration: 'none' }}>Docs</a>
          <a href="/disputes/raise"                           style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', textDecoration: 'none' }}>Report an Issue</a>
        </div>
      </footer>
    </main>
  );
}
