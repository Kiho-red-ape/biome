'use client';

import { SiteHeader } from '@/components/nav/header';
import Link from 'next/link';

const DIVIDER = (
  <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '40px 0' }} />
);

export default function RunAStudyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#050709' }}>
      <SiteHeader />

      <article
        style={{
          maxWidth:   680,
          margin:     '0 auto',
          padding:    'clamp(48px, 8vw, 96px) 24px clamp(64px, 10vw, 120px)',
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
          // RUN_A_STUDY
        </p>

        {/* Headline */}
        <h1 style={{
          fontFamily:  'var(--font-heading)',
          fontWeight:  700,
          fontSize:    'clamp(24px, 4vw, 36px)',
          lineHeight:  1.2,
          color:       '#f2faf4',
          marginBottom: 16,
        }}>
          Run a decentralized study without a CRO.
        </h1>

        <p style={{
          fontFamily:  'var(--font-mono)',
          fontSize:    13,
          color:       '#aab8b1',
          lineHeight:  1.8,
          marginBottom: 0,
        }}>
          Biome handles recruitment, sample logistics, compliance,
          and payouts. You keep the science, the protocol, and the
          regulatory responsibility.
        </p>

        {DIVIDER}

        {/* Built for / not built for */}
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 32 }}>
          <div>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px',
              color: '#b7ff61', textTransform: 'uppercase', marginBottom: 16,
            }}>
              Built for
            </p>
            {[
              'Observational · Biomarker',
              'Behavioral interventions',
              'Consumer product studies',
              'Device / wearable studies',
              'Survey / PRO / eCOA',
              '30–300 participants',
              'Multi-country',
            ].map((item) => (
              <p key={item} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#aab8b1', marginBottom: 8 }}>
                {item}
              </p>
            ))}
          </div>
          <div>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px',
              color: '#5b8a9a', textTransform: 'uppercase', marginBottom: 16,
            }}>
              Not built for
            </p>
            {[
              'Drug trials',
              'On-site procedures',
              'Imaging',
              'Pediatric / IND/CTA territory',
            ].map((item) => (
              <p key={item} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a', marginBottom: 8 }}>
                {item}
              </p>
            ))}
          </div>
        </div>

        {DIVIDER}

        {/* Pricing */}
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px',
          color: '#b7ff61', textTransform: 'uppercase', marginBottom: 24,
        }}>
          How pricing works
        </p>

        {[
          {
            label: 'Operations fee — per study',
            desc: 'Scope, cohort, and complexity dependent.\nFirst sponsors: portfolio-rate pricing available.',
          },
          {
            label: 'Recruitment — transparent pass-through',
            desc: 'Typically $100–$400 per enrolled participant.',
          },
          {
            label: 'Sample logistics — transparent pass-through',
            desc: 'Lab partner rates + per-sample coordination fee.',
          },
          {
            label: 'Participant compensation — transparent pass-through',
            desc: 'You set the bounty. We distribute it.',
          },
        ].map((item) => (
          <div key={item.label} style={{ marginBottom: 24 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f2faf4', marginBottom: 4 }}>
              {item.label}
            </p>
            <p style={{
              fontFamily:  'var(--font-mono)',
              fontSize:    11,
              color:       '#5b8a9a',
              lineHeight:  1.7,
              whiteSpace:  'pre-line',
            }}>
              {item.desc}
            </p>
          </div>
        ))}

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#aab8b1', lineHeight: 1.7, marginTop: 8 }}>
          No CRO-style bundled markup.<br />
          You see every line item.
        </p>

        {DIVIDER}

        {/* Team */}
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px',
          color: '#b7ff61', textTransform: 'uppercase', marginBottom: 16,
        }}>
          The team
        </p>

        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f2faf4', marginBottom: 4,
        }}>
          Kishore Ramesh Kumar, Founder
        </p>
        <p style={{
          fontFamily:  'var(--font-mono)',
          fontSize:    11,
          color:       '#5b8a9a',
          lineHeight:  1.8,
        }}>
          M.Sc. Synthetic Biology · Biopharma R&amp;D · Nucleate Alumni<br />
          Solo operator with a network of recruitment and lab partners<br />
          activated per study.
        </p>

        {DIVIDER}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row" style={{ gap: 16, alignItems: 'flex-start' }}>
          <Link
            href="/intake"
            className="btn-primary"
            style={{ display: 'inline-flex' }}
          >
            Start a conversation →
          </Link>
          <a
            href="mailto:kishore@biome.to"
            style={{
              fontFamily:  'var(--font-mono)',
              fontSize:    12,
              color:       '#5b8a9a',
              textDecoration: 'none',
              display:     'flex',
              alignItems:  'center',
              minHeight:   46,
              transition:  'color 150ms ease',
            }}
            onMouseEnter={(e) => { (e.target as HTMLAnchorElement).style.color = '#aab8b1'; }}
            onMouseLeave={(e) => { (e.target as HTMLAnchorElement).style.color = '#5b8a9a'; }}
          >
            kishore@biome.to
          </a>
        </div>
      </article>
    </main>
  );
}
