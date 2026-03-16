'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { ready, authenticated, login, user } = usePrivy();
  const router = useRouter();

  // After login, check if profile exists → if not, send to onboarding
  useEffect(() => {
    if (!ready || !authenticated || !user) return;

    fetch(`/api/profile?privyDid=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile) router.push('/onboarding');
      });
  }, [ready, authenticated, user, router]);

  return (
    <main className="min-h-screen flex flex-col">

      {/* ── Ticker bar ───────────────────────────────────────── */}
      <div
        className="w-full overflow-hidden py-1.5 mono text-xs"
        style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.1)' }}
      >
        <div className="ticker-track">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="flex gap-10 px-5" style={{ color: 'var(--text-dim)' }}>
              <span>// BIOME PROTOCOL v0.1</span>
              <span style={{ color: 'var(--green)' }}>● RECRUITING</span>
              <span>EXPERIMENTS_LIVE: 0</span>
              <span>TOTAL_BOUNTIES: $0</span>
              <span>PARTICIPANTS: 0</span>
              <span style={{ color: 'var(--cyan)' }}>PHASE_1: FOUNDATION</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center flex-1 px-4 py-24 text-center">
        <p className="mono text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
          // EXPERIMENT_AGGREGATOR
        </p>

        <h1 className="text-4xl md:text-6xl mb-4 max-w-2xl leading-tight">
          The CoinGecko of{' '}
          <span style={{ color: 'var(--green)' }}>Scientific Experiments</span>
        </h1>

        <p className="text-base max-w-md mb-10" style={{ color: 'var(--text-dim)' }}>
          Discover bounty-based experiments. Sign up. Earn.
          <br />
          Post an experiment. Get your cohort.
        </p>

        {/* Platform stats */}
        <div className="flex gap-8 mb-12 mono text-xs" style={{ color: 'var(--text-dim)' }}>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--text-white)' }}>0</p>
            <p>EXPERIMENTS</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--text-white)' }}>$0</p>
            <p>BOUNTIES</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--text-white)' }}>0</p>
            <p>PARTICIPANTS</p>
          </div>
        </div>

        {/* CTA */}
        {ready && !authenticated && (
          <button
            onClick={login}
            className="px-8 py-3 rounded font-bold text-sm transition-all hover:opacity-90"
            style={{ background: 'var(--green)', color: 'var(--bg)' }}
          >
            Enter BIOME →
          </button>
        )}

        {ready && authenticated && (
          <p className="mono text-xs" style={{ color: 'var(--green)' }}>
            <span className="blink">●</span> CONNECTED
          </p>
        )}

        {!ready && (
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            // INITIALIZING...
          </p>
        )}
      </section>

      {/* ── Phase label ──────────────────────────────────────── */}
      <div
        className="text-center py-4 mono text-xs"
        style={{ color: 'var(--text-dim)', borderTop: '1px solid rgba(77,255,128,0.06)' }}
      >
        // PHASE_1: FOUNDATION — dashboard coming in Phase 2
      </div>

    </main>
  );
}
