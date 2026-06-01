const ACCEPTED = [
  'Observational / biomarker',
  'Behavioral interventions',
  'Consumer product studies',
  'Decentralized device studies',
  'Survey / PRO / eCOA',
];

const DECLINED = [
  'Drug trials (IND/CTA)',
  'On-site clinical procedures',
  'Imaging or in-clinic assessments',
  'Pediatric / pregnant / incarcerated',
  'Cold-chain biospecimens (<24hr)',
];

export function StudyFit() {
  return (
    <section
      style={{ paddingTop: 0, paddingBottom: 96, maxWidth: 900, margin: '0 auto' }}
      className="px-4 sm:px-6 lg:px-10"
    >
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
        color: '#f59e0b', textTransform: 'uppercase', marginBottom: 40,
      }}>
        // STUDY_FIT
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
          {/* Accepted */}
          <div>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px',
              color: '#f59e0b', textTransform: 'uppercase', marginBottom: 20,
            }}>
              Accepted
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ACCEPTED.map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)', fontSize: 11, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94a3b8' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Declined */}
          <div>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px',
              color: '#94a3b8', textTransform: 'uppercase', marginBottom: 20,
            }}>
              Declined
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DECLINED.map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ color: '#475569', fontFamily: 'var(--font-mono)', fontSize: 11, flexShrink: 0 }}>×</span>
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
