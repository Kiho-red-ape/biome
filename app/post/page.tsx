'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

const CATEGORIES = ['Microbiome','Nutrition','Sleep','Psychedelics','Fitness','Longevity','Mental Health','Metabolomics','Other'];
const STUDY_TYPES = ['Observational','Interventional','Survey-only','Self-experiment','RCT'];
const DEVICE_OPTIONS = ['Smartphone','Wearable','Stool kit','Blood prick kit','Saliva kit','CGM','None'];

// ─── Shared input components ──────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mono text-xs block mb-1.5" style={{ color: 'var(--text-dim)' }}>{children}</label>;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="mono text-xs mb-4 pt-2" style={{ color: 'var(--text-dim)', borderTop: '1px solid rgba(77,255,128,0.08)', paddingTop: '1.5rem' }}>
      {label}
    </p>
  );
}

function TextInput({ value, onChange, placeholder, required, type = 'text', min }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  required?: boolean; type?: string; min?: string;
}) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} required={required} min={min}
      className="w-full px-3 py-2 rounded mono text-sm outline-none"
      style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.15)', color: 'var(--text-bright)' }}
    />
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded mono text-sm outline-none cursor-pointer"
      style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.15)', color: value ? 'var(--text-bright)' : 'var(--text-dim)' }}
    >
      <option value="">{placeholder ?? 'Select…'}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      className="w-full px-3 py-2 rounded mono text-sm outline-none resize-none"
      style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.15)', color: 'var(--text-bright)' }}
    />
  );
}

