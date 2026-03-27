interface Props {
  stats: {
    totalBountyPool: number;
    activeCount: number;
    totalParticipants: number;
    totalEarned: number;
  };
  experimentCount: number;
}

export function HeroCompact({ stats, experimentCount }: Props) {
  void stats;
  void experimentCount;

  return (
    <section
      className="px-4 sm:px-10"
      style={{
        paddingTop: 20,
        paddingBottom: 40,
        borderBottom: '1px solid rgba(183,255,97,0.08)',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Eyebrow */}
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: '3px',
        color: '#b7ff61',
        textTransform: 'uppercase',
        marginBottom: 6,
        lineHeight: 1,
      }}>
        // HUMAN_STUDIES_MARKETPLACE
      </p>

      {/* Headline — 28px on mobile, clamp up on desktop */}
      <h1 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'clamp(28px, 3vw, 42px)',
        fontWeight: 700,
        color: '#eef4f0',
        letterSpacing: '-0.01em',
        lineHeight: 1.15,
        marginBottom: 6,
      }}>
        Find studies. Join remotely.{' '}
        <span style={{ color: '#b7ff61' }}>Get paid.</span>
      </h1>

      {/* Subhead — allow wrapping on mobile */}
      <p style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'clamp(13px, 1.5vw, 14px)',
        color: '#7f8e87',
        lineHeight: 1.4,
        marginBottom: 14,
        maxWidth: 800,
      }}>
        Browse paid research studies and clinical trials — or recruit screened participants for your next study.
      </p>

      {/* CTA buttons — stack on mobile, side-by-side on sm+ */}
      <div className="flex flex-col sm:flex-row" style={{ gap: 8, marginBottom: 12 }}>
        <a
          href="/experiments"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: '#070c07',
            background: '#b7ff61',
            border: '1px solid #b7ff61',
            padding: '0 20px',
            textDecoration: 'none',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 44,
          }}
        >
          Browse Studies →
        </a>
        <a
          href="/post"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: '#b7ff61',
            background: 'transparent',
            border: '1px solid rgba(183,255,97,0.3)',
            padding: '0 20px',
            textDecoration: 'none',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 44,
          }}
        >
          Post a Study →
        </a>
      </div>

      {/* Chips row — wrap on mobile */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['Paid participation', 'Remote studies', 'Screened applicants'].map((chip) => (
          <span
            key={chip}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: '#7f8e87',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '4px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 2,
              lineHeight: 1,
            }}
          >
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}
