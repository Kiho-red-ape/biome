'use client';

// Placeholder — full experimenter onboarding built in Step 6 of the build order.
// Experimenters land here after selecting their role; this screen holds them
// until the org profile form is implemented.

import { useRouter } from 'next/navigation';

export default function ExperimenterOnboardingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div
        className="w-full max-w-lg rounded p-px"
        style={{ background: 'var(--green-dim)' }}
      >
        <div className="rounded p-8 flex flex-col gap-6" style={{ background: 'var(--bg2)' }}>
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            // EXPERIMENTER_ONBOARDING
          </p>
          <h1
            className="text-2xl font-black"
            style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}
          >
            Experimenter profile setup
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            The full experimenter profile form is coming soon. You can explore the platform in the
            meantime.
          </p>
          <button
            onClick={() => router.replace('/')}
            className="w-full py-3 rounded font-semibold text-sm transition-all hover:opacity-90"
            style={{ background: 'var(--green)', color: 'var(--bg)' }}
          >
            Go to dashboard →
          </button>
        </div>
      </div>
    </main>
  );
}
