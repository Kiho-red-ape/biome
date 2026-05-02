// Isometric SVG illustrations for BIOME platform sections.
// Each scene is a 400×300 viewBox SVG using the BIOME color palette.

type Scene = 'recruit' | 'collect' | 'track' | 'pay' | 'deliver' | 'scope' | 'design' | 'approve';

interface Props {
  scene: Scene;
  className?: string;
  style?: React.CSSProperties;
}

// ── Isometric coordinate helper ───────────────────────────────────────────────
// Projects 3-D isometric (x, y, z) to SVG screen (sx, sy).
// x = right, y = toward viewer, z = up.
function p(x: number, y: number, z: number, cx = 200, cy = 160, s = 22) {
  return {
    x: +(cx + (x - y) * Math.cos(Math.PI / 6) * s).toFixed(2),
    y: +(cy + (x + y) * Math.sin(Math.PI / 6) * s - z * s).toFixed(2),
  };
}
function pt(x: number, y: number, z: number, cx = 200, cy = 160, s = 22) {
  const { x: sx, y: sy } = p(x, y, z, cx, cy, s);
  return `${sx},${sy}`;
}
function poly(...points: ReturnType<typeof p>[]) {
  return points.map(({ x, y }) => `${x},${y}`).join(' ');
}

// ── Shared colors ──────────────────────────────────────────────────────────────
const G   = '#b7ff61';   // green accent
const C   = '#22d3ee';   // cyan accent
const A   = '#ffb300';   // amber
const DIM = 'rgba(183,255,97,0.08)';
const MID = 'rgba(255,255,255,0.06)';
const STR = 'rgba(255,255,255,0.18)';

// ── Scene: RECRUIT ─────────────────────────────────────────────────────────────
// 3×3 isometric grid of participant "slots". Enrolled ones are tall green columns.
function Recruit() {
  const enrolled = new Set(['0,0', '1,0', '2,1', '0,2', '1,2']);
  const tiles = [];
  const s = 22; const cx = 200; const cy = 155;

  for (let gx = 0; gx < 3; gx++) {
    for (let gy = 0; gy < 3; gy++) {
      const key = `${gx},${gy}`;
      const isOn = enrolled.has(key);
      const h = isOn ? 1.8 : 0.1;
      const col = isOn ? G : STR;
      const topFill = isOn ? 'rgba(183,255,97,0.12)' : DIM;

      // 8 vertices of the cube
      const v = (dx: number, dy: number, dz: number) => p(gx + dx, gy + dy, dz, cx, cy, s);

      const top   = [v(0,0,h), v(1,0,h), v(1,1,h), v(0,1,h)];
      const right = [v(1,0,0), v(1,0,h), v(1,1,h), v(1,1,0)];
      const left  = [v(0,1,0), v(0,1,h), v(1,1,h), v(1,1,0)];

      tiles.push(
        <g key={key}>
          <polygon points={poly(...left)}  fill="rgba(0,0,0,0.25)" stroke={col} strokeWidth={isOn ? 0.8 : 0.5} />
          <polygon points={poly(...right)} fill="rgba(0,0,0,0.15)" stroke={col} strokeWidth={isOn ? 0.8 : 0.5} />
          <polygon points={poly(...top)}   fill={topFill}           stroke={col} strokeWidth={isOn ? 0.8 : 0.5} />
          {isOn && (
            <circle
              cx={p(gx+0.5, gy+0.5, h+0.5, cx, cy, s).x}
              cy={p(gx+0.5, gy+0.5, h+0.5, cx, cy, s).y}
              r="5" fill={G} opacity="0.7"
            />
          )}
        </g>
      );
    }
  }

  return (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rg-recruit" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={G} stopOpacity="0.04" />
          <stop offset="100%" stopColor={G} stopOpacity="0"    />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="url(#rg-recruit)" />
      {tiles}
      {/* Label */}
      <text x="200" y="278" textAnchor="middle"
        fontFamily="var(--font-mono)" fontSize="9" fill={G} opacity="0.5" letterSpacing="3">
        5 / 9 SLOTS ENROLLED
      </text>
    </svg>
  );
}

