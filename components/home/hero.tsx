'use client';

import Link from 'next/link';

function StudyCardSVG() {
  return (
    <svg viewBox="0 0 480 400" style={{ width: '100%', height: 'auto', maxWidth: 500, overflow: 'visible' }} aria-hidden="true">
      {/* ── Main study card ── */}
      {/* Shadow */}
      <rect x={34} y={34} width={360} height={228} fill="#000000" />
      {/* Card */}
      <rect x={26} y={26} width={360} height={228} fill="#ffffff" stroke="#000000" strokeWidth={3} />
      {/* Amber top edge */}
      <rect x={26} y={26} width={360} height={6} fill="#f59e0b" />

      {/* Status badge with live dot */}
      <rect x={42} y={50} width={98} height={24} fill="#f59e0b" stroke="#000000" strokeWidth={2} />
      <circle cx={56} cy={62} r={3.5} fill="#000000" className="pulse-dot" />
      <text x={98} y={66} textAnchor="middle" fill="#000000" fontSize={9} fontWeight={700} fontFamily="Space Grotesk, sans-serif" letterSpacing={2}>RECRUITING</text>

      {/* Study title lines */}
      <rect x={42} y={90} width={220} height={11} fill="#0f1a2e" />
      <rect x={42} y={109} width={160} height={11} fill="rgba(15,26,46,0.3)" />

      {/* Category + region tags */}
      <rect x={42} y={134} width={74} height={19} fill="none" stroke="#000000" strokeWidth={1.5} />
      <text x={79} y={147} textAnchor="middle" fill="#000000" fontSize={8} fontWeight={600} fontFamily="Space Grotesk, sans-serif" letterSpacing={1}>MICROBIOME</text>
      <rect x={126} y={134} width={52} height={19} fill="none" stroke="#000000" strokeWidth={1.5} />
      <text x={152} y={147} textAnchor="middle" fill="#000000" fontSize={8} fontWeight={600} fontFamily="Space Grotesk, sans-serif" letterSpacing={1}>REMOTE</text>

      {/* Divider */}
      <line x1={42} y1={166} x2={372} y2={166} stroke="#000000" strokeWidth={1.5} opacity={0.15} />

      {/* Stats row */}
      <text x={42} y={186} fill="#64748b" fontSize={9} fontFamily="Space Grotesk, sans-serif" letterSpacing={2} fontWeight={600}>BOUNTY</text>
      <text x={42} y={205} fill="#0f1a2e" fontSize={21} fontFamily="Space Grotesk, sans-serif" fontWeight={700}>$240</text>

      <text x={160} y={186} fill="#64748b" fontSize={9} fontFamily="Space Grotesk, sans-serif" letterSpacing={2} fontWeight={600}>DURATION</text>
      <text x={160} y={205} fill="#0f1a2e" fontSize={21} fontFamily="Space Grotesk, sans-serif" fontWeight={700}>8 wks</text>

      <text x={280} y={186} fill="#64748b" fontSize={9} fontFamily="Space Grotesk, sans-serif" letterSpacing={2} fontWeight={600}>SLOTS</text>
      <text x={280} y={205} fill="#0f1a2e" fontSize={21} fontFamily="Space Grotesk, sans-serif" fontWeight={700}>42<tspan fill="#64748b" fontSize={14}>/50</tspan></text>

      {/* Progress bar */}
      <rect x={42} y={226} width={330} height={11} fill="rgba(0,0,0,0.06)" stroke="#000000" strokeWidth={1.5} />
      <rect x={42} y={226} width={277} height={11} fill="#f59e0b">
        <animate attributeName="width" from="0" to="277" dur="1.4s" begin="0.4s" fill="freeze" calcMode="spline" keySplines="0.2 0 0 1" />
      </rect>

      {/* ── Second card (floating, offset below-right) ── */}
      <g className="float-soft">
        <rect x={250} y={282} width={224} height={100} fill="#000000" />
        <rect x={242} y={274} width={224} height={100} fill="#0f1a2e" stroke="#f59e0b" strokeWidth={2.5} />

        <rect x={258} y={290} width={58} height={19} fill="rgba(245,158,11,0.18)" stroke="#f59e0b" strokeWidth={1.5} />
        <circle cx={270} cy={299.5} r={3} fill="#f59e0b" className="pulse-dot" />
        <text x={292} y={303} textAnchor="middle" fill="#f59e0b" fontSize={8} fontWeight={700} fontFamily="Space Grotesk, sans-serif" letterSpacing={1.5}>ACTIVE</text>

        <rect x={258} y={320} width={140} height={9} fill="rgba(255,255,255,0.16)" />
        <rect x={258} y={337} width={100} height={9} fill="rgba(255,255,255,0.08)" />

        <text x={448} y={352} textAnchor="end" fill="#f59e0b" fontSize={17} fontWeight={700} fontFamily="Space Grotesk, sans-serif">$180</text>
      </g>

      {/* ── Corner bracket decorations ── */}
      <path d="M444,16 L468,16 L468,40" stroke="#f59e0b" strokeWidth={3} fill="none" opacity={0.5} />
      <path d="M14,360 L14,386 L40,386" stroke="#ffffff" strokeWidth={3} fill="none" opacity={0.18} />

      {/* ── Floating data chip ── */}
      <rect x={306} y={50} width={80} height={22} fill="rgba(0,0,0,0.75)" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      <text x={346} y={65} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize={9} fontFamily="Space Grotesk, sans-serif" letterSpacing={1.5}>LIVE NOW</text>
    </svg>
  );
}

