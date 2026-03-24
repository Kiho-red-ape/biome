interface Props {
  stats: {
    totalBountyPool: number;
    activeCount: number;
    totalParticipants: number;
    totalEarned: number;
  };
  experimentCount: number;
}

function fmtPool(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function HeroCompact({ stats, experimentCount }: Props) {
  return (
    <section
      style={{
        padding: '20px 40px',
        borderBottom: '1px solid rgba(183,255,97,0.08)',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Eyebrow */}
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '4px',
        color: '#b7ff61',
        textTransform: 'uppercase',
        marginBottom: 4,
        lineHeight: 1,
      }}>
        // CITIZEN_SCIENCE_LAYER
      </p>

      {/* Headline */}
      <h1 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 38,
        fontWeight: 700,
        color: '#eef4f0',
        letterSpacing: '-0.01em',
        lineHeight: 1.15,
        marginBottom: 4,
      }}>
        Browse. Participate.{' '}
        <span style={{ color: '#b7ff61' }}>Get Paid.</span>
      </h1>

      {/* Sub */}
      <p style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 14,
        color: '#7f8e87',
        lineHeight: 1,
        marginBottom: 6,
      }}>
        Explore open studies, join research that matches your profile.
      </p>

      {/* Inline stats */}
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: '#4a7055',
        letterSpacing: '0.04em',
        lineHeight: 1,
      }}>
        <span style={{ color: '#aab8b1' }}>{experimentCount}</span>
        {' experiments · '}
        <span style={{ color: '#aab8b1' }}>{fmtPool(stats.totalBountyPool)}</span>
        {' pool · '}
        <span style={{ color: '#aab8b1' }}>{stats.totalParticipants.toLocaleString()}</span>
        {' participants'}
      </p>
    </section>
  );
}
