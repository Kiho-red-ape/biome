'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const NAV: { label: string; href: string; children?: { label: string; href: string }[] }[] = [
  { label: 'Overview',   href: '/ops' },
  {
    label: 'Studies', href: '/ops/studies',
    children: [
      { label: 'All studies',  href: '/ops/studies' },
      { label: 'Pipeline',     href: '/ops/studies/pipeline' },
    ],
  },
  {
    label: 'Participants', href: '/ops/participants',
    children: [
      { label: 'All profiles', href: '/ops/participants' },
      { label: 'Verified',     href: '/ops/participants?filter=verified' },
      { label: 'Flagged',      href: '/ops/participants?filter=flagged' },
    ],
  },
  {
    label: 'Sample Logistics', href: '/ops/logistics',
    children: [
      { label: 'All kits',           href: '/ops/logistics' },
      { label: 'Pending shipment',   href: '/ops/logistics?status=pending' },
      { label: 'Awaiting collection', href: '/ops/logistics?status=awaiting' },
      { label: 'In transit to lab',  href: '/ops/logistics?status=in_transit' },
      { label: 'Overdue',            href: '/ops/logistics?status=overdue' },
    ],
  },
  {
    label: 'Payouts', href: '/ops/payouts',
    children: [
      { label: 'Pending',    href: '/ops/payouts?status=pending' },
      { label: 'Processing', href: '/ops/payouts?status=processing' },
      { label: 'Completed',  href: '/ops/payouts?status=paid' },
    ],
  },
  {
    label: 'Partners', href: '/ops/partners',
    children: [
      { label: 'Applications', href: '/ops/partners' },
      { label: 'Approved',     href: '/ops/partners?status=approved' },
    ],
  },
  {
    label: 'Client Intakes', href: '/ops/intakes',
    children: [
      { label: 'New',       href: '/ops/intakes' },
      { label: 'Qualified', href: '/ops/intakes?status=qualified' },
      { label: 'Declined',  href: '/ops/intakes?status=declined' },
    ],
  },
  {
    label: 'Compliance', href: '/ops/compliance',
    children: [
      { label: 'Consent audit',    href: '/ops/compliance' },
      { label: 'Communication log', href: '/ops/compliance?tab=comms' },
      { label: 'Export',           href: '/ops/compliance?tab=export' },
    ],
  },
  {
    label: 'Estimate Leads', href: '/ops/estimate-leads',
  },
  {
    label: 'Researcher Approvals', href: '/ops/researchers',
  },
  {
    label: 'Notifications', href: '/ops/notifications',
  },
  {
    label: 'Blog', href: '/ops/blog',
    children: [
      { label: 'All posts',   href: '/ops/blog' },
      { label: 'New post',    href: '/ops/blog/new' },
    ],
  },
  { label: 'Reports', href: '/ops/reports' },
  { label: 'Demo Seed',  href: '/ops/demo-seed' },
  { label: 'Team & Admins', href: '/ops/admins' },
];

function SidebarLink({ href, label, child }: { href: string; label: string; child?: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/ops' && pathname.startsWith(href.split('?')[0]));
  return (
    <Link
      href={href}
      style={{
        display:        'block',
        padding:        child ? '6px 16px 6px 30px' : '7px 16px',
        fontFamily:     child ? 'var(--font-body)' : 'var(--font-mono)',
        fontSize:       child ? 12 : 12,
        fontWeight:     isActive ? 600 : child ? 400 : 500,
        letterSpacing:  child ? 0 : '0.3px',
        color:          isActive ? 'var(--teal-dark)' : 'var(--slate)',
        background:     isActive ? 'var(--teal-soft)' : 'transparent',
        textDecoration: 'none',
        borderLeft:     `3px solid ${isActive ? 'var(--teal)' : 'transparent'}`,
        transition:     'color 100ms, background 100ms',
        whiteSpace:     'nowrap',
        overflow:       'hidden',
        textOverflow:   'ellipsis',
      }}
    >
      {label}
    </Link>
  );
}

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [time, setTime] = useState('');
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const userEmail = user?.email?.address ?? null;

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user?.id) {
      router.replace('/');
      return;
    }
    fetch(`/api/ops/me?privyDid=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((d: { is_admin: boolean }) => {
        if (d.is_admin) {
          setIsAdmin(true);
          setAdminChecked(true);
        } else {
          router.replace('/');
        }
      })
      .catch(() => router.replace('/'));
  }, [ready, authenticated, user?.id, router]);

  // Live UTC clock
  useEffect(() => {
    const tick = () => setTime(new Date().toUTCString().slice(17, 25) + ' UTC');
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!adminChecked || !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>Verifying access…</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      {/* Top bar */}
      <div style={{
        height:      52,
        display:     'flex',
        alignItems:  'center',
        justifyContent: 'space-between',
        padding:     '0 24px',
        background:  'var(--surface)',
        borderBottom: '1px solid var(--border-soft)',
        flexShrink:  0,
        gap:         16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
            Biome <span style={{ color: 'var(--teal)' }}>Ops</span>
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '1px',
            textTransform: 'uppercase', color: 'var(--teal-dark)', background: 'var(--teal-soft)',
            padding: '3px 8px', borderRadius: 4,
          }}>
            Operator
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)' }}>
            {userEmail}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
            {time}
          </span>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <nav style={{
          width:       236,
          flexShrink:  0,
          background:  'var(--surface)',
          borderRight: '1px solid var(--border-soft)',
          overflowY:   'auto',
          padding:     '16px 0',
        }}>
          <p style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      9,
            letterSpacing: '2px',
            color:         'var(--muted)',
            textTransform: 'uppercase',
            padding:       '0 16px',
            marginBottom:  10,
          }}>
            Console
          </p>

          {NAV.map((section) => (
            <div key={section.href} style={{ marginBottom: 2 }}>
              <SidebarLink href={section.href} label={section.label} />
              {section.children?.map((child) => (
                <SidebarLink key={child.href} href={child.href} label={child.label} child />
              ))}
            </div>
          ))}

          {/* Divider + back to site */}
          <div style={{ borderTop: '1px solid var(--border-soft)', margin: '14px 0' }} />
          <Link
            href="/"
            style={{
              display:       'block',
              padding:       '7px 16px',
              fontFamily:    'var(--font-mono)',
              fontSize:      11,
              color:         'var(--muted)',
              textDecoration: 'none',
              letterSpacing: '0.3px',
            }}
          >
            ← Back to site
          </Link>
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
