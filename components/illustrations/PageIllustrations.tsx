/**
 * Custom page illustrations — bold geometric SVGs in the navy/amber/white palette.
 * All are responsive (width 100%, height auto). Stroke-based, brutalist aesthetic.
 */

/** ── Partner Network ─────────────────────────────────────────────────────────
 * Shows Biome at center connected to partner node types (Lab, IRB, Clinician, CRO).
 * Thick offset rectangles + connecting lines + amber highlights.
 */
export function PartnerNetworkSVG() {
  const nodes = [
    { x: 260, y: 160, label: 'LAB',       color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)' },
    { x: 420, y: 260, label: 'IRB',        color: '#ffffff', bgColor: 'rgba(255,255,255,0.08)' },
    { x: 360, y: 390, label: 'CLINICIAN',  color: '#ffffff', bgColor: 'rgba(255,255,255,0.08)' },
    { x: 140, y: 390, label: 'CRO',        color: '#f59e0b', bgColor: 'rgba(245,158,11,0.08)' },
    { x: 80,  y: 260, label: 'RECRUITER', color: '#ffffff', bgColor: 'rgba(255,255,255,0.08)' },
  ];
  const center = { x: 250, y: 280 };

  return (
    <svg viewBox="0 0 500 500" style={{ width: '100%', height: 'auto', maxWidth: 480 }} aria-hidden="true">
      {/* Background grid */}
      {[0,1,2,3,4].map(i => (
        <line key={`v${i}`} x1={i*125} y1={0} x2={i*125} y2={500} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      ))}
      {[0,1,2,3,4].map(i => (
        <line key={`h${i}`} x1={0} y1={i*125} x2={500} y2={i*125} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      ))}

      {/* Connection lines — behind nodes */}
      {nodes.map((n, i) => (
        <line key={`edge-${i}`} x1={center.x} y1={center.y} x2={n.x} y2={n.y}
          stroke="rgba(245,158,11,0.3)" strokeWidth={2} strokeDasharray="6 4" />
      ))}

      {/* Center node — BIOME */}
      {/* Offset shadow rect */}
      <rect x={center.x - 44 + 5} y={center.y - 28 + 5} width={88} height={56} fill="rgba(245,158,11,0.5)" />
      <rect x={center.x - 44} y={center.y - 28} width={88} height={56}
        fill="var(--amber, #f59e0b)" stroke="#000000" strokeWidth={3} />
      <text x={center.x} y={center.y + 6} textAnchor="middle"
        fill="#000000" fontSize={13} fontWeight={700} fontFamily="Space Grotesk, sans-serif"
        letterSpacing={2}>BIOME</text>

      {/* Partner nodes */}
      {nodes.map((n, i) => (
        <g key={`node-${i}`}>
          {/* Shadow */}
          <rect x={n.x - 44 + 4} y={n.y - 22 + 4} width={88} height={44} fill="rgba(0,0,0,0.4)" />
          {/* Node */}
          <rect x={n.x - 44} y={n.y - 22} width={88} height={44}
            fill={n.bgColor} stroke={n.color} strokeWidth={2.5} />
          <text x={n.x} y={n.y + 5} textAnchor="middle"
            fill={n.color} fontSize={10} fontWeight={600}
            fontFamily="Space Grotesk, sans-serif" letterSpacing={1.5}>
            {n.label}
          </text>
        </g>
      ))}

      {/* Decorative amber dot accent */}
      <circle cx={430} cy={80} r={18} fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth={2.5} />
      <circle cx={60}  cy={440} r={12} fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.5)" strokeWidth={2} />

      {/* Corner bracket */}
      <path d="M460,20 L480,20 L480,40" stroke="rgba(255,255,255,0.2)" strokeWidth={2.5} fill="none" />
      <path d="M20,460 L20,480 L40,480" stroke="rgba(255,255,255,0.2)" strokeWidth={2.5} fill="none" />
    </svg>
  );
}

/** ── Estimate Cost Bars ───────────────────────────────────────────────────────
 * Stacked horizontal bar chart showing typical study cost breakdown.
 * Amber = ops fee, white = logistics, off-white = recruitment.
 */
