/**
 * Custom page illustrations — clean geometric SVGs in the teal/slate/white palette.
 * All are responsive (width 100%, height auto). Stroke-based, clinical aesthetic.
 */

/** ── Partner Network ─────────────────────────────────────────────────────────
 * Shows Biome at center connected to partner node types (Lab, IRB, Clinician, CRO).
 * Rounded rectangles + connecting lines + teal highlights.
 */
export function PartnerNetworkSVG() {
  const nodes = [
    { x: 260, y: 160, label: 'LAB',        color: '#0e7490', bgColor: 'rgba(14,116,144,0.08)' },
    { x: 420, y: 260, label: 'IRB',         color: '#475569', bgColor: 'rgba(71,85,105,0.06)'  },
    { x: 360, y: 390, label: 'CLINICIAN',   color: '#475569', bgColor: 'rgba(71,85,105,0.06)'  },
    { x: 140, y: 390, label: 'CRO',         color: '#0e7490', bgColor: 'rgba(14,116,144,0.08)' },
    { x: 80,  y: 260, label: 'RECRUITER',   color: '#475569', bgColor: 'rgba(71,85,105,0.06)'  },
  ];
  const center = { x: 250, y: 280 };

  return (
    <svg viewBox="0 0 500 500" style={{ width: '100%', height: 'auto', maxWidth: 480 }} aria-hidden="true">
      {/* Subtle background grid */}
      {[0,1,2,3,4].map(i => (
        <line key={`v${i}`} x1={i*125} y1={0} x2={i*125} y2={500} stroke="rgba(14,116,144,0.05)" strokeWidth={1} />
      ))}
      {[0,1,2,3,4].map(i => (
        <line key={`h${i}`} x1={0} y1={i*125} x2={500} y2={i*125} stroke="rgba(14,116,144,0.05)" strokeWidth={1} />
      ))}

      {/* Connection lines — behind nodes */}
      {nodes.map((n, i) => (
        <line key={`edge-${i}`} x1={center.x} y1={center.y} x2={n.x} y2={n.y}
          stroke="rgba(14,116,144,0.2)" strokeWidth={1.5} strokeDasharray="6 4" />
      ))}

      {/* Center node — BIOME */}
      <rect x={center.x - 44} y={center.y - 28} width={88} height={56} rx={10}
        fill="#0e7490" />
      <text x={center.x} y={center.y + 6} textAnchor="middle"
        fill="#ffffff" fontSize={13} fontWeight={700} fontFamily="Inter, sans-serif"
        letterSpacing={1}>BIOME</text>

      {/* Partner nodes */}
      {nodes.map((n, i) => (
        <g key={`node-${i}`}>
          <rect x={n.x - 44} y={n.y - 22} width={88} height={44} rx={8}
            fill={n.bgColor} stroke={n.color} strokeWidth={1.5} />
          <text x={n.x} y={n.y + 5} textAnchor="middle"
            fill={n.color} fontSize={10} fontWeight={600}
            fontFamily="Inter, sans-serif" letterSpacing={0.5}>
            {n.label}
          </text>
        </g>
      ))}

      {/* Decorative teal dot accents */}
      <circle cx={430} cy={80} r={18} fill="rgba(14,116,144,0.08)" stroke="#0e7490" strokeWidth={1.5} />
      <circle cx={60}  cy={440} r={12} fill="rgba(14,116,144,0.06)" stroke="rgba(14,116,144,0.3)" strokeWidth={1.5} />
    </svg>
  );
}

/** ── Compensation Cost Bars ──────────────────────────────────────────────────
 * Stacked horizontal bar chart showing typical study cost breakdown.
 * Teal = primary, light teal = secondary, soft gray = tertiary.
 */
export function EstimateChartSVG() {
  const bars = [
    { label: 'Research Partners', pct: 0.42, color: '#0e7490',  textColor: '#ffffff' },
    { label: 'Logistics',         pct: 0.30, color: '#155e75',  textColor: '#ffffff' },
    { label: 'Compliance',        pct: 0.15, color: '#e0f2f7',  textColor: '#0e7490' },
    { label: 'Platform fee',      pct: 0.13, color: '#f0f9fb',  textColor: '#155e75' },
  ];
  const barH = 44;
  const gap = 14;
  const startX = 180;
  const maxW = 270;
  const startY = 60;

  return (
    <svg viewBox="0 0 500 320" style={{ width: '100%', height: 'auto', maxWidth: 520 }} aria-hidden="true">
      {/* Background */}
      <rect x={0} y={0} width={500} height={320} fill="none" />

      {/* Axis line */}
      <line x1={startX} y1={startY - 16} x2={startX} y2={startY + bars.length * (barH + gap) + 8}
        stroke="rgba(14,116,144,0.15)" strokeWidth={1.5} />

      {/* Bars */}
      {bars.map((b, i) => {
        const y = startY + i * (barH + gap);
        const w = b.pct * maxW;
        return (
          <g key={b.label}>
            {/* Label */}
            <text x={startX - 10} y={y + barH / 2 + 5} textAnchor="end"
              fill="#475569" fontSize={12} fontFamily="Inter, sans-serif">
              {b.label}
            </text>
            {/* Bar */}
            <rect x={startX} y={y} width={w} height={barH} rx={6}
              fill={b.color} stroke="rgba(14,116,144,0.2)" strokeWidth={1} />
            {/* Percentage */}
            <text x={startX + w + 10} y={y + barH / 2 + 5}
              fill="#0e7490" fontSize={13}
              fontWeight={600} fontFamily="Inter, sans-serif">
              {Math.round(b.pct * 100)}%
            </text>
          </g>
        );
      })}

      {/* Title */}
      <text x={startX} y={30} fill="#0e7490" fontSize={11}
        fontFamily="Inter, sans-serif" fontWeight={600} letterSpacing={1}>
        TYPICAL COST BREAKDOWN
      </text>

      {/* Decorative elements */}
      <rect x={430} y={240} width={44} height={44} rx={8} fill="rgba(14,116,144,0.06)" stroke="rgba(14,116,144,0.15)" strokeWidth={1.5} />
    </svg>
  );
}

