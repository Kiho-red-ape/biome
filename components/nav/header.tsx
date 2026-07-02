'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { NotificationBell } from '@/components/nav/notification-bell';

// A user can be BOTH a participant and an experimenter — carry both so the
// account menu always exposes researcher entries to researchers.
type NavProfile = {
  participant?:  { pseudonym: string; participantId: string };
  experimenter?: { orgName: string; orgId: string };
} | null;

const NAV_LINKS = [
  { href: '/run-a-study',  label: 'Run a Study'  },
  { href: '/participate',  label: 'Participate'  },
  { href: '/partners/join', label: 'Partners'   },
  { href: '/blog',         label: 'Blog'         },
  { href: '/docs',         label: 'Docs'         },
];

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
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') setMenuOpen(false); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!authenticated || !user) { setNavProfile(null); return; }
    const cacheKey = `biome_navprofile_v3_${user.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setNavProfile(JSON.parse(cached) as NavProfile); return; }

    // An account is EITHER an org (researcher) OR a participant — never both.
    // Org is the deliberate, invite-only role, so it takes precedence.
    Promise.all([
      fetch(`/api/participant-profile?privyDid=${encodeURIComponent(user.id)}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/experimenter-profile?privyDid=${encodeURIComponent(user.id)}`).then(r => r.json()).catch(() => ({})),
    ]).then(([pData, eData]: [
      { profile?: { participant_id: string; pseudonym: string } | null },
      { profile?: { id: string; org_name: string } | null },
    ]) => {
      let result: NavProfile = null;
      if (eData?.profile?.id) {
        result = { experimenter: { orgName: eData.profile.org_name, orgId: eData.profile.id } };
      } else if (pData?.profile?.participant_id) {
        result = { participant: { pseudonym: pData.profile.pseudonym, participantId: pData.profile.participant_id } };
      }
      setNavProfile(result);
      if (result) sessionStorage.setItem(cacheKey, JSON.stringify(result));
    }).catch(() => {});
  }, [authenticated, user]);

  const displayName = navProfile?.experimenter?.orgName ?? navProfile?.participant?.pseudonym ?? null;

  const truncated = displayName ? displayName.slice(0, 14) + (displayName.length > 14 ? '…' : '') : null;

  const profileHref =
    navProfile?.experimenter ? `/org/${navProfile.experimenter.orgId}`
    : navProfile?.participant ? `/profile/${navProfile.participant.participantId}`
    : null;

  return (
    <>
      <header style={{
        position:       'sticky',
        top:            0,
        zIndex:         200,
        height:         64,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        background:     'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom:   '1px solid var(--border-soft)',
        flexShrink:     0,
        paddingLeft:    'clamp(16px, 3vw, 40px)',
        paddingRight:   'clamp(16px, 3vw, 40px)',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
          <span aria-hidden="true" style={{
            width: 10, height: 10, background: 'var(--teal)',
            borderRadius: '50%', display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{
            fontFamily:    'var(--font-logo)',
            fontWeight:    700,
            fontSize:      19,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color:         'var(--ink)',
          }}>
            BIO<span style={{ color: 'var(--teal)' }}>ME</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex" style={{ alignItems: 'center', gap: 28 }}>
          {NAV_LINKS.map(({ href, label }) => (
            <NavItem key={href} href={href}>{label}</NavItem>
          ))}
        </nav>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {ready && authenticated && user && <NotificationBell privyDid={user.id} />}

          {/* Mobile hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5, padding: 8, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              {[0,1,2].map(i => (
                <span key={i} style={{ display: 'block', width: 20, height: 2, background: 'var(--ink)', borderRadius: 2 }} />
              ))}
            </button>
          </div>

          {/* Desktop auth */}
          <div className="hidden sm:flex items-center" style={{ gap: 12 }}>
            {!ready && <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>…</span>}
            {ready && !authenticated && (
              <button onClick={login} className="btn-primary" style={{ minHeight: 38, padding: '8px 18px', fontSize: 14 }}>
                Sign in
              </button>
            )}
            {ready && authenticated && (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
                    color: 'var(--ink)',
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 999,
                    padding: '8px 14px', cursor: 'pointer',
                    transition: 'border-color 150ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-soft)'; }}
                >
                  <span style={{ width: 7, height: 7, background: 'var(--teal)', borderRadius: '50%', display: 'inline-block' }} />
                  {truncated ?? 'Account'}
                  <span style={{ opacity: 0.45, fontSize: 10 }}>▾</span>
                </button>

                {dropOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                    background: 'var(--surface)', border: '1px solid var(--border-soft)',
                    borderRadius: 10,
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: 200, zIndex: 300, overflow: 'hidden',
                  }}>
                    {profileHref && <DropItem href={profileHref} onClick={() => setDropOpen(false)}>My Profile</DropItem>}
                    {navProfile?.participant && (
                      <>
                        <DropItem href="/dashboard" onClick={() => setDropOpen(false)}>Dashboard</DropItem>
                        <DropItem href="/experiments" onClick={() => setDropOpen(false)}>Browse Studies</DropItem>
                        <DropItem href="/dashboard/preferences" onClick={() => setDropOpen(false)}>Preferences</DropItem>
                      </>
                    )}
                    {navProfile?.experimenter && (
                      <>
                        {navProfile?.participant && <div style={{ borderTop: '1px solid var(--border-soft)' }} />}
                        <DropItem href="/dashboard/experiments" onClick={() => setDropOpen(false)}>Researcher Dashboard</DropItem>
                        <DropItem href="/dashboard/org" onClick={() => setDropOpen(false)}>Organization</DropItem>
                        <DropItem href="/post" onClick={() => setDropOpen(false)}>Post a Study</DropItem>
                        <DropItem href="/ome" onClick={() => setDropOpen(false)}>OME — Recruitment AI</DropItem>
                      </>
                    )}
                    {!navProfile && <DropItem href="/onboarding" onClick={() => setDropOpen(false)}>Complete Setup</DropItem>}
                    <div style={{ borderTop: '1px solid var(--border-soft)' }}>
                      <button
                        onClick={() => { setDropOpen(false); logout(); }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '12px 16px',
                          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
                          color: 'var(--muted)', background: 'none', border: 'none',
                          cursor: 'pointer', transition: 'color 150ms', minHeight: 44,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--error)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; }}
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

      {/* Mobile overlay */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: 64, padding: '0 20px',
            borderBottom: '1px solid var(--border-soft)', flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--font-logo)', fontWeight: 700, fontSize: 18, letterSpacing: '2px', color: 'var(--ink)' }}>
              BIO<span style={{ color: 'var(--teal)' }}>ME</span>
            </span>
            <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', fontSize: 22, minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', minHeight: 56, padding: '0 24px', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', textDecoration: 'none', borderBottom: '1px solid var(--border-soft)' }}>
                {label}
              </Link>
            ))}
            {ready && !authenticated && (
              <div style={{ padding: '20px 24px' }}>
                <button onClick={() => { setMenuOpen(false); login(); }} className="btn-primary" style={{ width: '100%' }}>
                  Sign in
                </button>
              </div>
            )}
            {ready && authenticated && (
              <>
                {profileHref && (
                  <Link href={profileHref} onClick={() => setMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', minHeight: 56, padding: '0 24px', fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--ink)', textDecoration: 'none', borderBottom: '1px solid var(--border-soft)' }}>
                    My Profile
                  </Link>
                )}
                {navProfile?.participant && (
                  <>
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', minHeight: 56, padding: '0 24px', fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--ink)', textDecoration: 'none', borderBottom: '1px solid var(--border-soft)' }}>
                      Dashboard
                    </Link>
                    <Link href="/experiments" onClick={() => setMenuOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', minHeight: 56, padding: '0 24px', fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--ink)', textDecoration: 'none', borderBottom: '1px solid var(--border-soft)' }}>
                      Browse Studies
                    </Link>
                  </>
                )}
                {navProfile?.experimenter && (
                  <>
                    <Link href="/dashboard/experiments" onClick={() => setMenuOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', minHeight: 56, padding: '0 24px', fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--ink)', textDecoration: 'none', borderBottom: '1px solid var(--border-soft)' }}>
                      Researcher Dashboard
                    </Link>
                    <Link href="/dashboard/org" onClick={() => setMenuOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', minHeight: 56, padding: '0 24px', fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--ink)', textDecoration: 'none', borderBottom: '1px solid var(--border-soft)' }}>
                      Organization
                    </Link>
                  </>
                )}
                <div style={{ padding: '20px 24px' }}>
                  <button onClick={() => { setMenuOpen(false); logout(); }} className="btn-secondary" style={{ width: '100%' }}>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <Link href={href} className="link-slide" style={{
      fontFamily:    'var(--font-display)',
      fontSize:      14,
      fontWeight:    500,
      color:         hover ? 'var(--teal-dark)' : 'var(--slate)',
      textDecoration: 'none',
      transition:    'color 150ms',
    }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Link>
  );
}

function DropItem({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <Link href={href} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', padding: '12px 16px', minHeight: 44,
      fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
      color: hover ? 'var(--teal-dark)' : 'var(--slate)',
      background: hover ? 'var(--teal-faint)' : 'transparent',
      textDecoration: 'none', transition: 'color 150ms, background 150ms',
    }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Link>
  );
}
