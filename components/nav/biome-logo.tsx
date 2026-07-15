// BiomeLogo — Space Grotesk text wordmark (replaces SVG)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BiomeLogo({ width = 120, className }: { width?: number; className?: string }) {
  return (
    <span
      className={className}
      style={{
        fontFamily: 'var(--font-logo), sans-serif',
        fontWeight: 700,
        fontSize: '24px',
        letterSpacing: '3px',
        color: 'var(--teal-dark)',
        textTransform: 'uppercase',
        lineHeight: 1,
      }}
    >
      BIOME
    </span>
  );
}
