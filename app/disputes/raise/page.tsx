'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { SiteHeader } from '@/components/nav/header';

const CATEGORIES = [
  { value: 'milestone_rejection_unfair', label: 'Milestone rejection — unfair or incorrect'  },
  { value: 'compliance_disagreement',    label: 'Compliance score disagreement'               },
  { value: 'payout_dispute',             label: 'Payout amount or timing'                     },
  { value: 'violation_flag_unfair',      label: 'Violation flag — unfair or incorrect'         },
  { value: 'study_conditions_changed',   label: 'Study conditions changed after enrollment'    },
  { value: 'safety_concern',             label: 'Safety or welfare concern'                    },
  { value: 'other',                      label: 'Other'                                        },
];

function RaiseDisputeForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, authenticated, ready } = usePrivy();

  const milestoneId   = searchParams.get('milestone_id')   ?? '';
  const applicationId = searchParams.get('application_id') ?? '';
  const experimentId  = searchParams.get('experiment_id')  ?? '';
  const windowEnd     = searchParams.get('window_end')     ?? ''; // ISO timestamp of 7-day cutoff

  const [category,    setCategory]    = useState('milestone_rejection_unfair');
  const [subject,     setSubject]     = useState('');
  const [description, setDescription] = useState('');
  const [freeLeft,    setFreeLeft]    = useState<number | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');

  // Days remaining in dispute window
  const daysLeft = windowEnd
    ? Math.max(0, Math.ceil((new Date(windowEnd).getTime() - Date.now()) / 86_400_000))
    : null;

  useEffect(() => {
    if (!user) return;
    fetch(`/api/disputes?privy_did=${encodeURIComponent(user.id)}`)
      .then((r) => r.json())
      .then((d: { disputes?: unknown[] }) => {
        setFreeLeft(Math.max(0, 3 - (d.disputes?.length ?? 0)));
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
          category,
          subject,
          description,
          raised_by_role: 'participant',
        }),
      });
      const data = await res.json() as { dispute_id?: string; error?: string; fee_charged?: boolean };
      if (!res.ok) { setError(data.error ?? 'Failed to raise dispute'); setSubmitting(false); return; }
      router.push(`/disputes/${data.dispute_id}`);
    } catch {
      setError('Network error — please try again');
      setSubmitting(false);
    }
  }

  if (!ready) return <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// LOADING…</p>;
  if (!authenticated) return <p className="mono text-xs" style={{ color: 'var(--amber)' }}>// AUTH_REQUIRED</p>;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mono text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
        <Link href="/dashboard" className="no-underline hover:underline" style={{ color: 'var(--text-dim)' }}>DASHBOARD</Link>
        <span>›</span>
        <span style={{ color: 'var(--text-bright)' }}>RAISE DISPUTE</span>
      </div>

      {/* Window countdown */}
      {daysLeft !== null && (
        <div
          className="rounded p-3 mb-5 flex items-center gap-2"
          style={{
            background: daysLeft <= 2 ? 'rgba(255,179,0,0.06)' : 'rgba(245,158,11,0.04)',
            border: `1px solid ${daysLeft <= 2 ? 'rgba(255,179,0,0.25)' : 'rgba(245,158,11,0.15)'}`,
          }}
        >
          <span className="mono text-xs" style={{ color: daysLeft <= 2 ? 'var(--amber)' : 'var(--green)' }}>
            ◆ DISPUTE WINDOW: {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
          </span>
          <span className="mono text-xs ml-auto" style={{ color: 'var(--text-dim)' }}>
            Disputes must be raised within 7 days of the event
          </span>
        </div>
      )}

      {/* Free disputes remaining */}
      {freeLeft !== null && (
        <div
          className="rounded p-3 mb-5"
          style={{
            background: freeLeft > 0 ? 'rgba(245,158,11,0.03)' : 'rgba(255,179,0,0.04)',
            border: `1px solid ${freeLeft > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(255,179,0,0.2)'}`,
          }}
        >
          <p className="mono text-xs" style={{ color: freeLeft > 0 ? 'var(--text-dim)' : 'var(--amber)' }}>
            {freeLeft > 0
              ? `${freeLeft} free dispute${freeLeft !== 1 ? 's' : ''} remaining (3 per account)`
              : 'No free disputes remaining — this dispute will incur a $10 fee'}
          </p>
        </div>
      )}

      <h1 className="text-2xl font-black mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-white)' }}>
        Raise a Dispute
      </h1>
      <p className="mono text-xs mb-6" style={{ color: 'var(--text-dim)', lineHeight: 1.7 }}>
        {freeLeft !== null && freeLeft > 0
          ? `Raise dispute (${freeLeft} free remaining)`
          : 'Raise dispute ($10 fee)'}
        {' · '}
        Must be raised within 7 days of the event.
      </p>

      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">

        {/* Category */}
        <div>
          <label className="mono text-xs block mb-1.5" style={{ color: 'var(--text-dim)', letterSpacing: '0.14em' }}>
            CATEGORY
          </label>
          <select
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded px-3 py-2 mono text-xs outline-none"
            style={{ background: 'var(--bg2)', border: '1px solid rgba(245,158,11,0.12)', color: 'var(--text-bright)' }}
          >
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="mono text-xs block mb-1.5" style={{ color: 'var(--text-dim)', letterSpacing: '0.14em' }}>
            SUBJECT
          </label>
          <input
            type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
            required minLength={5} maxLength={200}
            placeholder="Brief summary of the dispute..."
            className="w-full rounded px-3 py-2 mono text-xs outline-none"
            style={{ background: 'var(--bg2)', border: '1px solid rgba(245,158,11,0.12)', color: 'var(--text-bright)' }}
          />
        </div>

        {/* Description */}
        <div>
          <label className="mono text-xs block mb-1.5" style={{ color: 'var(--text-dim)', letterSpacing: '0.14em' }}>
            REASON <span style={{ opacity: 0.5 }}>(min 50 characters)</span>
          </label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            required minLength={50} maxLength={2000} rows={6}
            placeholder="Explain your dispute in detail. Include relevant dates, evidence, and context..."
            className="w-full rounded px-3 py-2 mono text-xs outline-none resize-none"
            style={{ background: 'var(--bg2)', border: '1px solid rgba(245,158,11,0.12)', color: 'var(--text-bright)' }}
          />
          <p className="mono text-xs mt-1" style={{ color: description.length >= 50 ? 'var(--green)' : 'var(--text-dim)' }}>
            {description.length}/2000 {description.length < 50 && `(${50 - description.length} more to go)`}
          </p>
        </div>

        {error && <p className="mono text-xs" style={{ color: 'var(--amber)' }}>// ERROR: {error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !subject.trim() || description.length < 50}
            className="btn-primary flex-1 disabled:opacity-40"
          >
            {submitting ? 'SUBMITTING…' : `RAISE DISPUTE${freeLeft === 0 ? ' ($10)' : ''} →`}
          </button>
          <Link href="/dashboard" className="btn-ghost">CANCEL</Link>
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
      <footer className="text-center py-4 mono text-xs" style={{ color: 'var(--text-dim)', borderTop: '1px solid rgba(245,158,11,0.06)' }}>
        // BIOME_PROTOCOL — disputes governed by platform ToS
      </footer>
    </main>
  );
}
