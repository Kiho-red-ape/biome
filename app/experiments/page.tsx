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
          <p className="section-label" style={{ marginBottom: 4 }}>
            All studies
          </p>
          <h1
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, color: 'var(--ink)' }}
          >
            Study Database
          </h1>
        </div>

        {experiments.length === 0 ? (
          <div className="px-4 md:px-8 py-16 text-center">
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', color: 'var(--teal)', textTransform: 'uppercase', marginBottom: 16 }}>
              Active studies
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.8, marginBottom: 24 }}>
              No studies currently active.<br />
              Biome is onboarding its first sponsor studies.
            </p>
            <a
              href="/run-a-study"
              style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--teal)', textDecoration: 'none' }}
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
        style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)', borderTop: '1px solid var(--border-soft)' }}
      >
        BIOME — operations layer for human studies
      </footer>
    </main>
  );
}
