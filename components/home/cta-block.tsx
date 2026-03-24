'use client';

import { useState } from 'react';

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

function FocusInput({ type = 'text', placeholder, options }: {
  type?: string;
  placeholder?: string;
  options?: string[];
}) {
  const [focused, setFocused] = useState(false);
  const style = {
    ...INPUT_STYLE,
    borderColor: focused ? 'rgba(183,255,97,0.35)' : 'rgba(255,255,255,0.09)',
    boxShadow: focused ? '0 0 8px rgba(183,255,97,0.08)' : 'none',
  };

  if (options) {
    return (
      <select
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
      type={type}
      placeholder={placeholder}
      style={style}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export function CtaBlock() {
  return (
    <section style={{ padding: '0 40px 48px' }}>

      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        marginTop: 28, marginBottom: 20,
      }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
      </div>

      <div style={{ display: 'flex', gap: 16 }}>

        {/* ── Left: NOTIFY_ME ── */}
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
            Get notified when experiments open near you.
          </h2>
          <p style={{
            fontFamily: 'var(--font-heading)', fontSize: 14, color: '#7f8e87',
            lineHeight: 1.65, marginBottom: 20,
          }}>
            Choose your region and interests so we can send you relevant alerts when new
            experiments, trials, and paid research studies become available near you or online.
          </p>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={LABEL_STYLE}>Email</label>
              <FocusInput type="email" placeholder="your@email.com" />
            </div>
            <div>
              <label style={LABEL_STYLE}>Region</label>
              <FocusInput
                options={['Remote / Online', 'South Asia', 'Southeast Asia', 'Europe', 'North America', 'Other']}
                placeholder="Select region"
              />
            </div>
            <div>
              <label style={LABEL_STYLE}>Interests</label>
              <FocusInput
                options={['All studies', 'Microbiome', 'Nutrition', 'Sleep', 'Wearables', 'Longevity', 'Quantified Self']}
                placeholder="Select interest"
              />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="btn-primary" style={{ flex: 1 }}>Enable notifications →</button>
            <button className="btn-ghost" style={{ flex: 1 }}>Create profile →</button>
          </div>

          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', lineHeight: 1.5,
          }}>
            Creating your BIOME profile helps you get matched with relevant paid studies and research opportunities.
          </p>
        </div>

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

          <a
            href="/onboarding?role=experimenter"
            className="btn-primary"
            style={{ display: 'flex', width: '100%', marginBottom: 16, justifyContent: 'center' }}
          >
            Sign up as researcher →
          </a>

          <a
            href="mailto:kishore@biome.to"
            style={{
              display: 'block', textAlign: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055',
              textDecoration: 'none', letterSpacing: '0.5px',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#7f8e87'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#4a7055'; }}
          >
            Need help designing your study? Talk to us →
          </a>
        </div>

      </div>
    </section>
  );
}
