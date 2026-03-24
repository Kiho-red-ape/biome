'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

const CATEGORIES = [
  'Microbiome', 'Nutrition', 'Sleep', 'Wearables', 'Longevity',
  'Quantified Self', 'Cognitive', 'Behavioral', 'Fitness', 'Mental Health',
  'Metabolomics', 'Psychedelics', 'Other',
];
const STUDY_TYPES  = ['Observational', 'Interventional', 'Survey-only', 'Self-experiment'];
const APPROVAL_OPTIONS = [
  'Ethics approved',
  'IRB pending',
  'Self-governed',
  'Not required for this study type',
];

// ─── Milestone types ──────────────────────────────────────────────────────────

type MilestoneInput = {
  _key:  string;
  title: string;
  desc:  string;
  type:  'self_report' | 'experimenter_confirm';
};

function mkMilestone(title = '', type: MilestoneInput['type'] = 'self_report'): MilestoneInput {
  return { _key: crypto.randomUUID(), title, desc: '', type };
}

// ─── Shared input components ──────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mono text-xs block mb-1.5" style={{ color: 'var(--text-dim)' }}>
      {children}
    </label>
  );
}

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div style={{ borderTop: '1px solid rgba(77,255,128,0.1)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
      <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>{label}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--text-dim)', opacity: 0.7 }}>{sub}</p>}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, required, type = 'text', min, max,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  required?: boolean; type?: string; min?: string; max?: string;
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} required={required} min={min} max={max}
      className="w-full px-3 py-2 rounded mono text-sm outline-none"
      style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.15)', color: 'var(--text-bright)' }}
    />
  );
}

function SelectInput({
  value, onChange, options, placeholder,
}: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <select
      value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded mono text-sm outline-none cursor-pointer"
      style={{
        background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.15)',
        color: value ? 'var(--text-bright)' : 'var(--text-dim)',
      }}
    >
      <option value="">{placeholder ?? 'Select…'}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Textarea({
  value, onChange, placeholder, rows = 4,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      className="w-full px-3 py-2 rounded mono text-sm outline-none resize-none"
      style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.15)', color: 'var(--text-bright)' }}
    />
  );
}

// ─── Week milestone editor ────────────────────────────────────────────────────

function WeekMilestoneRow({
  ms, onChange, onRemove,
}: {
  ms: MilestoneInput;
  onChange: (updated: MilestoneInput) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded p-3 flex flex-col gap-2"
      style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.1)' }}>

      {/* Title + remove */}
      <div className="flex items-center gap-2">
        <input
          value={ms.title}
          onChange={(e) => onChange({ ...ms, title: e.target.value })}
          placeholder="Milestone title…"
          className="flex-1 px-2.5 py-1.5 rounded mono text-xs outline-none"
          style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
        />
        <button
          type="button"
          onClick={onRemove}
          className="mono text-xs transition-opacity hover:opacity-60 flex-shrink-0"
          style={{ color: 'var(--text-dim)' }}
        >
          ✕
        </button>
      </div>

      {/* Description (optional) */}
      <input
        value={ms.desc}
        onChange={(e) => onChange({ ...ms, desc: e.target.value })}
        placeholder="Description (optional)"
        className="w-full px-2.5 py-1.5 rounded mono text-xs outline-none"
        style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.08)', color: 'var(--text-dim)' }}
      />

      {/* Type toggle */}
      <div className="flex items-center gap-1.5">
        {(['self_report', 'experimenter_confirm'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange({ ...ms, type: t })}
            className="mono text-xs px-2.5 py-1 rounded transition-all"
            style={{
              background: ms.type === t ? 'rgba(77,255,128,0.12)' : 'transparent',
              border: `1px solid ${ms.type === t ? 'rgba(77,255,128,0.3)' : 'rgba(77,255,128,0.1)'}`,
              color: ms.type === t ? 'var(--green)' : 'var(--text-dim)',
            }}
          >
            {t === 'self_report' ? 'Participant reports' : 'You confirm'}
          </button>
        ))}
      </div>
    </div>
  );
}

