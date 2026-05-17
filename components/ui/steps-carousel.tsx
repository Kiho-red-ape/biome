'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { IsometricScene } from '@/components/illustrations/IsometricScene';

type Scene = 'recruit' | 'collect' | 'track' | 'pay' | 'deliver' | 'scope' | 'design' | 'approve';

export interface CarouselStep {
  num: string;
  label: string;
  scene: Scene;
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
          color: '#b7ff61', textTransform: 'uppercase', marginBottom: 40,
          paddingLeft: 'clamp(16px, 5vw, 80px)',
        }}>
          // {sectionLabel}
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
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px',
              textTransform: 'uppercase', padding: '6px 16px',
              border: `1px solid ${active === i ? '#b7ff61' : 'rgba(255,255,255,0.08)'}`,
              background: active === i ? 'rgba(183,255,97,0.07)' : 'transparent',
              color: active === i ? '#b7ff61' : '#5b8a9a',
              borderRadius: 2, cursor: 'pointer', transition: 'all 150ms ease',
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
          display: 'flex', gap: 20, overflowX: 'scroll',
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
              width: 'clamp(320px, 88vw, 860px)', minHeight: 340,
              background: active === i ? 'rgba(183,255,97,0.03)' : 'rgba(255,255,255,0.008)',
              border: `1px solid ${active === i ? 'rgba(183,255,97,0.2)' : 'rgba(255,255,255,0.04)'}`,
              borderRadius: 4, overflow: 'hidden',
              transition: 'border-color 300ms ease, background 300ms ease',
              display: 'flex', flexDirection: 'row',
              cursor: active === i ? 'default' : 'pointer',
            }}
          >
            {/* ── Text: LEFT ── */}
            <div style={{
              width: '55%', padding: 'clamp(28px, 4vw, 48px)',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              position: 'relative',
            }}>
              {/* Large dim number in background */}
              <div style={{
                position: 'absolute', top: 12, left: 20,
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 96, lineHeight: 1,
                color: active === i ? 'rgba(183,255,97,0.09)' : 'rgba(255,255,255,0.03)',
                transition: 'color 300ms ease', userSelect: 'none', pointerEvents: 'none',
              }}>
                {step.num}
              </div>

              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
                color: active === i ? '#b7ff61' : '#3a4e42',
                textTransform: 'uppercase', marginBottom: 14,
                position: 'relative', zIndex: 1, transition: 'color 300ms ease',
              }}>
                {step.label}
              </p>

              <h3 style={{
                fontFamily: 'var(--font-heading)', fontWeight: 700,
                fontSize: 'clamp(18px, 2.2vw, 26px)', color: active === i ? '#f2faf4' : '#3a4e42',
                lineHeight: 1.2, marginBottom: 20, whiteSpace: 'pre-line',
                position: 'relative', zIndex: 1, transition: 'color 300ms ease',
              }}>
                {step.headline}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1 }}>
                {step.desc.map((line) => (
                  <div key={line} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, flexShrink: 0,
                      color: active === i ? 'rgba(183,255,97,0.5)' : 'rgba(255,255,255,0.1)',
                      transition: 'color 300ms ease',
                    }}>—</span>
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12,
                      color: active === i ? '#aab8b1' : '#2a3a32',
                      lineHeight: 1, margin: 0, whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      transition: 'color 300ms ease',
                    }}>
                      {line}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Art: RIGHT ── */}
            <div style={{
              width: '45%', background: 'rgba(11,16,20,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
              opacity: active === i ? 1 : 0.15,
              transition: 'opacity 400ms ease',
            }}>
              <IsometricScene scene={step.scene} />
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
