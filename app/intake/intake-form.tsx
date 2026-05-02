'use client';

import { useState, useRef } from 'react';

const INPUT: React.CSSProperties = {
  width:       '100%',
  background:  '#0b1014',
  border:      '1px solid rgba(255,255,255,0.09)',
  color:       '#f2faf4',
  fontFamily:  'var(--font-mono)',
  fontSize:    13,
  padding:     '10px 14px',
  outline:     'none',
  borderRadius: 2,
  boxSizing:   'border-box',
  transition:  'border-color 150ms ease',
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

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
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

function FocusTextarea({
  textareaRef, placeholder, maxLength, required,
}: {
  textareaRef: React.Ref<HTMLTextAreaElement>;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      ref={textareaRef}
      placeholder={placeholder}
      maxLength={maxLength}
      required={required}
      rows={4}
      style={{
        ...INPUT,
        resize: 'vertical',
        lineHeight: 1.6,
        borderColor: focused ? 'rgba(183,255,97,0.35)' : 'rgba(255,255,255,0.09)',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

const GEOGRAPHY_OPTIONS = ['India', 'United States', 'United Kingdom', 'EU', 'Other'];
const SAMPLE_OPTIONS    = ['None', 'Stool', 'Saliva', 'Blood draw', 'Dried blood spot', 'Urine', 'Wearable data', 'Other'];

export function IntakeForm() {
  const nameRef         = useRef<HTMLInputElement>(null);
  const orgRef          = useRef<HTMLInputElement>(null);
  const emailRef        = useRef<HTMLInputElement>(null);
  const websiteRef      = useRef<HTMLInputElement>(null);
  const titleRef        = useRef<HTMLInputElement>(null);
  const typeRef         = useRef<HTMLSelectElement>(null);
  const descRef         = useRef<HTMLTextAreaElement>(null);
  const participantsRef = useRef<HTMLInputElement>(null);
  const durationRef     = useRef<HTMLSelectElement>(null);
  const irbRef          = useRef<HTMLSelectElement>(null);
  const budgetRef       = useRef<HTMLSelectElement>(null);
  const referralRef     = useRef<HTMLInputElement>(null);
  const notesRef        = useRef<HTMLTextAreaElement>(null);

  const [geography,    setGeography]    = useState<string[]>([]);
  const [sampleTypes,  setSampleTypes]  = useState<string[]>([]);
  const [submitting,   setSubmitting]   = useState(false);
  const [done,         setDone]         = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  function toggleMulti(value: string, arr: string[], setArr: (v: string[]) => void) {
    setArr(arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/intake', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:                nameRef.current?.value?.trim(),
          organization:        orgRef.current?.value?.trim(),
          email:               emailRef.current?.value?.trim(),
          website:             websiteRef.current?.value?.trim() || null,
          study_title:         titleRef.current?.value?.trim(),
          study_type:          typeRef.current?.value || null,
          description:         descRef.current?.value?.trim() || null,
          target_participants: participantsRef.current?.value ? parseInt(participantsRef.current.value, 10) : null,
          duration:            durationRef.current?.value || null,
          geography,
          sample_types:        sampleTypes,
          irb_status:          irbRef.current?.value || null,
          budget_range:        budgetRef.current?.value || null,
          referral_source:     referralRef.current?.value?.trim() || null,
          additional_notes:    notesRef.current?.value?.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setDone(true);
    } catch {
      setError('Something went wrong. Please email kishore@biome.to directly.');
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
          Received.
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a', lineHeight: 1.7 }}>
          We&apos;ll review your submission and get back to you within 48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      {/* Contact */}
      <Field label="Your name" required>
        <FocusInput inputRef={nameRef} placeholder="Firstname Lastname" required />
      </Field>
      <Field label="Organization" required>
        <FocusInput inputRef={orgRef} placeholder="Your company or institution" required />
      </Field>
      <Field label="Email" required>
        <FocusInput inputRef={emailRef} type="email" placeholder="you@example.com" required />
      </Field>
      <Field label="Website">
        <FocusInput inputRef={websiteRef} type="url" placeholder="https://" />
      </Field>

      {/* Study info */}
      <Field label="Study title or working name" required>
        <FocusInput inputRef={titleRef} placeholder="e.g. Gut microbiome response to fermented foods" required />
      </Field>
      <Field label="Study type">
        <FocusSelect
          selectRef={typeRef}
          placeholder="Select type"
          options={['Observational', 'Behavioral intervention', 'Consumer product study', 'Device / wearable study', 'Survey / PRO', 'Biomarker collection', 'Other']}
        />
      </Field>
      <Field label="What are you trying to learn? (max 300 chars)" required>
        <FocusTextarea textareaRef={descRef} placeholder="Brief description of the research question and expected outcomes." maxLength={300} required />
      </Field>
      <Field label="Target number of participants" required>
        <FocusInput inputRef={participantsRef} type="number" placeholder="e.g. 100" required />
      </Field>
      <Field label="Study duration">
        <FocusSelect
          selectRef={durationRef}
          placeholder="Select duration"
          options={['2–4 weeks', '4–8 weeks', '8–12 weeks', '12–24 weeks', '24+ weeks']}
        />
      </Field>

      {/* Geography */}
      <div style={{ marginBottom: 20 }}>
        <label style={LABEL}>Geography (select all that apply)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {GEOGRAPHY_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleMulti(opt, geography, setGeography)}
              style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      11,
                padding:       '6px 12px',
                background:    geography.includes(opt) ? 'rgba(183,255,97,0.1)' : 'transparent',
                border:        `1px solid ${geography.includes(opt) ? 'rgba(183,255,97,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color:         geography.includes(opt) ? '#b7ff61' : '#5b8a9a',
                cursor:        'pointer',
                borderRadius:  2,
                transition:    'all 150ms ease',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Sample types */}
      <div style={{ marginBottom: 20 }}>
        <label style={LABEL}>Sample collection needed (select all that apply)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SAMPLE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => toggleMulti(opt, sampleTypes, setSampleTypes)}
              style={{
                fontFamily:   'var(--font-mono)',
                fontSize:     11,
                padding:      '6px 12px',
                background:   sampleTypes.includes(opt) ? 'rgba(183,255,97,0.1)' : 'transparent',
                border:       `1px solid ${sampleTypes.includes(opt) ? 'rgba(183,255,97,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color:        sampleTypes.includes(opt) ? '#b7ff61' : '#5b8a9a',
                cursor:       'pointer',
                borderRadius: 2,
                transition:   'all 150ms ease',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <Field label="IRB / ethics status">
        <FocusSelect
          selectRef={irbRef}
          placeholder="Select status"
          options={['Already approved', 'Planning to apply', 'Not required for this study', 'Not sure']}
        />
      </Field>
      <Field label="Operations budget range">
        <FocusSelect
          selectRef={budgetRef}
          placeholder="Select range"
          options={['Under $10K', '$10K–$25K', '$25K–$50K', '$50K+', 'Not sure yet']}
        />
      </Field>
      <Field label="How did you hear about Biome?">
        <FocusInput inputRef={referralRef} placeholder="Optional" />
      </Field>
      <Field label="Anything else we should know?">
        <FocusTextarea textareaRef={notesRef} placeholder="Optional" />
      </Field>

      {error && (
        <p style={{
          fontFamily:   'var(--font-mono)', fontSize: 11, color: '#ffb300',
          background:   'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.2)',
          padding:      '10px 14px', marginBottom: 16, borderRadius: 2,
        }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary"
        style={{ width: '100%' }}
      >
        {submitting ? 'Sending…' : 'Submit →'}
      </button>
    </form>
  );
}
