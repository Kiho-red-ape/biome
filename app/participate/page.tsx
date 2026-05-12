'use client';

import { SiteHeader } from '@/components/nav/header';
import Link from 'next/link';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

const STEPS = [
  {
    num: '01', label: 'VERIFY',
    headline: 'Build your research partner profile.',
    desc: 'Email and demographics. Optional phone verification for higher-value studies.',
  },
  {
    num: '02', label: 'MATCH',
    headline: 'Get matched to relevant studies.',
    desc: 'When a study fits your profile, you receive a notification. No searching required.',
  },
  {
    num: '03', label: 'APPLY',
    headline: 'Apply in one step.',
    desc: 'Eligibility check. One-click application. The researcher reviews and approves.',
  },
  {
    num: '04', label: 'CONTRIBUTE',
    headline: 'Complete your milestones.',
    desc: 'Follow the study protocol from home. Submit on time. Track your progress.',
  },
  {
    num: '05', label: 'EARN',
    headline: 'Receive your compensation.',
    desc: 'Compliance-gated reimbursement released when your milestones are verified.',
  },
];

const DATA_POINTS = [
  'You decide which studies you apply to — no auto-enrolment.',
  'Identifiable information is never shared with researchers without your consent.',
  'Profile data is used only for study matching — never sold.',
  'You can delete your account at any time.',
];

export default function ParticipatePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#050709' }}>
      <SiteHeader />

      {/* ── Hero ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px 64px' }}>
        <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#b7ff61', textTransform: 'uppercase', marginBottom: 20 }}>
          // JOIN_THE_NETWORK
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(26px, 4vw, 40px)', lineHeight: 1.15, color: '#f2faf4', marginBottom: 8 }}>
          Join the new clinical economy.
        </h1>
        <p style={{ ...MONO, fontSize: 12, color: '#5b8a9a', letterSpacing: '0.5px', marginBottom: 24 }}>
          Join the founding cohort of research partners.
        </p>
        <p style={{ ...MONO, fontSize: 13, color: '#aab8b1', lineHeight: 1.9, marginBottom: 36, maxWidth: 520 }}>
          Biome runs decentralised studies in microbiome, nutrition, sleep,
          wearables, and longevity. Research partners complete milestones from
          home and receive compensation on completion.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/onboarding?role=participant" className="btn-primary" style={{ display: 'inline-flex' }}>
            Create your profile →
          </Link>
          <p style={{ ...MONO, fontSize: 11, color: '#5b8a9a', margin: 0 }}>
            Already a member?{' '}
            <Link href="/dashboard" style={{ color: '#b7ff61', textDecoration: 'none' }}>Sign in →</Link>
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#b7ff61', textTransform: 'uppercase', marginBottom: 32 }}>
          // HOW_IT_WORKS
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              style={{
                display: 'grid', gridTemplateColumns: '56px 1fr 2fr',
                gap: 24, alignItems: 'flex-start',
                padding: '20px 24px',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'rgba(183,255,97,0.015)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 2,
              }}
            >
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 32, color: 'rgba(183,255,97,0.18)', lineHeight: 1 }}>{step.num}</span>
              <div>
                <p style={{ ...MONO, fontSize: 10, letterSpacing: '2px', color: '#b7ff61', textTransform: 'uppercase', marginBottom: 6 }}>{step.label}</p>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(14px, 1.8vw, 18px)', color: '#f2faf4', lineHeight: 1.2, marginBottom: 6 }}>
                  {step.headline}
                </p>
                <p style={{ ...MONO, fontSize: 12, color: '#aab8b1', lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Your data ── */}
        <section style={{ marginBottom: 80, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 64 }}>
          <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#b7ff61', textTransform: 'uppercase', marginBottom: 24 }}>
            // YOUR_DATA
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(18px, 2.5vw, 24px)', color: '#f2faf4', marginBottom: 24, lineHeight: 1.2 }}>
            Your data. Your choice.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {DATA_POINTS.map((item) => (
              <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ ...MONO, fontSize: 11, color: 'rgba(183,255,97,0.4)', flexShrink: 0, marginTop: 2 }}>—</span>
                <p style={{ ...MONO, fontSize: 12, color: '#aab8b1', lineHeight: 1.7, margin: 0 }}>{item}</p>
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
          <p style={{ ...MONO, fontSize: 11, color: '#5b8a9a', lineHeight: 1.7 }}>
            Questions?{' '}
            <a href="mailto:contact@biome.to" style={{ color: '#aab8b1', textDecoration: 'none' }}>contact@biome.to</a>
          </p>
        </section>

      </div>
    </main>
  );
}
