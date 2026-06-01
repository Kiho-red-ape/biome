import { createAnonClient } from '@/lib/supabase/anon';
import { SiteHeader } from '@/components/nav/header';
import { HomeHero } from '@/components/home/hero';
import { StatsBar } from '@/components/home/stats-bar';
import { HowItWorks } from '@/components/home/how-it-works';
import { ScopeSection } from '@/components/home/scope-section';
import { EstimateCta } from '@/components/home/estimate-cta';
import { TestimonialsMarquee } from '@/components/home/testimonials-marquee';
import { BlogPreview } from '@/components/home/blog-preview';
import { PartnersStrip } from '@/components/home/partners-strip';
import { ClosingCta } from '@/components/home/closing-cta';

interface Partner {
  id: string;
  name: string;
  logo_url: string;
}

export default async function HomePage() {
  const supabase = createAnonClient();

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
      <StatsBar />
      <HowItWorks />
      <ScopeSection />
      <EstimateCta />
      <TestimonialsMarquee />
      <BlogPreview />
      {partners.length > 0 && <PartnersStrip partners={partners} />}
      <ClosingCta />

      {/* Footer */}
      <footer style={{ background: 'var(--black)', borderTop: '3px solid rgba(255,255,255,0.1)' }}>
        <div style={{
          maxWidth:       1200,
          margin:         '0 auto',
          padding:        '40px 24px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          flexWrap:       'wrap',
          gap:            20,
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '2px', color: 'var(--white)' }}>
            BIO<span style={{ color: 'var(--amber)' }}>ME</span>
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray)' }}>
            Biome Inc
          </span>
          <nav style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[['Blog', '/blog'], ['Docs', '/docs'], ['Terms', '/legal/tos'], ['Privacy', '/privacy']].map(([label, href]) => (
              <a key={href} href={href} className="footer-link">{label}</a>
            ))}
          </nav>
        </div>
      </footer>
    </main>
  );
}
