'use client';

import { useState } from 'react';
import Link from 'next/link';

export function EstimateCta() {
  const [hover, setHover] = useState(false);

  return (
    <section
      style={{
        paddingTop:    80,
        paddingBottom: 80,
        maxWidth:      900,
        margin:        '0 auto',
        borderTop:     '1px solid rgba(248,250,252,0.06)',
      }}
      className="px-4 sm:px-6 lg:px-10"
    >
      <div style={{
        border:         '2px solid rgba(245,158,11,0.25)',
        padding:        'clamp(32px, 5vw, 56px)',
        display:        'flex',
        flexDirection:  'column',
        gap:            24,
        position:       'relative',
        overflow:       'hidden',
      }}>
        {/* Faded background number */}
        <div style={{
          position:      'absolute',
          top:           -16,
          right:         20,
          fontFamily:    'var(--font-heading)',
          fontWeight:    700,
          fontSize:      160,
          lineHeight:    1,
          color:         'rgba(245,158,11,0.04)',
          pointerEvents: 'none',
          userSelect:    'none',
        }}>
          $
        </div>

        <div>
          <p style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      10,
            letterSpacing: '3px',
            color:         '#f59e0b',
            textTransform: 'uppercase',
            marginBottom:  16,
          }}>
            Cost Estimate
          </p>
          <h2 style={{
            fontFamily:    'var(--font-heading)',
            fontWeight:    700,
            fontSize:      'clamp(22px, 3vw, 32px)',
            lineHeight:    1.2,
            color:         '#f8fafc',
            marginBottom:  12,
          }}>
            Know your study cost before you commit.
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize:   14,
            color:      '#94a3b8',
            lineHeight: 1.7,
            maxWidth:   520,
          }}>
            Answer 7 questions about your study — recruitment target, sample types, geography, timeline.
            Get an itemized cost estimate in under 2 minutes. No sales call required.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <Link
            href="/estimate"
            style={{
              fontFamily:     'var(--font-mono)',
              fontSize:       12,
              letterSpacing:  '1.5px',
              textTransform:  'uppercase',
              color:          hover ? '#060a14' : '#f59e0b',
              background:     hover ? '#f59e0b' : 'transparent',
              border:         '2px solid #f59e0b',
              padding:        '0 28px',
              minHeight:      46,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              textDecoration: 'none',
              transition:     'background 150ms ease, color 150ms ease',
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            Estimate your study →
          </Link>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#475569', letterSpacing: '0.5px' }}>
            Free · 2 minutes · No commitment
          </span>
        </div>
      </div>
    </section>
  );
}
