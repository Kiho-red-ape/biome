import { createAnonClient } from '@/lib/supabase/anon';
import { SiteHeader } from '@/components/nav/header';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrgRow = {
  id: string;
  user_id: string;
  org_name: string;
  org_description: string | null;
  expertise_areas: string[] | null;
  experiments_posted: number;
  verified_experiments: number;
};

type StatusCounts = {
  recruiting: number;
  active: number;
  completed: number;
  draft: number;
  total: number;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DemoIndexPage() {
  const supabase = createAnonClient();

  const [orgsResult, expsResult] = await Promise.all([
    supabase
      .from('experimenter_profiles')
      .select('id, user_id, org_name, org_description, expertise_areas, experiments_posted, verified_experiments')
      .eq('screening_status', 'approved')
      .order('created_at'),
    supabase
      .from('experiments')
      .select('experimenter_id, status'),
  ]);

  const orgs  = (orgsResult.data  ?? []) as OrgRow[];
  const exps  = (expsResult.data  ?? []) as { experimenter_id: string; status: string }[];

  // Build count map keyed by experimenter user_id
  const countMap: Record<string, StatusCounts> = {};
  for (const e of exps) {
    if (!countMap[e.experimenter_id]) {
      countMap[e.experimenter_id] = { recruiting: 0, active: 0, completed: 0, draft: 0, total: 0 };
    }
    const c = countMap[e.experimenter_id];
    c.total++;
    if (e.status === 'recruiting') c.recruiting++;
    else if (e.status === 'active') c.active++;
    else if (e.status === 'completed') c.completed++;
    else if (e.status === 'draft') c.draft++;
  }

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* ── Demo banner ── */}
        <div
          className="rounded px-5 py-3 mb-8 mono text-xs"
          style={{ border: '1px solid rgba(0,229,255,0.3)', color: 'var(--cyan)', background: 'rgba(0,229,255,0.04)' }}
        >
          // DEMO_MODE — experimenter dashboard previews. Action buttons are visible but disabled. No auth required.
        </div>

        {/* ── Header ── */}
        <div className="mb-8">
          <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>// DEMO_INDEX</p>
          <h1 className="text-3xl font-black mb-2"
            style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
            Experimenter Dashboards
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Preview the full BIOME experimenter experience for any research org. Click an org to explore their studies and applicant screening dashboard.
          </p>
        </div>

        {/* ── Org list ── */}
        <div className="flex flex-col gap-3">
          {orgs.map((org) => {
            const counts = countMap[org.user_id] ?? { recruiting: 0, active: 0, completed: 0, draft: 0, total: 0 };
            const parts: string[] = [];
            if (counts.completed)  parts.push(`${counts.completed} completed`);
            if (counts.active)     parts.push(`${counts.active} active`);
            if (counts.recruiting) parts.push(`${counts.recruiting} recruiting`);
            if (counts.draft)      parts.push(`${counts.draft} draft`);

            return (
              <Link
                key={org.id}
                href={`/demo/org/${org.id}`}
                className="block rounded p-5 no-underline transition-all group"
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid rgba(77,255,128,0.06)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h2
                        className="font-bold text-base transition-colors group-hover:text-green-400"
                        style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}
                      >
                        {org.org_name}
                      </h2>
                      {org.verified_experiments > 0 && (
                        <span className="mono text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(77,255,128,0.08)', border: '1px solid rgba(77,255,128,0.2)', color: 'var(--green)' }}>
                          ✓ {org.verified_experiments} VERIFIED
                        </span>
                      )}
                    </div>

                    {org.org_description && (
                      <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-dim)' }}>
                        {org.org_description}
                      </p>
                    )}

                    {org.expertise_areas && org.expertise_areas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {org.expertise_areas.map((a) => (
                          <span key={a} className="mono text-xs px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.12)', color: 'var(--cyan)' }}>
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="mono text-sm font-bold mb-0.5" style={{ color: 'var(--text-white)' }}>
                      {counts.total} {counts.total === 1 ? 'study' : 'studies'}
                    </p>
                    <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                      {parts.join(', ') || 'no studies'}
                    </p>
                    <p className="mono text-xs mt-2 transition-colors group-hover:text-green-400"
                      style={{ color: 'var(--text-dim)' }}>
                      View dashboard →
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Footer note ── */}
        <div className="mt-10 pt-6" style={{ borderTop: '1px solid rgba(77,255,128,0.06)' }}>
          <p className="mono text-xs text-center" style={{ color: 'var(--text-dim)' }}>
            // Want to post your own study?{' '}
            <Link href="/onboarding" className="no-underline hover:underline" style={{ color: 'var(--green)' }}>
              Create an experimenter account →
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}
