'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Experiment, ExperimentStatus } from '@/lib/types';
import type { OrgMap } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = 'title' | 'slots_filled' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';

interface Stats {
  totalStudies: number;
  recruitingCount: number;
  activeCount: number;
  totalParticipants: number;
}

interface Props {
  experiments: Experiment[];
  stats: Stats;
  orgMap: OrgMap;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Canonical clinical status pill palette — keep in sync with the study detail
// page and org profile.
const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string }> = {
  recruiting: { label: 'Recruiting', color: 'var(--teal)'      },
  active:     { label: 'Active',     color: 'var(--teal-dark)' },
  draft:      { label: 'Draft',      color: 'var(--slate)'     },
  completed:  { label: 'Completed',  color: '#15803d'          },
  cancelled:  { label: 'Cancelled',  color: '#dc2626'          },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortIcon({ field, current, dir }: { field: SortField; current: SortField | null; dir: SortDir }) {
  if (field !== current) return <span style={{ color: 'var(--muted)', opacity: 0.4 }}>↕</span>;
  return <span style={{ color: 'var(--teal-dark)' }}>{dir === 'asc' ? '↑' : '↓'}</span>;
}

function SlotBar({ filled, total }: { filled: number; total: number }) {
  const pct = total > 0 ? filled / total : 0;
  const barColor = pct >= 0.9 ? 'var(--teal-dark)' : 'var(--teal)';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 rounded overflow-hidden flex-shrink-0" style={{ width: 56, background: 'var(--border-soft)' }}>
        <div className="h-1.5 rounded" style={{ width: `${pct * 100}%`, background: barColor, transition: 'width 0.3s' }} />
      </div>
      <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
        {filled}/{total}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: ExperimentStatus }) {
  const st = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        color: st.color,
        background: 'var(--bg-page)',
        border: '1px solid var(--border-soft)',
        borderRadius: 999,
        padding: '3px 9px',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
      {st.label}
    </span>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// Priority sort: recruiting (low slots) → active (low slots) → rest
function prioritySort(exps: Experiment[]): Experiment[] {
  return [...exps].sort((a, b) => {
    const rank = (e: Experiment) => e.status === 'recruiting' ? 0 : e.status === 'active' ? 1 : 2;
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra <= 1) return (a.slots_total - a.slots_filled) - (b.slots_total - b.slots_filled);
    return 0;
  });
}

