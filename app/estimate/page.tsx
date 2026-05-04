'use client';

import { useState } from 'react';
import Link from 'next/link';
import { calculateEstimate, type EstimateInput, type EstimateResult } from '@/lib/estimate-calculator';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'form' | 'email' | 'results';

const GEOGRAPHIES = [
  { value: 'india', label: 'India'  },
  { value: 'us',    label: 'US'     },
  { value: 'uk',    label: 'UK'     },
  { value: 'eu',    label: 'EU'     },
  { value: 'other', label: 'Other'  },
];

const SAMPLE_OPTIONS = [
  { value: 'none',            label: 'Survey / digital only' },
  { value: 'saliva',          label: 'Saliva'                },
  { value: 'urine',           label: 'Urine'                 },
  { value: 'dried_blood_spot',label: 'Dried blood spot (DBS)'},
  { value: 'blood_draw',      label: 'Venous blood draw'     },
  { value: 'stool',           label: 'Stool / microbiome'    },
  { value: 'wearable',        label: 'Wearable device data'  },
];

const STUDY_TYPES = [
  { value: 'survey',             label: 'Survey'                     },
  { value: 'behavioral',         label: 'Behavioral'                 },
  { value: 'cognitive_behavioral',label:'Cognitive / behavioral'     },
  { value: 'observational',      label: 'Observational'              },
  { value: 'consumer_product',   label: 'Consumer product'           },
  { value: 'device',             label: 'Device / wearable'          },
  { value: 'supplement_novel',   label: 'Supplement / nutrition'     },
  { value: 'biomarker',          label: 'Biomarker'                  },
  { value: 'condition_specific', label: 'Condition-specific cohort'  },
];

const DURATIONS = [
  { value: '2_4',    label: '2–4 weeks'  },
  { value: '4_8',    label: '4–8 weeks'  },
  { value: '8_12',   label: '8–12 weeks' },
  { value: '12_24',  label: '12–24 weeks'},
  { value: '24_plus',label: '24+ weeks'  },
];

// ─── Shared style helpers ────────────────────────────────────────────────────

const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US');
}

// ─── Form component ───────────────────────────────────────────────────────────

