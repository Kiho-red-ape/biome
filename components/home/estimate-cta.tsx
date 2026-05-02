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
        borderTop:     '1px solid rgba(255,255,255,0.06)',
      }}
      className="px-4 sm:px-6 lg:px-10"
    >
      <div style={{
        background:   'rgba(34,211,238,0.03)',
        border:       '1px solid rgba(34,211,238,0.12)',
        borderRadius: 4,
        padding:      'clamp(32px, 5vw, 56px)',
        display:      'flex',
        flexDirection: 'column',
        gap:          24,
        position:     'relative',
        overflow:     'hidden',
      }}>
        {/* Background label */}
        <div style={{
          position:     'absolute',
          top:          -10,
          right:        24,
          fontFamily:   'var(--font-heading)',
          fontWeight:   800,
          fontSize:     120,
          lineHeight:   1,
          color:        'rgba(34,211,238,0.04)',
          pointerEvents: 'none',
          userSelect:   'none',
        }}>
          $
        </div>

        <div>
          <p style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      10,
            letterSpacing: '3px',
            color:         '#22d3ee',
            textTransform: 'uppercase',
            marginBottom:  16,
          }}>
            // GET_AN_ESTIMATE
          </p>
          <h2 style={{
            fontFamily:    'var(--font-heading)',
            fontWeight:    700,
            fontSize:      'clamp(22px, 3vw, 32px)',
            lineHeight:    1.2,
            color:         '#f2faf4',
            marginBottom:  12,
          }}>
            Know your study cost before you commit.
          </h2>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   13,
            color:      '#aab8b1',
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
              color:          hover ? '#050709' : '#22d3ee',
              background:     hover ? '#22d3ee' : 'transparent',
              border:         '1px solid #22d3ee',
              padding:        '0 28px',
              minHeight:      46,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              textDecoration: 'none',
              transition:     'background 150ms ease, color 150ms ease',
              borderRadius:   2,
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            Estimate your study →
          </Link>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5b8a9a' }}>
            Free · Takes 2 minutes · No commitment
          </span>
        </div>
      </div>
    </section>
  );
}
