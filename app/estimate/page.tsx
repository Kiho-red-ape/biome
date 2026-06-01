import { SiteHeader } from '@/components/nav/header';
import { EstimateWizard } from './estimate-wizard';

export default function EstimatePage() {
  return (
    <main style={{ minHeight: '100vh' }}>
      <SiteHeader />
      <div
        style={{
          maxWidth:   720,
          margin:     '0 auto',
          paddingTop: 'clamp(48px, 8vh, 80px)',
        }}
        className="px-4 sm:px-6 lg:px-8"
      >
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      10,
          letterSpacing: '3px',
          color:         '#38bdf8',
          textTransform: 'uppercase',
          marginBottom:  20,
        }}>
          // GET_AN_ESTIMATE
        </p>
        <h1 style={{
          fontFamily:    'var(--font-heading)',
          fontWeight:    700,
          fontSize:      'clamp(26px, 4vw, 44px)',
          lineHeight:    1.1,
          color:         '#f8fafc',
          marginBottom:  12,
        }}>
          Estimate your study cost.
        </h1>
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      13,
          color:         '#475569',
          lineHeight:    1.7,
          marginBottom:  48,
        }}>
          7 questions · ~2 minutes · No commitment
        </p>

        <EstimateWizard />
      </div>
    </main>
  );
}
