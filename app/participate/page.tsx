'use client';

import { SiteHeader } from '@/components/nav/header';
import Link from 'next/link';
import { BrutalistIcon } from '@/components/icons/BrutalistIcon';

const STEPS = [
  { num: '01', icon: 'verify'     as const, title: 'Verify',     desc: 'Create your profile. Two minutes.'            },
  { num: '02', icon: 'match'      as const, title: 'Match',      desc: 'Studies surface based on your profile.'       },
  { num: '03', icon: 'approve'    as const, title: 'Apply',      desc: 'Review protocol. One-click application.'      },
  { num: '04', icon: 'contribute' as const, title: 'Contribute', desc: 'Complete milestones from home.'                },
  { num: '05', icon: 'earn'       as const, title: 'Earn',       desc: 'Compensation on verified completion.'          },
];

const DATA_COMMITMENTS = [
  'Your identity is pseudonymized.',
  'Your data is never sold.',
  'You choose every study you join.',
];

export default function ParticipatePage() {
  return (
    <main style={{ minHeight: '100vh' }}>
      <SiteHeader />

      {/* ── Hero (navy) ── */}
      <section style={{
        background:   'var(--navy)',
        minHeight:    '60vh',
        display:      'flex',
        alignItems:   'center',
        borderBottom: '3px solid var(--black)',
      }}>
        <div className="section-inner" style={{ maxWidth: 680 }}>
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
            Join the Network
          </span>
          <h1 style={{
            fontFamily:   'var(--font-display)',
            fontWeight:   700,
            fontSize:     'clamp(28px, 4vw, 48px)',
            lineHeight:   1.08,
            color:        'var(--white)',
            marginBottom: 24,
          }}>
            Contribute to studies that matter.
          </h1>
          <p style={{
            fontFamily:   'var(--font-body)',
            fontSize:     17,
            color:        'rgba(255,255,255,0.8)',
            lineHeight:   1.5,
            maxWidth:     480,
            marginBottom: 40,
          }}>
            You&apos;re a research partner, not a test subject. Fair compensation. Pseudonymized identity.
          </p>
          <Link href="/onboarding?role=participant" className="btn-primary">
            Join the network →
          </Link>
        </div>
      </section>

      {/* ── How it works (white, 5 cards) ── */}
      <section style={{ background: 'var(--white)', borderBottom: '3px solid var(--black)' }}>
        <div className="section-inner">
          <span className="section-label section-label-dark">How it works</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 36px)', color: 'var(--black)', marginBottom: 48 }}>
            Five steps to your first study.
          </h2>

          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
            className="steps-grid"
          >
            {STEPS.map(step => (
              <div key={step.num} className="brutalist-card" style={{ background: 'var(--off-white)' }}>
                <span className="card-number-bg">{step.num}</span>
                <div style={{ marginBottom: 16 }}>
                  <BrutalistIcon name={step.icon} size={48} color="var(--black)" strokeWidth={2.5} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--black)', marginBottom: 8 }}>
                  {step.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--gray)', margin: 0, lineHeight: 1.5 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Data commitments (navy) ── */}
      <section style={{ background: 'var(--navy)', borderBottom: '3px solid var(--black)' }}>
        <div className="section-inner" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto', padding: '80px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {DATA_COMMITMENTS.map(line => (
              <p key={line} style={{
                fontFamily: 'var(--font-body)',
                fontSize:   20,
                fontWeight: 500,
                color:      'var(--white)',
                margin:     0,
                lineHeight: 1.4,
              }}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA (amber) ── */}
      <section style={{ background: 'var(--amber)', borderTop: '3px solid var(--black)', borderBottom: '3px solid var(--black)' }}>
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 36px)', color: 'var(--black)', marginBottom: 32 }}>
            Ready to contribute?
          </h2>
          <Link href="/onboarding?role=participant" className="btn-black">
            Create your profile →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--black)', borderTop: '3px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '2px', color: 'var(--white)', textDecoration: 'none' }}>
            BIO<span style={{ color: 'var(--amber)' }}>ME</span>
          </Link>
          <nav style={{ display: 'flex', gap: 24 }}>
            {[['Blog', '/blog'], ['Docs', '/docs'], ['Terms', '/legal/tos'], ['Privacy', '/privacy']].map(([l, h]) => (
              <a key={h} href={h} className="footer-link">{l}</a>
            ))}
          </nav>
        </div>
      </footer>

      <style>{`
        @media (max-width: 900px) { .steps-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px) { .steps-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </main>
  );
}
