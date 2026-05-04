'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  {
    label: '// OVERVIEW',
    href: '/docs/overview',
    children: [],
  },
  {
    label: '// FOR PARTICIPANTS',
    href: '/docs/participants',
    children: [
      { label: 'Applying to a study',     href: '/docs/participants/applying'    },
      { label: 'Your dashboard',          href: '/docs/participants/dashboard'   },
      { label: 'Milestones & compliance', href: '/docs/participants/milestones'  },
      { label: 'Payouts',                 href: '/docs/participants/payouts'     },
    ],
  },
  {
    label: '// FOR RESEARCHERS',
    href: '/docs/researchers',
    children: [
      { label: 'Creating a study',        href: '/docs/researchers/creating-study' },
      { label: 'Publishing & recruitment',href: '/docs/researchers/publishing'     },
      { label: 'Screening applicants',    href: '/docs/researchers/screening'      },
      { label: 'Launching a study',       href: '/docs/researchers/launching'      },
      { label: 'Compliance & verification',href: '/docs/researchers/compliance'    },
      { label: 'Budget estimator',         href: '/docs/researchers/budget-estimator' },
    ],
  },
  {
    label: '// SCREENING',
    href: '/docs/screening',
    children: [],
  },
  {
    label: '// STUDY LIFECYCLE',
    href: '/docs/execution',
    children: [],
  },
  {
    label: '// PAYOUTS & FEES',
    href: '/docs/payouts',
    children: [],
  },
  {
    label: '// AGREEMENTS',
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
    <nav className="w-full sm:w-52" style={{ flexShrink: 0 }}>
      {/* Back to site */}
      <Link href="/" style={{
        display: 'block', marginBottom: 28,
        fontFamily: 'var(--font-mono)', fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '2px',
        color: '#4a7055', textDecoration: 'none',
      }}>
        ← BIOME
      </Link>

      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        letterSpacing: '3px', textTransform: 'uppercase',
        color: '#4a7055', marginBottom: 16,
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
                  padding: '6px 10px',
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  letterSpacing: '1.5px', textTransform: 'uppercase',
                  textDecoration: 'none',
                  color: sectionActive ? 'var(--green)' : '#4a7055',
                  background: sectionActive ? 'rgba(77,255,128,0.06)' : 'transparent',
                  borderRadius: 2,
                  borderLeft: sectionActive ? '2px solid var(--green)' : '2px solid transparent',
                }}
              >
                {section.label}
              </Link>
              {section.children.length > 0 && sectionActive && (
                <div style={{ paddingLeft: 12, paddingTop: 2, paddingBottom: 4 }}>
                  {section.children.map((child) => {
                    const childActive = path === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        style={{
                          display: 'block',
                          padding: '5px 10px',
                          fontFamily: 'var(--font-heading)', fontSize: 12,
                          textDecoration: 'none',
                          color: childActive ? 'var(--text-bright)' : 'var(--text-dim)',
                          borderLeft: `1px solid ${childActive ? 'rgba(77,255,128,0.4)' : 'rgba(77,255,128,0.1)'}`,
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
