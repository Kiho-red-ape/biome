export function Geography() {
  return (
    <section
      style={{
        paddingTop:    0,
        paddingBottom: 96,
        maxWidth:      900,
        margin:        '0 auto',
        textAlign:     'center',
      }}
      className="px-4 sm:px-6 lg:px-10"
    >
      <p style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      10,
        letterSpacing: '3px',
        color:         '#b7ff61',
        textTransform: 'uppercase',
        marginBottom:  24,
      }}>
        // GEOGRAPHY
      </p>

      <p style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      'clamp(14px, 2vw, 18px)',
        color:         '#f2faf4',
        letterSpacing: '1.5px',
        lineHeight:    1.6,
      }}>
        India · United States · United Kingdom · EU expansion
      </p>
    </section>
  );
}
