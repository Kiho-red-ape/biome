'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Suspense } from 'react';

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, ready, authenticated, login } = usePrivy();

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
    if (!ready || !authenticated || !user) return;
    if (preselectedRole) return; // user has explicit role intent — don't override with existing profile
    void checkExistingProfile(user.id);
  }, [ready, authenticated, user, preselectedRole, checkExistingProfile]);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>Loading…</span>
      </div>
    );
  }

  // ── Not authenticated — show sign-in prompt ────────────────────────────────
  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--bg-page)' }}>
        <div
          className="w-full text-center"
          style={{
            maxWidth:     420,
            background:   'var(--surface)',
            border:       '1px solid var(--border-soft)',
            borderRadius: 'var(--radius)',
            boxShadow:    'var(--shadow-sm)',
            padding:      '40px 32px',
          }}
        >
          <span className="section-label">Sign in required</span>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>
            {preselectedRole === 'participant' ? 'Join as a research partner' :
             preselectedRole === 'experimenter' ? 'Register as a researcher' :
             'Sign in to continue'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--slate)', lineHeight: 1.65, marginBottom: 28 }}>
            {preselectedRole === 'participant'
              ? 'Create your account to join research studies and receive compensation.'
              : preselectedRole === 'experimenter'
              ? 'Create your account to start running studies on Biome.'
              : 'Sign in or create an account to get started.'}
          </p>
          <button onClick={login} className="btn-primary w-full">
            Sign in / Create account →
          </button>
        </div>
      </main>
    );
  }

  // ── Role pre-selected via URL param — show region input + confirm ──────────
  if (preselectedRole) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--bg-page)' }}>
        <div
          className="w-full max-w-md flex flex-col gap-6"
          style={{
            background:   'var(--surface)',
            border:       '1px solid var(--border-soft)',
            borderRadius: 'var(--radius)',
            boxShadow:    'var(--shadow-sm)',
            padding:      36,
          }}
        >
          <div>
            <span className="section-label">Onboarding</span>
            <h1 style={{ fontSize: 22 }}>
              {preselectedRole === 'participant' ? 'Join as a research partner' : 'Register as a researcher'}
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--slate)' }}>
              {preselectedRole === 'participant'
                ? 'Contribute to real studies. Receive fair compensation.'
                : 'Run self-directed studies with our recruitment and logistics platform.'}
            </p>
          </div>

          <div>
            <label
              className="text-sm font-medium block mb-2"
              style={{ color: 'var(--ink)' }}
            >
              Region <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. United States"
              maxLength={64}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
          )}

          <button
            onClick={() => void handleSubmit(preselectedRole)}
            disabled={loading}
            className="btn-primary w-full disabled:opacity-40"
          >
            {loading ? 'Setting up…' : 'Continue →'}
          </button>
        </div>
      </main>
    );
  }

  // ── No role param — two-card selection ────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--bg-page)' }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <span className="section-label">Onboarding</span>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Welcome to BIOME</h1>
          <p className="text-sm" style={{ color: 'var(--slate)' }}>
            How do you want to use BIOME?
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Research partner card */}
          <button
            type="button"
            onClick={() => void handleSubmit('participant')}
            disabled={loading}
            className="text-left w-full disabled:opacity-40"
            style={{
              background:   'var(--surface)',
              border:       '1px solid var(--border-soft)',
              borderRadius: 'var(--radius)',
              boxShadow:    'var(--shadow-sm)',
              padding:      24,
              cursor:       'pointer',
              transition:   'border-color 150ms ease, box-shadow 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
          >
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--ink)' }}>
              Join as a research partner
            </p>
            <p className="text-sm" style={{ color: 'var(--slate)' }}>
              Contribute to real studies from home. Receive fair compensation.
            </p>
            <p className="text-sm font-semibold mt-3" style={{ color: 'var(--teal)' }}>
              Research partner →
            </p>
          </button>

          {/* Researcher card */}
          <button
            type="button"
            onClick={() => void handleSubmit('experimenter')}
            disabled={loading}
            className="text-left w-full disabled:opacity-40"
            style={{
              background:   'var(--surface)',
              border:       '1px solid var(--border-soft)',
              borderRadius: 'var(--radius)',
              boxShadow:    'var(--shadow-sm)',
              padding:      24,
              cursor:       'pointer',
              transition:   'border-color 150ms ease, box-shadow 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
          >
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--ink)' }}>
              Run a study
            </p>
            <p className="text-sm" style={{ color: 'var(--slate)' }}>
              Post a study bounty. BIOME handles recruitment, logistics, and payouts.
            </p>
            <p className="text-sm font-semibold mt-3" style={{ color: 'var(--teal)' }}>
              Researcher →
            </p>
          </button>
        </div>

        {error && (
          <p className="text-sm mt-6 text-center" style={{ color: 'var(--error)' }}>{error}</p>
        )}
        {loading && (
          <p className="text-sm mt-6 text-center" style={{ color: 'var(--muted)' }}>Creating profile…</p>
        )}
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>Loading…</span>
      </div>
    }>
      <OnboardingInner />
    </Suspense>
  );
}
