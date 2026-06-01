'use client';

import { useState } from 'react';
import Link from 'next/link';

function HeroGeometry() {
  return (
    <svg viewBox="0 0 500 500" style={{ width: '100%', height: 'auto', maxWidth: 480 }}>
      {/* Large circle — outline only */}
      <circle cx="260" cy="240" r="180" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" />
      {/* Amber block — solid, offset */}
      <rect x="80" y="80" width="180" height="180" fill="rgba(245,158,11,0.55)" />
      {/* White outline rectangle — overlapping */}
      <rect x="200" y="160" width="220" height="200" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
      {/* Small amber square — bottom right accent */}
      <rect x="340" y="340" width="80" height="80" fill="rgba(245,158,11,0.8)" />
      {/* Horizontal lines — grid feel */}
      <line x1="80" y1="320" x2="420" y2="320" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      <line x1="80" y1="350" x2="320" y2="350" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      {/* Dot grid cluster */}
      {[0,1,2,3,4].flatMap(row =>
        [0,1,2,3,4].map(col => (
          <circle
            key={`${row}-${col}`}
            cx={360 + col * 16}
            cy={160 + row * 16}
            r="2"
            fill="rgba(255,255,255,0.2)"
          />
        ))
      )}
      {/* Inner circle detail */}
      <circle cx="170" cy="170" r="60" fill="none" stroke="rgba(245,158,11,0.4)" strokeWidth="1.5" strokeDasharray="8 4" />
    </svg>
  );
}

export function HomeHero() {
  const [hoverRun, setHoverRun] = useState(false);

  return (
    <section
      style={{
        background:  'var(--navy)',
        minHeight:   '90vh',
        display:     'flex',
        alignItems:  'center',
        borderBottom: '3px solid var(--black)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin:   '0 auto',
          padding:  'clamp(60px, 10vh, 100px) 24px',
          width:    '100%',
          display:  'grid',
          gridTemplateColumns: 'minmax(0, 55%) minmax(0, 45%)',
          gap:      64,
          alignItems: 'center',
        }}
        className="hero-grid"
      >
        {/* LEFT */}
        <div>
          <span style={{
            fontFamily:    'var(--font-display)',
            fontSize:      13,
            fontWeight:    600,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color:         'var(--amber)',
            display:       'block',
            marginBottom:  20,
          }}>
            Clinical Operations Platform
          </span>

          <h1 style={{
            fontFamily:  'var(--font-display)',
            fontWeight:  700,
            fontSize:    'clamp(32px, 4.5vw, 56px)',
            lineHeight:  1.08,
            color:       'var(--white)',
            marginBottom: 24,
          }}>
            The operations layer<br />
            <span style={{ color: 'var(--amber)' }}>for human studies.</span>
          </h1>

          <p style={{
            fontFamily:  'var(--font-body)',
            fontSize:    18,
            color:       'rgba(255,255,255,0.8)',
            lineHeight:  1.5,
            maxWidth:    420,
            marginBottom: 40,
          }}>
            Protocol to data. You own the science. We run the operations.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link
              href="/run-a-study"
              className="btn-primary"
              onMouseEnter={() => setHoverRun(true)}
              onMouseLeave={() => setHoverRun(false)}
              style={{ transform: hoverRun ? 'translate(-2px,-2px)' : 'none', boxShadow: hoverRun ? '6px 6px 0 var(--black)' : '4px 4px 0 var(--black)' }}
            >
              Run a study →
            </Link>
            <Link href="/onboarding?role=participant" className="btn-secondary">
              Join as partner
            </Link>
          </div>
        </div>

        {/* RIGHT — decorative geometry, desktop only */}
        <div className="hero-art" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <HeroGeometry />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
          .hero-art { display: none !important; }
        }
      `}</style>
    </section>
  );
}
