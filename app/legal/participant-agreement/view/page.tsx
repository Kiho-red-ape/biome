// Read-only view of the Participant Study Agreement.
// Linked from the footer — no checkbox / acceptance UI.
// Acceptance UI is shown only during onboarding and consent flows.

import Link from 'next/link';
import { LEGAL_DOCS } from '@/lib/legal/documents';

export default function ParticipantAgreementViewPage() {
  const doc = LEGAL_DOCS.participant_agreement;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <Link href="/" style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '2px',
          color: '#4a7055', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← Back
        </Link>

        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
          textTransform: 'uppercase', color: '#f59e0b', marginBottom: 8,
        }}>
          // LEGAL_DOCUMENT
        </p>
        <h1 style={{
          fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700,
          color: '#eef4f0', marginBottom: 8,
        }}>
          {doc.title}
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', marginBottom: 32 }}>
          Read-only view — for reference only.
        </p>

        <div style={{
          background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.1)',
          borderRadius: 4, padding: '24px 28px',
        }}>
          <pre style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--text-bright)', lineHeight: 1.75,
            whiteSpace: 'pre-wrap', margin: 0,
          }}>
            {doc.content}
          </pre>
        </div>

      </div>
    </main>
  );
}
