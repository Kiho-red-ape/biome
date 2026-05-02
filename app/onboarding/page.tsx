'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Suspense } from 'react';

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, ready, authenticated } = usePrivy();

  const roleParam = searchParams.get('role'); // 'participant' | 'researcher'

  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preselectedRole = roleParam === 'participant' ? 'participant' :
                          roleParam === 'researcher'  ? 'experimenter' : null;

  const checkExistingProfile = useCallback(async (privyDid: string) => {
    try {
      const res = await fetch(`/api/profile?privyDid=${encodeURIComponent(privyDid)}`);
      if (res.ok) {
        const data = await res.json() as { profile?: { role?: string } | null };
        if (data.profile) {
          // Profile already exists — route based on existing role
          const role = data.profile.role;
          if (role === 'participant') { router.replace('/onboarding/participant'); return; }
          if (role === 'experimenter') { router.replace('/onboarding/experimenter'); return; }
          router.replace('/dashboard');
        }
      }
    } catch { /* let user proceed */ }
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) { router.replace('/'); return; }
    void checkExistingProfile(user.id);
  }, [ready, authenticated, user, checkExistingProfile, router]);

  async function handleSubmit(role: 'participant' | 'experimenter') {
    if (!user) return;
    setLoading(true);
    setError(null);

    const walletAddress = user.wallet?.address ?? null;
    const authType      = user.wallet ? 'wallet' : 'email';
    const email         = user.email?.address ?? null;

    try {
      const res = await fetch('/api/profile', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyDid: user.id,
          authType,
          walletAddress,
          role,
          region: region.trim() || null,
          email,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Failed to create profile');
      }

      if (role === 'participant') {
        router.replace('/onboarding/participant');
      } else {
        router.replace('/onboarding/experimenter');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="mono text-sm" style={{ color: 'var(--text-dim)' }}>// LOADING...</span>
      </div>
    );
  }

  // ── Role pre-selected via URL param — show region input + confirm ──────────
  if (preselectedRole) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded p-px" style={{ background: 'var(--green-dim)' }}>
          <div className="rounded p-8 flex flex-col gap-6" style={{ background: 'var(--bg2)' }}>
            <div>
              <p className="mono text-xs mb-4" style={{ color: 'var(--text-dim)' }}>// ONBOARDING</p>
              <h1 className="text-xl font-black" style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
                {preselectedRole === 'participant' ? 'Join as a research partner' : 'Register as a researcher'}
              </h1>
              <p className="text-sm mt-2" style={{ color: 'var(--text-dim)' }}>
                {preselectedRole === 'participant'
                  ? 'Contribute to real studies. Receive fair compensation.'
                  : 'Run self-directed studies with our recruitment and logistics platform.'}
              </p>
            </div>

            <div>
              <label className="mono text-xs block mb-2" style={{ color: 'var(--text-dim)' }}>
                REGION (optional)
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. United States"
                maxLength={64}
                className="w-full px-4 py-2 rounded text-sm outline-none"
                style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.15)', color: 'var(--text-bright)' }}
              />
            </div>

            {error && (
              <p className="mono text-xs" style={{ color: 'var(--amber)' }}>// ERROR: {error}</p>
            )}

            <button
              onClick={() => void handleSubmit(preselectedRole)}
              disabled={loading}
              className="w-full py-3 rounded font-semibold text-sm transition-all disabled:opacity-40 hover:opacity-90"
              style={{ background: 'var(--green)', color: '#050709' }}
            >
              {loading ? 'Setting up...' : 'Continue →'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── No role param — two-card selection ────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <p className="mono text-xs mb-4 text-center" style={{ color: 'var(--text-dim)' }}>// ONBOARDING</p>
        <h1 className="text-2xl font-black text-center mb-2" style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
          Welcome to BIOME
        </h1>
        <p className="text-sm text-center mb-10" style={{ color: 'var(--text-dim)' }}>
          How do you want to use BIOME?
        </p>

        <div className="flex flex-col gap-4">
          {/* Participant card */}
          <button
            type="button"
            onClick={() => void handleSubmit('participant')}
            disabled={loading}
            className="biome-card rounded p-6 text-left transition-all disabled:opacity-40 w-full"
          >
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-white)' }}>
              Join as a research partner
            </p>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Contribute to real studies from home. Receive fair compensation.
            </p>
            <p className="mono text-xs mt-3" style={{ color: 'var(--green)' }}>
              Research partner →
            </p>
          </button>

          {/* Researcher card */}
          <button
            type="button"
            onClick={() => void handleSubmit('experimenter')}
            disabled={loading}
            className="biome-card rounded p-6 text-left transition-all disabled:opacity-40 w-full"
          >
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-white)' }}>
              Run a study
            </p>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Post a study bounty. BIOME handles recruitment, logistics, and payouts.
            </p>
            <p className="mono text-xs mt-3" style={{ color: 'var(--cyan)' }}>
              Researcher →
            </p>
          </button>
        </div>

        {error && (
          <p className="mono text-xs mt-6 text-center" style={{ color: 'var(--amber)' }}>// ERROR: {error}</p>
        )}
        {loading && (
          <p className="mono text-xs mt-6 text-center" style={{ color: 'var(--text-dim)' }}>// CREATING PROFILE...</p>
        )}
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <span className="mono text-sm" style={{ color: 'var(--text-dim)' }}>// LOADING...</span>
      </div>
    }>
      <OnboardingInner />
    </Suspense>
  );
}
