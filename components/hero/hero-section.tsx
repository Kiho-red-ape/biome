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

// ─── Isometric hero SVG ────────────────────────────────────────────────────────
// Purely geometric / technical. Pop colors only inside this panel.

function IsometricArt() {
  return (
    <svg
      viewBox="0 0 480 340"
      aria-hidden="true"
      style={{ width: '100%', maxWidth: 520, height: 'auto' }}
    >
      {/* ── Subtle radial glow behind art ── */}
      <defs>
        <radialGradient id="glow-c" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#4dff80" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#4dff80" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glow-cyan" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#00e5ff" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
        </radialGradient>
        {/* isometric grid pattern */}
        <pattern id="iso-grid" x="0" y="0" width="40" height="23" patternUnits="userSpaceOnUse">
          <line x1="0" y1="11.5" x2="20" y2="0"    stroke="rgba(77,255,128,0.06)" strokeWidth="0.5" />
          <line x1="20" y1="0"   x2="40" y2="11.5" stroke="rgba(77,255,128,0.06)" strokeWidth="0.5" />
          <line x1="40" y1="11.5" x2="20" y2="23"  stroke="rgba(77,255,128,0.06)" strokeWidth="0.5" />
          <line x1="20" y1="23"  x2="0"  y2="11.5" stroke="rgba(77,255,128,0.06)" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Grid fill */}
      <rect width="480" height="340" fill="url(#iso-grid)" />

      {/* Glow blobs */}
      <ellipse cx="240" cy="170" rx="180" ry="140" fill="url(#glow-c)" />
      <ellipse cx="340" cy="100" rx="100" ry="80"  fill="url(#glow-cyan)" />

      {/* ── Card 1: top-left — "SLEEP STUDY" in cyan ── */}
      {/* Isometric card: top face + left face + right face */}
      {/* Top face */}
      <polygon points="60,80  160,40  260,80  160,120" fill="#0d1f0d" stroke="rgba(0,229,255,0.25)" strokeWidth="1" />
      {/* Left face */}
      <polygon points="60,80  60,140  160,180  160,120" fill="#0a1a0a" stroke="rgba(0,229,255,0.15)" strokeWidth="1" />
      {/* Right face */}
      <polygon points="160,120  260,80  260,140  160,180" fill="#0b1c0b" stroke="rgba(0,229,255,0.2)" strokeWidth="1" />
      {/* Label on top */}
      <text x="160" y="74" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#00e5ff" letterSpacing="1.5">SLEEP STUDY</text>
      <text x="160" y="86" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="700" fill="#00e5ff">$120</text>
      <text x="160" y="97" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(0,229,255,0.5)" letterSpacing="1">RECRUITING</text>
      {/* Blinking dot on card */}
      <circle cx="218" cy="75" r="3" fill="#4dff80" opacity="0.9" />

      {/* ── Card 2: center — "MICROBIOME" in green (tall) ── */}
      <polygon points="170,160  280,115  390,160  280,205" fill="#0e2010" stroke="rgba(77,255,128,0.3)" strokeWidth="1.5" />
      <polygon points="170,160  170,240  280,285  280,205" fill="#0a1a0a" stroke="rgba(77,255,128,0.18)" strokeWidth="1" />
      <polygon points="280,205  390,160  390,240  280,285" fill="#0c1d0c" stroke="rgba(77,255,128,0.22)" strokeWidth="1" />
      {/* Accent bar on right face */}
      <polygon points="390,160  390,170  280,215  280,205" fill="rgba(77,255,128,0.12)" />
      {/* Label */}
      <text x="280" y="152" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#4dff80" letterSpacing="1.5">MICROBIOME</text>
      <text x="280" y="166" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="700" fill="#4dff80">$350</text>
      <text x="280" y="178" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(77,255,128,0.55)" letterSpacing="1">32/50 SLOTS</text>
      {/* Verified badge on card */}
      <rect x="254" y="186" width="52" height="10" rx="1" fill="rgba(77,255,128,0.08)" stroke="rgba(77,255,128,0.3)" strokeWidth="0.7" />
      <text x="280" y="193" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="5.5" fill="#4dff80" letterSpacing="0.8">✓ VERIFIED</text>

      {/* ── Card 3: top-right — "LONGEVITY" in amber ── */}
      <polygon points="280,60  370,22  460,60  370,98" fill="#1a1400" stroke="rgba(255,179,0,0.22)" strokeWidth="1" />
      <polygon points="280,60  280,115  370,153  370,98" fill="#110e00" stroke="rgba(255,179,0,0.14)" strokeWidth="1" />
      <polygon points="370,98  460,60  460,115  370,153" fill="#141100" stroke="rgba(255,179,0,0.18)" strokeWidth="1" />
      <text x="370" y="54" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="7" fill="#ffb300" letterSpacing="1.5">LONGEVITY</text>
      <text x="370" y="68" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" fontWeight="700" fill="#ffb300">$200</text>
      <text x="370" y="79" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(255,179,0,0.5)" letterSpacing="1">ACTIVE</text>

      {/* ── Bottom-left metric box ── */}
      <rect x="30" y="220" width="110" height="60" rx="2" fill="#0b120b" stroke="rgba(77,255,128,0.15)" strokeWidth="1" />
      <text x="42" y="238" fontFamily="'JetBrains Mono', monospace" fontSize="6.5" fill="rgba(77,255,128,0.4)" letterSpacing="1">// RELIABILITY</text>
      <text x="42" y="256" fontFamily="'JetBrains Mono', monospace" fontSize="18" fontWeight="700" fill="#4dff80">94.2</text>
      <text x="42" y="269" fontFamily="'JetBrains Mono', monospace" fontSize="6" fill="rgba(77,255,128,0.35)">participant score</text>

      {/* ── Bottom-right node graph ── */}
      {/* Nodes */}
      <circle cx="360" cy="280" r="5"  fill="#0b120b" stroke="#4dff80" strokeWidth="1.5" />
      <circle cx="400" cy="260" r="4"  fill="#0b120b" stroke="#00e5ff" strokeWidth="1.2" />
      <circle cx="430" cy="290" r="3.5" fill="#0b120b" stroke="#ffb300" strokeWidth="1.2" />
      <circle cx="380" cy="310" r="4"  fill="#0b120b" stroke="#4dff80" strokeWidth="1" />
      <circle cx="450" cy="270" r="3"  fill="#0b120b" stroke="#00e5ff" strokeWidth="1" />
      {/* Edges */}
      <line x1="360" y1="280" x2="400" y2="260" stroke="rgba(77,255,128,0.2)" strokeWidth="1" />
      <line x1="400" y1="260" x2="430" y2="290" stroke="rgba(0,229,255,0.18)" strokeWidth="1" />
      <line x1="430" y1="290" x2="380" y2="310" stroke="rgba(77,255,128,0.15)" strokeWidth="1" />
      <line x1="360" y1="280" x2="380" y2="310" stroke="rgba(77,255,128,0.12)" strokeWidth="0.8" />
      <line x1="400" y1="260" x2="450" y2="270" stroke="rgba(0,229,255,0.15)" strokeWidth="0.8" />

      {/* ── Corner brackets ── */}
      <path d="M8,8 L8,20 M8,8 L20,8"   stroke="rgba(77,255,128,0.2)" strokeWidth="1" fill="none" />
      <path d="M472,8 L472,20 M472,8 L460,8" stroke="rgba(77,255,128,0.2)" strokeWidth="1" fill="none" />
      <path d="M8,332 L8,320 M8,332 L20,332" stroke="rgba(77,255,128,0.2)" strokeWidth="1" fill="none" />
      <path d="M472,332 L472,320 M472,332 L460,332" stroke="rgba(77,255,128,0.2)" strokeWidth="1" fill="none" />
    </svg>
  );
}

// ─── Hero component ────────────────────────────────────────────────────────────

export function HeroSection({ stats }: Props) {
  return (
    <section className="px-4 md:px-6 pt-10 pb-2">
      <div className="grid md:grid-cols-2 gap-10 items-center">

        {/* ── Left: text + CTA ── */}
        <div>
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
                textShadow: '0 0 40px rgba(77,255,128,0.3)',
              }}
            >
              Earn from your biology.
            </span>
          </h1>

          <p className="text-sm leading-relaxed mb-8 max-w-md" style={{ color: 'var(--text-dim)' }}>
            Your body generates data every day. Biome turns that into structured participation
            in paid experiments — from sleep research to longevity trials.
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { label: 'ACTIVE',        value: String(stats.activeCount)          },
              { label: 'POOL',          value: fmt(stats.totalBountyPool)          },
              { label: 'PARTICIPANTS',  value: String(stats.totalParticipants)     },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 px-3 py-1.5 rounded"
                style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.1)' }}
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

        {/* ── Right: isometric art ── */}
        <div className="hidden md:flex items-center justify-center">
          <IsometricArt />
        </div>

      </div>
    </section>
  );
}
