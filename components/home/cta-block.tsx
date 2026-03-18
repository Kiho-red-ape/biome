'use client';

import { useState } from 'react';

const REGIONS = [
  'Global / Remote', 'North America', 'Europe', 'South Asia', 'East Asia',
  'Southeast Asia', 'Latin America', 'Africa', 'Middle East', 'Oceania',
];

const INTERESTS = [
  'Any type', 'Microbiome', 'Diet & Nutrition', 'Sleep', 'Psychedelics',
  'Fitness & Performance', 'Longevity', 'Neuroscience', 'Metabolomics',
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
      const form = e.currentTarget;
      const body = new FormData(form);
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(body as unknown as Record<string, string>).toString(),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="px-4 md:px-6 pb-16 pt-4">
      <div className="grid md:grid-cols-2 gap-4">

        {/* ── LEFT: Waitlist form ── */}
        <div
          className="rounded p-6 flex flex-col"
          style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.1)' }}
        >
          <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>
            // NOTIFY_ME
          </p>
          <h2
            className="text-lg font-black mb-2 leading-snug"
            style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}
          >
            Get notified when experiments open near you.
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
            Tell Biome where you are and what you care about. Fewer irrelevant messages,
            tighter matching, faster screening.
          </p>

          {status === 'done' ? (
            <div className="flex-1 flex items-center">
              <p className="mono text-sm" style={{ color: 'var(--green)' }}>
                ✓ You&apos;re on the list. We&apos;ll notify you when relevant experiments open.
              </p>
            </div>
          ) : (
            /* Netlify form — the hidden form-name field makes Netlify detect this at build time */
            <form
              name="waitlist"
              method="POST"
              data-netlify="true"
              onSubmit={handleSubmit}
              className="flex flex-col gap-3"
            >
              <input type="hidden" name="form-name" value="waitlist" />

              {/* Email */}
              <div>
                <label className="mono text-xs block mb-1.5" style={{ color: 'var(--text-dim)' }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full px-3 py-2 rounded mono text-sm outline-none"
                  style={{
                    background: 'var(--bg3)',
                    border: '1px solid rgba(77,255,128,0.15)',
                    color: 'var(--text-bright)',
                  }}
                />
              </div>

              {/* Region */}
              <div>
                <label className="mono text-xs block mb-1.5" style={{ color: 'var(--text-dim)' }}>
                  REGION
                </label>
                <select
                  name="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded mono text-sm outline-none cursor-pointer"
                  style={{
                    background: 'var(--bg3)',
                    border: '1px solid rgba(77,255,128,0.15)',
                    color: region ? 'var(--text-bright)' : 'var(--text-dim)',
                  }}
                >
                  <option value="">Select region</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Interests */}
              <div>
                <label className="mono text-xs block mb-1.5" style={{ color: 'var(--text-dim)' }}>
                  INTERESTS
                </label>
                <select
                  name="interest"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  className="w-full px-3 py-2 rounded mono text-sm outline-none cursor-pointer"
                  style={{
                    background: 'var(--bg3)',
                    border: '1px solid rgba(77,255,128,0.15)',
                    color: interest ? 'var(--text-bright)' : 'var(--text-dim)',
                  }}
                >
                  <option value="">Any type</option>
                  {INTERESTS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {status === 'error' && (
                <p className="mono text-xs" style={{ color: 'var(--amber)' }}>
                  Something went wrong. Try again.
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending' || !email}
                className="mono text-sm py-2.5 px-5 rounded font-bold transition-all disabled:opacity-40 hover:opacity-90 self-start"
                style={{ background: 'var(--green)', color: '#050709' }}
              >
                {status === 'sending' ? 'Sending...' : 'Notify me →'}
              </button>
            </form>
          )}
        </div>

        {/* ── RIGHT: Brand / researcher panel ── */}
        <div
          className="rounded p-6 flex flex-col justify-between"
          style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.1)' }}
        >
          <div>
            <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>
              // FOR_BRANDS_AND_RESEARCHERS
            </p>
            <h2
              className="text-lg font-black mb-3 leading-snug"
              style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}
            >
              Have a study? We find the right participants.
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-dim)' }}>
              Post an experiment, define your screening criteria, and run the cohort through
              a cleaner application workflow. BIOME handles the participant funnel — you focus
              on the science.
            </p>

            <ul className="flex flex-col gap-2 mb-8">
              {[
                'Screened, verified participant pool',
                'Bounty-based incentive structure',
                'Optional BIOME Verified badge for credibility',
                '2.5% platform fee on completed payouts',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-dim)' }}>
                  <span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/post"
              className="mono text-xs px-5 py-2.5 rounded font-bold no-underline transition-all hover:opacity-90"
              style={{ background: 'var(--green)', color: '#050709' }}
            >
              Post a bounty →
            </a>
            <a
              href="mailto:kishore@biome.to"
              className="mono text-xs px-5 py-2.5 rounded font-bold no-underline transition-all hover:opacity-80"
              style={{ border: '1px solid rgba(77,255,128,0.2)', color: 'var(--text-bright)', background: 'transparent' }}
            >
              Talk to us →
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
