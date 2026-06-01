const BIOME_HANDLES = [
  'Recruitment',
  'Eligibility screening',
  'Consent capture',
  'Sample logistics',
  'Compliance tracking',
  'Payouts',
  'Data export',
];

const YOU_KEEP = [
  'Protocol',
  'Medical oversight',
  'Analysis',
  'Regulatory',
  'Publication',
];

export function ScopeSection() {
  return (
    <section style={{ background: 'var(--navy)', borderBottom: '3px solid var(--black)' }}>
      <div className="section-inner">
        <h2 style={{
          fontFamily:   'var(--font-display)',
          fontSize:     'clamp(26px, 3vw, 40px)',
          color:        'var(--white)',
          marginBottom: 48,
          lineHeight:   1.1,
        }}>
          What we handle.<br />
          <span style={{ color: 'var(--amber)' }}>What you keep.</span>
        </h2>

        <div
          style={{
            display:             'grid',
            gridTemplateColumns: '1fr 4px 1fr',
            gap:                 40,
            alignItems:          'start',
          }}
          className="scope-grid"
        >
          {/* Left — Biome handles */}
          <div>
            <p style={{
              fontFamily:    'var(--font-display)',
              fontSize:      13,
              fontWeight:    600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color:         'var(--amber)',
              marginBottom:  24,
            }}>
              Biome handles
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {BIOME_HANDLES.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--amber)', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 500, color: 'var(--white)' }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Amber divider */}
          <div style={{ background: 'var(--amber)', width: 4, alignSelf: 'stretch', minHeight: 200 }} className="scope-divider" />

          {/* Right — You keep */}
          <div>
            <p style={{
              fontFamily:    'var(--font-display)',
              fontSize:      13,
              fontWeight:    600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color:         'rgba(255,255,255,0.5)',
              marginBottom:  24,
            }}>
              You keep
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {YOU_KEEP.map(item => (
                <span key={item} style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'rgba(255,255,255,0.55)' }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .scope-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .scope-divider {
            width: 100% !important;
            min-height: 4px !important;
            height: 4px !important;
          }
        }
      `}</style>
    </section>
  );
}
