'use client';

import { useState, useRef } from 'react';

const INPUT: React.CSSProperties = {
  width:        '100%',
  background:   '#0b1014',
  border:       '1px solid rgba(255,255,255,0.09)',
  color:        '#f8fafc',
  fontFamily:   'var(--font-mono)',
  fontSize:     13,
  padding:      '10px 14px',
  outline:      'none',
  borderRadius: 2,
  boxSizing:    'border-box',
  transition:   'border-color 150ms ease',
};

const LABEL: React.CSSProperties = {
  display:       'block',
  fontFamily:    'var(--font-mono)',
  fontSize:      10,
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color:         '#475569',
  marginBottom:  6,
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={LABEL}>
        {label}{required && <span style={{ color: '#f59e0b', marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function FocusInput({
  inputRef, type = 'text', placeholder, required,
}: {
  inputRef: React.Ref<HTMLInputElement>;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      ref={inputRef}
      type={type}
      placeholder={placeholder}
      required={required}
      style={{ ...INPUT, borderColor: focused ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.09)' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function FocusSelect({
  selectRef, options, placeholder, required,
}: {
  selectRef: React.Ref<HTMLSelectElement>;
  options: string[];
  placeholder: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      ref={selectRef}
      required={required}
      defaultValue=""
      style={{ ...INPUT, appearance: 'none', borderColor: focused ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.09)' }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function FocusTextarea({ textareaRef, placeholder, required }: {
  textareaRef: React.Ref<HTMLTextAreaElement>;
  placeholder?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      ref={textareaRef}
      placeholder={placeholder}
      required={required}
      rows={3}
      maxLength={300}
      style={{
        ...INPUT, resize: 'vertical', lineHeight: 1.6,
        borderColor: focused ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.09)',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export function PartnerJoinForm() {
  const nameRef     = useRef<HTMLInputElement>(null);
  const emailRef    = useRef<HTMLInputElement>(null);
  const websiteRef  = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const descRef     = useRef<HTMLTextAreaElement>(null);
  const regionRef   = useRef<HTMLSelectElement>(null);

  const [agreed,     setAgreed]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/partners/apply', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        nameRef.current?.value?.trim() ?? '',
          email:       emailRef.current?.value?.trim() ?? '',
          website:     websiteRef.current?.value?.trim() ?? '',
          category:    categoryRef.current?.value ?? '',
          description: descRef.current?.value?.trim() ?? '',
          region:      regionRef.current?.value ?? '',
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'Submission failed');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Email contact@biome.to directly.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{
        background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)',
        padding: 40, borderRadius: 2,
      }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#f59e0b', marginBottom: 12 }}>✓</p>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: '#f8fafc', marginBottom: 12 }}>
          Application received.
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94a3b8', lineHeight: 1.8, marginBottom: 8 }}>
          We&apos;ll review within 48 hours and send a follow-up email with a link to complete your partner profile — including logo upload and service details.
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
          Questions? <a href="mailto:contact@biome.to" style={{ color: '#94a3b8', textDecoration: 'none' }}>contact@biome.to</a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <Field label="Organization name" required>
        <FocusInput inputRef={nameRef} placeholder="Your company name" required />
      </Field>
      <Field label="Contact email" required>
        <FocusInput inputRef={emailRef} type="email" placeholder="you@example.com" required />
      </Field>
      <Field label="Website">
        <FocusInput inputRef={websiteRef} type="url" placeholder="https://" />
      </Field>
      <Field label="Category" required>
        <FocusSelect
          selectRef={categoryRef}
          placeholder="Select category"
          required
          options={[
            'Testing Laboratory',
            'CRO',
            'IRB / Ethics Board',
            'Marketing Agency',
            'Research Institution',
            'University',
            'Clinical Professional',
            'Pharma Company',
            'Wellness / Supplement Brand',
            'Startup',
            'Other',
          ]}
        />
      </Field>
      <Field label="Services offered (max 300 chars)" required>
        <FocusTextarea
          textareaRef={descRef}
          placeholder="Describe what you offer in 1–2 sentences."
          required
        />
      </Field>
      <Field label="Region" required>
        <FocusSelect
          selectRef={regionRef}
          placeholder="Select region"
          required
          options={['India', 'United States', 'United Kingdom', 'EU', 'Australia', 'Singapore', 'Canada', 'Global', 'Other']}
        />
      </Field>

      {/* Agreement */}
      <div style={{
        background: '#0b1014', border: '1px solid rgba(255,255,255,0.07)',
        padding: '14px 16px', borderRadius: 2, marginBottom: 24,
      }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
          <div
            onClick={() => setAgreed((a) => !a)}
            style={{
              width: 16, height: 16, flexShrink: 0, marginTop: 1,
              background: agreed ? '#f59e0b' : 'transparent',
              border: `1px solid ${agreed ? '#f59e0b' : 'rgba(245,158,11,0.3)'}`,
              borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {agreed && <span style={{ color: '#060a14', fontSize: 10, fontWeight: 900 }}>✓</span>}
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
            I agree to Biome&apos;s Partner Terms.
          </span>
        </label>
      </div>

      {error && (
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ffb300',
          background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.2)',
          padding: '10px 14px', marginBottom: 16, borderRadius: 2,
        }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !agreed}
        className="btn-primary"
        style={{ width: '100%', opacity: !agreed ? 0.4 : 1 }}
      >
        {submitting ? 'Sending…' : 'Submit application →'}
      </button>
    </form>
  );
}
