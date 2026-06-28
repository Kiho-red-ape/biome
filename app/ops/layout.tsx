'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// ─── NAV STRUCTURE ───────────────────────────────────────────
interface NavItem  { label: string; href: string; badge?: string }
interface NavGroup { id: string; label: string; items: NavItem[] }

const GROUPS: NavGroup[] = [
  {
    id: 'pipeline', label: 'Pipeline',
    items: [
      { label: 'Client intakes',  href: '/ops/intakes',        badge: 'newIntakes'        },
      { label: 'Estimate leads',  href: '/ops/estimate-leads', badge: 'uncontactedLeads'  },
      { label: 'Partner apps',    href: '/ops/partners',       badge: 'pendingPartners'   },
    ],
  },
  {
    id: 'studies', label: 'Studies',
    items: [
      { label: 'All studies',    href: '/ops/studies'          },
      { label: 'Study pipeline', href: '/ops/studies/pipeline' },
    ],
  },
  {
    id: 'people', label: 'People',
    items: [
      { label: 'Participants',           href: '/ops/participants'                   },
      { label: 'Agent',                  href: '/ops/participants-agent'             },
      { label: 'Experimenter approvals', href: '/ops/researchers', badge: 'pendingApprovals' },
      { label: 'Flagged accounts',       href: '/ops/participants?filter=flagged'    },
    ],
  },
  {
    id: 'operations', label: 'Operations',
    items: [
      { label: 'Launch Requests',  href: '/ops/launch-requests'                        },
      { label: 'Recruitment',      href: '/ops/recruitment'                            },
      { label: 'Sample logistics', href: '/ops/logistics'                              },
      { label: 'Payouts',          href: '/ops/payouts',    badge: 'pendingPayoutCount' },
      { label: 'Compliance',       href: '/ops/compliance'                             },
    ],
  },
  {
    id: 'content', label: 'Content',
    items: [
      { label: 'Blog',            href: '/ops/blog'    },
      { label: 'Sponsor reports', href: '/ops/reports' },
    ],
  },
  {
    id: 'comms', label: 'Comms',
    items: [
      { label: 'Notifications', href: '/ops/notifications' },
    ],
  },
  {
    id: 'admin', label: 'Admin',
    items: [
      { label: 'Team & Admins', href: '/ops/admins'    },
      { label: 'Demo seed',     href: '/ops/demo-seed' },
    ],
  },
];

// ─── BREADCRUMB MAP ──────────────────────────────────────────
const BC: Record<string, [string, string]> = {
  '/ops':                  ['', 'Dashboard'],
  '/ops/intakes':          ['Pipeline', 'Client intakes'],
  '/ops/estimate-leads':   ['Pipeline', 'Estimate leads'],
  '/ops/partners':         ['Pipeline', 'Partner apps'],
  '/ops/studies':          ['Studies', 'All studies'],
  '/ops/studies/pipeline': ['Studies', 'Study pipeline'],
  '/ops/participants':       ['People', 'Participants'],
  '/ops/participants-agent': ['People', 'Agent'],
  '/ops/researchers':      ['People', 'Experimenter approvals'],
  '/ops/launch-requests':  ['Operations', 'Launch Requests'],
  '/ops/recruitment':      ['Operations', 'Recruitment'],
  '/ops/logistics':        ['Operations', 'Sample logistics'],
  '/ops/payouts':          ['Operations', 'Payouts'],
  '/ops/compliance':       ['Operations', 'Compliance'],
  '/ops/blog':             ['Content', 'Blog'],
  '/ops/blog/new':         ['Content', 'New post'],
  '/ops/reports':          ['Content', 'Sponsor reports'],
  '/ops/notifications':    ['Comms', 'Notifications'],
  '/ops/admins':           ['Admin', 'Team & Admins'],
  '/ops/demo-seed':        ['Admin', 'Demo seed'],
};

function getBreadcrumb(pathname: string): [string, string] {
  if (BC[pathname]) return BC[pathname];
  if (pathname.startsWith('/ops/blog/') && pathname.endsWith('/edit')) return ['Content', 'Edit post'];
  const segment = pathname.split('/').pop() ?? '';
  return ['', segment.charAt(0).toUpperCase() + segment.slice(1)];
}

