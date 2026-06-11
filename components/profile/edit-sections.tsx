'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import type { ParticipantProfile } from '@/lib/types';

// ─── Shared field components ─────────────────────────────────────────────────

function FieldRow({ label, value, locked }: { label: string; value: string | number | boolean | null | undefined; locked?: boolean }) {
  const display = value === null || value === undefined || value === '' ? '—' : String(value);
  return (
    <div className="flex items-start justify-between gap-4 py-2" style={{ borderBottom: '1px solid var(--border-soft)' }}>
      <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--muted)', flexShrink: 0 }}>
        {locked && <span title="Permanent field">🔒</span>}
        {label}
      </span>
      <span className="text-sm text-right" style={{ color: 'var(--ink)' }}>{display}</span>
    </div>
  );
}

function SectionCard({ title, done, children }: { title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <div
      className="p-6 mb-4"
      style={{
        background:   'var(--surface)',
        border:       '1px solid var(--border-soft)',
        borderRadius: 'var(--radius)',
        boxShadow:    'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <p
          className="text-xs font-semibold uppercase"
          style={{ color: 'var(--teal)', letterSpacing: '1px' }}
        >
          {title}
        </p>
        {done && <span className="chip chip-success">✓ Complete</span>}
      </div>
      {children}
    </div>
  );
}

function InputField({ label, name, type = 'text', value, onChange, placeholder, required }: {
  label: string; name: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ink)' }}>
        {label}{required && ' *'}
      </label>
      <input
        type={type} name={name} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} required={required}
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, placeholder }: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ink)' }}>{label}</label>
      <select
        value={value} name={name} onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer"
        style={{ color: value ? 'var(--ink)' : 'var(--muted)' }}
      >
        <option value="">{placeholder ?? 'Select…'}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function MultiCheck({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  }
  return (
    <div>
      <label className="text-sm font-medium block mb-2" style={{ color: 'var(--ink)' }}>{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button key={opt} type="button" onClick={() => toggle(opt)}
              className="text-sm font-medium px-3.5 py-1.5 transition-colors"
              style={{
                background:   active ? 'var(--teal-faint)' : 'var(--surface)',
                border:       `1px solid ${active ? 'var(--teal)' : 'var(--border-mid)'}`,
                color:        active ? 'var(--teal-dark)' : 'var(--slate)',
                borderRadius: 999,
                cursor:       'pointer',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SaveButton({ loading, disabled }: { loading: boolean; disabled?: boolean }) {
  return (
    <button type="submit" disabled={loading || disabled}
      className="btn-primary self-start disabled:opacity-40"
    >
      {loading ? 'Saving…' : 'Save & continue →'}
    </button>
  );
}

// ─── Step 2: Demographics ─────────────────────────────────────────────────────

function Step2Form({ profile, onSaved }: { profile: ParticipantProfile; onSaved: (p: ParticipantProfile) => void }) {
  const [yob,        setYob]        = useState(profile.year_of_birth ? String(profile.year_of_birth) : '');
  const [sex,        setSex]        = useState(profile.sex_assigned_at_birth ?? '');
  const [gender,     setGender]     = useState(profile.gender_identity ?? '');
  const [ethnicity,  setEthnicity]  = useState(profile.ethnicity ?? '');
  const [nationality,setNationality]= useState(profile.nationality ?? '');
  const [stateReg,   setStateReg]   = useState(profile.state_region ?? '');
  const [urbanicity, setUrbanicity] = useState(profile.urbanicity ?? '');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr(null);
    const res = await fetch('/api/participant-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        privyDid: profile.user_id, step: 2,
        year_of_birth: yob ? parseInt(yob) : null,
        sex_assigned_at_birth: sex || null,
        gender_identity: gender || null,
        ethnicity: ethnicity || null,
        nationality: nationality || null,
        state_region: stateReg || null,
        urbanicity: urbanicity || null,
      }),
    });
    const data = await res.json() as { profile?: ParticipantProfile; error?: string };
    if (!res.ok) { setErr(data.error ?? 'Save failed'); setLoading(false); return; }
    onSaved(data.profile!);
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div
        className="p-3 text-sm flex items-start gap-2"
        style={{
          background:   'var(--warning-soft)',
          border:       '1px solid rgba(180,83,9,0.2)',
          borderRadius: 'var(--radius-sm)',
          color:        'var(--warning)',
        }}
      >
        <span aria-hidden>⚠</span>
        <span>Year of birth, sex, ethnicity and nationality are permanent and cannot be changed after submission.</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Year of birth" name="yob" type="number" value={yob} onChange={setYob} placeholder="e.g. 1995" />
        <SelectField label="Sex assigned at birth" name="sex" value={sex} onChange={setSex}
          options={[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'intersex',label:'Intersex'},{value:'prefer_not_to_say',label:'Prefer not to say'}]} />
        <InputField label="Gender identity (optional)" name="gender" value={gender} onChange={setGender} placeholder="e.g. Non-binary" />
        <InputField label="Ethnicity" name="ethnicity" value={ethnicity} onChange={setEthnicity} placeholder="e.g. South Asian" />
        <InputField label="Nationality" name="nationality" value={nationality} onChange={setNationality} placeholder="e.g. Indian" />
        <InputField label="State / region" name="state_region" value={stateReg} onChange={setStateReg} placeholder="e.g. Maharashtra" />
        <SelectField label="Urbanicity" name="urbanicity" value={urbanicity} onChange={setUrbanicity}
          options={[{value:'urban',label:'Urban'},{value:'suburban',label:'Suburban'},{value:'rural',label:'Rural'}]} />
      </div>
      {err && <p className="text-sm" style={{ color: 'var(--error)' }}>{err}</p>}
      <SaveButton loading={loading} />
    </form>
  );
}

