'use client';

import { useRef } from 'react';
import { SiteHeader } from '@/components/nav/header';
import Link from 'next/link';
import { EstimateWizard } from '@/app/estimate/estimate-wizard';
import { StepsCarousel, type CarouselStep } from '@/components/ui/steps-carousel';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

const JOURNEY: CarouselStep[] = [
  {
    num: '01', label: 'DESIGN', scene: 'design',
    headline: 'Study design\nto live in under 30 days.',
    desc: [
      'Protocol review → live study in < 30 days.',
      'We handle the ops. You own the science.',
      'Compliance-ready from day one.',
    ],
  },
  {
    num: '02', label: 'APPROVE', scene: 'approve',
    headline: 'Compliance-ready.\nAudit bundle included.',
    desc: [
      'Infrastructure built around IRB requirements.',
      'Consent capture, comms log, audit export.',
      'No manual review cycle delays.',
    ],
  },
  {
    num: '03', label: 'RECRUIT', scene: 'recruit',
    headline: 'Targeted cohort.\nVerified participants.',
    desc: [
      'Network of 1,000+ verified research partners.',
      'Screened against your exact eligibility criteria.',
      'Faster enrolment than passive ads.',
    ],
  },
  {
    num: '04', label: 'TRACK', scene: 'track',
    headline: 'Live dashboard.\nDropouts flagged automatically.',
    desc: [
      'Real-time compliance monitoring.',
      'Automated dropout alerts and reminders.',
      'Weekly sponsor reports included.',
    ],
  },
  {
    num: '05', label: 'COLLECT', scene: 'collect',
    headline: 'Samples shipped.\nTracked. Logged.',
    desc: [
      'Kits dispatched globally from partner labs.',
      'Stool, saliva, blood spot, urine, wearable data.',
      'Partner phlebotomy for blood draws.',
    ],
  },
  {
    num: '06', label: 'DELIVER', scene: 'deliver',
    headline: 'Clean data out.\nFull audit bundle.',
    desc: [
      'Structured export with chain-of-custody log.',
      'Consent records, comms log, payout summary.',
      'Compliance bundle ready for sponsor archive.',
    ],
  },
];

const SCOPE_ROWS = [
  { biome: 'Participant recruitment',             you: 'Study protocol'                      },
  { biome: 'Eligibility screening',              you: 'Scientific design'                   },
  { biome: 'Sample kit logistics',               you: 'Research questions'                  },
  { biome: 'Milestone tracking & alerts',        you: 'Regulatory responsibility'           },
  { biome: 'Compliance-gated payouts',           you: 'IRB submission (your institution)'   },
  { biome: 'Structured data export',             you: 'Publication and IP'                  },
  { biome: 'Audit bundle (consent, comms, log)', you: 'Sponsor relationship'                },
];

export default function RunAStudyPage() {
  const estimateRef = useRef<HTMLDivElement>(null);

  function scrollToEstimate() {
    estimateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <main style={{ minHeight: '100vh', background: '#060a14' }}>
      <SiteHeader />

      {/* ── Hero ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px 48px' }}>
        <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 20 }}>
          // RUN_A_STUDY
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.1, color: '#f8fafc', marginBottom: 16 }}>
          Run your study.<br />Your protocol. Your pace.
        </h1>
        <p style={{ ...MONO, fontSize: 13, color: '#94a3b8', lineHeight: 1.9, marginBottom: 36, maxWidth: 560 }}>
          Biome gives you the operational infrastructure to recruit, track, and manage a decentralised study
          without outsourcing control.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={scrollToEstimate} className="btn-primary" style={{ display: 'inline-flex' }}>
            Get an estimate →
          </button>
          <Link href="/contact" style={{ ...MONO, fontSize: 12, color: '#475569', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 46 }}>
            Contact us →
          </Link>
        </div>
      </section>

      {/* ── Journey carousel ── */}
      <StepsCarousel steps={JOURNEY} sectionLabel="THE_JOURNEY" />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Scope table ── */}
        <section style={{ marginBottom: 80 }}>
          <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 24 }}>
            // SCOPE
          </p>
          <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
            <div className="grid grid-cols-2">
              <div style={{ padding: '10px 16px', background: 'rgba(245,158,11,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ ...MONO, fontSize: 10, letterSpacing: '2px', color: '#f59e0b', textTransform: 'uppercase', margin: 0 }}>Biome handles</p>
              </div>
              <div style={{ padding: '10px 16px', borderLeft: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                <p style={{ ...MONO, fontSize: 10, letterSpacing: '2px', color: '#475569', textTransform: 'uppercase', margin: 0 }}>You keep</p>
              </div>
            </div>
            {SCOPE_ROWS.map((row, i) => (
              <div key={i} className="grid grid-cols-2" style={{ borderBottom: i < SCOPE_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.015)' }}>
                  <p style={{ ...MONO, fontSize: 12, color: '#94a3b8', margin: 0 }}>{row.biome}</p>
                </div>
                <div style={{ padding: '12px 16px', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ ...MONO, fontSize: 12, color: '#475569', margin: 0 }}>{row.you}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Estimator ── */}
        <section ref={estimateRef} style={{ marginBottom: 80, scrollMarginTop: 80 }}>
          <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 24 }}>
            // ESTIMATE
          </p>
          <EstimateWizard />
        </section>

        {/* ── Bottom CTA ── */}
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 48, paddingBottom: 80 }}>
          <p style={{ ...MONO, fontSize: 12, color: '#475569', lineHeight: 1.8, marginBottom: 24 }}>
            Prefer a direct conversation? Reach us at{' '}
            <a href="mailto:contact@biome.to" style={{ color: '#94a3b8', textDecoration: 'none' }}>contact@biome.to</a>
            {' '}or use our contact form.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={scrollToEstimate} className="btn-primary" style={{ display: 'inline-flex' }}>
              Get an estimate →
            </button>
            <Link href="/contact" style={{ ...MONO, fontSize: 12, color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', minHeight: 46 }}>
              Contact us →
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
