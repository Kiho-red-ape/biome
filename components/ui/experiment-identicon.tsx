// ExperimentIdenticon — LED panel display of alphanumeric experiment code
// Grid: 40 cols × 5 rows, 8px × 16px per cell (SVG viewBox "0 0 320 80")
// Code format: [CategoryLetter][OrgLetter][##] e.g. "LH01"
// Lit cells show the code in 5×5 pixel font; all other cells are dark (off)

const COLS = 40;
const ROWS = 5;
const CELL_W = 8;
const CELL_H = 16;
const SVG_W = COLS * CELL_W; // 320
const SVG_H = ROWS * CELL_H; // 80
const LED_GAP = 1; // px gap inside each cell for the bezel effect

// Category accent colors
const CATEGORY_COLOR: Record<string, string> = {
  microbiome:        '#b7ff61',
  nutrition:         '#00e5ff',
  sleep:             '#ffb300',
  wearables:         '#ff8f8f',
  longevity:         '#d8c4ff',
  'quantified-self': '#88bbff',
  default:           '#b7ff61',
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

// 5-wide × 5-tall pixel font — each row is a 5-bit number (MSB = leftmost col)
const PIXEL_FONT: Record<string, number[]> = {
  '0': [0b01110, 0b10001, 0b10001, 0b10001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b01110],
  '2': [0b01110, 0b00001, 0b01110, 0b10000, 0b11111],
  '3': [0b11110, 0b00001, 0b00110, 0b00001, 0b11110],
  '4': [0b10001, 0b10001, 0b11111, 0b00001, 0b00001],
  '5': [0b11111, 0b10000, 0b11110, 0b00001, 0b11110],
  '6': [0b01110, 0b10000, 0b11110, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b00100],
  '8': [0b01110, 0b10001, 0b01110, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b01111, 0b00001, 0b01110],
  'A': [0b01110, 0b10001, 0b11111, 0b10001, 0b10001],
  'B': [0b11110, 0b10001, 0b11110, 0b10001, 0b11110],
  'C': [0b01111, 0b10000, 0b10000, 0b10000, 0b01111],
  'D': [0b11110, 0b10001, 0b10001, 0b10001, 0b11110],
  'E': [0b11111, 0b10000, 0b11100, 0b10000, 0b11111],
  'F': [0b11111, 0b10000, 0b11100, 0b10000, 0b10000],
  'G': [0b01111, 0b10000, 0b10011, 0b10001, 0b01111],
  'H': [0b10001, 0b10001, 0b11111, 0b10001, 0b10001],
  'I': [0b01110, 0b00100, 0b00100, 0b00100, 0b01110],
  'J': [0b00111, 0b00010, 0b00010, 0b10010, 0b01100],
  'K': [0b10001, 0b10010, 0b11100, 0b10010, 0b10001],
  'L': [0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  'M': [0b10001, 0b11011, 0b10101, 0b10001, 0b10001],
  'N': [0b10001, 0b11001, 0b10101, 0b10011, 0b10001],
  'O': [0b01110, 0b10001, 0b10001, 0b10001, 0b01110],
  'P': [0b11110, 0b10001, 0b11110, 0b10000, 0b10000],
  'Q': [0b01110, 0b10001, 0b10001, 0b01110, 0b00011],
  'R': [0b11110, 0b10001, 0b11110, 0b10010, 0b10001],
  'S': [0b01111, 0b10000, 0b01110, 0b00001, 0b11110],
  'T': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100],
  'U': [0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'V': [0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  'W': [0b10001, 0b10001, 0b10101, 0b11011, 0b10001],
  'X': [0b10001, 0b01010, 0b00100, 0b01010, 0b10001],
  'Y': [0b10001, 0b01010, 0b00100, 0b00100, 0b00100],
  'Z': [0b11111, 0b00010, 0b00100, 0b01000, 0b11111],
};

const CHAR_W = 5;  // cols per character
const CHAR_GAP = 1; // col gap between characters

// Returns a Set of "row,col" strings for lit cells
function codeToLitCells(code: string): Set<string> {
  const lit = new Set<string>();
  const totalW = code.length * CHAR_W + (code.length - 1) * CHAR_GAP;
  const startCol = Math.floor((COLS - totalW) / 2);

  for (let ci = 0; ci < code.length; ci++) {
    const ch = code[ci].toUpperCase();
    const pattern = PIXEL_FONT[ch];
    if (!pattern) continue;
    const baseCol = startCol + ci * (CHAR_W + CHAR_GAP);
    for (let row = 0; row < ROWS; row++) {
      for (let bit = 0; bit < CHAR_W; bit++) {
        if ((pattern[row] >> (CHAR_W - 1 - bit)) & 1) {
          lit.add(`${row},${baseCol + bit}`);
        }
      }
    }
  }
  return lit;
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
  const accentColor = CATEGORY_COLOR[rampKey] ?? CATEGORY_COLOR['default'];

  // Build code: [CatLetter][OrgLetter][##]
  const catLetter = CAT_LETTER[rampKey] ?? 'X';
  const orgLetter = orgName.trim().length > 0 ? orgName.trim()[0].toUpperCase() : 'B';
  const numStr = experimentNumber.toString().padStart(2, '0');
  const code = `${catLetter}${orgLetter}${numStr}`;

  const litCells = codeToLitCells(code);

  // Off-cell dim color derived from accent (very dark)
  const offColor = '#0a100a';

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
      <defs>
        {/* Glow filter for lit cells */}
        <filter id={`glow-${experimentId.slice(0, 8)}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* LED panel background */}
      <rect width={SVG_W} height={SVG_H} fill="#060a06" />

      {/* Render all cells */}
      {Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: COLS }, (_, col) => {
          const key = `${row},${col}`;
          const isLit = litCells.has(key);
          return (
            <rect
              key={key}
              x={col * CELL_W + LED_GAP}
              y={row * CELL_H + LED_GAP}
              width={CELL_W - LED_GAP * 2}
              height={CELL_H - LED_GAP * 2}
              rx="1"
              fill={isLit ? accentColor : offColor}
              opacity={isLit ? 0.95 : 0.5}
              filter={isLit ? `url(#glow-${experimentId.slice(0, 8)})` : undefined}
            />
          );
        })
      )}
    </svg>
  );
}
