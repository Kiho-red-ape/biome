'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { NotificationBell } from '@/components/nav/notification-bell';

type NavProfile =
  | { kind: 'participant'; pseudonym: string; participantId: string }
  | { kind: 'experimenter'; orgName: string; orgId: string }
  | null;

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={href}
      style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      11,
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        color:         hover ? '#f59e0b' : '#64748b',
        textDecoration: 'none',
        paddingBottom:  3,
        borderBottom:  `2px solid ${hover ? '#f59e0b' : 'transparent'}`,
        transition:    'color 150ms ease, border-color 150ms ease',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Link>
  );
}

function OverlayLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display:       'flex',
        alignItems:    'center',
        minHeight:     52,
        padding:       '0 24px',
        fontFamily:    'var(--font-mono)',
        fontSize:      13,
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        color:         '#94a3b8',
        textDecoration: 'none',
        borderBottom:  '1px solid rgba(248,250,252,0.05)',
      }}
    >
      {children}
    </Link>
  );
}

export function SiteHeader() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [navProfile, setNavProfile] = useState<NavProfile>(null);
  const [dropOpen,   setDropOpen]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
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
            kind:          'participant',
            pseudonym:     data.profile.pseudonym,
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
    navProfile?.kind === 'participant'  ? navProfile.pseudonym
    : navProfile?.kind === 'experimenter' ? navProfile.orgName
    : null;

  const truncatedName = displayName ? displayName.slice(0, 12) + (displayName.length > 12 ? '…' : '') : null;

  const profileHref =
    navProfile?.kind === 'participant'  ? `/profile/${navProfile.participantId}`
    : navProfile?.kind === 'experimenter' ? `/org/${navProfile.orgId}`
    : null;

  return (
    <>
      <header
        style={{
          position:       'sticky',
          top:            0,
          zIndex:         200,
          height:         56,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          background:     '#060a14',
          borderBottom:   '1px solid rgba(248,250,252,0.07)',
          flexShrink:     0,
        }}
        className="px-4 sm:px-6 lg:px-10"
      >
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <span style={{
            fontFamily:    'var(--font-heading)',
            fontWeight:    700,
            fontSize:      20,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            lineHeight:    1,
            color:         '#f8fafc',
          }}>
            BIO<span style={{ color: '#f59e0b' }}>ME</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex" style={{ alignItems: 'center', gap: 32 }}>
          <NavLink href="/run-a-study">Run a Study</NavLink>
          <NavLink href="/participate">Participate</NavLink>
          <NavLink href="/partners/join">Partners</NavLink>
          <NavLink href="/blog">Blog</NavLink>
          <NavLink href="/docs">Docs</NavLink>
        </nav>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {ready && authenticated && user && (
            <NotificationBell privyDid={user.id} />
          )}

          {/* Mobile: name chip + hamburger */}
          <div className="flex sm:hidden items-center gap-3">
            {truncatedName && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#64748b', letterSpacing: '0.5px' }}>
                {truncatedName}
              </span>
            )}
            {ready && !authenticated && (
              <button
                onClick={login}
                style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      11,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color:         '#f59e0b',
                  background:    'transparent',
                  border:        '1px solid rgba(245,158,11,0.35)',
                  padding:       '6px 12px',
                  cursor:        'pointer',
                  minHeight:     36,
                }}
              >
                Sign in
              </button>
            )}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 4px', display: 'flex', flexDirection: 'column',
                gap: 5, minHeight: 44, minWidth: 44,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ display: 'block', width: 22, height: 2, background: '#94a3b8' }} />
              ))}
            </button>
          </div>

          {/* Desktop auth */}
          <div className="hidden sm:flex items-center" style={{ gap: 16 }}>
            {!ready && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#475569' }}>…</span>
            )}
            {ready && !authenticated && (
              <button
                onClick={login}
                style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      11,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color:         '#f59e0b',
                  background:    'transparent',
                  border:        '1px solid rgba(245,158,11,0.35)',
                  padding:       '6px 16px',
                  cursor:        'pointer',
                  transition:    'border-color 150ms ease',
                  minHeight:     36,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.35)'; }}
              >
                Sign in
              </button>
            )}
            {ready && authenticated && (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen((o) => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '1px',
                    color: displayName ? '#e2e8f0' : '#64748b',
                    background: 'none', border: '1px solid rgba(248,250,252,0.08)',
                    padding: '5px 10px', cursor: 'pointer',
                    transition: 'border-color 150ms ease', minHeight: 36,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(248,250,252,0.08)'; }}
                >
                  <span style={{ width: 6, height: 6, background: '#f59e0b', display: 'inline-block' }} />
                  {displayName ?? 'CONNECTED'}
                  <span style={{ opacity: 0.4, fontSize: 9 }}>▾</span>
                </button>

                {dropOpen && (
                  <div
                    className="absolute right-0 top-full"
                    style={{
                      marginTop: 4, background: '#0c1220',
                      border: '1px solid rgba(248,250,252,0.1)',
                      minWidth: 180, zIndex: 300,
                      boxShadow: '4px 4px 0 rgba(0,0,0,0.4)',
                    }}
                  >
                    {profileHref && (
                      <DropLink href={profileHref} onClick={() => setDropOpen(false)}>My Profile →</DropLink>
                    )}
                    {navProfile?.kind === 'participant' && (
                      <>
                        <DropLink href="/dashboard" onClick={() => setDropOpen(false)}>Dashboard</DropLink>
                        <DropLink href="/dashboard/preferences" onClick={() => setDropOpen(false)}>Preferences</DropLink>
                      </>
                    )}
                    {navProfile?.kind === 'experimenter' && (
                      <DropLink href="/dashboard/experiments" onClick={() => setDropOpen(false)}>My Studies</DropLink>
                    )}
                    {!navProfile && (
                      <DropLink href="/onboarding" onClick={() => setDropOpen(false)}>Complete Setup</DropLink>
                    )}
                    <div style={{ borderTop: '1px solid rgba(248,250,252,0.06)' }}>
                      <button
                        onClick={() => { setDropOpen(false); logout(); }}
                        style={{
                          width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                          padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 11,
                          letterSpacing: '1px', color: '#475569', background: 'none', border: 'none',
                          cursor: 'pointer', transition: 'color 150ms ease', minHeight: 44,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; }}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile overlay menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500, background: '#060a14',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', height: 56, borderBottom: '1px solid rgba(248,250,252,0.07)',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, letterSpacing: '3px', textTransform: 'uppercase', color: '#f8fafc' }}>
              BIO<span style={{ color: '#f59e0b' }}>ME</span>
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94a3b8', fontSize: 20, minHeight: 44, minWidth: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: 1 }}>
            <OverlayLink href="/run-a-study"   onClick={() => setMenuOpen(false)}>Run a Study</OverlayLink>
            <OverlayLink href="/participate"    onClick={() => setMenuOpen(false)}>Participate</OverlayLink>
            <OverlayLink href="/partners/join"  onClick={() => setMenuOpen(false)}>Partners</OverlayLink>
            <OverlayLink href="/blog"           onClick={() => setMenuOpen(false)}>Blog</OverlayLink>
            <OverlayLink href="/docs"           onClick={() => setMenuOpen(false)}>Docs</OverlayLink>

            <div style={{ height: 1, background: 'rgba(248,250,252,0.05)', margin: '8px 0' }} />

            {ready && authenticated && (
              <>
                {profileHref && (
                  <OverlayLink href={profileHref} onClick={() => setMenuOpen(false)}>My Profile</OverlayLink>
                )}
                {navProfile?.kind === 'participant' && (
                  <>
                    <OverlayLink href="/dashboard"             onClick={() => setMenuOpen(false)}>Dashboard</OverlayLink>
                    <OverlayLink href="/dashboard/preferences" onClick={() => setMenuOpen(false)}>Preferences</OverlayLink>
                  </>
                )}
                {navProfile?.kind === 'experimenter' && (
                  <OverlayLink href="/dashboard/experiments" onClick={() => setMenuOpen(false)}>My Studies</OverlayLink>
                )}
                {!navProfile && (
                  <OverlayLink href="/onboarding" onClick={() => setMenuOpen(false)}>Complete Setup</OverlayLink>
                )}
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  style={{
                    display: 'flex', alignItems: 'center', minHeight: 52, width: '100%',
                    padding: '0 24px', fontFamily: 'var(--font-mono)', fontSize: 13,
                    textTransform: 'uppercase', letterSpacing: '1.5px', color: '#475569',
                    background: 'none', border: 'none', borderBottom: '1px solid rgba(248,250,252,0.05)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  Sign out
                </button>
              </>
            )}

            {ready && !authenticated && (
              <button
                onClick={() => { setMenuOpen(false); login(); }}
                style={{
                  display: 'flex', alignItems: 'center', minHeight: 52, width: '100%',
                  padding: '0 24px', fontFamily: 'var(--font-mono)', fontSize: 13,
                  textTransform: 'uppercase', letterSpacing: '1.5px', color: '#f59e0b',
                  background: 'none', border: 'none', borderBottom: '1px solid rgba(248,250,252,0.05)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                Sign in →
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DropLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', padding: '10px 16px',
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '1px',
        color: hover ? '#f59e0b' : '#64748b',
        background: hover ? 'rgba(245,158,11,0.04)' : 'transparent',
        textDecoration: 'none', transition: 'color 150ms ease, background 150ms ease', minHeight: 44,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Link>
  );
}
