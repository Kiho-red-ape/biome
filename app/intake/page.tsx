import { SiteHeader } from '@/components/nav/header';
import { IntakeForm } from './intake-form';

export default function IntakePage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
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
          fontSize:      11,
          letterSpacing: '2px',
          color:         'var(--teal)',
          textTransform: 'uppercase',
          marginBottom:  20,
        }}>
          Intake
        </p>
        <h1 style={{
          fontFamily:   'var(--font-display)',
          fontWeight:   700,
          fontSize:     'clamp(22px, 3.5vw, 32px)',
          color:        'var(--ink)',
          lineHeight:   1.2,
          marginBottom: 12,
        }}>
          Tell us about your study.
        </h1>
        <p style={{
          fontFamily:   'var(--font-body)',
          fontSize:     15,
          color:        'var(--slate)',
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
