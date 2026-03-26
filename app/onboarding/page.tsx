'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

type Role = 'experimenter' | 'participant' | 'both';

const ROLES: { value: Role; label: string; description: string }[] = [
  {
    value: 'participant',
    label: 'Participant',
    description: 'I want to join experiments and earn bounties.',
  },
  {
    value: 'experimenter',
    label: 'Experimenter',
    description: 'I run experiments and need participants.',
  },
  {
    value: 'both',
    label: 'Both',
    description: 'I do both — participate and run experiments.',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Role | null>(null); // role after success

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="mono text-sm" style={{ color: 'var(--text-dim)' }}>
          // LOADING...
        </span>
      </div>
    );
  }

  if (!authenticated || !user) {
    router.replace('/');
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole || !displayName.trim() || !user) return;

    setLoading(true);
    setError(null);

    const walletAddress =
      user.wallet?.address ?? null;
    const authType = user.wallet ? 'wallet' : 'email';
    const email = user.email?.address ?? null;

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyDid: user.id,
          authType,
          walletAddress,
          displayName: displayName.trim(),
          role: selectedRole,
          region: region.trim() || null,
          email,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create profile');
      }

      // Show success panel — user picks their next step
      setDone(selectedRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // ── Success panel ───────────────────────────────────────────────────────────
  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg rounded p-px" style={{ background: 'var(--green-dim)' }}>
          <div className="rounded p-8 flex flex-col gap-5" style={{ background: 'var(--bg2)' }}>
            <p className="mono text-xs" style={{ color: 'var(--green)' }}>// PROFILE_CREATED</p>
            <h2 className="text-xl font-black" style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
              Basic profile created. Complete your setup.
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Choose what to set up next. You can do both if you selected &ldquo;Both&rdquo;.
            </p>
            <div className="flex flex-col gap-3 pt-1">
              {(done === 'participant' || done === 'both') && (
                <Link
                  href="/onboarding/participant"
                  className="w-full py-3 rounded font-semibold text-sm text-center mono no-underline transition-all hover:opacity-90"
                  style={{ background: 'var(--green)', color: '#050709' }}
                >
                  Set up participant identity →
                </Link>
              )}
              {(done === 'experimenter' || done === 'both') && (
                <Link
                  href="/onboarding/experimenter"
                  className="w-full py-3 rounded font-semibold text-sm text-center mono no-underline transition-all hover:opacity-90"
                  style={{ background: done === 'experimenter' ? 'var(--green)' : 'transparent', color: done === 'experimenter' ? '#050709' : 'var(--green)', border: done === 'both' ? '1px solid var(--green-dim)' : 'none' }}
                >
                  Set up organization profile →
                </Link>
              )}
              <button
                onClick={() => router.push('/')}
                className="w-full py-2.5 rounded text-sm mono transition-all hover:opacity-70"
                style={{ color: 'var(--text-dim)', border: '1px solid rgba(77,255,128,0.1)' }}
              >
                Skip — explore BIOME first
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg corner-bracket p-px rounded" style={{ background: 'var(--green-dim)' }}>
        <div className="rounded p-8" style={{ background: 'var(--bg2)' }}>

          {/* Header */}
          <p className="mono text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
            // ONBOARDING
          </p>
          <h1 className="text-2xl mb-2" style={{ color: 'var(--text-white)' }}>
            Welcome to BIOME
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-dim)' }}>
            Set up your profile to get started.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Display name */}
            <div>
              <label className="mono text-xs block mb-2" style={{ color: 'var(--text-dim)' }}>
                DISPLAY_NAME *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name or handle"
                required
                maxLength={64}
                className="w-full px-4 py-2 rounded text-sm outline-none transition-colors"
                style={{
                  background: 'var(--bg3)',
                  border: '1px solid rgba(77,255,128,0.15)',
                  color: 'var(--text-bright)',
                }}
              />
            </div>

            {/* Region */}
            <div>
              <label className="mono text-xs block mb-2" style={{ color: 'var(--text-dim)' }}>
                REGION (optional)
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. United States, Remote"
                maxLength={64}
                className="w-full px-4 py-2 rounded text-sm outline-none"
                style={{
                  background: 'var(--bg3)',
                  border: '1px solid rgba(77,255,128,0.15)',
                  color: 'var(--text-bright)',
                }}
              />
            </div>

            {/* Role selection */}
            <div>
              <label className="mono text-xs block mb-3" style={{ color: 'var(--text-dim)' }}>
                I AM A... *
              </label>
              <div className="flex flex-col gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRole(r.value)}
                    className="biome-card rounded p-4 text-left transition-all"
                    style={{
                      borderTopColor: selectedRole === r.value ? 'var(--green)' : undefined,
                      background: selectedRole === r.value ? 'var(--bg3)' : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full border-2 flex-shrink-0"
                        style={{
                          borderColor: selectedRole === r.value ? 'var(--green)' : 'var(--text-dim)',
                          background: selectedRole === r.value ? 'var(--green)' : 'transparent',
                        }}
                      />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-white)' }}>
                          {r.label}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                          {r.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs mono" style={{ color: 'var(--amber)' }}>
                // ERROR: {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!selectedRole || !displayName.trim() || loading}
              className="w-full py-3 rounded font-semibold text-sm transition-all disabled:opacity-40"
              style={{
                background: 'var(--green)',
                color: '#050709',
              }}
            >
              {loading ? 'Creating profile...' : 'Enter BIOME →'}
            </button>

          </form>
        </div>
      </div>
    </main>
  );
}
