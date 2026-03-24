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

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string; blink: boolean }> = {
  recruiting: { label: 'RECRUITING', color: 'var(--green)',    blink: true  },
  active:     { label: 'ACTIVE',     color: 'var(--cyan)',     blink: true  },
  draft:      { label: 'DRAFT',      color: 'var(--text-dim)', blink: false },
  completed:  { label: 'COMPLETED',  color: 'var(--text-dim)', blink: false },
  cancelled:  { label: 'CANCELLED',  color: 'var(--amber)',    blink: false },
};

// Map experiment category to identicon color ramp key
function categoryRampKey(cat: string): string {
  const normalized = cat.toLowerCase().replace(/\s+/g, '-');
  const RAMP_KEYS = ['microbiome', 'nutrition', 'sleep', 'wearables', 'longevity', 'quantified-self'];
  if (RAMP_KEYS.includes(normalized)) return normalized;
  // Fuzzy matches
  if (normalized.includes('sleep') || normalized.includes('recovery')) return 'sleep';
  if (normalized.includes('nutrition') || normalized.includes('diet') || normalized.includes('food')) return 'nutrition';
  if (normalized.includes('micro') || normalized.includes('gut')) return 'microbiome';
  if (normalized.includes('wear') || normalized.includes('device') || normalized.includes('sensor')) return 'wearables';
  if (normalized.includes('longevity') || normalized.includes('aging') || normalized.includes('age')) return 'longevity';
  if (normalized.includes('quant') || normalized.includes('self')) return 'quantified-self';
  return 'default';
}

// ─── Single card ──────────────────────────────────────────────────────────────

function ExperimentCard({ exp, orgMap }: { exp: Experiment; orgMap: OrgMap }) {
  const st  = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.draft;
  const pct = exp.slots_total > 0 ? exp.slots_filled / exp.slots_total : 0;
  const barColor = pct >= 0.9 ? 'var(--amber)' : pct >= 0.5 ? 'var(--green)' : 'var(--green-dim)';
  const org = orgMap[exp.experimenter_id];

  return (
    <Link
      href={`/experiments/${exp.id}`}
      className="no-underline flex flex-col rounded overflow-hidden transition-all hover:scale-[1.01]"
      style={{
        background: 'var(--bg2)',
        border: '1px solid rgba(77,255,128,0.08)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
      }}
    >
      {/* Identicon banner */}
      <div className="relative overflow-hidden" style={{ height: 90 }}>
        <ExperimentIdenticon
          experimentId={exp.id}
          category={categoryRampKey(exp.category)}
          width={360}
          height={90}
          className="w-full h-full"
        />
        {/* Status badge overlay */}
        <div className="absolute top-2 left-2">
          <span
            className="mono text-xs px-2 py-0.5 rounded flex items-center gap-1"
            style={{
              background: 'rgba(7,12,7,0.88)',
              border: `1px solid ${st.color}30`,
              color: st.color,
              backdropFilter: 'blur(4px)',
            }}
          >
            <span className={st.blink ? 'blink' : ''}>●</span>
            {st.label}
          </span>
        </div>
        {/* Verified badge overlay */}
        {exp.is_verified && (
          <div className="absolute top-2 right-2">
            <span className="badge-verified">✓ VERIFIED</span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        {/* Category */}
        <span
          className="mono text-xs self-start px-1.5 py-px rounded"
          style={{
            color: 'var(--cyan)',
            border: '1px solid rgba(0,229,255,0.2)',
            background: 'rgba(0,229,255,0.05)',
          }}
        >
          {exp.category.toUpperCase()}
        </span>

        {/* Title */}
        <p
          className="text-sm font-bold leading-tight"
          style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}
        >
          {exp.title}
        </p>

        {/* Org name */}
        {org && (
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            {org.org_name}
          </p>
        )}

        <div className="mt-auto pt-2 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(77,255,128,0.06)' }}>
          {/* Bounty */}
          <div className="flex items-baseline justify-between">
            <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>REWARD</span>
            <span className="mono text-base font-bold" style={{ color: 'var(--green)' }}>
              ${exp.bounty_per_participant}
            </span>
          </div>

          {/* Slots progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded overflow-hidden" style={{ background: 'rgba(77,255,128,0.1)' }}>
              <div
                className="h-1 rounded transition-all"
                style={{ width: `${pct * 100}%`, background: barColor }}
              />
            </div>
            <span className="mono text-xs tabular-nums flex-shrink-0" style={{ color: 'var(--text-dim)' }}>
              {exp.slots_filled}/{exp.slots_total}
            </span>
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
      className="no-underline flex flex-col items-center justify-center rounded transition-all hover:scale-[1.01]"
      style={{
        background: 'var(--bg2)',
        border: '1px dashed rgba(77,255,128,0.18)',
        minHeight: 220,
      }}
    >
      <span className="mono text-3xl mb-2" style={{ color: 'var(--green)', opacity: 0.6 }}>→</span>
      <p className="mono text-xs font-bold" style={{ color: 'var(--green)' }}>VIEW ALL EXPERIMENTS</p>
      <p className="mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>{total} total</p>
    </Link>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  experiments: Experiment[];
  orgMap: OrgMap;
}

export function ExperimentGrid({ experiments, orgMap }: Props) {
  // Top 9 (the 10th slot is "View all")
  const top = experiments
    .filter((e) => e.status !== 'draft' && e.status !== 'cancelled')
    .slice(0, 9);

  return (
    <section className="px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-5">
        <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
          // TOP_EXPERIMENTS{' '}
          <span style={{ color: 'var(--green)' }}>[{experiments.length}]</span>
        </p>
        <Link href="/experiments" className="mono text-xs no-underline transition-opacity hover:opacity-80" style={{ color: 'var(--green-dim)' }}>
          FULL TABLE →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {top.map((exp) => (
          <ExperimentCard key={exp.id} exp={exp} orgMap={orgMap} />
        ))}
        <ViewAllCard total={experiments.length} />
      </div>
    </section>
  );
}