/** ── Data Flow Pipeline ───────────────────────────────────────────────────────
 * Shows the research partner journey as a flowing pipeline with stage labels.
 * Used on /participate hero.
 */
export function DataFlowSVG() {
  const stages = [
    { x: 60,  label: 'SCREEN',   color: '#0e7490' },
    { x: 175, label: 'ENROLL',   color: '#155e75' },
    { x: 290, label: 'TRACK',    color: '#155e75' },
    { x: 405, label: 'COMPLETE', color: '#0e7490' },
  ];

  return (
    <svg viewBox="0 0 500 200" style={{ width: '100%', height: 'auto', maxWidth: 480 }} aria-hidden="true">
      {/* Pipeline tube */}
      <rect x={40} y={80} width={420} height={40} rx={20} fill="rgba(14,116,144,0.06)" stroke="rgba(14,116,144,0.2)" strokeWidth={1.5} />

      {/* Flow fill — teal progress block */}
      <rect x={40} y={80} width={300} height={40} rx={20} fill="rgba(14,116,144,0.12)" />

      {/* Stage markers */}
      {stages.map((s, i) => (
        <g key={s.label}>
          {/* Dot */}
          <circle cx={s.x} cy={100} r={8} fill={s.color} />
          {/* Label */}
          <text x={s.x} y={152} textAnchor="middle" fill={s.color}
            fontSize={10} fontWeight={600} fontFamily="Inter, sans-serif" letterSpacing={0.5}>
            {s.label}
          </text>
          {/* Number */}
          <text x={s.x} y={58} textAnchor="middle" fill="rgba(14,116,144,0.45)"
            fontSize={11} fontWeight={600} fontFamily="IBM Plex Mono, monospace">
            0{i + 1}
          </text>
        </g>
      ))}

      {/* Arrow at end of pipe */}
      <path d="M460,100 L476,92 L476,108 Z" fill="rgba(14,116,144,0.4)" />

      {/* Animated research partner dots */}
      <circle cx={100} cy={100} r={5} fill="rgba(14,116,144,0.7)">
        <animate attributeName="cx" values="40;460" dur="4s" repeatCount="indefinite" begin="0s" />
      </circle>
      <circle cx={200} cy={100} r={5} fill="rgba(21,94,117,0.5)">
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
      {/* Document stack — staggered layers */}
      <rect x={8}  y={8}  width={240} height={80} rx={10} fill="rgba(14,116,144,0.06)" stroke="rgba(14,116,144,0.15)" strokeWidth={1.5} />
      <rect x={0}  y={0}  width={240} height={80} rx={10} fill="#ffffff" stroke="rgba(14,116,144,0.2)" strokeWidth={1.5} />

      {/* Lines simulating text */}
      <line x1={16} y1={22} x2={160} y2={22} stroke="#0e7490" strokeWidth={2.5} />
      <line x1={16} y1={38} x2={200} y2={38} stroke="rgba(71,85,105,0.25)" strokeWidth={2} />
      <line x1={16} y1={52} x2={140} y2={52} stroke="rgba(71,85,105,0.2)" strokeWidth={2} />
      <line x1={16} y1={66} x2={180} y2={66} stroke="rgba(71,85,105,0.15)" strokeWidth={2} />

      {/* Teal accent block */}
      <rect x={264} y={20} width={60} height={60} rx={10} fill="#e0f2f7" stroke="#0e7490" strokeWidth={1.5} />

      {/* Small dot grid */}
      {[0,1,2].flatMap(r => [0,1,2,3].map(c => (
        <circle key={`${r}-${c}`} cx={338 + c * 14} cy={22 + r * 14} r={2} fill="rgba(14,116,144,0.2)" />
      )))}
    </svg>
  );
}
