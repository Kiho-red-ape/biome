'use client';

import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { calculateEstimate, type EstimateResult } from '@/lib/estimate-calculator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US');
}

const MONO: CSSProperties = { fontFamily: 'var(--font-mono)' };

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  studyType:    string;
  participants: number;
  duration:     string;
  geography:    string[];
  samples:      string[];
  irbStatus:    string;
  email:        string;
}

const INITIAL: FormState = {
  studyType:    '',
  participants: 50,
  duration:     '4_8',
  geography:    [],
  samples:      [],
  irbStatus:    '',
  email:        '',
};

// ─── Option rows ──────────────────────────────────────────────────────────────

const STUDY_TYPES = [
  { value: 'survey',              label: 'Survey / Questionnaire' },
  { value: 'behavioral',          label: 'Behavioral / Observational' },
  { value: 'cognitive_behavioral',label: 'Cognitive / Behavioral' },
  { value: 'consumer_product',    label: 'Consumer product testing' },
  { value: 'device',              label: 'Device / Wearable' },
  { value: 'supplement_novel',    label: 'Supplement / Nutrition' },
  { value: 'biomarker',           label: 'Biomarker / Clinical' },
  { value: 'condition_specific',  label: 'Condition-specific cohort' },
];

const DURATIONS = [
  { value: '2_4',    label: '2–4 weeks'  },
  { value: '4_8',    label: '4–8 weeks'  },
  { value: '8_12',   label: '8–12 weeks' },
  { value: '12_24',  label: '12–24 weeks'},
  { value: '24_plus',label: '24+ weeks'  },
];

const GEOGRAPHIES = [
  { value: 'india', label: 'India'   },
  { value: 'us',    label: 'US'      },
  { value: 'uk',    label: 'UK'      },
  { value: 'eu',    label: 'EU'      },
];

const SAMPLES = [
  { value: 'stool',            label: 'Stool (microbiome)'   },
  { value: 'saliva',           label: 'Saliva'               },
  { value: 'dried_blood_spot', label: 'Dried blood spot'     },
  { value: 'blood_draw',       label: 'Venous blood draw'    },
  { value: 'urine',            label: 'Urine'                },
  { value: 'wearable',         label: 'Wearable / device data' },
  { value: 'none',             label: 'No samples (survey only)' },
];

const IRB_OPTIONS = [
  { value: 'approved', label: 'Approved / in progress' },
  { value: 'unsure',   label: 'Not sure'               },
  { value: 'na',       label: 'Not required'           },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#f59e0b', textTransform: 'uppercase', marginBottom: 16 }}>
      // {children}
    </p>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{ ...MONO, fontSize: 11, letterSpacing: '2px', color: '#475569', textTransform: 'uppercase', marginBottom: 10 }}>
      {children}
    </p>
  );
}

function PillButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...MONO, fontSize: 11, padding: '7px 14px',
        border: `1px solid ${active ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
        background: active ? 'rgba(245,158,11,0.08)' : 'transparent',
        color: active ? '#f59e0b' : '#7f9a8a',
        borderRadius: 2, cursor: 'pointer', transition: 'all 150ms ease',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {children}
    </button>
  );
}

// ─── Results display ──────────────────────────────────────────────────────────

function EstimateDisplay({
  result, onRecalculate,
}: { result: EstimateResult; onRecalculate: () => void }) {
  const divider = (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '8px 0' }} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <SectionLabel>ESTIMATE_COMPLETE</SectionLabel>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 36px)', color: '#f8fafc', lineHeight: 1, marginBottom: 8 }}>
          {fmt(result.total)}
        </p>
        <p style={{ ...MONO, fontSize: 12, color: '#475569' }}>
          Estimated total · {result.participants} participants · {result.duration.replace('_', '–').replace('plus', '+')} weeks
        </p>
      </div>

      {/* Line items */}
      <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden', marginBottom: 24 }}>

        {result.lineItems.map((item, i) => (
          <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ ...MONO, fontSize: 12, color: '#d0e0d5' }}>{item.label}</span>
              <span style={{ ...MONO, fontSize: 12, color: '#f8fafc', flexShrink: 0 }}>{fmt(item.amount)}</span>
            </div>
            <p style={{ ...MONO, fontSize: 11, color: '#475569', margin: '3px 0 0' }}>{item.description}</p>
          </div>
        ))}

        {divider}

        {/* Pass-through subtotal */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ ...MONO, fontSize: 12, color: '#d0e0d5' }}>Pass-through subtotal</span>
            <span style={{ ...MONO, fontSize: 12, color: '#f8fafc', flexShrink: 0 }}>{fmt(result.subtotalPassThrough)}</span>
          </div>
          <p style={{ ...MONO, fontSize: 11, color: '#475569', margin: '3px 0 0' }}>Includes 50% coordination margin</p>
        </div>

        {/* Ops fee — highlighted */}
        <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.04)', borderBottom: '1px solid rgba(245,158,11,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ ...MONO, fontSize: 12, color: '#f59e0b' }}>Biome operations fee</span>
            <span style={{ ...MONO, fontSize: 12, color: '#f59e0b', flexShrink: 0 }}>{fmt(result.opsFee)}</span>
          </div>
          <p style={{ ...MONO, fontSize: 11, color: 'rgba(245,158,11,0.5)', margin: '3px 0 0' }}>
            Platform, compliance, reporting, project management, data delivery
          </p>
        </div>

        {/* Total */}
        <div style={{ padding: '14px 16px', background: 'rgba(245,158,11,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{ ...MONO, fontSize: 13, letterSpacing: '2px', textTransform: 'uppercase' as const, color: '#f8fafc' }}>TOTAL</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, color: '#f8fafc' }}>{fmt(result.total)}</span>
          </div>
          <p style={{ ...MONO, fontSize: 11, color: '#475569', margin: '4px 0 0', textAlign: 'right' as const }}>
            {fmt(result.perParticipant)} per participant
          </p>
        </div>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {result.warnings.map((w, i) => (
            <div key={i} style={{
              padding: '10px 14px', borderRadius: 2,
              border: '1px solid rgba(255,179,0,0.2)', background: 'rgba(255,179,0,0.04)',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ ...MONO, fontSize: 11, color: '#ffb300', flexShrink: 0 }}>!</span>
              <p style={{ ...MONO, fontSize: 11, color: '#c8a060', lineHeight: 1.7, margin: 0 }}>{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p style={{ ...MONO, fontSize: 11, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
        This is an automated indicative estimate. Not a quote or binding offer.
        Final scope confirmed in conversation. Pass-through costs subject to
        partner rates at engagement.
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
        <a
          href="/intake"
          style={{
            ...MONO, fontSize: 12, padding: '12px 24px',
            background: '#f59e0b', color: '#060a14',
            borderRadius: 2, textDecoration: 'none', fontWeight: 700,
            transition: 'opacity 150ms ease',
          }}
        >
          Start a conversation →
        </a>
        <button
          type="button"
          onClick={onRecalculate}
          style={{
            ...MONO, fontSize: 12, padding: '12px 24px',
            border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
            color: '#7f9a8a', borderRadius: 2, cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          Recalculate
        </button>
      </div>
    </div>
  );
}

// ─── Email gate ───────────────────────────────────────────────────────────────

function EmailGate({ onSubmit }: { onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [err, setErr]     = useState('');

  function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!email.includes('@') || !email.includes('.')) {
      setErr('Enter a valid email.');
      return;
    }
    onSubmit(email);
  }

  return (
    <div style={{ padding: '32px', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 4, background: 'rgba(245,158,11,0.02)' }}>
      <SectionLabel>ALMOST_THERE</SectionLabel>
      <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, color: '#f8fafc', marginBottom: 8 }}>
        Enter your email to view the estimate.
      </p>
      <p style={{ ...MONO, fontSize: 12, color: '#475569', lineHeight: 1.7, marginBottom: 24 }}>
        We'll send you a copy and someone from the team will follow up to discuss.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErr(''); }}
          placeholder="you@institution.edu"
          required
          style={{
            ...MONO, fontSize: 13, flex: 1, minWidth: 200,
            padding: '10px 16px', borderRadius: 2,
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${err ? 'rgba(255,100,100,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: '#f8fafc', outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            ...MONO, fontSize: 12, fontWeight: 700,
            padding: '10px 24px', background: '#f59e0b', color: '#060a14',
            border: 'none', borderRadius: 2, cursor: 'pointer',
          }}
        >
          View estimate →
        </button>
      </form>
      {err && <p style={{ ...MONO, fontSize: 11, color: '#ff6464', marginTop: 8 }}>{err}</p>}
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function EstimateWizard() {
  const [form,   setForm]   = useState<FormState>(INITIAL);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [gated,  setGated]  = useState(false); // show email gate
  const [errors, setErrors] = useState<string[]>([]);

  function toggleGeo(v: string) {
    setForm((f: FormState) => ({
      ...f,
      geography: f.geography.includes(v)
        ? f.geography.filter((g: string) => g !== v)
        : [...f.geography, v],
    }));
  }

  function toggleSample(v: string) {
    setForm((f: FormState) => {
      // 'none' is exclusive
      if (v === 'none') return { ...f, samples: ['none'] };
      const without = f.samples.filter((s: string) => s !== 'none');
      return {
        ...f,
        samples: without.includes(v)
          ? without.filter((s: string) => s !== v)
          : [...without, v],
      };
    });
  }

  function validate() {
    const errs: string[] = [];
    if (!form.studyType)        errs.push('Select a study type.');
    if (form.geography.length === 0) errs.push('Select at least one geography.');
    if (form.samples.length === 0)   errs.push('Select sample type(s).');
    if (!form.irbStatus)        errs.push('Select IRB status.');
    return errs;
  }

  function handleCalculate() {
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setGated(true);
  }

  function handleEmailSubmit(email: string) {
    setForm((f: FormState) => ({ ...f, email }));
    const r = calculateEstimate(form);
    setResult(r);
    setGated(false);

    // Fire-and-forget notify
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: email,
        email,
        subject: 'Estimate request',
        message: `Estimate request from ${email}\n\nStudy type: ${form.studyType}\nParticipants: ${form.participants}\nDuration: ${form.duration}\nGeography: ${form.geography.join(', ')}\nSamples: ${form.samples.join(', ')}\nIRB: ${form.irbStatus}\n\nTotal: $${calculateEstimate(form).total.toLocaleString()}`,
      }),
    }).catch(() => null);
  }

  if (result) {
    return (
      <EstimateDisplay
        result={result}
        onRecalculate={() => { setResult(null); setGated(false); }}
      />
    );
  }

  if (gated) {
    return <EmailGate onSubmit={handleEmailSubmit} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Study type */}
      <div>
        <FieldLabel>Study type *</FieldLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STUDY_TYPES.map(t => (
            <PillButton
              key={t.value}
              active={form.studyType === t.value}
              onClick={() => setForm((f: FormState) => ({ ...f, studyType: t.value }))}
            >
              {t.label}
            </PillButton>
          ))}
        </div>
      </div>

      {/* Participants */}
      <div>
        <FieldLabel>Number of participants *</FieldLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input
            type="range"
            min={10} max={500} step={5}
            value={form.participants}
            onChange={(e) => setForm((f: FormState) => ({ ...f, participants: Number(e.target.value) }))}
            style={{ flex: 1, accentColor: '#f59e0b' }}
          />
          <span style={{ ...MONO, fontSize: 16, color: '#f8fafc', minWidth: 40, textAlign: 'right' }}>
            {form.participants}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {[25, 50, 100, 200].map(n => (
            <PillButton
              key={n}
              active={form.participants === n}
              onClick={() => setForm((f: FormState) => ({ ...f, participants: n }))}
            >
              {n}
            </PillButton>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <FieldLabel>Study duration *</FieldLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DURATIONS.map(d => (
            <PillButton
              key={d.value}
              active={form.duration === d.value}
              onClick={() => setForm((f: FormState) => ({ ...f, duration: d.value }))}
            >
              {d.label}
            </PillButton>
          ))}
        </div>
      </div>

      {/* Geography */}
      <div>
        <FieldLabel>Geography * (select all that apply)</FieldLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {GEOGRAPHIES.map(g => (
            <PillButton
              key={g.value}
              active={form.geography.includes(g.value)}
              onClick={() => toggleGeo(g.value)}
            >
              {g.label}
            </PillButton>
          ))}
        </div>
      </div>

      {/* Samples */}
      <div>
        <FieldLabel>Sample / data types * (select all that apply)</FieldLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SAMPLES.map(s => (
            <PillButton
              key={s.value}
              active={form.samples.includes(s.value)}
              onClick={() => toggleSample(s.value)}
            >
              {s.label}
            </PillButton>
          ))}
        </div>
      </div>

      {/* IRB status */}
      <div>
        <FieldLabel>IRB / ethics status *</FieldLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {IRB_OPTIONS.map(o => (
            <PillButton
              key={o.value}
              active={form.irbStatus === o.value}
              onClick={() => setForm((f: FormState) => ({ ...f, irbStatus: o.value }))}
            >
              {o.label}
            </PillButton>
          ))}
        </div>
        <p style={{ ...MONO, fontSize: 11, color: '#475569', marginTop: 8, lineHeight: 1.6 }}>
          IRB is the researcher's responsibility. Biome does not provide IRB services.
        </p>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {errors.map((e, i) => (
            <p key={i} style={{ ...MONO, fontSize: 11, color: '#ffb300' }}>— {e}</p>
          ))}
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        onClick={handleCalculate}
        style={{
          ...MONO, fontSize: 13, fontWeight: 700, letterSpacing: '1px',
          padding: '14px 32px', background: '#f59e0b', color: '#060a14',
          border: 'none', borderRadius: 2, cursor: 'pointer',
          alignSelf: 'flex-start', transition: 'opacity 150ms ease',
        }}
      >
        Get estimate →
      </button>
    </div>
  );
}
