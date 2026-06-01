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
  const steps = ['ACCOUNT', 'DEMOGRAPHICS', 'CAPABILITY', 'HISTORY'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === current;
        const done = num < current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className="mono text-xs w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                style={{
                  background: active ? 'var(--green)' : done ? 'var(--green-dim)' : 'var(--bg3)',
                  color: active ? '#050709' : done ? 'var(--text-dim)' : 'var(--text-dim)',
                  border: active ? 'none' : '1px solid rgba(77,255,128,0.12)',
                }}
              >
                {done ? '✓' : num}
              </span>
              <span
                className="mono text-xs hidden sm:block"
                style={{ color: active ? 'var(--green)' : 'var(--text-dim)' }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Input styles (shared) ─────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--bg3)',
  border: '1px solid rgba(77,255,128,0.15)',
  color: 'var(--text-bright)',
};

const inputFocusClass =
  'w-full px-4 py-2.5 rounded text-sm outline-none transition-colors focus:border-green-400';

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
      <div className="min-h-screen flex items-center justify-center">
        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
          // INITIALISING...
        </span>
      </div>
    );
  }

  // ── Welcome screen ─────────────────────────────────────────────────────────

  if (welcome) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-16">
        <div
          className="w-full max-w-lg rounded p-px"
          style={{ background: 'var(--green)' }}
        >
          <div className="rounded p-8 flex flex-col gap-6" style={{ background: 'var(--bg2)' }}>
            <p className="mono text-xs" style={{ color: 'var(--green)' }}>
              // IDENTITY_ASSIGNED
            </p>

            <div>
              <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>
                YOUR_PSEUDONYM
              </p>
              <h1
                className="text-3xl font-black tracking-tight"
                style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}
              >
                {welcome.pseudonym}
              </h1>
            </div>

            <div
              className="rounded p-4"
              style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.15)' }}
            >
              <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>
                PARTICIPANT_ID
              </p>
              <p
                className="mono text-xl font-bold tracking-widest"
                style={{ color: 'var(--green)' }}
              >
                {welcome.participantId}
              </p>
            </div>

            <div
              className="rounded p-3 flex items-start gap-2"
              style={{ background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.2)' }}
            >
              <span style={{ color: 'var(--amber)' }}>⚠</span>
              <p className="mono text-xs leading-relaxed" style={{ color: 'var(--amber)' }}>
                This pseudonym and participant ID are permanent. They cannot be changed.
                Save your participant ID — you may need it to reference your account.
              </p>
            </div>

            <button
              onClick={() => router.replace('/dashboard')}
              className="w-full py-3 rounded font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: 'var(--green)', color: '#060a14' }}
            >
              Enter BIOME →
            </button>
            <button
              onClick={() => router.replace('/onboarding/experimenter')}
              className="w-full py-2.5 rounded text-sm mono transition-all hover:opacity-80"
              style={{ color: 'var(--text-dim)', border: '1px solid rgba(77,255,128,0.12)' }}
            >
              Also set up an organization →
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Step 1 form ────────────────────────────────────────────────────────────

  const canSubmit = country && termsAccepted && !loading;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      {legalDoc && <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />}
      <div
        className="w-full max-w-lg rounded p-px"
        style={{ background: 'var(--green-dim)' }}
      >
        <div className="rounded p-8" style={{ background: 'var(--bg2)' }}>

          <StepIndicator current={1} />

          <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>
            // STEP_01 — ACCOUNT_VERIFICATION
          </p>
          <h1
            className="text-2xl font-black mb-1"
            style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}
          >
            Verify your account
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-dim)' }}>
            This information anchors your participant identity. Keep it accurate.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Email — read-only from Privy */}
            <div>
              <label className="mono text-xs block mb-2" style={{ color: 'var(--text-dim)' }}>
                EMAIL_ADDRESS
              </label>
              <div
                className="w-full px-4 py-2.5 rounded text-sm flex items-center justify-between"
                style={{
                  background: 'var(--bg3)',
                  border: '1px solid rgba(77,255,128,0.08)',
                  color: 'var(--text-dim)',
                }}
              >
                <span>{emailAddress ?? 'Connected via wallet'}</span>
                {emailVerified && (
                  <span className="mono text-xs flex items-center gap-1" style={{ color: 'var(--green)' }}>
                    <span>✓</span> VERIFIED
                  </span>
                )}
              </div>
            </div>

            {/* Phone — linked via Privy modal */}
            <div>
              <label className="mono text-xs block mb-2" style={{ color: 'var(--text-dim)' }}>
                PHONE_NUMBER
                <span className="ml-2 opacity-60">(optional — strengthens verification)</span>
              </label>
              {linkedPhone ? (
                <div
                  className="w-full px-4 py-2.5 rounded text-sm flex items-center justify-between"
                  style={{
                    background: 'var(--bg3)',
                    border: '1px solid rgba(77,255,128,0.25)',
                    color: 'var(--text-bright)',
                  }}
                >
                  <span>{linkedPhone}</span>
                  <span className="mono text-xs flex items-center gap-1" style={{ color: 'var(--green)' }}>
                    <span>✓</span> VERIFIED
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={linkPhone}
                  className="w-full px-4 py-2.5 rounded text-sm text-left transition-all hover:opacity-80"
                  style={{
                    background: 'var(--bg3)',
                    border: '1px dashed rgba(77,255,128,0.25)',
                    color: 'var(--text-dim)',
                  }}
                >
                  <span className="mono">+ Link phone number via SMS →</span>
                </button>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="mono text-xs block mb-2" style={{ color: 'var(--text-dim)' }}>
                COUNTRY <span style={{ color: 'var(--green)' }}>*</span>
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className={inputFocusClass}
                style={inputStyle}
              >
                <option value="" disabled>Select your country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Year of birth */}
            <div>
              <label className="mono text-xs block mb-2" style={{ color: 'var(--text-dim)' }}>
                YEAR OF BIRTH
                <span className="ml-2 opacity-60">(optional — used for study matching)</span>
              </label>
              <input
                type="number"
                value={yearOfBirth}
                onChange={(e) => setYearOfBirth(e.target.value)}
                placeholder="e.g. 1990"
                min={1920}
                max={2010}
                className={inputFocusClass}
                style={inputStyle}
              />
            </div>

            {/* Sex assigned at birth */}
            <div>
              <label className="mono text-xs block mb-2" style={{ color: 'var(--text-dim)' }}>
                SEX ASSIGNED AT BIRTH
                <span className="ml-2 opacity-60">(optional)</span>
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className={inputFocusClass}
                style={inputStyle}
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="intersex">Intersex</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            {/* Study alerts */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer" style={{ color: 'var(--text-dim)' }}>
                <input
                  type="checkbox"
                  checked={studyAlerts}
                  onChange={(e) => setStudyAlerts(e.target.checked)}
                  className="mt-0.5 flex-shrink-0"
                  style={{ accentColor: 'var(--green)' }}
                />
                <span className="text-xs leading-relaxed">
                  Notify me when new studies open that match my profile.
                </span>
              </label>
            </div>

            {/* Terms */}
            <div>
              <label
                className="flex items-start gap-3 cursor-pointer"
                style={{ color: 'var(--text-dim)' }}
              >
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 flex-shrink-0 accent-green-400"
                  style={{ accentColor: 'var(--green)' }}
                />
                <span className="text-xs leading-relaxed">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setLegalDoc('tos')}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--green)', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit' }}
                  >Terms of Service</button>{' '}and{' '}
                  <button
                    type="button"
                    onClick={() => setLegalDoc('participant_agreement')}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--green)', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit' }}
                  >Participant Study Agreement</button>. I understand that
                  my pseudonym and participant ID will be permanently assigned and cannot be changed.
                </span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <p className="mono text-xs" style={{ color: 'var(--amber)' }}>
                // ERROR: {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3 rounded font-semibold text-sm transition-all disabled:opacity-40 hover:opacity-90"
              style={{ background: 'var(--green)', color: '#060a14' }}
            >
              {loading ? '// GENERATING_IDENTITY...' : 'Confirm & generate my participant ID →'}
            </button>

          </form>

          <p className="mono text-xs mt-6 text-center" style={{ color: 'var(--text-dim)' }}>
            // Steps 2–4 can be completed later, before applying to experiments.
          </p>

        </div>
      </div>
    </main>
  );
}
