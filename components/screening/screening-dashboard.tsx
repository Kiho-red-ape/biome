'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Identicon } from '@/components/identicon';
import { reputationBadge, countryFlag } from '@/lib/utils/profile';

// ─── Types ────────────────────────────────────────────────────────────────────

type PP = {
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

type HistRow = {
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
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeFitScore(pp: PP | null, exp: ExpInfo): number {
  if (!pp) return 0;
  let score = 0;

  // Completion rate (max 20)
  if (pp.completion_rate != null) {
    if (pp.completion_rate >= 90) score += 20;
    else if (pp.completion_rate >= 80) score += 12;
    else if (pp.completion_rate >= 70) score += 6;
  }

  // Study experience (max 15)
  if (pp.previous_study_count >= 5) score += 15;
  else if (pp.previous_study_count >= 2) score += 8;
  else if (pp.previous_study_count >= 1) score += 3;

  // Remote or region match (max 15)
  if (exp.is_remote) {
    score += 10;
  } else if (exp.region && pp.country.toLowerCase().includes(exp.region.toLowerCase())) {
    score += 15;
  }

  // Wearables for Wearables/Quantified Self categories (max 10)
  const wearablesRelevant = ['Wearables', 'Quantified Self', 'Sleep', 'Longevity'].includes(exp.category);
  if (wearablesRelevant && pp.wearable_devices && pp.wearable_devices.length > 0 &&
      !pp.wearable_devices.includes('none')) {
    score += 10;
  }

  // Sample comfort for biofluid categories (max 15)
  const microRelevant = ['Microbiome', 'Metabolomics', 'Nutrition'].includes(exp.category);
  if (microRelevant && pp.sample_comfort) {
    const goodComfort = pp.sample_comfort.some((s) => ['stool', 'saliva', 'blood_prick', 'urine'].includes(s));
    if (goodComfort) score += 15;
  } else if (pp.sample_comfort && !pp.sample_comfort.includes('none')) {
    score += 8;
  }

  // Age check via inclusion_criteria text (max 15)
  const ageMatch = /Age:\s*(\d+)[–\-](\d+)/.exec(exp.inclusion_criteria ?? '');
  if (ageMatch && pp.year_of_birth) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - pp.year_of_birth;
    const minAge = parseInt(ageMatch[1]);
    const maxAge = parseInt(ageMatch[2]);
    if (age >= minAge && age <= maxAge) score += 15;
  } else if (!ageMatch) {
    score += 8; // no age restriction specified — neutral bonus
  }

  // Reliability bonus (max 10)
  if (pp.reliability_score >= 80) score += 10;
  else if (pp.reliability_score >= 60) score += 5;

  return Math.min(100, Math.round(score));
}

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

function sexLabel(sex: string | null): string {
  if (!sex) return '—';
  if (sex === 'male') return 'M';
  if (sex === 'female') return 'F';
  if (sex === 'intersex') return 'I';
  return '—';
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
  label, activeLabel, color, textColor, isActive, onClick, loading,
}: {
  label: string; activeLabel: string; color: string; textColor: string;
  isActive: boolean; onClick: () => void; loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="mono text-xs px-2.5 py-1 rounded font-bold transition-all disabled:opacity-40"
      style={{
        background:   isActive ? color : 'transparent',
        color:        isActive ? textColor : color,
        border:       `1px solid ${color}60`,
        opacity:      loading ? 0.5 : 1,
        whiteSpace:   'nowrap',
      }}
    >
      {loading ? '...' : isActive ? activeLabel : label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ScreeningDashboard({ experimentId, privyDid, initialApplicants, experiment }: Props) {
  const [applicants,   setApplicants]   = useState<ApplicantRow[]>(initialApplicants);
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [loadingId,    setLoadingId]    = useState<string | null>(null);
  const [sortBy,       setSortBy]       = useState<'fit' | 'reliability' | 'applied' | 'eligibility'>('fit');
  const [filterStatus, setFilterStatus] = useState<'all' | 'eligible' | 'ineligible'>('all');

  // Enrich applicants with computed scores
  const enriched = useMemo(() =>
    applicants.map((a) => ({
      ...a,
      fitScore:   computeFitScore(a.participantProfile, experiment),
      eligible:   computeEligibility(a.participantProfile, experiment),
    })),
  [applicants, experiment]);

  const filtered = useMemo(() => {
    let rows = [...enriched];
    if (filterStatus === 'eligible')   rows = rows.filter((r) => r.eligible);
    if (filterStatus === 'ineligible') rows = rows.filter((r) => !r.eligible);
    rows.sort((a, b) => {
      if (sortBy === 'fit')         return b.fitScore - a.fitScore;
      if (sortBy === 'reliability') return (b.participantProfile?.reliability_score ?? 0) - (a.participantProfile?.reliability_score ?? 0);
      if (sortBy === 'eligibility') return Number(b.eligible) - Number(a.eligible);
      return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
    });
    return rows;
  }, [enriched, filterStatus, sortBy]);

  async function updateStatus(appId: string, newStatus: ActionStatus) {
    setLoadingId(appId);
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

  const approved   = applicants.filter((a) => a.status === 'approved').length;
  const total      = applicants.length;
  const slotsLeft  = experiment.slots_total - experiment.slots_filled;

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
          {(['fit', 'reliability', 'applied', 'eligibility'] as const).map((s) => (
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
              gridTemplateColumns: '2fr 0.5fr 1fr 0.8fr 0.8fr 0.8fr 1fr 1.4fr',
              gap: '0.5rem',
              color: 'var(--text-dim)',
            }}
          >
            <span>PARTICIPANT</span>
            <span>SEX</span>
            <span>REGION</span>
            <span>ELIGIBILITY</span>
            <span>FIT</span>
            <span>RELIABILITY</span>
            <span>APPLIED</span>
            <span>ACTIONS</span>
          </div>

          {/* Rows */}
          {filtered.map((row) => {
            const pp        = row.participantProfile;
            const isLoading = loadingId === row.id;
            const isOpen    = expandedId === row.id;
            const fitColor  = scoreColor(row.fitScore);
            const curStatus = row.status as ActionStatus;

            return (
              <div key={row.id}
                style={{ borderBottom: '1px solid rgba(77,255,128,0.04)' }}>

                {/* Main row */}
                <div
                  className="grid px-4 py-3 items-center"
                  style={{
                    background: isOpen ? 'rgba(77,255,128,0.025)' : 'var(--bg)',
                    gridTemplateColumns: '2fr 0.5fr 1fr 0.8fr 0.8fr 0.8fr 1fr 1.4fr',
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

                  {/* Sex */}
                  <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                    {sexLabel(pp?.sex_assigned_at_birth ?? null)}
                  </span>

                  {/* Region */}
                  <span className="mono text-xs truncate" style={{ color: 'var(--text-dim)' }}>
                    {pp ? `${countryFlag(pp.country)} ${pp.country}` : '—'}
                  </span>

                  {/* Eligibility */}
                  <span
                    className="mono text-xs font-bold"
                    style={{ color: row.eligible ? 'var(--green)' : 'var(--amber)' }}
                  >
                    {row.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                  </span>

                  {/* Fit score */}
                  <span className="mono text-xs font-bold tabular-nums" style={{ color: fitColor }}>
                    {row.fitScore}
                  </span>

                  {/* Reliability */}
                  <span className="mono text-xs tabular-nums" style={{ color: 'var(--text-dim)' }}>
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
                      loading={isLoading}
                    />
                    <ActionBtn
                      label="WAIT" activeLabel="WAITLISTED"
                      color="var(--amber)" textColor="#050709"
                      isActive={curStatus === 'waitlisted'}
                      onClick={() => updateStatus(row.id, curStatus === 'waitlisted' ? 'applied' : 'waitlisted')}
                      loading={isLoading}
                    />
                    <ActionBtn
                      label="DENY" activeLabel="DENIED"
                      color="var(--amber)" textColor="#050709"
                      isActive={curStatus === 'rejected'}
                      onClick={() => updateStatus(row.id, curStatus === 'rejected' ? 'applied' : 'rejected')}
                      loading={isLoading}
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
