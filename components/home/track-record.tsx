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
        color:         '#b7ff61',
        textTransform: 'uppercase',
        marginBottom:  48,
      }}>
        // TRACK_RECORD
      </p>

      <div style={{
        display:             'grid',
        gridTemplateColumns: '80px 1fr',
        gap:                 32,
        paddingTop:          32,
        paddingBottom:       32,
        borderTop:           '1px solid rgba(255,255,255,0.06)',
        borderBottom:        '1px solid rgba(255,255,255,0.06)',
        alignItems:          'start',
      }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize:   56,
          lineHeight: 1,
          color:      'rgba(183,255,97,0.15)',
        }}>
          01
        </div>
        <div style={{ paddingTop: 8 }}>
          <p style={{
            fontFamily:   'var(--font-mono)',
            fontSize:     13,
            color:        '#f2faf4',
            marginBottom: 4,
          }}>
            completed study
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#aab8b1', marginBottom: 8 }}>
            50 participants · Microbiome · India · 2023
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5b8a9a', lineHeight: 1.6 }}>
            Decentralized citizen science study through MicrobiomeDAO predecessor.
          </p>
        </div>
      </div>
    </section>
  );
}
