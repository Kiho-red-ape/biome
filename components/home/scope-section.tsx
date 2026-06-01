const BIOME_HANDLES = [
  'Participant recruitment',
  'Eligibility screening',
  'Informed consent capture',
  'Sample collection logistics',
  'Compliance tracking',
  'Participant payouts',
  'Data export + audit trail',
];

const STAYS_WITH_YOU = [
  'Protocol design',
  'IRB / ethics submission',
  'Regulatory filings',
  'Medical oversight',
  'Biostatistics',
  'Clinical study report',
  'Lab assay execution',
];

export function ScopeSection() {
  return (
    <section
      style={{ paddingTop: 96, paddingBottom: 96, maxWidth: 900, margin: '0 auto' }}
      className="px-4 sm:px-6 lg:px-10"
    >
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
        color: '#f59e0b', textTransform: 'uppercase', marginBottom: 40,
      }}>
        // SCOPE
      </p>

      <div
        style={{
          background:   'rgba(255,255,255,0.015)',
          border:       '1px solid rgba(255,255,255,0.06)',
          padding:      'clamp(24px, 4vw, 40px)',
          borderRadius: 2,
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 40 }}>
          {/* Left — what Biome handles */}
          <div>
            <p style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      11,
              letterSpacing: '2px',
              color:         '#f59e0b',
              textTransform: 'uppercase',
              marginBottom:  20,
            }}>
              What Biome handles
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {BIOME_HANDLES.map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)', fontSize: 11, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94a3b8' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — stays with you */}
          <div>
            <p style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      11,
              letterSpacing: '2px',
              color:         '#94a3b8',
              textTransform: 'uppercase',
              marginBottom:  20,
            }}>
              What stays with you
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {STAYS_WITH_YOU.map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ color: '#475569', fontFamily: 'var(--font-mono)', fontSize: 11, flexShrink: 0 }}>—</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#475569' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
