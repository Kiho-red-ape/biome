export function Geography() {
  const regions = [
    { name: 'India',          status: 'Active' },
    { name: 'United States',  status: 'Active' },
    { name: 'United Kingdom', status: 'Active' },
    { name: 'EU',             status: 'Expanding' },
  ];

  return (
    <section
      style={{
        paddingTop:    0,
        paddingBottom: 96,
        maxWidth:      900,
        margin:        '0 auto',
      }}
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
        Geography
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, border: '1px solid rgba(248,250,252,0.07)' }}>
        {regions.map((r) => (
          <div key={r.name} style={{
            flex:        '1 1 160px',
            padding:     '20px 24px',
            borderRight: '1px solid rgba(248,250,252,0.07)',
            borderBottom: '1px solid rgba(248,250,252,0.07)',
          }}>
            <p style={{
              fontFamily:   'var(--font-heading)',
              fontWeight:   600,
              fontSize:     15,
              color:        '#e2e8f0',
              marginBottom: 6,
            }}>
              {r.name}
            </p>
            <p style={{
              fontFamily:  'var(--font-mono)',
              fontSize:    9,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color:       r.status === 'Active' ? '#f59e0b' : '#475569',
              margin:      0,
            }}>
              {r.status}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
