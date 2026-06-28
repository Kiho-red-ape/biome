'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Experiment, ExperimentStatus } from '@/lib/types';
import type { OrgMap } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = 'title' | 'bounty_per_participant' | 'total_bounty_pool' | 'slots_filled' | 'status' | 'created_at';
type SortDir = 'asc' | 'desc';

interface Stats {
  totalBountyPool: number;
  totalEarned: number;
  activeCount: number;
  totalParticipants: number;
}

interface Props {
  experiments: Experiment[];
  stats: Stats;
  orgMap: OrgMap;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtFull(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string }> = {
  recruiting: { label: 'Recruiting', color: 'var(--teal)'      },
  active:     { label: 'Active',     color: 'var(--teal-dark)' },
  draft:      { label: 'Draft',      color: 'var(--muted)'     },
  completed:  { label: 'Completed',  color: 'var(--muted)'     },
  cancelled:  { label: 'Cancelled',  color: '#dc2626'          },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortIcon({ field, current, dir }: { field: SortField; current: SortField | null; dir: SortDir }) {
  if (field !== current) return <span style={{ color: 'var(--muted)', opacity: 0.4 }}>⇅</span>;
  return <span style={{ color: 'var(--teal-dark)' }}>{dir === 'asc' ? '↑' : '↓'}</span>;
}

function SlotBar({ filled, total }: { filled: number; total: number }) {
  const pct = total > 0 ? filled / total : 0;
  const barColor = pct >= 0.9 ? 'var(--teal-dark)' : 'var(--teal)';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 rounded overflow-hidden flex-shrink-0" style={{ width: 56, background: 'var(--bg-page)' }}>
        <div className="h-1 rounded" style={{ width: `${pct * 100}%`, background: barColor, transition: 'width 0.3s' }} />
      </div>
      <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
        {filled}/{total}
      </span>
    </div>
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

  const [expandedId,  setExpandedId]  = useState<string | null>(null);
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
        className={`cursor-pointer select-none px-3 py-3 whitespace-nowrap ${className}`}
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
          {align === 'right' && <SortIcon field={field} current={sortField} dir={sortDir} />}
          {label}
          {align !== 'right' && <SortIcon field={field} current={sortField} dir={sortDir} />}
        </span>
      </th>
    );
  }

  const filterControlStyle: React.CSSProperties = {
    fontFamily:   'var(--font-body)',
    fontSize:     13,
    padding:      '8px 12px',
    borderRadius: 'var(--radius-sm)',
    background:   'var(--surface)',
    border:       '1px solid var(--border-mid)',
    outline:      'none',
  };

