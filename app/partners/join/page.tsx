import { SiteHeader } from '@/components/nav/header';
import { createAnonClient } from '@/lib/supabase/anon';
import { PartnerFormToggle } from './partner-form-toggle';
import { PartnerNetworkSVG } from '@/components/illustrations/PageIllustrations';
import Image from 'next/image';

interface Partner {
  id: string;
  name: string;
  logo_url: string;
}

const BENEFITS = [
  {
    num: '01',
    title: 'Qualified Leads',
    desc: 'Studies matched to your capabilities. No cold outreach required.',
  },
  {
    num: '02',
    title: 'Transparent Terms',
    desc: 'Per-study contracts. No retainers, no bundled markups.',
  },
  {
    num: '03',
    title: 'Network Effect',
    desc: 'Your brand alongside trusted partners on every researcher touchpoint.',
  },
];

export default async function PartnerJoinPage() {
  const supabase = createAnonClient();

  let partners: Partner[] = [];
  try {
    const { data } = await supabase
      .from('partner_applications')
      .select('id, name, logo_url')
      .eq('status', 'approved')
      .eq('display_on_homepage', true)
      .not('logo_url', 'is', null);
    partners = (data ?? []) as Partner[];
  } catch {
    // table not yet migrated
  }

  return (
    <main style={{ minHeight: '100vh' }}>
      <SiteHeader />

      {/* ── Hero (navy, two-column) ── */}
      <section style={{
        background:   'var(--navy)',
        minHeight:    '70vh',
        display:      'flex',
        alignItems:   'center',
        borderBottom: '3px solid var(--black)',
      }}>
        <div
          style={{
            maxWidth:            1200,
            margin:              '0 auto',
            padding:             'clamp(60px, 9vh, 100px) 24px',
            width:               '100%',
            display:             'grid',
            gridTemplateColumns: 'minmax(0, 52%) minmax(0, 48%)',
            gap:                 64,
            alignItems:          'center',
          }}
          className="partner-hero-grid"
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
              Partner Network
            </span>
            <h1 style={{
              fontFamily:   'var(--font-display)',
              fontWeight:   700,
              fontSize:     'clamp(28px, 4vw, 52px)',
              lineHeight:   1.08,
              color:        'var(--white)',
              marginBottom: 20,
            }}>
              Labs. IRBs. Consultants.<br />
              <span style={{ color: 'var(--amber)' }}>Activated per study.</span>
            </h1>
            <p style={{
              fontFamily:   'var(--font-body)',
              fontSize:     17,
              color:        'rgba(255,255,255,0.75)',
              lineHeight:   1.6,
              maxWidth:     460,
              marginBottom: 40,
            }}>
              We work with testing labs, IRBs, recruitment agencies, and clinical
              professionals on a per-study basis. Transparent scope. Clear pricing.
            </p>
            <PartnerFormToggle />
          </div>

          {/* Right — network illustration */}
          <div className="partner-hero-art" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PartnerNetworkSVG />
          </div>
        </div>
      </section>

      {/* ── Benefits (white, 3 brutalist cards) ── */}
      <section style={{ background: 'var(--white)', borderBottom: '3px solid var(--black)' }}>
        <div className="section-inner">
          <span className="section-label section-label-dark">Why partner with Biome</span>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
            className="benefits-grid"
          >
            {BENEFITS.map(b => (
              <div key={b.num} className="brutalist-card">
                <span className="card-number-bg">{b.num}</span>
                <h3 style={{
                  fontFamily:   'var(--font-display)',
                  fontSize:     22,
                  fontWeight:   600,
                  color:        'var(--black)',
                  marginBottom: 12,
                  paddingTop:   8,
                }}>
                  {b.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--gray)', margin: 0, lineHeight: 1.6 }}>
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partner logos (navy) ── */}
      {partners.length > 0 && (
        <section style={{ background: 'var(--navy)', borderBottom: '3px solid var(--black)' }}>
          <div className="section-inner" style={{ textAlign: 'center' }}>
            <span className="section-label" style={{ marginBottom: 40, display: 'block' }}>Current Partners</span>
            <div
              style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24 }}
            >
              {partners.map(p => (
                <div
                  key={p.id}
                  style={{
                    width:       100,
                    height:      100,
                    display:     'flex',
                    alignItems:  'center',
                    justifyContent: 'center',
                    border:      '2px solid rgba(255,255,255,0.1)',
                    background:  'rgba(255,255,255,0.03)',
                  }}
                  className="partner-logo-cell"
                >
                  <Image
                    src={p.logo_url}
                    alt={p.name}
                    width={80}
                    height={80}
                    style={{ objectFit: 'contain' }}
                    className="partner-logo-img"
                  />
                </div>
              ))}
            </div>
          </div>
          <style>{`
            .partner-logo-img { filter: grayscale(1); opacity: 0.5; transition: filter 200ms, opacity 200ms; }
            .partner-logo-cell:hover .partner-logo-img { filter: grayscale(0); opacity: 1; }
          `}</style>
        </section>
      )}

      {/* Footer */}
      <footer style={{ background: 'var(--black)', borderTop: '3px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <a href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '2px', color: 'var(--white)', textDecoration: 'none' }}>
            BIO<span style={{ color: 'var(--amber)' }}>ME</span>
          </a>
          <nav style={{ display: 'flex', gap: 24 }}>
            {[['Blog', '/blog'], ['Docs', '/docs'], ['Terms', '/legal/tos'], ['Privacy', '/privacy']].map(([l, h]) => (
              <a key={h} href={h} className="footer-link">{l}</a>
            ))}
          </nav>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .partner-hero-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
          .partner-hero-art  { display: none !important; }
          .benefits-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .benefits-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </main>
  );
}
