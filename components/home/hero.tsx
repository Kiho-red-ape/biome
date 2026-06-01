'use client';

import { useState } from 'react';
import Link from 'next/link';

const STATS = [
  { value: '< 30 days', label: 'Protocol to live' },
  { value: '1,000+',    label: 'Verified partners' },
  { value: '5',         label: 'Sample types' },
  { value: '3',         label: 'Active geographies' },
];

export function HomeHero() {
  const [hoverRun,         setHoverRun]         = useState(false);
  const [hoverParticipate, setHoverParticipate] = useState(false);

  return (
    <section
      style={{
        paddingTop:    'clamp(64px, 10vh, 112px)',
        paddingBottom: 'clamp(64px, 10vh, 112px)',
        maxWidth:      1100,
        margin:        '0 auto',
        position:      'relative',
        zIndex:        2,
      }}
      className="px-4 sm:px-6 lg:px-10"
    >
      {/* Eyebrow */}
      <p style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      10,
        letterSpacing: '3px',
        color:         '#f59e0b',
        textTransform: 'uppercase',
        marginBottom:  24,
        lineHeight:    1,
      }}>
        Clinical Operations Platform
      </p>

      {/* Headline */}
      <h1 style={{
        fontFamily:    'var(--font-heading)',
        fontWeight:    700,
        fontSize:      'clamp(32px, 5vw, 60px)',
        lineHeight:    1.05,
        marginBottom:  0,
        letterSpacing: '-0.02em',
        maxWidth:      760,
      }}>
        <span style={{ color: '#f8fafc', display: 'block' }}>The operations layer</span>
        <span style={{ color: '#f59e0b', display: 'block' }}>for human studies.</span>
      </h1>

      {/* Subhead */}
      <p style={{
        fontFamily:    'var(--font-body)',
        fontSize:      'clamp(15px, 1.6vw, 17px)',
        color:         '#94a3b8',
        lineHeight:    1.75,
        marginTop:     24,
        marginBottom:  40,
        maxWidth:      520,
      }}>
        Recruitment. Sample logistics. Compliance. Payouts.
        Protocol to data, without a CRO.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row" style={{ gap: 12, marginBottom: 72 }}>
        <Link
          href="/run-a-study"
          style={{
            fontFamily:     'var(--font-mono)',
            fontSize:       12,
            letterSpacing:  '1.5px',
            textTransform:  'uppercase',
            color:          hoverRun ? '#060a14' : '#f59e0b',
            background:     hoverRun ? '#f59e0b' : 'transparent',
            border:         '2px solid #f59e0b',
            padding:        '0 28px',
            minHeight:      48,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            textDecoration: 'none',
            transition:     'background 150ms ease, color 150ms ease',
          }}
          onMouseEnter={() => setHoverRun(true)}
          onMouseLeave={() => setHoverRun(false)}
        >
          Run a study →
        </Link>
        <Link
          href="/onboarding?role=participant"
          style={{
            fontFamily:     'var(--font-mono)',
            fontSize:       12,
            letterSpacing:  '1.5px',
            textTransform:  'uppercase',
            color:          hoverParticipate ? '#f8fafc' : '#64748b',
            background:     'transparent',
            border:         `2px solid ${hoverParticipate ? 'rgba(248,250,252,0.3)' : 'rgba(248,250,252,0.12)'}`,
            padding:        '0 28px',
            minHeight:      48,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            textDecoration: 'none',
            transition:     'border-color 150ms ease, color 150ms ease',
          }}
          onMouseEnter={() => setHoverParticipate(true)}
          onMouseLeave={() => setHoverParticipate(false)}
        >
          Participate in research
        </Link>
      </div>

      {/* Stats row */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap:                 1,
        borderTop:           '1px solid rgba(248,250,252,0.07)',
        borderLeft:          '1px solid rgba(248,250,252,0.07)',
      }}>
        {STATS.map((s) => (
          <div key={s.label} style={{
            padding:     '24px 20px',
            borderRight: '1px solid rgba(248,250,252,0.07)',
            borderBottom: '1px solid rgba(248,250,252,0.07)',
          }}>
            <p style={{
              fontFamily:  'var(--font-heading)',
              fontWeight:  700,
              fontSize:    'clamp(20px, 2.5vw, 28px)',
              color:       '#f59e0b',
              marginBottom: 4,
              lineHeight:  1,
            }}>
              {s.value}
            </p>
            <p style={{
              fontFamily:  'var(--font-mono)',
              fontSize:    10,
              color:       '#475569',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              margin:      0,
            }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
