import { SiteHeader } from '@/components/nav/header';
import { EstimateWizard } from './estimate-wizard';
import { EstimateChartSVG } from '@/components/illustrations/PageIllustrations';
import Link from 'next/link';

export default function EstimatePage() {
  return (
    <main style={{ minHeight: '100vh' }}>
      <SiteHeader />

      {/* ── Hero (navy, two-column) ── */}
      <section style={{
        background:   'var(--navy)',
        borderBottom: '3px solid var(--black)',
      }}>
        <div
          style={{
            maxWidth:            1200,
            margin:              '0 auto',
            padding:             'clamp(48px, 8vw, 96px) 24px',
            display:             'grid',
            gridTemplateColumns: 'minmax(0, 56%) minmax(0, 44%)',
            gap:                 56,
            alignItems:          'center',
          }}
          className="estimate-hero-grid"
        >
          {/* Left */}
          <div>
            <span style={{
              fontFamily:    'var(--font-display)',
              fontSize:      13,
              fontWeight:    600,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color:         'var(--amber)',
              display:       'block',
              marginBottom:  20,
            }}>
              Cost Estimator
            </span>
            <h1 style={{
              fontFamily:   'var(--font-display)',
              fontWeight:   700,
              fontSize:     'clamp(28px, 4vw, 48px)',
              lineHeight:   1.08,
              color:        'var(--white)',
              marginBottom: 20,
            }}>
              Know your cost<br />
              <span style={{ color: 'var(--amber)' }}>before you commit.</span>
            </h1>
            <p style={{
              fontFamily:   'var(--font-body)',
              fontSize:     17,
              color:        'rgba(255,255,255,0.75)',
              lineHeight:   1.5,
              marginBottom: 12,
            }}>
              7 questions · ~2 minutes · No commitment
            </p>
            <p style={{
              fontFamily:   'var(--font-body)',
              fontSize:     14,
              color:        'rgba(255,255,255,0.45)',
              lineHeight:   1.5,
            }}>
              Itemized breakdown of recruitment, logistics, compliance, and ops fees.
            </p>
          </div>

          {/* Right — cost chart illustration */}
          <div className="estimate-hero-art" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EstimateChartSVG />
          </div>
        </div>
      </section>

      {/* ── Wizard (off-white) ── */}
      <section style={{ background: 'var(--off-white)', borderBottom: '3px solid var(--black)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(48px, 6vw, 80px) 24px' }}>
          <EstimateWizard />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--black)', borderTop: '3px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '2px', color: 'var(--white)', textDecoration: 'none' }}>
            BIO<span style={{ color: 'var(--amber)' }}>ME</span>
          </Link>
          <nav style={{ display: 'flex', gap: 24 }}>
            {[['Blog', '/blog'], ['Docs', '/docs'], ['Terms', '/legal/tos'], ['Privacy', '/privacy']].map(([l, h]) => (
              <a key={h} href={h} className="footer-link">{l}</a>
            ))}
          </nav>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .estimate-hero-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
          .estimate-hero-art  { display: none !important; }
        }
      `}</style>
    </main>
  );
}
