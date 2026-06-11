'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy, useLinkAccount } from '@privy-io/react-auth';
import type { ParticipantProfile } from '@/lib/types';
import { LegalModal } from '@/components/ui/legal-modal';
import type { LegalDocKey } from '@/lib/legal/documents';

// ─── Countries ─────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina',
  'Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados',
  'Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana',
  'Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon',
  'Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros',
  'Congo (Brazzaville)','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark',
  'Djibouti','Dominica','Dominican Republic','DR Congo','Ecuador','Egypt','El Salvador',
  'Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France',
  'Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea',
  'Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran',
  'Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati',
  'Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein',
  'Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta',
  'Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco',
  'Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal',
  'Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia',
  'Norway','Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay',
  'Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda',
  'Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa',
  'San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles',
  'Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa',
  'South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland',
  'Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga',
  'Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine',
  'United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu',
  'Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ['Account', 'Demographics', 'Capability', 'History'];
  return (
    <div className="flex items-center gap-2 mb-8" aria-label={`Step ${current} of ${steps.length}`}>
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === current;
        const done = num < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: active ? 'var(--teal)' : done ? 'var(--teal-soft)' : 'var(--surface)',
                  color:      active ? '#ffffff' : done ? 'var(--teal-dark)' : 'var(--muted)',
                  border:     active ? '1px solid var(--teal)' : done ? '1px solid var(--teal)' : '1px solid var(--border-mid)',
                }}
              >
                {done ? '✓' : num}
              </span>
              <span
                className="text-xs font-medium hidden sm:block"
                style={{ color: active ? 'var(--teal-dark)' : done ? 'var(--slate)' : 'var(--muted)' }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                style={{ width: 18, height: 1, background: done ? 'var(--teal)' : 'var(--border-mid)', display: 'inline-block' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared label styles ───────────────────────────────────────────────────────

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="text-sm font-medium block mb-2" style={{ color: 'var(--ink)' }}>
      {children}
      {hint && (
        <span className="ml-2 text-xs font-normal" style={{ color: 'var(--muted)' }}>
          {hint}
        </span>
      )}
    </label>
  );
}

const cardStyle: React.CSSProperties = {
  background:   'var(--surface)',
  border:       '1px solid var(--border-soft)',
  borderRadius: 'var(--radius)',
  boxShadow:    'var(--shadow-sm)',
  padding:      36,
};

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ParticipantOnboardingPage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();
  const { linkPhone } = useLinkAccount();

  const [checking, setChecking] = useState(true);
  const [country, setCountry] = useState('');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [sex, setSex] = useState('');
  const [studyAlerts, setStudyAlerts] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<LegalDocKey | null>(null);
  const [welcome, setWelcome] = useState<{ pseudonym: string; participantId: string } | null>(null);

  // Silent device fingerprint capture
  useEffect(() => {
    const fp = [
      navigator.userAgent,
      `${screen.width}x${screen.height}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.language,
    ].join('|');
    setDeviceFingerprint(fp);
  }, []);

  // Check if participant_profiles row already exists — if so, skip to dashboard
  const checkExisting = useCallback(async (privyDid: string) => {
    try {
      const res = await fetch(`/api/participant-profile?privyDid=${encodeURIComponent(privyDid)}`);
      const data = (await res.json()) as { profile: ParticipantProfile | null };
      if (data.profile) {
        router.replace('/dashboard');
      } else {
        setChecking(false);
      }
    } catch {
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    void checkExisting(user.id);
  }, [ready, authenticated, user, checkExisting]);

  // Derive phone/email from Privy linked accounts
  const phoneAccount = user?.linkedAccounts?.find(a => a.type === 'phone');
  const linkedPhone = phoneAccount && 'number' in phoneAccount ? (phoneAccount as { number: string }).number : null;
  const emailAccount = user?.linkedAccounts?.find(a => a.type === 'email');
  const emailAddress = emailAccount && 'address' in emailAccount ? (emailAccount as { address: string }).address : null;
  const emailVerified = !!emailAddress;
  const phoneVerified = !!linkedPhone;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!country || !termsAccepted || !user) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/participant-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyDid:           user.id,
          country,
          phoneNumber:        linkedPhone,
          phoneVerified,
          emailVerified,
          deviceFingerprint,
          termsAccepted:      true,
          year_of_birth:      yearOfBirth ? parseInt(yearOfBirth, 10) : null,
          sex_assigned_at_birth: sex || null,
          study_alerts:       studyAlerts,
          study_alerts_email: emailAddress ?? null,
        }),
      });

      const data = (await res.json()) as { profile?: ParticipantProfile; error?: unknown };

      // 409 = profile already exists — just go to dashboard
      if (res.status === 409) {
        router.replace('/dashboard');
        return;
      }

      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Failed to create profile');
      }

      if (!data.profile) throw new Error('No profile returned');

      setWelcome({
        pseudonym: data.profile.pseudonym,
        participantId: data.profile.participant_id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // ── Loading / auth guard ───────────────────────────────────────────────────

  if (!ready || (!authenticated && !checking) || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>Loading…</span>
      </div>
    );
  }

  // ── Welcome screen ─────────────────────────────────────────────────────────

  if (welcome) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--bg-page)' }}>
        <div className="w-full max-w-lg flex flex-col gap-6" style={cardStyle}>
          <span className="section-label">Identity assigned</span>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>
              Your pseudonym
            </p>
            <h1 style={{ fontSize: 30 }}>{welcome.pseudonym}</h1>
          </div>

          <div
            className="p-4"
            style={{
              background:   'var(--teal-faint)',
              border:       '1px solid var(--teal-soft)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>
              Participant ID
            </p>
            <p
              className="text-xl font-bold tracking-widest"
              style={{ color: 'var(--teal-dark)', fontFamily: 'var(--font-mono)' }}
            >
              {welcome.participantId}
            </p>
          </div>

          <div
            className="p-4 flex items-start gap-3"
            style={{
              background:   'var(--warning-soft)',
              border:       '1px solid rgba(180,83,9,0.2)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span aria-hidden style={{ color: 'var(--warning)' }}>⚠</span>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--warning)' }}>
              This pseudonym and participant ID are permanent. They cannot be changed.
              Save your participant ID — you may need it to reference your account.
            </p>
          </div>

          <button onClick={() => router.replace('/dashboard')} className="btn-primary w-full">
            Enter BIOME →
          </button>
          <button onClick={() => router.replace('/onboarding/experimenter')} className="btn-secondary w-full">
            Also set up an organization →
          </button>
        </div>
      </main>
    );
  }

  // ── Step 1 form ────────────────────────────────────────────────────────────

  const canSubmit = country && termsAccepted && !loading;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--bg-page)' }}>
      {legalDoc && <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />}
      <div className="w-full max-w-lg" style={cardStyle}>

        <StepIndicator current={1} />

        <span className="section-label">Step 1 of 4 — Account</span>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>Verify your account</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--slate)' }}>
          This information anchors your identity on BIOME. Keep it accurate.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Email — read-only from Privy */}
          <div>
            <FieldLabel>Email address</FieldLabel>
            <div
              className="w-full px-4 py-3 text-sm flex items-center justify-between"
              style={{
                background:   'var(--bg-page)',
                border:       '1px solid var(--border-soft)',
                borderRadius: 'var(--radius-sm)',
                color:        'var(--slate)',
              }}
            >
              <span>{emailAddress ?? 'Connected via wallet'}</span>
              {emailVerified && (
                <span className="chip chip-success">✓ Verified</span>
              )}
            </div>
          </div>

          {/* Phone — linked via Privy modal */}
          <div>
            <FieldLabel hint="(optional — strengthens verification)">Phone number</FieldLabel>
            {linkedPhone ? (
              <div
                className="w-full px-4 py-3 text-sm flex items-center justify-between"
                style={{
                  background:   'var(--bg-page)',
                  border:       '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-sm)',
                  color:        'var(--ink)',
                }}
              >
                <span>{linkedPhone}</span>
                <span className="chip chip-success">✓ Verified</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={linkPhone}
                className="w-full px-4 py-3 text-sm text-left transition-colors"
                style={{
                  background:   'var(--surface)',
                  border:       '1px dashed var(--border-mid)',
                  borderRadius: 'var(--radius-sm)',
                  color:        'var(--teal)',
                  cursor:       'pointer',
                }}
              >
                + Link phone number via SMS →
              </button>
            )}
          </div>

          {/* Country */}
          <div>
            <FieldLabel>Country <span style={{ color: 'var(--teal)' }}>*</span></FieldLabel>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            >
              <option value="" disabled>Select your country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Year of birth */}
          <div>
            <FieldLabel hint="(optional — used for study matching)">Year of birth</FieldLabel>
            <input
              type="number"
              value={yearOfBirth}
              onChange={(e) => setYearOfBirth(e.target.value)}
              placeholder="e.g. 1990"
              min={1920}
              max={2010}
            />
          </div>

          {/* Sex assigned at birth */}
          <div>
            <FieldLabel hint="(optional)">Sex assigned at birth</FieldLabel>
            <select value={sex} onChange={(e) => setSex(e.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="intersex">Intersex</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          {/* Study alerts */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer" style={{ color: 'var(--slate)' }}>
              <input
                type="checkbox"
                checked={studyAlerts}
                onChange={(e) => setStudyAlerts(e.target.checked)}
                className="mt-0.5 flex-shrink-0"
                style={{ accentColor: 'var(--teal)', width: 16, height: 16 }}
              />
              <span className="text-sm leading-relaxed">
                Notify me when new studies open that match my profile.
              </span>
            </label>
          </div>

          {/* Terms */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer" style={{ color: 'var(--slate)' }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 flex-shrink-0"
                style={{ accentColor: 'var(--teal)', width: 16, height: 16 }}
              />
              <span className="text-sm leading-relaxed">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setLegalDoc('tos')}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--teal)', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit' }}
                >Terms of Service</button>{' '}and{' '}
                <button
                  type="button"
                  onClick={() => setLegalDoc('participant_agreement')}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--teal)', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit' }}
                >Participant Study Agreement</button>. I understand that
                my pseudonym and participant ID will be permanently assigned and cannot be changed.
              </span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary w-full disabled:opacity-40"
          >
            {loading ? 'Generating your ID…' : 'Confirm & generate my participant ID →'}
          </button>

        </form>

        <p className="text-xs mt-6 text-center" style={{ color: 'var(--muted)' }}>
          Steps 2–4 can be completed later, before applying to studies.
        </p>

      </div>
    </main>
  );
}
