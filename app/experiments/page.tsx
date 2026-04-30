import { createAnonClient } from '@/lib/supabase/anon';
import { SiteHeader } from '@/components/nav/header';
import { ExperimentDashboard } from '@/components/dashboard/experiment-dashboard';
import type { Experiment } from '@/lib/types';

type OrgEntry = { id: string; org_name: string };
export type OrgMap = Record<string, OrgEntry>;

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

  const orgMap: OrgMap = {};
  for (const o of (orgResult.data ?? []) as { id: string; user_id: string; org_name: string }[]) {
    orgMap[o.user_id] = { id: o.id, org_name: o.org_name };
  }

  const stats = {
    totalBountyPool:    experiments.reduce((s, e) => s + e.total_bounty_pool, 0),
    totalEarned:        experiments.filter((e) => e.status === 'active' || e.status === 'completed').reduce((s, e) => s + e.bounty_per_participant * e.slots_filled, 0),
    activeCount:        experiments.filter((e) => e.status === 'recruiting' || e.status === 'active').length,
    totalParticipants:  experiments.reduce((s, e) => s + e.slots_filled, 0),
  };

  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 max-w-screen-xl mx-auto w-full">
        <div className="px-4 md:px-8 pt-8 pb-2">
          <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>
            // ALL_STUDIES
          </p>
          <h1
            style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, color: 'var(--text-white)' }}
          >
            Study Database
          </h1>
        </div>

        {experiments.length === 0 ? (
          <div className="px-4 md:px-8 py-16 text-center">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#b7ff61', textTransform: 'uppercase', marginBottom: 16 }}>
              // ACTIVE_STUDIES
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#aab8b1', lineHeight: 1.8, marginBottom: 24 }}>
              No studies currently active.<br />
              Biome is onboarding its first sponsor studies.
            </p>
            <a
              href="/run-a-study"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#b7ff61', textDecoration: 'none', letterSpacing: '1px' }}
            >
              Run a study with Biome →
            </a>
          </div>
        ) : (
          <ExperimentDashboard experiments={experiments} stats={stats} orgMap={orgMap} />
        )}
      </div>

      <footer
        className="text-center py-4"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        // BIOME — operations layer for human studies
      </footer>
    </main>
  );
}
