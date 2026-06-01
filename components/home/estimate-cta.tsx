'use client';

import Link from 'next/link';
import { useState } from 'react';

export function EstimateCta() {
  const [hover, setHover] = useState(false);

  return (
    <section style={{
      background:   'var(--amber)',
      borderBottom: '3px solid var(--black)',
    }}>
      <div
        className="section-inner"
        style={{ textAlign: 'center' }}
      >
        <h2 style={{
          fontFamily:   'var(--font-display)',
          fontSize:     'clamp(28px, 4vw, 44px)',
          fontWeight:   700,
          color:        'var(--black)',
          marginBottom: 16,
        }}>
          Know your cost before you commit.
        </h2>
        <p style={{
          fontFamily:   'var(--font-body)',
          fontSize:     18,
          fontWeight:   500,
          color:        'rgba(0,0,0,0.7)',
          marginBottom: 40,
        }}>
          7 questions. Instant estimate.
        </p>
        <Link
          href="/estimate"
          className="btn-black"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            transform:  hover ? 'translate(-2px,-2px)' : 'none',
            boxShadow:  hover ? '6px 6px 0 rgba(0,0,0,0.3)' : '4px 4px 0 rgba(0,0,0,0.3)',
            display:    'inline-flex',
          }}
        >
          Estimate your study →
        </Link>
      </div>
    </section>
  );
}
