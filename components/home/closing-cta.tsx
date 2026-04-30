'use client';

import { useState } from 'react';
import Link from 'next/link';

export function ClosingCta() {
  const [hover, setHover] = useState(false);

  return (
    <section
      style={{
        paddingTop:    96,
        paddingBottom: 96,
        maxWidth:      700,
        margin:        '0 auto',
        textAlign:     'center',
        borderTop:     '1px solid rgba(255,255,255,0.06)',
      }}
      className="px-4 sm:px-6 lg:px-10"
    >
      <p style={{
        fontFamily:  'var(--font-mono)',
        fontSize:    'clamp(13px, 1.4vw, 16px)',
        color:       '#aab8b1',
        lineHeight:  1.8,
        marginBottom: 36,
        letterSpacing: '0.3px',
      }}>
        If you&apos;re running a study that doesn&apos;t need a CRO,<br className="hidden sm:block" />
        we should talk.
      </p>

      <div
        className="flex flex-col sm:flex-row"
        style={{ gap: 16, justifyContent: 'center', alignItems: 'center' }}
      >
        <Link
          href="/intake"
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      12,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color:         hover ? '#050709' : '#b7ff61',
            background:    hover ? '#b7ff61' : 'transparent',
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
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          Book a call →
        </Link>
        <a
          href="mailto:kishore@biome.to"
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      13,
            color:         '#4a6050',
            textDecoration: 'none',
            letterSpacing: '0.3px',
            transition:    'color 150ms ease',
          }}
          onMouseEnter={(e) => { (e.target as HTMLAnchorElement).style.color = '#aab8b1'; }}
          onMouseLeave={(e) => { (e.target as HTMLAnchorElement).style.color = '#4a6050'; }}
        >
          kishore@biome.to
        </a>
      </div>
    </section>
  );
}
