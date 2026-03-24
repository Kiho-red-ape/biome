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
      className="px-6 md:px-10 pt-10 pb-8"
      style={{ borderBottom: '1px solid rgba(77,255,128,0.07)' }}
    >
      {/* Eyebrow */}
      <p
        className="mono mb-3"
        style={{ fontSize: 10, letterSpacing: '0.25em', color: 'var(--text-dim)', textTransform: 'uppercase' }}
      >
        // CITIZEN_SCIENCE_LAYER
      </p>

      {/* Headline */}
      <h1
        className="font-black leading-none mb-4"
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(32px, 5vw, 48px)',
          letterSpacing: '-0.03em',
          color: 'var(--text-white)',
        }}
      >
        Browse. Participate.{' '}
        <span style={{ color: 'var(--green)' }}>Get Paid.</span>
      </h1>

      {/* Sub-hero */}
      <p
        className="mb-6 leading-relaxed"
        style={{
          fontSize: 15,
          color: 'var(--text-dim)',
          maxWidth: 600,
          fontFamily: 'var(--font-heading)',
        }}
      >
        Explore open studies, join research that matches your profile, and earn
        rewards for eligible participation.
      </p>

      {/* Inline stats */}
      <p
        className="mono"
        style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.04em' }}
      >
        <span style={{ color: 'var(--text-bright)' }}>{experimentCount}</span> experiments
        {' · '}
        <span style={{ color: 'var(--text-bright)' }}>{fmt(stats.totalBountyPool)}</span> pool
        {' · '}
        <span style={{ color: 'var(--text-bright)' }}>{stats.totalParticipants.toLocaleString()}</span> participants
      </p>
    </section>
  );
}
