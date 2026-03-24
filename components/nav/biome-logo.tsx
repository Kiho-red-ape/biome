export function BiomeLogo({ width = 130, className }: { width?: number; className?: string }) {
  // TT Carvist Bold-inspired: thick strokes, geometric construction, white
  // viewBox 0 0 263 58 — rendered at ~130px wide gives ~29px tall (nav-appropriate)
  return (
    <svg
      viewBox="0 0 263 58"
      width={width}
      aria-label="BIOME"
      className={className}
      fill="none"
      stroke="white"
      strokeWidth="10"
      strokeLinecap="square"
      strokeLinejoin="miter"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── B ─────────────────────────────────────────────────────── */}
      {/* left vertical stem */}
      <line x1="10" y1="5" x2="10" y2="53" />
      {/* top bump — smaller */}
      <path
        d="M 10,5 L 28,5 Q 56,5 56,17 Q 56,29 28,29 L 10,29"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* bottom bump — slightly larger */}
      <path
        d="M 28,29 Q 60,29 60,41 Q 60,53 28,53 L 10,53"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* ── I ─────────────────────────────────────────────────────── */}
      <line x1="78" y1="5" x2="78" y2="53" />

      {/* ── O ─────────────────────────────────────────────────────── */}
      {/* clean oval — stroke gives the ring weight */}
      <ellipse cx="113" cy="29" rx="20" ry="24" />

      {/* ── M ─────────────────────────────────────────────────────── */}
      {/* V-notch at ~60% down (y ≈ 34) */}
      <polyline points="150,53 150,5 175,34 200,5 200,53" />

      {/* ── E ─────────────────────────────────────────────────────── */}
      <line x1="218" y1="5" x2="218" y2="53" />
      {/* top bar — full width */}
      <line x1="218" y1="5" x2="258" y2="5" />
      {/* middle bar — slightly shorter */}
      <line x1="218" y1="29" x2="250" y2="29" />
      {/* bottom bar — full width */}
      <line x1="218" y1="53" x2="258" y2="53" />
    </svg>
  );
}