// ── Scene: COLLECT ─────────────────────────────────────────────────────────────
// Shipping box → test tube → lab container. Dashed path.
function Collect() {
  const cx = 200; const cy = 150; const s = 22;
  function box(gx: number, gy: number, w: number, d: number, h: number, accent: string) {
    const v = (dx: number, dy: number, dz: number) => p(gx+dx, gy+dy, dz, cx, cy, s);
    const top   = [v(0,0,h), v(w,0,h), v(w,d,h), v(0,d,h)];
    const right = [v(w,0,0), v(w,0,h), v(w,d,h), v(w,d,0)];
    const left  = [v(0,d,0), v(0,d,h), v(w,d,h), v(w,d,0)];
    return (
      <g>
        <polygon points={poly(...left)}  fill="rgba(0,0,0,0.2)"  stroke={accent} strokeWidth="0.8" />
        <polygon points={poly(...right)} fill="rgba(0,0,0,0.1)"  stroke={accent} strokeWidth="0.8" />
        <polygon points={poly(...top)}   fill={`${accent}12`}    stroke={accent} strokeWidth="0.8" />
      </g>
    );
  }

  const dotA = p(1, 1.5, 0.5, cx, cy, s);
  const dotB = p(3.5, 1, 0.5, cx, cy, s);
  const dotC = p(6, 1.5, 0.5, cx, cy, s);

  return (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shipping box */}
      {box(0, 0, 2, 3, 2, G)}
      {/* Label on box */}
      <text x={p(1, 1.5, 2.1, cx, cy, s).x} y={p(1, 1.5, 2.1, cx, cy, s).y}
        textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={G} opacity="0.6">KIT</text>

      {/* Sample tube (thin tall box) */}
      {box(3, 0, 0.6, 1.5, 3.5, C)}

      {/* Lab container */}
      {box(5, 0, 2, 2.5, 1.5, A)}
      <text x={p(6, 1.25, 1.6, cx, cy, s).x} y={p(6, 1.25, 1.6, cx, cy, s).y}
        textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={A} opacity="0.6">LAB</text>

      {/* Dashed path */}
      <line x1={dotA.x} y1={dotA.y} x2={dotB.x} y2={dotB.y}
        stroke={C} strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
      <line x1={dotB.x} y1={dotB.y} x2={dotC.x} y2={dotC.y}
        stroke={C} strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
      <circle cx={dotA.x} cy={dotA.y} r="3" fill={G} opacity="0.7" />
      <circle cx={dotB.x} cy={dotB.y} r="3" fill={C} opacity="0.7" />
      <circle cx={dotC.x} cy={dotC.y} r="3" fill={A} opacity="0.7" />

      <text x="200" y="278" textAnchor="middle"
        fontFamily="var(--font-mono)" fontSize="9" fill={C} opacity="0.5" letterSpacing="3">
        KIT → PARTICIPANT → LAB
      </text>
    </svg>
  );
}

// ── Scene: TRACK ──────────────────────────────────────────────────────────────
// Isometric screen panel with milestone progress bars.
function Track() {
  const cx = 200; const cy = 140; const s = 22;

  // Screen panel as thin isometric slab
  const v = (dx: number, dy: number, dz: number) => p(dx, dy, dz, cx, cy, s);
  const top   = [v(0,0,1), v(5,0,1), v(5,4,1), v(0,4,1)];
  const right = [v(5,0,0), v(5,0,1), v(5,4,1), v(5,4,0)];
  const left  = [v(0,4,0), v(0,4,1), v(5,4,1), v(5,4,0)];

  const bars = [
    { label: 'M1', pct: 1.00, y: 0.5 },
    { label: 'M2', pct: 0.84, y: 1.3 },
    { label: 'M3', pct: 0.61, y: 2.1 },
    { label: 'M4', pct: 0.22, y: 2.9 },
  ];

  return (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Screen chassis */}
      <polygon points={poly(...left)}  fill="rgba(0,0,0,0.3)" stroke={STR} strokeWidth="0.8" />
      <polygon points={poly(...right)} fill="rgba(0,0,0,0.2)" stroke={STR} strokeWidth="0.8" />
      <polygon points={poly(...top)}   fill="rgba(11,16,20,0.9)" stroke={STR} strokeWidth="0.8" />

      {/* Progress bars on screen face (top face) */}
      {bars.map((bar) => {
        const bStart = p(0.3, bar.y, 1.01, cx, cy, s);
        const bEnd   = p(0.3 + 4.2 * bar.pct, bar.y, 1.01, cx, cy, s);
        const bBg    = p(4.5, bar.y, 1.01, cx, cy, s);
        const bSt    = p(0.3, bar.y, 1.01, cx, cy, s);
        return (
          <g key={bar.label}>
            {/* Background track */}
            <line x1={bSt.x} y1={bSt.y} x2={bBg.x} y2={bBg.y}
              stroke={MID} strokeWidth="3" />
            {/* Fill */}
            <line x1={bStart.x} y1={bStart.y} x2={bEnd.x} y2={bEnd.y}
              stroke={bar.pct === 1 ? G : (bar.pct > 0.5 ? G : C)}
              strokeWidth="3" opacity={0.7 + bar.pct * 0.3} />
            {/* Check dot at end */}
            {bar.pct === 1 && (
              <circle cx={bEnd.x} cy={bEnd.y} r="4" fill={G} opacity="0.9" />
            )}
          </g>
        );
      })}

      <text x="200" y="278" textAnchor="middle"
        fontFamily="var(--font-mono)" fontSize="9" fill={G} opacity="0.5" letterSpacing="3">
        MILESTONE COMPLIANCE
      </text>
    </svg>
  );
}

