const STATS = [
  { number: '<30', unit: 'days', label: 'Protocol to live study' },
  { number: '5',   unit: '',     label: 'Sample types supported' },
  { number: '3',   unit: '',     label: 'Active geographies' },
  { number: '70',  unit: '%',    label: 'Lower ops cost vs CRO' },
];

export function StatsBar() {
  return (
    <div className="amber-bar" style={{ background: 'var(--teal-faint)' }}>
      <div
        style={{
          maxWidth:            1140,
          margin:              '0 auto',
          padding:             '44px 24px',
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
              borderRight: i < STATS.length - 1 ? '1px solid var(--border-soft)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
              <span className="stat-number" style={{ color: 'var(--teal-dark)' }}>
                {s.number}
              </span>
              {s.unit && (
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, color: 'var(--teal-dark)' }}>
                  {s.unit}
                </span>
              )}
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize:   13,
              fontWeight: 500,
              color:      'var(--slate)',
              margin:     0,
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
