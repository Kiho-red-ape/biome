'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

const INPUT_STYLE: React.CSSProperties = {
  background: '#050709',
  border: '1px solid rgba(255,255,255,0.09)',
  color: '#eef4f0',
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
  padding: '10px 14px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
  borderRadius: 0,
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
};

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color: '#4a7055',
  display: 'block',
  marginBottom: 6,
};

const PANEL_STYLE: React.CSSProperties = {
  background: '#0b1014',
  border: '1px solid rgba(255,255,255,0.07)',
  padding: 28,
  borderRadius: 2,
  flex: 1,
};

function FocusInput({
  inputRef,
  type = 'text',
  placeholder,
  options,
}: {
  inputRef?: React.Ref<HTMLInputElement | HTMLSelectElement>;
  type?: string;
  placeholder?: string;
  options?: string[];
}) {
  const [focused, setFocused] = useState(false);
  const style = {
    ...INPUT_STYLE,
    borderColor: focused ? 'rgba(183,255,97,0.35)' : 'rgba(255,255,255,0.09)',
    boxShadow:   focused ? '0 0 8px rgba(183,255,97,0.08)' : 'none',
  };

  if (options) {
    return (
      <select
        ref={inputRef as React.Ref<HTMLSelectElement>}
        style={{ ...style, appearance: 'none' }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        defaultValue=""
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  return (
    <input
      ref={inputRef as React.Ref<HTMLInputElement>}
      type={type}
      placeholder={placeholder}
      style={style}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ─── NOTIFY_ME panel ──────────────────────────────────────────────────────────

function NotifyPanel() {
  const emailRef  = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const regionRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const intRef    = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');

  async function handleSubmit() {
    const email  = (emailRef.current as HTMLInputElement)?.value?.trim();
    const region = (regionRef.current as HTMLSelectElement)?.value;
    const interest = (intRef.current as HTMLSelectElement)?.value;
    if (!email) return;
    setState('loading');
    try {
      await fetch('/api/notify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, region, interest }),
      });
    } catch {
      // fail silently — still show success
    }
    setState('done');
  }

  if (state === 'done') {
    return (
      <div style={PANEL_STYLE}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          textTransform: 'uppercase', letterSpacing: '3px',
          color: '#b7ff61', marginBottom: 12,
        }}>
          // NOTIFY_ME
        </p>
        <div style={{
          padding: '32px 0', textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: '#b7ff61', marginBottom: 8 }}>✓</p>
          <p style={{
            fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700,
            color: '#eef4f0', marginBottom: 8,
          }}>
            You&apos;re on the list.
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055' }}>
            We&apos;ll notify you when relevant studies open near you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={PANEL_STYLE}>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '3px',
        color: '#b7ff61', marginBottom: 12,
      }}>
        // NOTIFY_ME
      </p>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700,
        color: '#eef4f0', marginBottom: 10, lineHeight: 1.25,
      }}>
        Get notified when studies open near you.
      </h2>
      <p style={{
        fontFamily: 'var(--font-heading)', fontSize: 14, color: '#7f8e87',
        lineHeight: 1.65, marginBottom: 20,
      }}>
        Choose your region and interests so we can send you relevant alerts when new
        studies, trials, and paid research opportunities become available near you or online.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={LABEL_STYLE}>Email</label>
          <FocusInput inputRef={emailRef} type="email" placeholder="your@email.com" />
        </div>
        <div>
          <label style={LABEL_STYLE}>Region</label>
          <FocusInput
            inputRef={regionRef}
            options={['Remote / Online', 'South Asia', 'Southeast Asia', 'Europe', 'North America', 'Other']}
            placeholder="Select region"
          />
        </div>
        <div>
          <label style={LABEL_STYLE}>Interests</label>
          <FocusInput
            inputRef={intRef}
            options={['All studies', 'Microbiome', 'Nutrition', 'Sleep', 'Wearables', 'Longevity', 'Quantified Self']}
            placeholder="Select interest"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          className="btn-primary"
          style={{ flex: 1 }}
          disabled={state === 'loading'}
          onClick={() => void handleSubmit()}
        >
          {state === 'loading' ? 'Saving…' : 'Enable notifications →'}
        </button>
        <Link href="/onboarding" className="btn-ghost" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Create profile →
        </Link>
      </div>

      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', lineHeight: 1.5 }}>
        Creating your BIOME profile helps you get matched with relevant paid studies and research opportunities.
      </p>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function CtaBlock() {
  return (
    <section style={{ padding: '0 40px 48px' }}>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginTop: 28, marginBottom: 20,
      }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
      </div>

      <div style={{ display: 'flex', gap: 16 }}>

        <NotifyPanel />

        {/* ── Right: FOR_RESEARCHERS ── */}
        <div style={PANEL_STYLE}>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '3px',
            color: '#b7ff61', marginBottom: 12,
          }}>
            // FOR_RESEARCHERS
          </p>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700,
            color: '#eef4f0', marginBottom: 10, lineHeight: 1.25,
          }}>
            Post studies and recruit participants.
          </h2>
          <p style={{
            fontFamily: 'var(--font-heading)', fontSize: 14, color: '#7f8e87',
            lineHeight: 1.65, marginBottom: 28,
          }}>
            We help you recruit screened participants for health studies, remote trials,
            product testing, and observational research. Define eligibility, review matched
            applicants, and enroll qualified participants faster.
          </p>

          <Link
            href="/onboarding?role=experimenter"
            className="btn-primary"
            style={{ display: 'flex', width: '100%', marginBottom: 16, justifyContent: 'center' }}
          >
            Sign up as researcher →
          </Link>

          <Link
            href="/contact"
            className="hover-green"
            style={{
              display: 'block', textAlign: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 10,
              letterSpacing: '0.5px', marginBottom: 10,
            }}
          >
            Need help designing your study? Talk to us →
          </Link>
        </div>

      </div>
    </section>
  );
}
