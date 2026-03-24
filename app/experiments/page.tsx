import { createAnonClient } from '@/lib/supabase/anon';
import { SiteHeader } from '@/components/nav/header';
import { TickerBar } from '@/components/dashboard/ticker-bar';
import { ExperimentDashboard } from '@/components/dashboard/experiment-dashboard';
import type { Experiment } from '@/lib/types';
import type { OrgMap } from '@/app/page';

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

export default async function ExperimentsPage() {
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
      <TickerBar
        experiments={experiments}
        totalPool={stats.totalBountyPool}
        activeCount={stats.activeCount}
        totalParticipants={stats.totalParticipants}
      />

      <div className="flex-1 max-w-screen-xl mx-auto w-full">
        <div className="px-4 md:px-8 pt-8 pb-2">
          <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>
            // ALL_STUDIES
          </p>
          <h1
            className="text-2xl font-black"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-white)' }}
          >
            Study Database
          </h1>
        </div>
        <ExperimentDashboard experiments={experiments} stats={stats} orgMap={orgMap} />
      </div>

      <footer
        className="text-center py-4 mono text-xs"
        style={{ color: 'var(--text-dim)', borderTop: '1px solid rgba(77,255,128,0.06)' }}
      >
        // BIOME_PROTOCOL — study aggregator
      </footer>
    </main>
  );
}
