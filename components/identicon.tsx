// Deterministic identicon for participant IDs.
// Server-compatible — no hooks, pure computation → SVG.
// Same participant_id always produces the same visual.

const ACCENTS = ['#4dff80', '#00e5ff', '#ffb300', '#1f8c3b'] as const;
const BG = '#0b120b'; // --bg2

function hash(s: string): number[] {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h, 33) ^ s.charCodeAt(i);
    h = h >>> 0;
  }
  const out: number[] = [];
  for (let i = 0; i < 10; i++) {
    h = Math.imul(h, 16807) ^ ((i + 1) * 2_654_435_761);
    h = h >>> 0;
    out.push(h & 0xff);
  }
  return out;
}

interface IdenticonProps {
  participantId: string;
  size?: number;
  className?: string;
}

// 5×5 symmetric grid: cols 0-2 are determined, cols 3-4 mirror 1-0.
export function Identicon({ participantId, size = 48, className }: IdenticonProps) {
  const bytes = hash(participantId);
  const color = ACCENTS[bytes[0] % ACCENTS.length];

  const cells: Array<[number, number]> = [];
  let bIdx = 1, bit = 0;

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      const filled = (bytes[Math.min(bIdx, bytes.length - 1)] >> bit) & 1;
      if (++bit === 8) { bit = 0; bIdx++; }
      if (filled) {
        cells.push([row, col]);
        if (col < 2) cells.push([row, 4 - col]); // mirror col 0→4, col 1→3
      }
    }
  }

  const pad = Math.floor(size * 0.1);
  const inner = size - pad * 2;
  const cell = inner / 5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ display: 'block', flexShrink: 0, borderRadius: 4 }}
      aria-hidden="true"
    >
      <rect width={size} height={size} fill={BG} rx="4" />
      {cells.map(([r, c]) => (
        <rect
          key={`${r}-${c}`}
          x={pad + c * cell + 0.5}
          y={pad + r * cell + 0.5}
          width={cell - 1}
          height={cell - 1}
          fill={color}
          rx="1"
        />
      ))}
    </svg>
  );
}