export function HomeHero() {
  return (
    <section
      className="texture-grid"
      style={{
        background:   'var(--navy)',
        minHeight:    '88vh',
        display:      'flex',
        alignItems:   'center',
        borderBottom: '3px solid var(--black)',
        position:     'relative',
        overflow:     'hidden',
      }}
    >
      {/* Giant outline watermark */}
      <span
        className="outline-watermark"
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom:   -28,
          right:    -16,
          fontSize: 'clamp(120px, 18vw, 260px)',
          zIndex:   0,
        }}
      >
        BIOME
      </span>

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
          position:            'relative',
          zIndex:              1,
        }}
        className="hero-grid"
      >
        {/* LEFT */}
        <div>
          <span className="rise-1" style={{
            fontFamily:    'var(--font-display)',
            fontSize:      13,
            fontWeight:    700,
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color:         'var(--amber)',
            display:       'inline-flex',
            alignItems:    'center',
            gap:           12,
            marginBottom:  24,
          }}>
            <span style={{ width: 28, height: 4, background: 'var(--amber)', display: 'inline-block' }} />
            Clinical Operations Platform
          </span>

          <h1 className="rise-2" style={{
            fontFamily:   'var(--font-display)',
            fontWeight:   700,
            fontSize:     'var(--text-hero)',
            lineHeight:   1.05,
            color:        'var(--white)',
            marginBottom: 28,
          }}>
            The operations layer<br />
            <span style={{
              color:      'var(--amber)',
              boxShadow:  'inset 0 -0.18em 0 rgba(245,158,11,0.25)',
            }}>for human studies.</span>
          </h1>

          <p className="rise-3" style={{
            fontFamily:   'var(--font-body)',
            fontSize:     'var(--text-lead)',
            color:        'rgba(255,255,255,0.75)',
            lineHeight:   1.65,
            maxWidth:     440,
            marginBottom: 40,
          }}>
            From protocol to clean data — recruitment, compliance, logistics,
            and payouts. You own the science. We run the operations.
          </p>

          <div className="rise-4" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 44 }}>
            <Link href="/run-a-study" className="btn-primary">
              Run a study →
            </Link>
            <Link href="/onboarding?role=participant" className="btn-secondary">
              Join as participant
            </Link>
          </div>

          {/* Micro trust strip */}
          <div className="rise-4" style={{
            display:    'flex',
            gap:        0,
            flexWrap:   'wrap',
            borderTop:  '2px solid rgba(255,255,255,0.12)',
            paddingTop: 20,
          }}>
            {[
              ['30 days', 'protocol to live'],
              ['5', 'sample types'],
              ['3', 'geographies'],
            ].map(([num, label], i) => (
              <div key={label} style={{
                display:      'flex',
                alignItems:   'baseline',
                gap:          8,
                paddingRight: 24,
                marginRight:  24,
                borderRight:  i < 2 ? '2px solid rgba(255,255,255,0.12)' : 'none',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize:   18,
                  color:      'var(--amber)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {num}
                </span>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize:   12,
                  color:      'rgba(255,255,255,0.45)',
                  letterSpacing: '0.3px',
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — study card visualization */}
        <div className="hero-art rise-3" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
