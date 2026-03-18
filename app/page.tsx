import { createAnonClient } from '@/lib/supabase/anon';
import { SiteHeader } from '@/components/nav/header';
import { TickerBar } from '@/components/dashboard/ticker-bar';
import { ExperimentDashboard } from '@/components/dashboard/experiment-dashboard';
import { Leaderboard } from '@/components/dashboard/leaderboard';
import { HeroSection } from '@/components/hero/hero-section';
import { CtaBlock } from '@/components/home/cta-block';
import type { Experiment } from '@/lib/types';
import type { LeaderRow } from '@/components/dashboard/leaderboard';

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

  const [expResult, leaderResult, orgResult] = await Promise.all([
    supabase.from('experiments').select('*').neq('status', 'draft').order('created_at', { ascending: false }),
    supabase
      .from('participant_profiles')
      .select('participant_id, pseudonym, country, previous_study_count, completion_rate, reliability_score')
      .not('completion_rate', 'is', null)
      .gte('previous_study_count', 3)
      .order('reliability_score', { ascending: false })
      .limit(10),
    supabase
      .from('experimenter_profiles')
      .select('id, user_id, org_name')
      .eq('screening_status', 'approved'),
  ]);

  const experiments = (expResult.data ?? []) as Experiment[];
  const leaders     = (leaderResult.data ?? []) as LeaderRow[];
  const stats       = computeStats(experiments);

  const orgMap: OrgMap = {};
  for (const o of (orgResult.data ?? []) as { id: string; user_id: string; org_name: string }[]) {
    orgMap[o.user_id] = { id: o.id, org_name: o.org_name };
  }

  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />
      <TickerBar
        experiments={experiments}
        totalPool={stats.totalBountyPool}
        activeCount={stats.activeCount}
        totalParticipants={stats.totalParticipants}
      />
      <div className="flex-1 max-w-screen-xl mx-auto w-full">
        <HeroSection stats={stats} />
        <ExperimentDashboard experiments={experiments} stats={stats} orgMap={orgMap} />
        <Leaderboard leaders={leaders} />
        <CtaBlock />
      </div>
      <footer
        className="text-center py-4 mono text-xs"
        style={{ color: 'var(--text-dim)', borderTop: '1px solid rgba(77,255,128,0.06)' }}
      >
        // BIOME_PROTOCOL — experiment aggregator — not financial advice
      </footer>
    </main>
  );
}
