'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Props {
  privyDid: string;
  currentView: 'participant' | 'experimenter';
}

// Checks if the user has both profiles and shows a switch banner.
export function ProfileSwitcher({ privyDid, currentView }: Props) {
  const [hasBoth, setHasBoth] = useState(false);

  useEffect(() => {
    // Check both profiles in parallel
    Promise.all([
      fetch(`/api/participant-profile?privyDid=${encodeURIComponent(privyDid)}`).then((r) => r.json()) as Promise<{ profile: unknown | null }>,
      fetch(`/api/experimenter-profile?privyDid=${encodeURIComponent(privyDid)}`).then((r) => r.json()) as Promise<{ profile: unknown | null }>,
    ]).then(([pp, ep]) => {
      if (pp.profile && ep.profile) setHasBoth(true);
    }).catch(() => {/* ignore */});
  }, [privyDid]);

  if (!hasBoth) return null;

  const switchTo = currentView === 'participant' ? 'experimenter' : 'participant';
  const switchHref = switchTo === 'experimenter' ? '/dashboard/experiments' : '/dashboard';
  const switchLabel = switchTo === 'experimenter' ? 'Experimenter view →' : 'Participant view →';

  return (
    <div className="flex items-center gap-3 px-4 py-2 mb-6 rounded"
      style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)' }}>
      <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
        You have both a participant and experimenter profile.
      </span>
      <Link
        href={switchHref}
        className="mono text-xs font-bold no-underline transition-opacity hover:opacity-80"
        style={{ color: 'var(--cyan)', flexShrink: 0 }}
      >
        {switchLabel}
      </Link>
    </div>
  );
}
