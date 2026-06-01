import { SiteHeader } from '@/components/nav/header';
import { createAnonClient } from '@/lib/supabase/anon';
import { PartnerFormToggle } from './partner-form-toggle';
import Image from 'next/image';

interface Partner {
  id: string;
  name: string;
  logo_url: string;
}

const BENEFITS = [
  {
    num: '01',
    label: 'DEAL FLOW',
    desc: 'Get introduced to study sponsors actively looking for your services. No cold outreach required.',
  },
  {
    num: '02',
    label: 'TRANSPARENT TERMS',
    desc: 'Per-study contracts with clear scope and pass-through pricing. No retainers, no bundled markups.',
  },
  {
    num: '03',
    label: 'NETWORK EFFECT',
    desc: 'Your logo and services visible to every researcher using the Biome platform globally.',
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
    // table not yet migrated — fail silently
  }

  return (
    <main style={{ minHeight: '100vh', background: '#060a14' }}>
      <SiteHeader />

      {/* ── Hero ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px 64px' }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
          color: '#f59e0b', textTransform: 'uppercase', marginBottom: 20,
        }}>
          // PARTNER_NETWORK
        </p>
        <h1 style={{
          fontFamily: 'var(--font-heading)', fontWeight: 700,
          fontSize: 'clamp(26px, 4vw, 40px)', lineHeight: 1.15,
          color: '#f8fafc', marginBottom: 16,
        }}>
          Build with Biome.
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 13, color: '#94a3b8',
          lineHeight: 1.9, marginBottom: 36, maxWidth: 520,
        }}>
          We work with testing laboratories, IRBs, recruitment agencies, and
          clinical professionals on a per-study basis. Partners are activated
          per study, with transparent scope and pricing.
        </p>
        <PartnerFormToggle />
      </section>

      {/* ── Benefits ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 64, paddingBottom: 64 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
            color: '#f59e0b', textTransform: 'uppercase', marginBottom: 40,
          }}>
            // WHY_PARTNER
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 32 }}>
            {BENEFITS.map((b) => (
              <div key={b.num}>
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px',
                  color: '#f59e0b', textTransform: 'uppercase', marginBottom: 12,
                }}>
                  {b.num} {b.label}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#475569', lineHeight: 1.7 }}>
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partner logo grid ── */}
      {partners.length > 0 && (
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 64, paddingBottom: 64 }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
              color: '#475569', textTransform: 'uppercase', marginBottom: 40,
            }}>
              // PARTNERS
            </p>
            <div
              className="partner-grid"
              style={{ display: 'grid', gap: 24 }}
            >
              {partners.map((p) => (
                <div
                  key={p.id}
                  className="partner-logo-cell"
                  style={{
                    width: 100, height: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
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
            .partner-grid { grid-template-columns: repeat(4, 100px); }
            @media (max-width: 640px) { .partner-grid { grid-template-columns: repeat(2, 100px); } }
            @media (min-width: 641px) and (max-width: 900px) { .partner-grid { grid-template-columns: repeat(3, 100px); } }
            .partner-logo-img { filter: grayscale(1); opacity: 0.5; transition: filter 200ms ease, opacity 200ms ease; }
            .partner-logo-cell:hover .partner-logo-img { filter: grayscale(0); opacity: 1; }
          `}</style>
        </section>
      )}

    </main>
  );
}
