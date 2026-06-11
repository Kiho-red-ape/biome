'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { calculateEstimate, type EstimateResult } from '@/lib/estimate-calculator';

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US');
}

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

const STUDY_TYPES = [
  { value: 'survey',               label: 'Survey / Questionnaire'     },
  { value: 'behavioral',           label: 'Behavioral / Observational' },
  { value: 'cognitive_behavioral', label: 'Cognitive / Behavioral'     },
  { value: 'consumer_product',     label: 'Consumer product testing'   },
  { value: 'device',               label: 'Device / Wearable'          },
  { value: 'supplement_novel',     label: 'Supplement / Nutrition'     },
  { value: 'biomarker',            label: 'Biomarker / Clinical'       },
  { value: 'condition_specific',   label: 'Condition-specific cohort'  },
];

const DURATIONS = [
  { value: '2_4',     label: '2–4 weeks'   },
  { value: '4_8',     label: '4–8 weeks'   },
  { value: '8_12',    label: '8–12 weeks'  },
  { value: '12_24',   label: '12–24 weeks' },
  { value: '24_plus', label: '24+ weeks'   },
];

const GEOGRAPHIES = [
  { value: 'india', label: 'India' },
  { value: 'us',    label: 'US'    },
  { value: 'uk',    label: 'UK'    },
  { value: 'eu',    label: 'EU'    },
];

const SAMPLES = [
  { value: 'stool',            label: 'Stool (microbiome)'      },
  { value: 'saliva',           label: 'Saliva'                  },
  { value: 'dried_blood_spot', label: 'Dried blood spot'        },
  { value: 'blood_draw',       label: 'Venous blood draw'       },
  { value: 'urine',            label: 'Urine'                   },
  { value: 'wearable',         label: 'Wearable / device data'  },
  { value: 'none',             label: 'No samples (survey only)' },
];

const IRB_OPTIONS = [
  { value: 'approved', label: 'Approved / in progress' },
  { value: 'unsure',   label: 'Not sure'               },
  { value: 'na',       label: 'Not required'           },
];

// ─── Field label ──────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p style={{
      fontFamily:    'var(--font-display)',
      fontSize:      13,
      fontWeight:    600,
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      color:         'var(--ink)',
      marginBottom:  12,
    }}>
      {children}
    </p>
  );
}

// ─── Pill toggle button ───────────────────────────────────────────────────────

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily:    'var(--font-body)',
        fontSize:      14,
        fontWeight:    active ? 600 : 400,
        padding:       '10px 18px',
        border:        active ? '1px solid var(--teal)' : '1px solid var(--border-mid)',
        background:    active ? 'var(--teal-soft)' : 'var(--surface)',
        color:         active ? 'var(--teal-dark)' : 'var(--slate)',
        boxShadow:     active ? 'var(--shadow-sm)' : 'none',
        borderRadius:  'var(--radius-sm)',
        cursor:        'pointer',
        transition:    'all 100ms ease',
        whiteSpace:    'nowrap' as const,
      }}
    >
      {children}
    </button>
  );
}

// ─── Form section wrapper ─────────────────────────────────────────────────────

