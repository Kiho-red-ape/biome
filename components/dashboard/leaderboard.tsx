'use client';

import Link from 'next/link';

// ─── Dashboard Preview — replaces leaderboard ─────────────────────────────────
// Shows a mock "your dashboard" panel to drive participant sign-ups

export function Leaderboard() {
  return (
    <section style={{ padding: '0 40px 40px' }}>

      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28, marginBottom: 14 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
          textTransform: 'uppercase', color: '#b7ff61', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          // YOUR_DASHBOARD
        </span>
        <div style={{ flex: 1, height: 1, background: '#b7ff61', opacity: 0.2 }} />
      </div>

      {/* Centered panel */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <p style={{
          fontFamily: 'var(--font-heading)', fontSize: 14, color: '#7f8e87',
          marginBottom: 20, lineHeight: 1.5,
        }}>
          Track your studies, payouts, and compliance — all in one place.
        </p>

        <div style={{
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'var(--bg2)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          {/* Panel rows */}
          {[
            { label: 'ACTIVE STUDIES',     value: '3',                    color: '#8ee7ff', dot: true },
            { label: 'PENDING PAYOUTS',    value: '2 pending · $95.00',   color: '#b7ff61', dot: false },
            { label: 'COMPLIANCE',         value: '94% across all studies', color: '#b7ff61', dot: false },
            { label: 'PROFILE MATCH',      value: '12 studies eligible',  color: '#aab8b1', dot: false },
            { label: 'NEW ALERTS',         value: '2 unread',             color: '#ffd166', dot: false },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                textTransform: 'uppercase', letterSpacing: '2px',
                color: '#5a7860',
              }}>
                {row.label}
              </span>
              <span style={{
                fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600,
                color: row.color, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {row.dot && (
                  <span className="blink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#8ee7ff', display: 'inline-block' }} />
                )}
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <Link
            href="/onboarding/participant"
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '2px',
              color: '#070c07', background: '#b7ff61',
              padding: '10px 20px', textDecoration: 'none',
              display: 'inline-block', transition: 'opacity 150ms',
            }}
          >
            Create your profile →
          </Link>
          <Link
            href="/dashboard"
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '2px',
              color: '#b7ff61',
              border: '1px solid rgba(183,255,97,0.2)',
              background: 'rgba(183,255,97,0.04)',
              padding: '10px 20px', textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Go to dashboard →
          </Link>
        </div>
      </div>

    </section>
  );
}
