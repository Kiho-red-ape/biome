// ExperimentIdenticon — Clean geometric identicon, no glow effects
// Grid: 40 cols × 5 rows, viewBox "0 0 320 80"
// Three horizontal zones: category symbol (left), measurement symbol (middle), hash pattern (right)

const COLS = 40;
const ROWS = 5;
const CELL_W = 8;
const CELL_H = 16;
const SVG_W = COLS * CELL_W; // 320
const SVG_H = ROWS * CELL_H; // 80

// Color ramps per category
const RAMPS: Record<string, { bright: string; mid: string; dark: string }> = {
  microbiome:        { bright: '#b7ff61', mid: '#5a9e2e', dark: '#1a3d0a' },
  nutrition:         { bright: '#8ee7ff', mid: '#3a8ea6', dark: '#0d2d38' },
  sleep:             { bright: '#ffd166', mid: '#a6862e', dark: '#3d2f0a' },
  wearables:         { bright: '#ff8f8f', mid: '#a65555', dark: '#3d1a1a' },
  longevity:         { bright: '#d8c4ff', mid: '#7a5fbf', dark: '#2a1a4d' },
  'quantified-self': { bright: '#88bbff', mid: '#4a72a6', dark: '#1a2d4d' },
};

const DEFAULT_RAMP = { bright: '#b7ff61', mid: '#5a9e2e', dark: '#1a3d0a' };

function getRamp(cat: string) {
  return RAMPS[cat] ?? DEFAULT_RAMP;
}

// ─── Category symbols (LEFT zone: cols 0–11, rows 0–4) ───────────────────────
// Each symbol is an array of [row, col] pairs for lit cells

const CAT_SYMBOLS: Record<string, [number, number][]> = {
  microbiome: [
    // Spiral-like inward pattern
    [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9],
    [1,1],[1,9],
    [2,1],[2,3],[2,4],[2,5],[2,6],[2,9],
    [3,1],[3,3],[3,9],
    [4,1],[4,2],[4,3],[4,9],[4,8],[4,7],[4,6],[4,5],
  ],
  nutrition: [
    // Upward triangle
    [0,5],[0,6],
    [1,4],[1,5],[1,6],[1,7],
    [2,3],[2,4],[2,5],[2,6],[2,7],[2,8],
    [3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[3,8],[3,9],
    [4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],
  ],
  sleep: [
    // Crescent C-curve
    [0,3],[0,4],[0,5],[0,6],[0,7],
    [1,2],[1,7],[1,8],
    [2,2],[2,8],
    [3,2],[3,7],[3,8],
    [4,3],[4,4],[4,5],[4,6],[4,7],
  ],
  wearables: [
    // Zigzag wave across row 2, with dots on rows 1 and 3
    [1,1],[1,4],[1,7],[1,10],
    [2,0],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,8],[2,9],[2,10],[2,11],
    [3,2],[3,5],[3,8],[3,11],
  ],
  longevity: [
    // Hourglass: wide top, narrow middle, wide bottom
    [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9],[0,10],
    [1,2],[1,4],[1,6],[1,8],
    [2,4],[2,5],[2,6],[2,7],
    [3,2],[3,4],[3,6],[3,8],
    [4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],
  ],
  'quantified-self': [
    // Bar chart: 3 vertical bars of different heights
    [2,2],[2,3],
    [1,5],[1,6],[2,5],[2,6],
    [0,8],[0,9],[1,8],[1,9],[2,8],[2,9],
    [3,2],[3,3],[3,5],[3,6],[3,8],[3,9],
    [4,2],[4,3],[4,5],[4,6],[4,8],[4,9],
  ],
};

// ─── Measurement symbols (MIDDLE zone: cols 14–25, rows 0–4) ─────────────────

