'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { ScreeningDashboard } from '@/components/screening/screening-dashboard';
import type { ApplicantRow, ExpInfo } from '@/components/screening/screening-dashboard';
import { ComplianceDashboard } from '@/components/compliance/compliance-dashboard';
import { MessageComposer } from '@/components/experiments/message-composer';
import { EscrowDepositPanel } from '@/components/experiments/escrow-deposit-panel';
import { ExperimenterPayoutPanel } from '@/components/experiments/experimenter-payout-panel';
import { DocumentVault } from '@/components/documents/document-vault';

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
  escrow_status: string | null;
  experiment_code: string | null;
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
  draft:      'var(--muted)',
  recruiting: 'var(--teal)',
  active:     'var(--teal-dark)',
  completed:  'var(--muted)',
  cancelled:  '#dc2626',
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

type Tab = 'overview' | 'ome';

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
  const [activeTab,  setActiveTab]  = useState<Tab>('overview');

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
      setSaveMsg('✓ Study commenced — milestones generated for all enrolled research partners');
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</span>
      </div>
    );
  }

  if (error || !exp) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#dc2626' }}>Error: {error ?? 'Not found'}</p>
      </div>
    );
  }

  const sc      = STATUS_COLORS[exp.status] ?? 'var(--muted)';
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
    <main className="min-h-screen px-4 py-8" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-5xl mx-auto">

        {/* ── Nav ── */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard/experiments" className="no-underline"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
            ← My Studies
          </Link>
          <Link href={`/experiments/${exp.id}`} target="_blank"
            className="no-underline transition-opacity hover:opacity-80"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal)' }}>
            View public page ↗
          </Link>
        </div>

        {/* ── Header ── */}
        <div className="rounded p-6 mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: sc }}>● {exp.status}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 8px', borderRadius: '4px', color: 'var(--slate)', background: 'var(--teal-faint)', border: '1px solid var(--border-soft)' }}>
                  {exp.category.toUpperCase()}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-1"
                style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                {exp.title}
              </h1>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
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
                  className="transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--teal)', color: '#ffffff', border: 'none', cursor: 'pointer' }}>
                  {publishing ? '...' : 'Publish →'}
                </button>
              )}
              {/* Commence button — shown when study not yet commenced and has enrolled research partners */}
              {!exp.commenced && ['recruiting', 'active'].includes(exp.status) && (
                (() => {
                  const enrolledCount = applicants.filter((a) => a.status === 'enrolled').length;
                  return enrolledCount > 0 ? (
                    <button
                      onClick={commence}
                      disabled={commencing}
                      className="transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--teal-dark)', color: '#ffffff', border: 'none', cursor: 'pointer' }}>
                      {commencing ? '...' : `Commence Study → (${enrolledCount} enrolled)`}
                    </button>
                  ) : null;
                })()
              )}
              {exp.commenced && exp.commenced_at && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '6px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--teal-dark)', border: '1px solid var(--border-soft)', background: 'var(--teal-faint)' }}>
                  ✓ Commenced {new Date(exp.commenced_at).toLocaleDateString()}
                </span>
              )}
              {!editing && !['completed', 'cancelled'].includes(exp.status) && (
                <button
                  onClick={startEdit}
                  disabled={editLocked}
                  title={editLocked ? `Edit locked — launches in ${dtl} days` : 'Edit study'}
                  className="transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'var(--font-body)', fontSize: 13, padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--slate)', background: 'var(--surface)', cursor: 'pointer' }}>
                  {editLocked ? `🔒 Locked (${dtl}d)` : 'Edit study'}
                </button>
              )}
            </div>
          </div>

          {saveMsg && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 12, color: saveMsg.startsWith('Error') ? '#dc2626' : 'var(--teal-dark)' }}>
              {saveMsg}
            </p>
          )}
        </div>

        {/* ── Edit form ── */}
        {editing && (
          <div className="rounded p-6 mb-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 20, letterSpacing: '1px', textTransform: 'uppercase' }}>Edit Study</p>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px' }}>Title</span>
                <input
                  className="outline-none"
                  style={{ fontFamily: 'var(--font-body)', fontSize: 14, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--ink)', background: 'var(--bg-page)' }}
                  value={form.title as string ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px' }}>Description</span>
                <textarea
                  rows={5}
                  className="outline-none resize-y"
                  style={{ fontFamily: 'var(--font-body)', fontSize: 14, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--ink)', background: 'var(--bg-page)' }}
                  value={form.description as string ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>

              <div className="grid md:grid-cols-3 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px' }}>Compensation / Research Partner ($)</span>
                  <input
                    type="number" min="0"
                    className="outline-none"
                    style={{ fontFamily: 'var(--font-body)', fontSize: 14, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--ink)', background: 'var(--bg-page)' }}
                    value={form.bounty_per_participant as string ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, bounty_per_participant: e.target.value }))}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Slots</span>
                  <input
                    type="number" min="1"
                    className="outline-none"
                    style={{ fontFamily: 'var(--font-body)', fontSize: 14, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--ink)', background: 'var(--bg-page)' }}
                    value={form.slots_total as string ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, slots_total: e.target.value }))}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px' }}>Duration (weeks)</span>
                  <input
                    type="number" min="1"
                    className="outline-none"
                    style={{ fontFamily: 'var(--font-body)', fontSize: 14, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--ink)', background: 'var(--bg-page)' }}
                    value={form.duration_weeks as string ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, duration_weeks: e.target.value }))}
                  />
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px' }}>Region</span>
                  <input
                    className="outline-none"
                    style={{ fontFamily: 'var(--font-body)', fontSize: 14, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--ink)', background: 'var(--bg-page)' }}
                    value={form.region as string ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px' }}>Launch Date</span>
                  <input
                    type="date"
                    className="outline-none"
                    style={{ fontFamily: 'var(--font-body)', fontSize: 14, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--ink)', background: 'var(--bg-page)' }}
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
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)' }}>Remote (research partners can join from anywhere)</span>
              </label>

              <label className="flex flex-col gap-1.5">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px' }}>Inclusion Criteria</span>
                <textarea
                  rows={3}
                  placeholder="One criterion per line. Age: 18–45"
                  className="outline-none resize-y"
                  style={{ fontFamily: 'var(--font-body)', fontSize: 14, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--ink)', background: 'var(--bg-page)' }}
                  value={form.inclusion_criteria as string ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, inclusion_criteria: e.target.value }))}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px' }}>Exclusion Criteria</span>
                <textarea
                  rows={3}
                  placeholder="One criterion per line."
                  className="outline-none resize-y"
                  style={{ fontFamily: 'var(--font-body)', fontSize: 14, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--ink)', background: 'var(--bg-page)' }}
                  value={form.exclusion_criteria as string ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, exclusion_criteria: e.target.value }))}
                />
              </label>
            </div>

            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="transition-all hover:opacity-90 disabled:opacity-50"
                style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, padding: '8px 20px', borderRadius: 'var(--radius-sm)', background: 'var(--teal)', color: '#ffffff', border: 'none', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                onClick={() => { setEditing(false); setSaveMsg(null); }}
                className="transition-all hover:opacity-80"
                style={{ fontFamily: 'var(--font-body)', fontSize: 13, padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--slate)', background: 'var(--surface)', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Tab bar ── */}
        <div className="flex gap-1 mb-6"
          style={{ borderBottom: '1px solid var(--border-soft)', paddingBottom: 0 }}>
          {([
            { key: 'overview', label: 'Overview' },
            { key: 'ome',      label: 'OME' },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                fontFamily:      'var(--font-body)',
                fontSize:        13,
                fontWeight:      activeTab === t.key ? 600 : 400,
                padding:         '8px 18px',
                border:          'none',
                borderBottom:    activeTab === t.key ? '2px solid var(--teal)' : '2px solid transparent',
                background:      'transparent',
                color:           activeTab === t.key ? 'var(--teal-dark)' : 'var(--muted)',
                cursor:          'pointer',
                marginBottom:    -1,
                transition:      'color 0.15s',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OME tab panel ── */}
        {activeTab === 'ome' && (
          <div style={{
            background:   'var(--surface)',
            border:       '1px solid var(--border-soft)',
            borderRadius: 'var(--radius)',
            boxShadow:    'var(--shadow-sm)',
            padding:      '32px 28px',
            marginBottom: 32,
          }}>
            {/* Description */}
            <p style={{
              fontFamily:   'var(--font-body)',
              fontSize:     14,
              color:        'var(--slate)',
              lineHeight:   1.65,
              marginBottom: 28,
              maxWidth:     560,
            }}>
              OME finds hospitals, labs, and clinics across India to help you recruit the right
              research partners for this study.
            </p>

            {/* Primary CTA */}
            <Link
              href={`/ome?study=${exp.id}&title=${encodeURIComponent(exp.title)}`}
              style={{
                display:         'inline-block',
                fontFamily:      'var(--font-body)',
                fontSize:        15,
                fontWeight:      600,
                padding:         '12px 28px',
                borderRadius:    'var(--radius-sm)',
                background:      'var(--teal)',
                color:           '#ffffff',
                textDecoration:  'none',
                marginBottom:    24,
                transition:      'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
              Open OME for this study →
            </Link>

            {/* Secondary links */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <Link
                href="/ome/facilities"
                style={{
                  fontFamily:     'var(--font-body)',
                  fontSize:       13,
                  color:          'var(--teal-dark)',
                  textDecoration: 'none',
                  borderBottom:   '1px solid var(--teal-soft)',
                  paddingBottom:  1,
                }}>
                Browse facility directory →
              </Link>
              <Link
                href="/ome/sessions"
                style={{
                  fontFamily:     'var(--font-body)',
                  fontSize:       13,
                  color:          'var(--teal-dark)',
                  textDecoration: 'none',
                  borderBottom:   '1px solid var(--teal-soft)',
                  paddingBottom:  1,
                }}>
                View past OME sessions →
              </Link>
            </div>
          </div>
        )}

        {/* ── Overview tab content ── */}
        {activeTab === 'overview' && (<>

        {/* ── Study stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Reward / Partner', value: `$${exp.bounty_per_participant.toFixed(0)}`, color: 'var(--teal)' },
            { label: 'Total Pool',       value: `$${exp.total_bounty_pool.toLocaleString()}` },
            { label: 'Slots',            value: `${exp.slots_filled} / ${exp.slots_total}` },
            { label: 'Applicants',       value: String(applicants.length) },
          ].map((s) => (
            <div key={s.label} className="rounded p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 20, fontWeight: 700, color: s.color ?? 'var(--ink)' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Amendment log ── */}
        {exp.amendment_log && exp.amendment_log.length > 0 && (
          <div className="rounded overflow-hidden mb-8"
            style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)' }}>
            <div className="px-4 py-3" style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border-soft)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Amendment Log <span style={{ color: 'var(--teal)' }}>[{exp.amendment_log.length}]</span>
              </p>
            </div>
            <div className="divide-y" style={{ background: 'var(--surface)', borderColor: 'var(--border-soft)' }}>
              {[...exp.amendment_log].reverse().map((a, i) => (
                <div key={i} className="px-4 py-3 flex flex-wrap items-center gap-2">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                    {new Date(a.ts).toLocaleDateString()}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 8px', borderRadius: '4px', background: 'var(--teal-faint)', border: '1px solid var(--border-soft)', color: 'var(--teal-dark)' }}>
                    {a.field}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--slate)' }}>
                    <span style={{ color: '#dc2626' }}>{a.old_value || '—'}</span>
                    {' → '}
                    <span style={{ color: 'var(--ink)' }}>{a.new_value || '—'}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Enrolled research partners (shown when experiment has enrollment_url) ── */}
        {(() => {
          const enrolled  = applicants.filter((a) => a.status === 'enrolled');
          const approved  = applicants.filter((a) => a.status === 'approved');
          const hasEnrollUrl = !!exp.enrollment_url;
          if (!hasEnrollUrl && enrolled.length === 0 && approved.length === 0) return null;
          return (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px' }}>Enrolled Research Partners</p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)' }}>[{enrolled.length}]</span>
              </div>

              {/* Enrollment URL callout */}
              {hasEnrollUrl && (
                <div className="rounded px-4 py-3 mb-3"
                  style={{ border: '1px solid var(--border-soft)', color: 'var(--teal-dark)', background: 'var(--teal-faint)', fontFamily: 'var(--font-body)', fontSize: 13, borderRadius: 'var(--radius-sm)' }}>
                  Enrollment URL set: research partners visit{' '}
                  <a href={exp.enrollment_url!} target="_blank" rel="noopener noreferrer"
                    className="underline">{exp.enrollment_url}</a>
                  {' '}after approval. Click &ldquo;Confirm enrolled&rdquo; once they complete it.
                </div>
              )}

              {enrolled.length === 0 && approved.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>
                  No enrolled research partners yet. Approve applicants below.
                </p>
              ) : (
                <div className="rounded overflow-hidden" style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)' }}>
                  {/* Approved but awaiting enrollment confirmation */}
                  {hasEnrollUrl && approved.map((a) => (
                    <div key={a.id} className="flex items-center justify-between px-4 py-3 gap-4"
                      style={{ borderBottom: '1px solid var(--border-soft)', background: 'var(--surface)' }}>
                      <div className="flex items-center gap-3">
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)' }}>
                          {a.participantProfile?.pseudonym ?? a.participant_id}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '2px 8px', borderRadius: '4px', color: 'var(--slate)', background: 'var(--teal-soft)', border: '1px solid var(--border-soft)' }}>
                          Awaiting enrollment
                        </span>
                      </div>
                      <button
                        onClick={() => confirmEnrolled(a.id)}
                        className="transition-all hover:opacity-80"
                        style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--teal)', color: '#ffffff', border: 'none', cursor: 'pointer' }}>
                        Confirm enrolled ✓
                      </button>
                    </div>
                  ))}
                  {/* Already enrolled */}
                  {enrolled.map((a) => (
                    <div key={a.id} className="flex items-center justify-between px-4 py-3 gap-4"
                      style={{ borderBottom: '1px solid var(--border-soft)', background: 'var(--surface)' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)' }}>
                        {a.participantProfile?.pseudonym ?? a.participant_id}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)' }}>● enrolled</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Message composer ── (shown when there are approved/enrolled research partners) */}
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

        {/* ── Escrow deposit panel ── shown when study has approved research partners */}
        {(() => {
          const approved = applicants.filter((a) => ['approved', 'enrolled'].includes(a.status)).length;
          const needsEscrow = approved > 0 && ['recruiting', 'active'].includes(exp.status);
          if (!needsEscrow) return null;
          return (
            <div className="mb-8">
              <EscrowDepositPanel
                experimentId={exp.id}
                experimentTitle={exp.title}
                experimentCode={exp.experiment_code}
                approvedCount={approved}
                bountyPerParticipant={exp.bounty_per_participant}
                escrowStatus={exp.escrow_status ?? 'not_required'}
              />
            </div>
          );
        })()}

        {/* ── Payout dashboard ── */}
        {user && (
          <div className="mb-8">
            <ExperimenterPayoutPanel
              experimentId={exp.id}
              experimentTitle={exp.title}
              privyDid={user.id}
              bountyPerParticipant={exp.bounty_per_participant}
              applicants={applicants}
              experimentStatus={exp.status}
              escrowStatus={exp.escrow_status}
              onRefresh={load}
            />
          </div>
        )}

        {/* ── Compliance dashboard ── (shown once study has commenced) */}
        {exp.commenced && user && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px' }}>Compliance</p>
              {exp.commenced_at && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)' }}>
                  commenced {new Date(exp.commenced_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <ComplianceDashboard experimentId={exp.id} privyDid={user.id} />
          </div>
        )}

        {/* ── Document Vault ── */}
        {user && (
          <div className="mb-8" style={{
            border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-sm)', background: 'var(--surface)', padding: 24,
          }}>
            <DocumentVault
              experimentId={exp.id}
              hasSamples={
                !!(exp.category && /sample|biomarker|microbiome|blood|saliva|stool|urine|swab/i.test(exp.category + ' ' + exp.description))
              }
              displayName={exp.experiment_code ?? undefined}
            />
          </div>
        )}

        {/* ── Screening dashboard ── */}
        {user && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px' }}>Applicant Screening</p>
            </div>
            <ScreeningDashboard
              experimentId={exp.id}
              privyDid={user.id}
              initialApplicants={applicants}
              experiment={expInfo}
            />
          </div>
        )}

        </>)} {/* end activeTab === 'overview' */}

      </div>
    </main>
  );
}
