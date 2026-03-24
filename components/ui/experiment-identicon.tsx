// ExperimentIdenticon — Square-cell strip identicon
// Source grid: 60 cols × 8 rows (viewBox "0 0 60 8")
// Height self-sizes from width via aspect ratio (~44–52px at typical card widths)
// Three zones: category glyph (cols 0-19) | measurement glyph (cols 20-39) | hash glyph (cols 40-59)
// Cells: 0.86×0.86 logical units with 0.07 gap on each side (~0.5px gap at 6px/unit scale)

// ─── Color ramps (muted, flat — not bright) ───────────────────────────────────
const RAMPS: Record<string, { on: string; off: string }> = {
  microbiome:        { on: '#3d7a1c', off: '#0a1e06' },
  nutrition:         { on: '#2a6e87', off: '#071a22' },
  sleep:             { on: '#8a5f1a', off: '#271a05' },
  wearables:         { on: '#8c3232', off: '#280e0e' },
  longevity:         { on: '#5a42a6', off: '#160e33' },
  'quantified-self': { on: '#3a5a94', off: '#0e1628' },
};
const DEFAULT_RAMP = { on: '#3d7a1c', off: '#0a1e06' };
function getRamp(cat: string) { return RAMPS[cat] ?? DEFAULT_RAMP; }

// ─── Category glyphs — local coords [row, col], 0-indexed, 16×6 bounding box ─
// Rendered at: abs_row = local_row + 1,  abs_col = local_col + zone_start + 2

const CAT_GLYPHS: Record<string, [number, number][]> = {
  // Hexagonal ring
  microbiome: [
    [0,4],[0,5],[0,6],[0,7],[0,8],[0,9],[0,10],[0,11],
    [1,2],[1,3],[1,12],[1,13],
    [2,2],[2,3],[2,12],[2,13],
    [3,2],[3,3],[3,12],[3,13],
    [4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],
  ],
  // Diamond outline
  nutrition: [
    [0,7],[0,8],
    [1,5],[1,6],[1,9],[1,10],
    [2,3],[2,4],[2,11],[2,12],
    [3,5],[3,6],[3,9],[3,10],
    [4,7],[4,8],
  ],
  // Crescent D-shape (open right)
  sleep: [
    [0,4],[0,5],[0,6],[0,7],[0,8],[0,9],
    [1,2],[1,3],[1,10],[1,11],
    [2,2],[2,3],
    [3,2],[3,3],
    [4,2],[4,3],[4,10],[4,11],
    [5,4],[5,5],[5,6],[5,7],[5,8],[5,9],
  ],
  // ECG / heartbeat pulse
  wearables: [
    [2,0],[2,1],[2,2],[2,3],
    [1,4],
    [0,5],[0,6],
    [1,7],
    [2,8],[2,9],
    [3,10],[3,11],
    [2,12],[2,13],[2,14],[2,15],
  ],
  // Hourglass outline
  longevity: [
    [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9],[0,10],[0,11],[0,12],[0,13],[0,14],
    [1,3],[1,4],[1,11],[1,12],
    [2,6],[2,7],[2,8],[2,9],
    [3,6],[3,7],[3,8],[3,9],
    [4,3],[4,4],[4,11],[4,12],
    [5,1],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[5,9],[5,10],[5,11],[5,12],[5,13],[5,14],
  ],
  // Bar chart (4 bars, ascending right)
  'quantified-self': [
    [5,0],[5,1],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[5,9],[5,10],[5,11],[5,12],[5,13],[5,14],[5,15],
    [4,0],[4,1],[4,4],[4,5],[4,8],[4,9],[4,12],[4,13],
    [3,4],[3,5],[3,8],[3,9],[3,12],[3,13],
    [2,8],[2,9],[2,12],[2,13],
    [1,12],[1,13],
    [0,12],[0,13],
  ],
};

// ─── Measurement glyphs — same 16×6 local grid ───────────────────────────────