export function ExperimentDashboard({ experiments, stats, orgMap }: Props) {
  const router = useRouter();

  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState('all');
  const [statFilter,  setStatFilter]  = useState('all');
  const [verified,    setVerified]    = useState(false);
  const [sortField,   setSortField]   = useState<SortField | null>(null); // null = smart sort
  const [sortDir,     setSortDir]     = useState<SortDir>('desc');
  const [page,        setPage]        = useState(0);

  const categories = useMemo(() => {
    return [...new Set(experiments.map((e) => e.category))].sort();
  }, [experiments]);

  const filtered = useMemo(() => {
    const base = experiments.filter((e) => {
      if (catFilter  !== 'all' && e.category !== catFilter)  return false;
      if (statFilter !== 'all' && e.status   !== statFilter) return false;
      if (verified && !e.is_verified)                        return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.title.toLowerCase().includes(q) &&
            !e.category.toLowerCase().includes(q) &&
            !e.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    if (!sortField) return prioritySort(base);
    return base.sort((a, b) => {
      let va: string | number = a[sortField] as string | number;
      let vb: string | number = b[sortField] as string | number;
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [experiments, catFilter, statFilter, verified, search, sortField, sortDir]);

  // Reset to first page when filters/sort change
  useEffect(() => { setPage(0); }, [search, catFilter, statFilter, verified, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  }

  function ColHead({ field, label, align = 'left', className = '' }: {
    field: SortField; label: string; align?: 'left' | 'right'; className?: string;
  }) {
    return (
      <th
        onClick={() => toggleSort(field)}
        className={`cursor-pointer select-none px-4 py-3 whitespace-nowrap ${className}`}
        style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      10,
          fontWeight:    600,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color:         sortField === field ? 'var(--slate)' : 'var(--muted)',
          textAlign:     align,
        }}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <SortIcon field={field} current={sortField} dir={sortDir} />
        </span>
      </th>
    );
  }

  const headCellStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: 'var(--muted)',
  };

  const controlStyle: React.CSSProperties = {
    fontFamily:   'var(--font-body)',
    fontSize:     13,
    height:       40,
    padding:      '0 12px',
    borderRadius: 'var(--radius-sm)',
    background:   'var(--surface)',
    border:       '1px solid var(--border-mid)',
    outline:      'none',
  };

  return (
    <div className="px-4 md:px-8 pb-16">

      {/* ── Stat tiles ──────────────────────────────────────────── */}
      <section className="py-8" style={{ borderBottom: '1px solid var(--border-soft)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20 }}>
          Live data from the Biome network
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Studies',           value: String(stats.totalStudies),       sub: 'listed on Biome'    },
            { label: 'Recruiting',        value: String(stats.recruitingCount),    sub: 'open to applicants' },
            { label: 'Active',            value: String(stats.activeCount),         sub: 'studies open'       },
            { label: 'Research Partners', value: String(stats.totalParticipants),   sub: 'slots filled'       },
          ].map((s) => (
            <div key={s.label} className="p-5 flex flex-col"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>{s.value}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-8 pb-5">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Studies{' '}
          <span style={{ fontFamily: 'var(--font-mono)', color: filtered.length > 0 ? 'var(--teal-dark)' : 'var(--muted)' }}>
            {filtered.length}
          </span>
        </p>
        <p className="hidden md:block" style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)' }}>
          Click a row to open the study
        </p>
      </div>

      {/* ── Filter toolbar ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1" style={{ minWidth: 180 }}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>⌕</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search studies..."
            className="w-full outline-none"
            style={{ ...controlStyle, paddingLeft: 32, color: 'var(--ink)' }}
          />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="cursor-pointer"
          style={{ ...controlStyle, color: catFilter !== 'all' ? 'var(--ink)' : 'var(--muted)' }}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statFilter} onChange={(e) => setStatFilter(e.target.value)}
          className="cursor-pointer"
          style={{ ...controlStyle, color: statFilter !== 'all' ? 'var(--ink)' : 'var(--muted)' }}>
          <option value="all">All status</option>
          <option value="recruiting">Recruiting</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={() => setVerified((v) => !v)}
          className="flex items-center gap-2 transition-all"
          style={{
            fontFamily:   'var(--font-body)',
            fontSize:     13,
            fontWeight:   600,
            height:       40,
            padding:      '0 14px',
            borderRadius: 'var(--radius-sm)',
            background:   verified ? 'var(--teal)' : 'var(--surface)',
            border:       `1px solid ${verified ? 'var(--teal)' : 'var(--border-mid)'}`,
            color:        verified ? '#ffffff' : 'var(--slate)',
            cursor:       'pointer',
            whiteSpace:   'nowrap',
          }}>
          {verified ? '✓' : '○'} Verified only
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="overflow-x-auto"
        style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', background: 'var(--surface)' }}>
        <table className="w-full border-collapse" style={{ minWidth: '780px' }}>

          <thead>
            <tr style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border-soft)' }}>
              <th className="px-4 py-3 w-10 text-center" style={headCellStyle}>#</th>
              <ColHead field="title" label="Study" className="text-left" />
              <th className="px-4 py-3 w-32 text-center" style={headCellStyle}>Verified</th>
              <th className="px-4 py-3 w-28 text-left" style={headCellStyle}>Access</th>
              <th className="px-4 py-3 w-44 text-left" style={headCellStyle}>Slots</th>
              <ColHead field="status" label="Status" className="w-32 text-left" />
              <th className="px-4 py-3 w-24 text-left" style={headCellStyle}>Region</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center" style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>
                  No studies match — try adjusting your filters
                </td>
              </tr>
            )}

            {paginated.map((exp, i) => {
              const i_global = page * PAGE_SIZE + i;
              const compensated = exp.bounty_per_participant > 0;

              return (
                <tr
                  key={exp.id}
                  onClick={() => router.push(`/experiments/${exp.id}`)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid var(--border-soft)', background: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-page)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Row number */}
                  <td className="px-4 py-4 text-center tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                    {String(i_global + 1).padStart(2, '0')}
                  </td>

                  {/* Study name + category + org */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="leading-tight"
                        style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', maxWidth: '340px' }}>
                        {exp.title}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center self-start"
                          style={{
                            fontFamily:   'var(--font-mono)',
                            fontSize:     9,
                            fontWeight:   600,
                            letterSpacing:'1px',
                            textTransform:'uppercase',
                            color:        'var(--teal-dark)',
                            background:   'var(--teal-faint)',
                            borderRadius: '4px',
                            padding:      '2px 6px',
                          }}>
                          {exp.category}
                        </span>
                        {orgMap[exp.experimenter_id] && (
                          <Link
                            href={`/org/${orgMap[exp.experimenter_id].id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="no-underline transition-opacity hover:opacity-80"
                            style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)' }}
                          >
                            {orgMap[exp.experimenter_id].org_name} →
                          </Link>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Verified */}
                  <td className="px-4 py-4 text-center">
                    {exp.is_verified
                      ? <span className="badge-verified">✓ BIOME VERIFIED</span>
                      : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', opacity: 0.5 }}>—</span>}
                  </td>

                  {/* Access / compensated tag (no amount) */}
                  <td className="px-4 py-4">
                    {compensated
                      ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--teal-dark)' }}>Compensated</span>
                      : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', opacity: 0.5 }}>—</span>}
                  </td>

                  {/* Slots */}
                  <td className="px-4 py-4">
                    <SlotBar filled={exp.slots_filled} total={exp.slots_total} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <StatusPill status={exp.status} />
                  </td>

                  {/* Region */}
                  <td className="px-4 py-4 whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                    {exp.is_remote ? 'Remote' : (exp.region ?? '—')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-1 flex-wrap gap-3">
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)' }}>
          {filtered.length} studies · page {page + 1} of {Math.max(1, totalPages)}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="transition-all disabled:opacity-30"
            style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--slate)', background: 'var(--surface)', cursor: page === 0 ? 'default' : 'pointer' }}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className="transition-all"
              style={{
                fontFamily:   'var(--font-mono)',
                fontSize:     12,
                fontWeight:   600,
                padding:      '6px 11px',
                borderRadius: 'var(--radius-sm)',
                background:   i === page ? 'var(--teal)' : 'var(--surface)',
                border:       `1px solid ${i === page ? 'var(--teal)' : 'var(--border-mid)'}`,
                color:        i === page ? '#ffffff' : 'var(--slate)',
                cursor:       'pointer',
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="transition-all disabled:opacity-30"
            style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--slate)', background: 'var(--surface)', cursor: page >= totalPages - 1 ? 'default' : 'pointer' }}
          >
            Next →
          </button>
        </div>
        <p className="hidden md:block" style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)' }}>
          Biome — operations layer for human studies
        </p>
      </div>

    </div>
  );
}