function Step2ReadOnly({ profile }: { profile: ParticipantProfile }) {
  return (
    <div className="flex flex-col">
      <FieldRow label="Year of birth"  value={profile.year_of_birth}          locked />
      <FieldRow label="Sex"            value={profile.sex_assigned_at_birth}   locked />
      <FieldRow label="Gender"         value={profile.gender_identity} />
      <FieldRow label="Ethnicity"      value={profile.ethnicity}               locked />
      <FieldRow label="Nationality"    value={profile.nationality}             locked />
      <FieldRow label="Region"         value={profile.state_region} />
      <FieldRow label="Urbanicity"     value={profile.urbanicity} />
    </div>
  );
}

// ─── Step 3: Capability ───────────────────────────────────────────────────────

const WEARABLE_OPTIONS   = ['Apple Watch', 'Garmin', 'Fitbit', 'Oura Ring', 'Whoop', 'CGM', 'None'];
const SAMPLE_OPTIONS     = ['Blood prick', 'Saliva', 'Stool kit', 'Urine', 'Hair', 'None'];
const LANGUAGE_OPTIONS   = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Mandarin', 'Arabic', 'Portuguese', 'Japanese'];

function Step3Form({ profile, onSaved }: { profile: ParticipantProfile; onSaved: (p: ParticipantProfile) => void }) {
  const [os,           setOs]          = useState(profile.smartphone_os ?? '');
  const [wearables,    setWearables]   = useState<string[]>(profile.wearable_devices ?? []);
  const [internet,     setInternet]    = useState(profile.internet_reliability ?? '');
  const [kits,         setKits]        = useState<string>(profile.can_receive_kits === true ? 'yes' : profile.can_receive_kits === false ? 'no' : '');
  const [comfort,      setComfort]     = useState<string[]>(profile.sample_comfort ?? []);
  const [languages,    setLanguages]   = useState<string[]>(profile.language_fluency ?? []);
  const [hours,        setHours]       = useState(profile.weekly_availability_hours ? String(profile.weekly_availability_hours) : '');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr(null);
    const res = await fetch('/api/participant-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        privyDid: profile.user_id, step: 3,
        smartphone_os: os || null,
        wearable_devices: wearables.length ? wearables : null,
        internet_reliability: internet || null,
        can_receive_kits: kits === 'yes' ? true : kits === 'no' ? false : null,
        sample_comfort: comfort.length ? comfort : null,
        language_fluency: languages.length ? languages : null,
        weekly_availability_hours: hours ? parseFloat(hours) : null,
      }),
    });
    const data = await res.json() as { profile?: ParticipantProfile; error?: string };
    if (!res.ok) { setErr(data.error ?? 'Save failed'); setLoading(false); return; }
    onSaved(data.profile!);
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="Smartphone OS" name="os" value={os} onChange={setOs}
          options={[{value:'ios',label:'iOS'},{value:'android',label:'Android'},{value:'both',label:'Both'},{value:'none',label:'None'}]} />
        <SelectField label="Internet reliability" name="internet" value={internet} onChange={setInternet}
          options={[{value:'stable',label:'Stable / Broadband'},{value:'intermittent',label:'Intermittent'},{value:'limited',label:'Limited / Mobile only'}]} />
        <SelectField label="Can receive kits by mail?" name="kits" value={kits} onChange={setKits}
          options={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]} />
        <InputField label="Weekly availability (hours)" name="hours" type="number" value={hours} onChange={setHours} placeholder="e.g. 5" />
      </div>
      <MultiCheck label="Wearable devices" options={WEARABLE_OPTIONS} selected={wearables} onChange={setWearables} />
      <MultiCheck label="Sample comfort" options={SAMPLE_OPTIONS} selected={comfort} onChange={setComfort} />
      <MultiCheck label="Language fluency" options={LANGUAGE_OPTIONS} selected={languages} onChange={setLanguages} />
      {err && <p className="text-sm" style={{ color: 'var(--error)' }}>{err}</p>}
      <SaveButton loading={loading} />
    </form>
  );
}

