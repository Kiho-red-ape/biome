import Link from 'next/link';

interface Props {
  stats: {
    totalBountyPool: number;
    activeCount: number;
    totalParticipants: number;
    totalEarned: number;
  };
  experimentCount: number;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function HeroCompact({ stats, experimentCount }: Props) {
  return (
    <section
      className="px-6 md:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      style={{ borderBottom: '1px solid rgba(77,255,128,0.08)' }}
    >
      {/* One-liner headline */}
      <div className="flex items-baseline gap-3 flex-wrap">
        <p
          className="mono text-xs"
          style={{ color: 'var(--text-dim)', letterSpacing: '0.1em' }}
        >
          // OPEN_EXPERIMENT_MARKETPLACE
        </p>
        <h1
          className="text-base font-black"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-white)', margin: 0 }}
        >
          Browse, participate,{' '}
          <span style={{ color: 'var(--green)' }}>get paid.</span>
        </h1>
      </div>

      {/* Inline stat pills */}
      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
        {[
          { label: 'ACTIVE',    value: String(stats.activeCount)       },
          { label: 'POOL',      value: fmt(stats.totalBountyPool)       },
          { label: 'EARNED',    value: fmt(stats.totalEarned)           },
          { label: 'STUDIES',   value: String(experimentCount)          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded"
            style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.1)' }}
          >
            <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{s.label}</span>
            <span className="mono text-xs font-bold" style={{ color: 'var(--text-white)' }}>{s.value}</span>
          </div>
        ))}
        <Link
          href="/post"
          className="mono text-xs px-3 py-1 rounded no-underline transition-all hover:opacity-90"
          style={{ background: 'var(--green)', color: '#050709', fontWeight: 700 }}
        >
          POST BOUNTY →
        </Link>
      </div>
    </section>
  );
}
