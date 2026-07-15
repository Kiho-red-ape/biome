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
    <section style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border-soft)' }}>
      <div className="section-inner">
        <h2 style={{
          fontFamily:   'var(--font-display)',
          fontSize:     'clamp(26px, 3vw, 40px)',
          color:        'var(--ink)',
          marginBottom: 48,
          lineHeight:   1.1,
        }}>
          What we handle.<br />
          <span style={{ color: 'var(--teal)' }}>What you keep.</span>
        </h2>

        <div
          style={{
            display:             'grid',
            gridTemplateColumns: '1fr 1px 1fr',
            gap:                 40,
            alignItems:          'start',
          }}
          className="scope-grid"
        >
          {/* Left — Biome handles */}
          <div>
            <p style={{
              fontFamily:    'var(--font-display)',
              fontSize:      12,
              fontWeight:    600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color:         'var(--teal)',
              marginBottom:  24,
            }}>
              Biome handles
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {BIOME_HANDLES.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Soft divider */}
          <div style={{ background: 'var(--border-mid)', width: 1, alignSelf: 'stretch', minHeight: 200 }} className="scope-divider" />

          {/* Right — You keep */}
          <div>
            <p style={{
              fontFamily:    'var(--font-display)',
              fontSize:      12,
              fontWeight:    600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color:         'var(--muted)',
              marginBottom:  24,
            }}>
              You keep
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {YOU_KEEP.map(item => (
                <span key={item} style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--slate)' }}>
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
            min-height: 1px !important;
            height: 1px !important;
          }
        }
      `}</style>
    </section>
  );
}
