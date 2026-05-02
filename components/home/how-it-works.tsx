'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { IsometricScene } from '@/components/illustrations/IsometricScene';

type Scene = 'recruit' | 'collect' | 'track' | 'pay' | 'deliver';

const STEPS: Array<{
  num: string; label: string; scene: Scene; headline: string; desc: string[];
}> = [
  {
    num: '01', label: 'RECRUIT', scene: 'recruit',
    headline: 'The right people,\nnot just any people.',
    desc: [
      'Targeted recruitment campaigns built per study.',
      'Eligibility screening against your exact criteria.',
      'Verified enrollment with informed consent capture.',
    ],
  },
  {
    num: '02', label: 'COLLECT', scene: 'collect',
    headline: 'Samples shipped.\nTracked. Logged.',
    desc: [
      'Kits dispatched to participants globally.',
      'Stool, saliva, blood spot, urine, wearable data.',
      'Partner phlebotomy for blood draws.',
    ],
  },
  {
    num: '03', label: 'TRACK', scene: 'track',
    headline: 'Compliance monitored.\nDropouts flagged.',
    desc: [
      'Milestone-based protocol adherence tracking.',
      'Automated reminders. Real-time dropout alerts.',
      'Weekly sponsor reports with compliance rates.',
    ],
  },
  {
    num: '04', label: 'PAY', scene: 'pay',
    headline: 'Compliant payouts.\nFull audit trail.',
    desc: [
      'Stripe Connect to participants in 220+ countries.',
      'Payments gate on milestone completion.',
      'Transparent pass-through — no CRO-style markup.',
    ],
  },
  {
    num: '05', label: 'DELIVER', scene: 'deliver',
    headline: 'Clean data out.\nAudit bundle included.',
    desc: [
      'Structured data export with chain-of-custody log.',
      'Consent records, comms log, payout summary.',
      'Compliance bundle ready for sponsor archive.',
    ],
  },
];

export function HowItWorks() {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const trackRect = track.getBoundingClientRect();
      const center    = trackRect.left + trackRect.width / 2;
      let closest = 0;
      let minDist = Infinity;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const rect       = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const dist       = Math.abs(center - cardCenter);
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
    const trackRect = track.getBoundingClientRect();
    const cardRect  = card.getBoundingClientRect();
    const offset    = cardRect.left - trackRect.left - (trackRect.width - cardRect.width) / 2;
    track.scrollBy({ left: offset, behavior: 'smooth' });
  }, []);

  return (
    <section style={{ paddingTop: 96, paddingBottom: 96, overflow: 'hidden' }}>

      {/* Section label */}
      <p style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      10,
        letterSpacing: '3px',
        color:         '#b7ff61',
        textTransform: 'uppercase',
        marginBottom:  40,
        paddingLeft:   'clamp(16px, 5vw, 80px)',
      }}>
        // HOW_IT_WORKS
      </p>

      {/* Step nav pills */}
      <div style={{
        display:      'flex',
        gap:          8,
        marginBottom: 40,
        paddingLeft:  'clamp(16px, 5vw, 80px)',
        flexWrap:     'wrap',
      }}>
        {STEPS.map((step, i) => (
          <button
            key={step.num}
            onClick={() => scrollTo(i)}
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      10,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              padding:       '6px 16px',
              border:        `1px solid ${active === i ? '#b7ff61' : 'rgba(255,255,255,0.08)'}`,
              background:    active === i ? 'rgba(183,255,97,0.07)' : 'transparent',
              color:         active === i ? '#b7ff61' : '#5b8a9a',
              borderRadius:  2,
              cursor:        'pointer',
              transition:    'all 150ms ease',
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
          display:                 'flex',
          gap:                     24,
          overflowX:               'scroll',
          scrollSnapType:          'x mandatory',
          scrollbarWidth:          'none',
          WebkitOverflowScrolling: 'touch',
          paddingLeft:             'clamp(16px, 5vw, 80px)',
          paddingRight:            'clamp(16px, 5vw, 80px)',
          paddingBottom:           8,
          cursor:                  'grab',
        }}
      >
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            ref={(el) => { cardRefs.current[i] = el; }}
            style={{
              scrollSnapAlign: 'center',
              flexShrink:      0,
              width:           'clamp(320px, 88vw, 860px)',
              minHeight:       340,
              background:      active === i ? 'rgba(183,255,97,0.03)'   : 'rgba(255,255,255,0.015)',
              border:          `1px solid ${active === i ? 'rgba(183,255,97,0.18)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius:    4,
              padding:         'clamp(32px, 4vw, 48px)',
              position:        'relative',
              overflow:        'hidden',
              transition:      'border-color 300ms ease, background 300ms ease',
              display:         'flex',
              alignItems:      'center',
              gap:             32,
            }}
          >
            {/* Faded background number */}
            <div style={{
              position:    'absolute',
              top:         -20,
              left:        20,
              fontFamily:  'var(--font-heading)',
              fontWeight:  800,
              fontSize:    160,
              lineHeight:  1,
              color:       active === i ? 'rgba(183,255,97,0.05)' : 'rgba(255,255,255,0.025)',
              pointerEvents: 'none',
              userSelect:  'none',
              transition:  'color 300ms ease',
            }}>
              {step.num}
            </div>

            {/* Text section */}
            <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
              {/* Label */}
              <p style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      10,
                letterSpacing: '3px',
                color:         active === i ? '#b7ff61' : '#5b8a9a',
                textTransform: 'uppercase',
                marginBottom:  20,
                transition:    'color 300ms ease',
              }}>
                {step.label}
              </p>

              {/* Headline */}
              <h3 style={{
                fontFamily:   'var(--font-heading)',
                fontWeight:   700,
                fontSize:     'clamp(24px, 3vw, 36px)',
                lineHeight:   1.15,
                color:        '#f2faf4',
                marginBottom: 28,
                whiteSpace:   'pre-line',
              }}>
                {step.headline}
              </h3>

              {/* Description bullets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {step.desc.map((line) => (
                  <div key={line} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{
                      fontFamily:  'var(--font-mono)',
                      fontSize:    11,
                      color:       active === i ? 'rgba(183,255,97,0.5)' : 'rgba(255,255,255,0.12)',
                      flexShrink:  0,
                      marginTop:   2,
                      transition:  'color 300ms ease',
                    }}>
                      —
                    </span>
                    <p style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize:   13,
                      color:      active === i ? '#aab8b1' : '#5b8a9a',
                      lineHeight: 1.7,
                      margin:     0,
                      transition: 'color 300ms ease',
                    }}>
                      {line}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Illustration — hidden on small screens */}
            <div
              className="hidden sm:block"
              style={{
                flexShrink: 0,
                width:      'clamp(140px, 22%, 220px)',
                opacity:    active === i ? 0.75 : 0.2,
                transition: 'opacity 400ms ease',
              }}
            >
              <IsometricScene scene={step.scene} />
            </div>
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      <p style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      10,
        color:         '#5b8a9a',
        letterSpacing: '1px',
        textAlign:     'center',
        marginTop:     24,
      }}>
        ← scroll or tap pill to navigate →
      </p>

      {/* Hide scrollbar cross-browser */}
      <style>{`
        div[style*="overflowX: scroll"]::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