function FormSection({ children, step }: { children: ReactNode; step: string }) {
  return (
    <div style={{
      display:      'grid',
      gridTemplateColumns: '32px 1fr',
      gap:          16,
      paddingBottom: 32,
      borderBottom:  '1px solid var(--border-soft)',
    }}>
      <div style={{
        fontFamily:  'var(--font-mono)',
        fontWeight:  700,
        fontSize:    13,
        color:       'var(--surface)',
        background:  'var(--teal)',
        width:       28,
        height:      28,
        display:     'flex',
        alignItems:  'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-sm)',
        flexShrink:  0,
        marginTop:   2,
      }}>
        {step}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─── Results display ──────────────────────────────────────────────────────────

function EstimateDisplay({ result, onRecalculate }: { result: EstimateResult; onRecalculate: () => void }) {
  return (
    <div>
      {/* Total hero */}
      <div style={{
        background:   'var(--teal-dark)',
        border:       '1px solid var(--border-mid)',
        boxShadow:    'var(--shadow-md)',
        borderRadius: 'var(--radius)',
        padding:      '32px 36px',
        marginBottom: 24,
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal-soft)', marginBottom: 12 }}>
          Estimate complete
        </p>
        <p style={{
          fontFamily:   'var(--font-display)',
          fontWeight:   700,
          fontSize:     'clamp(40px, 6vw, 64px)',
          color:        'var(--surface)',
          lineHeight:   1,
          marginBottom: 12,
        }}>
          {fmt(result.total)}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
          {result.participants} research partners · {result.duration.replace('_', '–').replace('plus', '+')} weeks
          · {fmt(result.perParticipant)}/research partner
        </p>
      </div>

      {/* Line items table */}
      <div style={{ border: '1px solid var(--border-soft)', background: 'var(--surface)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
        {result.lineItems.map((item, i) => (
          <div key={i} style={{
            padding:      '14px 20px',
            borderBottom: '1px solid var(--border-soft)',
            display:      'flex',
            justifyContent: 'space-between',
            gap:          16,
          }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                {item.label}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                {item.description}
              </p>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', flexShrink: 0 }}>
              {fmt(item.amount)}
            </span>
          </div>
        ))}

        {/* Pass-through subtotal */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', gap: 16, background: 'var(--bg-page)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Pass-through subtotal</p>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{fmt(result.subtotalPassThrough)}</span>
        </div>

        {/* Ops fee */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-mid)', display: 'flex', justifyContent: 'space-between', gap: 16, background: 'var(--teal-faint)' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>Biome operations fee</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', margin: 0 }}>Platform, compliance, reporting, delivery</p>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--teal-dark)', flexShrink: 0 }}>{fmt(result.opsFee)}</span>
        </div>

        {/* Total row */}
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink)' }}>
            Total
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 28, color: 'var(--teal-dark)' }}>
            {fmt(result.total)}
          </span>
        </div>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {result.warnings.map((w, i) => (
            <div key={i} style={{ padding: '12px 16px', border: '1px solid #d97706', background: 'rgba(217,119,6,0.06)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: '#d97706', flexShrink: 0 }}>!</span>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>{w}</p>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 28 }}>
        Indicative estimate only — not a quote or binding offer. Final scope confirmed in conversation.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a href="/intake" className="btn-primary">Start a conversation →</a>
        <button type="button" onClick={onRecalculate} className="btn-secondary" style={{ color: 'var(--slate)', borderColor: 'var(--border-mid)' }}>
          Recalculate
        </button>
      </div>
    </div>
  );
}

// ─── Email gate ───────────────────────────────────────────────────────────────

function EmailGate({ onSubmit }: { onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [err,   setErr]   = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@') || !email.includes('.')) { setErr('Enter a valid email.'); return; }
    onSubmit(email);
  }

  return (
    <div style={{
      border:       '1px solid var(--border-soft)',
      boxShadow:    'var(--shadow-md)',
      background:   'var(--surface)',
      borderRadius: 'var(--radius)',
      padding:      '36px',
    }}>
      <span style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      12,
        fontWeight:    600,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color:         'var(--teal)',
        display:       'block',
        marginBottom:  16,
      }}>
        Almost there
      </span>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', marginBottom: 10 }}>
        Enter your email to view the estimate.
      </h3>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate)', lineHeight: 1.6, marginBottom: 28 }}>
        We&apos;ll send you a copy and someone from the team will follow up.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setErr(''); }}
          placeholder="you@institution.edu"
          required
          style={{
            flex:         1,
            minWidth:     200,
            fontFamily:   'var(--font-body)',
            fontSize:     16,
            padding:      '14px 16px',
            border:       err ? '1px solid var(--error)' : '1px solid var(--border-mid)',
            borderRadius: 'var(--radius-sm)',
            background:   'var(--surface)',
            color:        'var(--ink)',
            outline:      'none',
          }}
        />
        <button type="submit" className="btn-primary">View estimate →</button>
      </form>
      {err && <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--error)', marginTop: 10 }}>{err}</p>}
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function EstimateWizard() {
  const [form,   setForm]   = useState<FormState>(INITIAL);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [gated,  setGated]  = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  function toggleGeo(v: string) {
    setForm(f => ({
      ...f,
      geography: f.geography.includes(v) ? f.geography.filter(g => g !== v) : [...f.geography, v],
    }));
  }

  function toggleSample(v: string) {
    setForm(f => {
      if (v === 'none') return { ...f, samples: ['none'] };
      const without = f.samples.filter(s => s !== 'none');
      return { ...f, samples: without.includes(v) ? without.filter(s => s !== v) : [...without, v] };
    });
  }

  function validate() {
    const errs: string[] = [];
    if (!form.studyType)            errs.push('Select a study type.');
    if (form.geography.length === 0) errs.push('Select at least one geography.');
    if (form.samples.length === 0)   errs.push('Select sample type(s).');
    if (!form.irbStatus)             errs.push('Select IRB status.');
    return errs;
  }

  function handleCalculate() {
    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setGated(true);
  }

  function handleEmailSubmit(email: string) {
    setForm(f => ({ ...f, email }));
    const r = calculateEstimate(form);
    setResult(r);
    setGated(false);
    fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: email, email, subject: 'Estimate request',
        message: `Estimate request from ${email}\n\nStudy type: ${form.studyType}\nResearch partners: ${form.participants}\nDuration: ${form.duration}\nGeography: ${form.geography.join(', ')}\nSamples: ${form.samples.join(', ')}\nIRB: ${form.irbStatus}\n\nTotal: ${fmt(calculateEstimate(form).total)}`,
      }),
    }).catch(() => null);
  }

  if (result) return <EstimateDisplay result={result} onRecalculate={() => { setResult(null); setGated(false); }} />;
  if (gated)  return <EmailGate onSubmit={handleEmailSubmit} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      <FormSection step="1">
        <FieldLabel>Study type *</FieldLabel>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {STUDY_TYPES.map(t => (
            <PillButton key={t.value} active={form.studyType === t.value} onClick={() => setForm(f => ({ ...f, studyType: t.value }))}>
              {t.label}
            </PillButton>
          ))}
        </div>
      </FormSection>

      <FormSection step="2">
        <FieldLabel>Number of research partners *</FieldLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12 }}>
          <input
            type="range" min={10} max={500} step={5}
            value={form.participants}
            onChange={e => setForm(f => ({ ...f, participants: Number(e.target.value) }))}
            style={{ flex: 1, accentColor: 'var(--teal)', height: 4 }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', minWidth: 48 }}>
            {form.participants}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[25, 50, 100, 200].map(n => (
            <PillButton key={n} active={form.participants === n} onClick={() => setForm(f => ({ ...f, participants: n }))}>
              {n}
            </PillButton>
          ))}
        </div>
      </FormSection>

      <FormSection step="3">
        <FieldLabel>Study duration *</FieldLabel>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {DURATIONS.map(d => (
            <PillButton key={d.value} active={form.duration === d.value} onClick={() => setForm(f => ({ ...f, duration: d.value }))}>
              {d.label}
            </PillButton>
          ))}
        </div>
      </FormSection>

      <FormSection step="4">
        <FieldLabel>Geography * (select all that apply)</FieldLabel>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {GEOGRAPHIES.map(g => (
            <PillButton key={g.value} active={form.geography.includes(g.value)} onClick={() => toggleGeo(g.value)}>
              {g.label}
            </PillButton>
          ))}
        </div>
      </FormSection>

      <FormSection step="5">
        <FieldLabel>Sample / data types * (select all that apply)</FieldLabel>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {SAMPLES.map(s => (
            <PillButton key={s.value} active={form.samples.includes(s.value)} onClick={() => toggleSample(s.value)}>
              {s.label}
            </PillButton>
          ))}
        </div>
      </FormSection>

      <FormSection step="6">
        <FieldLabel>IRB / ethics status *</FieldLabel>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {IRB_OPTIONS.map(o => (
            <PillButton key={o.value} active={form.irbStatus === o.value} onClick={() => setForm(f => ({ ...f, irbStatus: o.value }))}>
              {o.label}
            </PillButton>
          ))}
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', marginTop: 10, lineHeight: 1.6 }}>
          IRB is the researcher&apos;s responsibility. Biome does not provide IRB services.
        </p>
      </FormSection>

      {/* Errors */}
      {errors.length > 0 && (
        <div style={{ border: '1px solid var(--error)', background: 'rgba(220,38,38,0.04)', borderRadius: 'var(--radius-sm)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {errors.map((e, i) => (
            <p key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--error)', margin: 0 }}>— {e}</p>
          ))}
        </div>
      )}

      <div>
        <button type="button" onClick={handleCalculate} className="btn-primary" style={{ fontSize: 15 }}>
          Get my estimate →
        </button>
      </div>
    </div>
  );
}
