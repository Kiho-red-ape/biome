'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

const EXPERTISE_OPTIONS = [
  'Microbiome', 'Nutrition', 'Sleep', 'Wearables',
  'Longevity', 'Quantified Self', 'Mental Health', 'Metabolomics',
];

export default function ExperimenterOnboardingPage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();

  const [orgName,      setOrgName]      = useState('');
  const [orgWebsite,   setOrgWebsite]   = useState('');
  const [orgDesc,      setOrgDesc]      = useState('');
  const [roleTitle,    setRoleTitle]    = useState('');
  const [expertise,    setExpertise]    = useState<string[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [submitted,    setSubmitted]    = useState<{ id: string; org_name: string } | null>(null);

  if (!ready) return null;
  if (!authenticated || !user) { router.replace('/'); return null; }

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
      <main className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="rounded p-8 flex flex-col gap-5" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.12)' }}>
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// PROFILE_SUBMITTED</p>
            <div className="flex items-center gap-3">
              <span style={{ color: 'var(--amber)', fontSize: '1.5rem' }}>⏳</span>
              <h1 className="text-xl font-black" style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
                {submitted.org_name} — under review
              </h1>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              Your organization profile has been submitted. Our team will review it within 48 hours.
              Once approved, you&apos;ll be able to post experiments and recruit participants.
            </p>
            <div className="p-3 rounded mono text-xs" style={{ background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.2)', color: 'var(--amber)' }}>
              Status: PENDING REVIEW — check back in 48 hours
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/org/${submitted.id}`)}
                className="mono text-xs px-5 py-2.5 rounded font-bold transition-all hover:opacity-90"
                style={{ background: 'var(--green)', color: '#050709' }}
              >
                View my org profile →
              </button>
              <button
                onClick={() => router.push('/')}
                className="mono text-xs px-5 py-2.5 rounded transition-all hover:opacity-80"
                style={{ border: '1px solid rgba(77,255,128,0.2)', color: 'var(--text-dim)' }}
              >
                Go to dashboard
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <div className="rounded p-8 flex flex-col gap-6" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.1)' }}>

          <div>
            <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>// EXPERIMENTER_ONBOARDING</p>
            <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
              Set up your organization
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
              Tell us about your org. We&apos;ll review and approve your profile within 48 hours.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Org name */}
            <div>
              <label className="mono text-xs block mb-1.5" style={{ color: 'var(--text-dim)' }}>ORGANIZATION NAME *</label>
              <input
                type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. VitaDAO, Novos Labs, Stanford Sleep Lab"
                required maxLength={120}
                className="w-full px-3 py-2 rounded mono text-sm outline-none"
                style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.15)', color: 'var(--text-bright)' }}
              />
            </div>

            {/* Website */}
            <div>
              <label className="mono text-xs block mb-1.5" style={{ color: 'var(--text-dim)' }}>WEBSITE (optional)</label>
              <input
                type="url" value={orgWebsite} onChange={(e) => setOrgWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded mono text-sm outline-none"
                style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.15)', color: 'var(--text-bright)' }}
              />
            </div>

            {/* Description */}
            <div>
              <label className="mono text-xs block mb-1.5" style={{ color: 'var(--text-dim)' }}>ORGANIZATION DESCRIPTION</label>
              <textarea
                value={orgDesc} onChange={(e) => setOrgDesc(e.target.value)}
                placeholder="What does your organization do? What kind of research do you run?"
                rows={3} maxLength={1000}
                className="w-full px-3 py-2 rounded mono text-sm outline-none resize-none"
                style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.15)', color: 'var(--text-bright)' }}
              />
            </div>

            {/* Role title */}
            <div>
              <label className="mono text-xs block mb-1.5" style={{ color: 'var(--text-dim)' }}>YOUR ROLE (optional)</label>
              <input
                type="text" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Lead Scientist, Research Director, Founder"
                maxLength={100}
                className="w-full px-3 py-2 rounded mono text-sm outline-none"
                style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.15)', color: 'var(--text-bright)' }}
              />
            </div>

            {/* Expertise areas */}
            <div>
              <label className="mono text-xs block mb-2" style={{ color: 'var(--text-dim)' }}>EXPERTISE AREAS</label>
              <div className="flex flex-wrap gap-2">
                {EXPERTISE_OPTIONS.map((opt) => (
                  <button key={opt} type="button" onClick={() => toggleExpertise(opt)}
                    className="mono text-xs px-2.5 py-1 rounded transition-all"
                    style={{
                      background: expertise.includes(opt) ? 'rgba(77,255,128,0.12)' : 'var(--bg3)',
                      border: `1px solid ${expertise.includes(opt) ? 'var(--green-dim)' : 'rgba(77,255,128,0.12)'}`,
                      color: expertise.includes(opt) ? 'var(--green)' : 'var(--text-dim)',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="mono text-xs" style={{ color: 'var(--amber)' }}>// ERROR: {error}</p>}

            <button
              type="submit" disabled={!orgName.trim() || loading}
              className="w-full py-3 rounded font-semibold text-sm transition-all disabled:opacity-40 hover:opacity-90"
              style={{ background: 'var(--green)', color: '#050709' }}
            >
              {loading ? 'Submitting...' : 'Submit for review →'}
            </button>

          </form>
        </div>
      </div>
    </main>
  );
}
