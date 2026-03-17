'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Experiment, ExperimentStatus } from '@/lib/types';

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
  Longevity:   'var(--green)',
  Neuroscience:'var(--cyan)',
  Sleep:       'var(--cyan)',
  Microbiome:  'var(--green-dim)',
  Metabolic:   'var(--amber)',
  Cognitive:   'var(--cyan)',
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? 'var(--text-dim)';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) {
    return <span style={{ color: 'var(--text-dim)', opacity: 0.3 }}>⇅</span>;
  }
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

export function ExperimentDashboard({ experiments, stats }: Props) {
  const router = useRouter();

  // ── Filter/sort state ────────────────────────────────────────
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('all');
  const [statFilter, setStatFilter] = useState('all');
  const [verified,   setVerified]   = useState(false);
  const [sortField,  setSortField]  = useState<SortField>('created_at');
  const [sortDir,    setSortDir]    = useState<SortDir>('desc');

  // ── Derived data ─────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = [...new Set(experiments.map((e) => e.category))].sort();
    return cats;
  }, [experiments]);

  const filtered = useMemo(() => {
    return experiments
      .filter((e) => {
        if (catFilter  !== 'all' && e.category !== catFilter)      return false;
        if (statFilter !== 'all' && e.status   !== statFilter)     return false;
        if (verified && !e.is_verified)                            return false;
        if (search) {
          const q = search.toLowerCase();
          if (!e.title.toLowerCase().includes(q) &&
              !e.category.toLowerCase().includes(q) &&
              !e.description.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let va: string | number = a[sortField] as string | number;
        let vb: string | number = b[sortField] as string | number;
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [experiments, catFilter, statFilter, verified, search, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  // ── Column header helper ─────────────────────────────────────
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
            { label: 'TOTAL POOL',    value: fmt(stats.totalBountyPool),   sub: 'bounties posted'     },
            { label: 'EARNED',        value: fmt(stats.totalEarned),        sub: 'paid to participants'},
            { label: 'ACTIVE',        value: String(stats.activeCount),     sub: 'experiments open'   },
            { label: 'PARTICIPANTS',  value: String(stats.totalParticipants),sub: 'slots filled'       },
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
          click column header to sort — click row to open
        </p>
      </div>

      {/* ── Filter bar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 mono text-xs pointer-events-none"
            style={{ color: 'var(--text-dim)' }}
          >
            ⌕
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search experiments..."
            className="w-full pl-7 pr-3 py-2 mono text-xs outline-none rounded"
            style={{
              background: 'var(--bg2)',
              border: '1px solid rgba(77,255,128,0.1)',
              color: 'var(--text-bright)',
            }}
          />
        </div>

        {/* Category */}
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="mono text-xs px-3 py-2 rounded outline-none cursor-pointer"
          style={{
            background: 'var(--bg2)',
            border: '1px solid rgba(77,255,128,0.1)',
            color: catFilter !== 'all' ? 'var(--text-bright)' : 'var(--text-dim)',
          }}
        >
          <option value="all">ALL CATEGORIES</option>
          {categories.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
        </select>

        {/* Status */}
        <select
          value={statFilter}
          onChange={(e) => setStatFilter(e.target.value)}
          className="mono text-xs px-3 py-2 rounded outline-none cursor-pointer"
          style={{
            background: 'var(--bg2)',
            border: '1px solid rgba(77,255,128,0.1)',
            color: statFilter !== 'all' ? 'var(--text-bright)' : 'var(--text-dim)',
          }}
        >
          <option value="all">ALL STATUS</option>
          <option value="recruiting">RECRUITING</option>
          <option value="active">ACTIVE</option>
          <option value="completed">COMPLETED</option>
          <option value="draft">DRAFT</option>
        </select>

        {/* Verified toggle */}
        <button
          onClick={() => setVerified((v) => !v)}
          className="mono text-xs px-3 py-2 rounded transition-all flex items-center gap-2"
          style={{
            background: verified ? 'rgba(77,255,128,0.08)' : 'var(--bg2)',
            border: `1px solid ${verified ? 'var(--green-dim)' : 'rgba(77,255,128,0.1)'}`,
            color: verified ? 'var(--green)' : 'var(--text-dim)',
          }}
        >
          {verified ? '✓' : '○'} VERIFIED ONLY
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div
        className="overflow-x-auto rounded"
        style={{ border: '1px solid rgba(77,255,128,0.07)' }}
      >
        <table className="w-full border-collapse" style={{ minWidth: '900px' }}>

          {/* Column headers */}
          <thead>
            <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.08)' }}>
              <th className="mono text-xs font-normal px-3 py-3 w-10" style={{ color: 'var(--text-dim)' }}>#</th>
              <ColHead field="title"                  label="EXPERIMENT"    className="text-left" />
              <th className="mono text-xs font-normal px-3 py-3 w-28 text-center whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>VERIFIED</th>
              <ColHead field="bounty_per_participant" label="BOUNTY / PART" align="right" className="w-32" />
              <ColHead field="total_bounty_pool"      label="POOL"          align="right" className="w-28" />
              <th className="mono text-xs font-normal px-3 py-3 w-44 whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>SLOTS</th>
              <ColHead field="status"                 label="STATUS"        className="w-32" />
              <th className="mono text-xs font-normal px-3 py-3 w-28 whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>REGION</th>
            </tr>
          </thead>

          {/* Rows */}
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center mono text-xs" style={{ color: 'var(--text-dim)' }}>
                  // NO_EXPERIMENTS_MATCH — try adjusting your filters
                </td>
              </tr>
            )}
            {filtered.map((exp, i) => {
              const st = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.draft;
              return (
                <tr
                  key={exp.id}
                  onClick={() => router.push(`/experiments/${exp.id}`)}
                  className="cursor-pointer transition-colors group"
                  style={{ borderBottom: '1px solid rgba(77,255,128,0.05)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Row number */}
                  <td className="px-3 py-4 mono text-xs text-center tabular-nums" style={{ color: 'var(--text-dim)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </td>

                  {/* Experiment name + category */}
                  <td className="px-3 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className="text-sm font-semibold leading-tight transition-colors group-hover:text-white"
                        style={{ color: 'var(--text-bright)', maxWidth: '340px' }}
                      >
                        {exp.title}
                      </span>
                      <span
                        className="mono text-xs inline-flex items-center gap-1 self-start px-1.5 py-px rounded"
                        style={{
                          color: categoryColor(exp.category),
                          border: `1px solid ${categoryColor(exp.category)}30`,
                          background: `${categoryColor(exp.category)}08`,
                        }}
                      >
                        {exp.category.toUpperCase()}
                      </span>
                    </div>
                  </td>

                  {/* Verified badge */}
                  <td className="px-3 py-4 text-center">
                    {exp.is_verified ? (
                      <span className="badge-verified">✓ VERIFIED</span>
                    ) : (
                      <span className="mono text-xs" style={{ color: 'var(--text-dim)', opacity: 0.3 }}>—</span>
                    )}
                  </td>

                  {/* Bounty per participant */}
                  <td className="px-3 py-4 text-right mono text-sm tabular-nums font-medium" style={{ color: 'var(--green)' }}>
                    {fmtFull(exp.bounty_per_participant)}
                  </td>

                  {/* Total pool */}
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
                    {exp.is_remote ? (
                      <span style={{ color: 'var(--text-dim)' }}>REMOTE</span>
                    ) : (
                      <span>{exp.region ?? '—'}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table footer */}
      <div className="flex items-center justify-between mt-3 px-1">
        <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
          {filtered.length} of {experiments.length} experiments
        </p>
        <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
          // BIOME_PROTOCOL — 2.5% platform fee on completed bounties
        </p>
      </div>

    </div>
  );
}
