const STATS = [
  { number: '<30', unit: 'days', label: 'Protocol to live study' },
  { number: '5',   unit: '',     label: 'Sample types supported' },
  { number: '3',   unit: '',     label: 'Active geographies' },
  { number: '70',  unit: '%',    label: 'Lower ops cost vs CRO' },
];

export function StatsBar() {
  return (
    <div
      className="amber-bar"
      style={{ background: 'var(--amber)', borderTop: '3px solid var(--black)', borderBottom: '3px solid var(--black)' }}
    >
      <div
        style={{
          maxWidth:            1200,
          margin:              '0 auto',
          padding:             '40px 24px',
          display:             'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap:                 0,
        }}
        className="stats-inner"
      >
        {STATS.map((s, i) => (
          <div
            key={s.label}
            style={{
              textAlign:   'center',
              padding:     '0 16px',
              borderRight: i < STATS.length - 1 ? '2px solid rgba(0,0,0,0.15)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 48, lineHeight: 1, color: 'var(--black)' }}>
                {s.number}
              </span>
              {s.unit && (
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--black)' }}>
                  {s.unit}
                </span>
              )}
            </div>
            <p style={{
              fontFamily:    'var(--font-body)',
              fontSize:      13,
              fontWeight:    500,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color:         'var(--black)',
              margin:        0,
            }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 640px) {
          .stats-inner { grid-template-columns: repeat(2, 1fr) !important; row-gap: 32px !important; }
        }
      `}</style>
    </div>
  );
}
