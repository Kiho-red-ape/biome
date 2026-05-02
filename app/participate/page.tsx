import { SiteHeader } from '@/components/nav/header';
import Link from 'next/link';
import { IsometricScene } from '@/components/illustrations/IsometricScene';

type JScene = 'approve' | 'track' | 'design' | 'collect' | 'pay';

const STEPS: Array<{
  num: string; label: string; scene: JScene;
  headline: string; desc: string;
}> = [
  {
    num: '01', label: 'VERIFY', scene: 'approve',
    headline: 'Build your research partner profile.',
    desc: 'Email and demographics. Optional phone verification for higher-value studies.',
  },
  {
    num: '02', label: 'MATCH', scene: 'track',
    headline: 'Get matched to relevant studies.',
    desc: 'When a study fits your profile, you receive a notification. No searching required.',
  },
  {
    num: '03', label: 'APPLY', scene: 'design',
    headline: 'Apply in one step.',
    desc: 'Eligibility check. One-click application. The researcher reviews and approves.',
  },
  {
    num: '04', label: 'CONTRIBUTE', scene: 'collect',
    headline: 'Complete your milestones.',
    desc: 'Follow the study protocol from home. Submit on time. Track your progress.',
  },
  {
    num: '05', label: 'EARN', scene: 'pay',
    headline: 'Receive your compensation.',
    desc: 'Compliance-gated reimbursement released when your milestones are verified.',
  },
];

export default function ParticipatePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#050709' }}>
      <SiteHeader />

      {/* ── Hero ── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) 24px 64px' }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
          color: '#b7ff61', textTransform: 'uppercase', marginBottom: 20,
        }}>
          // JOIN_THE_NETWORK
        </p>
        <h1 style={{
          fontFamily: 'var(--font-heading)', fontWeight: 700,
          fontSize: 'clamp(26px, 4vw, 40px)', lineHeight: 1.15,
          color: '#f2faf4', marginBottom: 8,
        }}>
          Join your part of the<br />new clinical economy.
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a',
          letterSpacing: '0.5px', marginBottom: 24,
        }}>
          Join the founding cohort of research partners.
        </p>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 13, color: '#aab8b1',
          lineHeight: 1.9, marginBottom: 36, maxWidth: 520,
        }}>
          Biome runs decentralised studies in microbiome, nutrition, sleep,
          wearables, and longevity. Research partners complete milestones from
          home and receive compensation on completion.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/onboarding?role=participant" className="btn-primary" style={{ display: 'inline-flex' }}>
            Create your profile →
          </Link>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5b8a9a', margin: 0 }}>
            Already a member?{' '}
            <Link href="/dashboard" style={{ color: '#b7ff61', textDecoration: 'none' }}>Sign in →</Link>
          </p>
        </div>
      </section>

      {/* ── How it works — scroll carousel ── */}
      <section style={{ overflow: 'hidden', paddingBottom: 80 }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
          color: '#b7ff61', textTransform: 'uppercase', marginBottom: 32,
          paddingLeft: 'clamp(16px, 5vw, 80px)',
        }}>
          // HOW_IT_WORKS
        </p>
        <div
          className="participate-track"
          style={{
            display: 'flex', gap: 20, overflowX: 'scroll',
            scrollSnapType: 'x mandatory', scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingLeft: 'clamp(16px, 5vw, 80px)',
            paddingRight: 'clamp(16px, 5vw, 80px)',
            paddingBottom: 8,
          }}
        >
          {STEPS.map((step) => (
            <div
              key={step.num}
              style={{
                scrollSnapAlign: 'start', flexShrink: 0, width: 320,
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 4, display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Illustration */}
              <div style={{
                height: 180, flexShrink: 0, overflow: 'hidden',
                background: 'rgba(11,16,20,0.6)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IsometricScene scene={step.scene} style={{ width: 280, aspectRatio: '4/3' }} />
              </div>

              {/* Content */}
              <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px',
                  color: '#b7ff61', textTransform: 'uppercase', margin: 0,
                }}>
                  {step.num} {step.label}
                </p>
                <p style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 700,
                  fontSize: 15, color: '#f2faf4', lineHeight: 1.3, margin: 0,
                }}>
                  {step.headline}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5b8a9a', lineHeight: 1.7, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        <style>{`.participate-track::-webkit-scrollbar { display: none; }`}</style>
      </section>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Your data ── */}
        <section style={{ marginBottom: 80, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 64 }}>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px',
            color: '#b7ff61', textTransform: 'uppercase', marginBottom: 24,
          }}>
            // YOUR_DATA
          </p>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(18px, 2.5vw, 24px)',
            color: '#f2faf4', marginBottom: 24, lineHeight: 1.2,
          }}>
            Your data. Your choice.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              'You decide which studies you apply to — no auto-enrolment.',
              'Identifiable information is never shared with researchers without your consent.',
              'Profile data is used only for study matching — never sold.',
              'You can delete your account at any time.',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(183,255,97,0.4)', flexShrink: 0, marginTop: 2 }}>—</span>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#aab8b1', lineHeight: 1.7, margin: 0 }}>{item}</p>
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
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5b8a9a', lineHeight: 1.7 }}>
            Questions?{' '}
            <a href="mailto:contact@biome.to" style={{ color: '#aab8b1', textDecoration: 'none' }}>contact@biome.to</a>
          </p>
        </section>

      </div>
    </main>
  );
}
