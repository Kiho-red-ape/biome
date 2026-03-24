'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { SiteHeader } from '@/components/nav/header';

const FREE_DISPUTES = 3;

function RaiseDisputeForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, authenticated, ready } = usePrivy();

  const milestoneId   = searchParams.get('milestone_id')  ?? '';
  const applicationId = searchParams.get('application_id') ?? '';
  const experimentId  = searchParams.get('experiment_id')  ?? '';

  const [subject,     setSubject]     = useState('');
  const [description, setDescription] = useState('');
  const [freeLeft,    setFreeLeft]    = useState<number | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');

  // Load dispute credits to show free remaining
  useEffect(() => {
    if (!user) return;
    fetch(`/api/disputes?privy_did=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((d: { disputes?: unknown[] }) => {
        const used = (d.disputes?.length ?? 0);
        setFreeLeft(Math.max(0, FREE_DISPUTES - used));
      })
      .catch(() => {});
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/disputes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privy_did:      user.id,
          experiment_id:  experimentId,
          application_id: applicationId,
          milestone_id:   milestoneId || undefined,
          subject,
          description,
        }),
      });
      const data = await res.json() as { dispute_id?: string; error?: string; fee_charged?: boolean; fee_amount?: number };
      if (!res.ok) {
        setError(data.error ?? 'Failed to raise dispute');
        setSubmitting(false);
        return;
      }
      router.push(`/disputes/${data.dispute_id}`);
    } catch {
      setError('Network error — please try again');
      setSubmitting(false);
    }
  }

  if (!ready) return (
    <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// LOADING…</p>
  );

  if (!authenticated) return (
    <p className="mono text-xs" style={{ color: 'var(--amber)' }}>// AUTH_REQUIRED — please sign in</p>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mono text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
        <Link href="/dashboard" className="no-underline hover:underline" style={{ color: 'var(--text-dim)' }}>DASHBOARD</Link>
        <span>›</span>
        <span style={{ color: 'var(--text-bright)' }}>RAISE DISPUTE</span>
      </div>

      {/* Free credits info */}
      {freeLeft !== null && (
        <div
          className="rounded p-3 mb-6 flex items-center gap-3"
          style={{
            background: freeLeft > 0 ? 'rgba(77,255,128,0.04)' : 'rgba(255,179,0,0.04)',
            border: freeLeft > 0 ? '1px solid rgba(77,255,128,0.12)' : '1px solid rgba(255,179,0,0.2)',
          }}
        >
          <span className="mono text-xs" style={{ color: freeLeft > 0 ? 'var(--green)' : 'var(--amber)' }}>
            {freeLeft > 0
              ? `${freeLeft} free dispute${freeLeft !== 1 ? 's' : ''} remaining`
              : 'No free disputes remaining — this dispute will incur a $10 fee'}
          </span>
        </div>
      )}

      <h1
        className="text-2xl font-black mb-2"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-white)' }}
      >
        Raise a Dispute
      </h1>
      <p className="mono text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
        Disputes must be raised within 7 days of the milestone decision.
        The first 3 are free; additional disputes incur a $10 fee.
      </p>

      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
        <div>
          <label className="mono text-xs block mb-1" style={{ color: 'var(--text-dim)' }}>SUBJECT</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            minLength={5}
            maxLength={200}
            placeholder="Brief summary of the dispute..."
            className="w-full rounded px-3 py-2 mono text-xs outline-none"
            style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
          />
        </div>

        <div>
          <label className="mono text-xs block mb-1" style={{ color: 'var(--text-dim)' }}>DESCRIPTION</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={20}
            maxLength={2000}
            rows={6}
            placeholder="Explain why you are disputing this decision. Include any evidence or context..."
            className="w-full rounded px-3 py-2 mono text-xs outline-none resize-none"
            style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
          />
          <p className="mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
            {description.length}/2000
          </p>
        </div>

        {error && (
          <p className="mono text-xs" style={{ color: 'var(--amber)' }}>// ERROR: {error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !subject.trim() || !description.trim()}
            className="mono text-xs px-5 py-2.5 rounded font-bold transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'var(--green)', color: '#050709' }}
          >
            {submitting ? 'SUBMITTING…' : 'RAISE DISPUTE →'}
          </button>
          <Link
            href="/dashboard"
            className="mono text-xs px-4 py-2.5 rounded no-underline transition-all hover:opacity-80"
            style={{ border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-dim)' }}
          >
            CANCEL
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function RaiseDisputePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 px-4 md:px-8 py-8">
        <Suspense fallback={<p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// LOADING…</p>}>
          <RaiseDisputeForm />
        </Suspense>
      </div>
      <footer
        className="text-center py-4 mono text-xs"
        style={{ color: 'var(--text-dim)', borderTop: '1px solid rgba(77,255,128,0.06)' }}
      >
        // BIOME_PROTOCOL — disputes governed by platform ToS
      </footer>
    </main>
  );
}