export function EstimateChartSVG() {
  const bars = [
    { label: 'Recruitment',   pct: 0.42, color: '#ffffff',  textColor: '#000000' },
    { label: 'Logistics',     pct: 0.30, color: '#f59e0b',  textColor: '#000000' },
    { label: 'Compliance',    pct: 0.15, color: '#e2e8f0',  textColor: '#000000' },
    { label: 'Ops fee',       pct: 0.13, color: '#0f1a2e',  textColor: '#f59e0b' },
  ];
  const barH = 48;
  const gap = 14;
  const startX = 160;
  const maxW = 290;
  const startY = 60;

  return (
    <svg viewBox="0 0 500 320" style={{ width: '100%', height: 'auto', maxWidth: 520 }} aria-hidden="true">
      {/* Background */}
      <rect x={0} y={0} width={500} height={320} fill="none" />

      {/* Axis line */}
      <line x1={startX} y1={startY - 16} x2={startX} y2={startY + bars.length * (barH + gap) + 8}
        stroke="rgba(255,255,255,0.2)" strokeWidth={2} />

      {/* Bars */}
      {bars.map((b, i) => {
        const y = startY + i * (barH + gap);
        const w = b.pct * maxW;
        return (
          <g key={b.label}>
            {/* Label */}
            <text x={startX - 10} y={y + barH / 2 + 5} textAnchor="end"
              fill="rgba(255,255,255,0.7)" fontSize={12} fontFamily="Inter, sans-serif">
              {b.label}
            </text>
            {/* Shadow rect */}
            <rect x={startX + 4} y={y + 4} width={w} height={barH} fill="rgba(0,0,0,0.35)" />
            {/* Bar */}
            <rect x={startX} y={y} width={w} height={barH}
              fill={b.color} stroke="#000000" strokeWidth={2.5} />
            {/* Percentage */}
            <text x={startX + w + 10} y={y + barH / 2 + 5}
              fill={b.color === '#0f1a2e' ? '#f59e0b' : '#ffffff'} fontSize={13}
              fontWeight={700} fontFamily="Space Grotesk, sans-serif">
              {Math.round(b.pct * 100)}%
            </text>
          </g>
        );
      })}

      {/* Title */}
      <text x={startX} y={30} fill="rgba(245,158,11,0.9)" fontSize={11}
        fontFamily="Space Grotesk, sans-serif" fontWeight={600} letterSpacing={2}>
        TYPICAL COST BREAKDOWN
      </text>

      {/* Decorative elements */}
      <rect x={430} y={240} width={44} height={44} fill="none" stroke="rgba(245,158,11,0.25)" strokeWidth={2.5} />
      <rect x={436} y={246} width={44} height={44} fill="rgba(245,158,11,0.06)" stroke="none" />
    </svg>
  );
}

/** ── Data Flow Pipeline ───────────────────────────────────────────────────────
 * Shows the participant journey as a flowing pipeline with stage labels.
 * Used on /participate hero.
 */
export function DataFlowSVG() {
  const stages = [
    { x: 60,  label: 'SCREEN',   color: '#f59e0b' },
    { x: 175, label: 'ENROLL',   color: '#ffffff' },
    { x: 290, label: 'TRACK',    color: '#ffffff' },
    { x: 405, label: 'COMPLETE', color: '#f59e0b' },
  ];

  return (
    <svg viewBox="0 0 500 200" style={{ width: '100%', height: 'auto', maxWidth: 480 }} aria-hidden="true">
      {/* Pipeline tube */}
      <rect x={40} y={80} width={420} height={40} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth={2} />

      {/* Flow fill — amber gradient represented as solid block */}
      <rect x={40} y={80} width={300} height={40} fill="rgba(245,158,11,0.15)" />

      {/* Stage markers */}
      {stages.map((s, i) => (
        <g key={s.label}>
          {/* Tick on pipe */}
          <line x1={s.x} y1={72} x2={s.x} y2={128} stroke={s.color} strokeWidth={3} />
          {/* Dot */}
          <circle cx={s.x} cy={100} r={8} fill={s.color} stroke="#000000" strokeWidth={2} />
          {/* Label */}
          <text x={s.x} y={152} textAnchor="middle" fill={s.color}
            fontSize={10} fontWeight={600} fontFamily="Space Grotesk, sans-serif" letterSpacing={1.5}>
            {s.label}
          </text>
          {/* Number */}
          <text x={s.x} y={56} textAnchor="middle" fill="rgba(255,255,255,0.4)"
            fontSize={12} fontWeight={700} fontFamily="Space Grotesk, sans-serif">
            0{i + 1}
          </text>
        </g>
      ))}

      {/* Arrow at end of pipe */}
      <path d="M460,100 L480,90 L480,110 Z" fill="rgba(245,158,11,0.6)" />

      {/* Animated participant dots */}
      <circle cx={100} cy={100} r={5} fill="rgba(245,158,11,0.8)">
        <animate attributeName="cx" values="40;460" dur="4s" repeatCount="indefinite" begin="0s" />
      </circle>
      <circle cx={200} cy={100} r={5} fill="rgba(255,255,255,0.5)">
        <animate attributeName="cx" values="40;460" dur="4s" repeatCount="indefinite" begin="1.5s" />
      </circle>
    </svg>
  );
}

/** ── Blog Header ─────────────────────────────────────────────────────────────
 * Abstract composition: overlapping rectangles forming a "document stack" feel.
 */
export function BlogHeaderSVG() {
  return (
    <svg viewBox="0 0 400 120" style={{ width: '100%', height: 'auto', maxWidth: 400 }} aria-hidden="true">
      {/* Document stack — offset shadow layers */}
      <rect x={14} y={14} width={240} height={80} fill="rgba(0,0,0,0.4)" />
      <rect x={8}  y={8}  width={240} height={80} fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.4)" strokeWidth={2} />
      <rect x={0}  y={0}  width={240} height={80} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2.5} />

      {/* Lines simulating text */}
      <line x1={16} y1={22} x2={160} y2={22} stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
      <line x1={16} y1={38} x2={200} y2={38} stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
      <line x1={16} y1={52} x2={140} y2={52} stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
      <line x1={16} y1={66} x2={180} y2={66} stroke="rgba(255,255,255,0.15)" strokeWidth={2} />

      {/* Amber accent block */}
      <rect x={264} y={20} width={60} height={60} fill="var(--amber, #f59e0b)" stroke="#000000" strokeWidth={3} />
      <rect x={270} y={26} width={60} height={60} fill="rgba(0,0,0,0.2)" />

      {/* Small dot grid */}
      {[0,1,2].flatMap(r => [0,1,2,3].map(c => (
        <circle key={`${r}-${c}`} cx={338 + c * 14} cy={22 + r * 14} r={2} fill="rgba(255,255,255,0.25)" />
      )))}
    </svg>
  );
}
