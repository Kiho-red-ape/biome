'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

export interface CarouselStep {
  num: string;
  label: string;
  scene: string; // kept for API compatibility, no longer rendered
  headline: string;
  desc: string[];
}

interface Props {
  steps: CarouselStep[];
  sectionLabel?: string;
}

export function StepsCarousel({ steps, sectionLabel }: Props) {
  const trackRef  = useRef<HTMLDivElement>(null);
  const cardRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const rect   = track.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      let closest = 0;
      let minDist = Infinity;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const cr   = card.getBoundingClientRect();
        const dist = Math.abs(center - (cr.left + cr.width / 2));
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      setActive(closest);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = useCallback((i: number) => {
    const card  = cardRefs.current[i];
    const track = trackRef.current;
    if (!card || !track) return;
    const tr  = track.getBoundingClientRect();
    const cr  = card.getBoundingClientRect();
    track.scrollBy({ left: cr.left - tr.left - (tr.width - cr.width) / 2, behavior: 'smooth' });
  }, []);

  return (
    <section style={{ paddingTop: 80, paddingBottom: 80, overflow: 'hidden' }}>

      {sectionLabel && (
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
          color: '#f59e0b', textTransform: 'uppercase', marginBottom: 40,
          paddingLeft: 'clamp(16px, 5vw, 80px)',
        }}>
          {sectionLabel}
        </p>
      )}

      {/* Nav pills */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap',
        paddingLeft: 'clamp(16px, 5vw, 80px)',
      }}>
        {steps.map((step, i) => (
          <button
            key={step.num}
            onClick={() => scrollTo(i)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '1.5px',
              textTransform: 'uppercase', padding: '6px 16px',
              border: `1px solid ${active === i ? '#f59e0b' : 'rgba(248,250,252,0.08)'}`,
              background: active === i ? 'rgba(245,158,11,0.07)' : 'transparent',
              color: active === i ? '#f59e0b' : '#475569',
              cursor: 'pointer', transition: 'all 150ms ease',
            }}
          >
            {step.num} {step.label}
          </button>
        ))}
      </div>

      {/* Scroll track */}
      <div
        ref={trackRef}
        style={{
          display: 'flex', gap: 16, overflowX: 'scroll',
          scrollSnapType: 'x mandatory', scrollbarWidth: 'none',
          paddingLeft:  'clamp(16px, 5vw, 80px)',
          paddingRight: 'clamp(16px, 5vw, 80px)',
          paddingBottom: 8, cursor: 'grab',
        }}
      >
        {steps.map((step, i) => (
          <div
            key={step.num}
            ref={(el) => { cardRefs.current[i] = el; }}
            onClick={() => scrollTo(i)}
            style={{
              scrollSnapAlign: 'center', flexShrink: 0,
              width: 'clamp(300px, 80vw, 720px)', minHeight: 280,
              background: active === i ? 'rgba(245,158,11,0.03)' : 'rgba(248,250,252,0.01)',
              border: `1px solid ${active === i ? 'rgba(245,158,11,0.3)' : 'rgba(248,250,252,0.05)'}`,
              overflow: 'hidden',
              transition: 'border-color 300ms ease, background 300ms ease',
              display: 'flex', flexDirection: 'column',
              cursor: active === i ? 'default' : 'pointer',
              position: 'relative',
            }}
          >
            {/* Large dim step number — decorative */}
            <div style={{
              position: 'absolute', top: -8, right: 16,
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 120, lineHeight: 1,
              color: active === i ? 'rgba(245,158,11,0.08)' : 'rgba(248,250,252,0.025)',
              transition: 'color 300ms ease', userSelect: 'none', pointerEvents: 'none',
            }}>
              {step.num}
            </div>

            <div style={{ padding: 'clamp(28px, 4vw, 48px)', position: 'relative', zIndex: 1 }}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2.5px',
                color: active === i ? '#f59e0b' : '#334155',
                textTransform: 'uppercase', marginBottom: 16,
                transition: 'color 300ms ease',
              }}>
                {step.label}
              </p>

              <h3 style={{
                fontFamily: 'var(--font-heading)', fontWeight: 700,
                fontSize: 'clamp(18px, 2.2vw, 26px)',
                color: active === i ? '#f8fafc' : '#1e293b',
                lineHeight: 1.2, marginBottom: 24, whiteSpace: 'pre-line',
                transition: 'color 300ms ease',
              }}>
                {step.headline}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {step.desc.map((line) => (
                  <div key={line} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, flexShrink: 0, marginTop: 2,
                      color: active === i ? 'rgba(245,158,11,0.6)' : 'rgba(248,250,252,0.1)',
                      transition: 'color 300ms ease',
                    }}>—</span>
                    <p style={{
                      fontFamily: 'var(--font-body)', fontSize: 13,
                      color: active === i ? '#94a3b8' : '#1e293b',
                      lineHeight: 1.5, margin: 0,
                      transition: 'color 300ms ease',
                    }}>
                      {line}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        div[style*="overflowX: scroll"]::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
