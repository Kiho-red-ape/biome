export function TrackRecord() {
  return (
    <section style={{ background: 'var(--white)', borderBottom: '3px solid var(--black)' }}>
      <div className="section-inner" style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="brutalist-card" style={{ maxWidth: 480, width: '100%' }}>
          <div style={{
            fontFamily:   'var(--font-display)',
            fontWeight:   700,
            fontSize:     96,
            lineHeight:   1,
            color:        'var(--amber)',
            marginBottom: 16,
          }}>
            01
          </div>
          <h3 style={{
            fontFamily:   'var(--font-display)',
            fontSize:     24,
            fontWeight:   600,
            color:        'var(--black)',
            marginBottom: 10,
          }}>
            Completed study
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--gray)', margin: 0 }}>
            50 participants · Microbiome · India · 2023
          </p>
        </div>
      </div>
    </section>
  );
}
