'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function SiteHeader() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [participantId, setParticipantId] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated || !user) {
      setParticipantId(null);
      return;
    }
    // Check sessionStorage cache first
    const cached = sessionStorage.getItem(`biome_pid_${user.id}`);
    if (cached) { setParticipantId(cached); return; }

    fetch(`/api/participant-profile?privyDid=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((data: { profile?: { participant_id: string } }) => {
        const pid = data.profile?.participant_id ?? null;
        if (pid) sessionStorage.setItem(`biome_pid_${user.id}`, pid);
        setParticipantId(pid);
      })
      .catch(() => {});
  }, [authenticated, user]);

  const shortAddress =
    user?.wallet?.address
      ? `${user.wallet.address.slice(0, 6)}…${user.wallet.address.slice(-4)}`
      : user?.email?.address
        ? user.email.address.split('@')[0]
        : null;

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      style={{
        background: 'rgba(7, 12, 7, 0.92)',
        borderBottom: '1px solid rgba(77, 255, 128, 0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        <span
          className="text-lg font-black tracking-widest"
          style={{ color: 'var(--green)', fontFamily: 'var(--font-heading)', letterSpacing: '0.18em' }}
        >
          BIOME
        </span>
        <span
          className="mono text-xs px-1 py-px rounded"
          style={{ color: 'var(--text-dim)', border: '1px solid rgba(77,255,128,0.12)' }}
        >
          v0.1
        </span>
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-8">
        <Link href="/" className="mono text-xs transition-colors" style={{ color: 'var(--text-dim)' }}>
          EXPLORE
        </Link>
        <Link href="/post" className="mono text-xs transition-colors" style={{ color: 'var(--text-dim)' }}>
          POST BOUNTY
        </Link>
      </nav>

      {/* Auth */}
      <div>
        {!ready && (
          <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>...</span>
        )}

        {ready && !authenticated && (
          <button
            onClick={login}
            className="mono text-xs px-4 py-1.5 rounded transition-all hover:opacity-80"
            style={{
              border: '1px solid var(--green-dim)',
              color: 'var(--green)',
              background: 'rgba(77,255,128,0.04)',
            }}
          >
            SIGN IN
          </button>
        )}

        {ready && authenticated && (
          <div className="flex items-center gap-4">
            <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              <span className="blink" style={{ color: 'var(--green)' }}>●</span>{' '}
              {shortAddress ?? 'CONNECTED'}
            </span>
            {participantId ? (
              <Link
                href={`/profile/${participantId}`}
                className="mono text-xs no-underline transition-opacity hover:opacity-80"
                style={{ color: 'var(--green)' }}
              >
                MY PROFILE
              </Link>
            ) : (
              <Link
                href="/onboarding"
                className="mono text-xs no-underline transition-opacity hover:opacity-80"
                style={{ color: 'var(--text-dim)' }}
              >
                SETUP
              </Link>
            )}
            <button
              onClick={logout}
              className="mono text-xs px-3 py-1 rounded transition-all hover:opacity-60"
              style={{ color: 'var(--text-dim)', border: '1px solid rgba(77,255,128,0.08)' }}
            >
              EXIT
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
