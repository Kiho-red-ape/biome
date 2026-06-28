// ExperimentIdenticon — Square-cell strip identicon
// Source grid: 60 cols × 8 rows (viewBox "0 0 60 8") — light clinical field around each glyph
// Three 20-col zones; each glyph is 6×6 centered inside its zone (7-col left pad, 1-row top pad)
// Zone layout: cat glyph (cols 7-12) | meas glyph (cols 27-32) | hash glyph (cols 47-52)

// ─── Color ramps (clinical light/teal — lit teal pixels on a light field) ──────
// on  = teal-family pixel color   off = light field cell (teal-faint / bg-page)
const RAMPS: Record<string, { on: string; off: string }> = {
  microbiome:        { on: '#0e7490', off: '#e0f2f7' },
  nutrition:         { on: '#155e75', off: '#e0f2f7' },
  sleep:             { on: '#0e7490', off: '#f0f9fb' },
  wearables:         { on: '#155e75', off: '#f0f9fb' },
  longevity:         { on: '#0e7490', off: '#e0f2f7' },
  'quantified-self': { on: '#155e75', off: '#e0f2f7' },
};
const DEFAULT_RAMP = { on: '#0e7490', off: '#e0f2f7' };
function getRamp(cat: string) { return RAMPS[cat] ?? DEFAULT_RAMP; }

// ─── Category glyphs — 6×6 bounding box, rows 0-5, cols 0-5 ──────────────────

const CAT_GLYPHS: Record<string, [number, number][]> = {
  // Hexagonal ring
  microbiome: [
    [0,1],[0,2],[0,3],[0,4],
    [1,0],[1,5],
    [2,0],[2,5],
    [3,0],[3,5],
    [4,0],[4,5],
    [5,1],[5,2],[5,3],[5,4],
  ],
  // Diamond outline
  nutrition: [
    [0,2],[0,3],
    [1,1],[1,4],
    [2,0],[2,5],
    [3,1],[3,4],
    [4,2],[4,3],
  ],
  // D-shape open right (crescent)
  sleep: [
    [0,1],[0,2],[0,3],[0,4],
    [1,0],[1,1],
    [2,0],
    [3,0],
    [4,0],[4,1],
    [5,1],[5,2],[5,3],[5,4],
  ],
  // ECG / heartbeat zigzag
  wearables: [
    [2,0],[2,2],[2,4],
    [3,1],[3,3],[3,5],
  ],
  // Hourglass outline
  longevity: [
    [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],
    [1,1],[1,2],[1,3],[1,4],
    [2,2],[2,3],
    [3,2],[3,3],
    [4,1],[4,2],[4,3],[4,4],
    [5,0],[5,1],[5,2],[5,3],[5,4],[5,5],
  ],
  // Bar chart — 3 ascending bars
  'quantified-self': [
    [0,4],[0,5],
    [1,4],[1,5],
    [2,2],[2,3],[2,4],[2,5],
    [3,2],[3,3],[3,4],[3,5],
    [4,0],[4,1],[4,2],[4,3],[4,4],[4,5],
    [5,0],[5,1],[5,2],[5,3],[5,4],[5,5],
  ],
};

// ─── Measurement glyphs — same 6×6 grid ───────────────────────────────────────

const MEAS_GLYPHS: Record<string, [number, number][]> = {
  // Full circle (petri dish)
  microbiome: [
    [0,1],[0,2],[0,3],[0,4],
    [1,0],[1,1],[1,2],[1,3],[1,4],[1,5],
    [2,0],[2,5],
    [3,0],[3,5],
    [4,0],[4,1],[4,2],[4,3],[4,4],[4,5],
    [5,1],[5,2],[5,3],[5,4],
  ],
  // Balance / scale
  nutrition: [
    [0,2],[0,3],
    [1,1],[1,2],[1,3],[1,4],
    [2,1],[2,4],
    [3,1],[3,4],
    [4,0],[4,1],[4,2],[4,3],[4,4],[4,5],
    [5,2],[5,3],
  ],
  // Sine wave (half period)
  sleep: [
    [1,0],[1,1],
    [0,2],[0,3],
    [1,4],[1,5],
    [2,5],
    [3,4],[3,5],
    [4,2],[4,3],
    [3,0],[3,1],
    [2,0],
  ],
  // Monitor bezel
  wearables: [
    [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],
    [1,0],[1,5],
    [2,0],[2,2],[2,3],[2,5],
    [3,0],[3,5],
    [4,0],[4,1],[4,2],[4,3],[4,4],[4,5],
    [5,2],[5,3],
  ],
  // Double helix X
  longevity: [
    [0,0],[0,5],
    [1,1],[1,4],
    [2,2],[2,3],
    [3,2],[3,3],
    [4,1],[4,4],
    [5,0],[5,5],
  ],
  // Scatter plot (2×2 dot clusters)
  'quantified-self': [
    [0,0],[0,1],[1,0],[1,1],
    [2,4],[2,5],[3,4],[3,5],
    [4,2],[4,3],[5,2],[5,3],
  ],
};

// ─── Hash glyph — deterministic symmetric 6×6 pattern ─────────────────────────

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildHashGlyph(id: string): [number, number][] {
  const h1 = hashCode(id);
  const h2 = hashCode(id + '_r');
  const cells: [number, number][] = [];
  // 3-wide × 6-tall half, mirrored → 6×6
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 3; col++) {
      const bit = row * 3 + col;
      const lit = bit < 32 ? (h1 >> bit) & 1 : (h2 >> (bit - 32)) & 1;
      if (lit) {
        cells.push([row, col]);
        cells.push([row, 5 - col]);
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
// ViewBox: 60 cols × 8 rows (unchanged — preserves dark padding around glyphs).
// Each glyph is 6×6, centered in its 20×8 zone:
//   col offset = zone_start + (20-6)/2 = zone_start + 7
//   row offset = (8-6)/2 = 1
// Width drives height via aspect ratio (60:8 = 7.5:1).

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

  // Each zone is 20 cols wide. Glyph (6×6) is centered: col offset +7, row offset +1.
  const Z1 = 7;   // zone 1 glyph col start (zone 0-19, center at 10, 6-wide → start at 7)
  const Z2 = 27;  // zone 2 glyph col start (zone 20-39, center at 30 → start at 27)
  const Z3 = 47;  // zone 3 glyph col start (zone 40-59, center at 50 → start at 47)
  const ROW0 = 1; // row offset: 1 row dark padding top and bottom

  // Build lit-cell lookup: key = "row,col"
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
          opacity={isLit ? 0.92 : 0.6}
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
      <rect width={COLS} height={ROWS} fill="#f8fafc" />
      {rects}
    </svg>
  );
}