// ── Scene: PAY ────────────────────────────────────────────────────────────────
// Central hub node radiating payments to 5 peripheral nodes.
function Pay() {
  const hub = { x: 200, y: 145 };
  const spokes = [
    { x: 100, y: 90 },
    { x: 300, y: 90 },
    { x: 80,  y: 175 },
    { x: 320, y: 175 },
    { x: 200, y: 220 },
  ];

  return (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rg-hub" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={G} stopOpacity="0.15" />
          <stop offset="100%" stopColor={G} stopOpacity="0"    />
        </radialGradient>
        <marker id="arrow-pay" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 Z" fill={C} opacity="0.7" />
        </marker>
      </defs>

      {/* Spoke lines */}
      {spokes.map((s, i) => (
        <line key={i}
          x1={hub.x} y1={hub.y} x2={s.x} y2={s.y}
          stroke={C} strokeWidth="1" opacity="0.35"
          strokeDasharray="5 3"
          markerEnd="url(#arrow-pay)"
        />
      ))}

      {/* Outer glow */}
      <circle cx={hub.x} cy={hub.y} r="40" fill="url(#rg-hub)" />

      {/* Hub */}
      <circle cx={hub.x} cy={hub.y} r="20" stroke={G} strokeWidth="1.5" fill="rgba(183,255,97,0.06)" />
      <circle cx={hub.x} cy={hub.y} r="12" fill={G} opacity="0.2" />
      <circle cx={hub.x} cy={hub.y} r="5"  fill={G} opacity="0.9" />

      {/* Peripheral nodes */}
      {spokes.map((s, i) => (
        <g key={i}>
          <circle cx={s.x} cy={s.y} r="14" stroke={C} strokeWidth="1" fill="rgba(34,211,238,0.06)" />
          <circle cx={s.x} cy={s.y} r="5"  fill={C} opacity="0.8" />
        </g>
      ))}

      {/* Traveling particle animation on first spoke */}
      <circle r="3" fill={G} opacity="0.9">
        <animateMotion dur="2s" repeatCount="indefinite">
          <mpath href="#spoke0" />
        </animateMotion>
      </circle>
      <path id="spoke0" d={`M ${hub.x},${hub.y} L ${spokes[0].x},${spokes[0].y}`} opacity="0" />

      <text x="200" y="278" textAnchor="middle"
        fontFamily="var(--font-mono)" fontSize="9" fill={C} opacity="0.5" letterSpacing="3">
        COMPLIANCE-GATED PAYOUTS
      </text>
    </svg>
  );
}

