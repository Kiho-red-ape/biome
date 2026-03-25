'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { ScreeningDashboard } from '@/components/screening/screening-dashboard';
import type { ApplicantRow, ExpInfo } from '@/components/screening/screening-dashboard';
import { ComplianceDashboard } from '@/components/compliance/compliance-dashboard';
import { MessageComposer } from '@/components/experiments/message-composer';

// ─── Types ────────────────────────────────────────────────────────────────────

type FullExperiment = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  bounty_per_participant: number;
  total_bounty_pool: number;
  slots_total: number;
  slots_filled: number;
  duration_weeks: number | null;
  region: string | null;
  is_remote: boolean;
  is_verified: boolean;
  inclusion_criteria: string | null;
  exclusion_criteria: string | null;
  launch_date: string | null;
  amendment_log: AmendLog[];
  experimenter_id: string;
  created_at: string;
  updated_at: string;
  commenced: boolean;
  commenced_at: string | null;
  enrollment_url: string | null;
  compliance_threshold: number | null;
};

type AmendLog = {
  ts: string;
  field: string;
  old_value: string;
  new_value: string;
  edited_by: string;
};

const EDITABLE_FIELDS = [
  'title', 'description', 'category', 'bounty_per_participant', 'slots_total',
  'duration_weeks', 'region', 'is_remote', 'inclusion_criteria', 'exclusion_criteria',
  'launch_date',
] as const;
type EditableField = typeof EDITABLE_FIELDS[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft:      'var(--text-dim)',
  recruiting: 'var(--green)',
  active:     'var(--cyan)',
  completed:  'var(--text-dim)',
  cancelled:  'var(--amber)',
};

function daysToLaunch(launch_date: string | null): number | null {
  if (!launch_date) return null;
  return Math.ceil((new Date(launch_date).getTime() - Date.now()) / 86_400_000);
}

