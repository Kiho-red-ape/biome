'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  {
    label: 'Overview',
    href: '/docs/overview',
    children: [],
  },
  {
    label: 'For research partners',
    href: '/docs/participants',
    children: [
      { label: 'Applying to a study',      href: '/docs/participants/applying'   },
      { label: 'Your dashboard',           href: '/docs/participants/dashboard'  },
      { label: 'Milestones & sample kits', href: '/docs/participants/milestones' },
      { label: 'Compensation',             href: '/docs/participants/payouts'    },
    ],
  },
  {
    label: 'For researchers',
    href: '/docs/researchers',
    children: [
      { label: 'Setting up your study',    href: '/docs/researchers/creating-study' },
      { label: 'Launch & recruitment',     href: '/docs/researchers/publishing'     },
      { label: 'Screening applicants',     href: '/docs/researchers/screening'      },
      { label: 'Live operations',          href: '/docs/researchers/launching'      },
      { label: 'Compliance & reporting',   href: '/docs/researchers/compliance'     },
    ],
  },
  {
    label: 'Screening',
    href: '/docs/screening',
    children: [],
  },
  {
    label: 'Study lifecycle',
    href: '/docs/execution',
    children: [],
  },
  {
    label: 'Pricing & payouts',
    href: '/docs/payouts',
    children: [],
  },
  {
    label: 'Agreements',
    href: '/docs/agreements',
    children: [],
  },
];

export function DocsSidebar() {
  const path = usePathname();

  function isActive(href: string) {
    return path === href || path.startsWith(href + '/');
  }

  return (
    <nav className="w-full sm:w-56" style={{ flexShrink: 0 }}>
      {/* Back to site */}
      <Link href="/" style={{
        display: 'block', marginBottom: 28,
        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
        color: 'var(--slate)', textDecoration: 'none',
      }}>
        ← Biome
      </Link>

      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
        letterSpacing: '1.5px', textTransform: 'uppercase',
        color: 'var(--muted)', marginBottom: 14,
      }}>
        Documentation
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map((section) => {
          const sectionActive = isActive(section.href);
          return (
            <div key={section.href}>
              <Link
                href={section.href}
                style={{
                  display: 'block',
                  padding: '7px 12px',
                  fontFamily: 'var(--font-body)', fontSize: 13.5,
                  fontWeight: sectionActive ? 600 : 500,
                  textDecoration: 'none',
                  color: sectionActive ? 'var(--teal-dark)' : 'var(--slate)',
                  background: sectionActive ? 'var(--teal-soft)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {section.label}
              </Link>
              {section.children.length > 0 && sectionActive && (
                <div style={{
                  marginLeft: 12, paddingLeft: 12, paddingTop: 4, paddingBottom: 6,
                  borderLeft: '1px solid var(--border-soft)',
                }}>
                  {section.children.map((child) => {
                    const childActive = path === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        style={{
                          display: 'block',
                          padding: '5px 10px',
                          fontFamily: 'var(--font-body)', fontSize: 13,
                          fontWeight: childActive ? 600 : 400,
                          textDecoration: 'none',
                          borderRadius: 'var(--radius-xs, 6px)',
                          color: childActive ? 'var(--teal-dark)' : 'var(--slate)',
                          background: childActive ? 'var(--teal-faint)' : 'transparent',
                        }}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
