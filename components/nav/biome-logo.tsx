// BIOME wordmark — exact geometric stroke SVG
// viewBox 0 0 420 90 · stroke #b7ff61 · round linecap/join
export function BiomeLogo({ width = 120, className }: { width?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 420 90"
      width={width}
      aria-label="BIOME"
      className={className}
      fill="none"
      stroke="#b7ff61"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* B */}
      <polyline points="15,8 15,82" />
      <polyline points="15,8 42,8 58,22 42,40 15,40" />
      <polyline points="15,42 45,42 62,58 42,82 15,82" />

      {/* I */}
      <line x1="82" y1="8" x2="86" y2="82" />

      {/* O — diamond with slash */}
      <polygon points="110,45 138,8 168,45 138,82" />
      <line x1="118" y1="68" x2="158" y2="22" />

      {/* M */}
      <polyline points="192,82 196,8 228,62 260,8 264,82" />

      {/* E */}
      <polyline points="350,8 290,8" />
      <line x1="290" y1="8" x2="292" y2="82" />
      <line x1="292" y1="82" x2="350" y2="82" />
      <line x1="290" y1="44" x2="340" y2="44" />
      <line x1="350" y1="8" x2="368" y2="28" />
    </svg>
  );
}