const MEAS_GLYPHS: Record<string, [number, number][]> = {
  // Full circle (petri dish)
  microbiome: [
    [0,4],[0,5],[0,6],[0,7],[0,8],[0,9],[0,10],[0,11],
    [1,2],[1,3],[1,12],[1,13],
    [2,1],[2,2],[2,13],[2,14],
    [3,1],[3,2],[3,13],[3,14],
    [4,2],[4,3],[4,12],[4,13],
    [5,4],[5,5],[5,6],[5,7],[5,8],[5,9],[5,10],[5,11],
  ],
  // Balance / scale
  nutrition: [
    [0,7],[0,8],
    [1,5],[1,6],[1,7],[1,8],[1,9],[1,10],
    [2,3],[2,4],[2,7],[2,8],[2,11],[2,12],
    [3,2],[3,3],[3,12],[3,13],
    [4,7],[4,8],
    [5,5],[5,6],[5,7],[5,8],[5,9],[5,10],
  ],
  // Smooth sine wave
  sleep: [
    [2,0],[2,1],
    [1,2],[1,3],
    [0,4],[0,5],
    [1,6],[1,7],
    [2,8],[2,9],
    [3,10],[3,11],
    [4,12],[4,13],
    [3,14],[3,15],
  ],
  // Display bezel / monitor
  wearables: [
    [0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9],[0,10],[0,11],[0,12],[0,13],
    [1,2],[1,3],[1,12],[1,13],
    [2,2],[2,3],[2,6],[2,7],[2,8],[2,9],[2,12],[2,13],
    [3,2],[3,3],[3,12],[3,13],
    [4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13],
    [5,5],[5,6],[5,7],[5,8],[5,9],[5,10],
  ],
  // Double helix cross-section dots
  longevity: [
    [0,2],[0,3],[0,12],[0,13],
    [1,4],[1,5],[1,10],[1,11],
    [2,6],[2,7],[2,8],[2,9],
    [3,4],[3,5],[3,10],[3,11],
    [4,2],[4,3],[4,12],[4,13],
    [5,4],[5,5],[5,10],[5,11],
  ],
  // Scatter plot
  'quantified-self': [
    [0,2],[0,3],[0,12],[0,13],
    [1,2],[1,3],[1,12],[1,13],
    [2,6],[2,7],
    [3,6],[3,7],
    [4,4],[4,5],[4,10],[4,11],
    [5,4],[5,5],[5,10],[5,11],
  ],
};

// ─── Hash glyph — deterministic symmetric 16×6 pattern for zone 3 ─────────────

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildHashGlyph(id: string): [number, number][] {
  const h1 = hashCode(id);
  const h2 = hashCode(id + '_r');
  const cells: [number, number][] = [];
  // 8-wide × 6-tall half, mirrored → 16 wide × 6
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 8; col++) {
      const bit = row * 8 + col;
      const lit = bit < 32 ? (h1 >> bit) & 1 : (h2 >> (bit - 32)) & 1;
      if (lit) {
        cells.push([row, col]);
        cells.push([row, 15 - col]);
      }
    }
  }
  return cells;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  experimentId: string;
  category?: string;
  orgName?: string;
  experimentNumber?: number;
  measurement?: string;
  width?: string | number;
  height?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
// ViewBox: 60 cols × 8 rows. Width drives height via aspect ratio (60:8 = 7.5:1).
// At card width ~330px → height ≈ 44px; at ~390px → height ≈ 52px. ✓

const COLS = 60;
const ROWS = 8;
const G = 0.07; // gap on each side of each cell in logical units

export function ExperimentIdenticon({
  experimentId,
  category = 'microbiome',
  measurement,
}: Props) {
  const rk = (category ?? '').toLowerCase().replace(/\s+/g, '-');
  const catKey = RAMPS[rk] ? rk : 'microbiome';
  const ramp = getRamp(catKey);

  const measKey = (() => {
    const mk = (measurement ?? '').toLowerCase().replace(/\s+/g, '-');
    return MEAS_GLYPHS[mk] ? mk : catKey;
  })();

  // Zone column starts (each zone = 20 cols; glyph at +2 within zone)
  const Z1 = 2;   // zone 1 col start
  const Z2 = 22;  // zone 2 col start
  const Z3 = 42;  // zone 3 col start
  const ROW0 = 1; // row offset (1 row top padding)

  // Build lit-cell lookup: key = "row,col" → zone id
  const litMap = new Map<string, 'cat' | 'meas' | 'hash'>();

  for (const [r, c] of (CAT_GLYPHS[catKey] ?? CAT_GLYPHS['microbiome'])) {
    litMap.set(`${r + ROW0},${c + Z1}`, 'cat');
  }
  for (const [r, c] of (MEAS_GLYPHS[measKey] ?? MEAS_GLYPHS['microbiome'])) {
    litMap.set(`${r + ROW0},${c + Z2}`, 'meas');
  }
  for (const [r, c] of buildHashGlyph(experimentId)) {
    litMap.set(`${r + ROW0},${c + Z3}`, 'hash');
  }

  const rects: React.ReactElement[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const zone = litMap.get(`${row},${col}`);
      const isLit = zone !== undefined;
      rects.push(
        <rect
          key={`${row},${col}`}
          x={col + G}
          y={row + G}
          width={1 - G * 2}
          height={1 - G * 2}
          fill={isLit ? ramp.on : ramp.off}
          opacity={isLit ? 0.88 : 0.14}
        />
      );
    }
  }

  return (
    <svg
      viewBox={`0 0 ${COLS} ${ROWS}`}
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <rect width={COLS} height={ROWS} fill={ramp.off} opacity={0.35} />
      {rects}
    </svg>
  );
}
