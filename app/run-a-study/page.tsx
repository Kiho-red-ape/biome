'use client';

import { useRef } from 'react';
import { SiteHeader } from '@/components/nav/header';
import Link from 'next/link';
import { EstimateWizard } from '@/app/estimate/estimate-wizard';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

const JOURNEY = [
  {
    num: '01', label: 'DESIGN',
    traditional: 'Protocol review takes 6–18 months to operationalise',
    withBiome:   'Study design to live in under 30 days',
    metric:      '< 30 days',
  },
  {
    num: '02', label: 'APPROVE',
    traditional: 'IRB queue and manual review cycles',
    withBiome:   'Compliance-ready infrastructure, audit bundle included',
    metric:      'Compliance-ready',
  },
  {
    num: '03', label: 'RECRUIT',
    traditional: 'Passive ads, slow enrolment, unverified cohorts',
    withBiome:   'Targeted network of verified research partners',
    metric:      '1,000+ partners',
  },
  {
    num: '04', label: 'TRACK',
    traditional: 'Spreadsheets and email chains',
    withBiome:   'Live dashboard, automated dropout alerts',
    metric:      'Real-time',
  },
  {
    num: '05', label: 'COLLECT',
    traditional: 'Coordinate labs and kit logistics manually',
    withBiome:   'Kits dispatched, tracked, and returned globally',
    metric:      'Global logistics',
  },
  {
    num: '06', label: 'DELIVER',
    traditional: 'Raw files, manual packaging for archive',
    withBiome:   'Clean export + full audit bundle',
    metric:      'Compliance bundle',
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
    <main style={{ minHeight: '100vh', background: '#050709' }}>
      <SiteHeader />

      {/* ── Hero ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px 64px' }}>
        <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#b7ff61', textTransform: 'uppercase', marginBottom: 20 }}>
          // RUN_A_STUDY
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(26px, 4vw, 40px)', lineHeight: 1.15, color: '#f2faf4', marginBottom: 16 }}>
          Run your study.<br />Your protocol. Your pace.
        </h1>
        <p style={{ ...MONO, fontSize: 13, color: '#aab8b1', lineHeight: 1.9, marginBottom: 36, maxWidth: 560 }}>
          Biome gives you the operational infrastructure to recruit, track, and
          manage a decentralised study without outsourcing control.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={scrollToEstimate} className="btn-primary" style={{ display: 'inline-flex' }}>
            Get an estimate →
          </button>
          <Link
            href="/contact"
            style={{ ...MONO, fontSize: 12, color: '#5b8a9a', textDecoration: 'none', display: 'flex', alignItems: 'center', minHeight: 46 }}
          >
            Or talk to us directly →
          </Link>
        </div>
      </section>

      {/* ── Journey ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#b7ff61', textTransform: 'uppercase', marginBottom: 32 }}>
          // HOW_IT_WORKS
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {JOURNEY.map((step, i) => (
            <div
              key={step.num}
              style={{
                display: 'grid', gridTemplateColumns: '56px 1fr 1fr auto',
                gap: 24, alignItems: 'center',
                padding: '16px 20px',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'rgba(183,255,97,0.015)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 2,
              }}
            >
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 28, color: 'rgba(183,255,97,0.2)', lineHeight: 1 }}>{step.num}</span>
              <div>
                <p style={{ ...MONO, fontSize: 10, letterSpacing: '2px', color: '#b7ff61', textTransform: 'uppercase', marginBottom: 4 }}>{step.label}</p>
                <p style={{ ...MONO, fontSize: 12, color: '#3a4e42', lineHeight: 1.5, margin: 0 }}>{step.traditional}</p>
              </div>
              <p style={{ ...MONO, fontSize: 12, color: '#aab8b1', lineHeight: 1.5, margin: 0 }}>
                <span style={{ color: '#b7ff61' }}>With Biome: </span>{step.withBiome}
              </p>
              <span style={{ ...MONO, fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase' as const, color: '#b7ff61', border: '1px solid rgba(183,255,97,0.25)', padding: '3px 10px', borderRadius: 2, whiteSpace: 'nowrap' as const }}>
                {step.metric}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Scope table ── */}
        <section style={{ marginBottom: 80 }}>
          <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#b7ff61', textTransform: 'uppercase', marginBottom: 24 }}>
            // SCOPE
          </p>
          <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
            <div className="grid grid-cols-2">
              <div style={{ padding: '10px 16px', background: 'rgba(183,255,97,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ ...MONO, fontSize: 10, letterSpacing: '2px', color: '#b7ff61', textTransform: 'uppercase', margin: 0 }}>Biome handles</p>
              </div>
              <div style={{ padding: '10px 16px', borderLeft: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                <p style={{ ...MONO, fontSize: 10, letterSpacing: '2px', color: '#5b8a9a', textTransform: 'uppercase', margin: 0 }}>You keep</p>
              </div>
            </div>
            {SCOPE_ROWS.map((row, i) => (
              <div key={i} className="grid grid-cols-2" style={{ borderBottom: i < SCOPE_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ padding: '12px 16px', background: 'rgba(183,255,97,0.015)' }}>
                  <p style={{ ...MONO, fontSize: 12, color: '#aab8b1', margin: 0 }}>{row.biome}</p>
                </div>
                <div style={{ padding: '12px 16px', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ ...MONO, fontSize: 12, color: '#5b8a9a', margin: 0 }}>{row.you}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Estimator ── */}
        <section ref={estimateRef} style={{ marginBottom: 80, scrollMarginTop: 80 }}>
          <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#b7ff61', textTransform: 'uppercase', marginBottom: 24 }}>
            // ESTIMATE
          </p>
          <EstimateWizard />
        </section>

        {/* ── Bottom CTA ── */}
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 48, paddingBottom: 80 }}>
          <p style={{ ...MONO, fontSize: 12, color: '#5b8a9a', lineHeight: 1.8, marginBottom: 24 }}>
            Prefer a direct conversation? Reach us at{' '}
            <a href="mailto:contact@biome.to" style={{ color: '#aab8b1', textDecoration: 'none' }}>contact@biome.to</a>
            {' '}or use our contact form.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={scrollToEstimate} className="btn-primary" style={{ display: 'inline-flex' }}>
              Get an estimate →
            </button>
            <Link href="/contact" style={{ ...MONO, fontSize: 12, color: '#5b8a9a', textDecoration: 'none', display: 'flex', alignItems: 'center', minHeight: 46 }}>
              Contact us →
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