  return (
    <div className="px-4 md:px-8 pb-16">

      {/* ── Hero stats ──────────────────────────────────────────── */}
      <section className="py-8" style={{ borderBottom: '1px solid var(--border-soft)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20 }}>
          Live data from the Biome network
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Pool',       value: fmt(stats.totalBountyPool),       sub: 'compensation committed' },
            { label: 'Disbursed',        value: fmt(stats.totalEarned),           sub: 'paid to research partners' },
            { label: 'Active',           value: String(stats.activeCount),        sub: 'studies open' },
            { label: 'Research Partners', value: String(stats.totalParticipants), sub: 'slots filled' },
          ].map((s) => (
            <div key={s.label} className="p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>{s.value}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-8 pb-5">
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--slate)' }}>
          Studies{' '}
          <span style={{ fontFamily: 'var(--font-mono)', color: filtered.length > 0 ? 'var(--teal-dark)' : 'var(--muted)' }}>
            {filtered.length}
          </span>
        </p>
        <p className="hidden md:block" style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)' }}>
          Click a row to preview — open for full details
        </p>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-0" style={{ minWidth: 120 }}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>⌕</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search studies..."
            className="w-full pl-8 pr-3 py-2 outline-none rounded"
            style={{ fontFamily: 'var(--font-body)', fontSize: 13, background: 'var(--surface)', border: '1px solid var(--border-mid)', color: 'var(--ink)', borderRadius: 'var(--radius-sm)' }}
          />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="cursor-pointer"
          style={{ ...filterControlStyle, color: catFilter !== 'all' ? 'var(--ink)' : 'var(--muted)' }}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statFilter} onChange={(e) => setStatFilter(e.target.value)}
          className="cursor-pointer"
          style={{ ...filterControlStyle, color: statFilter !== 'all' ? 'var(--ink)' : 'var(--muted)' }}>
          <option value="all">All status</option>
          <option value="recruiting">Recruiting</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="draft">Draft</option>
        </select>
        <button onClick={() => setVerified((v) => !v)}
          className="flex items-center gap-2 transition-all"
          style={{
            fontFamily:   'var(--font-body)',
            fontSize:     13,
            fontWeight:   600,
            padding:      '8px 14px',
            borderRadius: 'var(--radius-sm)',
            background:   verified ? 'var(--teal)' : 'var(--surface)',
            border:       `1px solid ${verified ? 'var(--teal)' : 'var(--border-mid)'}`,
            color:        verified ? '#ffffff' : 'var(--slate)',
            cursor:       'pointer',
          }}>
          {verified ? '✓' : '○'} Verified only
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="overflow-x-auto"
        style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', background: 'var(--surface)' }}>
        <table className="w-full border-collapse" style={{ minWidth: '860px' }}>

          <thead>
            <tr style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border-soft)' }}>
              <th className="px-3 py-3 w-10" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--muted)' }}>#</th>
              <ColHead field="title"                  label="Study"         className="text-left" />
              <th className="px-3 py-3 w-28 text-center whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)' }}>Verified</th>
              <ColHead field="bounty_per_participant" label="Reward"        align="right" className="w-28" />
              <ColHead field="total_bounty_pool"      label="Pool"          align="right" className="w-24" />
              <th className="px-3 py-3 w-40 whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)' }}>Slots</th>
              <ColHead field="status"                 label="Status"        className="w-32" />
              <th className="px-3 py-3 w-24 whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)' }}>Region</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center" style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>
                  No studies match — try adjusting your filters
                </td>
              </tr>
            )}

            {paginated.map((exp, i) => {
              const i_global = page * PAGE_SIZE + i;
              const st = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.draft;
              const isOpen = expandedId === exp.id;

              return (
                <>
                  {/* ── Main row ── */}
                  <tr
                    key={exp.id}
                    onClick={() => setExpandedId(isOpen ? null : exp.id)}
                    className="cursor-pointer transition-colors group"
                    style={{
                      borderBottom: isOpen ? 'none' : '1px solid var(--border-soft)',
                      background: isOpen ? 'var(--bg-page)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.background = 'var(--bg-page)'; }}
                    onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Row number */}
                    <td className="px-3 py-4 text-center tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                      {String(i_global + 1).padStart(2, '0')}
                    </td>

                    {/* Study name + category + expand chevron */}
                    <td className="px-3 py-4">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0 transition-transform"
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                          ▶
                        </span>
                        <div className="flex flex-col gap-1">
                          <span className="leading-tight"
                            style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', maxWidth: '300px' }}>
                            {exp.title}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 self-start"
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
                                {orgMap[exp.experimenter_id].org_name} ↗
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Verified */}
                    <td className="px-3 py-4 text-center">
                      {exp.is_verified
                        ? <span className="badge-verified">✓ BIOME VERIFIED</span>
                        : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', opacity: 0.5 }}>—</span>}
                    </td>

                    {/* Reward */}
                    <td className="px-3 py-4 text-right tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--teal-dark)' }}>
                      {fmtFull(exp.bounty_per_participant)}
                    </td>

                    {/* Pool */}
                    <td className="px-3 py-4 text-right tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--slate)' }}>
                      {fmt(exp.total_bounty_pool)}
                    </td>

                    {/* Slots */}
                    <td className="px-3 py-4">
                      <SlotBar filled={exp.slots_filled} total={exp.slots_total} />
                    </td>

                    {/* Status */}
                    <td className="px-3 py-4">
                      <span className="flex items-center gap-1.5 whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: st.color }}>
                        <span>●</span>
                        {st.label}
                      </span>
                    </td>

                    {/* Region */}
                    <td className="px-3 py-4 whitespace-nowrap" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                      {exp.is_remote ? 'Remote' : (exp.region ?? '—')}
                    </td>
                  </tr>

                  {/* ── Accordion row ── */}
                  {isOpen && (
                    <tr key={`${exp.id}-accordion`} style={{ borderBottom: '1px solid var(--border-mid)', background: 'var(--bg-page)' }}>
                      <td colSpan={8}>
                        <div className="px-4 sm:px-8 pt-3 pb-6 flex flex-col md:flex-row md:items-start gap-6">

                          {/* Description + tests */}
                          <div className="flex-1 min-w-0">
                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Overview</p>
                            <p className="mb-3" style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.65, color: 'var(--slate)', maxWidth: '500px' }}>
                              {exp.short_description ?? exp.description.slice(0, 160) + '…'}
                            </p>
                            {exp.tests_needed && (
                              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.6, color: 'var(--muted)', maxWidth: '500px' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--teal-dark)' }}>Tests required: </span>
                                {exp.tests_needed}
                              </p>
                            )}
                          </div>

                          {/* Stats strip */}
                          <div className="flex items-start gap-6 flex-wrap">
                            <div>
                              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Slots open</p>
                              <p className="tabular-nums" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: exp.slots_filled >= exp.slots_total ? '#d97706' : 'var(--ink)' }}>
                                {exp.slots_total - exp.slots_filled}
                              </p>
                              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)' }}>{exp.slots_filled}/{exp.slots_total} filled</p>
                            </div>
                            <div>
                              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Reward</p>
                              <p className="tabular-nums" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--teal-dark)' }}>
                                ${exp.bounty_per_participant}
                              </p>
                              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)' }}>per person</p>
                            </div>
                            {exp.duration_weeks && (
                              <div>
                                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Duration</p>
                                <p className="tabular-nums" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                                  {exp.duration_weeks}
                                </p>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)' }}>weeks</p>
                              </div>
                            )}
                            <div className="self-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); router.push(`/experiments/${exp.id}`); }}
                                className="transition-all hover:opacity-90 whitespace-nowrap"
                                style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--teal)', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                              >
                                Read more →
                              </button>
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </>
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
          Biome — 2.5% platform fee
        </p>
      </div>

    </div>
  );
}
