export function TrackRecord() {
  return (
    <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)' }}>
      <div className="section-inner" style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          maxWidth: 480,
          width: '100%',
          background: 'var(--surface)',
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius)',
          padding: 32,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{
            fontFamily:   'var(--font-display)',
            fontWeight:   700,
            fontSize:     96,
            lineHeight:   1,
            color:        'var(--teal)',
            marginBottom: 16,
          }}>
            01
          </div>
          <h3 style={{
            fontFamily:   'var(--font-display)',
            fontSize:     24,
            fontWeight:   600,
            color:        'var(--ink)',
            marginBottom: 10,
          }}>
            Completed study
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--slate)', margin: 0 }}>
            50 participants · Microbiome · India · 2023
          </p>
        </div>
      </div>
    </section>
  );
}
