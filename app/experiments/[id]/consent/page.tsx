'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { SiteHeader } from '@/components/nav/header';
import { ConsentFlow } from '@/components/agent/consent-flow';

export default function ConsentPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, ready, authenticated } = usePrivy();

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) router.replace('/');
  }, [ready, authenticated, user, router]);

  if (!ready || !authenticated || !user) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div
            style={{
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-sm)',
              background: 'var(--surface)',
              padding: '28px 44px',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 16,
              color: 'var(--ink)',
            }}
          >
            Loading…
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <SiteHeader />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display, var(--font-body))',
            fontWeight: 700,
            fontSize: 24,
            color: 'var(--ink)',
            margin: '0 0 8px',
          }}
        >
          Informed consent
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'var(--slate)',
            margin: '0 0 28px',
            lineHeight: 1.5,
          }}
        >
          Read the document, complete a short comprehension check, then confirm your participation.
        </p>

        <ConsentFlow
          privyDid={user.id}
          experimentId={id}
          onEnrolled={() => router.push('/dashboard/studies/' + id)}
        />
      </div>
    </main>
  );
}
