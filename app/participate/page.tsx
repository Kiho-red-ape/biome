import { SiteHeader } from '@/components/nav/header';
import Link from 'next/link';

const STEPS = [
  { num: '01', label: 'Create a verified profile', desc: 'Email + phone + demographics.' },
  { num: '02', label: 'Get matched', desc: 'When a study fits your profile, we notify you.' },
  { num: '03', label: 'Apply and get screened', desc: 'Eligibility check. One-click application.' },
  { num: '04', label: 'Complete milestones', desc: 'Follow the protocol. Submit on time.' },
  { num: '05', label: 'Get paid', desc: 'Compliance-gated payouts. Compensation varies by study.' },
];

export default function ParticipatePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#050709' }}>
      <SiteHeader />

      <article
        style={{
          maxWidth: 680,
          margin:   '0 auto',
          padding:  'clamp(48px, 8vw, 96px) 24px clamp(64px, 10vw, 120px)',
        }}
      >
        {/* Eyebrow */}
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      10,
          letterSpacing: '3px',
          color:         '#b7ff61',
          textTransform: 'uppercase',
          marginBottom:  20,
        }}>
          // PARTICIPATE
        </p>

        {/* Headline */}
        <h1 style={{
          fontFamily:   'var(--font-heading)',
          fontWeight:   700,
          fontSize:     'clamp(24px, 4vw, 36px)',
          lineHeight:   1.2,
          color:        '#f2faf4',
          marginBottom: 16,
        }}>
          Participate in paid health studies.
        </h1>

        <p style={{
          fontFamily:   'var(--font-mono)',
          fontSize:     13,
          color:        '#aab8b1',
          lineHeight:   1.8,
          marginBottom: 40,
        }}>
          Biome runs decentralized studies in microbiome, nutrition,
          sleep, wearables, and longevity. Participants complete
          milestones from home and get paid on completion.
        </p>

        {/* Empty state */}
        <div
          style={{
            background:   'rgba(255,255,255,0.015)',
            border:       '1px solid rgba(255,255,255,0.06)',
            padding:      32,
            borderRadius: 2,
            marginBottom: 40,
            textAlign:    'center',
          }}
        >
          <p style={{
            fontFamily:   'var(--font-mono)',
            fontSize:     11,
            color:        '#5b8a9a',
            lineHeight:   1.7,
            marginBottom: 24,
          }}>
            No active studies recruiting right now.<br />
            Create a profile to get notified when studies open.
          </p>
          <Link
            href="/onboarding?role=participant"
            className="btn-primary"
            style={{ display: 'inline-flex' }}
          >
            Create your profile →
          </Link>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 40 }} />

        {/* How it works */}
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      10,
          letterSpacing: '2px',
          color:         '#b7ff61',
          textTransform: 'uppercase',
          marginBottom:  32,
        }}>
          How it works
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              style={{
                display:           'grid',
                gridTemplateColumns: '48px 1fr',
                gap:               20,
                paddingTop:        20,
                paddingBottom:     20,
                borderTop:         i === 0 ? '1px solid rgba(255,255,255,0.06)' : undefined,
                borderBottom:      '1px solid rgba(255,255,255,0.06)',
                alignItems:        'start',
              }}
            >
              <span style={{
                fontFamily:  'var(--font-heading)',
                fontWeight:  700,
                fontSize:    28,
                lineHeight:  1,
                color:       'rgba(183,255,97,0.2)',
                paddingTop:  4,
              }}>
                {step.num}
              </span>
              <div>
                <p style={{
                  fontFamily:   'var(--font-mono)',
                  fontSize:     12,
                  color:        '#f2faf4',
                  marginBottom: 4,
                }}>
                  {step.label}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5b8a9a' }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Sign in link */}
        <p style={{
          fontFamily:  'var(--font-mono)',
          fontSize:    11,
          color:       '#5b8a9a',
          marginTop:   32,
        }}>
          Already have a profile?{' '}
          <Link href="/onboarding?role=participant" style={{ color: '#b7ff61', textDecoration: 'none' }}>
            Sign in →
          </Link>
        </p>
      </article>
    </main>
  );
}
