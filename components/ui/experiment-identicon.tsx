'use client';

// ExperimentIdenticon — deterministic 8×25 heatmap banner (denser than 5×12)
// Symmetric vertically (rows 0↔7, 1↔6, 2↔5, 3↔4)
// Category color ramps — 4 intensity levels

const CATEGORY_RAMPS: Record<string, [string, string, string, string]> = {
  microbiome:        ['#061406', '#0e3a0e', '#1f7a1f', '#b7ff61'],
  nutrition:         ['#001414', '#004c4c', '#009999', '#00e5ff'],
  sleep:             ['#140e00', '#4a3000', '#997a00', '#ffb300'],
  wearables:         ['#140600', '#4a1800', '#993300', '#ff6633'],
  longevity:         ['#0e0014', '#36004a', '#730099', '#d8c4ff'],
  'quantified-self': ['#000614', '#00184a', '#003599', '#88bbff'],
  default:           ['#060d06', '#133313', '#267a26', '#b7ff61'],
};

function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function seededRand(seed: number, index: number): number {
  let s = (seed ^ Math.imul(index, 2654435761)) >>> 0;
  s = (Math.imul((s >> 16) ^ s, 0x45d9f3b)) >>> 0;
  s = ((s >> 16) ^ s) >>> 0;
  return s / 0xffffffff;
}

const COLS = 25;
const ROWS = 8;
const HALF = ROWS / 2; // 4 unique rows (0-3), mirror to rows 4-7

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
  height = 135,
  className,
}: Props) {
  const ramp = CATEGORY_RAMPS[category] ?? CATEGORY_RAMPS['default'];
  const seed = hashStr(experimentId);

  // Build unique top-half (rows 0-3)
  const topHalf: number[] = [];
  for (let row = 0; row < HALF; row++) {
    for (let col = 0; col < COLS; col++) {
      const r = seededRand(seed, row * COLS + col);
      // Center rows (2-3) biased brighter
      const bias = row >= HALF - 2 ? 0.15 : 0;
      topHalf[row * COLS + col] = Math.min(3, Math.floor((r + bias) * 4));
    }
  }

  // Build full 8-row grid by mirroring: row i mirrors row (ROWS-1-i)
  const grid: number[] = [];
  for (let row = 0; row < ROWS; row++) {
    const srcRow = row < HALF ? row : ROWS - 1 - row;
    for (let col = 0; col < COLS; col++) {
      grid[row * COLS + col] = topHalf[srcRow * COLS + col];
    }
  }

  const cellW = width / COLS;
  const cellH = height / ROWS;
  const gap   = 1;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width={width} height={height} fill="#050d05" />

      {grid.map((intensity, idx) => {
        const col = idx % COLS;
        const row = Math.floor(idx / COLS);
        return (
          <rect
            key={idx}
            x={col * cellW + gap / 2}
            y={row * cellH + gap / 2}
            width={cellW - gap}
            height={cellH - gap}
            fill={ramp[intensity]}
            rx="1"
          />
        );
      })}

      {/* Scanline overlay */}
      <rect width={width} height={height} fill="url(#sl)" opacity="0.14" />
      <defs>
        <pattern id="sl" width={width} height="2" patternUnits="userSpaceOnUse">
          <rect width={width} height="1" fill="black" />
        </pattern>
      </defs>
    </svg>
  );
}
