'use client';

import { useState } from 'react';
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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create profile');
      }

      // Route to role-specific onboarding next
      if (selectedRole === 'experimenter') {
        router.replace('/onboarding/experimenter');
      } else {
        // participant and both both go through participant onboarding first
        router.replace('/onboarding/participant');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
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
                color: 'var(--bg)',
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
