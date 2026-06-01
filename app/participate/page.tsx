'use client';

import { SiteHeader } from '@/components/nav/header';
import Link from 'next/link';
import { StepsCarousel, type CarouselStep } from '@/components/ui/steps-carousel';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

const STEPS: CarouselStep[] = [
  {
    num: '01', label: 'VERIFY', scene: 'approve',
    headline: 'Build your\nresearch partner profile.',
    desc: [
      'Email + optional phone verification.',
      'Profile anchors your participant identity.',
      'Higher verification = higher-value studies.',
    ],
  },
  {
    num: '02', label: 'MATCH', scene: 'recruit',
    headline: 'Get matched to\nrelevant studies.',
    desc: [
      'Studies surface automatically based on your profile.',
      'No manual searching required.',
      'Opt in to study alerts via email.',
    ],
  },
  {
    num: '03', label: 'APPLY', scene: 'scope',
    headline: 'Apply in\none step.',
    desc: [
      'One-click application after eligibility check.',
      'Researcher reviews and approves.',
      'No lengthy screening forms.',
    ],
  },
  {
    num: '04', label: 'CONTRIBUTE', scene: 'collect',
    headline: 'Complete your\nmilestones.',
    desc: [
      'Follow the study protocol from home.',
      'Submit samples or data on schedule.',
      'Track progress on your dashboard.',
    ],
  },
  {
    num: '05', label: 'EARN', scene: 'pay',
    headline: 'Receive your\ncompensation.',
    desc: [
      'Compliance-gated payout on milestone completion.',
      'Full transparency on what you earn.',
      'Crypto or fiat depending on the study.',
    ],
  },
];

const DATA_POINTS = [
  'You decide which studies to apply to — no auto-enrolment.',
  'Identifiable information is never shared without your consent.',
  'Profile data is used only for matching — never sold.',
  'You can delete your account at any time.',
];

export default function ParticipatePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#060a14' }}>
      <SiteHeader />

      {/* ── Hero ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px 48px' }}>
        <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 20 }}>
          // JOIN_THE_NETWORK
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.1, color: '#f8fafc', marginBottom: 12 }}>
          Join the new clinical economy.
        </h1>
        <p style={{ ...MONO, fontSize: 13, color: '#94a3b8', lineHeight: 1.9, marginBottom: 36, maxWidth: 560 }}>
          Biome runs decentralised studies in microbiome, nutrition, sleep, wearables, and longevity.
          Research partners complete milestones from home and receive compensation on completion.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/onboarding?role=participant" className="btn-primary" style={{ display: 'inline-flex' }}>
            Create your profile →
          </Link>
          <p style={{ ...MONO, fontSize: 11, color: '#475569', margin: 0 }}>
            Already a member?{' '}
            <Link href="/dashboard" style={{ color: '#f59e0b', textDecoration: 'none' }}>Sign in →</Link>
          </p>
        </div>
      </section>

      {/* ── How it works carousel ── */}
      <StepsCarousel steps={STEPS} sectionLabel="HOW_IT_WORKS" />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Your data ── */}
        <section style={{ marginBottom: 80, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 64 }}>
          <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 24 }}>
            // YOUR_DATA
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(18px, 2.5vw, 24px)', color: '#f8fafc', marginBottom: 24, lineHeight: 1.2 }}>
            Your data. Your choice.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {DATA_POINTS.map((item) => (
              <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ ...MONO, fontSize: 11, color: 'rgba(245,158,11,0.4)', flexShrink: 0, marginTop: 2 }}>—</span>
                <p style={{ ...MONO, fontSize: 12, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 48, paddingBottom: 80 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
            <Link href="/onboarding?role=participant" className="btn-primary" style={{ display: 'inline-flex' }}>
              Join the network →
            </Link>
          </div>
          <p style={{ ...MONO, fontSize: 11, color: '#475569', lineHeight: 1.7 }}>
            Questions?{' '}
            <a href="mailto:contact@biome.to" style={{ color: '#94a3b8', textDecoration: 'none' }}>contact@biome.to</a>
          </p>
        </section>

      </div>
    </main>
  );
}
