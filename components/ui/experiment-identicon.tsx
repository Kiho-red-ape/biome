'use client';

// ExperimentIdenticon — deterministic 12×5 heatmap banner
// Symmetric vertically (rows 0-4 mirror: row 0↔4, row 1↔3, row 2 is center)
// Color ramps per category

const CATEGORY_RAMPS: Record<string, [string, string, string, string]> = {
  microbiome:       ['#0a2a0a', '#1a5c1a', '#2d9e2d', '#4dff80'],
  nutrition:        ['#001a1a', '#005f5f', '#00b3b3', '#00e5ff'],
  sleep:            ['#1a1000', '#5c3a00', '#b37200', '#ffb300'],
  wearables:        ['#1a0a00', '#6b2000', '#cc4400', '#ff6633'],
  longevity:        ['#12001a', '#4a0066', '#9900cc', '#cc66ff'],
  'quantified-self':['#00001a', '#00006b', '#0000cc', '#3399ff'],
  default:          ['#0d1a0d', '#1f4d2a', '#2d7a3a', '#4dff80'],
};

function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

// Produce a seeded pseudo-random float [0,1)
function seededRand(seed: number, index: number): number {
  let s = (seed ^ (index * 2654435761)) >>> 0;
  s = ((s >> 16) ^ s) >>> 0;
  s = (s * 0x45d9f3b) >>> 0;
  s = ((s >> 16) ^ s) >>> 0;
  return s / 0xffffffff;
}

const COLS = 12;
const ROWS = 5; // rows 0-4; symmetric: 0↔4, 1↔3, 2=center

interface Props {
  experimentId: string;
  category?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ExperimentIdenticon({
  experimentId,
  category = 'default',
  width = 360,
  height = 135, // 8:3 ratio
  className,
}: Props) {
  const ramp = CATEGORY_RAMPS[category] ?? CATEGORY_RAMPS['default'];
  const seed = hashStr(experimentId);

  // Build 12×3 unique grid (rows 0-2), then mirror for rows 3-4
  const halfRows = Math.ceil(ROWS / 2); // 3 unique rows
  const cells: number[] = []; // intensity 0-3 for each cell in 12×5

  for (let row = 0; row < halfRows; row++) {
    for (let col = 0; col < COLS; col++) {
      const r = seededRand(seed, row * COLS + col);
      // Weight toward brighter for center row
      const bias = row === Math.floor(ROWS / 2) ? 0.2 : 0;
      const val = Math.min(3, Math.floor((r + bias) * 4));
      cells[row * COLS + col] = val;
    }
  }

  // Build full 5-row grid by mirroring
  const grid: number[] = [];
  for (let row = 0; row < ROWS; row++) {
    const srcRow = row < halfRows ? row : ROWS - 1 - row;
    for (let col = 0; col < COLS; col++) {
      grid[row * COLS + col] = cells[srcRow * COLS + col];
    }
  }

  const cellW = width / COLS;
  const cellH = height / ROWS;
  const gap = 1.5;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Background */}
      <rect width={width} height={height} fill="#060d06" />

      {grid.map((intensity, idx) => {
        const col = idx % COLS;
        const row = Math.floor(idx / COLS);
        const x = col * cellW + gap / 2;
        const y = row * cellH + gap / 2;
        const w = cellW - gap;
        const h = cellH - gap;
        const color = ramp[intensity];
        return (
          <rect
            key={idx}
            x={x}
            y={y}
            width={w}
            height={h}
            fill={color}
            rx="2"
          />
        );
      })}

      {/* Subtle scan-line overlay */}
      <rect width={width} height={height} fill="url(#scanlines)" opacity="0.18" />
      <defs>
        <pattern id="scanlines" width={width} height="2" patternUnits="userSpaceOnUse">
          <rect width={width} height="1" fill="black" />
        </pattern>
      </defs>
    </svg>
  );
}
