import { SiteHeader } from '@/components/nav/header';
import { PartnerJoinForm } from './partner-join-form';

export default function PartnerJoinPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#050709' }}>
      <SiteHeader />
      <div
        style={{
          maxWidth: 680,
          margin:   '0 auto',
          padding:  'clamp(48px, 8vw, 96px) 24px clamp(64px, 10vw, 120px)',
        }}
      >
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      10,
          letterSpacing: '3px',
          color:         '#b7ff61',
          textTransform: 'uppercase',
          marginBottom:  20,
        }}>
          // PARTNER_APPLICATION
        </p>
        <h1 style={{
          fontFamily:   'var(--font-heading)',
          fontWeight:   700,
          fontSize:     'clamp(22px, 3.5vw, 32px)',
          color:        '#f2faf4',
          lineHeight:   1.2,
          marginBottom: 12,
        }}>
          Apply to partner with Biome.
        </h1>
        <p style={{
          fontFamily:   'var(--font-mono)',
          fontSize:     12,
          color:        '#4a6050',
          lineHeight:   1.7,
          marginBottom: 40,
        }}>
          We work with testing labs, IRBs, recruitment agencies, and clinical professionals
          on a per-study basis. Applications are reviewed within 48 hours.
        </p>
        <PartnerJoinForm />
      </div>
    </main>
  );
}