function EstimatorForm({ onSubmit }: { onSubmit: (input: EstimateInput) => void }) {
  const [studyType,   setStudyType]   = useState('cognitive_behavioral');
  const [participants,setParticipants]= useState(50);
  const [duration,    setDuration]    = useState('2_4');
  const [geography,   setGeo]         = useState<string[]>([]);
  const [samples,     setSamples]     = useState<string[]>([]);
  const [irbStatus,   setIrb]         = useState('confirmed');
  const [error,       setError]       = useState('');

  function toggleMulti(val: string, list: string[], setter: (v: string[]) => void) {
    setter(list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!geography.length) { setError('Select at least one region.'); return; }
    if (!samples.length)   { setError('Select at least one sample type.'); return; }
    setError('');
    onSubmit({ studyType, participants, duration, geography, samples, irbStatus });
  }

  const checkStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 12px',
    background: active ? 'rgba(77,255,128,0.08)' : 'rgba(255,255,255,0.02)',
    border: `1px solid ${active ? 'rgba(77,255,128,0.35)' : 'rgba(77,255,128,0.10)'}`,
    borderRadius: 3, cursor: 'pointer',
    fontFamily: 'var(--font-mono)', fontSize: 12,
    color: active ? '#b7ff61' : 'var(--text)',
    userSelect: 'none',
    transition: 'all 0.12s',
  });

  const labelStyle: React.CSSProperties = {
    ...mono, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase',
    color: '#4a7055', marginBottom: 8, display: 'block',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Study type */}
      <div>
        <label style={labelStyle}>Study type</label>
        <select
          value={studyType}
          onChange={e => setStudyType(e.target.value)}
          style={{
            ...mono, fontSize: 13, color: 'var(--text-bright)',
            background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.15)',
            borderRadius: 3, padding: '9px 12px', width: '100%',
          }}
        >
          {STUDY_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Participants */}
      <div>
        <label style={labelStyle}>Participants (enrolled)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="number" min={5} max={2000}
            value={participants}
            onChange={e => setParticipants(Math.max(5, parseInt(e.target.value) || 5))}
            style={{
              ...mono, fontSize: 22, fontWeight: 700,
              color: 'var(--text-white)', background: 'var(--bg2)',
              border: '1px solid rgba(77,255,128,0.15)',
              borderRadius: 3, padding: '9px 14px', width: 120,
            }}
          />
          <span style={{ ...mono, fontSize: 11, color: '#4a7055' }}>participants</span>
        </div>
      </div>

      {/* Duration */}
      <div>
        <label style={labelStyle}>Study duration</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {DURATIONS.map(d => (
            <button
              key={d.value} type="button"
              onClick={() => setDuration(d.value)}
              style={checkStyle(duration === d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Geography */}
      <div>
        <label style={labelStyle}>Regions (select all that apply)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {GEOGRAPHIES.map(g => (
            <button
              key={g.value} type="button"
              onClick={() => toggleMulti(g.value, geography, setGeo)}
              style={checkStyle(geography.includes(g.value))}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Samples */}
      <div>
        <label style={labelStyle}>Sample / data collection</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SAMPLE_OPTIONS.map(s => (
            <button
              key={s.value} type="button"
              onClick={() => toggleMulti(s.value, samples, setSamples)}
              style={checkStyle(samples.includes(s.value))}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* IRB status */}
      <div>
        <label style={labelStyle}>IRB / ethics review status</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'in_progress', label: 'In progress' },
            { value: 'unsure', label: 'Not sure' },
            { value: 'exempt', label: 'Exempt' },
          ].map(opt => (
            <button
              key={opt.value} type="button"
              onClick={() => setIrb(opt.value)}
              style={checkStyle(irbStatus === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p style={{ ...mono, fontSize: 11, color: '#ff6b6b' }}>{error}</p>
      )}

      <button
        type="submit"
        style={{
          ...mono, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase',
          background: 'var(--green)', color: '#070c07',
          border: 'none', borderRadius: 3, padding: '13px 28px',
          cursor: 'pointer', fontWeight: 700, alignSelf: 'flex-start',
        }}
      >
        Calculate estimate →
      </button>
    </form>
  );
}

// ─── Email gate ───────────────────────────────────────────────────────────────

function EmailGate({ onConfirm }: { onConfirm: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    onConfirm(email);
  }

  return (
    <div style={{
      maxWidth: 480,
      background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.12)',
      borderRadius: 4, padding: '36px 32px',
    }}>
      <p style={{ ...mono, fontSize: 9, letterSpacing: '3px', color: 'var(--green)', marginBottom: 12 }}>
        // ESTIMATE_READY
      </p>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800,
        color: 'var(--text-white)', marginBottom: 10,
      }}>
        Where should we send it?
      </h2>
      <p style={{
        fontFamily: 'var(--font-heading)', fontSize: 14, color: '#aab8b1',
        lineHeight: 1.7, marginBottom: 24,
      }}>
        Enter your email to unlock the full estimate breakdown. We&apos;ll also send you a copy.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="you@org.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--text-bright)', background: 'var(--bg)',
            border: '1px solid rgba(77,255,128,0.18)',
            borderRadius: 3, padding: '11px 14px', width: '100%', boxSizing: 'border-box',
          }}
        />
        {error && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ff6b6b' }}>{error}</p>
        )}
        <button
          type="submit"
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px',
            textTransform: 'uppercase', fontWeight: 700,
            background: 'var(--green)', color: '#070c07',
            border: 'none', borderRadius: 3, padding: '13px 24px',
            cursor: 'pointer',
          }}
        >
          Show estimate →
        </button>
      </form>
    </div>
  );
}

// ─── Results display ─────────────────────────────────────────────────────────

