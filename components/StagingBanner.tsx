export default function StagingBanner() {
  if (process.env.NEXT_PUBLIC_IS_STAGING !== 'true') return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          minHeight: '36px',
          backgroundColor: '#1a1a2e',
          borderBottom: '1px solid rgba(142, 231, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 16px',
          gap: '8px',
          flexWrap: 'wrap',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', 'JetBrains Mono', monospace",
            fontSize: '11px',
            color: '#8ee7ff',
            lineHeight: '1.4',
          }}
        >
          You are viewing a staging environment with sample data.
        </span>
        <a
          href="https://biome.to"
          style={{
            fontFamily: "'DM Mono', 'JetBrains Mono', monospace",
            fontSize: '11px',
            color: '#b7ff61',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
          className="link-hover-underline"
        >
          Visit the live site →
        </a>
      </div>
      {/* Spacer so content is pushed down by banner height */}
      <div style={{ minHeight: '36px' }} aria-hidden="true" />
    </>
  );
}