const MEASURE_SYMBOLS: Record<string, [number, number][]> = {
  microbiome: [
    // Circular dots pattern
    [0,16],[0,17],[0,18],[0,19],[0,20],[0,21],[0,22],[0,23],
    [1,15],[1,24],
    [2,15],[2,24],
    [3,15],[3,24],
    [4,16],[4,17],[4,18],[4,19],[4,20],[4,21],[4,22],[4,23],
  ],
  nutrition: [
    // Leaf/teardrop
    [0,19],[0,20],
    [1,18],[1,21],
    [2,17],[2,22],
    [3,18],[3,21],
    [4,19],[4,20],
  ],
  sleep: [
    // ZZZ pattern (3 small Z shapes)
    [0,15],[0,16],[0,17],
    [1,17],
    [2,15],[2,16],[2,17],
    [3,15],
    [4,15],[4,16],[4,17],
  ],
  wearables: [
    // Sine wave
    [2,14],[1,15],[0,16],[1,17],[2,18],[3,19],[4,20],[3,21],[2,22],[1,23],[0,24],[1,25],
  ],
  longevity: [
    // Helix dots (double strand)
    [0,14],[0,24],
    [1,15],[1,23],
    [2,17],[2,21],
    [3,15],[3,23],
    [4,14],[4,24],
  ],
  'quantified-self': [
    // Scatter plot dots
    [0,15],[0,22],
    [1,18],[1,24],
    [2,16],[2,20],
    [3,14],[3,23],
    [4,17],[4,21],
  ],
};

// ─── Hash-based right pattern (cols 28–39, rows 0–4) ─────────────────────────

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// 4×5 mirrored pattern (cols 28–39 = 12 cols, rows 0–4)
// Use hash bits to determine lit cells in 4×5 half (left side mirrored to right)
function buildRightZone(experimentId: string): [number, number][] {
  const h = hashCode(experimentId);
  const cells: [number, number][] = [];
  // 4 cols (28..31) × 5 rows = 20 bits
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < 4; col++) {
      const bit = row * 4 + col;
      if ((h >> bit) & 1) {
        cells.push([row, 28 + col]);
        cells.push([row, 39 - col]); // mirror
      }
    }
  }
  // Middle column (col 33, col 34)
  const h2 = hashCode(experimentId + '_mid');
  for (let row = 0; row < ROWS; row++) {
    if ((h2 >> row) & 1) {
      cells.push([row, 33]);
      cells.push([row, 34]);
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

export function ExperimentIdenticon({
  experimentId,
  category = 'default',
  // orgName and experimentNumber kept for interface compatibility
  measurement,
  width = '100%',
  height = 80,
}: Props) {
  const rk = category.toLowerCase().replace(/\s+/g, '-');
  const ramp = getRamp(rk);

  // Resolve measurement key: use provided measurement or fall back to category
  const measureKey = measurement
    ? measurement.toLowerCase().replace(/\s+/g, '-')
    : rk;

  // Build lit cell sets
  const leftCells = new Set<string>(
    (CAT_SYMBOLS[rk] ?? CAT_SYMBOLS['microbiome']).map(([r, c]) => `${r},${c}`)
  );
  const midCells = new Set<string>(
    (MEASURE_SYMBOLS[measureKey] ?? MEASURE_SYMBOLS[rk] ?? MEASURE_SYMBOLS['microbiome']).map(
      ([r, c]) => `${r},${c}`
    )
  );
  const rightCellList = buildRightZone(experimentId);
  const rightCells = new Set<string>(rightCellList.map(([r, c]) => `${r},${c}`));

  // Background: category dark at 8% opacity
  const bgColor = ramp.dark;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      style={{ display: 'block' }}
    >
      {/* Background */}
      <rect width={SVG_W} height={SVG_H} fill={bgColor} fillOpacity={0.08} />

      {/* Render all cells */}
      {Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: COLS }, (_, col) => {
          const key = `${row},${col}`;
          const isLeft  = leftCells.has(key);
          const isMid   = midCells.has(key);
          const isRight = rightCells.has(key);
          const isLit   = isLeft || isMid || isRight;

          let fill: string;
          let opacity: number;

          if (isLeft) {
            fill = ramp.bright;
            opacity = 0.85;
          } else if (isMid) {
            fill = ramp.bright;
            opacity = 0.7;
          } else if (isRight) {
            fill = ramp.mid;
            opacity = 0.7;
          } else {
            fill = ramp.dark;
            opacity = 0.05;
          }

          void isLit; // suppress unused warning

          return (
            <rect
              key={key}
              x={col * CELL_W + 0.5}
              y={row * CELL_H + 0.5}
              width={CELL_W - 1}
              height={CELL_H - 1}
              rx="1"
              fill={fill}
              opacity={opacity}
            />
          );
        })
      )}
    </svg>
  );
}
