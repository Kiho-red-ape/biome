// ExperimentIdenticon — 40×5 heatmap banner with alphanumeric code overlay
// Grid: 40 cols × 5 rows, 8px × 16px per cell, viewBox "0 0 320 80"
// Horizontal symmetry: col 0 mirrors col 39, col 1 mirrors col 38, etc.
// Alphanumeric code: [CategoryLetter][OrgLetter][##] centered on grid

const COLS = 40;
const ROWS = 5;
const CELL_W = 8;
const CELL_H = 16;
const SVG_W = COLS * CELL_W; // 320
const SVG_H = ROWS * CELL_H; // 80
const HALF_COLS = COLS / 2;  // 20 unique cols, mirrored to right

// Category ramps: [bright, mid, dark]
const CATEGORY_RAMPS: Record<string, [string, string, string]> = {
  microbiome:        ['#b7ff61', '#5a9e2e', '#1a3d0a'],
  nutrition:         ['#8ee7ff', '#3a8ea6', '#0d2d38'],
  sleep:             ['#ffd166', '#a6862e', '#3d2f0a'],
  wearables:         ['#ff8f8f', '#a65555', '#3d1a1a'],
  longevity:         ['#d8c4ff', '#7a5fbf', '#2a1a4d'],
  'quantified-self': ['#88bbff', '#4a72a6', '#1a2d4d'],
  default:           ['#b7ff61', '#5a9e2e', '#1a3d0a'],
};

// Category first-letter map
const CAT_LETTER: Record<string, string> = {
  microbiome:        'M',
  nutrition:         'N',
  sleep:             'S',
  wearables:         'W',
  longevity:         'L',
  'quantified-self': 'Q',
  default:           'X',
};

function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (Math.imul(h, 0x01000193)) >>> 0;
  }
  return h;
}

function seededRand(seed: number, index: number): number {
  let s = (seed ^ Math.imul(index, 2654435761)) >>> 0;
  s = (Math.imul((s >> 16) ^ s, 0x45d9f3b)) >>> 0;
  s = ((s >> 16) ^ s) >>> 0;
  return s / 0xffffffff;
}

interface Props {
  experimentId: string;
  category?: string;
  orgName?: string;
  experimentNumber?: number;
  width?: string | number;
  height?: number;
}

export function ExperimentIdenticon({
  experimentId,
  category = 'default',
  orgName = '',
  experimentNumber = 1,
  width = '100%',
  height = 80,
}: Props) {
  const rampKey = category.toLowerCase().replace(/\s+/g, '-');
  const ramp = CATEGORY_RAMPS[rampKey] ?? CATEGORY_RAMPS['default'];
  const seed = hashStr(experimentId);

  // Build left half (cols 0–19) for each row
  type CellData = { fill: string; opacity: number };
  const cells: CellData[][] = [];

  for (let row = 0; row < ROWS; row++) {
    cells[row] = [];
    for (let col = 0; col < COLS; col++) {
      // Mirror: col ≥ 20 mirrors (39 - col)
      const srcCol = col < HALF_COLS ? col : COLS - 1 - col;
      const r = seededRand(seed, row * HALF_COLS + srcCol);

      // Determine filled vs empty
      const threshold = 0.45; // ~55% fill rate
      if (r > threshold) {
        // Filled — pick ramp stop based on secondary hash
        const r2 = seededRand(seed + 1, row * HALF_COLS + srcCol);
        let fill: string;
        if (r2 < 0.25)      fill = ramp[2]; // dark
        else if (r2 < 0.60) fill = ramp[1]; // mid
        else                 fill = ramp[0]; // bright
        // Opacity 30–80% based on r
        const opacity = 0.3 + (r - threshold) / (1 - threshold) * 0.5;
        cells[row].push({ fill, opacity });
      } else {
        // Empty — darkest stop at 5–8%
        const r3 = seededRand(seed + 2, row * HALF_COLS + srcCol);
        cells[row].push({ fill: ramp[2], opacity: 0.05 + r3 * 0.03 });
      }
    }
  }

  // Build alphanumeric code: [CatLetter][OrgLetter][##]
  const catLetter = CAT_LETTER[rampKey] ?? 'X';
  const orgLetter = orgName.trim().length > 0 ? orgName.trim()[0].toUpperCase() : 'B';
  const numStr = experimentNumber.toString().padStart(2, '0');
  const code = `${catLetter}${orgLetter}${numStr}`;

  // Text zone columns (center 16 cols: 12–27) — dim these cells for readability
  const TEXT_COL_START = 11;
  const TEXT_COL_END   = 28;

  // Category bright color at 90% opacity for text
  const textColor = ramp[0];

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
      <rect width={SVG_W} height={SVG_H} fill="#050709" />

      {/* Grid cells */}
      {cells.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const inTextZone = colIdx >= TEXT_COL_START && colIdx <= TEXT_COL_END;
          const finalOpacity = inTextZone ? Math.min(cell.opacity, 0.15) : cell.opacity;
          return (
            <rect
              key={`${rowIdx}-${colIdx}`}
              x={colIdx * CELL_W}
              y={rowIdx * CELL_H}
              width={CELL_W}
              height={CELL_H}
              fill={cell.fill}
              opacity={finalOpacity}
            />
          );
        })
      )}

      {/* Faint cell border texture overlay */}
      {cells.map((row, rowIdx) =>
        row.map((_, colIdx) => (
          <rect
            key={`border-${rowIdx}-${colIdx}`}
            x={colIdx * CELL_W}
            y={rowIdx * CELL_H}
            width={CELL_W}
            height={CELL_H}
            fill="none"
            stroke={ramp[0]}
            strokeWidth="0.5"
            opacity={0.04}
          />
        ))
      )}

      {/* Alphanumeric code — centered */}
      <text
        x={SVG_W / 2}
        y={SVG_H / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'DM Mono', monospace"
        fontSize={28}
        fontWeight={500}
        fill={textColor}
        opacity={0.9}
        style={{ letterSpacing: '4px' }}
      >
        {code}
      </text>

      {/* Scanline overlay */}
      <rect width={SVG_W} height={SVG_H} fill="url(#scan)" opacity="0.1" />
      <defs>
        <pattern id={`scan-${experimentId.slice(0, 8)}`} width={SVG_W} height="2" patternUnits="userSpaceOnUse">
          <rect width={SVG_W} height="1" fill="black" />
        </pattern>
      </defs>
    </svg>
  );
}
