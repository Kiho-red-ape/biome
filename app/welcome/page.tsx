'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { SiteHeader } from '@/components/nav/header';
import { AgentChat } from '@/components/agent/agent-chat';

export default function WelcomePage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();
  const [done, setDone] = useState(false);

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
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '28px 24px', borderBottom: '1px solid var(--border-soft)' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display, var(--font-body))',
                fontWeight: 700,
                fontSize: 26,
                color: 'var(--ink)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Welcome to BIOME
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                color: 'var(--slate)',
                margin: '10px 0 0',
                lineHeight: 1.5,
              }}
            >
              Let&apos;s get to know you — this helps match you to research you&apos;ll care about.
            </p>
          </div>

          <div style={{ padding: 20 }}>
            <AgentChat
              stage="onboard"
              privyDid={user.id}
              intro="Hi! I'm here to help you join the BIOME research community. To start — roughly what part of the world are you in, and what kinds of research interest you?"
              onDone={() => setDone(true)}
            />

            {done && (
              <div
                style={{
                  marginTop: 20,
                  padding: '20px',
                  background: 'var(--teal-faint)',
                  border: '1px solid var(--teal-soft)',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  alignItems: 'flex-start',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--teal-dark)',
                    margin: 0,
                  }}
                >
                  You&apos;re all set — continue to the research-awareness lessons.
                </p>
                <Link
                  href="/learn"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#ffffff',
                    background: 'var(--teal)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 18px',
                    textDecoration: 'none',
                  }}
                >
                  Continue to lessons →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
