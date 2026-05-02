'use client';

import { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Answers {
  study_type:   string;
  sponsor_type: string;
  participants: number | null;
  duration:     string;
  geography:    string[];
  samples:      string[];
  irb_status:   string;
}

const EMPTY: Answers = {
  study_type:   '',
  sponsor_type: '',
  participants: null,
  duration:     '',
  geography:    [],
  samples:      [],
  irb_status:   '',
};

// ── Pricing constants ─────────────────────────────────────────────────────────
const RECRUITMENT_BASE = 35;   // $ per participant
const GEO_MULTIPLIER: Record<string, number> = {
  'India':          1.0,
  'United States':  1.8,
  'United Kingdom': 1.6,
  'EU':             1.5,
  'Multiple':       2.0,
};
const SAMPLE_COST: Record<string, number> = {
  'Survey only':    0,
  'Saliva':         12,
  'Stool kit':      28,
  'Blood spot':     22,
  'Blood draw':     65,
  'Urine':          10,
  'Wearable data':  15,
};
const DURATION_MULTIPLIER: Record<string, number> = {
  '< 2 weeks':   1.0,
  '2–4 weeks':   1.1,
  '1–3 months':  1.2,
  '3–6 months':  1.35,
  '6–12 months': 1.5,
  '> 12 months': 1.7,
};
const IRB_COST: Record<string, number> = {
  'We have IRB approval':    0,
  'Need IRB guidance':      1500,
  'Not applicable':          0,
  'Not sure':               500,
};
const OPS_FEE_RATE = 0.08; // 8% of study subtotal

function calcEstimate(a: Answers): {
  recruitment: number; samples: number; irb: number; ops_fee: number; total: number;
} {
  const n       = a.participants ?? 0;
  const geo     = a.geography.length > 1
    ? GEO_MULTIPLIER['Multiple']
    : GEO_MULTIPLIER[a.geography[0] ?? 'India'] ?? 1.0;
  const dur     = DURATION_MULTIPLIER[a.duration] ?? 1.0;
  const sampleC = a.samples.reduce((acc, s) => acc + (SAMPLE_COST[s] ?? 0), 0);

  const recruitment = Math.round(n * RECRUITMENT_BASE * geo * dur);
  const samples     = Math.round(n * sampleC);
  const irb         = IRB_COST[a.irb_status] ?? 0;
  const subtotal    = recruitment + samples + irb;
  const ops_fee     = Math.round(subtotal * OPS_FEE_RATE);
  const total       = subtotal + ops_fee;

  return { recruitment, samples, irb, ops_fee, total };
}

// ── Shared UI primitives ──────────────────────────────────────────────────────
function OptionButton({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      12,
        letterSpacing: '0.5px',
        padding:       '10px 18px',
        border:        `1px solid ${selected ? '#b7ff61' : 'rgba(255,255,255,0.1)'}`,
        background:    selected ? 'rgba(183,255,97,0.08)' : 'transparent',
        color:         selected ? '#b7ff61' : '#aab8b1',
        borderRadius:  2,
        cursor:        'pointer',
        transition:    'all 120ms ease',
        textAlign:     'left',
      }}
    >
      {label}
    </button>
  );
}

function StepLabel({ num, total }: { num: number; total: number }) {
  return (
    <p style={{
      fontFamily:    'var(--font-mono)',
      fontSize:      10,
      letterSpacing: '2px',
      color:         '#5b8a9a',
      marginBottom:  16,
    }}>
      STEP {num} OF {total}
    </p>
  );
}

function NavButtons({
  onBack, onNext, nextLabel = 'Next →', canProceed,
}: { onBack?: () => void; onNext: () => void; nextLabel?: string; canProceed: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      11,
            letterSpacing: '1px',
            padding:       '0 20px',
            height:        40,
            border:        '1px solid rgba(255,255,255,0.1)',
            background:    'transparent',
            color:         '#5b8a9a',
            borderRadius:  2,
            cursor:        'pointer',
          }}
        >
          ← Back
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      11,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          padding:       '0 28px',
          height:        40,
          border:        '1px solid #b7ff61',
          background:    canProceed ? 'rgba(183,255,97,0.08)' : 'transparent',
          color:         canProceed ? '#b7ff61' : '#5b8a9a',
          borderRadius:  2,
          cursor:        canProceed ? 'pointer' : 'not-allowed',
          transition:    'all 120ms ease',
        }}
      >
        {nextLabel}
      </button>
    </div>
  );
}

