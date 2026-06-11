'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { SiteHeader } from '@/components/nav/header';

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

// ─── Clinical helpers ─────────────────────────────────────────────────────────

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <p style={{
      fontFamily:   'var(--font-display)',
      fontSize:     14,
      fontWeight:   500,
      color:        'var(--ink)',
      marginBottom: 10,
    }}>
      {children}
      {hint && (
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
          {hint}
        </span>
      )}
    </p>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.4 }}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width:        46,
          height:       26,
          flexShrink:   0,
          background:   checked ? 'var(--teal)' : 'var(--border-mid)',
          border:       'none',
          borderRadius: 999,
          cursor:       'pointer',
          position:     'relative',
          transition:   'background 150ms ease',
          padding:      0,
        }}
      >
        <div style={{
          width:        20,
          height:       20,
          background:   '#ffffff',
          borderRadius: '50%',
          boxShadow:    'var(--shadow-sm)',
          position:     'absolute',
          top:          3,
          left:         checked ? 23 : 3,
          transition:   'left 150ms ease',
        }} />
      </button>
    </div>
  );
}

function PillGroup({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: string[];
  value: string | string[] | null;
  onChange: (v: string | string[] | null) => void;
  multi?: boolean;
}) {
  function isActive(opt: string) {
    if (multi) return Array.isArray(value) && value.includes(opt);
    return value === opt;
  }
  function toggle(opt: string) {
    if (multi) {
      const arr = Array.isArray(value) ? value : [];
      onChange(arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt]);
    } else {
      onChange(value === opt ? null : opt);
    }
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const active = isActive(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            style={{
              fontFamily:    'var(--font-display)',
              fontSize:      13,
              fontWeight:    500,
              background:    active ? 'var(--teal-faint)' : 'var(--surface)',
              color:         active ? 'var(--teal-dark)' : 'var(--slate)',
              border:        `1px solid ${active ? 'var(--teal)' : 'var(--border-mid)'}`,
              borderRadius:  999,
              padding:       '6px 14px',
              cursor:        'pointer',
              textTransform: 'capitalize',
              transition:    'background 150ms ease, border-color 150ms ease, color 150ms ease',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background:   'var(--surface)',
      border:       '1px solid var(--border-soft)',
      borderRadius: 'var(--radius)',
      boxShadow:    'var(--shadow-sm)',
      overflow:     'hidden',
    }}>
      <div style={{
        padding:      '16px 24px',
        borderBottom: '1px solid var(--border-soft)',
        background:   'var(--bg-page)',
      }}>
        <p style={{
          fontFamily:    'var(--font-display)',
          fontSize:      12,
          fontWeight:    600,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color:         'var(--teal)',
          margin:        0,
        }}>
          {title}
        </p>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {children}
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
        setMsg({ text: 'Preferences saved', ok: true });
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
      <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)' }}>
            Loading…
          </span>
        </div>
      </main>
    );
  }

  if (!form) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
            No profile found.
          </p>
          <Link href="/onboarding/participant" className="btn-primary">
            Complete onboarding →
          </Link>
        </div>
      </main>
    );
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(prefs);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <SiteHeader />

      {/* ── Page header ── */}
      <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 36px' }}>
          <Link href="/dashboard" style={{
            fontFamily:     'var(--font-display)',
            fontSize:       13,
            fontWeight:     500,
            color:          'var(--muted)',
            textDecoration: 'none',
            display:        'inline-block',
            marginBottom:   20,
          }}>
            ← Dashboard
          </Link>
          <h1 style={{
            fontFamily:   'var(--font-display)',
            fontWeight:   600,
            fontSize:     'clamp(22px, 3vw, 32px)',
            color:        'var(--ink)',
            lineHeight:   1.15,
            marginBottom: 8,
          }}>
            Study Preferences
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', margin: 0 }}>
            Helps us match you to relevant studies. All fields optional.
          </p>
        </div>
      </section>

      {/* ── Form body ── */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Device & tech ── */}
          <SectionCard title="Device Profile">

            <div>
              <FieldLabel>Smartphone OS</FieldLabel>
              <PillGroup
                options={['ios', 'android', 'both', 'none']}
                value={form.smartphone_os}
                onChange={(v) => set('smartphone_os', v as string)}
              />
            </div>

            <div>
              <FieldLabel>Wearable Devices</FieldLabel>
              <PillGroup
                options={WEARABLES}
                value={form.wearable_devices ?? []}
                onChange={(v) => set('wearable_devices', v as string[])}
                multi
              />
            </div>

            <div>
              <FieldLabel>Internet Reliability</FieldLabel>
              <PillGroup
                options={['stable', 'intermittent', 'limited']}
                value={form.internet_reliability}
                onChange={(v) => set('internet_reliability', v as string)}
              />
            </div>

          </SectionCard>

          {/* ── Study availability ── */}
          <SectionCard title="Study Availability">

            <div>
              <FieldLabel>Weekly Availability (hours)</FieldLabel>
              <input
                type="number"
                min={0}
                max={168}
                value={form.weekly_availability_hours ?? ''}
                onChange={(e) => set('weekly_availability_hours', e.target.value === '' ? null : Number(e.target.value))}
                style={{ width: 120 }}
              />
            </div>

            <Toggle
              label="Can receive physical kits (blood draw, samples)"
              checked={form.can_receive_kits ?? false}
              onChange={(v) => set('can_receive_kits', v)}
            />

            <div>
              <FieldLabel>Sample Comfort</FieldLabel>
              <PillGroup
                options={SAMPLE_TYPES}
                value={form.sample_comfort ?? []}
                onChange={(v) => set('sample_comfort', v as string[])}
                multi
              />
            </div>

            <div>
              <FieldLabel>Urbanicity</FieldLabel>
              <PillGroup
                options={['urban', 'suburban', 'rural']}
                value={form.urbanicity}
                onChange={(v) => set('urbanicity', v as string)}
              />
            </div>

            <div>
              <FieldLabel>State / Region</FieldLabel>
              <input
                type="text"
                value={form.state_region ?? ''}
                onChange={(e) => set('state_region', e.target.value || null)}
                placeholder="e.g. California, Bavaria, Ontario"
                style={{ maxWidth: 360 }}
              />
            </div>

          </SectionCard>

          {/* ── Research context ── */}
          <SectionCard title="Research Context">

            <div>
              <FieldLabel>Language Fluency</FieldLabel>
              <PillGroup
                options={LANGUAGES}
                value={form.language_fluency ?? []}
                onChange={(v) => set('language_fluency', v as string[])}
                multi
              />
            </div>

            <Toggle
              label="Washout sensitive — recent substances may affect my eligibility"
              checked={form.washout_sensitive ?? false}
              onChange={(v) => set('washout_sensitive', v)}
            />

            <div>
              <FieldLabel hint="medications, supplements, diets started in last 3 months">
                Recent Interventions
              </FieldLabel>
              <textarea
                rows={3}
                value={form.recent_interventions ?? ''}
                onChange={(e) => set('recent_interventions', e.target.value || null)}
                placeholder="e.g. Metformin 500mg, Keto diet, Intermittent fasting..."
                style={{ resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>

          </SectionCard>

          {/* ── Save bar ── */}
          <div style={{
            display:     'flex',
            alignItems:  'center',
            gap:         16,
            paddingTop:  8,
            flexWrap:    'wrap',
          }}>
            <button
              onClick={() => void save()}
              disabled={saving || !dirty}
              className="btn-primary"
              style={{ opacity: saving || !dirty ? 0.45 : 1 }}
            >
              {saving ? 'Saving...' : dirty ? 'Save preferences →' : 'No changes'}
            </button>
            {dirty && (
              <button
                onClick={() => setForm(prefs)}
                style={{
                  fontFamily:  'var(--font-display)',
                  fontSize:    13,
                  fontWeight:  500,
                  color:       'var(--slate)',
                  background:  'none',
                  border:      'none',
                  cursor:      'pointer',
                  padding:     0,
                }}
              >
                Reset
              </button>
            )}
            {msg && (
              <span
                className={msg.ok ? 'chip chip-success' : 'chip'}
                style={msg.ok ? undefined : {
                  background:  'var(--error-soft)',
                  color:       'var(--error)',
                  borderColor: 'rgba(185,28,28,0.25)',
                }}
              >
                {msg.ok ? '✓ ' : ''}{msg.text}
              </span>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
