'use client';

import Link from 'next/link';
import { ExperimentIdenticon } from '@/components/ui/experiment-identicon';
import type { Experiment, ExperimentStatus } from '@/lib/types';
import type { OrgMap } from '@/app/page';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

// Map experiment category → identicon ramp key
function rampKey(cat: string): string {
  const n = cat.toLowerCase().replace(/\s+/g, '-');
  if (n.includes('micro') || n.includes('gut'))             return 'microbiome';
  if (n.includes('nutri') || n.includes('diet'))            return 'nutrition';
  if (n.includes('sleep') || n.includes('recov'))           return 'sleep';
  if (n.includes('wear') || n.includes('device'))          return 'wearables';
  if (n.includes('longev') || n.includes('aging'))          return 'longevity';
  if (n.includes('quant') || n.includes('self'))            return 'quantified-self';
  const KEYS = ['microbiome','nutrition','sleep','wearables','longevity','quantified-self'];
  return KEYS.includes(n) ? n : 'default';
}

// Category accent color
const CAT_COLORS: Record<string, string> = {
  microbiome:         '#b7ff61',
  nutrition:          '#8ee7ff',
  sleep:              '#ffd166',
  wearables:          '#ff8f8f',
  longevity:          '#d8c4ff',
  'quantified-self':  '#88bbff',
  default:            '#b7ff61',
};
function catColor(cat: string): string {
  return CAT_COLORS[rampKey(cat)] ?? CAT_COLORS['default'];
}

// Status config
const STATUS_CFG: Record<ExperimentStatus, { label: string; color: string; pulse: boolean }> = {
  recruiting: { label: 'RECRUITING', color: '#b7ff61',  pulse: true  },
  active:     { label: 'ACTIVE',     color: '#00e5ff',  pulse: false },
  draft:      { label: 'DRAFT',      color: '#708878',  pulse: false },
  completed:  { label: 'COMPLETED',  color: '#708878',  pulse: false },
  cancelled:  { label: 'CANCELLED',  color: '#ffb300',  pulse: false },
};

// ─── Single card ──────────────────────────────────────────────────────────────

