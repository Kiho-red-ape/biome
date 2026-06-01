'use client';

import Link from 'next/link';

function StudyCardSVG() {
  return (
    <svg viewBox="0 0 480 380" style={{ width: '100%', height: 'auto', maxWidth: 480 }} aria-hidden="true">
      {/* ── Main study card ── */}
      {/* Shadow */}
      <rect x={32} y={32} width={360} height={220} fill="rgba(0,0,0,0.6)" />
      {/* Card */}
      <rect x={26} y={26} width={360} height={220} fill="#ffffff" stroke="#000000" strokeWidth={3} />

      {/* Status badge */}
      <rect x={42} y={44} width={88} height={24} fill="#f59e0b" stroke="#000000" strokeWidth={2} />
      <text x={86} y={60} textAnchor="middle" fill="#000000" fontSize={9} fontWeight={700} fontFamily="Space Grotesk, sans-serif" letterSpacing={2}>RECRUITING</text>

      {/* Study title lines */}
      <rect x={42} y={82} width={220} height={10} fill="#0f1a2e" rx={0} />
      <rect x={42} y={100} width={160} height={10} fill="rgba(15,26,46,0.35)" rx={0} />

      {/* Category + region tags */}
      <rect x={42} y={126} width={60} height={18} fill="none" stroke="#000000" strokeWidth={1.5} />
      <text x={72} y={139} textAnchor="middle" fill="#000000" fontSize={8} fontWeight={600} fontFamily="Space Grotesk, sans-serif" letterSpacing={1}>MICROBIOME</text>
      <rect x={112} y={126} width={46} height={18} fill="none" stroke="#000000" strokeWidth={1.5} />
      <text x={135} y={139} textAnchor="middle" fill="#000000" fontSize={8} fontWeight={600} fontFamily="Space Grotesk, sans-serif" letterSpacing={1}>REMOTE</text>

      {/* Divider */}
      <line x1={42} y1={158} x2={372} y2={158} stroke="rgba(0,0,0,0.15)" strokeWidth={1.5} />

      {/* Stats row */}
      <text x={42} y={178} fill="#64748b" fontSize={9} fontFamily="Space Grotesk, sans-serif" letterSpacing={2} fontWeight={600}>BOUNTY</text>
      <text x={42} y={196} fill="#0f1a2e" fontSize={20} fontFamily="Space Grotesk, sans-serif" fontWeight={700}>$240</text>

      <text x={160} y={178} fill="#64748b" fontSize={9} fontFamily="Space Grotesk, sans-serif" letterSpacing={2} fontWeight={600}>DURATION</text>
      <text x={160} y={196} fill="#0f1a2e" fontSize={20} fontFamily="Space Grotesk, sans-serif" fontWeight={700}>8 wks</text>

      <text x={280} y={178} fill="#64748b" fontSize={9} fontFamily="Space Grotesk, sans-serif" letterSpacing={2} fontWeight={600}>SLOTS</text>
      <text x={280} y={196} fill="#0f1a2e" fontSize={20} fontFamily="Space Grotesk, sans-serif" fontWeight={700}>42<tspan fill="#64748b" fontSize={14}>/50</tspan></text>

      {/* Progress bar */}
      <rect x={42} y={218} width={330} height={10} fill="rgba(0,0,0,0.06)" stroke="#000000" strokeWidth={1.5} />
      <rect x={42} y={218} width={277} height={10} fill="#f59e0b" />

      {/* ── Second card (smaller, offset below-right) ── */}
      <rect x={246} y={258} width={220} height={96} fill="rgba(0,0,0,0.5)" />
      <rect x={240} y={252} width={220} height={96} fill="#0f1a2e" stroke="#f59e0b" strokeWidth={2.5} />

      <rect x={256} y={268} width={56} height={18} fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth={1.5} />
      <text x={284} y={281} textAnchor="middle" fill="#f59e0b" fontSize={8} fontWeight={700} fontFamily="Space Grotesk, sans-serif" letterSpacing={1.5}>ACTIVE</text>

      <rect x={256} y={296} width={140} height={8} fill="rgba(255,255,255,0.15)" />
      <rect x={256} y={312} width={100} height={8} fill="rgba(255,255,255,0.08)" />

      <text x={440} y={326} textAnchor="end" fill="#f59e0b" fontSize={16} fontWeight={700} fontFamily="Space Grotesk, sans-serif">$180</text>

      {/* ── Corner bracket decorations ── */}
      <path d="M440,20 L460,20 L460,40" stroke="rgba(245,158,11,0.4)" strokeWidth={2.5} fill="none" />
      <path d="M20,340 L20,360 L40,360" stroke="rgba(255,255,255,0.15)" strokeWidth={2.5} fill="none" />

      {/* ── Floating label ── */}
      <rect x={310} y={44} width={76} height={22} fill="rgba(0,0,0,0.7)" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
      <text x={348} y={59} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={9} fontFamily="Space Grotesk, sans-serif" letterSpacing={1}>LIVE NOW</text>
    </svg>
  );
}

export function HomeHero() {
  return (
    <section
      style={{
        background:   'var(--navy)',
        minHeight:    '88vh',
        display:      'flex',
        alignItems:   'center',
        borderBottom: '3px solid var(--black)',
      }}
    >
      <div
        style={{
          maxWidth:            1200,
          margin:              '0 auto',
          padding:             'clamp(60px, 10vh, 100px) 24px',
          width:               '100%',
          display:             'grid',
          gridTemplateColumns: 'minmax(0, 54%) minmax(0, 46%)',
          gap:                 64,
          alignItems:          'center',
        }}
        className="hero-grid"
      >
        {/* LEFT */}
        <div>
          <span style={{
            fontFamily:    'var(--font-display)',
            fontSize:      13,
            fontWeight:    600,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color:         'var(--amber)',
            display:       'block',
            marginBottom:  20,
          }}>
            Clinical Operations Platform
          </span>

          <h1 style={{
            fontFamily:  'var(--font-display)',
            fontWeight:  700,
            fontSize:    'clamp(32px, 4.5vw, 56px)',
            lineHeight:  1.08,
            color:       'var(--white)',
            marginBottom: 24,
          }}>
            The operations layer<br />
            <span style={{ color: 'var(--amber)' }}>for human studies.</span>
          </h1>

          <p style={{
            fontFamily:  'var(--font-body)',
            fontSize:    18,
            color:       'rgba(255,255,255,0.75)',
            lineHeight:  1.6,
            maxWidth:    420,
            marginBottom: 40,
          }}>
            From protocol to clean data — recruitment, compliance, logistics,
            and payouts. You own the science. We run the operations.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/run-a-study" className="btn-primary">
              Run a study →
            </Link>
            <Link href="/onboarding?role=participant" className="btn-secondary">
              Join as participant
            </Link>
          </div>
        </div>

        {/* RIGHT — study card visualization */}
        <div className="hero-art" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <StudyCardSVG />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
          .hero-art  { display: none !important; }
        }
      `}</style>
    </section>
  );
}
