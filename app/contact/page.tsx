'use client';

import { useState } from 'react';
import Link from 'next/link';

const INPUT_BASE: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border-soft)',
  color: 'var(--ink)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  padding: '10px 14px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
  borderRadius: 'var(--radius-sm)',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
};

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color: 'var(--slate)',
  display: 'block',
  marginBottom: 6,
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={LABEL}>{label}</label>
      {children}
    </div>
  );
}

function FocusInput({
  name,
  type = 'text',
  placeholder,
  required,
}: {
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      required={required}
      style={{
        ...INPUT_BASE,
        borderColor: focused ? 'var(--teal)' : 'var(--border-soft)',
        boxShadow:   focused ? '0 0 0 3px var(--teal-faint)' : 'none',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function FocusSelect({
  name,
  options,
  placeholder,
  required,
}: {
  name: string;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      name={name}
      required={required}
      defaultValue=""
      style={{
        ...INPUT_BASE,
        appearance: 'none',
        borderColor: focused ? 'var(--teal)' : 'var(--border-soft)',
        boxShadow:   focused ? '0 0 0 3px var(--teal-faint)' : 'none',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <option value="" disabled>{placeholder ?? 'Select…'}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function FocusTextarea({
  name,
  placeholder,
  rows = 4,
  required,
}: {
  name: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      name={name}
      placeholder={placeholder}
      rows={rows}
      required={required}
      style={{
        ...INPUT_BASE,
        resize: 'vertical',
        borderColor: focused ? 'var(--teal)' : 'var(--border-soft)',
        boxShadow:   focused ? '0 0 0 3px var(--teal-faint)' : 'none',
        lineHeight: 1.6,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ContactPage() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('loading');
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setState('done');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>

      {/* Mini nav */}
      <header className="px-4 sm:px-10" style={{
        position: 'sticky', top: 0, zIndex: 200,
        height: 52, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-soft)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '2px',
          color: 'var(--teal-dark)', textDecoration: 'none',
        }}>
          ← Biome
        </Link>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px', color: 'var(--muted)' }}>
          Contact
        </span>
      </header>

      <div className="px-4 sm:px-10" style={{ maxWidth: 640, margin: '0 auto', paddingTop: 48, paddingBottom: 48 }}>

        {/* Header */}
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '4px',
          textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 8,
        }}>
          Get in touch
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700,
          color: 'var(--ink)', marginBottom: 8, lineHeight: 1.15,
        }}>
          Talk to us about your study.
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate)',
          lineHeight: 1.6, marginBottom: 36,
        }}>
          Tell us about your research and what you need. We&apos;ll get back to you within
          1–2 business days.
        </p>

        <div style={{ height: 1, background: 'var(--border-soft)', marginBottom: 36 }} />

        {state === 'done' ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 32, color: 'var(--teal)', marginBottom: 12 }}>✓</p>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
              color: 'var(--ink)', marginBottom: 8,
            }}>
              Message received.
            </h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 24 }}>
              We&apos;ll be in touch within 1–2 business days.
            </p>
            <Link href="/" className="btn-ghost" style={{ display: 'inline-flex' }}>
              ← Back to Biome
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Name">
                  <FocusInput name="name" placeholder="Your name" required />
                </Field>
                <Field label="Email">
                  <FocusInput name="email" type="email" placeholder="you@org.com" required />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Organization">
                  <FocusInput name="organization" placeholder="University / Company / Organization" required />
                </Field>
                <Field label="Website or LinkedIn">
                  <FocusInput name="website" type="url" placeholder="https://…" />
                </Field>
              </div>

              <Field label="Your role">
                <FocusSelect
                  name="role"
                  required
                  placeholder="Select your role"
                  options={[
                    'Academic researcher',
                    'Startup / Biotech',
                    'Pharmaceutical',
                    'Independent researcher',
                    'Other',
                  ]}
                />
              </Field>

              <Field label="Study details">
                <FocusTextarea
                  name="study_detail"
                  rows={4}
                  required
                  placeholder="Describe your study — type, duration, interventions, what you're measuring…"
                />
              </Field>

              <Field label="How can we help?">
                <FocusTextarea
                  name="help_needed"
                  rows={3}
                  required
                  placeholder="Research partner recruitment, study design review, Biome Verified credential, other…"
                />
              </Field>

              {state === 'error' && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#d97706' }}>
                  Something went wrong. Please try again or email us directly.
                </p>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={state === 'loading'}
                style={{ width: '100%' }}
              >
                {state === 'loading' ? 'Sending…' : 'Send message →'}
              </button>

            </div>
          </form>
        )}

      </div>
    </main>
  );
}