function ExperimentCard({ exp, orgMap }: { exp: Experiment; orgMap: OrgMap }) {
  const st   = STATUS_CFG[exp.status] ?? STATUS_CFG.draft;
  const pct  = exp.slots_total > 0 ? exp.slots_filled / exp.slots_total : 0;
  const cc   = catColor(exp.category);
  const org  = orgMap[exp.experimenter_id];
  const barC = pct >= 0.9 ? '#ffb300' : pct >= 0.5 ? '#b7ff61' : '#29a845';

  return (
    <Link
      href={`/experiments/${exp.id}`}
      className="experiment-card no-underline flex flex-col rounded overflow-hidden"
      style={{
        background: 'var(--bg2)',
        border: '1px solid rgba(77,255,128,0.1)',
        borderLeft: `3px solid ${cc}`,
        transition: 'transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(-3px)';
        el.style.borderColor = `${cc}66`;
        el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${cc}18`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'translateY(0)';
        el.style.borderColor = 'rgba(77,255,128,0.1)';
        el.style.boxShadow = 'none';
        el.style.borderLeft = `3px solid ${cc}`;
      }}
    >
      {/* Identicon banner */}
      <div className="relative overflow-hidden" style={{ height: 110 }}>
        <ExperimentIdenticon
          experimentId={exp.id}
          category={rampKey(exp.category)}
          width={400}
          height={110}
          className="w-full h-full"
        />
        {/* Top-border gradient panel effect */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${cc}55, transparent)`,
          }}
        />

        {/* Verified — bottom-left */}
        {exp.is_verified && (
          <div className="absolute bottom-2 left-2">
            <span
              className="mono badge-verified"
              style={{ boxShadow: '0 0 8px rgba(142,231,255,0.3)', borderColor: '#00e5ff', color: '#00e5ff' }}
            >
              ✓ VERIFIED
            </span>
          </div>
        )}

        {/* Status — bottom-right */}
        <div className="absolute bottom-2 right-2">
          <span
            className="mono text-xs px-2 py-0.5 rounded flex items-center gap-1"
            style={{
              background: 'rgba(7,12,7,0.9)',
              border: `1px solid ${st.color}40`,
              color: st.color,
              backdropFilter: 'blur(4px)',
            }}
          >
            <span className={st.pulse ? 'blink-recruit' : ''}
                  style={{ fontSize: 7 }}>●</span>
            {st.label}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        {/* Category */}
        <p
          className="mono"
          style={{ fontSize: 9, letterSpacing: '0.18em', color: cc, textTransform: 'uppercase' }}
        >
          {exp.category}
        </p>

        {/* Title */}
        <p
          className="font-bold leading-snug"
          style={{
            fontSize: 15,
            color: 'var(--text-white)',
            fontFamily: 'var(--font-heading)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } as React.CSSProperties}
        >
          {exp.title}
        </p>

        {/* Org */}
        {org && (
          <p className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            by {org.org_name}
          </p>
        )}

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(77,255,128,0.07)', marginTop: 4, paddingTop: 8 }}
             className="flex items-end justify-between gap-2 mt-auto">
          {/* Bounty */}
          <p
            className="font-black"
            style={{ fontSize: 22, color: '#b7ff61', fontFamily: 'var(--font-heading)', lineHeight: 1 }}
          >
            ${exp.bounty_per_participant}
          </p>

          {/* Slots */}
          <div className="flex flex-col items-end gap-1">
            <p className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>
              {exp.slots_filled}/{exp.slots_total} slots
            </p>
            <div className="w-20 h-1 rounded overflow-hidden" style={{ background: 'rgba(77,255,128,0.1)' }}>
              <div className="h-1 rounded" style={{ width: `${pct * 100}%`, background: barC }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── "View all" card ──────────────────────────────────────────────────────────

function ViewAllCard({ total }: { total: number }) {
  return (
    <Link
      href="/experiments"
      className="no-underline flex flex-col items-center justify-center rounded transition-all hover:opacity-80 col-span-full"
      style={{
        background: 'var(--bg2)',
        border: '1px dashed rgba(77,255,128,0.18)',
        minHeight: 80,
        marginTop: 4,
      }}
    >
      <p className="mono font-bold" style={{ fontSize: 12, color: '#b7ff61', letterSpacing: '0.12em' }}>
        BROWSE ALL {total} EXPERIMENTS →
      </p>
    </Link>
  );
}

// ─── Row label ────────────────────────────────────────────────────────────────

function RowLabel({ status, color }: { status: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <p
        className="mono"
        style={{ fontSize: 10, letterSpacing: '0.2em', color, textTransform: 'uppercase' }}
      >
        // {status}
      </p>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}30, transparent)` }} />
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  experiments: Experiment[];
  orgMap: OrgMap;
}

// Sort by bounty desc, then slots desc
function sortExps(list: Experiment[]): Experiment[] {
  return [...list].sort((a, b) =>
    b.bounty_per_participant - a.bounty_per_participant ||
    b.slots_total - a.slots_total
  );
}

// Fill to 3 from fallback pool if fewer than 3 in a status
function fillToThree(primary: Experiment[], fallback: Experiment[]): Experiment[] {
  const ids = new Set(primary.map((e) => e.id));
  const extra = fallback.filter((e) => !ids.has(e.id));
  return [...primary, ...extra].slice(0, 3);
}

export function ExperimentGrid({ experiments, orgMap }: Props) {
  const pub = experiments.filter((e) => e.status !== 'draft' && e.status !== 'cancelled');
  const sorted = sortExps(pub);

  const recruiting = sorted.filter((e) => e.status === 'recruiting');
  const active     = sorted.filter((e) => e.status === 'active');
  const completed  = sorted.filter((e) => e.status === 'completed');

  const rowR = fillToThree(recruiting, sorted);
  const rowA = fillToThree(active, sorted);
  const rowC = fillToThree(completed, sorted);

  const rows: { label: string; color: string; items: Experiment[] }[] = [];
  if (rowR.length) rows.push({ label: 'RECRUITING',  color: '#b7ff61', items: rowR });
  if (rowA.length) rows.push({ label: 'ACTIVE',      color: '#00e5ff', items: rowA });
  if (rowC.length) rows.push({ label: 'COMPLETED',   color: '#708878', items: rowC });

  return (
    <section className="px-4 md:px-8 py-8">
      {rows.map(({ label, color, items }) => (
        <div key={label} className="mb-10">
          <RowLabel status={label} color={color} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((exp) => (
              <ExperimentCard key={exp.id} exp={exp} orgMap={orgMap} />
            ))}
          </div>
        </div>
      ))}

      <ViewAllCard total={experiments.length} />
    </section>
  );
}
