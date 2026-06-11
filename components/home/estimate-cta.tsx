'use client';

import Link from 'next/link';
import { useState } from 'react';

export function EstimateCta() {
  const [hover, setHover] = useState(false);

  return (
    <section style={{
      background:   'var(--teal-faint)',
      borderBottom: '1px solid var(--border-soft)',
    }}>
      <div
        className="section-inner"
        style={{ textAlign: 'center' }}
      >
        <h2 style={{
          fontFamily:   'var(--font-display)',
          fontSize:     'clamp(28px, 4vw, 44px)',
          fontWeight:   700,
          color:        'var(--ink)',
          marginBottom: 16,
        }}>
          Know your cost before you commit.
        </h2>
        <p style={{
          fontFamily:   'var(--font-body)',
          fontSize:     18,
          fontWeight:   500,
          color:        'var(--slate)',
          marginBottom: 40,
        }}>
          7 questions. Instant estimate.
        </p>
        <Link
          href="/estimate"
          className="btn-primary"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            transform:  hover ? 'translateY(-1px)' : 'none',
            boxShadow:  hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
            display:    'inline-flex',
          }}
        >
          Estimate your study →
        </Link>
      </div>
    </section>
  );
}