// ── Email gate ─────────────────────────────────────────────────────────────────
function EmailGate({
  answers, onDone,
}: { answers: Answers; onDone: (email: string, org: string) => void }) {
  const [email, setEmail]   = useState('');
  const [org,   setOrg]     = useState('');
  const [state, setState]   = useState<'idle' | 'sending' | 'error'>('idle');

  const estimate = calcEstimate(answers);

  async function submit() {
    if (!email.trim()) return;
    setState('sending');
    try {
      const res = await fetch('/api/estimate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:             email.trim(),
          organization:      org.trim(),
          study_type:        answers.study_type,
          sponsor_type:      answers.sponsor_type,
          participants:      answers.participants,
          duration:          answers.duration,
          geography:         answers.geography,
          samples:           answers.samples,
          irb_status:        answers.irb_status,
          estimated_total:   estimate.total,
          estimated_ops_fee: estimate.ops_fee,
          estimate_breakdown: {
            recruitment: estimate.recruitment,
            samples:     estimate.samples,
            irb:         estimate.irb,
            ops_fee:     estimate.ops_fee,
            total:       estimate.total,
          },
        }),
      });
      if (!res.ok) throw new Error();
      onDone(email.trim(), org.trim());
    } catch {
      setState('error');
    }
  }

  const inputStyle: React.CSSProperties = {
    fontFamily:    'var(--font-mono)',
    fontSize:      13,
    color:         '#f2faf4',
    background:    'rgba(255,255,255,0.04)',
    border:        '1px solid rgba(255,255,255,0.12)',
    borderRadius:  2,
    padding:       '0 16px',
    height:        46,
    width:         '100%',
    outline:       'none',
    letterSpacing: '0.3px',
  };

  return (
    <div>
      <StepLabel num={8} total={7} />
      <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(20px, 3vw, 28px)', color: '#f2faf4', marginBottom: 12 }}>
        Where should we send your estimate?
      </h2>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a', marginBottom: 28 }}>
        Your estimate will be emailed to you. We may follow up with more detail.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
        <input type="text"  placeholder="Your name or organization" value={org}   onChange={(e) => setOrg(e.target.value)}   style={inputStyle} />
        <input type="email" placeholder="Work email address"        value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        <button
          type="button"
          onClick={submit}
          disabled={!email.trim() || state === 'sending'}
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      12,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            height:        46,
            border:        '1px solid #b7ff61',
            background:    email.trim() ? 'rgba(183,255,97,0.1)' : 'transparent',
            color:         email.trim() ? '#b7ff61' : '#5b8a9a',
            borderRadius:  2,
            cursor:        email.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          {state === 'sending' ? 'Sending...' : 'View my estimate →'}
        </button>
        {state === 'error' && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ff6b6b' }}>
            Something went wrong. Try again.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Results view ──────────────────────────────────────────────────────────────
function Results({ answers, email }: { answers: Answers; email: string }) {
  const est = calcEstimate(answers);

  const rows: [string, number][] = [
    ['Recruitment',  est.recruitment],
    ['Sample kits',  est.samples],
    ['IRB support',  est.irb],
    ['Ops fee (8%)', est.ops_fee],
  ].filter(([, v]) => v > 0) as [string, number][];

  return (
    <div>
      <p style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      10,
        letterSpacing: '3px',
        color:         '#b7ff61',
        textTransform: 'uppercase',
        marginBottom:  20,
      }}>
        // ESTIMATE_COMPLETE
      </p>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(22px, 3vw, 32px)', color: '#f2faf4', marginBottom: 8 }}>
        Your estimate is ready.
      </h2>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a', marginBottom: 40 }}>
        Sent to {email} · All figures are estimates, not binding quotes.
      </p>

      {/* Total */}
      <div style={{
        background:   'rgba(183,255,97,0.05)',
        border:       '1px solid rgba(183,255,97,0.2)',
        borderRadius: 4,
        padding:      '24px 28px',
        marginBottom: 24,
        display:      'flex',
        justifyContent: 'space-between',
        alignItems:   'center',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#aab8b1', letterSpacing: '1px' }}>
          ESTIMATED TOTAL
        </span>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(28px, 4vw, 40px)', color: '#b7ff61' }}>
          ${est.total.toLocaleString()}
        </span>
      </div>

      {/* Breakdown */}
      <div style={{
        border:       '1px solid rgba(255,255,255,0.06)',
        borderRadius: 4,
        overflow:     'hidden',
        marginBottom: 32,
      }}>
        {rows.map(([label, amount], idx) => (
          <div key={label} style={{
            display:        'flex',
            justifyContent: 'space-between',
            padding:        '14px 20px',
            borderTop:      idx > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            background:     idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#aab8b1' }}>{label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#f2faf4' }}>${amount.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Study summary */}
      <div style={{
        background:   'rgba(255,255,255,0.02)',
        border:       '1px solid rgba(255,255,255,0.06)',
        borderRadius: 4,
        padding:      '20px 24px',
        marginBottom: 32,
        display:      'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap:          12,
      }}>
        {[
          ['Study type',    answers.study_type],
          ['Participants',  `${answers.participants ?? '—'}`],
          ['Duration',      answers.duration],
          ['Geography',     answers.geography.join(', ')],
          ['Samples',       answers.samples.join(', ') || 'Survey only'],
          ['IRB',           answers.irb_status],
        ].map(([k, v]) => (
          <div key={k}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#5b8a9a', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>{k}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#aab8b1' }}>{v}</p>
          </div>
        ))}
      </div>

      <a
        href="/intake"
        style={{
          fontFamily:     'var(--font-mono)',
          fontSize:       12,
          letterSpacing:  '1.5px',
          textTransform:  'uppercase',
          color:          '#b7ff61',
          border:         '1px solid #b7ff61',
          padding:        '0 28px',
          height:         46,
          display:        'inline-flex',
          alignItems:     'center',
          textDecoration: 'none',
          borderRadius:   2,
        }}
      >
        Proceed to full intake →
      </a>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────
export function EstimateWizard() {
  const [step,    setStep]    = useState(1);
  const [answers, setAnswers] = useState<Answers>({ ...EMPTY });
  const [email,   setEmail]   = useState('');

  function update<K extends keyof Answers>(key: K, val: Answers[K]) {
    setAnswers(prev => ({ ...prev, [key]: val }));
  }

  function toggleArray(key: 'geography' | 'samples', val: string) {
    setAnswers(prev => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });
  }

  const questionStyle: React.CSSProperties = {
    fontFamily:   'var(--font-heading)',
    fontWeight:   700,
    fontSize:     'clamp(20px, 3vw, 28px)',
    color:        '#f2faf4',
    marginBottom: 24,
    lineHeight:   1.2,
  };

  if (step === 9) return <Results answers={answers} email={email} />;

  if (step === 8) return (
    <EmailGate
      answers={answers}
      onDone={(em) => { setEmail(em); setStep(9); }}
    />
  );

  return (
    <div>
      {/* Progress bar */}
      <div style={{
        height:       2,
        background:   'rgba(255,255,255,0.06)',
        borderRadius: 1,
        marginBottom: 40,
        overflow:     'hidden',
      }}>
        <div style={{
          height:     '100%',
          width:      `${(step / 7) * 100}%`,
          background: '#b7ff61',
          borderRadius: 1,
          transition: 'width 300ms ease',
        }} />
      </div>

      {/* Step 1 — Study type */}
      {step === 1 && (
        <div>
          <StepLabel num={1} total={7} />
          <h2 style={questionStyle}>What type of study are you running?</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['Dietary intervention', 'Microbiome / gut health', 'Sleep study', 'Cognitive / behavioral', 'Supplement / nutraceutical', 'Digital health / wearable', 'Skin / dermatology', 'Mental health', 'Other'].map(t => (
              <OptionButton key={t} label={t} selected={answers.study_type === t} onClick={() => update('study_type', t)} />
            ))}
          </div>
          <NavButtons onNext={() => setStep(2)} canProceed={!!answers.study_type} />
        </div>
      )}

      {/* Step 2 — Sponsor type */}
      {step === 2 && (
        <div>
          <StepLabel num={2} total={7} />
          <h2 style={questionStyle}>Who is sponsoring this study?</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['Startup / founder', 'Brand / CPG company', 'University / research lab', 'DAO / DeSci project', 'Pharma / biotech', 'Individual researcher', 'Other'].map(t => (
              <OptionButton key={t} label={t} selected={answers.sponsor_type === t} onClick={() => update('sponsor_type', t)} />
            ))}
          </div>
          <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} canProceed={!!answers.sponsor_type} />
        </div>
      )}

      {/* Step 3 — Participants */}
      {step === 3 && (
        <div>
          <StepLabel num={3} total={7} />
          <h2 style={questionStyle}>How many participants do you need?</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[25, 50, 100, 200, 500, 1000].map(n => (
              <OptionButton key={n} label={`${n}`} selected={answers.participants === n} onClick={() => update('participants', n)} />
            ))}
          </div>
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a' }}>Custom:</span>
            <input
              type="number"
              min={10}
              max={5000}
              placeholder="Enter number"
              value={answers.participants && ![25,50,100,200,500,1000].includes(answers.participants) ? answers.participants : ''}
              onChange={(e) => update('participants', parseInt(e.target.value) || null)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize:   13,
                color:      '#f2faf4',
                background: 'rgba(255,255,255,0.04)',
                border:     '1px solid rgba(255,255,255,0.12)',
                borderRadius: 2,
                padding:    '0 12px',
                height:     40,
                width:      120,
                outline:    'none',
              }}
            />
          </div>
          <NavButtons onBack={() => setStep(2)} onNext={() => setStep(4)} canProceed={!!answers.participants && answers.participants > 0} />
        </div>
      )}

      {/* Step 4 — Duration */}
      {step === 4 && (
        <div>
          <StepLabel num={4} total={7} />
          <h2 style={questionStyle}>How long will the study run?</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['< 2 weeks', '2–4 weeks', '1–3 months', '3–6 months', '6–12 months', '> 12 months'].map(t => (
              <OptionButton key={t} label={t} selected={answers.duration === t} onClick={() => update('duration', t)} />
            ))}
          </div>
          <NavButtons onBack={() => setStep(3)} onNext={() => setStep(5)} canProceed={!!answers.duration} />
        </div>
      )}

      {/* Step 5 — Geography */}
      {step === 5 && (
        <div>
          <StepLabel num={5} total={7} />
          <h2 style={questionStyle}>Where will participants be located?</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a', marginBottom: 20 }}>
            Select all that apply.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['India', 'United States', 'United Kingdom', 'EU'].map(g => (
              <OptionButton key={g} label={g} selected={answers.geography.includes(g)} onClick={() => toggleArray('geography', g)} />
            ))}
          </div>
          <NavButtons onBack={() => setStep(4)} onNext={() => setStep(6)} canProceed={answers.geography.length > 0} />
        </div>
      )}

      {/* Step 6 — Samples */}
      {step === 6 && (
        <div>
          <StepLabel num={6} total={7} />
          <h2 style={questionStyle}>What data or samples will you collect?</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a', marginBottom: 20 }}>
            Select all that apply.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['Survey only', 'Saliva', 'Stool kit', 'Blood spot', 'Blood draw', 'Urine', 'Wearable data'].map(s => (
              <OptionButton key={s} label={s} selected={answers.samples.includes(s)} onClick={() => toggleArray('samples', s)} />
            ))}
          </div>
          <NavButtons onBack={() => setStep(5)} onNext={() => setStep(7)} canProceed={answers.samples.length > 0} />
        </div>
      )}

      {/* Step 7 — IRB */}
      {step === 7 && (
        <div>
          <StepLabel num={7} total={7} />
          <h2 style={questionStyle}>What is your IRB / ethics status?</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['We have IRB approval', 'Need IRB guidance', 'Not applicable', 'Not sure'].map(t => (
              <OptionButton key={t} label={t} selected={answers.irb_status === t} onClick={() => update('irb_status', t)} />
            ))}
          </div>
          <NavButtons onBack={() => setStep(6)} onNext={() => setStep(8)} nextLabel="Get my estimate →" canProceed={!!answers.irb_status} />
        </div>
      )}
    </div>
  );
}
