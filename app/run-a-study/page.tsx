'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { SiteHeader } from '@/components/nav/header';
import Link from 'next/link';
import { IsometricScene } from '@/components/illustrations/IsometricScene';
import { EstimateWizard } from '@/app/estimate/estimate-wizard';

type JScene = 'design' | 'approve' | 'recruit' | 'track' | 'collect' | 'deliver';

const JOURNEY: Array<{
  num: string; label: string; scene: JScene;
  traditional: string; withBiome: string; metric: string;
}> = [
  {
    num: '01', label: 'DESIGN', scene: 'design',
    traditional: 'Protocol review takes 6–18 months to operationalise',
    withBiome:   'Study design to live in under 30 days',
    metric:      '< 30 days',
  },
  {
    num: '02', label: 'APPROVE', scene: 'approve',
    traditional: 'IRB queue and manual review cycles',
    withBiome:   'BIOME Verified credential adds credibility fast',
    metric:      'Compliance-ready',
  },
  {
    num: '03', label: 'RECRUIT', scene: 'recruit',
    traditional: 'Passive ads, slow enrolment, unverified cohorts',
    withBiome:   'Targeted network of verified research partners',
    metric:      '1,000+ partners',
  },
  {
    num: '04', label: 'TRACK', scene: 'track',
    traditional: 'Spreadsheets and email chains',
    withBiome:   'Live dashboard, automated dropout alerts',
    metric:      'Real-time',
  },
  {
    num: '05', label: 'COLLECT', scene: 'collect',
    traditional: 'Coordinate labs and kit logistics manually',
    withBiome:   'Kits dispatched, tracked, and returned globally',
    metric:      'Global logistics',
  },
  {
    num: '06', label: 'DELIVER', scene: 'deliver',
    traditional: 'Raw files, manual packaging for archive',
    withBiome:   'Clean export + full audit bundle',
    metric:      'Compliance bundle',
  },
];

const SCOPE_ROWS: Array<{ biome: string; you: string }> = [
  { biome: 'Participant recruitment',              you: 'Study protocol' },
  { biome: 'Eligibility screening',               you: 'Scientific design' },
  { biome: 'Sample kit logistics',                you: 'Research questions' },
  { biome: 'Milestone tracking & alerts',         you: 'Regulatory responsibility' },
  { biome: 'Compliance-gated payouts',            you: 'IRB submission (your institution)' },
  { biome: 'Structured data export',              you: 'Publication and IP' },
  { biome: 'Audit bundle (consent, comms, log)',  you: 'Sponsor relationship' },
];

