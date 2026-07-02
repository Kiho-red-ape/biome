'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

const EXPERTISE_OPTIONS = [
  'Microbiome', 'Nutrition', 'Sleep', 'Wearables',
  'Longevity', 'Quantified Self', 'Mental Health', 'Metabolomics',
];

const cardStyle: React.CSSProperties = {
  background:   'var(--surface)',
  border:       '1px solid var(--border-soft)',
  borderRadius: 'var(--radius)',
  boxShadow:    'var(--shadow-sm)',
  padding:      36,
};

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

function ExperimenterOnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const { user, ready, authenticated } = usePrivy();

  const [orgName,      setOrgName]      = useState('');
  const [orgWebsite,   setOrgWebsite]   = useState('');
  const [orgDesc,      setOrgDesc]      = useState('');
  const [roleTitle,    setRoleTitle]    = useState('');
  const [expertise,    setExpertise]    = useState<string[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [submitted,    setSubmitted]    = useState<{ id: string; org_name: string } | null>(null);
  // Access: form is INVITE-ONLY for new orgs. null = checking.
  const [allowed,      setAllowed]      = useState<boolean | null>(null);

  // All hooks must run before any early return (rules of hooks).
  // Prefill the org name from the invite (ops captured it in the intake).
  useEffect(() => {
    if (!inviteToken) return;
    fetch(`/api/invites/${inviteToken}`)
      .then((r) => r.json())
      .then((d: { valid?: boolean; orgName?: string | null }) => {
        if (d.valid && d.orgName) setOrgName((cur) => cur || d.orgName!);
      })
      .catch(() => {});
  }, [inviteToken]);

  // Gate: allow the form only with a valid invite, or for an account that
  // already owns an org (editing). Everyone else sees the invitation notice.
  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    let active = true;
    async function check() {
      try {
        const [invRes, orgRes] = await Promise.all([
          inviteToken
            ? fetch(`/api/invites/${inviteToken}`).then((r) => r.json()).catch(() => ({ valid: false }))
            : Promise.resolve({ valid: false }),
          fetch(`/api/experimenter-profile?privyDid=${encodeURIComponent(user!.id)}`).then((r) => r.json()).catch(() => ({})),
        ]);
        if (!active) return;
        const invited  = (invRes as { valid?: boolean }).valid === true;
        const hasOrg   = !!(orgRes as { profile?: unknown }).profile;
        setAllowed(invited || hasOrg);
      } catch {
        if (active) setAllowed(false);
      }
    }
    void check();
    return () => { active = false; };
  }, [ready, authenticated, user, inviteToken]);

  if (!ready) return null;
  if (!authenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-page)' }}>
        <span className="text-sm text-center" style={{ color: 'var(--slate)' }}>
          Sign in required — use the Sign in button in the top nav.
        </span>
      </div>
    );
  }

  if (allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-page)' }}>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>Checking access…</span>
      </div>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--bg-page)' }}>
        <div className="w-full text-center" style={{ maxWidth: 460, background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', padding: '40px 32px' }}>
          <span className="section-label">Organizations</span>
          <h1 style={{ fontSize: 22, marginBottom: 12 }}>Organization access is by invitation</h1>
          <p className="text-sm" style={{ color: 'var(--slate)', lineHeight: 1.65, marginBottom: 24 }}>
            Running studies on BIOME is set up by our team. Tell us about your study and we&apos;ll
            send you a private link to create your organization.
          </p>
          <button onClick={() => router.replace('/run-a-study')} className="btn-primary w-full">
            Talk to our team →
          </button>
          <p className="text-xs" style={{ color: 'var(--muted)', marginTop: 16 }}>
            Already invited? Open the link from your email — it unlocks this form.
          </p>
        </div>
      </main>
    );
  }

  function toggleExpertise(opt: string) {
    setExpertise((prev) => prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim() || !user) return;
    setLoading(true); setError(null);

    const res = await fetch('/api/experimenter-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        privyDid: user.id,
        org_name: orgName.trim(),
        org_website: orgWebsite.trim() || null,
        org_description: orgDesc.trim() || null,
        role_title: roleTitle.trim() || null,
        expertise_areas: expertise.length ? expertise : null,
        inviteToken: inviteToken ?? null,
      }),
    });

    const data = await res.json() as { profile?: { id: string; org_name: string }; error?: string };

    if (!res.ok) {
      setError(data.error ?? 'Submission failed');
      setLoading(false);
      return;
    }

    setSubmitted(data.profile!);
    setLoading(false);
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--bg-page)' }}>
        <div className="w-full max-w-lg flex flex-col gap-5" style={cardStyle}>
          <span className="section-label">Profile submitted</span>
          <h1 style={{ fontSize: 22 }}>{submitted.org_name} — under review</h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--slate)' }}>
            Your organization profile has been submitted. Our team will review it within 48 hours.
            Once approved, you&apos;ll be able to post studies and recruit research partners.
          </p>
          <div
            className="p-4 text-sm"
            style={{
              background:   'var(--warning-soft)',
              border:       '1px solid rgba(180,83,9,0.2)',
              borderRadius: 'var(--radius-sm)',
              color:        'var(--warning)',
            }}
          >
            Status: Pending review — check back in 48 hours.
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => router.push('/dashboard/experiments')} className="btn-primary">
              Go to researcher dashboard →
            </button>
            <button onClick={() => router.push(`/org/${submitted.id}`)} className="btn-secondary">
              View my org profile
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'var(--bg-page)' }}>
      <div className="w-full max-w-xl flex flex-col gap-6" style={cardStyle}>

        <div>
          <span className="section-label">Researcher onboarding</span>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Set up your organization</h1>
          <p className="text-sm" style={{ color: 'var(--slate)' }}>
            Tell us about your org. We&apos;ll review and approve your profile within 48 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Org name */}
          <div>
            <FieldLabel>Organization name <span style={{ color: 'var(--teal)' }}>*</span></FieldLabel>
            <input
              type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. VitaDAO, Novos Labs, Stanford Sleep Lab"
              required maxLength={120}
            />
          </div>

          {/* Website */}
          <div>
            <FieldLabel hint="(optional)">Website</FieldLabel>
            <input
              type="url" value={orgWebsite} onChange={(e) => setOrgWebsite(e.target.value)}
              placeholder="https://..."
              className="w-full"
              style={{
                fontFamily:   'var(--font-body)',
                fontSize:     16,
                color:        'var(--ink)',
                background:   'var(--surface)',
                border:       '1px solid var(--border-mid)',
                borderRadius: 'var(--radius-sm)',
                padding:      '12px 14px',
                outline:      'none',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <FieldLabel hint="(optional)">Organization description</FieldLabel>
            <textarea
              value={orgDesc} onChange={(e) => setOrgDesc(e.target.value)}
              placeholder="What does your organization do? What kind of research do you run?"
              rows={3} maxLength={1000}
              className="resize-none"
            />
          </div>

          {/* Role title */}
          <div>
            <FieldLabel hint="(optional)">Your role</FieldLabel>
            <input
              type="text" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Lead Scientist, Research Director, Founder"
              maxLength={100}
            />
          </div>

          {/* Expertise areas */}
          <div>
            <FieldLabel hint="(select all that apply)">Expertise areas</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_OPTIONS.map((opt) => {
                const active = expertise.includes(opt);
                return (
                  <button key={opt} type="button" onClick={() => toggleExpertise(opt)}
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

          {error && <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>}

          <button
            type="submit" disabled={!orgName.trim() || loading}
            className="btn-primary w-full disabled:opacity-40"
          >
            {loading ? 'Submitting…' : 'Submit for review →'}
          </button>

        </form>
      </div>
    </main>
  );
}

// useSearchParams must be inside a Suspense boundary for prerendering.
export default function ExperimenterOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <ExperimenterOnboardingInner />
    </Suspense>
  );
}
