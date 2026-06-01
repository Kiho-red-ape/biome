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

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string; blink: boolean }> = {
  recruiting: { label: 'RECRUITING', color: 'var(--green)',    blink: true  },
  active:     { label: 'ACTIVE',     color: 'var(--cyan)',     blink: true  },
  draft:      { label: 'DRAFT',      color: 'var(--text-dim)', blink: false },
  completed:  { label: 'COMPLETED',  color: 'var(--text-dim)', blink: false },
  cancelled:  { label: 'CANCELLED',  color: 'var(--amber)',    blink: false },
};

const CATEGORY_COLORS: Record<string, string> = {
  Sleep:     'var(--cyan)',
  Energy:    'var(--green)',
  Mood:      'var(--amber)',
  Nutrition: 'var(--green)',
  Focus:     'var(--cyan)',
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? 'var(--text-dim)';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortIcon({ field, current, dir }: { field: SortField; current: SortField | null; dir: SortDir }) {
  if (field !== current) return <span style={{ color: 'var(--text-dim)', opacity: 0.3 }}>⇅</span>;
  return <span style={{ color: 'var(--green)' }}>{dir === 'asc' ? '↑' : '↓'}</span>;
}

function SlotBar({ filled, total }: { filled: number; total: number }) {
  const pct = total > 0 ? filled / total : 0;
  const barColor = pct >= 0.9 ? 'var(--amber)' : pct >= 0.5 ? 'var(--green)' : 'var(--green-dim)';
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1 rounded overflow-hidden flex-shrink-0" style={{ background: 'rgba(77,255,128,0.1)' }}>
        <div className="h-1 rounded" style={{ width: `${pct * 100}%`, background: barColor, transition: 'width 0.3s' }} />
      </div>
      <span className="mono text-xs tabular-nums" style={{ color: pct >= 0.9 ? 'var(--amber)' : 'var(--text-dim)' }}>
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
        className={`mono text-xs font-normal cursor-pointer select-none px-3 py-3 whitespace-nowrap ${className}`}
        style={{ color: sortField === field ? 'var(--text-bright)' : 'var(--text-dim)', textAlign: align }}
      >
        <span className="inline-flex items-center gap-1">
          {align === 'right' && <SortIcon field={field} current={sortField} dir={sortDir} />}
          {label}
          {align !== 'right' && <SortIcon field={field} current={sortField} dir={sortDir} />}
        </span>
      </th>
    );
  }

  return (
    <div className="px-4 md:px-6 pb-16">

      {/* ── Hero stats ──────────────────────────────────────────── */}
      <section className="py-8 border-b" style={{ borderColor: 'rgba(77,255,128,0.07)' }}>
        <p className="mono text-xs mb-5" style={{ color: 'var(--text-dim)' }}>
          // EXPERIMENT_AGGREGATOR — live data from the biome network
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'TOTAL POOL',   value: fmt(stats.totalBountyPool),    sub: 'bounties posted'     },
            { label: 'EARNED',       value: fmt(stats.totalEarned),         sub: 'paid to participants'},
            { label: 'ACTIVE',       value: String(stats.activeCount),      sub: 'experiments open'   },
            { label: 'PARTICIPANTS', value: String(stats.totalParticipants), sub: 'slots filled'      },
          ].map((s) => (
            <div key={s.label} className="corner-bracket p-4" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
              <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>{s.label}</p>
              <p className="text-2xl font-black" style={{ color: 'var(--text-white)', fontFamily: 'var(--font-mono)' }}>{s.value}</p>
              <p className="mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-8 pb-5">
        <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
          // EXPERIMENTS{' '}
          <span style={{ color: filtered.length > 0 ? 'var(--green)' : 'var(--text-dim)' }}>
            [{filtered.length}]
          </span>
        </p>
        <p className="mono text-xs hidden md:block" style={{ color: 'var(--text-dim)' }}>
          click row to preview — click READ MORE to open
        </p>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-0" style={{ minWidth: 120 }}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-xs pointer-events-none" style={{ color: 'var(--text-dim)' }}>⌕</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search experiments..."
            className="w-full pl-7 pr-3 py-2 mono text-xs outline-none rounded"
            style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.1)', color: 'var(--text-bright)' }}
          />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="mono text-xs px-3 py-2 rounded outline-none cursor-pointer"
          style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.1)', color: catFilter !== 'all' ? 'var(--text-bright)' : 'var(--text-dim)' }}>
          <option value="all">ALL CATEGORIES</option>
          {categories.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
        </select>
        <select value={statFilter} onChange={(e) => setStatFilter(e.target.value)}
          className="mono text-xs px-3 py-2 rounded outline-none cursor-pointer"
          style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.1)', color: statFilter !== 'all' ? 'var(--text-bright)' : 'var(--text-dim)' }}>
          <option value="all">ALL STATUS</option>
          <option value="recruiting">RECRUITING</option>
          <option value="active">ACTIVE</option>
          <option value="completed">COMPLETED</option>
          <option value="draft">DRAFT</option>
        </select>
        <button onClick={() => setVerified((v) => !v)}
          className="mono text-xs px-3 py-2 rounded transition-all flex items-center gap-2"
          style={{
            background: verified ? 'rgba(77,255,128,0.08)' : 'var(--bg2)',
            border: `1px solid ${verified ? 'var(--green-dim)' : 'rgba(77,255,128,0.1)'}`,
            color: verified ? 'var(--green)' : 'var(--text-dim)',
          }}>
          {verified ? '✓' : '○'} VERIFIED ONLY
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded" style={{ border: '1px solid rgba(77,255,128,0.07)' }}>
        <table className="w-full border-collapse" style={{ minWidth: '860px' }}>

          <thead>
            <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.08)' }}>
              <th className="mono text-xs font-normal px-3 py-3 w-10" style={{ color: 'var(--text-dim)' }}>#</th>
              <ColHead field="title"                  label="EXPERIMENT"    className="text-left" />
              <th className="mono text-xs font-normal px-3 py-3 w-28 text-center whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>VERIFIED</th>
              <ColHead field="bounty_per_participant" label="REWARD"        align="right" className="w-28" />
              <ColHead field="total_bounty_pool"      label="POOL"          align="right" className="w-24" />
              <th className="mono text-xs font-normal px-3 py-3 w-40 whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>SLOTS</th>
              <ColHead field="status"                 label="STATUS"        className="w-32" />
              <th className="mono text-xs font-normal px-3 py-3 w-24 whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>REGION</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center mono text-xs" style={{ color: 'var(--text-dim)' }}>
                  // NO_EXPERIMENTS_MATCH — try adjusting your filters
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
                      borderBottom: isOpen ? 'none' : '1px solid rgba(77,255,128,0.05)',
                      background: isOpen ? 'var(--bg3)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.background = 'var(--bg3)'; }}
                    onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Row number */}
                    <td className="px-3 py-4 mono text-xs text-center tabular-nums" style={{ color: 'var(--text-dim)' }}>
                      {String(i_global + 1).padStart(2, '0')}
                    </td>

                    {/* Experiment name + category + expand chevron */}
                    <td className="px-3 py-4">
                      <div className="flex items-start gap-2">
                        <span className="mono text-xs mt-0.5 flex-shrink-0 transition-transform"
                          style={{ color: 'var(--text-dim)', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                          ▶
                        </span>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold leading-tight transition-colors group-hover:text-white"
                            style={{ color: 'var(--text-bright)', maxWidth: '300px' }}>
                            {exp.title}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="mono text-xs inline-flex items-center gap-1 self-start px-1.5 py-px rounded"
                              style={{
                                color: categoryColor(exp.category),
                                border: `1px solid ${categoryColor(exp.category)}30`,
                                background: `${categoryColor(exp.category)}08`,
                              }}>
                              {exp.category.toUpperCase()}
                            </span>
                            {orgMap[exp.experimenter_id] && (
                              <Link
                                href={`/org/${orgMap[exp.experimenter_id].id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="mono text-xs no-underline transition-opacity hover:opacity-80"
                                style={{ color: 'var(--text-dim)' }}
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
                        ? <span className="badge-verified">✓ VERIFIED</span>
                        : <span className="mono text-xs" style={{ color: 'var(--text-dim)', opacity: 0.3 }}>—</span>}
                    </td>

                    {/* Reward */}
                    <td className="px-3 py-4 text-right mono text-sm tabular-nums font-medium" style={{ color: 'var(--green)' }}>
                      {fmtFull(exp.bounty_per_participant)}
                    </td>

                    {/* Pool */}
                    <td className="px-3 py-4 text-right mono text-sm tabular-nums" style={{ color: 'var(--text-bright)' }}>
                      {fmt(exp.total_bounty_pool)}
                    </td>

                    {/* Slots */}
                    <td className="px-3 py-4">
                      <SlotBar filled={exp.slots_filled} total={exp.slots_total} />
                    </td>

                    {/* Status */}
                    <td className="px-3 py-4">
                      <span className="mono text-xs flex items-center gap-1.5 whitespace-nowrap" style={{ color: st.color }}>
                        <span className={st.blink ? 'blink' : ''}>●</span>
                        {st.label}
                      </span>
                    </td>

                    {/* Region */}
                    <td className="px-3 py-4 mono text-xs whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>
                      {exp.is_remote ? 'REMOTE' : (exp.region ?? '—')}
                    </td>
                  </tr>

                  {/* ── Accordion row ── */}
                  {isOpen && (
                    <tr key={`${exp.id}-accordion`} style={{ borderBottom: '2px solid rgba(77,255,128,0.12)', background: 'var(--bg3)' }}>
                      <td colSpan={8}>
                        <div className="px-4 sm:px-8 pt-3 pb-6 flex flex-col md:flex-row md:items-start gap-6">

                          {/* Description + tests */}
                          <div className="flex-1 min-w-0">
                            <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>// OVERVIEW</p>
                            <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-bright)', maxWidth: '500px' }}>
                              {exp.short_description ?? exp.description.slice(0, 160) + '…'}
                            </p>
                            {exp.tests_needed && (
                              <p className="mono text-xs leading-relaxed" style={{ color: 'var(--text-dim)', maxWidth: '500px' }}>
                                <span style={{ color: 'var(--cyan)' }}>TESTS REQUIRED: </span>
                                {exp.tests_needed}
                              </p>
                            )}
                          </div>

                          {/* Stats strip */}
                          <div className="flex items-start gap-6 flex-wrap">
                            <div>
                              <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>SLOTS OPEN</p>
                              <p className="mono text-lg font-black tabular-nums" style={{ color: exp.slots_filled >= exp.slots_total ? 'var(--amber)' : 'var(--text-bright)' }}>
                                {exp.slots_total - exp.slots_filled}
                              </p>
                              <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{exp.slots_filled}/{exp.slots_total} filled</p>
                            </div>
                            <div>
                              <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>REWARD</p>
                              <p className="mono text-lg font-black tabular-nums" style={{ color: 'var(--green)' }}>
                                ${exp.bounty_per_participant}
                              </p>
                              <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>per person</p>
                            </div>
                            {exp.duration_weeks && (
                              <div>
                                <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>DURATION</p>
                                <p className="mono text-lg font-black tabular-nums" style={{ color: 'var(--text-bright)' }}>
                                  {exp.duration_weeks}
                                </p>
                                <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>weeks</p>
                              </div>
                            )}
                            <div className="self-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); router.push(`/experiments/${exp.id}`); }}
                                className="mono text-xs px-5 py-2.5 rounded font-bold transition-all hover:opacity-90 whitespace-nowrap"
                                style={{ background: 'var(--green)', color: '#060a14' }}
                              >
                                READ MORE →
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
        <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
          {filtered.length} studies · page {page + 1} of {Math.max(1, totalPages)}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="mono text-xs px-3 py-1.5 rounded transition-all disabled:opacity-30"
            style={{ border: '1px solid rgba(77,255,128,0.15)', color: 'var(--text-dim)', background: 'transparent', cursor: page === 0 ? 'default' : 'pointer' }}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className="mono text-xs px-2.5 py-1.5 rounded transition-all"
              style={{
                background: i === page ? 'rgba(77,255,128,0.10)' : 'transparent',
                border: `1px solid ${i === page ? 'rgba(77,255,128,0.35)' : 'rgba(77,255,128,0.1)'}`,
                color: i === page ? 'var(--green)' : 'var(--text-dim)',
                cursor: 'pointer',
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="mono text-xs px-3 py-1.5 rounded transition-all disabled:opacity-30"
            style={{ border: '1px solid rgba(77,255,128,0.15)', color: 'var(--text-dim)', background: 'transparent', cursor: page >= totalPages - 1 ? 'default' : 'pointer' }}
          >
            Next →
          </button>
        </div>
        <p className="mono text-xs hidden md:block" style={{ color: 'var(--text-dim)' }}>
          // BIOME_PROTOCOL — 2.5% platform fee
        </p>
      </div>

    </div>
  );
}