function Results({
  result,
  onRecalculate,
}: {
  result: EstimateResult;
  onRecalculate: () => void;
}) {
  const divider: React.CSSProperties = {
    borderTop: '1px solid rgba(77,255,128,0.10)', margin: '0',
  };

  const rowStyle = (highlight?: boolean): React.CSSProperties => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: 16, padding: '14px 18px',
    background: highlight ? 'rgba(183,255,97,0.05)' : 'transparent',
  });

  const labelText = (highlight?: boolean): React.CSSProperties => ({
    ...mono, fontSize: 13,
    color: highlight ? '#b7ff61' : 'var(--text-bright)',
    fontWeight: highlight ? 700 : 400,
  });

  const amountText = (highlight?: boolean): React.CSSProperties => ({
    ...mono, fontSize: 13, flexShrink: 0,
    color: highlight ? '#b7ff61' : 'var(--text-bright)',
    fontWeight: highlight ? 700 : 400,
  });

  const descText: React.CSSProperties = {
    ...mono, fontSize: 11, color: '#5b8a9a', marginTop: 3,
  };

  return (
    <div style={{ maxWidth: 720 }}>

      {/* Header */}
      <p style={{ ...mono, fontSize: 9, letterSpacing: '3px', color: 'var(--green)', marginBottom: 12 }}>
        // ESTIMATE_COMPLETE
      </p>
      <div style={{ marginBottom: 28 }}>
        <span style={{
          fontFamily: 'var(--font-heading)', fontSize: 42, fontWeight: 800,
          color: '#f2faf4', letterSpacing: '-1px',
        }}>
          {fmt(result.total)}
        </span>
        <p style={{ ...mono, fontSize: 12, color: '#5b8a9a', marginTop: 6 }}>
          Estimated total · {result.participants} participants · {result.duration.replace('_', '–').replace('plus', '+')} weeks
        </p>
      </div>

      {/* Line items table */}
      <div style={{
        border: '1px solid rgba(77,255,128,0.12)',
        borderRadius: 4, overflow: 'hidden',
      }}>

        {/* Pass-through line items */}
        {result.lineItems.map((item, i) => (
          <div key={i}>
            {i > 0 && <hr style={divider} />}
            <div style={rowStyle()}>
              <div>
                <p style={labelText()}>{item.label}</p>
                <p style={descText}>{item.description}</p>
              </div>
              <p style={amountText()}>{fmt(item.amount)}</p>
            </div>
          </div>
        ))}

        {/* Pass-through subtotal */}
        <hr style={{ ...divider, borderColor: 'rgba(77,255,128,0.18)' }} />
        <div style={rowStyle()}>
          <div>
            <p style={{ ...mono, fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>
              Pass-through subtotal
            </p>
            <p style={descText}>Includes 50% coordination margin</p>
          </div>
          <p style={{ ...mono, fontSize: 13, color: 'var(--text-bright)', fontWeight: 600 }}>
            {fmt(result.subtotalPassThrough)}
          </p>
        </div>

        {/* Ops fee */}
        <hr style={divider} />
        <div style={rowStyle(true)}>
          <div>
            <p style={labelText(true)}>Biome operations fee</p>
            <p style={descText}>Platform, compliance, reporting, project management, data delivery</p>
          </div>
          <p style={amountText(true)}>{fmt(result.opsFee)}</p>
        </div>

        {/* Total */}
        <hr style={{ ...divider, borderColor: 'rgba(77,255,128,0.25)' }} />
        <div style={{
          ...rowStyle(),
          background: 'rgba(77,255,128,0.04)', padding: '18px 18px',
        }}>
          <div>
            <p style={{ ...mono, fontSize: 15, color: '#f2faf4', fontWeight: 700, letterSpacing: '1px' }}>
              TOTAL
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ ...mono, fontSize: 16, color: '#f2faf4', fontWeight: 700 }}>
              {fmt(result.total)}
            </p>
            <p style={{ ...mono, fontSize: 11, color: '#5b8a9a', marginTop: 3 }}>
              {fmt(result.perParticipant)} per participant
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
        <div style={{
          flex: 1, minWidth: 180,
          background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.10)',
          borderRadius: 4, padding: '16px 18px',
        }}>
          <p style={{ ...mono, fontSize: 9, letterSpacing: '2px', color: '#4a7055', marginBottom: 6 }}>PER PARTICIPANT</p>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: '#f2faf4' }}>
            {fmt(result.perParticipant)}
          </p>
        </div>
        <div style={{
          flex: 1, minWidth: 220,
          background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.10)',
          borderRadius: 4, padding: '16px 18px',
        }}>
          <p style={{ ...mono, fontSize: 9, letterSpacing: '2px', color: '#4a7055', marginBottom: 6 }}>TRANSPARENCY</p>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#aab8b1', lineHeight: 1.6 }}>
            Pass-through costs visible — every line item shown.
          </p>
        </div>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          {result.warnings.map((w, i) => (
            <div key={i} style={{
              padding: '12px 16px',
              background: 'rgba(255,179,0,0.06)',
              border: '1px solid rgba(255,179,0,0.20)',
              borderLeft: '3px solid #ffb300',
              borderRadius: 3,
            }}>
              <p style={{ ...mono, fontSize: 12, color: '#ffb300', lineHeight: 1.6 }}>{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p style={{ ...mono, fontSize: 11, color: '#5b8a9a', lineHeight: 1.7, marginTop: 20 }}>
        This is an automated indicative estimate. Not a quote or binding offer.
        Final scope confirmed in conversation. Pass-through costs subject to partner rates at engagement.
      </p>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        <Link
          href="/contact"
          style={{
            ...mono, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase',
            background: 'var(--green)', color: '#070c07',
            borderRadius: 3, padding: '12px 22px',
            textDecoration: 'none', fontWeight: 700,
          }}
        >
          Start a conversation →
        </Link>
        <button
          onClick={onRecalculate}
          style={{
            ...mono, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase',
            background: 'transparent',
            color: 'var(--text)',
            border: '1px solid rgba(77,255,128,0.18)',
            borderRadius: 3, padding: '12px 22px',
            cursor: 'pointer',
          }}
        >
          Recalculate
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EstimatePage() {
  const [step,        setStep]        = useState<Step>('form');
  const [formInput,   setFormInput]   = useState<EstimateInput | null>(null);
  const [result,      setResult]      = useState<EstimateResult | null>(null);

  function handleFormSubmit(input: EstimateInput) {
    setFormInput(input);
    setStep('email');
  }

  function handleEmailConfirm(_email: string) {
    if (!formInput) return;
    const r = calculateEstimate(formInput);
    setResult(r);
    setStep('results');
  }

  function handleRecalculate() {
    setStep('form');
    setResult(null);
    setFormInput(null);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Nav */}
      <div style={{
        borderBottom: '1px solid rgba(77,255,128,0.07)',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <Link href="/" style={{
          ...mono, fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase',
          color: '#4a7055', textDecoration: 'none',
        }}>
          ← BIOME
        </Link>
        <span style={{ color: 'rgba(77,255,128,0.15)' }}>|</span>
        <span style={{ ...mono, fontSize: 10, letterSpacing: '2px', color: '#4a7055', textTransform: 'uppercase' }}>
          Budget estimator
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6" style={{ paddingTop: 52, paddingBottom: 80 }}>

        {step !== 'results' && (
          <>
            <p style={{ ...mono, fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 10 }}>
              // BUDGET_ESTIMATOR
            </p>
            <h1 style={{
              fontFamily: 'var(--font-heading)', fontSize: 34, fontWeight: 800,
              color: 'var(--text-white)', marginBottom: 10, lineHeight: 1.15,
            }}>
              Estimate your study cost
            </h1>
            <p style={{
              fontFamily: 'var(--font-heading)', fontSize: 15, color: '#aab8b1',
              lineHeight: 1.7, marginBottom: 40, maxWidth: 540,
            }}>
              Multi-country biological studies are expensive. This tool gives you a realistic
              line-item breakdown — recruitment, kits, shipping, lab, compensation — before
              you commit.
            </p>
          </>
        )}

        {step === 'form'    && <EstimatorForm    onSubmit={handleFormSubmit}  />}
        {step === 'email'   && <EmailGate        onConfirm={handleEmailConfirm} />}
        {step === 'results' && result && (
          <Results result={result} onRecalculate={handleRecalculate} />
        )}
      </div>
    </div>
  );
}
