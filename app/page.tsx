import { createAnonClient } from '@/lib/supabase/anon';
import { SiteHeader } from '@/components/nav/header';
import { HomeHero } from '@/components/home/hero';
import { HowItWorks } from '@/components/home/how-it-works';
import { ScopeSection } from '@/components/home/scope-section';
import { Geography } from '@/components/home/geography';
import { TrackRecord } from '@/components/home/track-record';
import { EstimateCta } from '@/components/home/estimate-cta';
import { PartnersStrip } from '@/components/home/partners-strip';
import { ClosingCta } from '@/components/home/closing-cta';

interface Partner {
  id: string;
  name: string;
  logo_url: string;
}

export default async function HomePage() {
  const supabase = createAnonClient();

  // Only fetch approved homepage partners — table may not exist yet on first deploy
  let partners: Partner[] = [];
  try {
    const { data } = await supabase
      .from('partner_applications')
      .select('id, name, logo_url')
      .eq('status', 'approved')
      .eq('display_on_homepage', true);
    partners = (data ?? []) as Partner[];
  } catch {
    // table not yet migrated — fail silently
  }

  return (
    <main style={{ minHeight: '100vh' }}>
      <SiteHeader />

      <HomeHero />
      <HowItWorks />
      <ScopeSection />
      <Geography />
      <TrackRecord />
      <EstimateCta />
      {partners.length > 0 && <PartnersStrip partners={partners} />}
      <ClosingCta />

      <footer
        style={{
          borderTop:     '1px solid rgba(255,255,255,0.05)',
          paddingTop:    32,
          paddingBottom: 32,
        }}
        className="px-4 sm:px-6 lg:px-10"
      >
        <div style={{
          maxWidth:       900,
          margin:         '0 auto',
          display:        'flex',
          flexDirection:  'column',
          gap:            16,
          alignItems:     'center',
          textAlign:      'center',
        }}>
          {/* Logo */}
          <span style={{
            fontFamily:    'var(--font-heading)',
            fontWeight:    700,
            fontSize:      18,
            letterSpacing: '5px',
            textTransform: 'uppercase',
          }}>
            <span style={{ color: '#b7ff61' }}>BIO</span><span style={{ color: '#22d3ee' }}>ME</span>
          </span>

          {/* Entity */}
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5b8a9a', letterSpacing: '0.5px', margin: 0 }}>
            Banano Tech Pvt Ltd · Coimbatore, India ·{' '}
            <a href="mailto:kishore@biome.to" style={{ color: '#5b8a9a', textDecoration: 'none' }}>kishore@biome.to</a>
          </p>

          {/* Links */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              ['Blog',    '/blog'],
              ['Docs',    '/docs'],
              ['Terms',   '/legal/tos'],
              ['Privacy', '/privacy'],
            ].map(([label, href]) => (
              <a key={href} href={href} className="footer-link">
                {label}
              </a>
            ))}
          </div>

          {/* Vision line */}
          <p style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      10,
            color:         '#5b8a9a',
            letterSpacing: '0.3px',
            lineHeight:    1.6,
            margin:        0,
            maxWidth:      500,
          }}>
            Building the operations layer for the next generation of human studies.
          </p>
        </div>
      </footer>
    </main>
  );
}