function Step3ReadOnly({ profile }: { profile: ParticipantProfile }) {
  return (
    <div className="flex flex-col">
      <FieldRow label="Smartphone OS"      value={profile.smartphone_os} />
      <FieldRow label="Internet"           value={profile.internet_reliability} />
      <FieldRow label="Can receive kits"   value={profile.can_receive_kits === null ? null : profile.can_receive_kits ? 'Yes' : 'No'} />
      <FieldRow label="Wearables"          value={(profile.wearable_devices ?? []).join(', ')} />
      <FieldRow label="Sample comfort"     value={(profile.sample_comfort ?? []).join(', ')} />
      <FieldRow label="Languages"          value={(profile.language_fluency ?? []).join(', ')} />
      <FieldRow label="Weekly hours"       value={profile.weekly_availability_hours} />
    </div>
  );
}

// ─── Step 4: Research History ─────────────────────────────────────────────────

function Step4Form({ profile, onSaved }: { profile: ParticipantProfile; onSaved: (p: ParticipantProfile) => void }) {
  const [count,      setCount]      = useState(String(profile.previous_study_count ?? 0));
  const [recent,     setRecent]     = useState(profile.recent_interventions ?? '');
  const [washout,    setWashout]    = useState(profile.washout_sensitive ?? false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr(null);
    const res = await fetch('/api/participant-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        privyDid: profile.user_id, step: 4,
        previous_study_count: parseInt(count) || 0,
        recent_interventions: recent || null,
        washout_sensitive: washout,
      }),
    });
    const data = await res.json() as { profile?: ParticipantProfile; error?: string };
    if (!res.ok) { setErr(data.error ?? 'Save failed'); setLoading(false); return; }
    onSaved(data.profile!);
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Previous study count" name="count" type="number" value={count} onChange={setCount} placeholder="0" />
      </div>
      <div>
        <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--ink)' }}>
          Recent interventions <span className="font-normal" style={{ color: 'var(--muted)' }}>(optional)</span>
        </label>
        <textarea
          value={recent} onChange={(e) => setRecent(e.target.value)}
          placeholder="List any supplements, medications, or dietary changes you're currently doing..."
          rows={3}
          className="resize-none"
        />
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={washout} onChange={(e) => setWashout(e.target.checked)}
          className="w-4 h-4 rounded" style={{ accentColor: 'var(--teal)' }} />
        <span className="text-sm" style={{ color: 'var(--slate)' }}>
          I am sensitive to washout periods and need at least 4 weeks between studies
        </span>
      </label>
      {err && <p className="text-sm" style={{ color: 'var(--error)' }}>{err}</p>}
      <SaveButton loading={loading} />
    </form>
  );
}