// ── Scene: DELIVER ─────────────────────────────────────────────────────────────
// Stacked isometric document pages with checkmark.
function Deliver() {
  const cx = 200; const cy = 160; const s = 22;

  function docSlice(z: number, accent: string, opacity: number) {
    const v = (dx: number, dy: number, dz: number) => p(dx, dy, dz, cx, cy, s);
    const h = 0.2;
    const top   = [v(0,0,z+h), v(4,0,z+h), v(4,3,z+h), v(0,3,z+h)];
    const right = [v(4,0,z),   v(4,0,z+h), v(4,3,z+h), v(4,3,z)];
    const left  = [v(0,3,z),   v(0,3,z+h), v(4,3,z+h), v(4,3,z)];
    return (
      <g opacity={opacity}>
        <polygon points={poly(...left)}  fill="rgba(0,0,0,0.2)" stroke={accent} strokeWidth="0.6" />
        <polygon points={poly(...right)} fill="rgba(0,0,0,0.1)" stroke={accent} strokeWidth="0.6" />
        <polygon points={poly(...top)}   fill={`${accent}10`}   stroke={accent} strokeWidth="0.6" />
        {/* Lines on doc */}
        {[0.6, 1.1, 1.6, 2.1].map((ly, i) => {
          const a = p(0.4, ly, z+h+0.01, cx, cy, s);
          const b = p(3.4, ly, z+h+0.01, cx, cy, s);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={accent} strokeWidth="0.5" opacity="0.3" />;
        })}
      </g>
    );
  }

  // Checkmark position (above top doc)
  const ck = p(2, 1.5, 2.8, cx, cy, s);

  return (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      {docSlice(0,    STR,  0.5)}
      {docSlice(0.5,  STR,  0.65)}
      {docSlice(1.0,  C,    0.8)}
      {docSlice(1.9,  G,    1.0)}

      {/* Checkmark badge */}
      <circle cx={ck.x} cy={ck.y} r="16" fill="rgba(183,255,97,0.1)" stroke={G} strokeWidth="1.2" />
      <text x={ck.x} y={ck.y + 5} textAnchor="middle"
        fontFamily="system-ui" fontSize="16" fill={G} opacity="0.9">✓</text>

      <text x="200" y="278" textAnchor="middle"
        fontFamily="var(--font-mono)" fontSize="9" fill={G} opacity="0.5" letterSpacing="3">
        DATA + AUDIT BUNDLE
      </text>
    </svg>
  );
}

// ── Scene: SCOPE ───────────────────────────────────────────────────────────────
// Two towers: BIOME's stack (green) vs researcher's domain (dim), divided by a gap.
function Scope() {
  const cx = 200; const cy = 150; const s = 18;

  function tower(gx: number, gy: number, h: number, accent: string) {
    const v = (dx: number, dy: number, dz: number) => p(gx+dx, gy+dy, dz, cx, cy, s);
    const top   = [v(0,0,h), v(1.5,0,h), v(1.5,1.5,h), v(0,1.5,h)];
    const right = [v(1.5,0,0), v(1.5,0,h), v(1.5,1.5,h), v(1.5,1.5,0)];
    const left  = [v(0,1.5,0), v(0,1.5,h), v(1.5,1.5,h), v(1.5,1.5,0)];
    return (
      <g>
        <polygon points={poly(...left)}  fill="rgba(0,0,0,0.25)" stroke={accent} strokeWidth="0.9" />
        <polygon points={poly(...right)} fill="rgba(0,0,0,0.1)"  stroke={accent} strokeWidth="0.9" />
        <polygon points={poly(...top)}   fill={`${accent}12`}    stroke={accent} strokeWidth="0.9" />
      </g>
    );
  }

  // BIOME's side: tall green towers
  const biomeTowers: [number, number, number][] = [
    [0, 0, 3.5], [2, 0, 2.8], [0, 2, 2.2], [2, 2, 3.0],
  ];
  // Researcher's side: smaller dim towers
  const researchTowers: [number, number, number][] = [
    [5, 0, 1.5], [7, 0, 2.0], [5, 2, 1.2], [7, 2, 1.8],
  ];

  // Dividing line
  const lineTop = p(4, -0.5, 4, cx, cy, s);
  const lineBot = p(4, 5,    0, cx, cy, s);

  return (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      {biomeTowers.map(([gx, gy, h], i) => (
        <g key={`b${i}`}>{tower(gx, gy, h, G)}</g>
      ))}
      {researchTowers.map(([gx, gy, h], i) => (
        <g key={`r${i}`}>{tower(gx, gy, h, STR)}</g>
      ))}

      {/* Divider */}
      <line x1={lineTop.x} y1={lineTop.y} x2={lineBot.x} y2={lineBot.y}
        stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 3" />

      <text x="110" y="275" textAnchor="middle"
        fontFamily="var(--font-mono)" fontSize="8" fill={G} opacity="0.5" letterSpacing="2">
        BIOME HANDLES
      </text>
      <text x="290" y="275" textAnchor="middle"
        fontFamily="var(--font-mono)" fontSize="8" fill={STR} opacity="0.8" letterSpacing="2">
        YOU OWN
      </text>
    </svg>
  );
}