function isActive(itemHref: string, pathname: string): boolean {
  const itemPath = itemHref.split('?')[0];
  if (itemPath === '/ops') return pathname === '/ops';
  return pathname === itemPath || pathname.startsWith(itemPath + '/');
}

// ─── BADGE PILL ──────────────────────────────────────────────
function Badge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      justifyContent: 'center',
      minWidth:       16,
      height:         16,
      borderRadius:   8,
      background:     'var(--teal)',
      color:          '#fff',
      fontFamily:     'var(--font-mono)',
      fontSize:       9,
      fontWeight:     700,
      padding:        '0 4px',
      marginLeft:     6,
      lineHeight:     1,
      flexShrink:     0,
    }}>
      {n > 99 ? '99+' : n}
    </span>
  );
}

// ─── LAYOUT ──────────────────────────────────────────────────
export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user } = usePrivy();
  const router   = useRouter();
  const pathname = usePathname();

  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin,      setIsAdmin]      = useState(false);
  const [isMobile,     setIsMobile]     = useState(false);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [expanded,     setExpanded]     = useState<Record<string, boolean>>(
    Object.fromEntries(GROUPS.map(g => [g.id, true]))
  );
  const [badges, setBadges] = useState<Record<string, number>>({});

  const userEmail = user?.email?.address ?? null;

  // Auth check
  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user?.id) { router.replace('/'); return; }
    fetch(`/api/ops/me?privyDid=${encodeURIComponent(user.id)}`)
      .then(r => r.json())
      .then((d: { is_admin: boolean }) => {
        if (d.is_admin) { setIsAdmin(true); setAdminChecked(true); }
        else router.replace('/');
      })
      .catch(() => router.replace('/'));
  }, [ready, authenticated, user?.id, router]);

  // Responsive detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Badge counts — fetch once after auth
  useEffect(() => {
    if (!adminChecked) return;
    fetch('/api/ops/dashboard-stats')
      .then(r => r.json())
      .then((d: Record<string, number>) => setBadges(d))
      .catch(() => {});
  }, [adminChecked]);

  function toggleGroup(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const crumb = getBreadcrumb(pathname);

  if (!adminChecked || !isAdmin) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-page)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
          Verifying access…
        </span>
      </div>
    );
  }

  // ─── SIDEBAR CONTENT ────────────────────────────────────────
  const sidebar = (
    <nav style={{
      width:         240,
      background:    'var(--surface)',
      borderRight:   '1px solid var(--border-soft)',
      display:       'flex',
      flexDirection: 'column',
      height:        '100%',
      overflowY:     'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid var(--border-soft)', flexShrink: 0 }}>
        <Link href="/ops" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ color: 'var(--teal)', fontSize: 14 }}>◆</span>
          <span style={{
            fontFamily:    'var(--font-logo)',
            fontSize:      13,
            fontWeight:    700,
            letterSpacing: '-0.01em',
            color:         'var(--ink)',
          }}>
            BIOME <span style={{ color: 'var(--teal)' }}>OPS</span>
          </span>
        </Link>
      </div>

      {/* Home link */}
      <div style={{ flexShrink: 0, paddingTop: 6 }}>
        <Link href="/ops" style={{
          display:        'flex',
          alignItems:     'center',
          gap:            8,
          padding:        '8px 16px',
          fontFamily:     'var(--font-body)',
          fontSize:       13,
          fontWeight:     pathname === '/ops' ? 600 : 400,
          color:          pathname === '/ops' ? 'var(--teal-dark)' : 'var(--slate)',
          borderLeft:     `3px solid ${pathname === '/ops' ? 'var(--teal)' : 'transparent'}`,
          background:     pathname === '/ops' ? 'var(--teal-soft)' : 'transparent',
          textDecoration: 'none',
          transition:     'color 100ms, background 100ms',
        }}>
          <span style={{ fontSize: 13 }}>⌂</span>
          Home
        </Link>
        <div style={{ borderBottom: '1px solid var(--border-soft)', margin: '6px 0 4px' }} />
      </div>

      {/* Groups */}
      <div style={{ flex: 1 }}>
        {GROUPS.map(group => (
          <div key={group.id} style={{ marginBottom: 2 }}>
            <button
              onClick={() => toggleGroup(group.id)}
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                width:          '100%',
                padding:        '6px 16px 5px',
                background:     'transparent',
                border:         'none',
                cursor:         'pointer',
                fontFamily:     'var(--font-mono)',
                fontSize:       9,
                fontWeight:     700,
                letterSpacing:  '1.5px',
                textTransform:  'uppercase',
                color:          'var(--teal)',
              }}
            >
              <span>{group.label}</span>
              <span style={{ fontSize: 9, color: 'var(--muted)' }}>
                {expanded[group.id] ? '▾' : '▸'}
              </span>
            </button>

            {expanded[group.id] && group.items.map(item => {
              const active     = isActive(item.href, pathname);
              const badgeCount = item.badge ? (badges[item.badge] ?? 0) : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    padding:        '7px 14px 7px 24px',
                    fontFamily:     'var(--font-body)',
                    fontSize:       13,
                    fontWeight:     active ? 600 : 400,
                    color:          active ? 'var(--teal-dark)' : 'var(--slate)',
                    borderLeft:     `3px solid ${active ? 'var(--teal)' : 'transparent'}`,
                    background:     active ? 'var(--teal-soft)' : 'transparent',
                    textDecoration: 'none',
                    transition:     'color 100ms, background 100ms',
                    whiteSpace:     'nowrap',
                    overflow:       'hidden',
                    textOverflow:   'ellipsis',
                  }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                  {badgeCount > 0 && <Badge n={badgeCount} />}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-soft)', padding: '8px 0' }}>
        <Link href="/" style={{
          display:        'block',
          padding:        '7px 16px',
          fontFamily:     'var(--font-mono)',
          fontSize:       11,
          color:          'var(--muted)',
          textDecoration: 'none',
        }}>
          ← Back to site
        </Link>
      </div>
    </nav>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-page)', overflow: 'hidden' }}>

      {/* Mobile backdrop */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15,23,42,0.35)',
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar */}
      {isMobile ? (
        <div style={{
          position:   'fixed',
          top:        0,
          left:       drawerOpen ? 0 : -240,
          width:      240,
          height:     '100vh',
          zIndex:     50,
          transition: 'left 250ms cubic-bezier(0.4,0,0.2,1)',
          boxShadow:  drawerOpen ? 'var(--shadow-lg)' : 'none',
        }}>
          {sidebar}
        </div>
      ) : (
        <div style={{ width: 240, flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}>
          {sidebar}
        </div>
      )}

      {/* Right panel */}
      <div style={{
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        minWidth:      0,
        height:        '100vh',
        overflow:      'hidden',
      }}>
        {/* Top bar */}
        <div style={{
          height:         48,
          flexShrink:     0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '0 24px',
          background:     'var(--surface)',
          borderBottom:   '1px solid var(--border-soft)',
          gap:            12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {isMobile && (
              <button
                onClick={() => setDrawerOpen(true)}
                style={{
                  background: 'transparent', border: 'none',
                  color: 'var(--slate)', fontSize: 18, cursor: 'pointer',
                  padding: '0 4px', flexShrink: 0, lineHeight: 1,
                }}
              >
                ☰
              </button>
            )}
            {/* Breadcrumb */}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              {crumb[0] && (
                <>
                  <span>{crumb[0]}</span>
                  <span style={{ margin: '0 6px', opacity: 0.5 }}>/</span>
                </>
              )}
              <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{crumb[1]}</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <span style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      9,
              fontWeight:    700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color:         'var(--teal-dark)',
              background:    'var(--teal-soft)',
              border:        '1px solid rgba(14,116,144,0.2)',
              padding:       '3px 8px',
              borderRadius:  'var(--radius-xs)',
            }}>
              Operator
            </span>
            {!isMobile && userEmail && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                {userEmail}
              </span>
            )}
          </div>
        </div>

        {/* Main scrollable content */}
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-page)' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 36px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
