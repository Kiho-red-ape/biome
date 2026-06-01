export function TrackRecord() {
  return (
    <section
      style={{ paddingTop: 0, paddingBottom: 96, maxWidth: 900, margin: '0 auto' }}
      className="px-4 sm:px-6 lg:px-10"
    >
      <p style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      10,
        letterSpacing: '3px',
        color:         '#f59e0b',
        textTransform: 'uppercase',
        marginBottom:  32,
      }}>
        Track Record
      </p>

      <div style={{
        display:    'grid',
        gridTemplateColumns: '80px 1fr',
        gap:        32,
        padding:    '32px 0',
        borderTop:  '2px solid rgba(248,250,252,0.07)',
        borderBottom: '1px solid rgba(248,250,252,0.04)',
        alignItems: 'start',
      }}>
        <div style={{
          fontFamily:  'var(--font-heading)',
          fontWeight:  700,
          fontSize:    64,
          lineHeight:  1,
          color:       'rgba(245,158,11,0.12)',
          userSelect:  'none',
        }}>
          01
        </div>
        <div style={{ paddingTop: 8 }}>
          <p style={{
            fontFamily:   'var(--font-heading)',
            fontWeight:   600,
            fontSize:     16,
            color:        '#f8fafc',
            marginBottom: 6,
          }}>
            Completed study
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94a3b8', marginBottom: 8, letterSpacing: '0.5px' }}>
            50 participants · Microbiome · India · 2023
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
            Decentralized citizen science study through MicrobiomeDAO predecessor.
          </p>
        </div>
      </div>
    </section>
  );
}
