import Link from 'next/link';

interface Props {
  stats: {
    totalBountyPool: number;
    activeCount: number;
    totalParticipants: number;
  };
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

// ─── Ambient node-network SVG ──────────────────────────────────────────────────
// Subtle, low-opacity animated dots + edges. Atmosphere only.
// All animations use SMIL (SVG-native) — no JS, no layout side-effects.

function AmbientNetwork() {
  // Manually placed nodes spread across 1200×300 viewport
  const nodes = [
    { id: 'n1',  cx: 80,   cy: 60,  r: 2.5, color: '#4dff80', delay: '0s',    dur: '3.8s' },
    { id: 'n2',  cx: 220,  cy: 30,  r: 2,   color: '#00e5ff', delay: '0.6s',  dur: '4.2s' },
    { id: 'n3',  cx: 380,  cy: 80,  r: 2.5, color: '#4dff80', delay: '1.2s',  dur: '3.5s' },
    { id: 'n4',  cx: 500,  cy: 20,  r: 2,   color: '#4dff80', delay: '0.3s',  dur: '5.0s' },
    { id: 'n5',  cx: 640,  cy: 70,  r: 3,   color: '#00e5ff', delay: '1.8s',  dur: '3.2s' },
    { id: 'n6',  cx: 760,  cy: 25,  r: 2,   color: '#4dff80', delay: '0.9s',  dur: '4.5s' },
    { id: 'n7',  cx: 880,  cy: 85,  r: 2.5, color: '#00e5ff', delay: '0.4s',  dur: '3.9s' },
    { id: 'n8',  cx: 1020, cy: 40,  r: 2,   color: '#4dff80', delay: '1.5s',  dur: '4.1s' },
    { id: 'n9',  cx: 1150, cy: 70,  r: 2.5, color: '#00e5ff', delay: '2.1s',  dur: '3.6s' },
    { id: 'n10', cx: 140,  cy: 200, r: 2,   color: '#4dff80', delay: '0.7s',  dur: '4.8s' },
    { id: 'n11', cx: 300,  cy: 220, r: 2.5, color: '#00e5ff', delay: '1.3s',  dur: '3.4s' },
    { id: 'n12', cx: 460,  cy: 180, r: 2,   color: '#4dff80', delay: '2.0s',  dur: '4.3s' },
    { id: 'n13', cx: 600,  cy: 240, r: 3,   color: '#4dff80', delay: '0.5s',  dur: '3.7s' },
    { id: 'n14', cx: 720,  cy: 190, r: 2,   color: '#00e5ff', delay: '1.7s',  dur: '5.2s' },
    { id: 'n15', cx: 850,  cy: 250, r: 2.5, color: '#4dff80', delay: '1.0s',  dur: '3.3s' },
    { id: 'n16', cx: 970,  cy: 200, r: 2,   color: '#00e5ff', delay: '2.3s',  dur: '4.0s' },
    { id: 'n17', cx: 1100, cy: 230, r: 2.5, color: '#4dff80', delay: '0.8s',  dur: '4.6s' },
  ];

  // Edge pairs (by index into nodes array, 0-based)
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [1, 10], [2, 11], [3, 12], [4, 13], [5, 14], [6, 15], [7, 16],
    [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 16],
    [2, 9], [4, 11], [6, 13], [8, 16],
  ];

  return (
    <svg
      viewBox="0 0 1200 300"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.45,
        pointerEvents: 'none',
      }}
    >
      {/* Edges — very faint */}
      {edges.map(([a, b], i) => {
        const na = nodes[a], nb = nodes[b];
        return (
          <line
            key={i}
            x1={na.cx} y1={na.cy}
            x2={nb.cx} y2={nb.cy}
            stroke="rgba(77,255,128,0.12)"
            strokeWidth="0.6"
          />
        );
      })}

      {/* Nodes — pulsing */}
      {nodes.map((n) => (
        <circle key={n.id} cx={n.cx} cy={n.cy} r={n.r} fill={n.color}>
          <animate
            attributeName="opacity"
            values="0.2;0.7;0.2"
            dur={n.dur}
            begin={n.delay}
            repeatCount="indefinite"
          />
          <animate
            attributeName="r"
            values={`${n.r};${n.r + 1.2};${n.r}`}
            dur={n.dur}
            begin={n.delay}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* Travelling signal dots along a few edges */}
      {([[0,4],[9,13],[2,14]] as [number,number][]).map(([a,b], i) => {
        const na = nodes[a], nb = nodes[b];
        return (
          <circle key={`sig-${i}`} r="1.5" fill="#00e5ff" opacity="0.5">
            <animateMotion
              dur={`${6 + i * 2}s`}
              begin={`${i * 1.8}s`}
              repeatCount="indefinite"
              path={`M ${na.cx} ${na.cy} L ${nb.cx} ${nb.cy}`}
            />
            <animate attributeName="opacity" values="0;0.7;0.7;0" dur={`${6 + i * 2}s`} begin={`${i * 1.8}s`} repeatCount="indefinite" />
          </circle>
        );
      })}
    </svg>
  );
}

// ─── Hero component ─────────────────────────────────────────────────────────────

export function HeroSection({ stats }: Props) {
  return (
    <section
      className="px-4 md:px-8 pt-12 pb-4 relative overflow-hidden"
      style={{ minHeight: 300 }}
    >
      {/* Ambient network — absolutely positioned behind content */}
      <AmbientNetwork />

      {/* Radial glow at centre-top */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -60,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 300,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(77,255,128,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-2xl">
        <p
          className="mono text-xs mb-4 tracking-widest"
          style={{ color: 'var(--green-dim)', letterSpacing: '0.14em' }}
        >
          // OPEN_EXPERIMENT_MARKETPLACE
        </p>

        <h1
          className="text-4xl md:text-5xl font-black leading-tight mb-4"
          style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}
        >
          <span style={{ color: 'var(--text-white)' }}>Browse. Contribute.</span>
          <br />
          <span
            style={{
              color: 'var(--green)',
              textShadow: '0 0 48px rgba(77,255,128,0.28)',
            }}
          >
            Earn from your biology.
          </span>
        </h1>

        <p className="text-sm leading-relaxed mb-8 max-w-lg" style={{ color: 'var(--text-dim)' }}>
          Your body generates data every day. Biome turns that into structured participation
          in paid experiments — from sleep research to longevity trials.
        </p>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { label: 'ACTIVE',       value: String(stats.activeCount)       },
            { label: 'POOL',         value: fmt(stats.totalBountyPool)       },
            { label: 'PARTICIPANTS', value: String(stats.totalParticipants)  },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded"
              style={{ background: 'rgba(11,18,11,0.85)', border: '1px solid rgba(77,255,128,0.12)' }}
            >
              <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{s.label}</span>
              <span className="mono text-sm font-bold" style={{ color: 'var(--text-white)' }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="#experiments"
            className="mono text-xs px-6 py-2.5 rounded font-bold no-underline transition-all hover:opacity-90"
            style={{ background: 'var(--green)', color: '#050709' }}
          >
            BROWSE EXPERIMENTS →
          </Link>
          <Link
            href="/post"
            className="mono text-xs px-6 py-2.5 rounded font-bold no-underline transition-all hover:opacity-80"
            style={{ border: '1px solid var(--green-dim)', color: 'var(--green)', background: 'transparent' }}
          >
            POST A BOUNTY
          </Link>
        </div>
      </div>
    </section>
  );
}
