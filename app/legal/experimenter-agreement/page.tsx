'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState } from 'react';
import { SiteHeader } from '@/components/nav/header';
import { LegalAcceptance } from '@/components/legal/legal-acceptance';
import { LEGAL_DOCS } from '@/lib/legal/documents';

export default function ExperimenterAgreementPage() {
  const { user, authenticated } = usePrivy();
  const [accepted, setAccepted] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const doc = LEGAL_DOCS.experimenter_agreement;

  async function handleAccept() {
    if (!user) return;
    setLoading(true);
    await fetch('/api/legal/accept', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privy_did: user.id, doc_key: 'experimenter_agreement' }),
    });
    setLoading(false);
    setAccepted(true);
  }

  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        {accepted ? (
          <div className="text-center py-16">
            <p className="mono text-2xl mb-2" style={{ color: 'var(--green)' }}>✓</p>
            <p className="mono text-sm" style={{ color: 'var(--text-bright)' }}>Experimenter Study Agreement accepted.</p>
          </div>
        ) : (
          <LegalAcceptance
            docKey="experimenter_agreement"
            title={doc.title}
            content={doc.content}
            onAccept={authenticated ? () => void handleAccept() : () => setAccepted(true)}
            loading={loading}
          />
        )}
      </div>
    </main>
  );
}
