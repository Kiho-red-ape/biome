'use client';

import { useRef, useState } from 'react';
import { SiteHeader } from '@/components/nav/header';
import Link from 'next/link';
import { EstimateWizard } from '@/app/estimate/estimate-wizard';
import { ScopeSection } from '@/components/home/scope-section';
import { BrutalistIcon } from '@/components/icons/BrutalistIcon';

const JOURNEY_CARDS = [
  { num: '01', icon: 'design'   as const, title: 'Design',   desc: 'Protocol to live study in under 30 days.'        },
  { num: '02', icon: 'approve'  as const, title: 'Approve',  desc: 'Compliance-ready infrastructure from day one.'   },
  { num: '03', icon: 'recruit'  as const, title: 'Recruit',  desc: 'Verified cohort. Screened to your criteria.'     },
  { num: '04', icon: 'track'    as const, title: 'Track',    desc: 'Real-time compliance. Automated alerts.'         },
  { num: '05', icon: 'collect'  as const, title: 'Collect',  desc: 'Kits dispatched. Samples tracked to lab.'       },
  { num: '06', icon: 'deliver'  as const, title: 'Deliver',  desc: 'Structured data. Full audit bundle.'             },
];

export default function RunAStudyPage() {
  const estimateRef = useRef<HTMLDivElement>(null);

  return (
    <main style={{ minHeight: '100vh' }}>
      <SiteHeader />

      {/* ── Hero (navy, two-column) ── */}
      <section className="texture-grid" style={{
        background:   'var(--navy)',
        borderBottom: '3px solid var(--black)',
      }}>
        <div
          style={{
            maxWidth:            1200,
            margin:              '0 auto',
            padding:             'clamp(60px, 9vh, 96px) 24px',
            display:             'grid',
            gridTemplateColumns: 'minmax(0, 54%) minmax(0, 46%)',
            gap:                 64,
            alignItems:          'center',
          }}
          className="ras-hero-grid"
        >
          {/* Left */}
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
              Run a Study
            </span>
            <h1 style={{
              fontFamily:   'var(--font-display)',
              fontWeight:   700,
              fontSize:     'clamp(28px, 4vw, 52px)',
              lineHeight:   1.08,
              color:        'var(--white)',
              marginBottom: 24,
            }}>
              Your protocol.<br />
              <span style={{ color: 'var(--amber)' }}>Our operations.</span>
            </h1>
            <p style={{
              fontFamily:   'var(--font-body)',
              fontSize:     17,
              color:        'rgba(255,255,255,0.75)',
              lineHeight:   1.6,
              maxWidth:     460,
              marginBottom: 40,
            }}>
              Recruit, track, and manage your study with infrastructure — not outsourcing.
              Participant logistics, compliance tracking, and data delivery included.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={() => estimateRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get an estimate →
              </button>
              <Link href="/contact" className="btn-secondary">
                Contact us
              </Link>
            </div>
          </div>

          {/* Right — what's included checklist */}
          <div className="ras-hero-right" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{
              border:     '3px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.04)',
            }}>
              <div style={{
                padding:      '14px 20px',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                fontFamily:   'var(--font-display)',
                fontSize:     11,
                fontWeight:   600,
                letterSpacing:'3px',
                textTransform:'uppercase' as const,
                color:        'var(--amber)',
              }}>
                What&apos;s included
              </div>
              {[
                ['Recruitment',     'Verified cohort matched to your criteria'],
                ['Compliance',      'Real-time tracking, automated alerts'],
                ['Kit logistics',   'Sample dispatch and lab intake managed'],
                ['Data delivery',   'Structured output with full audit bundle'],
                ['Payouts',         'Participant compensation handled end-to-end'],
              ].map(([title, desc], i, arr) => (
                <div key={title} style={{
                  padding:      '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  display:      'flex',
                  alignItems:   'flex-start',
                  gap:          12,
                }}>
                  <span style={{ color: 'var(--amber)', fontWeight: 700, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--white)', marginBottom: 2 }}>
                      {title}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Journey (white, 6 cards) ── */}
      <section style={{ background: 'var(--white)', borderBottom: '3px solid var(--black)' }}>
        <div className="section-inner">
          <span className="section-label section-label-dark">Your study journey</span>
          <h2 style={{
            fontFamily:   'var(--font-display)',
            fontSize:     'clamp(24px, 3vw, 36px)',
            color:        'var(--black)',
            marginBottom: 48,
          }}>
            Six phases. Handled end to end.
          </h2>

          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
            className="journey-grid"
          >
            {JOURNEY_CARDS.map(card => (
              <div key={card.num} className="brutalist-card" style={{ background: 'var(--off-white)' }}>
                <span className="card-number-bg">{card.num}</span>
                <div style={{ marginBottom: 16 }}>
                  <BrutalistIcon name={card.icon} size={48} color="var(--black)" strokeWidth={2.5} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--black)', marginBottom: 8 }}>
                  {card.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--gray)', margin: 0, lineHeight: 1.5 }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scope ── */}
      <ScopeSection />

      {/* ── Estimator (off-white) ── */}
      <section ref={estimateRef} style={{ background: 'var(--off-white)', borderBottom: '3px solid var(--black)' }}>
        <div className="section-inner">
          <span className="section-label section-label-dark">Cost estimator</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 36px)', color: 'var(--black)', marginBottom: 40 }}>
            Know your cost before you commit.
          </h2>
          <EstimateWizard />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--black)', borderTop: '3px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '2px', color: 'var(--white)', textDecoration: 'none' }}>
            BIO<span style={{ color: 'var(--amber)' }}>ME</span>
          </Link>
          <nav style={{ display: 'flex', gap: 24 }}>
            {[['Blog', '/blog'], ['Docs', '/docs'], ['Terms', '/legal/tos'], ['Privacy', '/privacy']].map(([label, href]) => (
              <a key={href} href={href} className="footer-link">{label}</a>
            ))}
          </nav>
        </div>
      </footer>

      <style>{`
        @media (max-width: 900px) { .journey-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px) { .journey-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px) {
          .ras-hero-grid  { grid-template-columns: 1fr !important; gap: 32px !important; }
          .ras-hero-right { display: none !important; }
        }
      `}</style>
    </main>
  );
}
