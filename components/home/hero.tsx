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
        <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.08" />
        </filter>
        <filter id="chip-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.1" />
        </filter>
      </defs>

      {/* ── MAIN CARD ── */}
      <rect x={15} y={15} width={390} height={296} rx={16} fill="#ffffff" stroke="#e2e8f0" strokeWidth={1.5} filter="url(#card-shadow)" />

      {/* ── BADGE ROW ── */}
      <rect x={32} y={36} width={118} height={24} rx={12} fill="#e0f2f7" stroke="rgba(14,116,144,0.25)" strokeWidth={1} />
      <path d="M44,48 L48,52.5 L58,43.5" stroke="#0e7490" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x={98} y={52} textAnchor="middle" fill="#155e75" fontSize={8.5} fontWeight={600} fontFamily="Inter, system-ui, sans-serif" letterSpacing={0.8}>BIOME VERIFIED</text>

      <rect x={278} y={36} width={110} height={24} rx={12} fill="#ecfdf3" stroke="rgba(21,128,61,0.25)" strokeWidth={1} />
      <circle cx={293} cy={48} r={3.5} fill="#15803d" className="pulse-dot" />
      <text x={343} y={52} textAnchor="middle" fill="#15803d" fontSize={8.5} fontWeight={600} fontFamily="Inter, system-ui, sans-serif" letterSpacing={0.8}>RECRUITING</text>

      {/* ── STUDY TITLE ── */}
      <text x={32} y={86} fill="#0f172a" fontSize={16} fontWeight={700} fontFamily="Inter, system-ui, sans-serif" letterSpacing={-0.3}>Gut-Brain Microbiome</text>
      <text x={32} y={106} fill="#0f172a" fontSize={16} fontWeight={700} fontFamily="Inter, system-ui, sans-serif" letterSpacing={-0.3}>Intervention Study</text>

      {/* ── PI ROW ── */}
      <circle cx={43} cy={126} r={9} fill="#e0f2f7" stroke="#0e7490" strokeWidth={1.2} />
      <text x={43} y={129.5} textAnchor="middle" fill="#155e75" fontSize={7} fontWeight={700} fontFamily="Inter, system-ui, sans-serif">SC</text>
      <text x={58} y={129.5} fill="#64748b" fontSize={9} fontFamily="Inter, system-ui, sans-serif">Dr. S. Chen  ·  Stanford Medicine  ·  Phase II</text>

      <line x1={32} y1={144} x2={388} y2={144} stroke="#e2e8f0" strokeWidth={1} />

      {/* ── CATEGORY TAGS ── */}
      <rect x={32}  y={154} width={90} height={20} rx={10} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1} />
      <text x={77}  y={167.5} textAnchor="middle" fill="#475569" fontSize={8} fontWeight={600} fontFamily="Inter, system-ui, sans-serif" letterSpacing={0.6}>MICROBIOME</text>
      <rect x={130} y={154} width={80} height={20} rx={10} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1} />
      <text x={170} y={167.5} textAnchor="middle" fill="#475569" fontSize={8} fontWeight={600} fontFamily="Inter, system-ui, sans-serif" letterSpacing={0.6}>COGNITIVE</text>
      <rect x={218} y={154} width={62} height={20} rx={10} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1} />
      <text x={249} y={167.5} textAnchor="middle" fill="#475569" fontSize={8} fontWeight={600} fontFamily="Inter, system-ui, sans-serif" letterSpacing={0.6}>REMOTE</text>

      <line x1={32} y1={186} x2={388} y2={186} stroke="#e2e8f0" strokeWidth={1} />

      {/* ── STATS (3 cols) ── */}
      <text x={32}  y={203} fill="#94a3b8" fontSize={8} fontWeight={600} fontFamily="Inter, system-ui, sans-serif" letterSpacing={1.2}>COMPENSATION</text>
      <text x={32}  y={225} fill="#0f172a" fontSize={21} fontWeight={700} fontFamily="Inter, system-ui, sans-serif">$240</text>
      <text x={32}  y={238} fill="#94a3b8" fontSize={7.5} fontFamily="Inter, system-ui, sans-serif">per research partner</text>
      <line x1={168} y1={196} x2={168} y2={242} stroke="#e2e8f0" strokeWidth={1} />

      <text x={182} y={203} fill="#94a3b8" fontSize={8} fontWeight={600} fontFamily="Inter, system-ui, sans-serif" letterSpacing={1.2}>DURATION</text>
      <text x={182} y={225} fill="#0f172a" fontSize={21} fontWeight={700} fontFamily="Inter, system-ui, sans-serif">8 wks</text>
      <text x={182} y={238} fill="#94a3b8" fontSize={7.5} fontFamily="Inter, system-ui, sans-serif">12 sessions</text>
      <line x1={296} y1={196} x2={296} y2={242} stroke="#e2e8f0" strokeWidth={1} />

      <text x={310} y={203} fill="#94a3b8" fontSize={8} fontWeight={600} fontFamily="Inter, system-ui, sans-serif" letterSpacing={1.2}>ENROLLED</text>
      <text x={310} y={224} fill="#0f172a" fontSize={21} fontWeight={700} fontFamily="Inter, system-ui, sans-serif">42<tspan fill="#94a3b8" fontSize={13} fontWeight={500}>/50</tspan></text>
      <text x={310} y={238} fill="#0e7490" fontSize={7.5} fontWeight={600} fontFamily="Inter, system-ui, sans-serif">84% filled</text>

      <line x1={32} y1={252} x2={388} y2={252} stroke="#e2e8f0" strokeWidth={1} />

      {/* ── ENROLLMENT FUNNEL ── */}
      <text x={32} y={267} fill="#94a3b8" fontSize={7.5} fontWeight={600} fontFamily="Inter, system-ui, sans-serif" letterSpacing={1.2}>ENROLLMENT FUNNEL</text>

      <text x={32}  y={282} fill="#64748b" fontSize={7.5} fontFamily="Inter, system-ui, sans-serif">Applied</text>
      <rect x={92} y={275} width={256} height={7} rx={3.5} fill="#f1f5f9" />
      <rect x={92} y={275} width={256} height={7} rx={3.5} fill="#cbd5e1">
        <animate attributeName="width" from="0" to="256" dur="1.1s" begin="0.3s" fill="freeze" calcMode="spline" keySplines="0.2 0 0 1" />
      </rect>
      <text x={356} y={282} fill="#475569" fontSize={7.5} fontWeight={600} fontFamily="Inter, system-ui, sans-serif">127</text>

      <text x={32}  y={296} fill="#64748b" fontSize={7.5} fontFamily="Inter, system-ui, sans-serif">Screened</text>
      <rect x={92} y={289} width={256} height={7} rx={3.5} fill="#f1f5f9" />
      <rect x={92} y={289} width={137} height={7} rx={3.5} fill="#7dd3e8">
        <animate attributeName="width" from="0" to="137" dur="1.1s" begin="0.5s" fill="freeze" calcMode="spline" keySplines="0.2 0 0 1" />
      </rect>
      <text x={356} y={296} fill="#475569" fontSize={7.5} fontWeight={600} fontFamily="Inter, system-ui, sans-serif">68</text>

      <text x={32}  y={310} fill="#0e7490" fontSize={7.5} fontWeight={600} fontFamily="Inter, system-ui, sans-serif">Enrolled</text>
      <rect x={92} y={303} width={256} height={7} rx={3.5} fill="#f1f5f9" />
      <rect x={92} y={303} width={85}  height={7} rx={3.5} fill="#0e7490">
        <animate attributeName="width" from="0" to="85" dur="1.1s" begin="0.7s" fill="freeze" calcMode="spline" keySplines="0.2 0 0 1" />
      </rect>
      <text x={356} y={310} fill="#0e7490" fontSize={7.5} fontWeight={700} fontFamily="Inter, system-ui, sans-serif">42</text>

      {/* ── FLOATING NOTIFICATION CHIP ── */}
      <g className="float-soft">
        <rect x={398} y={50} width={92} height={26} rx={13} fill="#ffffff" stroke="#e2e8f0" strokeWidth={1} filter="url(#chip-shadow)" />
        <circle cx={413} cy={63} r={4} fill="#0e7490" />
        <path d="M411,63 L412.5,64.5 L415.5,61.5" stroke="#fff" strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x={450} y={66.5} textAnchor="middle" fill="#475569" fontSize={8} fontWeight={600} fontFamily="Inter, system-ui, sans-serif">3 new applicants</text>
      </g>

      {/* ── FLOATING CARD 2 (active study) ── */}
      <g className="float-soft" style={{ animationDelay: '1.5s' }}>
        <rect x={257} y={332} width={228} height={104} rx={14} fill="#ffffff" stroke="#e2e8f0" strokeWidth={1.5} filter="url(#card-shadow)" />
        <rect x={273} y={348} width={66} height={20} rx={10} fill="#e0f2f7" stroke="rgba(14,116,144,0.25)" strokeWidth={1} />
        <circle cx={286} cy={358} r={3} fill="#0e7490" className="pulse-dot" />
        <text x={311} y={361.5} textAnchor="middle" fill="#155e75" fontSize={8} fontWeight={600} fontFamily="Inter, system-ui, sans-serif" letterSpacing={0.8}>ACTIVE</text>
        <rect x={273} y={380} width={140} height={7} rx={3.5} fill="#e8edf3" />
        <rect x={273} y={393} width={100} height={7} rx={3.5} fill="#f1f5f9" />
        <text x={469} y={414} textAnchor="end" fill="#0f172a" fontSize={17} fontWeight={700} fontFamily="Inter, system-ui, sans-serif">$180</text>
        <text x={469} y={427} textAnchor="end" fill="#94a3b8" fontSize={7.5} fontFamily="Inter, system-ui, sans-serif">per research partner</text>
      </g>

      {/* ── COMPLIANCE CHIP ── */}
      <g className="float-soft" style={{ animationDelay: '0.8s', animationDuration: '7s' }}>
        <rect x={14} y={336} width={158} height={28} rx={14} fill="#ffffff" stroke="#e2e8f0" strokeWidth={1} filter="url(#chip-shadow)" />
        <circle cx={30} cy={350} r={6} fill="none" stroke="#15803d" strokeWidth={1.4} />
        <path d="M27.5,350.5 L29.5,352.5 L33,348.5" stroke="#15803d" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x={42} y={354} fill="#475569" fontSize={8.5} fontWeight={600} fontFamily="Inter, system-ui, sans-serif">Ethics approval on file</text>
      </g>
    </svg>
  );
}

