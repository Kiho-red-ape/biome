import { createAnonClient } from '@/lib/supabase/anon';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { ExperimentStatus } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrgExp = {
  id: string;
  title: string;
  status: ExperimentStatus;
  slots_total: number;
  slots_filled: number;
  category: string;
};

// Canonical clinical status pill palette — identical to the browse table and
// study detail page: recruiting=teal, active=teal-dark, completed=green,
// draft=slate, cancelled=red. Rendered as a dot pill on bg-page.
const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string }> = {
  recruiting: { label: 'Recruiting', color: 'var(--teal)'      },
  active:     { label: 'Active',     color: 'var(--teal-dark)' },
  draft:      { label: 'Draft',      color: 'var(--slate)'     },
  completed:  { label: 'Completed',  color: '#15803d'          },
  cancelled:  { label: 'Cancelled',  color: '#dc2626'          },
};

function StatusPill({ status }: { status: ExperimentStatus }) {
  const st = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap"
      style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      10,
        fontWeight:    600,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        color:         st.color,
        background:    'var(--bg-page)',
        border:        '1px solid var(--border-soft)',
        borderRadius:  999,
        padding:       '3px 9px',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
      {st.label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OrgProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAnonClient();

  const { data: org } = await supabase
    .from('experimenter_profiles')
    .select('id, user_id, org_name, org_website, org_description, role_title, expertise_areas, screening_status, experiments_posted, verified_experiments, created_at')
    .eq('id', id)
    .single();

  if (!org) notFound();

  const { data: exps } = await supabase
    .from('experiments')
    .select('id, title, status, slots_total, slots_filled, category')
    .eq('experimenter_id', org.user_id)
    .order('created_at', { ascending: false });

  const experiments = (exps ?? []) as OrgExp[];
  const approved = org.screening_status === 'approved';

  return (
    <main className="min-h-screen px-4 py-10" style={{ background: 'var(--bg-page)' }}>
      <div className="mx-auto w-full" style={{ maxWidth: 960 }}>

        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="no-underline" style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>
            ← Back
          </Link>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Researcher Profile
          </span>
        </div>

        {/* ── Org header ───────────────────────────────────────────── */}
        <div
          className="p-6 mb-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <h1
              className="leading-tight"
              style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--ink)' }}
            >
              {org.org_name}
            </h1>
            <span
              className="inline-flex items-center gap-1.5"
              style={{
                fontFamily:   'var(--font-mono)',
                fontSize:     10,
                fontWeight:   700,
                letterSpacing:'1px',
                textTransform:'uppercase',
                padding:      '4px 10px',
                borderRadius: '4px',
                color:        approved ? '#ffffff' : 'var(--warning)',
                background:   approved ? 'var(--teal)' : 'var(--warning-soft)',
                border:       approved ? '1px solid var(--teal)' : '1px solid rgba(180,83,9,0.25)',
              }}
            >
              <span>●</span>
              {approved ? '✓ Approved' : 'Pending Review'}
            </span>
          </div>

          {org.role_title && (
            <p className="mb-3" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)' }}>{org.role_title}</p>
          )}

          {org.org_description && (
            <p className="mb-4" style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.65, color: 'var(--slate)' }}>
              {org.org_description}
            </p>
          )}

          {org.org_website && (
            <a
              href={org.org_website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-opacity hover:opacity-80 no-underline"
              style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--teal-dark)' }}
            >
              {org.org_website} ↗
            </a>
          )}

          {/* Expertise tags */}
          {org.expertise_areas && org.expertise_areas.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {(org.expertise_areas as string[]).map((area) => (
                <span
                  key={area}
                  style={{
                    fontFamily:   'var(--font-mono)',
                    fontSize:     10,
                    fontWeight:   600,
                    letterSpacing:'1px',
                    textTransform:'uppercase',
                    padding:      '3px 8px',
                    borderRadius: '4px',
                    color:        'var(--teal-dark)',
                    background:   'var(--teal-faint)',
                    border:       '1px solid var(--border-soft)',
                  }}
                >
                  {area}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Stat tiles (same shape as the browse dashboard's) ───── */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { label: 'Studies Posted',  value: String(org.experiments_posted),   sub: 'listed on Biome'   },
            { label: 'BIOME Verified',  value: String(org.verified_experiments), sub: 'vetted end-to-end' },
          ].map((s) => (
            <div
              key={s.label}
              className="p-5 flex flex-col"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}
            >
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>{s.value}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Studies ──────────────────────────────────────────────── */}
        <div
          style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', background: 'var(--surface)', overflow: 'hidden' }}
        >
          <div
            className="flex items-center gap-2"
            style={{ padding: '14px 24px', background: 'var(--bg-page)', borderBottom: '1px solid var(--border-soft)' }}
          >
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Studies</p>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--teal-dark)' }}>{experiments.length}</span>
          </div>

          {experiments.length === 0 ? (
            <div className="text-center" style={{ padding: '40px 24px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)' }}>
                No studies posted yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: 500 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-soft)', background: 'var(--bg-page)' }}>
                    {['Study', 'Status', 'Slots'].map((h) => (
                      <th key={h} className="text-left" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', padding: '12px 16px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {experiments.map((e, idx) => {
                    const pct = e.slots_total > 0 ? e.slots_filled / e.slots_total : 0;
                    return (
                      <tr key={e.id} style={{ borderBottom: idx < experiments.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                        <td style={{ padding: '16px' }}>
                          <Link href={`/experiments/${e.id}`} className="flex flex-col gap-1.5 no-underline">
                            <span className="leading-tight" style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                              {e.title}
                            </span>
                            <span
                              className="self-start"
                              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--teal-dark)', background: 'var(--teal-faint)', borderRadius: '4px', padding: '2px 6px' }}
                            >
                              {e.category}
                            </span>
                          </Link>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <StatusPill status={e.status} />
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div className="flex items-center gap-2">
                            <div className="overflow-hidden flex-shrink-0" style={{ width: 56, height: 6, borderRadius: 4, background: 'var(--border-soft)' }}>
                              <div style={{ height: 6, borderRadius: 4, width: `${pct * 100}%`, background: pct >= 0.9 ? 'var(--teal-dark)' : 'var(--teal)' }} />
                            </div>
                            <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                              {e.slots_filled}/{e.slots_total}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
