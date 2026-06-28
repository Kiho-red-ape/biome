import { createAnonClient } from '@/lib/supabase/anon';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { ExperimentStatus } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrgExp = {
  id: string;
  title: string;
  status: ExperimentStatus;
  bounty_per_participant: number;
  slots_total: number;
  slots_filled: number;
  category: string;
};

// Status pills consistent with the dashboard: draft=slate, recruiting=blue,
// active=teal, completed=green, cancelled=red.
const STATUS_PILLS: Record<ExperimentStatus, { label: string; bg: string; color: string }> = {
  draft:      { label: 'Draft',      bg: 'var(--bg-page)',     color: 'var(--slate)'     },
  recruiting: { label: 'Recruiting', bg: '#e0edff',            color: '#1d4ed8'          },
  active:     { label: 'Active',     bg: 'var(--teal-soft)',   color: 'var(--teal-dark)' },
  completed:  { label: 'Completed',  bg: 'var(--success-soft)', color: 'var(--success)'  },
  cancelled:  { label: 'Cancelled',  bg: 'var(--error-soft)',  color: 'var(--error)'     },
};

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
    .select('id, title, status, bounty_per_participant, slots_total, slots_filled, category')
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
                color:        approved ? '#ffffff' : '#d97706',
                background:   approved ? 'var(--teal)' : '#fef3c7',
                border:       approved ? 'none' : '1px solid #fde68a',
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

        {/* ── Stats row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-0 mb-4"
          style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', background: 'var(--surface)', overflow: 'hidden' }}>
          {[
            { label: 'Studies Posted',  value: String(org.experiments_posted)   },
            { label: 'BIOME Verified',  value: String(org.verified_experiments) },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{ padding: '20px', borderRight: i === 0 ? '1px solid var(--border-soft)' : 'none' }}
            >
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 24, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{s.value}</p>
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
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--slate)' }}>Studies</p>
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
                    {['Study', 'Status', 'Reward', 'Slots'].map((h) => (
                      <th key={h} className="text-left" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', padding: '12px 16px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {experiments.map((e, idx) => {
                    const pill = STATUS_PILLS[e.status] ?? STATUS_PILLS.draft;
                    const pct  = e.slots_total > 0 ? (e.slots_filled / e.slots_total) * 100 : 0;
                    return (
                      <tr key={e.id} style={{ borderBottom: idx < experiments.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                        <td style={{ padding: '16px' }}>
                          <Link href={`/experiments/${e.id}`} className="flex flex-col gap-1.5 no-underline">
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
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
                          <span
                            className="inline-flex items-center"
                            style={{
                              fontFamily:    'var(--font-mono)',
                              fontSize:      10,
                              fontWeight:    600,
                              letterSpacing: '1px',
                              textTransform: 'uppercase',
                              padding:       '3px 8px',
                              borderRadius:  '4px',
                              background:    pill.bg,
                              color:         pill.color,
                            }}
                          >
                            {pill.label}
                          </span>
                        </td>
                        <td className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--teal-dark)', padding: '16px' }}>
                          ${e.bounty_per_participant.toFixed(2)}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div className="flex items-center gap-2">
                            <div className="overflow-hidden" style={{ width: 48, height: 4, borderRadius: 4, background: 'var(--bg-page)' }}>
                              <div style={{ height: 4, borderRadius: 4, width: `${pct}%`, background: 'var(--teal)' }} />
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
