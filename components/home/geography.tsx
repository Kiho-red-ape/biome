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
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
        color: '#b7ff61', textTransform: 'uppercase', marginBottom: 24,
      }}>
        // GEOGRAPHY
      </p>

      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 12, color: '#aab8b1',
        letterSpacing: '0.5px', marginBottom: 8,
      }}>
        Currently operating in:
      </p>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 14, color: '#f2faf4',
        letterSpacing: '1px', marginBottom: 16,
      }}>
        🇮🇳 India &nbsp;·&nbsp; 🇺🇸 United States &nbsp;·&nbsp; 🇬🇧 United Kingdom
      </p>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a6050',
        letterSpacing: '0.5px',
      }}>
        Expanding to EU — evaluated per study.
      </p>
    </section>
  );
}