export default function RunAStudyPage() {
  const estimateRef  = useRef<HTMLDivElement>(null);
  const journeyRef   = useRef<HTMLDivElement>(null);
  const journeyCards = useRef<(HTMLDivElement | null)[]>([]);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const track = journeyRef.current;
    if (!track) return;
    const onScroll = () => {
      const cx = track.getBoundingClientRect().left + track.getBoundingClientRect().width / 2;
      let closest = 0, minDist = Infinity;
      journeyCards.current.forEach((card, i) => {
        if (!card) return;
        const r = card.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - cx);
        if (d < minDist) { minDist = d; closest = i; }
      });
      setActiveStep(closest);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToStep = useCallback((i: number) => {
    const card  = journeyCards.current[i];
    const track = journeyRef.current;
    if (!card || !track) return;
    const tr = track.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    track.scrollBy({ left: cr.left - tr.left - (tr.width - cr.width) / 2, behavior: 'smooth' });
  }, []);

  function scrollToEstimate() {
    estimateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <main style={{ minHeight: '100vh', background: '#050709' }}>
      <SiteHeader />

      {/* ── Hero ── */}
      <section
        style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px 64px' }}
      >
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
          color: '#b7ff61', textTransform: 'uppercase', marginBottom: 20,
        }}>
          // RUN_A_STUDY
        </p>
        <h1 style={{
          fontFamily: 'var(--font-heading)', fontWeight: 700,
          fontSize: 'clamp(26px, 4vw, 40px)', lineHeight: 1.15,
          color: '#f2faf4', marginBottom: 16,
        }}>
          Run your study.<br />Your protocol. Your pace.
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 13, color: '#aab8b1',
          lineHeight: 1.9, marginBottom: 36, maxWidth: 560,
        }}>
          Biome gives you the operational infrastructure to recruit, track, and
          manage a decentralised study without outsourcing control.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={scrollToEstimate} className="btn-primary" style={{ display: 'inline-flex' }}>
            Get an estimate →
          </button>
          <Link
            href="/intake"
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a',
              textDecoration: 'none', display: 'flex', alignItems: 'center',
              minHeight: 46, transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#aab8b1'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#5b8a9a'; }}
          >
            Or talk to us directly →
          </Link>
        </div>
      </section>

      {/* ── Journey cards ── */}
      <section style={{ overflow: 'hidden', paddingBottom: 80 }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
          color: '#b7ff61', textTransform: 'uppercase', marginBottom: 32,
          paddingLeft: 'clamp(16px, 5vw, 80px)',
        }}>
          // HOW_IT_WORKS
        </p>

        {/* Pill nav */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 32,
          paddingLeft: 'clamp(16px, 5vw, 80px)', flexWrap: 'wrap',
        }}>
          {JOURNEY.map((step, i) => (
            <button
              key={step.num}
              onClick={() => scrollToStep(i)}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px',
                textTransform: 'uppercase', padding: '6px 16px',
                border: `1px solid ${activeStep === i ? '#b7ff61' : 'rgba(255,255,255,0.08)'}`,
                background: activeStep === i ? 'rgba(183,255,97,0.07)' : 'transparent',
                color: activeStep === i ? '#b7ff61' : '#5b8a9a',
                borderRadius: 2, cursor: 'pointer', transition: 'all 150ms ease',
              }}
            >
              {step.num} {step.label}
            </button>
          ))}
        </div>

        <div
          ref={journeyRef}
          className="journey-track"
          style={{
            display: 'flex', gap: 24, overflowX: 'scroll',
            scrollSnapType: 'x mandatory', scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingLeft: 'clamp(16px, 5vw, 80px)',
            paddingRight: 'clamp(16px, 5vw, 80px)',
            paddingBottom: 8, cursor: 'grab',
          }}
        >
          {JOURNEY.map((step, i) => (
            <div
              key={step.num}
              ref={(el) => { journeyCards.current[i] = el; }}
              className={i % 2 === 0 ? 'flex flex-col sm:flex-row-reverse' : 'flex flex-col sm:flex-row'}
              style={{
                scrollSnapAlign: 'center', flexShrink: 0,
                width: 'clamp(320px, 88vw, 860px)', minHeight: 320,
                background: activeStep === i ? 'rgba(183,255,97,0.03)' : 'rgba(255,255,255,0.015)',
                border: `1px solid ${activeStep === i ? 'rgba(183,255,97,0.18)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 4, overflow: 'hidden',
                transition: 'border-color 300ms ease, background 300ms ease',
              }}
            >
              {/* Illustration — first in DOM → top on mobile */}
              <div
                className="w-full sm:w-1/2"
                style={{
                  background: 'rgba(11,16,20,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 24, minHeight: 200,
                  opacity: activeStep === i ? 0.9 : 0.3,
                  transition: 'opacity 400ms ease',
                }}
              >
                <IsometricScene scene={step.scene} />
              </div>

              {/* Text */}
              <div
                className="w-full sm:w-1/2"
                style={{
                  padding: 'clamp(28px, 4vw, 44px)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 64,
                  lineHeight: 1, color: 'rgba(183,255,97,0.15)', marginBottom: 12,
                }}>
                  {step.num}
                </div>
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
                  color: '#b7ff61', textTransform: 'uppercase', marginBottom: 20,
                }}>
                  {step.label}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#3a4e42', lineHeight: 1.7, margin: 0 }}>
                    <span style={{ color: '#3a4e42' }}>Traditional: </span>{step.traditional}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#aab8b1', lineHeight: 1.7, margin: 0 }}>
                    <span style={{ color: '#b7ff61' }}>With Biome: </span>{step.withBiome}
                  </p>
                </div>
                <span style={{
                  display: 'inline-block', alignSelf: 'flex-start',
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '1.5px',
                  textTransform: 'uppercase', color: '#b7ff61',
                  border: '1px solid rgba(183,255,97,0.25)', padding: '3px 10px', borderRadius: 2,
                }}>
                  {step.metric}
                </span>
              </div>
            </div>
          ))}
        </div>
        <style>{`.journey-track::-webkit-scrollbar { display: none; }`}</style>
      </section>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Scope table ── */}
        <section style={{ marginBottom: 80 }}>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
            color: '#b7ff61', textTransform: 'uppercase', marginBottom: 24,
          }}>
            // SCOPE
          </p>
          <div style={{
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden',
          }}>
            {/* Header row */}
            <div className="grid grid-cols-2">
              <div style={{ padding: '10px 16px', background: 'rgba(183,255,97,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px', color: '#b7ff61', textTransform: 'uppercase', margin: 0 }}>
                  Biome handles
                </p>
              </div>
              <div style={{ padding: '10px 16px', borderLeft: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px', color: '#5b8a9a', textTransform: 'uppercase', margin: 0 }}>
                  You keep
                </p>
              </div>
            </div>
            {SCOPE_ROWS.map((row, i) => (
              <div key={i} className="grid grid-cols-2" style={{ borderBottom: i < SCOPE_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ padding: '12px 16px', background: 'rgba(183,255,97,0.015)' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#aab8b1', margin: 0 }}>{row.biome}</p>
                </div>
                <div style={{ padding: '12px 16px', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a', margin: 0 }}>{row.you}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Estimator ── */}
        <section ref={estimateRef} style={{ marginBottom: 80, scrollMarginTop: 80 }}>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
            color: '#b7ff61', textTransform: 'uppercase', marginBottom: 24,
          }}>
            // ESTIMATE
          </p>
          <EstimateWizard />
        </section>

        {/* ── Bottom CTA ── */}
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 48, paddingBottom: 80 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a', lineHeight: 1.8, marginBottom: 24 }}>
            Prefer a direct conversation? Reach us at{' '}
            <a href="mailto:contact@biome.to" style={{ color: '#aab8b1', textDecoration: 'none' }}>contact@biome.to</a>
            {' '}or submit a full intake form.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={scrollToEstimate} className="btn-primary" style={{ display: 'inline-flex' }}>
              Get an estimate →
            </button>
            <Link
              href="/intake"
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a',
                textDecoration: 'none', display: 'flex', alignItems: 'center',
                minHeight: 46, transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#aab8b1'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#5b8a9a'; }}
            >
              Full intake form →
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
