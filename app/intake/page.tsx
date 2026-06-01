import { SiteHeader } from '@/components/nav/header';
import { IntakeForm } from './intake-form';

export default function IntakePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#060a14' }}>
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
          color:         '#f59e0b',
          textTransform: 'uppercase',
          marginBottom:  20,
        }}>
          // INTAKE
        </p>
        <h1 style={{
          fontFamily:   'var(--font-heading)',
          fontWeight:   700,
          fontSize:     'clamp(22px, 3.5vw, 32px)',
          color:        '#f8fafc',
          lineHeight:   1.2,
          marginBottom: 12,
        }}>
          Tell us about your study.
        </h1>
        <p style={{
          fontFamily:   'var(--font-mono)',
          fontSize:     12,
          color:        '#475569',
          lineHeight:   1.7,
          marginBottom: 40,
        }}>
          We&apos;ll review your submission and get back to you within 48 hours.
          This is a discovery conversation, not a commitment.
        </p>
        <IntakeForm />
      </div>
    </main>
  );
}