function MultiCheck({ options, selected, onChange }: {
  options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => toggle(opt)}
          className="mono text-xs px-2.5 py-1 rounded transition-all"
          style={{
            background: selected.includes(opt) ? 'rgba(77,255,128,0.12)' : 'var(--bg3)',
            border: `1px solid ${selected.includes(opt) ? 'var(--green-dim)' : 'rgba(77,255,128,0.12)'}`,
            color: selected.includes(opt) ? 'var(--green)' : 'var(--text-dim)',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PostBountyPage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();

  // Gate check
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
  const [reward,      setReward]      = useState('');
  const [targetPax,   setTargetPax]   = useState('');
  const [buffer,      setBuffer]      = useState('15');

  const slots     = Math.ceil((parseInt(targetPax) || 0) * (1 + (parseFloat(buffer) || 0) / 100));
  const totalPool = ((parseFloat(reward) || 0) * slots);
  const platformFee = totalPool * 0.025;

  // Section C
  const [inclusion,   setInclusion]   = useState('');
  const [exclusion,   setExclusion]   = useState('');
  const [devices,     setDevices]     = useState<string[]>([]);
  const [ageMin,      setAgeMin]      = useState('');
  const [ageMax,      setAgeMax]      = useState('');
  const [regionReq,   setRegionReq]   = useState('');

  // Section D
  const [iecApproval, setIecApproval] = useState('');

  // Section F
  const [commsUrl,    setCommsUrl]    = useState('');
  const [applyVerif,  setApplyVerif]  = useState(false);

  // Section G
  const [agreed,  setAgreed]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) { setGate('unauthenticated'); return; }

    fetch(`/api/experimenter-profile?privyDid=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((data: { profile?: { screening_status: string } | null }) => {
        if (!data.profile) { setGate('no_profile'); return; }
        if (data.profile.screening_status === 'pending') { setGate('pending'); return; }
        setGate('ready');
      })
      .catch(() => setGate('no_profile'));
  }, [ready, authenticated, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed || !user) return;
    setLoading(true); setError(null);

    const testsNeeded = devices.length ? `Required: ${devices.join(', ')}` : null;
    const inclusionFull = [
      inclusion,
      ageMin && ageMax ? `Age: ${ageMin}–${ageMax}` : ageMin ? `Age: ${ageMin}+` : '',
      regionReq ? `Region: ${regionReq}` : '',
    ].filter(Boolean).join('\n');

    const res = await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        privyDid:               user.id,
        title:                  title.trim(),
        description:            description.trim(),
        category,
        bounty_per_participant: parseFloat(reward),
        slots_total:            slots || parseInt(targetPax) || 1,
        duration_weeks:         parseInt(duration) || null,
        region:                 region.trim() || null,
        is_remote:              region.toLowerCase().includes('remote') || region.toLowerCase().includes('global'),
        inclusion_criteria:     inclusionFull || null,
        exclusion_criteria:     exclusion || null,
        tests_needed:           testsNeeded,
        iec_approval:           iecApproval || null,
        external_comms_url:     commsUrl || null,
        apply_for_verification: applyVerif,
      }),
    });

    const data = await res.json() as { experiment?: { id: string }; error?: string };
    if (!res.ok) { setError(data.error ?? 'Submission failed'); setLoading(false); return; }
    router.push(`/experiments/${data.experiment!.id}`);
  }

  // ── Gate screens ─────────────────────────────────────────────────────────────

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
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>Sign in to post an experiment.</p>
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
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>Set up your organization profile before posting experiments.</p>
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
          <p className="text-sm mb-2" style={{ color: 'var(--text-white)' }}>Your organization profile is under review.</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>You&apos;ll be able to post experiments once approved (within 48 hours).</p>
          <button onClick={() => router.push('/')} className="mono text-xs px-5 py-2.5 rounded"
            style={{ border: '1px solid rgba(77,255,128,0.2)', color: 'var(--text-dim)' }}>
            ← Back to homepage
          </button>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.back()} className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            ← BACK
          </button>
          <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// POST_A_BOUNTY</span>
        </div>

        <div className="rounded p-8" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.1)' }}>
          <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
            Post an experiment
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-dim)' }}>
            Saved as draft. You can publish once you&apos;ve reviewed the preview.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* ── A: Basic Info ── */}
            <SectionHeader label="// SECTION_A — BASIC_INFO" />
            <div>
              <Label>EXPERIMENT TITLE *</Label>
              <TextInput value={title} onChange={setTitle} placeholder="e.g. Sleep quality + magnesium supplementation trial" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>CATEGORY *</Label><Select value={category} onChange={setCategory} options={CATEGORIES} placeholder="Select category" /></div>
              <div><Label>STUDY TYPE</Label><Select value={studyType} onChange={setStudyType} options={STUDY_TYPES} placeholder="Select type" /></div>
            </div>
            <div>
              <Label>FULL DESCRIPTION *</Label>
              <Textarea value={description} onChange={setDescription}
                placeholder="What is the study about? What will participants do? What data will be collected?" rows={5} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>DURATION (weeks)</Label><TextInput type="number" value={duration} onChange={setDuration} placeholder="e.g. 4" min="1" /></div>
              <div><Label>REGION / LOCATION</Label><TextInput value={region} onChange={setRegion} placeholder="Remote / Global" /></div>
            </div>

            {/* ── B: Bounty Economics ── */}
            <SectionHeader label="// SECTION_B — BOUNTY_ECONOMICS" />
            <div className="grid grid-cols-2 gap-4">
              <div><Label>REWARD PER PARTICIPANT (USD) *</Label><TextInput type="number" value={reward} onChange={setReward} placeholder="e.g. 120" required min="1" /></div>
              <div><Label>TARGET PARTICIPANTS *</Label><TextInput type="number" value={targetPax} onChange={setTargetPax} placeholder="e.g. 50" required min="1" /></div>
              <div><Label>OVER-ENROLLMENT BUFFER (%)</Label><TextInput type="number" value={buffer} onChange={setBuffer} placeholder="15" min="0" /></div>
            </div>

            {/* Auto-calculated summary */}
            <div className="p-4 rounded" style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.1)' }}>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>TOTAL SLOTS</p>
                  <p className="mono text-lg font-bold" style={{ color: 'var(--text-white)' }}>{slots || '—'}</p>
                </div>
                <div>
                  <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>TOTAL POOL</p>
                  <p className="mono text-lg font-bold" style={{ color: 'var(--green)' }}>
                    {totalPool > 0 ? `$${totalPool.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
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
                Platform fee applies only on completed payouts. No upfront charge.
              </p>
            </div>

            {/* ── C: Eligibility ── */}
            <SectionHeader label="// SECTION_C — ELIGIBILITY_AND_SCREENING" />
            <div>
              <Label>INCLUSION CRITERIA</Label>
              <Textarea value={inclusion} onChange={setInclusion} placeholder="Who can join? One criterion per line." rows={3} />
            </div>
            <div>
              <Label>EXCLUSION CRITERIA</Label>
              <Textarea value={exclusion} onChange={setExclusion} placeholder="Who cannot join? One criterion per line." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>MIN AGE</Label><TextInput type="number" value={ageMin} onChange={setAgeMin} placeholder="18" min="0" /></div>
              <div><Label>MAX AGE</Label><TextInput type="number" value={ageMax} onChange={setAgeMax} placeholder="65" min="0" /></div>
            </div>
            <div>
              <Label>REQUIRED DEVICES / TOOLS</Label>
              <MultiCheck options={DEVICE_OPTIONS} selected={devices} onChange={setDevices} />
            </div>
            <div>
              <Label>REGION RESTRICTION (leave blank for none)</Label>
              <TextInput value={regionReq} onChange={setRegionReq} placeholder="e.g. United States only" />
            </div>

            {/* ── D: Documents ── */}
            <SectionHeader label="// SECTION_D — ETHICS_AND_APPROVAL" />
            <div>
              <Label>APPROVAL STATUS</Label>
              <Select value={iecApproval} onChange={setIecApproval}
                options={['IRB Approved','Ethics Committee Approved','Pending approval','Not required','Self-governed']}
                placeholder="Select approval status" />
            </div>

            {/* ── F: Optional ── */}
            <SectionHeader label="// SECTION_F — OPTIONAL" />
            <div>
              <Label>COMMUNITY / DISCORD / TELEGRAM LINK</Label>
              <TextInput type="url" value={commsUrl} onChange={setCommsUrl} placeholder="https://discord.gg/..." />
            </div>
            <label className="flex items-start gap-3 cursor-pointer p-4 rounded"
              style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.1)' }}>
              <input type="checkbox" checked={applyVerif} onChange={(e) => setApplyVerif(e.target.checked)}
                className="mt-1 w-4 h-4 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-white)' }}>
                  Apply for ✓ BIOME VERIFIED credential ($1,000)
                </p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Our science team will review your study protocol, safety measures, and compliance framework.
                  Verified experiments get a badge and attract higher-quality participants.
                </p>
              </div>
            </label>

            {/* ── G: Agreement ── */}
            <SectionHeader label="// SECTION_G — AGREEMENT" />
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                required className="mt-1 w-4 h-4 flex-shrink-0" />
              <span className="text-sm" style={{ color: 'var(--text-dim)' }}>
                I agree to the BIOME Platform Agreement. The platform collects a 2.5% fee on successfully
                completed experiment payouts. I understand the bounty pool will be required once
                participants are recruited and the trial is set to commence.
              </span>
            </label>

            {error && <p className="mono text-xs" style={{ color: 'var(--amber)' }}>// ERROR: {error}</p>}

            <button type="submit" disabled={!agreed || !title || !category || !description || !reward || !targetPax || loading}
              className="w-full py-3 rounded font-semibold text-sm transition-all disabled:opacity-40 hover:opacity-90"
              style={{ background: 'var(--green)', color: '#050709' }}
            >
              {loading ? '/ SUBMITTING...' : 'Submit for review →'}
            </button>

          </form>
        </div>
      </div>
    </main>
  );
}