function Step4ReadOnly({ profile }: { profile: ParticipantProfile }) {
  return (
    <div className="flex flex-col">
      <FieldRow label="Prior studies"      value={profile.previous_study_count} />
      <FieldRow label="Recent interventions" value={profile.recent_interventions} />
      <FieldRow label="Washout sensitive"  value={profile.washout_sensitive ? 'Yes' : 'No'} />
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ProfileEditSections({ participantId }: { participantId: string }) {
  const { user, authenticated } = usePrivy();
  const [profile, setProfile] = useState<ParticipantProfile | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkOwnership = useCallback(async () => {
    if (!authenticated || !user) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/participant-profile?privyDid=${encodeURIComponent(user.id)}`);
      const data = await res.json() as { profile: ParticipantProfile | null };
      if (data.profile?.participant_id === participantId) {
        setIsOwner(true);
        setProfile(data.profile);
      }
    } finally {
      setLoading(false);
    }
  }, [authenticated, user, participantId]);

  useEffect(() => { void checkOwnership(); }, [checkOwnership]);

  if (loading || !isOwner || !profile) return null;

  const step = profile.onboarding_step ?? 1;
  const pct  = step >= 4 ? 100 : step >= 3 ? 75 : step >= 2 ? 50 : 25;
  const pctColor = pct === 100 ? 'var(--success)' : 'var(--teal)';

  return (
    <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-soft)' }}>

      {/* Progress header */}
      <div className="flex items-center justify-between mb-2">
        <p
          className="text-xs font-semibold uppercase"
          style={{ color: 'var(--teal)', letterSpacing: '1px' }}
        >
          Profile completeness
        </p>
        <span className="text-xs font-bold" style={{ color: pctColor }}>{pct}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden mb-6" style={{ background: 'var(--teal-soft)' }}>
        <div className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: pct === 100 ? 'var(--success)' : 'var(--teal)' }} />
      </div>

      {/* Section 2: Demographics */}
      <SectionCard title="Section 2 — Demographics" done={step >= 2}>
        {step >= 2
          ? <Step2ReadOnly profile={profile} />
          : <Step2Form profile={profile} onSaved={setProfile} />}
      </SectionCard>

      {/* Section 3: Capability — only visible once step 2 is done */}
      {step >= 2 && (
        <SectionCard title="Section 3 — Capability" done={step >= 3}>
          {step >= 3
            ? <Step3ReadOnly profile={profile} />
            : <Step3Form profile={profile} onSaved={setProfile} />}
        </SectionCard>
      )}

      {/* Section 4: Research History — only visible once step 3 is done */}
      {step >= 3 && (
        <SectionCard title="Section 4 — Research History" done={step >= 4}>
          {step >= 4
            ? <Step4ReadOnly profile={profile} />
            : <Step4Form profile={profile} onSaved={setProfile} />}
        </SectionCard>
      )}

      {pct === 100 && (
        <p className="text-sm text-center mt-2 font-medium" style={{ color: 'var(--success)' }}>
          ✓ Profile complete. You are eligible for all studies.
        </p>
      )}
    </div>
  );
}
