'use client';

import Link from 'next/link';

function StudyCardSVG() {
  return (
    <svg
      viewBox="0 0 500 460"
      style={{ width: '100%', height: 'auto', maxWidth: 500, overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <pattern id="card-micro-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(15,26,46,0.045)" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* ── MAIN CARD ── */}
      <rect x={23} y={23} width={390} height={292} fill="#000000" />
      <rect x={15} y={15} width={390} height={292} fill="#ffffff" stroke="#000000" strokeWidth={3} />
      <rect x={15} y={15} width={390} height={292} fill="url(#card-micro-grid)" />
      <rect x={15} y={15} width={390} height={7}   fill="#f59e0b" />
      <rect x={15} y={22} width={4}   height={285} fill="rgba(245,158,11,0.28)" />

      {/* ── BADGE ROW ── */}
      <rect x={30} y={36} width={124} height={23} fill="#f59e0b" stroke="#000000" strokeWidth={2} />
      <path d="M42,49 L46,53.5 L57,44" stroke="#000" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x={96} y={52} textAnchor="middle" fill="#000000" fontSize={8} fontWeight={700} fontFamily="Space Grotesk, system-ui, sans-serif" letterSpacing={1.5}>BIOME VERIFIED</text>

      <rect x={274} y={36} width={113} height={23} fill="#0f1a2e" stroke="#000000" strokeWidth={2} />
      <circle cx={289} cy={47.5} r={3.5} fill="#f59e0b" className="pulse-dot" />
      <text x={337} y={52} textAnchor="middle" fill="#f59e0b" fontSize={8} fontWeight={700} fontFamily="Space Grotesk, system-ui, sans-serif" letterSpacing={1.5}>RECRUITING</text>

      {/* ── STUDY TITLE ── */}
      <text x={30} y={82} fill="#0f1a2e" fontSize={15.5} fontWeight={800} fontFamily="Space Grotesk, system-ui, sans-serif" letterSpacing={-0.3}>Gut-Brain Microbiome</text>
      <text x={30} y={101} fill="#0f1a2e" fontSize={15.5} fontWeight={800} fontFamily="Space Grotesk, system-ui, sans-serif" letterSpacing={-0.3}>Intervention Study</text>

      {/* ── PI ROW ── */}
      <circle cx={43} cy={119} r={9} fill="#dde4f0" stroke="#0f1a2e" strokeWidth={1.5} />
      <text x={43} y={123} textAnchor="middle" fill="#0f1a2e" fontSize={7} fontWeight={800} fontFamily="Space Grotesk, system-ui, sans-serif">SC</text>
      <text x={58} y={123} fill="#64748b" fontSize={8.5} fontFamily="Space Grotesk, system-ui, sans-serif">Dr. S. Chen  ·  Stanford Medicine  ·  Phase II</text>

      {/* ── DIVIDER ── */}
      <line x1={30} y1={137} x2={389} y2={137} stroke="#0f1a2e" strokeWidth={1} opacity={0.1} />

      {/* ── CATEGORY TAGS ── */}
      <rect x={30}  y={147} width={88} height={19} fill="none" stroke="#0f1a2e" strokeWidth={1.5} />
      <text x={74}  y={160.5} textAnchor="middle" fill="#0f1a2e" fontSize={7.5} fontWeight={700} fontFamily="Space Grotesk, system-ui, sans-serif" letterSpacing={1}>MICROBIOME</text>
      <rect x={128} y={147} width={78} height={19} fill="none" stroke="#0f1a2e" strokeWidth={1.5} />
      <text x={167} y={160.5} textAnchor="middle" fill="#0f1a2e" fontSize={7.5} fontWeight={700} fontFamily="Space Grotesk, system-ui, sans-serif" letterSpacing={1}>COGNITIVE</text>
      <rect x={216} y={147} width={58} height={19} fill="none" stroke="#0f1a2e" strokeWidth={1.5} />
      <text x={245} y={160.5} textAnchor="middle" fill="#0f1a2e" fontSize={7.5} fontWeight={700} fontFamily="Space Grotesk, system-ui, sans-serif" letterSpacing={1}>REMOTE</text>

      {/* ── DIVIDER ── */}
      <line x1={30} y1={177} x2={389} y2={177} stroke="#0f1a2e" strokeWidth={1} opacity={0.1} />

      {/* ── STATS (3 cols) ── */}
      <text x={30}  y={194} fill="#94a3b8" fontSize={8} fontWeight={600} fontFamily="Space Grotesk, system-ui, sans-serif" letterSpacing={2}>BOUNTY</text>
      <text x={30}  y={216} fill="#0f1a2e" fontSize={22} fontWeight={800} fontFamily="Space Grotesk, system-ui, sans-serif">$240</text>
      <text x={30}  y={229} fill="#94a3b8" fontSize={7.5} fontFamily="Space Grotesk, system-ui, sans-serif">per participant</text>
      <line x1={165} y1={184} x2={165} y2={235} stroke="#0f1a2e" strokeWidth={1} opacity={0.08} />

      <text x={176} y={194} fill="#94a3b8" fontSize={8} fontWeight={600} fontFamily="Space Grotesk, system-ui, sans-serif" letterSpacing={2}>DURATION</text>
      <text x={176} y={216} fill="#0f1a2e" fontSize={22} fontWeight={800} fontFamily="Space Grotesk, system-ui, sans-serif">8 wks</text>
      <text x={176} y={229} fill="#94a3b8" fontSize={7.5} fontFamily="Space Grotesk, system-ui, sans-serif">12 sessions</text>
      <line x1={302} y1={184} x2={302} y2={235} stroke="#0f1a2e" strokeWidth={1} opacity={0.08} />

      <text x={314} y={194} fill="#94a3b8" fontSize={8} fontWeight={600} fontFamily="Space Grotesk, system-ui, sans-serif" letterSpacing={2}>ENROLLED</text>
      <text x={314} y={215} fill="#0f1a2e" fontSize={22} fontWeight={800} fontFamily="Space Grotesk, system-ui, sans-serif">42<tspan fill="#94a3b8" fontSize={13} fontWeight={600}>/50</tspan></text>
      <text x={314} y={229} fill="#f59e0b" fontSize={7.5} fontWeight={600} fontFamily="Space Grotesk, system-ui, sans-serif">84% filled</text>

      {/* ── DIVIDER ── */}
      <line x1={30} y1={247} x2={389} y2={247} stroke="#0f1a2e" strokeWidth={1} opacity={0.1} />

      {/* ── ENROLLMENT FUNNEL ── */}
      <text x={30} y={262} fill="#94a3b8" fontSize={7.5} fontWeight={600} fontFamily="Space Grotesk, system-ui, sans-serif" letterSpacing={2}>ENROLLMENT FUNNEL</text>

      {/* Applied: 127 */}
      <text x={30}  y={278} fill="#64748b" fontSize={7.5} fontFamily="Space Grotesk, system-ui, sans-serif">APPLIED</text>
      <rect x={90} y={270} width={258} height={8} fill="rgba(15,26,46,0.07)" />
      <rect x={90} y={270} width={258} height={8} fill="rgba(15,26,46,0.28)">
        <animate attributeName="width" from="0" to="258" dur="1.1s" begin="0.3s" fill="freeze" calcMode="spline" keySplines="0.2 0 0 1" />
      </rect>
      <text x={354} y={278} fill="#0f1a2e" fontSize={7.5} fontWeight={700} fontFamily="Space Grotesk, system-ui, sans-serif">127</text>

      {/* Screened: 68 → 258*68/127 ≈ 138 */}
      <text x={30}  y={292} fill="#64748b" fontSize={7.5} fontFamily="Space Grotesk, system-ui, sans-serif">SCREENED</text>
      <rect x={90} y={284} width={258} height={8} fill="rgba(15,26,46,0.07)" />
      <rect x={90} y={284} width={138} height={8} fill="rgba(15,26,46,0.2)">
        <animate attributeName="width" from="0" to="138" dur="1.1s" begin="0.5s" fill="freeze" calcMode="spline" keySplines="0.2 0 0 1" />
      </rect>
      <text x={354} y={292} fill="#0f1a2e" fontSize={7.5} fontWeight={700} fontFamily="Space Grotesk, system-ui, sans-serif">68</text>

      {/* Enrolled: 42 → 258*42/127 ≈ 85 — amber */}
      <text x={30}  y={306} fill="#f59e0b" fontSize={7.5} fontWeight={600} fontFamily="Space Grotesk, system-ui, sans-serif">ENROLLED</text>
      <rect x={90} y={298} width={258} height={8} fill="rgba(15,26,46,0.07)" />
      <rect x={90} y={298} width={85}  height={8} fill="#f59e0b">
        <animate attributeName="width" from="0" to="85" dur="1.1s" begin="0.7s" fill="freeze" calcMode="spline" keySplines="0.2 0 0 1" />
      </rect>
      <text x={354} y={306} fill="#f59e0b" fontSize={7.5} fontWeight={700} fontFamily="Space Grotesk, system-ui, sans-serif">42</text>

      {/* ── FLOATING NOTIFICATION CHIP (right edge) ── */}
      <g className="float-soft">
        <rect x={411} y={53} width={82} height={22} fill="#000000" />
        <rect x={405} y={47} width={82} height={22} fill="#f59e0b" stroke="#000000" strokeWidth={2} />
        <path d="M416,58 L421,63 L429,55" stroke="#000" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x={456} y={62.5} textAnchor="middle" fill="#000000" fontSize={7.5} fontWeight={700} fontFamily="Space Grotesk, system-ui, sans-serif" letterSpacing={1}>3 NEW APPS</text>
      </g>

      {/* ── FLOATING CARD 2 (ACTIVE study, navy, bottom-right) ── */}
      <g className="float-soft" style={{ animationDelay: '1.5s' }}>
        <rect x={265} y={336} width={222} height={104} fill="#000000" />
        <rect x={257} y={328} width={222} height={104} fill="#0f1a2e" stroke="#f59e0b" strokeWidth={2} />
        <rect x={257} y={328} width={222} height={5}   fill="#f59e0b" />
        <rect x={271} y={345} width={64}  height={18}  fill="rgba(245,158,11,0.15)" stroke="#f59e0b" strokeWidth={1.5} />
        <circle cx={283} cy={354} r={3} fill="#f59e0b" className="pulse-dot" />
        <text x={308} y={358} textAnchor="middle" fill="#f59e0b" fontSize={7.5} fontWeight={700} fontFamily="Space Grotesk, system-ui, sans-serif" letterSpacing={1.5}>ACTIVE</text>
        <rect x={271} y={374} width={140} height={8} fill="rgba(255,255,255,0.14)" />
        <rect x={271} y={388} width={100} height={8} fill="rgba(255,255,255,0.08)" />
        <text x={467} y={406} textAnchor="end" fill="#f59e0b" fontSize={18} fontWeight={800} fontFamily="Space Grotesk, system-ui, sans-serif">$180</text>
        <text x={467} y={420} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize={7.5} fontFamily="Space Grotesk, system-ui, sans-serif">per participant</text>
      </g>

      {/* ── IRB APPROVED chip (floating, bottom-left) ── */}
      <g className="float-soft" style={{ animationDelay: '0.8s', animationDuration: '7s' }}>
        <rect x={20} y={333} width={132} height={24} fill="#000000" />
        <rect x={14} y={327} width={132} height={24} fill="#0f1a2e" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
        <circle cx={26} cy={339} r={5} fill="none" stroke="#4ade80" strokeWidth={1.5} />
        <path d="M23.5,339.5 L25.5,341.5 L29,337.5" stroke="#4ade80" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x={38} y={343.5} fill="rgba(255,255,255,0.55)" fontSize={7.5} fontWeight={600} fontFamily="Space Grotesk, system-ui, sans-serif" letterSpacing={1}>IRB APPROVED</text>
      </g>

      {/* ── CORNER BRACKETS ── */}
      <path d="M455,6 L479,6 L479,30"   stroke="#f59e0b" strokeWidth={3} fill="none" opacity={0.45} />
      <path d="M15,424 L15,448 L39,448" stroke="rgba(255,255,255,0.15)" strokeWidth={3} fill="none" />
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
