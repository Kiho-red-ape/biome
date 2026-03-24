'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { NotificationBell } from '@/components/nav/notification-bell';
import { BiomeLogo } from '@/components/nav/biome-logo';

type NavProfile =
  | { kind: 'participant'; pseudonym: string; participantId: string }
  | { kind: 'experimenter'; orgName: string; orgId: string }
  | null;

export function SiteHeader() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [navProfile, setNavProfile] = useState<NavProfile>(null);
  const [dropOpen, setDropOpen]     = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!authenticated || !user) { setNavProfile(null); return; }

    const cacheKey = `biome_navprofile_${user.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setNavProfile(JSON.parse(cached) as NavProfile); return; }

    // Fetch participant profile first, then experimenter if not found
    fetch(`/api/participant-profile?privyDid=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((data: { profile?: { participant_id: string; pseudonym: string } | null }) => {
        if (data.profile?.participant_id) {
          const np: NavProfile = {
            kind: 'participant',
            pseudonym: data.profile.pseudonym,
            participantId: data.profile.participant_id,
          };
          setNavProfile(np);
          sessionStorage.setItem(cacheKey, JSON.stringify(np));
          return;
        }
        // No participant profile — check experimenter
        return fetch(`/api/experimenter-profile?privyDid=${encodeURIComponent(user.id)}`)
          .then((r) => r.json())
          .then((d: { profile?: { id: string; org_name: string } | null }) => {
            if (d.profile?.id) {
              const np: NavProfile = { kind: 'experimenter', orgName: d.profile.org_name, orgId: d.profile.id };
              setNavProfile(np);
              sessionStorage.setItem(cacheKey, JSON.stringify(np));
            }
          });
      })
      .catch(() => {});
  }, [authenticated, user]);

  const displayName =
    navProfile?.kind === 'participant' ? navProfile.pseudonym
    : navProfile?.kind === 'experimenter' ? navProfile.orgName
    : null;

  const profileHref =
    navProfile?.kind === 'participant' ? `/profile/${navProfile.participantId}`
    : navProfile?.kind === 'experimenter' ? `/org/${navProfile.orgId}`
    : null;

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
      style={{
        background: 'rgba(10, 18, 8, 0.94)',
        borderBottom: '1px solid rgba(77, 255, 128, 0.14)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        <BiomeLogo width={110} />
        <span
          className="mono text-xs px-1 py-px rounded"
          style={{ color: 'var(--text-dim)', border: '1px solid rgba(77,255,128,0.12)' }}
        >
          v0.1
        </span>
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-8">
        <Link href="/experiments" className="mono text-xs transition-colors" style={{ color: 'var(--text-dim)' }}>
          EXPLORE
        </Link>
        <Link href="/post" className="mono text-xs transition-colors" style={{ color: 'var(--text-dim)' }}>
          POST BOUNTY
        </Link>
        <Link href="/demo/biome" className="mono text-xs transition-colors" style={{ color: 'var(--cyan)' }}>
          DEMO
        </Link>
      </nav>

      {/* Auth area */}
      <div className="flex items-center gap-3">
        {!ready && (
          <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>...</span>
        )}

        {ready && !authenticated && (
          <button
            onClick={login}
            className="mono text-xs px-4 py-1.5 rounded transition-all hover:opacity-80"
            style={{ border: '1px solid var(--green-dim)', color: 'var(--green)', background: 'rgba(77,255,128,0.04)' }}
          >
            SIGN IN
          </button>
        )}

        {ready && authenticated && user && (
          <NotificationBell privyDid={user.id} />
        )}

        {ready && authenticated && (
          <div className="relative flex items-center gap-3" ref={dropRef}>

            {/* Identity chip */}
            <button
              onClick={() => setDropOpen((o) => !o)}
              className="flex items-center gap-2 mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-80"
              style={{ border: '1px solid rgba(77,255,128,0.1)', color: 'var(--text-dim)', background: 'transparent' }}
            >
              <span className="blink" style={{ color: 'var(--green)' }}>●</span>
              <span style={{ color: displayName ? 'var(--text-bright)' : 'var(--text-dim)' }}>
                {displayName ?? 'CONNECTED'}
              </span>
              <span style={{ opacity: 0.5 }}>▾</span>
            </button>

            {/* Dropdown */}
            {dropOpen && (
              <div
                className="absolute right-0 top-full mt-1 rounded overflow-hidden"
                style={{
                  background: 'rgba(11,18,11,0.97)',
                  border: '1px solid rgba(77,255,128,0.14)',
                  backdropFilter: 'blur(12px)',
                  minWidth: 180,
                  zIndex: 100,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                {profileHref && (
                  <Link
                    href={profileHref}
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 mono text-xs no-underline transition-colors hover:bg-opacity-50"
                    style={{ color: 'var(--green)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(77,255,128,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    MY PROFILE →
                  </Link>
                )}
                {navProfile?.kind === 'participant' && (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 mono text-xs no-underline transition-colors"
                      style={{ color: 'var(--text-dim)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(77,255,128,0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      DASHBOARD
                    </Link>
                    <Link
                      href="/dashboard/preferences"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 mono text-xs no-underline transition-colors"
                      style={{ color: 'var(--text-dim)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(77,255,128,0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      PREFERENCES
                    </Link>
                  </>
                )}
                {navProfile?.kind === 'experimenter' && (
                  <Link
                    href="/dashboard/experiments"
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 mono text-xs no-underline transition-colors"
                    style={{ color: 'var(--text-dim)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(77,255,128,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    MY STUDIES
                  </Link>
                )}
                {!navProfile && (
                  <Link
                    href="/onboarding"
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 mono text-xs no-underline"
                    style={{ color: 'var(--text-dim)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(77,255,128,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    COMPLETE SETUP
                  </Link>
                )}
                <div style={{ borderTop: '1px solid rgba(77,255,128,0.08)' }}>
                  <button
                    onClick={() => { setDropOpen(false); logout(); }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 mono text-xs transition-colors"
                    style={{ color: 'var(--text-dim)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(77,255,128,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    SIGN OUT
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
