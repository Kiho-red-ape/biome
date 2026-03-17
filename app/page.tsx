import { createAnonClient } from '@/lib/supabase/anon';
import { SiteHeader } from '@/components/nav/header';
import { TickerBar } from '@/components/dashboard/ticker-bar';
import { ExperimentDashboard } from '@/components/dashboard/experiment-dashboard';
import { Leaderboard } from '@/components/dashboard/leaderboard';
import type { Experiment } from '@/lib/types';
import type { LeaderRow } from '@/components/dashboard/leaderboard';

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

  const [expResult, leaderResult] = await Promise.all([
    supabase.from('experiments').select('*').order('created_at', { ascending: false }),
    supabase
      .from('participant_profiles')
      .select('participant_id, pseudonym, country, previous_study_count, completion_rate, reliability_score')
      .not('completion_rate', 'is', null)
      .gte('previous_study_count', 3)
      .order('reliability_score', { ascending: false })
      .limit(10),
  ]);

  const experiments = (expResult.data ?? []) as Experiment[];
  const leaders     = (leaderResult.data ?? []) as LeaderRow[];
  const stats       = computeStats(experiments);

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
        <ExperimentDashboard experiments={experiments} stats={stats} />
        <Leaderboard leaders={leaders} />
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
