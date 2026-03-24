'use client';

import { useState } from 'react';
import Link from 'next/link';

const REGIONS = [
  'Global / Remote', 'North America', 'Europe', 'South Asia', 'East Asia',
  'Southeast Asia', 'Latin America', 'Africa', 'Middle East', 'Oceania',
];

const INTERESTS = [
  'Any type', 'Microbiome', 'Nutrition', 'Sleep', 'Wearables', 'Longevity', 'Quantified-self',
];

export function CtaBlock() {
  const [email,    setEmail]    = useState('');
  const [region,   setRegion]   = useState('');
  const [interest, setInterest] = useState('');
  const [status,   setStatus]   = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setStatus('sending');
    try {
      const res = await fetch('/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams(new FormData(e.currentTarget) as unknown as Record<string, string>).toString(),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const inputStyle = {
    background: 'var(--bg3)',
    border: '1px solid rgba(77,255,128,0.14)',
    color: 'var(--text-bright)',
    outline: 'none',
    width: '100%',
    padding: '8px 12px',
    borderRadius: 4,
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
  } as const;

  const labelStyle = {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.18em',
    color: 'var(--text-dim)',
    marginBottom: 5,
    textTransform: 'uppercase' as const,
  };

  return (
    <section className="px-4 md:px-8 pb-20 pt-2">
      <div className="grid md:grid-cols-2 gap-4">

        {/* ── LEFT: Notify me ── */}
        <div
          className="rounded p-6 flex flex-col"
          style={{
            background: 'var(--bg2)',
            border: '1px solid rgba(77,255,128,0.1)',
            borderTop: '1px solid rgba(183,255,97,0.25)',
            boxShadow: 'inset 0 1px 0 rgba(183,255,97,0.08)',
          }}
        >
          {/* Eyebrow */}
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--text-dim)', marginBottom: 8 }}>
            // NOTIFY_ME
          </p>

          <h2
            className="font-black leading-snug mb-3"
            style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)', fontSize: 'clamp(18px, 3vw, 22px)' }}
          >
            Get notified when experiments open near you.
          </h2>

          <p className="mb-6 leading-relaxed" style={{ fontSize: 14, color: 'var(--text-dim)' }}>
            Choose your region and interests so we can send you relevant alerts when new
            experiments, trials, and paid research studies become available near you or online.
          </p>

          {status === 'done' ? (
            <p className="mono" style={{ color: '#b7ff61', fontSize: 13 }}>
              ✓ You&apos;re on the list. We&apos;ll notify you when relevant experiments open.
            </p>
          ) : (
            <form
              name="waitlist"
              method="POST"
              data-netlify="true"
              onSubmit={(e) => void handleSubmit(e)}
              className="flex flex-col gap-3"
            >
              <input type="hidden" name="form-name" value="waitlist" />

              <div>
                <label style={labelStyle}>EMAIL</label>
                <input type="email" name="email" required placeholder="you@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>REGION</label>
                <select name="region" value={region} onChange={(e) => setRegion(e.target.value)} style={inputStyle}>
                  <option value="">Select region</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>INTERESTS</label>
                <select name="interest" value={interest} onChange={(e) => setInterest(e.target.value)} style={inputStyle}>
                  {INTERESTS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {status === 'error' && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber)' }}>
                  Something went wrong. Try again.
                </p>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="submit"
                  disabled={status === 'sending' || !email}
                  className="flex-1 font-bold rounded transition-all disabled:opacity-40"
                  style={{
                    background: '#b7ff61', color: '#050709',
                    fontFamily: 'var(--font-mono)', fontSize: 12, padding: '10px 16px',
                    transition: 'transform 150ms ease, opacity 150ms ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  {status === 'sending' ? 'SENDING…' : 'ENABLE NOTIFICATIONS →'}
                </button>
                <Link
                  href="/onboarding"
                  className="no-underline rounded font-bold"
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 12, padding: '10px 16px',
                    border: '1px solid rgba(77,255,128,0.2)', color: 'var(--text-dim)',
                    transition: 'transform 150ms ease, opacity 150ms ease',
                    display: 'flex', alignItems: 'center',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  CREATE PROFILE →
                </Link>
              </div>

              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.6 }}>
                Creating your BIOME profile helps you get matched with relevant paid studies
                and research opportunities.
              </p>
            </form>
          )}
        </div>

        {/* ── RIGHT: For researchers ── */}
        <div
          className="rounded p-6 flex flex-col justify-between"
          style={{
            background: 'var(--bg2)',
            border: '1px solid rgba(77,255,128,0.1)',
            borderTop: '1px solid rgba(0,229,255,0.2)',
            boxShadow: 'inset 0 1px 0 rgba(0,229,255,0.06)',
          }}
        >
          <div>
            {/* Eyebrow */}
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'var(--text-dim)', marginBottom: 8 }}>
              // FOR_RESEARCHERS
            </p>

            <h2
              className="font-black leading-snug mb-3"
              style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)', fontSize: 'clamp(18px, 3vw, 22px)' }}
            >
              Post studies and recruit participants.
            </h2>

            <p className="leading-relaxed mb-8" style={{ fontSize: 14, color: 'var(--text-dim)' }}>
              We help you recruit screened participants for health studies, remote trials, product
              testing, and observational research. Define eligibility, review matched applicants,
              and enroll qualified participants faster.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/onboarding?role=experimenter"
              className="no-underline font-bold rounded text-center"
              style={{
                background: '#b7ff61', color: '#050709',
                fontFamily: 'var(--font-mono)', fontSize: 12, padding: '11px 20px',
                transition: 'transform 150ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              SIGN UP AS RESEARCHER →
            </Link>

            <a
              href="mailto:kishore@biome.to"
              className="no-underline"
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--text-dim)', textAlign: 'center',
                borderTop: '1px solid rgba(77,255,128,0.06)', paddingTop: 12,
              }}
            >
              Need help designing your study?{' '}
              <span style={{ color: 'var(--cyan)', textDecoration: 'underline' }}>Talk to us →</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