function relDate(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExperimentManagePage() {
  const params  = useParams<{ id: string }>();
  const id      = params.id;
  const router  = useRouter();
  const { user, ready, authenticated } = usePrivy();

  const [exp,        setExp]        = useState<FullExperiment | null>(null);
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [editing,    setEditing]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [commencing, setCommencing] = useState(false);
  const [saveMsg,    setSaveMsg]    = useState<string | null>(null);

  // Edit form state
  const [form, setForm] = useState<Partial<Record<EditableField, string | boolean>>>({});

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [expRes, appsRes] = await Promise.all([
        fetch(`/api/experiments/${id}`),
        fetch(`/api/experiments/${id}/applications?privyDid=${encodeURIComponent(user.id)}`),
      ]);

      const expData = await expRes.json() as { experiment?: FullExperiment };
      if (!expData.experiment) { router.replace('/dashboard/experiments'); return; }
      if (expData.experiment.experimenter_id !== user.id) {
        router.replace('/dashboard/experiments');
        return;
      }
      setExp(expData.experiment);

      const appsData = await appsRes.json() as { applications?: ApplicantRow[] };
      setApplicants(appsData.applications ?? []);
    } catch {
      setError('Failed to load experiment');
    } finally {
      setLoading(false);
    }
  }, [id, user, router]);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) { router.replace('/'); return; }
    void load();
  }, [ready, authenticated, user, router, load]);

  function startEdit() {
    if (!exp) return;
    setForm({
      title:                  exp.title,
      description:            exp.description,
      category:               exp.category,
      bounty_per_participant: String(exp.bounty_per_participant),
      slots_total:            String(exp.slots_total),
      duration_weeks:         String(exp.duration_weeks ?? ''),
      region:                 exp.region ?? '',
      is_remote:              exp.is_remote,
      inclusion_criteria:     exp.inclusion_criteria ?? '',
      exclusion_criteria:     exp.exclusion_criteria ?? '',
      launch_date:            exp.launch_date ?? '',
    });
    setEditing(true);
    setSaveMsg(null);
  }

  async function saveEdit() {
    if (!exp || !user) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const body: Record<string, unknown> = { privyDid: user.id };
      for (const field of EDITABLE_FIELDS) {
        const val = form[field];
        if (val === undefined) continue;
        if (field === 'bounty_per_participant' || field === 'slots_total' || field === 'duration_weeks') {
          body[field] = val === '' ? null : Number(val);
        } else if (field === 'is_remote') {
          body[field] = Boolean(val);
        } else {
          body[field] = val === '' ? null : val;
        }
      }
      const res  = await fetch(`/api/experiments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json() as { experiment?: FullExperiment; error?: string; amended?: boolean };
      if (!res.ok) {
        setSaveMsg(`Error: ${data.error ?? 'Save failed'}`);
        return;
      }
      if (data.experiment) setExp(data.experiment);
      setSaveMsg(data.amended ? '✓ Changes saved and logged' : '✓ No changes detected');
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!exp || !user) return;
    setPublishing(true);
    try {
      const res  = await fetch(`/api/experiments/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ privyDid: user.id, action: 'publish' }),
      });
      const data = await res.json() as { experiment?: FullExperiment; error?: string };
      if (!res.ok) { setSaveMsg(`Error: ${data.error ?? 'Publish failed'}`); return; }
      if (data.experiment) setExp(data.experiment);
      setSaveMsg('✓ Study published — now recruiting');
    } finally {
      setPublishing(false);
    }
  }

  async function commence() {
    if (!exp || !user) return;
    setCommencing(true);
    try {
      const res  = await fetch(`/api/experiments/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ privyDid: user.id, action: 'commence' }),
      });
      const data = await res.json() as { experiment?: FullExperiment; error?: string };
      if (!res.ok) { setSaveMsg(`Error: ${data.error ?? 'Commence failed'}`); return; }
      if (data.experiment) setExp(data.experiment);
      setSaveMsg('✓ Study commenced — milestones generated for all enrolled participants');
    } finally {
      setCommencing(false);
    }
  }

  async function confirmEnrolled(appId: string) {
    if (!user) return;
    await fetch(`/api/applications/${appId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid: user.id, status: 'enrolled' }),
    });
    void load();
  }

  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// LOADING...</span>
      </div>
    );
  }

  if (error || !exp) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="mono text-xs" style={{ color: 'var(--amber)' }}>// ERROR: {error ?? 'Not found'}</p>
      </div>
    );
  }

  const sc      = STATUS_COLORS[exp.status] ?? 'var(--text-dim)';
  const dtl     = daysToLaunch(exp.launch_date);
  const editLocked = dtl !== null && dtl >= 0 && dtl <= 7;

  const expInfo: ExpInfo = {
    id:                 exp.id,
    title:              exp.title,
    category:           exp.category,
    inclusion_criteria: exp.inclusion_criteria,
    exclusion_criteria: exp.exclusion_criteria,
    is_remote:          exp.is_remote,
    region:             exp.region,
    slots_total:        exp.slots_total,
    slots_filled:       exp.slots_filled,
  };

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* ── Nav ── */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard/experiments" className="mono text-xs no-underline" style={{ color: 'var(--text-dim)' }}>
            ← MY STUDIES
          </Link>
          <Link href={`/experiments/${exp.id}`} target="_blank"
            className="mono text-xs no-underline transition-opacity hover:opacity-80"
            style={{ color: 'var(--cyan)' }}>
            View public page ↗
          </Link>
        </div>

        {/* ── Header ── */}
        <div className="rounded p-6 mb-6"
          style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="mono text-xs font-bold uppercase" style={{ color: sc }}>● {exp.status}</span>
                <span className="mono text-xs px-1.5 py-0.5 rounded"
                  style={{ color: 'var(--text-dim)', border: '1px solid rgba(77,255,128,0.1)' }}>
                  {exp.category.toUpperCase()}
                </span>
              </div>
              <h1 className="text-2xl font-black mb-1"
                style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
                {exp.title}
              </h1>
              <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                Posted {relDate(exp.created_at)}
                {exp.launch_date && ` · Launch: ${exp.launch_date}`}
                {dtl !== null && dtl >= 0 && ` (${dtl}d away)`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
              {exp.status === 'draft' && (
                <button
                  onClick={publish}
                  disabled={publishing}
                  className="mono text-xs px-4 py-2 rounded font-bold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--green)', color: '#050709' }}>
                  {publishing ? '...' : 'Publish →'}
                </button>
              )}
              {/* Commence button — shown when study not yet commenced and has enrolled participants */}
              {!exp.commenced && ['recruiting', 'active'].includes(exp.status) && (
                (() => {
                  const enrolledCount = applicants.filter((a) => a.status === 'enrolled').length;
                  return enrolledCount > 0 ? (
                    <button
                      onClick={commence}
                      disabled={commencing}
                      className="mono text-xs px-4 py-2 rounded font-bold transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'var(--cyan)', color: '#050709' }}>
                      {commencing ? '...' : `COMMENCE STUDY → (${enrolledCount} enrolled)`}
                    </button>
                  ) : null;
                })()
              )}
              {exp.commenced && exp.commenced_at && (
                <span className="mono text-xs px-3 py-2 rounded"
                  style={{ color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}>
                  ✓ Commenced {new Date(exp.commenced_at).toLocaleDateString()}
                </span>
              )}
              {!editing && !['completed', 'cancelled'].includes(exp.status) && (
                <button
                  onClick={startEdit}
                  disabled={editLocked}
                  title={editLocked ? `Edit locked — launches in ${dtl} days` : 'Edit study'}
                  className="mono text-xs px-4 py-2 rounded transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ border: '1px solid rgba(0,229,255,0.3)', color: 'var(--cyan)' }}>
                  {editLocked ? `🔒 Locked (${dtl}d)` : 'Edit study'}
                </button>
              )}
            </div>
          </div>

          {saveMsg && (
            <p className="mono text-xs mt-3"
              style={{ color: saveMsg.startsWith('Error') ? 'var(--amber)' : 'var(--green)' }}>
              {saveMsg}
            </p>
          )}
        </div>

        {/* ── Edit form ── */}
        {editing && (
          <div className="rounded p-6 mb-6"
            style={{ background: 'var(--bg2)', border: '1px solid rgba(0,229,255,0.12)' }}>
            <p className="mono text-xs mb-5" style={{ color: 'var(--text-dim)' }}>// EDIT STUDY</p>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>TITLE</span>
                <input
                  className="mono text-sm px-3 py-2 rounded outline-none focus:ring-1 ring-green-400/30"
                  style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
                  value={form.title as string ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>DESCRIPTION</span>
                <textarea
                  rows={5}
                  className="mono text-sm px-3 py-2 rounded outline-none focus:ring-1 ring-green-400/30 resize-y"
                  style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
                  value={form.description as string ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>

              <div className="grid md:grid-cols-3 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>BOUNTY / PARTICIPANT ($)</span>
                  <input
                    type="number" min="0"
                    className="mono text-sm px-3 py-2 rounded outline-none focus:ring-1 ring-green-400/30"
                    style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
                    value={form.bounty_per_participant as string ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, bounty_per_participant: e.target.value }))}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>TOTAL SLOTS</span>
                  <input
                    type="number" min="1"
                    className="mono text-sm px-3 py-2 rounded outline-none focus:ring-1 ring-green-400/30"
                    style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
                    value={form.slots_total as string ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, slots_total: e.target.value }))}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>DURATION (weeks)</span>
                  <input
                    type="number" min="1"
                    className="mono text-sm px-3 py-2 rounded outline-none focus:ring-1 ring-green-400/30"
                    style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
                    value={form.duration_weeks as string ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, duration_weeks: e.target.value }))}
                  />
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>REGION</span>
                  <input
                    className="mono text-sm px-3 py-2 rounded outline-none focus:ring-1 ring-green-400/30"
                    style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
                    value={form.region as string ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>LAUNCH DATE</span>
                  <input
                    type="date"
                    className="mono text-sm px-3 py-2 rounded outline-none focus:ring-1 ring-green-400/30"
                    style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
                    value={form.launch_date as string ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, launch_date: e.target.value }))}
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_remote as boolean ?? false}
                  onChange={(e) => setForm((f) => ({ ...f, is_remote: e.target.checked }))}
                  className="rounded"
                />
                <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>REMOTE (participants can join from anywhere)</span>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>INCLUSION CRITERIA</span>
                <textarea
                  rows={3}
                  placeholder="One criterion per line. Age: 18–45"
                  className="mono text-sm px-3 py-2 rounded outline-none focus:ring-1 ring-green-400/30 resize-y"
                  style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
                  value={form.inclusion_criteria as string ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, inclusion_criteria: e.target.value }))}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>EXCLUSION CRITERIA</span>
                <textarea
                  rows={3}
                  placeholder="One criterion per line."
                  className="mono text-sm px-3 py-2 rounded outline-none focus:ring-1 ring-green-400/30 resize-y"
                  style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
                  value={form.exclusion_criteria as string ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, exclusion_criteria: e.target.value }))}
                />
              </label>
            </div>

            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="mono text-xs px-5 py-2.5 rounded font-bold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--green)', color: '#050709' }}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                onClick={() => { setEditing(false); setSaveMsg(null); }}
                className="mono text-xs px-5 py-2.5 rounded transition-all hover:opacity-80"
                style={{ border: '1px solid rgba(77,255,128,0.2)', color: 'var(--text-dim)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Study stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'BOUNTY / P',    value: `$${exp.bounty_per_participant.toFixed(0)}`, color: 'var(--green)' },
            { label: 'TOTAL POOL',    value: `$${exp.total_bounty_pool.toLocaleString()}` },
            { label: 'SLOTS',         value: `${exp.slots_filled} / ${exp.slots_total}` },
            { label: 'APPLICANTS',    value: String(applicants.length) },
          ].map((s) => (
            <div key={s.label} className="rounded p-4"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
              <p className="mono text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>{s.label}</p>
              <p className="mono text-xl font-bold" style={{ color: s.color ?? 'var(--text-white)' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Amendment log ── */}
        {exp.amendment_log && exp.amendment_log.length > 0 && (
          <div className="rounded overflow-hidden mb-8"
            style={{ border: '1px solid rgba(77,255,128,0.06)' }}>
            <div className="px-4 py-3" style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
              <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                // AMENDMENT LOG <span style={{ color: 'var(--green)' }}>[{exp.amendment_log.length}]</span>
              </p>
            </div>
            <div className="divide-y" style={{ background: 'var(--bg)', borderColor: 'rgba(77,255,128,0.04)' }}>
              {[...exp.amendment_log].reverse().map((a, i) => (
                <div key={i} className="px-4 py-3 flex flex-wrap items-center gap-2">
                  <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                    {new Date(a.ts).toLocaleDateString()}
                  </span>
                  <span className="mono text-xs px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(77,255,128,0.06)', border: '1px solid rgba(77,255,128,0.1)', color: 'var(--green)' }}>
                    {a.field}
                  </span>
                  <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                    <span style={{ color: 'var(--amber)' }}>{a.old_value || '—'}</span>
                    {' → '}
                    <span style={{ color: 'var(--text-bright)' }}>{a.new_value || '—'}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Enrolled participants (shown when experiment has enrollment_url) ── */}
        {(() => {
          const enrolled  = applicants.filter((a) => a.status === 'enrolled');
          const approved  = applicants.filter((a) => a.status === 'approved');
          const hasEnrollUrl = !!exp.enrollment_url;
          if (!hasEnrollUrl && enrolled.length === 0 && approved.length === 0) return null;
          return (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// ENROLLED_PARTICIPANTS</p>
                <span className="mono text-xs" style={{ color: 'var(--green)' }}>[{enrolled.length}]</span>
              </div>

              {/* Enrollment URL callout */}
              {hasEnrollUrl && (
                <div className="rounded px-4 py-3 mb-3 mono text-xs"
                  style={{ border: '1px solid rgba(0,229,255,0.2)', color: 'var(--cyan)', background: 'rgba(0,229,255,0.04)' }}>
                  Enrollment URL set: participants visit{' '}
                  <a href={exp.enrollment_url!} target="_blank" rel="noopener noreferrer"
                    className="underline">{exp.enrollment_url}</a>
                  {' '}after approval. Click "Confirm enrolled" once they complete it.
                </div>
              )}

              {enrolled.length === 0 && approved.length === 0 ? (
                <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                  No enrolled participants yet. Approve applicants below.
                </p>
              ) : (
                <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(77,255,128,0.1)' }}>
                  {/* Approved but awaiting enrollment confirmation */}
                  {hasEnrollUrl && approved.map((a) => (
                    <div key={a.id} className="flex items-center justify-between px-4 py-3 gap-4"
                      style={{ borderBottom: '1px solid rgba(77,255,128,0.06)', background: 'var(--bg)' }}>
                      <div className="flex items-center gap-3">
                        <span className="mono text-xs" style={{ color: 'var(--text-bright)' }}>
                          {a.participantProfile?.pseudonym ?? a.participant_id}
                        </span>
                        <span className="mono text-xs px-1.5 py-0.5 rounded"
                          style={{ color: 'var(--amber)', border: '1px solid rgba(255,179,0,0.2)' }}>
                          Awaiting enrollment
                        </span>
                      </div>
                      <button
                        onClick={() => confirmEnrolled(a.id)}
                        className="mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-80"
                        style={{ background: 'var(--green)', color: '#050709' }}>
                        Confirm enrolled ✓
                      </button>
                    </div>
                  ))}
                  {/* Already enrolled */}
                  {enrolled.map((a) => (
                    <div key={a.id} className="flex items-center justify-between px-4 py-3 gap-4"
                      style={{ borderBottom: '1px solid rgba(77,255,128,0.04)', background: 'var(--bg)' }}>
                      <span className="mono text-xs" style={{ color: 'var(--text-bright)' }}>
                        {a.participantProfile?.pseudonym ?? a.participant_id}
                      </span>
                      <span className="mono text-xs" style={{ color: 'var(--green)' }}>● enrolled</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Message composer ── (shown when there are approved/enrolled participants) */}
        {user && (() => {
          const msgRecipients = applicants.filter((a) => a.status === 'approved' || a.status === 'enrolled').length;
          if (msgRecipients === 0 && exp.status !== 'active') return null;
          return (
            <div className="mb-8">
              <MessageComposer
                experimentId={exp.id}
                privyDid={user.id}
                recipientCount={msgRecipients}
              />
            </div>
          );
        })()}

        {/* ── Compliance dashboard ── (shown once study has commenced) */}
        {exp.commenced && user && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// COMPLIANCE</p>
              {exp.commenced_at && (
                <span className="mono text-xs" style={{ color: 'var(--cyan)' }}>
                  commenced {new Date(exp.commenced_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <ComplianceDashboard experimentId={exp.id} privyDid={user.id} />
          </div>
        )}

        {/* ── Screening dashboard ── */}
        {user && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// APPLICANT SCREENING</p>
            </div>
            <ScreeningDashboard
              experimentId={exp.id}
              privyDid={user.id}
              initialApplicants={applicants}
              experiment={expInfo}
            />
          </div>
        )}

      </div>
    </main>
  );
}
