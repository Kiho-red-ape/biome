import { createAnonClient } from '@/lib/supabase/anon';
import { SiteHeader } from '@/components/nav/header';
import { TickerBar } from '@/components/dashboard/ticker-bar';
import { ExperimentDashboard } from '@/components/dashboard/experiment-dashboard';
import type { Experiment } from '@/lib/types';

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
  const { data } = await supabase
    .from('experiments')
    .select('*')
    .order('created_at', { ascending: false });

  const experiments = (data ?? []) as Experiment[];
  const stats = computeStats(experiments);

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
