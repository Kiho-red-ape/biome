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

// ─── Brutalist helpers ────────────────────────────────────────────────────────

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily:    'var(--font-display)',
      fontSize:      10,
      fontWeight:    600,
      letterSpacing: '2.5px',
      textTransform: 'uppercase',
      color:         'var(--gray)',
      marginBottom:  20,
    }}>
      {children}
    </p>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <p style={{
      fontFamily:    'var(--font-display)',
      fontSize:      10,
      fontWeight:    600,
      letterSpacing: '1.5px',
      textTransform: 'uppercase',
      color:         'var(--black)',
      marginBottom:  10,
    }}>
      {children}
      {hint && (
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 10, letterSpacing: 0, textTransform: 'none', color: 'var(--gray)', marginLeft: 8 }}>
          {hint}
        </span>
      )}
    </p>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--black)', lineHeight: 1.4 }}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width:      52,
          height:     28,
          flexShrink: 0,
          background: checked ? 'var(--amber)' : 'var(--off-white)',
          border:     '2.5px solid var(--black)',
          boxShadow:  checked ? '2px 2px 0 var(--black)' : 'none',
          cursor:     'pointer',
          position:   'relative',
          transition: 'background 0.1s',
          display:    'flex',
          alignItems: 'center',
          padding:    '0 4px',
        }}
      >
        <div style={{
          width:      16,
          height:     16,
          background: 'var(--black)',
          position:   'absolute',
          left:       checked ? 28 : 4,
          transition: 'left 0.1s',
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
  onChange: (v: string | string[]) => void;
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
              fontSize:      11,
              fontWeight:    600,
              letterSpacing: '0.5px',
              background:    active ? 'var(--amber)' : 'var(--white)',
              color:         'var(--black)',
              border:        '2px solid var(--black)',
              boxShadow:     active ? '2px 2px 0 var(--black)' : 'none',
              padding:       '6px 14px',
              cursor:        'pointer',
              textTransform: 'capitalize',
            }}
          >
            {opt}
          </button>
        );
      })}
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
      <main style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--gray)' }}>
            Loading...
          </span>
        </div>
      </main>
    );
  }

  if (!form) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--black)' }}>
            No participant profile found.
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
    <main style={{ minHeight: '100vh', background: 'var(--off-white)' }}>
      <SiteHeader />

      {/* ── Page header (navy) ── */}
      <section style={{ background: 'var(--navy)', borderBottom: '3px solid var(--black)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 36px' }}>
          <Link href="/dashboard" style={{
            fontFamily:     'var(--font-display)',
            fontSize:       12,
            fontWeight:     600,
            color:          'rgba(255,255,255,0.4)',
            textDecoration: 'none',
            display:        'inline-block',
            marginBottom:   20,
            letterSpacing:  '0.5px',
          }}>
            ← Dashboard
          </Link>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize:   'clamp(22px, 3vw, 32px)',
            color:      'var(--white)',
            lineHeight: 1.1,
            marginBottom: 8,
          }}>
            Study Preferences
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Helps us match you to relevant studies. All fields optional.
          </p>
        </div>
      </section>

      {/* ── Form body ── */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── Device & tech ── */}
          <div style={{
            border:     '3px solid var(--black)',
            boxShadow:  '4px 4px 0 var(--black)',
            background: 'var(--white)',
          }}>
            <div style={{
              padding:      '14px 24px',
              borderBottom: '3px solid var(--black)',
              background:   'var(--off-white)',
            }}>
              <CardLabel>Device Profile</CardLabel>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

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

            </div>
          </div>

          {/* ── Study availability ── */}
          <div style={{
            border:     '3px solid var(--black)',
            boxShadow:  '4px 4px 0 var(--black)',
            background: 'var(--white)',
          }}>
            <div style={{
              padding:      '14px 24px',
              borderBottom: '3px solid var(--black)',
              background:   'var(--off-white)',
            }}>
              <CardLabel>Study Availability</CardLabel>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

              <div>
                <FieldLabel>Weekly Availability (hours)</FieldLabel>
                <input
                  type="number"
                  min={0}
                  max={168}
                  value={form.weekly_availability_hours ?? ''}
                  onChange={(e) => set('weekly_availability_hours', e.target.value === '' ? null : Number(e.target.value))}
                  style={{
                    fontFamily:  'var(--font-body)',
                    fontSize:    14,
                    color:       'var(--black)',
                    background:  'var(--off-white)',
                    border:      '2px solid var(--black)',
                    padding:     '8px 12px',
                    width:       100,
                    outline:     'none',
                  }}
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
                  style={{
                    fontFamily:  'var(--font-body)',
                    fontSize:    14,
                    color:       'var(--black)',
                    background:  'var(--off-white)',
                    border:      '2px solid var(--black)',
                    padding:     '8px 12px',
                    width:       '100%',
                    maxWidth:    360,
                    outline:     'none',
                    boxSizing:   'border-box',
                  }}
                />
              </div>

            </div>
          </div>

          {/* ── Research context ── */}
          <div style={{
            border:     '3px solid var(--black)',
            boxShadow:  '4px 4px 0 var(--black)',
            background: 'var(--white)',
          }}>
            <div style={{
              padding:      '14px 24px',
              borderBottom: '3px solid var(--black)',
              background:   'var(--off-white)',
            }}>
              <CardLabel>Research Context</CardLabel>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

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
                  style={{
                    fontFamily:  'var(--font-body)',
                    fontSize:    14,
                    color:       'var(--black)',
                    background:  'var(--off-white)',
                    border:      '2px solid var(--black)',
                    padding:     '10px 12px',
                    width:       '100%',
                    outline:     'none',
                    resize:      'vertical',
                    lineHeight:  1.5,
                    boxSizing:   'border-box',
                  }}
                />
              </div>

            </div>
          </div>

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
                  fontSize:    12,
                  fontWeight:  600,
                  color:       'var(--gray)',
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
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize:   12,
                fontWeight: 600,
                color:      msg.ok ? 'var(--black)' : '#dc2626',
                background: msg.ok ? 'var(--amber)' : 'rgba(220,38,38,0.1)',
                border:     `1.5px solid ${msg.ok ? 'var(--black)' : '#dc2626'}`,
                padding:    '4px 10px',
              }}>
                {msg.ok ? '✓ ' : ''}{msg.text}
              </span>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