function WeekSection({
  week, milestones, onChange,
}: {
  week: number;
  milestones: MilestoneInput[];
  onChange: (week: number, updated: MilestoneInput[]) => void;
}) {
  const canAdd = milestones.length < 4;

  function addMilestone() {
    if (!canAdd) return;
    onChange(week, [...milestones, mkMilestone()]);
  }

  function updateMs(idx: number, updated: MilestoneInput) {
    const next = milestones.map((m, i) => (i === idx ? updated : m));
    onChange(week, next);
  }

  function removeMs(idx: number) {
    onChange(week, milestones.filter((_, i) => i !== idx));
  }

  return (
    <div className="rounded overflow-hidden"
      style={{ border: '1px solid rgba(77,255,128,0.1)' }}>

      {/* Week header */}
      <div className="px-4 py-2.5 flex items-center justify-between"
        style={{ background: 'var(--bg2)', borderBottom: milestones.length > 0 ? '1px solid rgba(77,255,128,0.08)' : 'none' }}>
        <span className="mono text-xs font-bold" style={{ color: 'var(--green)' }}>
          WEEK {week}
        </span>
        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
          {milestones.length}/4 milestones
        </span>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="px-4 pt-3 pb-2 flex flex-col gap-2" style={{ background: 'var(--bg)' }}>
          {milestones.map((ms, i) => (
            <WeekMilestoneRow
              key={ms._key}
              ms={ms}
              onChange={(u) => updateMs(i, u)}
              onRemove={() => removeMs(i)}
            />
          ))}
        </div>
      )}

      {/* Add button */}
      <div className="px-4 py-2.5" style={{ background: 'var(--bg)' }}>
        <button
          type="button"
          onClick={addMilestone}
          disabled={!canAdd}
          className="mono text-xs transition-opacity disabled:opacity-30"
          style={{ color: canAdd ? 'var(--cyan)' : 'var(--text-dim)' }}
        >
          {canAdd ? '+ Add milestone' : '— Max 4 per week'}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PostStudyPage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();

  type Gate = 'loading' | 'unauthenticated' | 'no_profile' | 'pending' | 'ready';
  const [gate, setGate] = useState<Gate>('loading');

  // Section A
  const [title,       setTitle]       = useState('');
  const [category,    setCategory]    = useState('');
  const [studyType,   setStudyType]   = useState('');
  const [description, setDescription] = useState('');
  const [duration,    setDuration]    = useState('');
  const [region,      setRegion]      = useState('Remote / Global');

  // Section B
  const [reward, setReward] = useState('');
  const [slots,  setSlots]  = useState('');

  const totalPool   = (parseFloat(reward) || 0) * (parseInt(slots) || 0);
  const platformFee = totalPool * 0.025;

  // Section C
  const [inclusion, setInclusion] = useState('');
  const [exclusion, setExclusion] = useState('');
  const [ageMin,    setAgeMin]    = useState('');
  const [ageMax,    setAgeMax]    = useState('');

  // Section D — Protocol
  const [weekMilestones, setWeekMilestones] = useState<Record<number, MilestoneInput[]>>({});
  const [complianceThreshold, setComplianceThreshold] = useState('80');
  const [enrollmentUrl,       setEnrollmentUrl]       = useState('');
  const [approvalStatus,      setApprovalStatus]      = useState('');

  // Regenerate week structure when duration changes
  const buildWeeks = useCallback((weeks: number) => {
    setWeekMilestones((prev) => {
      const next: Record<number, MilestoneInput[]> = {};
      for (let w = 1; w <= weeks; w++) {
        if (prev[w] && prev[w].length > 0) {
          next[w] = prev[w];
        } else {
          // Pre-populate week 1
          if (w === 1) {
            next[w] = [mkMilestone('Complete enrollment checklist', 'self_report')];
          // Pre-populate final week
          } else if (w === weeks) {
            next[w] = [mkMilestone('Complete final assessment', 'self_report')];
          } else {
            next[w] = [];
          }
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const weeks = parseInt(duration) || 0;
    if (weeks >= 1 && weeks <= 52) {
      buildWeeks(weeks);
    } else {
      setWeekMilestones({});
    }
  }, [duration, buildWeeks]);

  // Section E — Dropout prevention
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositAmount,  setDepositAmount]  = useState('');

  const autoDeposit = reward ? String(Math.round(parseFloat(reward) / 5)) : '';
  useEffect(() => {
    if (depositEnabled && !depositAmount) setDepositAmount(autoDeposit);
    if (!depositEnabled) setDepositAmount('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depositEnabled, autoDeposit]);

  // Section F — Verification
  const [applyVerif, setApplyVerif] = useState(false);

  // Section G — Agreement + submit
  const [agreed,  setAgreed]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) { setGate('unauthenticated'); return; }

    fetch(`/api/experimenter-profile?privyDid=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((data: { profile?: { screening_status: string } | null }) => {
        if (!data.profile)                               { setGate('no_profile'); return; }
        if (data.profile.screening_status === 'pending') { setGate('pending');    return; }
        setGate('ready');
      })
      .catch(() => setGate('no_profile'));
  }, [ready, authenticated, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed || !user) return;
    setLoading(true); setError(null);

    const inclusionFull = [
      inclusion,
      ageMin && ageMax ? `Age: ${ageMin}–${ageMax}` : ageMin ? `Age: ${ageMin}+` : '',
    ].filter(Boolean).join('\n');

    // Flatten milestones into a sorted list
    const flatMilestones = Object.entries(weekMilestones).flatMap(([week, msList]) =>
      msList
        .filter((m) => m.title.trim())
        .map((m, i) => ({
          week_number: parseInt(week),
          title:       m.title.trim(),
          description: m.desc.trim() || undefined,
          type:        m.type,
          sort_order:  i,
        }))
    );

    const res = await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        privyDid:               user.id,
        title:                  title.trim(),
        description:            description.trim(),
        category,
        bounty_per_participant: parseFloat(reward),
        slots_total:            parseInt(slots) || 1,
        duration_weeks:         parseInt(duration) || null,
        region:                 region.trim() || null,
        is_remote:              region.toLowerCase().includes('remote') || region.toLowerCase().includes('global'),
        inclusion_criteria:     inclusionFull || null,
        exclusion_criteria:     exclusion || null,
        apply_for_verification: applyVerif,
        iec_approval:           approvalStatus || null,
        milestones:             flatMilestones,
        compliance_threshold:   parseFloat(complianceThreshold) || 80,
        enrollment_url:         enrollmentUrl.trim() || null,
      }),
    });

    const data = await res.json() as { experiment?: { id: string }; error?: string };
    if (!res.ok) { setError(typeof data.error === 'string' ? data.error : 'Submission failed'); setLoading(false); return; }
    router.push(`/experiments/${data.experiment!.id}`);
  }

  // ── Gate screens ──────────────────────────────────────────────────────────────

  if (gate === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// LOADING...</span>
      </div>
    );
  }

  if (gate === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="mono text-xs mb-4" style={{ color: 'var(--text-dim)' }}>// AUTH_REQUIRED</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>Sign in to post a study.</p>
          <button onClick={() => router.push('/')} className="mono text-xs px-5 py-2.5 rounded font-bold"
            style={{ background: 'var(--green)', color: '#050709' }}>
            Go to homepage →
          </button>
        </div>
      </div>
    );
  }

  if (gate === 'no_profile') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="mono text-xs mb-4" style={{ color: 'var(--text-dim)' }}>// NO_ORG_PROFILE</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
            Set up your organization profile before posting studies.
          </p>
          <button onClick={() => router.push('/onboarding/experimenter')}
            className="mono text-xs px-5 py-2.5 rounded font-bold hover:opacity-90"
            style={{ background: 'var(--green)', color: '#050709' }}>
            Set up org profile →
          </button>
        </div>
      </div>
    );
  }

  if (gate === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="mono text-xs mb-4" style={{ color: 'var(--amber)' }}>// PROFILE_UNDER_REVIEW</p>
          <p className="text-sm mb-2" style={{ color: 'var(--text-white)' }}>
            Your organization profile is under review.
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
            You&apos;ll be able to post studies once approved (within 48 hours).
          </p>
          <button onClick={() => router.push('/')} className="mono text-xs px-5 py-2.5 rounded"
            style={{ border: '1px solid rgba(77,255,128,0.2)', color: 'var(--text-dim)' }}>
            ← Back to homepage
          </button>
        </div>
      </div>
    );
  }

  const durationWeeks = parseInt(duration) || 0;
  const weekNums = durationWeeks >= 1 ? Array.from({ length: durationWeeks }, (_, i) => i + 1) : [];

  // ── Main form ──────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.back()} className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            ← BACK
          </button>
          <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// POST_A_STUDY</span>
        </div>

        <div className="rounded p-8" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.12)' }}>
          <h1 className="text-2xl font-black mb-1"
            style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
            Post a study
          </h1>
          <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>
            Saved as draft. Review and publish from the study page when ready.
          </p>

          {/* Activation fee notice */}
          <div
            className="rounded p-3 mb-4 flex items-start gap-3"
            style={{ background: 'rgba(183,255,97,0.04)', border: '1px solid rgba(183,255,97,0.15)' }}
          >
            <span className="mono" style={{ color: 'var(--green)', fontSize: 14, flexShrink: 0 }}>◆</span>
            <div>
              <p className="mono font-bold" style={{ fontSize: 11, color: 'var(--green)', letterSpacing: '0.1em', marginBottom: 3 }}>
                STUDY ACTIVATION FEE
              </p>
              <p className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                Your <strong style={{ color: 'var(--text-bright)' }}>first study is free</strong>.
                Subsequent studies require a one-time <strong style={{ color: 'var(--text-bright)' }}>$99 activation fee</strong> per study,
                invoiced before publishing. Fee status is shown on your experimenter dashboard.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* ── A: Study basics ── */}
            <SectionHeader label="// SECTION_A — STUDY_BASICS" />

            <div>
              <Label>STUDY TITLE *</Label>
              <TextInput value={title} onChange={setTitle}
                placeholder="e.g. Magnesium L-threonate and deep sleep architecture"
                required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CATEGORY *</Label>
                <SelectInput value={category} onChange={setCategory}
                  options={CATEGORIES} placeholder="Select category" />
              </div>
              <div>
                <Label>STUDY TYPE</Label>
                <SelectInput value={studyType} onChange={setStudyType}
                  options={STUDY_TYPES} placeholder="Select type" />
              </div>
            </div>

            <div>
              <Label>DESCRIPTION *</Label>
              <Textarea value={description} onChange={setDescription}
                placeholder="What is the study about? What will participants do? What data will be collected?"
                rows={5} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>DURATION (weeks)</Label>
                <TextInput type="number" value={duration} onChange={setDuration}
                  placeholder="e.g. 8" min="1" max="52" />
              </div>
              <div>
                <Label>REGION / LOCATION</Label>
                <TextInput value={region} onChange={setRegion} placeholder="Remote / Global" />
              </div>
            </div>

            {/* ── B: Bounty ── */}
            <SectionHeader label="// SECTION_B — BOUNTY" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>REWARD PER PARTICIPANT (USD) *</Label>
                <TextInput type="number" value={reward} onChange={setReward}
                  placeholder="e.g. 120" required min="1" />
              </div>
              <div>
                <Label>PARTICIPANT SLOTS *</Label>
                <TextInput type="number" value={slots} onChange={setSlots}
                  placeholder="e.g. 50" required min="1" />
              </div>
            </div>

            <div className="p-4 rounded" style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.1)' }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>TOTAL BOUNTY POOL</p>
                  <p className="mono text-lg font-bold" style={{ color: 'var(--green)' }}>
                    {totalPool > 0
                      ? `$${totalPool.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>PLATFORM FEE (2.5%)</p>
                  <p className="mono text-lg font-bold" style={{ color: 'var(--text-dim)' }}>
                    {platformFee > 0 ? `$${platformFee.toFixed(2)}` : '—'}
                  </p>
                </div>
              </div>
              <p className="mono text-xs mt-3" style={{ color: 'var(--text-dim)', opacity: 0.7 }}>
                2.5% fee applies on completed payouts only.
              </p>
            </div>

            {/* ── C: Eligibility ── */}
            <SectionHeader label="// SECTION_C — ELIGIBILITY" />

            <div>
              <Label>INCLUSION CRITERIA</Label>
              <Textarea value={inclusion} onChange={setInclusion}
                placeholder="Who can join? One criterion per line." rows={3} />
            </div>
            <div>
              <Label>EXCLUSION CRITERIA</Label>
              <Textarea value={exclusion} onChange={setExclusion}
                placeholder="Who cannot join? One criterion per line." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>MIN AGE</Label>
                <TextInput type="number" value={ageMin} onChange={setAgeMin} placeholder="18" min="0" />
              </div>
              <div>
                <Label>MAX AGE</Label>
                <TextInput type="number" value={ageMax} onChange={setAgeMax} placeholder="65" min="0" />
              </div>
            </div>

            {/* ── D: Study Protocol ── */}
            <SectionHeader
              label="// SECTION_D — STUDY_PROTOCOL"
              sub="Define what participants must complete each week. Milestones are shown on the experiment page and tracked during the study."
            />

            {/* Compliance + Enrollment URL */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>COMPLIANCE THRESHOLD (%)</Label>
                <TextInput type="number" value={complianceThreshold} onChange={setComplianceThreshold}
                  placeholder="80" min="0" max="100" />
                <p className="mono text-xs mt-1" style={{ color: 'var(--text-dim)', opacity: 0.7 }}>
                  Minimum milestone completion % for payout
                </p>
              </div>
              <div>
                <Label>APPROVAL STATUS</Label>
                <SelectInput value={approvalStatus} onChange={setApprovalStatus}
                  options={APPROVAL_OPTIONS} placeholder="Select status" />
              </div>
            </div>

            <div>
              <Label>ENROLLMENT URL (optional)</Label>
              <TextInput value={enrollmentUrl} onChange={setEnrollmentUrl}
                placeholder="https://your-typeform.com/to/xxxxx" />
              <p className="mono text-xs mt-1" style={{ color: 'var(--text-dim)', opacity: 0.7 }}>
                Link to external onboarding (Typeform, Google Form, etc.). Participants are sent here after approval.
              </p>
            </div>

            {/* Weekly milestones */}
            {weekNums.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                  WEEKLY MILESTONES — {weekNums.length}-week study
                </p>
                {weekNums.map((w) => (
                  <WeekSection
                    key={w}
                    week={w}
                    milestones={weekMilestones[w] ?? []}
                    onChange={(week, updated) =>
                      setWeekMilestones((prev) => ({ ...prev, [week]: updated }))
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="rounded p-4 mono text-xs"
                style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.08)', color: 'var(--text-dim)' }}>
                Enter a study duration above to configure weekly milestones.
              </div>
            )}

            {/* ── E: Dropout prevention ── */}
            <SectionHeader label="// SECTION_E — DROPOUT_PREVENTION (optional)" />

            <label
              className="flex items-start gap-3 cursor-pointer p-4 rounded"
              style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.1)' }}
            >
              <input
                type="checkbox" checked={depositEnabled}
                onChange={(e) => setDepositEnabled(e.target.checked)}
                className="mt-1 w-4 h-4 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-white)' }}>
                  Require participant deposit to reduce dropouts
                </p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Default: OFF. Requiring a deposit improves completion rates but may slow initial recruitment.
                  Deposits are returned to participants who complete above your compliance threshold.
                </p>
              </div>
            </label>

            {depositEnabled && (
              <div>
                <Label>DEPOSIT AMOUNT (USD)</Label>
                <TextInput type="number" value={depositAmount} onChange={setDepositAmount}
                  placeholder={autoDeposit || 'e.g. 25'} min="1" />
                <p className="mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                  Auto-set to 1/5th of reward (${autoDeposit}). Editable.
                </p>
              </div>
            )}

            {/* ── F: Verification ── */}
            <SectionHeader label="// SECTION_F — VERIFICATION (optional)" />

            <label
              className="flex items-start gap-3 cursor-pointer p-4 rounded"
              style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.1)' }}
            >
              <input
                type="checkbox" checked={applyVerif}
                onChange={(e) => setApplyVerif(e.target.checked)}
                className="mt-1 w-4 h-4 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-white)' }}>
                  Apply for ✓ BIOME VERIFIED status
                </p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Our science team reviews your protocol, safety measures, and compliance framework.{' '}
                  <a href="/contact" style={{ color: 'var(--cyan)' }}>Contact us</a>
                  {' '}for more details. Sets a flag — we reach out to begin the review.
                </p>
              </div>
            </label>

            {/* ── G: Agreement ── */}
            <SectionHeader label="// SECTION_G — AGREEMENT" />

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                required className="mt-1 w-4 h-4 flex-shrink-0" />
              <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
                I agree to the{' '}
                <a href="/legal/tos" target="_blank" rel="noreferrer"
                   style={{ color: 'var(--cyan)', textDecoration: 'underline' }}>
                  BIOME Platform Terms
                </a>
                {' '}and the{' '}
                <a href="/legal/experimenter-agreement" target="_blank" rel="noreferrer"
                   style={{ color: 'var(--cyan)', textDecoration: 'underline' }}>
                  Experimenter Study Agreement
                </a>.
              </span>
            </label>

            {error && (
              <p className="mono text-xs" style={{ color: 'var(--amber)' }}>// ERROR: {error}</p>
            )}

            <button
              type="submit"
              disabled={!agreed || !title || !category || !description || !reward || !slots || loading}
              className="w-full py-3 rounded font-semibold text-sm transition-all disabled:opacity-40 hover:opacity-90"
              style={{ background: 'var(--green)', color: '#050709' }}
            >
              {loading ? '// SAVING...' : 'Submit study →'}
            </button>

          </form>
        </div>
      </div>
    </main>
  );
}
