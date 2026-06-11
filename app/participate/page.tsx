'use client';

import { SiteHeader } from '@/components/nav/header';
import Link from 'next/link';
import { BrutalistIcon } from '@/components/icons/BrutalistIcon';

const STEPS = [
  { num: '01', icon: 'verify'     as const, title: 'Verify',     desc: 'Create your profile. Two minutes.'            },
  { num: '02', icon: 'match'      as const, title: 'Match',      desc: 'Studies surface based on your profile.'       },
  { num: '03', icon: 'approve'    as const, title: 'Apply',      desc: 'Review protocol. One-click application.'      },
  { num: '04', icon: 'contribute' as const, title: 'Contribute', desc: 'Complete milestones from home.'                },
  { num: '05', icon: 'earn'       as const, title: 'Receive compensation', desc: 'Compensation on verified completion.'          },
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

      {/* ── Hero (light, two-column) ── */}
      <section style={{ background: 'linear-gradient(180deg, #ffffff, #f8fafc)', borderBottom: '1px solid var(--border-soft)' }}>
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
          className="participate-hero-grid"
        >
          {/* Left */}
          <div>
            <span style={{
              fontFamily:    'var(--font-display)',
              fontSize:      13,
              fontWeight:    600,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color:         'var(--teal)',
              display:       'block',
              marginBottom:  20,
            }}>
              Join the Network
            </span>
            <h1 style={{
              fontFamily:   'var(--font-display)',
              fontWeight:   700,
              fontSize:     'clamp(28px, 4vw, 52px)',
              lineHeight:   1.08,
              color:        'var(--ink)',
              marginBottom: 24,
            }}>
              Contribute to<br />
              <span style={{ color: 'var(--teal)' }}>studies that matter.</span>
            </h1>
            <p style={{
              fontFamily:   'var(--font-body)',
              fontSize:     17,
              color:        'var(--slate)',
              lineHeight:   1.6,
              maxWidth:     440,
              marginBottom: 24,
            }}>
              You&apos;re a research partner, not a test subject.
              Fair compensation. Pseudonymized identity.
              Choose every study you join.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 36 }}>
              {[
                'Identity pseudonymized by default',
                'Data never sold to third parties',
                'Compensation on verified completion',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--teal)', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate)' }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/onboarding?role=participant" className="btn-primary">
              Join the network →
            </Link>
          </div>

          {/* Right — compensation panel */}
          <div className="participate-hero-right">
            <div style={{
              border:        '1px solid var(--border-soft)',
              background:    'var(--surface)',
              borderRadius:  'var(--radius)',
              boxShadow:     'var(--shadow-sm)',
              overflow:      'hidden',
            }}>
              <div style={{
                padding:      '14px 20px',
                borderBottom: '1px solid var(--border-soft)',
                background:   'var(--teal-faint)',
                fontFamily:   'var(--font-display)',
                fontSize:     11,
                fontWeight:   600,
                letterSpacing:'3px',
                textTransform:'uppercase' as const,
                color:        'var(--teal)',
              }}>
                Typical compensation
              </div>
              {[
                { type: 'Survey / digital',    range: '$20–80',   duration: '1–2 hrs'  },
                { type: 'Wearable / tracking', range: '$80–200',  duration: '2–4 wks'  },
                { type: 'Biomarker / sample',  range: '$100–300', duration: '4–8 wks'  },
                { type: 'Clinical / cohort',   range: '$200–600', duration: '8–16 wks' },
              ].map((s, i, arr) => (
                <div key={s.type} style={{
                  padding:      '16px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border-soft)' : 'none',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'space-between',
                  gap:          12,
                }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--ink)', marginBottom: 2 }}>
                      {s.type}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)' }}>
                      {s.duration}
                    </div>
                  </div>
                  <span style={{
                    fontFamily:  'var(--font-display)',
                    fontWeight:  700,
                    fontSize:    16,
                    color:       'var(--teal)',
                    flexShrink:  0,
                  }}>
                    {s.range}
                  </span>
                </div>
              ))}
              <div style={{
                padding:      '12px 20px',
                background:   'var(--teal-faint)',
                borderTop:    '1px solid var(--border-soft)',
                fontFamily:   'var(--font-body)',
                fontSize:     11,
                color:        'var(--muted)',
                lineHeight:   1.5,
              }}>
                Amounts vary by protocol. All compensation is issued on verified study completion.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works (white, 5 cards) ── */}
      <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)' }}>
        <div className="section-inner">
          <span className="section-label section-label-dark">How it works</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 36px)', color: 'var(--ink)', marginBottom: 48 }}>
            Five steps to your first study.
          </h2>

          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
            className="steps-grid"
          >
            {STEPS.map(step => (
              <div key={step.num} className="brutalist-card">
                <span className="card-number-bg">{step.num}</span>
                <div style={{ marginBottom: 16 }}>
                  <BrutalistIcon name={step.icon} size={48} color="var(--teal)" strokeWidth={2} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
                  {step.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate)', margin: 0, lineHeight: 1.5 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Data commitments (teal tint) ── */}
      <section style={{ background: 'var(--teal-faint)', borderBottom: '1px solid var(--border-soft)' }}>
        <div className="section-inner" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto', padding: '80px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {DATA_COMMITMENTS.map(line => (
              <p key={line} style={{
                fontFamily: 'var(--font-body)',
                fontSize:   20,
                fontWeight: 500,
                color:      'var(--ink)',
                margin:     0,
                lineHeight: 1.4,
              }}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)' }}>
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 36px)', color: 'var(--ink)', marginBottom: 32 }}>
            Ready to contribute?
          </h2>
          <Link href="/onboarding?role=participant" className="btn-primary">
            Create your profile →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '2px', color: 'var(--ink)', textDecoration: 'none' }}>
            BIO<span style={{ color: 'var(--teal)' }}>ME</span>
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
        @media (max-width: 768px) {
          .participate-hero-grid  { grid-template-columns: 1fr !important; gap: 32px !important; }
          .participate-hero-right { display: none !important; }
        }
        @media (max-width: 640px) { .steps-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </main>
  );
}