// ── Scene: DESIGN ─────────────────────────────────────────────────────────────
// Isometric drafting board with protocol flow mapped on top.
function Design() {
  const cx = 200; const cy = 155; const s = 22;
  const v = (dx: number, dy: number, dz: number) => p(dx, dy, dz, cx, cy, s);

  const top   = [v(0,0,0.3), v(5,0,0.3), v(5,4,0.3), v(0,4,0.3)];
  const right = [v(5,0,0),   v(5,0,0.3), v(5,4,0.3), v(5,4,0)];
  const left  = [v(0,4,0),   v(0,4,0.3), v(5,4,0.3), v(5,4,0)];

  const gridLines = [];
  for (let i = 1; i < 5; i++) {
    const a = p(i, 0, 0.31, cx, cy, s);
    const b = p(i, 4, 0.31, cx, cy, s);
    gridLines.push(<line key={`gx${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={G} strokeWidth="0.4" opacity="0.2" />);
  }
  for (let j = 1; j < 4; j++) {
    const a = p(0, j, 0.31, cx, cy, s);
    const b = p(5, j, 0.31, cx, cy, s);
    gridLines.push(<line key={`gy${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={G} strokeWidth="0.4" opacity="0.2" />);
  }

  const flowPts: [number, number][] = [[0.7, 0.7], [2.0, 0.7], [3.3, 1.8], [4.3, 1.8], [4.3, 3.3]];
  return (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points={poly(...left)}  fill="rgba(0,0,0,0.25)" stroke={G} strokeWidth="0.8" />
      <polygon points={poly(...right)} fill="rgba(0,0,0,0.15)" stroke={G} strokeWidth="0.8" />
      <polygon points={poly(...top)}   fill="rgba(11,16,20,0.9)" stroke={G} strokeWidth="0.8" />
      {gridLines}
      {flowPts.slice(0, -1).map(([fx, fy], i) => {
        const a = p(fx, fy, 0.32, cx, cy, s);
        const b = p(flowPts[i+1][0], flowPts[i+1][1], 0.32, cx, cy, s);
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={G} strokeWidth="1.2" strokeDasharray="3 2" opacity="0.5" />;
      })}
      {flowPts.map(([fx, fy], i) => {
        const pt = p(fx, fy, 0.32, cx, cy, s);
        return <circle key={i} cx={pt.x} cy={pt.y} r="5" fill={i === 0 ? G : i === flowPts.length - 1 ? A : C} opacity="0.85" />;
      })}
      <text x="200" y="278" textAnchor="middle"
        fontFamily="var(--font-mono)" fontSize="9" fill={G} opacity="0.5" letterSpacing="3">
        PROTOCOL DESIGN
      </text>
    </svg>
  );
}

// ── Scene: APPROVE ─────────────────────────────────────────────────────────────
// Verification badge with radial trust rings.
function Approve() {
  const cx = 200; const cy = 148;

  return (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rg-approve" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={G} stopOpacity="0.1" />
          <stop offset="100%" stopColor={G} stopOpacity="0"    />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r="80" fill="url(#rg-approve)" />
      <circle cx={cx} cy={cy} r="64" stroke={G} strokeWidth="0.5" strokeDasharray="6 4" opacity="0.2" />
      <circle cx={cx} cy={cy} r="46" stroke={G} strokeWidth="0.7" opacity="0.2" fill="rgba(183,255,97,0.03)" />
      {/* Shield */}
      <path d={`M ${cx},${cy-30} L ${cx+24},${cy-15} L ${cx+24},${cy+8} Q ${cx+24},${cy+30} ${cx},${cy+34} Q ${cx-24},${cy+30} ${cx-24},${cy+8} L ${cx-24},${cy-15} Z`}
        fill="rgba(183,255,97,0.08)" stroke={G} strokeWidth="1.2" />
      {/* Checkmark */}
      <path d={`M ${cx-11},${cy+3} L ${cx-2},${cy+13} L ${cx+14},${cy-9}`}
        stroke={G} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      {/* Orbiting dots */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const dx = cx + 64 * Math.cos(rad);
        const dy = cy + 64 * Math.sin(rad);
        return <circle key={i} cx={dx} cy={dy} r="4" fill={i % 2 === 0 ? G : C} opacity={0.5 + (i % 3) * 0.2} />;
      })}
      <text x="200" y="278" textAnchor="middle"
        fontFamily="var(--font-mono)" fontSize="9" fill={G} opacity="0.5" letterSpacing="3">
        BIOME VERIFIED
      </text>
    </svg>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────
export function IsometricScene({ scene, className, style }: Props) {
  const scenes: Record<Scene, React.ReactElement> = {
    recruit: <Recruit />,
    collect: <Collect />,
    track:   <Track />,
    pay:     <Pay />,
    deliver: <Deliver />,
    scope:   <Scope />,
    design:  <Design />,
    approve: <Approve />,
  };
  return (
    <div
      className={className}
      style={{ width: '100%', aspectRatio: '4/3', ...style }}
    >
      {scenes[scene]}
    </div>
  );
}
