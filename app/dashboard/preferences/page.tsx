'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';

// ─── Types ────────────────────────────────────────────────────────────────────

type Prefs = {
  smartphone_os:             string | null;
  wearable_devices:          string[] | null;
  internet_reliability:      string | null;
  can_receive_kits:          boolean | null;
  sample_comfort:            string[] | null;
  language_fluency:          string[] | null;
  weekly_availability_hours: number | null;
  washout_sensitive:         boolean;
  recent_interventions:      string | null;
  urbanicity:                string | null;
  state_region:              string | null;
};

const WEARABLES    = ['Apple Watch', 'Fitbit', 'Garmin', 'Oura Ring', 'Whoop', 'Other'];
const SAMPLE_TYPES = ['Blood draw', 'Saliva', 'Urine', 'Stool', 'Skin swab', 'Hair', 'None'];
const LANGUAGES    = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Portuguese', 'Hindi', 'Arabic'];

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm" style={{ color: 'var(--text-bright)' }}>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className="relative rounded-full transition-all"
        style={{
          width:      40,
          height:     22,
          background: checked ? 'var(--green)' : 'rgba(77,255,128,0.12)',
          border:     `1px solid ${checked ? 'var(--green)' : 'rgba(77,255,128,0.2)'}`,
          cursor:     'pointer',
          flexShrink: 0,
        }}
      >
        <div
          className="absolute top-0.5 rounded-full transition-all"
          style={{
            width:      16,
            height:     16,
            background: checked ? '#050709' : 'rgba(77,255,128,0.4)',
            left:       checked ? 20 : 2,
          }}
        />
      </div>
    </label>
  );
}

function CheckGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  }
  return (
    <div>
      <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className="mono text-xs px-2.5 py-1.5 rounded transition-all"
            style={{
              border:     `1px solid ${value.includes(opt) ? 'var(--green)' : 'rgba(77,255,128,0.15)'}`,
              color:      value.includes(opt) ? 'var(--green)' : 'var(--text-dim)',
              background: value.includes(opt) ? 'rgba(77,255,128,0.08)' : 'transparent',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PreferencesPage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();

  const [prefs,   setPrefs]   = useState<Prefs | null>(null);
  const [form,    setForm]    = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async (privyDid: string) => {
    const res  = await fetch(`/api/participant-profile?privyDid=${encodeURIComponent(privyDid)}`);
    const data = await res.json() as { profile?: Prefs | null };
    if (data.profile) {
      setPrefs(data.profile);
      setForm(data.profile);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) { router.replace('/'); return; }
    void load(user.id);
  }, [ready, authenticated, user, router, load]);

  async function save() {
    if (!form || !user) return;
    setSaving(true);
    setMsg(null);
    try {
      const res  = await fetch('/api/participant-profile/preferences', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ privyDid: user.id, ...form }),
      });
      const data = await res.json() as { error?: unknown };
      if (!res.ok) {
        setMsg({ text: `Error: ${String(data.error ?? 'Save failed')}`, ok: false });
      } else {
        setMsg({ text: '✓ Preferences saved', ok: true });
        setPrefs(form);
      }
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof Prefs>(key: K, val: Prefs[K]) {
    setForm((f) => f ? { ...f, [key]: val } : f);
  }

  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// LOADING...</span>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="mono text-xs" style={{ color: 'var(--amber)' }}>
          // No participant profile found.{' '}
          <Link href="/onboarding/participant" style={{ color: 'var(--green)' }}>Complete onboarding →</Link>
        </p>
      </div>
    );
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(prefs);

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">

        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="mono text-xs no-underline" style={{ color: 'var(--text-dim)' }}>
            ← DASHBOARD
          </Link>
          <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// PREFERENCES</span>
        </div>

        <div className="flex flex-col gap-5">

          {/* ── Device & tech ──────────────────────────────────── */}
          <section className="rounded p-5" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
            <p className="mono text-xs mb-4" style={{ color: 'var(--text-dim)' }}>// DEVICE_PROFILE</p>

            <div className="flex flex-col gap-4">
              <div>
                <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>SMARTPHONE OS</p>
                <div className="flex gap-2">
                  {['ios', 'android', 'both', 'none'].map((os) => (
                    <button
                      key={os}
                      type="button"
                      onClick={() => set('smartphone_os', os)}
                      className="mono text-xs px-3 py-1.5 rounded transition-all capitalize"
                      style={{
                        border:     `1px solid ${form.smartphone_os === os ? 'var(--green)' : 'rgba(77,255,128,0.15)'}`,
                        color:      form.smartphone_os === os ? 'var(--green)' : 'var(--text-dim)',
                        background: form.smartphone_os === os ? 'rgba(77,255,128,0.08)' : 'transparent',
                      }}
                    >
                      {os}
                    </button>
                  ))}
                </div>
              </div>

              <CheckGroup
                label="WEARABLE DEVICES"
                options={WEARABLES}
                value={form.wearable_devices ?? []}
                onChange={(v) => set('wearable_devices', v)}
              />

              <div>
                <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>INTERNET RELIABILITY</p>
                <div className="flex gap-2">
                  {['stable', 'intermittent', 'limited'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set('internet_reliability', r)}
                      className="mono text-xs px-3 py-1.5 rounded transition-all capitalize"
                      style={{
                        border:     `1px solid ${form.internet_reliability === r ? 'var(--green)' : 'rgba(77,255,128,0.15)'}`,
                        color:      form.internet_reliability === r ? 'var(--green)' : 'var(--text-dim)',
                        background: form.internet_reliability === r ? 'rgba(77,255,128,0.08)' : 'transparent',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Study availability ────────────────────────────── */}
          <section className="rounded p-5" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
            <p className="mono text-xs mb-4" style={{ color: 'var(--text-dim)' }}>// STUDY_AVAILABILITY</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="mono text-xs mb-2 block" style={{ color: 'var(--text-dim)' }}>
                  WEEKLY AVAILABILITY (hours)
                </label>
                <input
                  type="number"
                  min={0}
                  max={168}
                  value={form.weekly_availability_hours ?? ''}
                  onChange={(e) => set('weekly_availability_hours', e.target.value === '' ? null : Number(e.target.value))}
                  className="mono text-sm px-3 py-2 rounded outline-none w-32"
                  style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
                />
              </div>

              <Toggle
                label="Can receive physical kits (blood draw, samples)"
                checked={form.can_receive_kits ?? false}
                onChange={(v) => set('can_receive_kits', v)}
              />

              <CheckGroup
                label="SAMPLE COMFORT"
                options={SAMPLE_TYPES}
                value={form.sample_comfort ?? []}
                onChange={(v) => set('sample_comfort', v)}
              />

              <div>
                <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>URBANICITY</p>
                <div className="flex gap-2">
                  {['urban', 'suburban', 'rural'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => set('urbanicity', u)}
                      className="mono text-xs px-3 py-1.5 rounded transition-all capitalize"
                      style={{
                        border:     `1px solid ${form.urbanicity === u ? 'var(--green)' : 'rgba(77,255,128,0.15)'}`,
                        color:      form.urbanicity === u ? 'var(--green)' : 'var(--text-dim)',
                        background: form.urbanicity === u ? 'rgba(77,255,128,0.08)' : 'transparent',
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mono text-xs mb-2 block" style={{ color: 'var(--text-dim)' }}>STATE / REGION</label>
                <input
                  type="text"
                  value={form.state_region ?? ''}
                  onChange={(e) => set('state_region', e.target.value || null)}
                  placeholder="e.g. California, Bavaria, Ontario"
                  className="mono text-sm px-3 py-2 rounded outline-none w-full"
                  style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
                />
              </div>
            </div>
          </section>

          {/* ── Language + study history ───────────────────────── */}
          <section className="rounded p-5" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
            <p className="mono text-xs mb-4" style={{ color: 'var(--text-dim)' }}>// RESEARCH_CONTEXT</p>

            <div className="flex flex-col gap-4">
              <CheckGroup
                label="LANGUAGE FLUENCY"
                options={LANGUAGES}
                value={form.language_fluency ?? []}
                onChange={(v) => set('language_fluency', v)}
              />

              <Toggle
                label="Washout sensitive (recent substances affect eligibility)"
                checked={form.washout_sensitive ?? false}
                onChange={(v) => set('washout_sensitive', v)}
              />

              <div>
                <label className="mono text-xs mb-2 block" style={{ color: 'var(--text-dim)' }}>
                  RECENT INTERVENTIONS
                  <span className="ml-2" style={{ color: 'var(--text-dim)', fontSize: 9 }}>
                    (medications, supplements, diets started in the last 3 months)
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={form.recent_interventions ?? ''}
                  onChange={(e) => set('recent_interventions', e.target.value || null)}
                  placeholder="e.g. Metformin 500mg, Keto diet, Intermittent fasting..."
                  className="mono text-sm px-3 py-2 rounded outline-none w-full resize-y"
                  style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
                />
              </div>
            </div>
          </section>

          {/* Save bar */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => void save()}
              disabled={saving || !dirty}
              className="mono text-xs px-6 py-2.5 rounded font-bold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'var(--green)', color: '#050709' }}
            >
              {saving ? 'Saving...' : dirty ? 'Save preferences →' : 'No changes'}
            </button>
            {dirty && (
              <button
                onClick={() => setForm(prefs)}
                className="mono text-xs transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Reset
              </button>
            )}
            {msg && (
              <p className="mono text-xs" style={{ color: msg.ok ? 'var(--green)' : 'var(--amber)' }}>
                {msg.text}
              </p>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