export function HomeHero() {
  return (
    <section
      style={{
        background:   'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        minHeight:    '82vh',
        display:      'flex',
        alignItems:   'center',
        borderBottom: '1px solid var(--border-soft)',
        position:     'relative',
        overflow:     'hidden',
      }}
    >
      <div
        style={{
          maxWidth:            1140,
          margin:              '0 auto',
          padding:             'clamp(56px, 9vh, 96px) 24px',
          width:               '100%',
          display:             'grid',
          gridTemplateColumns: 'minmax(0, 54%) minmax(0, 46%)',
          gap:                 56,
          alignItems:          'center',
          position:            'relative',
          zIndex:              1,
        }}
        className="hero-grid"
      >
        {/* LEFT */}
        <div>
          <span className="rise-1 section-label">
            Clinical Operations Platform
          </span>

          <h1 className="rise-2" style={{
            fontFamily:   'var(--font-display)',
            fontWeight:   700,
            fontSize:     'var(--text-hero)',
            lineHeight:   1.08,
            color:        'var(--ink)',
            marginBottom: 24,
            letterSpacing: '-0.025em',
          }}>
            The operations layer<br />
            <span style={{ color: 'var(--teal)' }}>for human studies.</span>
          </h1>

          <p className="rise-3" style={{
            fontFamily:   'var(--font-body)',
            fontSize:     'var(--text-lead)',
            color:        'var(--slate)',
            lineHeight:   1.7,
            maxWidth:     460,
            marginBottom: 36,
          }}>
            From protocol to clean data — recruitment, compliance, logistics,
            and compensation. You own the science. We run the operations.
          </p>

          <div className="rise-4" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 44 }}>
            <Link href="/run-a-study" className="btn-primary">
              Run a study →
            </Link>
            <Link href="/onboarding?role=participant" className="btn-secondary">
              Join a study
            </Link>
          </div>

          {/* Micro trust strip */}
          <div className="rise-4" style={{
            display:    'flex',
            gap:        0,
            flexWrap:   'wrap',
            borderTop:  '1px solid var(--border-soft)',
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
                borderRight:  i < 2 ? '1px solid var(--border-soft)' : 'none',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize:   17,
                  color:      'var(--teal-dark)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {num}
                </span>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize:   12.5,
                  color:      'var(--muted)',
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
