// Read-only view of the Researcher Study Agreement.
// Linked from the footer — no checkbox / acceptance UI.
// Acceptance UI is shown only during onboarding and consent flows.

import Link from 'next/link';
import { LEGAL_DOCS } from '@/lib/legal/documents';

export default function ExperimenterAgreementViewPage() {
  const doc = LEGAL_DOCS.experimenter_agreement;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <Link href="/" style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '2px',
          color: 'var(--teal-dark)', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← Back
        </Link>

        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
          textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8,
        }}>
          Legal Document
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
          color: 'var(--ink)', marginBottom: 8,
        }}>
          {doc.title}
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 32 }}>
          Read-only view — for reference only.
        </p>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius)', padding: '24px 28px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <pre style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--ink)', lineHeight: 1.75,
            whiteSpace: 'pre-wrap', margin: 0,
          }}>
            {doc.content}
          </pre>
        </div>

      </div>
    </main>
  );
}
