'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Identicon } from '@/components/identicon';
import { reputationBadge, countryFlag } from '@/lib/utils/profile';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PP = {
  user_id: string;
  participant_id: string;
  pseudonym: string;
  country: string;
  year_of_birth: number | null;
  sex_assigned_at_birth: string | null;
  gender_identity: string | null;
  smartphone_os: string | null;
  wearable_devices: string[] | null;
  internet_reliability: string | null;
  can_receive_kits: boolean | null;
  sample_comfort: string[] | null;
  language_fluency: string[] | null;
  weekly_availability_hours: number | null;
  previous_study_count: number;
  completion_rate: number | null;
  reliability_score: number;
  recent_interventions: string | null;
  washout_sensitive: boolean;
  onboarding_step: number;
  verification_status: string;
};

export type HistRow = {
  participant_id: string;
  status: string;
  applied_at: string;
  experiments: { id: string; title: string; category: string } | null;
};

export type ApplicantRow = {
  id: string;
  participant_id: string;
  status: string;
  applied_at: string;
  approved_at: string | null;
  payout_status: string;
  participantProfile: PP | null;
  applicationHistory: HistRow[];
};

export type ExpInfo = {
  id: string;
  title: string;
  category: string;
  inclusion_criteria: string | null;
  exclusion_criteria: string | null;
  is_remote: boolean;
  region: string | null;
  slots_total: number;
  slots_filled: number;
};

interface Props {
  experimentId: string;
  privyDid: string;
  initialApplicants: ApplicantRow[];
  experiment: ExpInfo;
  demoMode?: boolean;
  interactiveDemoMode?: boolean;
}

// ─── Eligibility check ────────────────────────────────────────────────────────

function computeEligibility(pp: PP | null, exp: ExpInfo): boolean {
  if (!pp) return false;
  const ageMatch = /Age:\s*(\d+)[–\-](\d+)/.exec(exp.inclusion_criteria ?? '');
  if (ageMatch && pp.year_of_birth) {
    const age = new Date().getFullYear() - pp.year_of_birth;
    if (age < parseInt(ageMatch[1]) || age > parseInt(ageMatch[2])) return false;
  }
  return true;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--green)';
  if (score >= 60) return 'var(--cyan)';
  return 'var(--amber)';
}

function relDate(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30)  return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Profile card ─────────────────────────────────────────────────────────────

