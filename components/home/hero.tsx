'use client';

import { useState } from 'react';
import Link from 'next/link';

export function HomeHero() {
  const [hoverRun,         setHoverRun]         = useState(false);
  const [hoverParticipate, setHoverParticipate] = useState(false);

  return (
    <section
      style={{
        paddingTop:    'clamp(64px, 10vh, 120px)',
        paddingBottom: 'clamp(64px, 10vh, 120px)',
        maxWidth:      900,
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
        color:         '#b7ff61',
        textTransform: 'uppercase',
        marginBottom:  20,
        lineHeight:    1,
      }}>
        // OPERATIONS_LAYER
      </p>

      {/* Headline */}
      <h1 style={{
        fontFamily:    'var(--font-heading)',
        fontWeight:    700,
        fontSize:      'clamp(28px, 4.5vw, 48px)',
        lineHeight:    1.12,
        marginBottom:  0,
        letterSpacing: '-0.01em',
      }}>
        <span style={{ color: '#f2faf4', display: 'block' }}>The operations layer</span>
        <span style={{ color: '#22d3ee', display: 'block' }}>for decentralized human studies.</span>
      </h1>

      {/* Subtext */}
      <p style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      'clamp(12px, 1.4vw, 14px)',
        color:         '#aab8b1',
        letterSpacing: '0.5px',
        lineHeight:    1.7,
        marginTop:     24,
        marginBottom:  36,
        maxWidth:      600,
      }}>
        Recruitment. Sample logistics. Compliance. Payouts.<br />
        Protocol to data, without a CRO.
      </p>

      {/* CTAs */}
      <div
        className="flex flex-col sm:flex-row"
        style={{ gap: 12 }}
      >
        <Link
          href="/run-a-study"
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      12,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color:         hoverRun ? '#050709' : '#b7ff61',
            background:    hoverRun ? '#b7ff61' : 'transparent',
            border:        '1px solid #b7ff61',
            padding:       '0 28px',
            minHeight:     46,
            display:       'flex',
            alignItems:    'center',
            justifyContent: 'center',
            textDecoration: 'none',
            transition:    'background 150ms ease, color 150ms ease',
            borderRadius:  2,
          }}
          onMouseEnter={() => setHoverRun(true)}
          onMouseLeave={() => setHoverRun(false)}
        >
          Run a study
        </Link>
        <Link
          href="/participate"
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      12,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color:         hoverParticipate ? '#22d3ee' : '#aab8b1',
            background:    'transparent',
            border:        `1px solid ${hoverParticipate ? '#22d3ee' : 'rgba(255,255,255,0.15)'}`,
            padding:       '0 28px',
            minHeight:     46,
            display:       'flex',
            alignItems:    'center',
            justifyContent: 'center',
            textDecoration: 'none',
            transition:    'border-color 150ms ease, color 150ms ease',
            borderRadius:  2,
          }}
          onMouseEnter={() => setHoverParticipate(true)}
          onMouseLeave={() => setHoverParticipate(false)}
        >
          Participate in research
        </Link>
      </div>
    </section>
  );
}
