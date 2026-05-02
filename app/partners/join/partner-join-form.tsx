'use client';

import { useState, useRef } from 'react';

const INPUT: React.CSSProperties = {
  width:        '100%',
  background:   '#0b1014',
  border:       '1px solid rgba(255,255,255,0.09)',
  color:        '#f2faf4',
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
  color:         '#5b8a9a',
  marginBottom:  6,
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={LABEL}>
        {label}{required && <span style={{ color: '#b7ff61', marginLeft: 4 }}>*</span>}
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
      style={{ ...INPUT, borderColor: focused ? 'rgba(183,255,97,0.35)' : 'rgba(255,255,255,0.09)' }}
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
      style={{ ...INPUT, appearance: 'none', borderColor: focused ? 'rgba(183,255,97,0.35)' : 'rgba(255,255,255,0.09)' }}
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
        borderColor: focused ? 'rgba(183,255,97,0.35)' : 'rgba(255,255,255,0.09)',
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
  const fileRef     = useRef<HTMLInputElement>(null);

  const [agreed,     setAgreed]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [fileName,   setFileName]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    setSubmitting(true);
    setError(null);

    const file = fileRef.current?.files?.[0];
    if (!file) { setError('Logo is required.'); setSubmitting(false); return; }

    const formData = new FormData();
    formData.append('name',        nameRef.current?.value?.trim() ?? '');
    formData.append('email',       emailRef.current?.value?.trim() ?? '');
    formData.append('website',     websiteRef.current?.value?.trim() ?? '');
    formData.append('category',    categoryRef.current?.value ?? '');
    formData.append('description', descRef.current?.value?.trim() ?? '');
    formData.append('region',      regionRef.current?.value ?? '');
    formData.append('logo',        file);

    try {
      const res = await fetch('/api/partners/apply', { method: 'POST', body: formData });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        throw new Error(d.error ?? 'Submission failed');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Email kishore@biome.to directly.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{
        background: 'rgba(183,255,97,0.04)', border: '1px solid rgba(183,255,97,0.15)',
        padding: 40, borderRadius: 2, textAlign: 'center',
      }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#b7ff61', marginBottom: 12 }}>✓</p>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: '#f2faf4', marginBottom: 8 }}>
          Application received.
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a', lineHeight: 1.7 }}>
          We&apos;ll review within 48 hours.
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

      {/* Logo upload */}
      <div style={{ marginBottom: 20 }}>
        <label style={LABEL}>
          Logo <span style={{ color: '#b7ff61', marginLeft: 4 }}>*</span>
        </label>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5b8a9a', marginBottom: 8, lineHeight: 1.5 }}>
          PNG / JPG / SVG · Square · Max 2MB · 640×640px recommended
        </p>
        <label
          style={{
            display:       'flex',
            alignItems:    'center',
            gap:           12,
            background:    '#0b1014',
            border:        '1px solid rgba(255,255,255,0.09)',
            padding:       '10px 14px',
            borderRadius:  2,
            cursor:        'pointer',
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            required
            style={{ display: 'none' }}
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#b7ff61' }}>
            Choose file
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5b8a9a' }}>
            {fileName ?? 'No file chosen'}
          </span>
        </label>
      </div>

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
              background: agreed ? '#b7ff61' : 'transparent',
              border: `1px solid ${agreed ? '#b7ff61' : 'rgba(183,255,97,0.3)'}`,
              borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {agreed && <span style={{ color: '#050709', fontSize: 10, fontWeight: 900 }}>✓</span>}
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#aab8b1', lineHeight: 1.6 }}>
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
