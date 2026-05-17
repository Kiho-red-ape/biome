'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const OPERATOR_EMAILS = ['kishore@biome.to', 'hello@biome.to'];

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
  { label: 'Demo Seed', href: '/ops/demo-seed' },
];

function SidebarLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/ops' && pathname.startsWith(href.split('?')[0]));
  return (
    <Link
      href={href}
      style={{
        display:        'block',
        padding:        '5px 16px 5px 12px',
        fontFamily:     'var(--font-mono)',
        fontSize:       11,
        letterSpacing:  '0.5px',
        color:          isActive ? '#ffb300' : '#7f8e87',
        background:     isActive ? 'rgba(255,179,0,0.06)' : 'transparent',
        textDecoration: 'none',
        borderLeft:     `2px solid ${isActive ? '#ffb300' : 'transparent'}`,
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

  const userEmail = user?.email?.address ?? null;
  const isAuthorized = authenticated && !!userEmail && OPERATOR_EMAILS.includes(userEmail);

  useEffect(() => {
    if (ready && (!authenticated || (userEmail && !OPERATOR_EMAILS.includes(userEmail)))) {
      router.replace('/');
    }
  }, [ready, authenticated, userEmail, router]);

  // Live UTC clock
  useEffect(() => {
    const tick = () => setTime(new Date().toUTCString().slice(17, 25) + ' UTC');
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!ready || !isAuthorized) {
    return (
      <div style={{ minHeight: '100vh', background: '#050709', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5b8a9a' }}>…</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#050709' }}>
      {/* Top bar */}
      <div style={{
        height:      44,
        display:     'flex',
        alignItems:  'center',
        justifyContent: 'space-between',
        padding:     '0 20px',
        background:  '#0b0e0b',
        borderBottom: '1px solid rgba(255,179,0,0.15)',
        flexShrink:  0,
        gap:         16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      10,
            letterSpacing: '3px',
            color:         '#ffb300',
            textTransform: 'uppercase',
          }}>
            ◆ OPERATOR MODE
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5b8a9a' }}>
            {userEmail}
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5b8a9a' }}>
          {time}
        </span>
      </div>

      {/* Body: sidebar + content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <nav style={{
          width:       240,
          flexShrink:  0,
          background:  '#080b08',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          overflowY:   'auto',
          padding:     '16px 0',
        }}>
          <p style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      9,
            letterSpacing: '3px',
            color:         '#ffb300',
            textTransform: 'uppercase',
            padding:       '0 16px',
            marginBottom:  12,
          }}>
            // OPERATOR_CONSOLE
          </p>

          {NAV.map((section) => (
            <div key={section.href} style={{ marginBottom: 4 }}>
              <SidebarLink href={section.href} label={`◆ ${section.label}`} />
              {section.children?.map((child) => (
                <SidebarLink key={child.href} href={child.href} label={`  ${child.label}`} />
              ))}
            </div>
          ))}

          {/* Divider + back to site */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '16px 0' }} />
          <Link
            href="/"
            style={{
              display:       'block',
              padding:       '5px 16px',
              fontFamily:    'var(--font-mono)',
              fontSize:      10,
              color:         '#5b8a9a',
              textDecoration: 'none',
              letterSpacing: '0.5px',
            }}
          >
            ← back to site
          </Link>
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
