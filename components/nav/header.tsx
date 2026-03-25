'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { NotificationBell } from '@/components/nav/notification-bell';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavProfile =
  | { kind: 'participant'; pseudonym: string; participantId: string }
  | { kind: 'experimenter'; orgName: string; orgId: string }
  | null;

// ─── Nav link style ───────────────────────────────────────────────────────────

const NAV_LINK: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color: '#7f8e87',
  textDecoration: 'none',
  paddingBottom: 2,
  borderBottom: '2px solid transparent',
  transition: 'color 150ms ease, border-color 150ms ease',
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={href}
      style={{
        ...NAV_LINK,
        color:       hover ? '#b7ff61' : '#7f8e87',
        borderColor: hover ? '#b7ff61' : 'transparent',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Link>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

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
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 200,
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        background: 'rgba(5,7,9,0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(183,255,97,0.12)',
        flexShrink: 0,
      }}
    >
      {/* Left — wordmark + version */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <span style={{
          fontFamily: 'var(--font-heading), sans-serif',
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: '5px',
          color: '#b7ff61',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          BIOME
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '1px',
          color: '#7f8e87',
          border: '1px solid rgba(255,255,255,0.09)',
          padding: '2px 6px',
        }}>
          v0.1
        </span>
      </Link>

      {/* Center — nav links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <NavLink href="/experiments">EXPLORE</NavLink>
        <NavLink href="/docs">DOCS</NavLink>
        <NavLink href="/post">POST STUDY</NavLink>
        <Link href="/demo/biome" className="mono text-xs transition-colors" style={{ color: 'var(--cyan)', textDecoration: 'none', letterSpacing: '2px' }}>
          DEMO
        </Link>
      </nav>

      {/* Right — auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {!ready && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a7055' }}>…</span>
        )}

        {ready && !authenticated && (
          <button
            onClick={login}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#b7ff61',
              background: 'rgba(183,255,97,0.06)',
              border: '1px solid rgba(183,255,97,0.2)',
              padding: '6px 14px',
              cursor: 'pointer',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            SIGN IN
          </button>
        )}

        {ready && authenticated && user && (
          <NotificationBell privyDid={user.id} />
        )}

        {ready && authenticated && (
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropOpen((o) => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '1px',
                color: displayName ? '#eef4f0' : '#7f8e87',
                background: 'none',
                border: '1px solid rgba(255,255,255,0.07)',
                padding: '5px 10px',
                cursor: 'pointer',
                transition: 'border-color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(183,255,97,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
            >
              <span className="blink" style={{ color: '#b7ff61', fontSize: 8 }}>●</span>
              {displayName ?? 'CONNECTED'}
              <span style={{ opacity: 0.4, fontSize: 9 }}>▾</span>
            </button>

            {dropOpen && (
              <div
                className="absolute right-0 top-full"
                style={{
                  marginTop: 4,
                  background: 'rgba(11,16,20,0.98)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(16px)',
                  minWidth: 180,
                  zIndex: 300,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                }}
              >
                {profileHref && (
                  <DropLink href={profileHref} onClick={() => setDropOpen(false)}>MY PROFILE →</DropLink>
                )}
                {navProfile?.kind === 'participant' && (
                  <>
                    <DropLink href="/dashboard" onClick={() => setDropOpen(false)}>DASHBOARD</DropLink>
                    <DropLink href="/dashboard/preferences" onClick={() => setDropOpen(false)}>PREFERENCES</DropLink>
                  </>
                )}
                {navProfile?.kind === 'experimenter' && (
                  <DropLink href="/dashboard/experiments" onClick={() => setDropOpen(false)}>MY STUDIES</DropLink>
                )}
                {!navProfile && (
                  <DropLink href="/onboarding" onClick={() => setDropOpen(false)}>COMPLETE SETUP</DropLink>
                )}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() => { setDropOpen(false); logout(); }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 16px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      letterSpacing: '1px',
                      color: '#4a7055',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'color 150ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#7f8e87'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#4a7055'; }}
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

// ─── Dropdown link ────────────────────────────────────────────────────────────

function DropLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '1px',
        color: hover ? '#b7ff61' : '#7f8e87',
        background: hover ? 'rgba(183,255,97,0.04)' : 'transparent',
        textDecoration: 'none',
        transition: 'color 150ms ease, background 150ms ease',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Link>
  );
}