function ProfileCard({ pp, history, onClose }: { pp: PP; history: HistRow[]; onClose: () => void }) {
  const badge = reputationBadge(pp.completion_rate);
  const age   = pp.year_of_birth ? new Date().getFullYear() - pp.year_of_birth : null;

  return (
    <div
      className="mt-1 mx-2 mb-2 rounded p-5"
      style={{
        background: 'rgba(7,12,7,0.98)',
        border: '1px solid rgba(77,255,128,0.18)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Identicon participantId={pp.participant_id} size={40} />
          <div>
            <Link href={`/profile/${pp.participant_id}`} target="_blank"
              className="font-bold mono text-sm no-underline hover:underline"
              style={{ color: 'var(--green)' }}>
              {pp.pseudonym}
            </Link>
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{pp.participant_id}</p>
          </div>
        </div>
        <button onClick={onClose} className="mono text-xs transition-opacity hover:opacity-60"
          style={{ color: 'var(--text-dim)' }}>
          [close ✕]
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {/* Identity */}
        <div>
          <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>// IDENTITY</p>
          <div className="flex flex-col gap-1">
            <Row label="Country"  value={`${countryFlag(pp.country)} ${pp.country}`} />
            <Row label="Age"      value={age ? `~${age}` : '—'} />
            <Row label="Sex"      value={pp.sex_assigned_at_birth === 'male' ? 'Male' : pp.sex_assigned_at_birth === 'female' ? 'Female' : pp.sex_assigned_at_birth ?? '—'} />
          </div>
        </div>

        {/* Capability */}
        <div>
          <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>// CAPABILITY</p>
          <div className="flex flex-col gap-1">
            <Row label="Phone" value={pp.smartphone_os?.toUpperCase() ?? '—'} />
            <Row label="Internet" value={pp.internet_reliability ?? '—'} />
            <Row label="Kits" value={pp.can_receive_kits ? 'Yes' : pp.can_receive_kits === false ? 'No' : '—'} />
            <Row label="Avail." value={pp.weekly_availability_hours ? `${pp.weekly_availability_hours}h/wk` : '—'} />
          </div>
        </div>

        {/* Track record */}
        <div>
          <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>// TRACK RECORD</p>
          <div className="flex flex-col gap-1">
            <Row label="Studies" value={String(pp.previous_study_count)} />
            <Row label="Rate" value={pp.completion_rate != null ? `${pp.completion_rate.toFixed(0)}%` : '—'} />
            <Row label="Score" value={`${pp.reliability_score.toFixed(1)}`} valueColor="var(--green)" />
            <Row label="Rep." value={badge.label} valueColor={badge.color} />
          </div>
        </div>
      </div>

      {/* Wearables + Sample comfort */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>// WEARABLES</p>
          <div className="flex flex-wrap gap-1.5">
            {(pp.wearable_devices?.length ? pp.wearable_devices : ['—']).map((d) => (
              <span key={d} className="mono text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(77,255,128,0.06)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-dim)' }}>
                {d}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>// SAMPLE COMFORT</p>
          <div className="flex flex-wrap gap-1.5">
            {(pp.sample_comfort?.length ? pp.sample_comfort : ['—']).map((s) => (
              <span key={s} className="mono text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(77,255,128,0.06)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-dim)' }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Languages */}
      {pp.language_fluency && pp.language_fluency.length > 0 && (
        <div className="mb-4">
          <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>// LANGUAGES</p>
          <p className="text-xs" style={{ color: 'var(--text-bright)' }}>
            {pp.language_fluency.join(', ')}
          </p>
        </div>
      )}

      {/* Washout */}
      {pp.washout_sensitive && (
        <div className="mb-4 p-2 rounded" style={{ background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.2)' }}>
          <p className="mono text-xs" style={{ color: 'var(--amber)' }}>
            ⚠ Washout sensitive — allow adequate washout period before enrolment
          </p>
        </div>
      )}

      {/* Application history */}
      {history.length > 0 && (
        <div>
          <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>// RECENT STUDIES</p>
          <div className="flex flex-col gap-1.5">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="mono text-xs w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: h.status === 'completed' ? 'var(--green)' : h.status === 'approved' ? 'var(--cyan)' : 'var(--text-dim)' }}
                />
                <span className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>
                  {h.experiments?.title ?? '—'}
                </span>
                <span className="mono text-xs flex-shrink-0 ml-auto" style={{ color: 'var(--text-dim)' }}>
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span className="mono text-xs" style={{ color: valueColor ?? 'var(--text-bright)' }}>{value}</span>
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

type ActionStatus = 'approved' | 'rejected' | 'waitlisted' | 'applied';

function ActionBtn({
  label, activeLabel, color, textColor, isActive, onClick, loading, demo,
}: {
  label: string; activeLabel: string; color: string; textColor: string;
  isActive: boolean; onClick: () => void; loading: boolean; demo?: boolean;
}) {
  return (
    <button
      onClick={demo ? undefined : onClick}
      disabled={loading || demo}
      title={demo ? 'Demo mode — read only' : undefined}
      className="mono text-xs px-2.5 py-1 rounded font-bold transition-all disabled:opacity-30"
      style={{
        background:  isActive ? color : 'transparent',
        color:       isActive ? textColor : color,
        border:      `1px solid ${color}60`,
        opacity:     loading ? 0.5 : 1,
        whiteSpace:  'nowrap',
        cursor:      demo ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? '...' : isActive ? activeLabel : label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ScreeningDashboard({ experimentId, privyDid, initialApplicants, experiment, demoMode, interactiveDemoMode }: Props) {
  const [applicants,   setApplicants]   = useState<ApplicantRow[]>(initialApplicants);
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [loadingId,    setLoadingId]    = useState<string | null>(null);
  const [sortBy,       setSortBy]       = useState<'reliability' | 'applied' | 'eligibility'>('reliability');
  const [filterStatus, setFilterStatus] = useState<'all' | 'eligible' | 'ineligible'>('all');

  // Enrich applicants with eligibility signal
  const enriched = useMemo(() =>
    applicants.map((a) => ({
      ...a,
      eligible: computeEligibility(a.participantProfile, experiment),
    })),
  [applicants, experiment]);

  const filtered = useMemo(() => {
    let rows = [...enriched];
    if (filterStatus === 'eligible')   rows = rows.filter((r) => r.eligible);
    if (filterStatus === 'ineligible') rows = rows.filter((r) => !r.eligible);
    rows.sort((a, b) => {
      if (sortBy === 'reliability') return (b.participantProfile?.reliability_score ?? 0) - (a.participantProfile?.reliability_score ?? 0);
      if (sortBy === 'eligibility') return Number(b.eligible) - Number(a.eligible);
      return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
    });
    return rows;
  }, [enriched, filterStatus, sortBy]);

  async function updateStatus(appId: string, newStatus: ActionStatus) {
    setLoadingId(appId);
    if (interactiveDemoMode) {
      await new Promise((r) => setTimeout(r, 280));
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === appId
            ? { ...a, status: newStatus, approved_at: newStatus === 'approved' ? new Date().toISOString() : null }
            : a
        )
      );
      setLoadingId(null);
      return;
    }
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ privyDid, status: newStatus }),
      });
      if (res.ok) {
        setApplicants((prev) =>
          prev.map((a) =>
            a.id === appId
              ? { ...a, status: newStatus, approved_at: newStatus === 'approved' ? new Date().toISOString() : null }
              : a
          )
        );
      }
    } finally {
      setLoadingId(null);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const approved  = applicants.filter((a) => a.status === 'approved').length;
  const total     = applicants.length;
  // slots_left = slots not yet filled by approved applicants (not raw DB slots_filled)
  const slotsLeft = Math.max(0, experiment.slots_total - approved);

  return (
    <div>

      {/* ── Header stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'APPLICATIONS', value: String(total)                                         },
          { label: 'APPROVED',     value: String(approved),       color: 'var(--green)'          },
          { label: 'SLOTS LEFT',   value: String(slotsLeft),      color: slotsLeft === 0 ? 'var(--amber)' : 'var(--text-white)' },
          { label: 'SLOTS TOTAL',  value: String(experiment.slots_total)                        },
        ].map((s) => (
          <div key={s.label} className="rounded p-4"
            style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
            <p className="mono text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>{s.label}</p>
            <p className="mono text-xl font-bold" style={{ color: s.color ?? 'var(--text-white)' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>SORT:</span>
          {(['reliability', 'applied', 'eligibility'] as const).map((s) => (
            <button key={s} onClick={() => setSortBy(s)}
              className="mono text-xs px-2.5 py-1 rounded transition-all"
              style={{
                background: sortBy === s ? 'rgba(77,255,128,0.1)' : 'transparent',
                border: `1px solid ${sortBy === s ? 'rgba(77,255,128,0.3)' : 'rgba(77,255,128,0.1)'}`,
                color: sortBy === s ? 'var(--green)' : 'var(--text-dim)',
              }}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>SHOW:</span>
          {(['all', 'eligible', 'ineligible'] as const).map((f) => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className="mono text-xs px-2.5 py-1 rounded transition-all"
              style={{
                background: filterStatus === f ? 'rgba(77,255,128,0.1)' : 'transparent',
                border: `1px solid ${filterStatus === f ? 'rgba(77,255,128,0.3)' : 'rgba(77,255,128,0.1)'}`,
                color: filterStatus === f ? 'var(--green)' : 'var(--text-dim)',
              }}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Empty state ── */}
      {total === 0 && (
        <div className="rounded py-16 text-center"
          style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            {'>'}_{'  '}No applications yet. Share your study link to recruit participants.
          </p>
        </div>
      )}

      {/* ── Applicant table ── */}
      {total > 0 && (
        <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(77,255,128,0.08)' }}>

          {/* Table header */}
          <div
            className="grid px-4 py-2.5 mono text-xs"
            style={{
              background: 'var(--bg2)',
              borderBottom: '1px solid rgba(77,255,128,0.06)',
              gridTemplateColumns: '2fr 1fr 0.9fr 0.9fr 1fr 1.6fr',
              gap: '0.5rem',
              color: 'var(--text-dim)',
            }}
          >
            <span>PARTICIPANT</span>
            <span>REGION</span>
            <span>ELIGIBILITY</span>
            <span>RELIABILITY</span>
            <span>APPLIED</span>
            <span>ACTIONS</span>
          </div>

          {/* Rows */}
          {filtered.map((row) => {
            const pp        = row.participantProfile;
            const isLoading = loadingId === row.id;
            const isOpen    = expandedId === row.id;
            const curStatus = row.status as ActionStatus;

            return (
              <div key={row.id}
                style={{ borderBottom: '1px solid rgba(77,255,128,0.04)' }}>

                {/* Main row */}
                <div
                  className="grid px-4 py-3 items-center"
                  style={{
                    background: isOpen ? 'rgba(77,255,128,0.025)' : 'var(--bg)',
                    gridTemplateColumns: '2fr 1fr 0.9fr 0.9fr 1fr 1.6fr',
                    gap: '0.5rem',
                  }}
                >
                  {/* Participant */}
                  <div className="flex items-center gap-2 min-w-0">
                    {pp ? (
                      <>
                        <Identicon participantId={pp.participant_id} size={28} />
                        <button
                          onClick={() => toggleExpand(row.id)}
                          className="mono text-xs font-bold text-left truncate transition-colors hover:underline"
                          style={{ color: isOpen ? 'var(--green)' : 'var(--text-bright)', maxWidth: '10rem' }}
                        >
                          {pp.pseudonym}
                        </button>
                      </>
                    ) : (
                      <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>—</span>
                    )}
                  </div>

                  {/* Region */}
                  <span className="mono text-xs truncate" style={{ color: 'var(--text-dim)' }}>
                    {pp ? `${countryFlag(pp.country)} ${pp.country}` : '—'}
                  </span>

                  {/* Eligibility */}
                  <span
                    className="mono text-xs font-bold"
                    style={{ color: row.eligible ? 'var(--green)' : 'var(--amber)' }}
                  >
                    {row.eligible ? 'ELIGIBLE' : 'NOT ELIG.'}
                  </span>

                  {/* Reliability */}
                  <span className="mono text-xs font-bold tabular-nums"
                    style={{ color: scoreColor(pp?.reliability_score ?? 0) }}>
                    {pp?.reliability_score.toFixed(1) ?? '—'}
                  </span>

                  {/* Applied */}
                  <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                    {relDate(row.applied_at)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <ActionBtn
                      label="APPROVE" activeLabel="APPROVED"
                      color="var(--green)" textColor="#050709"
                      isActive={curStatus === 'approved'}
                      onClick={() => updateStatus(row.id, curStatus === 'approved' ? 'applied' : 'approved')}
                      loading={isLoading} demo={demoMode && !interactiveDemoMode}
                    />
                    <ActionBtn
                      label="WAIT" activeLabel="WAITLISTED"
                      color="var(--amber)" textColor="#050709"
                      isActive={curStatus === 'waitlisted'}
                      onClick={() => updateStatus(row.id, curStatus === 'waitlisted' ? 'applied' : 'waitlisted')}
                      loading={isLoading} demo={demoMode && !interactiveDemoMode}
                    />
                    <ActionBtn
                      label="DENY" activeLabel="DENIED"
                      color="var(--amber)" textColor="#050709"
                      isActive={curStatus === 'rejected'}
                      onClick={() => updateStatus(row.id, curStatus === 'rejected' ? 'applied' : 'rejected')}
                      loading={isLoading} demo={demoMode && !interactiveDemoMode}
                    />
                  </div>
                </div>

                {/* Profile card dropdown */}
                {isOpen && pp && (
                  <ProfileCard
                    pp={pp}
                    history={row.applicationHistory}
                    onClose={() => setExpandedId(null)}
                  />
                )}

              </div>
            );
          })}

        </div>
      )}
    </div>
  );
}
