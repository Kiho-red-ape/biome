'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Identicon } from '@/components/identicon';
import { reputationBadge, countryFlag } from '@/lib/utils/profile';
import type { PP } from '@/components/screening/screening-dashboard';
import type {
  ComplianceData,
  ComplianceParticipant,
  PendingVerification,
  ComplianceMilestone,
} from '@/app/api/experiments/[id]/compliance/route';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number, threshold: number): string {
  if (score >= threshold)         return 'var(--green)';
  if (score >= threshold - 15)    return 'var(--amber)';
  return 'var(--amber)';
}

function weekStatus(
  milestones: ComplianceMilestone[],
  currentWeek: number
): { label: string; color: string } {
  const current = milestones.filter((m) => m.week_number === currentWeek);
  const overdue  = milestones.filter(
    (m) => m.week_number < currentWeek && m.status === 'pending'
  );

  if (overdue.length > 0)
    return { label: `${overdue.length} overdue`, color: 'var(--amber)' };

  if (current.length === 0)
    return { label: '—', color: 'var(--text-dim)' };

  const submitted  = current.filter((m) => m.status === 'submitted').length;
  const completed  = current.filter((m) => ['completed', 'verified'].includes(m.status)).length;
  const allDone    = (submitted + completed) === current.length;

  if (allDone && submitted > 0)
    return { label: `${submitted} to verify`, color: 'var(--cyan)' };
  if (allDone)
    return { label: 'All done', color: 'var(--green)' };
  return { label: 'On track', color: 'var(--text-dim)' };
}

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function relDate(d: string | null) {
  if (!d) return '—';
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

function ageRange(yob: number | null): string {
  if (!yob) return '—';
  const age = new Date().getFullYear() - yob;
  return `${Math.floor(age / 10) * 10}s`;
}

// ─── Profile card ─────────────────────────────────────────────────────────────

function ProfileCard({ pp, onClose }: { pp: PP; onClose: () => void }) {
  const badge = reputationBadge(pp.completion_rate);
  return (
    <div
      className="absolute z-50 rounded p-4 shadow-xl"
      style={{
        background:  'var(--bg2)',
        border:      '1px solid rgba(77,255,128,0.15)',
        width:       320,
        top:         '100%',
        left:        0,
        marginTop:   4,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Identicon participantId={pp.participant_id} size={32} />
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-white)' }}>{pp.pseudonym}</p>
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              {countryFlag(pp.country)} {pp.country} · {ageRange(pp.year_of_birth)}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mono text-xs"
          style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { label: 'Completion', value: pp.completion_rate != null ? `${pp.completion_rate.toFixed(0)}%` : '—' },
          { label: 'Reputation',  value: badge.label, color: badge.color },
          { label: 'Studies',     value: String(pp.previous_study_count) },
          { label: 'Availability', value: pp.weekly_availability_hours ? `${pp.weekly_availability_hours}h/wk` : '—' },
        ].map((s) => (
          <div key={s.label} className="rounded p-2" style={{ background: 'var(--bg3)' }}>
            <p className="mono text-xs mb-0.5" style={{ color: 'var(--text-dim)', fontSize: 9 }}>{s.label.toUpperCase()}</p>
            <p className="mono text-xs font-bold" style={{ color: s.color ?? 'var(--text-bright)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {pp.smartphone_os && (
        <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>
          📱 {pp.smartphone_os}
          {pp.wearable_devices?.length ? ` · ${pp.wearable_devices.join(', ')}` : ''}
        </p>
      )}
      {pp.sample_comfort?.length ? (
        <p className="mono text-xs mb-1 truncate" style={{ color: 'var(--text-dim)' }}>
          🧪 {pp.sample_comfort.join(', ')}
        </p>
      ) : null}
      {pp.verification_status && (
        <p className="mono text-xs" style={{ color: pp.verification_status === 'fully_verified' ? 'var(--green)' : 'var(--text-dim)' }}>
          {pp.verification_status === 'fully_verified' ? '✓ Verified' : `⬤ ${pp.verification_status.replace(/_/g, ' ')}`}
        </p>
      )}
    </div>
  );
}

// ─── Pending verifications queue ──────────────────────────────────────────────

function PendingQueue({
  items,
  privyDid,
  onAction,
}: {
  items: PendingVerification[];
  privyDid: string;
  onAction: () => void;
}) {
  const [rejectOpen,  setRejectOpen]  = useState<string | null>(null);
  const [rejectText,  setRejectText]  = useState('');
  const [processing,  setProcessing]  = useState<string | null>(null);

  async function verify(id: string) {
    setProcessing(id);
    await fetch(`/api/milestones/${id}/verify`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid }),
    });
    setProcessing(null);
    onAction();
  }

  async function reject(id: string) {
    if (!rejectText.trim()) return;
    setProcessing(id);
    await fetch(`/api/milestones/${id}/reject`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid, reason: rejectText.trim() }),
    });
    setProcessing(null);
    setRejectOpen(null);
    setRejectText('');
    onAction();
  }

  if (items.length === 0) {
    return (
      <p className="mono text-xs py-4 text-center" style={{ color: 'var(--text-dim)' }}>
        // NO_PENDING_VERIFICATIONS — queue is clear
      </p>
    );
  }

  return (
    <div className="divide-y" style={{ borderColor: 'rgba(77,255,128,0.04)' }}>
      {items.map((pv) => (
        <div key={pv.id}>
          <div className="px-4 py-3 flex items-center gap-3">
            <Identicon participantId={pv.participantProfileId || pv.participantId} size={28} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium" style={{ color: 'var(--text-bright)' }}>
                {pv.pseudonym}
                <span className="mono ml-2" style={{ color: 'var(--text-dim)', fontWeight: 400 }}>
                  Week {pv.weekNumber}
                </span>
              </p>
              <p className="mono text-xs truncate" style={{ color: 'var(--text-dim)' }}>
                {pv.milestoneTitle}
                <span className="ml-2" style={{ color: 'var(--text-dim)', fontSize: 10 }}>
                  ({pv.milestoneType === 'self_report' ? 'self-report' : 'exp. confirm'})
                </span>
              </p>
            </div>
            <span className="mono text-xs shrink-0" style={{ color: 'var(--text-dim)' }}>
              {relDate(pv.submittedAt)}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => void verify(pv.id)}
                disabled={processing === pv.id}
                className="mono text-xs px-2.5 py-1.5 rounded transition-all hover:opacity-80 disabled:opacity-40"
                style={{ background: 'var(--green)', color: '#050709' }}
              >
                {processing === pv.id ? '...' : 'Verify ✓'}
              </button>
              <button
                onClick={() => { setRejectOpen(rejectOpen === pv.id ? null : pv.id); setRejectText(''); }}
                disabled={processing === pv.id}
                className="mono text-xs px-2.5 py-1.5 rounded transition-all hover:opacity-80 disabled:opacity-40"
                style={{ border: '1px solid rgba(255,179,0,0.3)', color: 'var(--amber)' }}
              >
                Reject ✕
              </button>
            </div>
          </div>
          {rejectOpen === pv.id && (
            <div className="px-4 pb-3 flex items-center gap-2" style={{ background: 'rgba(255,179,0,0.03)' }}>
              <input
                className="flex-1 mono text-xs px-3 py-1.5 rounded outline-none"
                style={{ background: 'var(--bg2)', border: '1px solid rgba(255,179,0,0.3)', color: 'var(--text-bright)' }}
                placeholder="Reason for rejection..."
                value={rejectText}
                onChange={(e) => setRejectText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void reject(pv.id); }}
              />
              <button
                onClick={() => void reject(pv.id)}
                disabled={!rejectText.trim() || processing === pv.id}
                className="mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-80 disabled:opacity-40"
                style={{ background: 'var(--amber)', color: '#050709' }}
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Row actions panel ────────────────────────────────────────────────────────

function RowActions({
  participant,
  privyDid,
  onAction,
}: {
  participant: ComplianceParticipant;
  privyDid: string;
  onAction: () => void;
}) {
  const [panel,       setPanel]       = useState<'verify' | 'flag' | 'override' | null>(null);
  const [rejectMap,   setRejectMap]   = useState<Record<string, string>>({});
  const [flagReason,  setFlagReason]  = useState('');
  const [overReason,  setOverReason]  = useState('');
  const [processing,  setProcessing]  = useState<string | null>(null);

  const submitted = participant.milestones.filter((m) => m.status === 'submitted');

  async function verify(milestoneId: string) {
    setProcessing(milestoneId);
    await fetch(`/api/milestones/${milestoneId}/verify`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid }),
    });
    setProcessing(null);
    onAction();
  }

  async function reject(milestoneId: string) {
    const reason = rejectMap[milestoneId]?.trim();
    if (!reason) return;
    setProcessing(milestoneId);
    await fetch(`/api/milestones/${milestoneId}/reject`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid, reason }),
    });
    setProcessing(null);
    onAction();
  }

  async function flag() {
    if (!flagReason.trim()) return;
    setProcessing('flag');
    await fetch(`/api/applications/${participant.applicationId}/flag`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid, reason: flagReason.trim() }),
    });
    setProcessing(null);
    setPanel(null);
    onAction();
  }

  async function override() {
    if (!overReason.trim()) return;
    setProcessing('override');
    await fetch(`/api/applications/${participant.applicationId}/override`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid, reason: overReason.trim() }),
    });
    setProcessing(null);
    setPanel(null);
    onAction();
  }

  return (
    <div>
      <div className="flex items-center gap-2 justify-end">
        {submitted.length > 0 && (
          <button
            onClick={() => setPanel(panel === 'verify' ? null : 'verify')}
            className="mono text-xs px-2.5 py-1.5 rounded transition-all hover:opacity-80"
            style={{ background: panel === 'verify' ? 'var(--cyan)' : 'rgba(0,229,255,0.1)', color: panel === 'verify' ? '#050709' : 'var(--cyan)' }}
          >
            Verify ({submitted.length}) ▾
          </button>
        )}
        {!participant.violationFlagged && (
          <button
            onClick={() => setPanel(panel === 'flag' ? null : 'flag')}
            className="mono text-xs px-2.5 py-1.5 rounded transition-all hover:opacity-80"
            style={{ border: '1px solid rgba(255,179,0,0.3)', color: 'var(--amber)' }}
          >
            Flag
          </button>
        )}
        {participant.violationFlagged && (
          <span className="mono text-xs px-2.5 py-1.5 rounded" style={{ color: 'var(--amber)', border: '1px solid rgba(255,179,0,0.2)' }}>
            ⚠ Flagged
          </span>
        )}
        {!participant.overrideRequested && (
          <button
            onClick={() => setPanel(panel === 'override' ? null : 'override')}
            className="mono text-xs px-2.5 py-1.5 rounded transition-all hover:opacity-80"
            style={{ border: '1px solid rgba(77,255,128,0.2)', color: 'var(--text-dim)' }}
          >
            Override
          </button>
        )}
        {participant.overrideRequested && (
          <span className="mono text-xs" style={{ color: 'var(--green)' }}>✓ override</span>
        )}
      </div>

      {/* Verify panel */}
      {panel === 'verify' && (
        <div className="mt-2 rounded p-3" style={{ background: 'var(--bg3)', border: '1px solid rgba(0,229,255,0.1)' }}>
          <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>Submitted milestones</p>
          {submitted.map((m) => (
            <div key={m.id} className="flex flex-col gap-1.5 mb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-bright)' }}>{m.title}</p>
                  <p className="mono text-xs" style={{ color: 'var(--text-dim)', fontSize: 10 }}>
                    Week {m.week_number} · submitted {relDate(m.submitted_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => void verify(m.id)}
                    disabled={processing === m.id}
                    className="mono text-xs px-2 py-1 rounded transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ background: 'var(--green)', color: '#050709' }}
                  >
                    {processing === m.id ? '...' : '✓'}
                  </button>
                  <button
                    onClick={() => setRejectMap((r) => ({ ...r, [m.id]: r[m.id] ?? '' }))}
                    disabled={processing === m.id}
                    className="mono text-xs px-2 py-1 rounded transition-all hover:opacity-80"
                    style={{ border: '1px solid rgba(255,179,0,0.3)', color: 'var(--amber)' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {rejectMap[m.id] !== undefined && (
                <div className="flex gap-2">
                  <input
                    className="flex-1 mono text-xs px-2 py-1 rounded outline-none"
                    style={{ background: 'var(--bg2)', border: '1px solid rgba(255,179,0,0.3)', color: 'var(--text-bright)' }}
                    placeholder="Rejection reason..."
                    value={rejectMap[m.id]}
                    onChange={(e) => setRejectMap((r) => ({ ...r, [m.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') void reject(m.id); }}
                  />
                  <button
                    onClick={() => void reject(m.id)}
                    disabled={!rejectMap[m.id]?.trim() || processing === m.id}
                    className="mono text-xs px-2 py-1 rounded disabled:opacity-40"
                    style={{ background: 'var(--amber)', color: '#050709' }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Flag panel */}
      {panel === 'flag' && (
        <div className="mt-2 rounded p-3" style={{ background: 'var(--bg3)', border: '1px solid rgba(255,179,0,0.15)' }}>
          <p className="mono text-xs mb-2" style={{ color: 'var(--amber)' }}>Flag compliance violation</p>
          <div className="flex gap-2">
            <input
              className="flex-1 mono text-xs px-3 py-1.5 rounded outline-none"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(255,179,0,0.3)', color: 'var(--text-bright)' }}
              placeholder="Reason (visible to participant)..."
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void flag(); }}
            />
            <button
              onClick={() => void flag()}
              disabled={!flagReason.trim() || processing === 'flag'}
              className="mono text-xs px-3 py-1.5 rounded disabled:opacity-40"
              style={{ background: 'var(--amber)', color: '#050709' }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Override panel */}
      {panel === 'override' && (
        <div className="mt-2 rounded p-3" style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.1)' }}>
          <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>Override compliance gate</p>
          <div className="flex gap-2">
            <input
              className="flex-1 mono text-xs px-3 py-1.5 rounded outline-none"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.2)', color: 'var(--text-bright)' }}
              placeholder="Reason for override..."
              value={overReason}
              onChange={(e) => setOverReason(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void override(); }}
            />
            <button
              onClick={() => void override()}
              disabled={!overReason.trim() || processing === 'override'}
              className="mono text-xs px-3 py-1.5 rounded disabled:opacity-40"
              style={{ background: 'var(--green)', color: '#050709' }}
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  experimentId: string;
  privyDid: string;
}

type SortField = 'compliance' | 'pseudonym' | 'status';

export function ComplianceDashboard({ experimentId, privyDid }: Props) {
  const [data,       setData]       = useState<ComplianceData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [sortField,  setSortField]  = useState<SortField>('compliance');
  const [sortAsc,    setSortAsc]    = useState(true);
  const [profileFor, setProfileFor] = useState<string | null>(null);   // applicationId

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/experiments/${experimentId}/compliance?privyDid=${encodeURIComponent(privyDid)}`);
      const json = await res.json() as ComplianceData & { error?: string };
      if (res.ok) setData(json);
    } finally {
      setLoading(false);
    }
  }, [experimentId, privyDid]);

  useEffect(() => { void load(); }, [load]);

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data.participants].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'compliance')  cmp = a.complianceScore - b.complianceScore;
      if (sortField === 'pseudonym')   cmp = (a.profile?.pseudonym ?? '').localeCompare(b.profile?.pseudonym ?? '');
      if (sortField === 'status') {
        const ws = (p: ComplianceParticipant) => weekStatus(p.milestones, data.currentWeek).label;
        cmp = ws(a).localeCompare(ws(b));
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [data, sortField, sortAsc]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc((v) => !v);
    else { setSortField(field); setSortAsc(field === 'compliance' ? true : true); }
  }

  function exportCSV() {
    if (!data) return;
    const rows = [
      ['participant_id', 'pseudonym', 'compliance_score', 'payout_eligible', 'amount', 'payout_status', 'violation_flagged', 'override_requested'].join(','),
      ...data.participants.map((p) => [
        p.profile?.participant_id ?? p.participantId,
        p.profile?.pseudonym ?? '',
        p.complianceScore,
        p.payoutEligible || p.overrideRequested ? 'YES' : 'NO',
        data.experiment.bounty_per_participant,
        p.payoutStatus,
        p.violationFlagged ? 'YES' : 'NO',
        p.overrideRequested ? 'YES' : 'NO',
      ].join(',')),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `compliance-${experimentId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="py-8 text-center">
        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// LOADING_COMPLIANCE...</span>
      </div>
    );
  }

  if (!data || data.participants.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
          // NO_ENROLLED_PARTICIPANTS — commence the study first
        </p>
      </div>
    );
  }

  const { experiment: exp, pendingVerifications, currentWeek } = data;
  const totalWeeks = exp.duration_weeks ?? 0;
  const eligible   = data.participants.filter((p) => p.payoutEligible || p.overrideRequested).length;
  const flagged    = data.participants.filter((p) => p.violationFlagged).length;
  const avgScore   = Math.round(data.participants.reduce((s, p) => s + p.complianceScore, 0) / data.participants.length);

  return (
    <div>
      {/* ── Summary stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'ENROLLED',     value: String(data.participants.length),  color: 'var(--text-white)' },
          { label: 'AVG COMPLIANCE', value: `${avgScore}%`,                  color: avgScore >= exp.compliance_threshold ? 'var(--green)' : 'var(--amber)' },
          { label: 'PAYOUT ELIGIBLE', value: `${eligible} / ${data.participants.length}`, color: 'var(--green)' },
          { label: 'FLAGGED',      value: String(flagged),                   color: flagged > 0 ? 'var(--amber)' : 'var(--text-dim)' },
          { label: 'CURRENT WEEK', value: totalWeeks > 0 ? `${currentWeek} / ${totalWeeks}` : `W${currentWeek}`, color: 'var(--cyan)' },
        ].map((s) => (
          <div key={s.label} className="rounded p-3" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
            <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)', fontSize: 9 }}>{s.label}</p>
            <p className="mono text-lg font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Participant compliance table ───────────────────────── */}
      <div className="rounded overflow-hidden mb-6" style={{ border: '1px solid rgba(77,255,128,0.08)' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// COMPLIANCE_TABLE</p>
          <div className="flex items-center gap-2">
            <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>sort:</span>
            {(['compliance', 'pseudonym', 'status'] as SortField[]).map((f) => (
              <button
                key={f}
                onClick={() => toggleSort(f)}
                className="mono text-xs transition-opacity hover:opacity-80"
                style={{ color: sortField === f ? 'var(--green)' : 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {f}{sortField === f ? (sortAsc ? ' ↑' : ' ↓') : ''}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--bg)' }}>
          {sorted.map((p) => {
            const ws     = weekStatus(p.milestones, currentWeek);
            const sc     = scoreColor(p.complianceScore, exp.compliance_threshold);
            const done   = p.milestones.filter((m) => ['submitted', 'completed', 'verified'].includes(m.status)).length;
            const isOpen = profileFor === p.applicationId;
            const profile = p.profile;

            return (
              <div
                key={p.applicationId}
                className="px-4 py-3"
                style={{ borderBottom: '1px solid rgba(77,255,128,0.04)' }}
              >
                <div className="grid items-start gap-3" style={{ gridTemplateColumns: '200px 1fr 120px 140px 200px' }}>
                  {/* Pseudonym + identicon */}
                  <div className="relative flex items-center gap-2">
                    {profile && <Identicon participantId={profile.participant_id} size={28} />}
                    <button
                      onClick={() => setProfileFor(isOpen ? null : p.applicationId)}
                      className="mono text-xs text-left truncate transition-opacity hover:opacity-80"
                      style={{ color: 'var(--text-bright)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {profile?.pseudonym ?? p.participantId.slice(0, 12) + '…'}
                      {p.violationFlagged && <span className="ml-1" style={{ color: 'var(--amber)' }}>⚠</span>}
                      {p.overrideRequested && <span className="ml-1" style={{ color: 'var(--green)' }}>↑</span>}
                    </button>
                    {isOpen && profile && (
                      <ProfileCard pp={profile} onClose={() => setProfileFor(null)} />
                    )}
                  </div>

                  {/* Compliance bar */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 rounded overflow-hidden" style={{ background: 'rgba(77,255,128,0.08)' }}>
                        <div className="h-1.5 rounded transition-all" style={{ width: `${p.complianceScore}%`, background: sc }} />
                      </div>
                      <span className="mono text-xs tabular-nums shrink-0" style={{ color: sc, fontSize: 11 }}>
                        {p.complianceScore}%
                      </span>
                    </div>
                    <p className="mono text-xs" style={{ color: 'var(--text-dim)', fontSize: 9 }}>
                      threshold {exp.compliance_threshold}%
                    </p>
                  </div>

                  {/* Milestones done/total */}
                  <div className="text-right">
                    <p className="mono text-sm tabular-nums" style={{ color: 'var(--text-white)' }}>
                      {done}<span style={{ color: 'var(--text-dim)' }}>/{p.milestones.length}</span>
                    </p>
                    <p className="mono text-xs" style={{ color: 'var(--text-dim)', fontSize: 9 }}>milestones</p>
                  </div>

                  {/* Week status */}
                  <div className="text-right">
                    <p className="mono text-xs" style={{ color: ws.color }}>{ws.label}</p>
                    <p className="mono text-xs" style={{ color: 'var(--text-dim)', fontSize: 9 }}>week {currentWeek}</p>
                  </div>

                  {/* Actions */}
                  <RowActions participant={p} privyDid={privyDid} onAction={load} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pending verifications queue ────────────────────────── */}
      <div className="rounded overflow-hidden mb-6" style={{ border: '1px solid rgba(0,229,255,0.08)' }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// PENDING_VERIFICATIONS</p>
          {pendingVerifications.length > 0 && (
            <span className="mono text-xs" style={{ color: 'var(--cyan)' }}>[{pendingVerifications.length}]</span>
          )}
        </div>
        <div style={{ background: 'var(--bg)' }}>
          <PendingQueue items={pendingVerifications} privyDid={privyDid} onAction={load} />
        </div>
      </div>

      {/* ── Payout summary (completed studies) ────────────────── */}
      {exp.status === 'completed' && (
        <div className="rounded overflow-hidden mb-6" style={{ border: '1px solid rgba(77,255,128,0.08)' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// PAYOUT_SUMMARY</p>
            <button
              onClick={exportCSV}
              className="mono text-xs transition-opacity hover:opacity-80"
              style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Export CSV →
            </button>
          </div>
          <div className="overflow-x-auto" style={{ background: 'var(--bg)' }}>
            <table className="w-full border-collapse" style={{ minWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
                  {['PARTICIPANT', 'COMPLIANCE', 'ELIGIBLE', 'AMOUNT', 'PAYOUT STATUS'].map((h) => (
                    <th key={h} className="mono text-xs font-normal px-4 py-2.5 text-left" style={{ color: 'var(--text-dim)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => {
                  const eligible = p.payoutEligible || p.overrideRequested;
                  const sc       = scoreColor(p.complianceScore, exp.compliance_threshold);
                  return (
                    <tr key={p.applicationId} style={{ borderBottom: '1px solid rgba(77,255,128,0.04)' }}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {p.profile && <Identicon participantId={p.profile.participant_id} size={20} />}
                          <span className="mono text-xs" style={{ color: 'var(--text-bright)' }}>
                            {p.profile?.pseudonym ?? p.participantId.slice(0, 12)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 mono text-xs tabular-nums" style={{ color: sc }}>
                        {p.complianceScore}%
                      </td>
                      <td className="px-4 py-2.5 mono text-xs" style={{ color: eligible ? 'var(--green)' : 'var(--amber)' }}>
                        {eligible ? '✓ Yes' : '✗ No'}
                        {p.overrideRequested && <span style={{ color: 'var(--text-dim)' }}> (override)</span>}
                      </td>
                      <td className="px-4 py-2.5 mono text-xs tabular-nums" style={{ color: eligible ? 'var(--green)' : 'var(--text-dim)' }}>
                        {eligible ? fmt(exp.bounty_per_participant) : '—'}
                      </td>
                      <td className="px-4 py-2.5 mono text-xs uppercase" style={{ color: p.payoutStatus === 'paid' ? 'var(--green)' : 'var(--text-dim)' }}>
                        {p.payoutStatus}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
