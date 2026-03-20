'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Identicon } from '@/components/identicon';
import { reputationBadge, countryFlag, categoryColor } from '@/lib/utils/profile';
import type { ParticipantProfile } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppRow = {
  id: string;
  status: string;
  applied_at: string;
  payout_status: string;
  experiments: { id: string; title: string; category: string; bounty_per_participant: number; status: string } | null;
};

type MilestoneRow = {
  id: string;
  study_milestone_id: string;
  status: string;
  completed_at: string | null;
  submitted_at: string | null;
  week_number: number;
  title: string;
  description: string | null;
  milestone_type: string;
  sort_order: number;
};

type ActiveStudy = {
  applicationId: string;
  applicationStatus: string;
  experiment: {
    id: string;
    title: string;
    category: string;
    bounty_per_participant: number;
    duration_weeks: number | null;
    compliance_threshold: number;
    commenced_at: string | null;
    status: string;
  };
  currentWeek: number;
  milestones: MilestoneRow[];
  complianceScore: number;
  payoutEligible: boolean;
};

type DashboardData = {
  profile: ParticipantProfile | null;
  applications: AppRow[];
  activeStudies: ActiveStudy[];
};

const STATUS_COLORS: Record<string, string> = {
  applied:   'var(--text-dim)',
  approved:  'var(--cyan)',
  enrolled:  'var(--cyan)',
  active:    'var(--cyan)',
  completed: 'var(--green)',
  withdrawn: 'var(--text-dim)',
  rejected:  'var(--amber)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function profileCompleteness(p: ParticipantProfile): { pct: number; missing: string[] } {
  const checks = [
    { done: p.onboarding_step >= 1,                            label: 'Account verified'             },
    { done: !!p.year_of_birth && !!p.nationality,              label: 'Demographics completed'        },
    { done: !!p.smartphone_os,                                 label: 'Capability profile filled'     },
    { done: p.previous_study_count > 0 || !!p.recent_interventions, label: 'Research history added' },
  ];
  const done    = checks.filter((c) => c.done).length;
  const missing = checks.filter((c) => !c.done).map((c) => c.label);
  return { pct: Math.round((done / checks.length) * 100), missing };
}

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function relDate(dateStr: string): string {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (d === 0) return 'today';
  if (d === 1) return '1d ago';
  if (d < 30)  return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function complianceColor(score: number, threshold: number): string {
  if (score >= threshold)          return 'var(--green)';
  if (score >= threshold - 10)     return 'var(--amber)';
  return 'var(--amber)';
}

// ─── Active Study Card ────────────────────────────────────────────────────────

function ActiveStudyCard({
  study,
  privyDid,
  onRefresh,
}: {
  study: ActiveStudy;
  privyDid: string;
  onRefresh: () => void;
}) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const { experiment: exp, milestones, complianceScore, payoutEligible, currentWeek } = study;

  // Group milestones by week
  const weekMap = new Map<number, MilestoneRow[]>();
  for (const m of milestones) {
    if (!weekMap.has(m.week_number)) weekMap.set(m.week_number, []);
    weekMap.get(m.week_number)!.push(m);
  }
  const weeks = Array.from(weekMap.entries()).sort(([a], [b]) => a - b);

  const totalWeeks    = exp.duration_weeks ?? weeks.length;
  const progressPct   = totalWeeks > 0 ? Math.min(100, Math.round((currentWeek / totalWeeks) * 100)) : 0;
  const scoreColor    = complianceColor(complianceScore, exp.compliance_threshold);
  const cc            = categoryColor(exp.category);

  async function submit(milestoneId: string) {
    setSubmitting(milestoneId);
    try {
      const res = await fetch(`/api/milestones/${milestoneId}/submit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ privyDid }),
      });
      if (res.ok) onRefresh();
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="rounded overflow-hidden mb-4" style={{ border: '1px solid rgba(77,255,128,0.10)' }}>
      {/* Card header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="mono text-xs px-1.5 py-0.5 rounded shrink-0"
            style={{ color: cc, border: `1px solid ${cc}30`, background: `${cc}08` }}
          >
            {exp.category.toUpperCase()}
          </span>
          <Link
            href={`/experiments/${exp.id}`}
            className="text-sm font-medium no-underline truncate hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-bright)' }}
          >
            {exp.title}
          </Link>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {payoutEligible ? (
            <span className="mono text-xs" style={{ color: 'var(--green)' }}>✓ payout eligible</span>
          ) : (
            <span className="mono text-xs" style={{ color: 'var(--amber)' }}>⚠ compliance at risk</span>
          )}
          <span className="mono text-xs font-bold" style={{ color: 'var(--green)' }}>{fmt(exp.bounty_per_participant)}</span>
        </div>
      </div>

      {/* Metrics bar */}
      <div className="px-4 py-3 grid grid-cols-3 gap-4" style={{ background: 'var(--bg)', borderBottom: '1px solid rgba(77,255,128,0.04)' }}>
        {/* Compliance score */}
        <div>
          <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>COMPLIANCE</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded overflow-hidden" style={{ background: 'rgba(77,255,128,0.08)' }}>
              <div
                className="h-1 rounded transition-all"
                style={{ width: `${complianceScore}%`, background: scoreColor }}
              />
            </div>
            <span className="mono text-xs tabular-nums" style={{ color: scoreColor }}>{complianceScore}%</span>
          </div>
          <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            threshold {exp.compliance_threshold}%
          </p>
        </div>

        {/* Study progress */}
        <div>
          <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>PROGRESS</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded overflow-hidden" style={{ background: 'rgba(77,255,128,0.08)' }}>
              <div
                className="h-1 rounded transition-all"
                style={{ width: `${progressPct}%`, background: 'var(--cyan)' }}
              />
            </div>
            <span className="mono text-xs tabular-nums" style={{ color: 'var(--cyan)' }}>
              W{currentWeek}/{totalWeeks}
            </span>
          </div>
          <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            {progressPct}% elapsed
          </p>
        </div>

        {/* Milestones summary */}
        <div>
          <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>MILESTONES</p>
          <p className="mono text-sm tabular-nums" style={{ color: 'var(--text-white)' }}>
            {milestones.filter((m) => m.status === 'completed').length}
            <span style={{ color: 'var(--text-dim)' }}>/{milestones.length}</span>
          </p>
          <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            {milestones.filter((m) => m.status === 'missed').length} missed
          </p>
        </div>
      </div>

      {/* Milestone timeline */}
      {weeks.length > 0 && (
        <div className="px-4 py-4" style={{ background: 'var(--bg)' }}>
          {weeks.map(([weekNum, wMilestones], wi) => {
            const isCurrentWeek = weekNum === currentWeek;
            const isPast        = weekNum < currentWeek;
            return (
              <div key={weekNum} className="flex gap-3">
                {/* Spine */}
                <div className="flex flex-col items-center" style={{ width: 20 }}>
                  <div
                    className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                    style={{
                      background: isCurrentWeek ? 'var(--cyan)' : isPast ? 'var(--green-dim)' : 'rgba(77,255,128,0.15)',
                      border:     isCurrentWeek ? '2px solid var(--cyan)' : 'none',
                    }}
                  />
                  {wi < weeks.length - 1 && (
                    <div className="flex-1 w-px mt-1" style={{ background: 'rgba(77,255,128,0.10)', minHeight: 16 }} />
                  )}
                </div>

                {/* Week content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="mono text-xs"
                      style={{ color: isCurrentWeek ? 'var(--cyan)' : isPast ? 'var(--text-dim)' : 'var(--text-dim)' }}
                    >
                      Week {weekNum}
                    </span>
                    {isCurrentWeek && (
                      <span className="mono text-xs px-1.5 py-0.5 rounded" style={{ color: 'var(--cyan)', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.20)' }}>
                        current
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {wMilestones.map((m) => {
                      const isPending   = m.status === 'pending';
                      const isCompleted = m.status === 'completed';
                      const isMissed    = m.status === 'missed';
                      const isSelfReport = m.milestone_type === 'self_report';

                      return (
                        <div key={m.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded" style={{ background: 'var(--bg2)' }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span style={{
                              color:    isCompleted ? 'var(--green)' : isMissed ? 'var(--amber)' : 'var(--text-dim)',
                              fontSize: 12,
                            }}>
                              {isCompleted ? '✓' : isMissed ? '✗' : '○'}
                            </span>
                            <div className="min-w-0">
                              <p
                                className="text-xs truncate"
                                style={{ color: isCompleted ? 'var(--text-dim)' : 'var(--text-bright)' }}
                              >
                                {m.title}
                              </p>
                              <p className="mono text-xs" style={{ color: 'var(--text-dim)', fontSize: 10 }}>
                                {isSelfReport ? 'you report' : 'experimenter confirms'}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isCompleted && (
                              <span className="mono text-xs" style={{ color: 'var(--green)' }}>done</span>
                            )}
                            {isMissed && (
                              <span className="mono text-xs" style={{ color: 'var(--amber)' }}>missed</span>
                            )}
                            {isPending && isSelfReport && (
                              <button
                                onClick={() => void submit(m.id)}
                                disabled={submitting === m.id}
                                className="mono text-xs transition-opacity hover:opacity-80 disabled:opacity-40"
                                style={{ color: 'var(--green)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                              >
                                {submitting === m.id ? '...' : 'Submit →'}
                              </button>
                            )}
                            {isPending && !isSelfReport && (
                              <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>awaiting</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {weeks.length === 0 && (
        <div className="px-4 py-6 text-center" style={{ background: 'var(--bg)' }}>
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// MILESTONES_NOT_YET_GENERATED — study not yet commenced</p>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();

  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const loadDashboard = useCallback(async (privyDid: string) => {
    try {
      const res  = await fetch(`/api/dashboard?privyDid=${encodeURIComponent(privyDid)}`);
      const json = (await res.json()) as DashboardData & { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to load dashboard');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) { router.replace('/'); return; }
    void loadDashboard(user.id);
  }, [ready, authenticated, user, router, loadDashboard]);

  // ── Guards ────────────────────────────────────────────────────────────────

  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// LOADING_DASHBOARD...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="mono text-xs" style={{ color: 'var(--amber)' }}>// ERROR: {error}</p>
      </div>
    );
  }

  if (!data?.profile) {
    router.replace('/onboarding/participant');
    return null;
  }

  const { profile, applications, activeStudies } = data;

  // ── Derived stats ─────────────────────────────────────────────────────────

  const completed    = applications.filter((a) => a.status === 'completed');
  const totalEarned  = completed.reduce((s, a) => s + (a.experiments?.bounty_per_participant ?? 0), 0);
  const badge        = reputationBadge(profile.completion_rate);
  const completeness = profileCompleteness(profile);

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">

        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="mono text-xs no-underline" style={{ color: 'var(--text-dim)' }}>← BIOME</Link>
          <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// PARTICIPANT_DASHBOARD</span>
        </div>

        {/* ── Identity strip ───────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
          <Identicon participantId={profile.participant_id} size={48} />
          <div className="flex-1 min-w-0">
            <p className="font-bold leading-tight" style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
              {profile.pseudonym}
            </p>
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              {profile.participant_id} · {countryFlag(profile.country)} {profile.country}
            </p>
          </div>
          <Link
            href={`/profile/${profile.participant_id}`}
            className="mono text-xs no-underline transition-opacity hover:opacity-80"
            style={{ color: 'var(--green)', flexShrink: 0 }}
          >
            Public profile →
          </Link>
        </div>

        {/* ── Stats bar ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'TOTAL EARNED',    value: fmt(totalEarned),                                                          color: 'var(--green)'      },
            { label: 'STUDIES',         value: String(completed.length),                                                  color: 'var(--text-white)' },
            { label: 'COMPLETION RATE', value: profile.completion_rate != null ? `${profile.completion_rate.toFixed(0)}%` : '—', color: 'var(--text-white)' },
            { label: 'REPUTATION',      value: badge.label,                                                               color: badge.color         },
          ].map((s) => (
            <div key={s.label} className="rounded p-4" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
              <p className="mono text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>{s.label}</p>
              <p className="mono text-xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Profile completeness ─────────────────────────────────── */}
        <div className="rounded p-5 mb-6" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// PROFILE_COMPLETENESS</p>
            <span className="mono text-xs" style={{ color: completeness.pct === 100 ? 'var(--green)' : 'var(--text-dim)' }}>
              {completeness.pct}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded overflow-hidden mb-4" style={{ background: 'rgba(77,255,128,0.08)' }}>
            <div
              className="h-1.5 rounded transition-all"
              style={{ width: `${completeness.pct}%`, background: completeness.pct === 100 ? 'var(--green)' : 'var(--green-dim)' }}
            />
          </div>

          {completeness.missing.length === 0 ? (
            <p className="mono text-xs" style={{ color: 'var(--green)' }}>✓ Profile complete. You are eligible for all experiments.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {completeness.missing.map((m, i) => {
                const stepMap: Record<string, string> = {
                  'Demographics completed':     '/onboarding/participant/step-2',
                  'Capability profile filled':  '/onboarding/participant/step-3',
                  'Research history added':     '/onboarding/participant/step-4',
                };
                const href = stepMap[m] ?? '/onboarding/participant';
                return (
                  <div key={i} className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                      <span style={{ color: 'var(--amber)' }}>○</span> {m}
                    </p>
                    <Link href={href} className="mono text-xs no-underline transition-opacity hover:opacity-80" style={{ color: 'var(--green)' }}>
                      Complete →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Active studies ────────────────────────────────────────── */}
        {activeStudies.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// ACTIVE_STUDIES</p>
              <span className="mono text-xs" style={{ color: 'var(--cyan)' }}>[{activeStudies.length}]</span>
            </div>
            {activeStudies.map((study) => (
              <ActiveStudyCard
                key={study.applicationId}
                study={study}
                privyDid={user!.id}
                onRefresh={() => void loadDashboard(user!.id)}
              />
            ))}
          </div>
        )}

        {/* ── Applications table ───────────────────────────────────── */}
        <div className="rounded overflow-hidden mb-6" style={{ border: '1px solid rgba(77,255,128,0.08)' }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// MY_APPLICATIONS</p>
            <span className="mono text-xs" style={{ color: 'var(--green)' }}>[{applications.length}]</span>
          </div>

          {applications.length === 0 ? (
            <div className="px-4 py-10 text-center" style={{ background: 'var(--bg)' }}>
              <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// NO_APPLICATIONS_YET</p>
              <Link
                href="/"
                className="mono text-xs no-underline transition-opacity hover:opacity-80"
                style={{ color: 'var(--green)' }}
              >
                Browse open bounties →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto" style={{ background: 'var(--bg)' }}>
              <table className="w-full border-collapse" style={{ minWidth: 560 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
                    {['EXPERIMENT', 'STATUS', 'REWARD', 'APPLIED'].map((h) => (
                      <th key={h} className="mono text-xs font-normal px-4 py-2.5 text-left" style={{ color: 'var(--text-dim)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const exp = app.experiments;
                    const cc  = categoryColor(exp?.category ?? '');
                    const sc  = STATUS_COLORS[app.status] ?? 'var(--text-dim)';
                    return (
                      <tr key={app.id} style={{ borderBottom: '1px solid rgba(77,255,128,0.04)' }}>
                        <td className="px-4 py-3">
                          {exp ? (
                            <Link href={`/experiments/${exp.id}`} className="flex flex-col gap-1 no-underline">
                              <span className="text-sm" style={{ color: 'var(--text-bright)' }}>{exp.title}</span>
                              <span className="mono text-xs px-1.5 py-0.5 rounded self-start" style={{ color: cc, border: `1px solid ${cc}30`, background: `${cc}08` }}>
                                {exp.category.toUpperCase()}
                              </span>
                            </Link>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 mono text-xs uppercase" style={{ color: sc }}>{app.status}</td>
                        <td className="px-4 py-3 mono text-xs tabular-nums" style={{ color: app.status === 'completed' ? 'var(--green)' : 'var(--text-dim)' }}>
                          {app.status === 'completed' ? fmt(exp?.bounty_per_participant ?? 0) : '—'}
                        </td>
                        <td className="px-4 py-3 mono text-xs" style={{ color: 'var(--text-dim)' }}>
                          {relDate(app.applied_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Achievements (placeholder) ───────────────────────────── */}
        <div className="rounded p-5" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
          <p className="mono text-xs mb-4" style={{ color: 'var(--text-dim)' }}>// ACHIEVEMENTS</p>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { icon: '🔬', label: 'First Study'   },
              { icon: '⭐', label: '5 Completed'   },
              { icon: '💯', label: '100% Streak'   },
              { icon: '🏆', label: 'Top 10'        },
              { icon: '🧬', label: 'Verified'      },
            ].map((a) => (
              <div
                key={a.label}
                className="rounded p-3 flex flex-col items-center gap-2 opacity-30"
                style={{ background: 'var(--bg3)', border: '1px solid rgba(77,255,128,0.06)' }}
              >
                <span className="text-2xl">{a.icon}</span>
                <p className="mono text-xs text-center" style={{ color: 'var(--text-dim)' }}>{a.label}</p>
              </div>
            ))}
          </div>
          <p className="mono text-xs mt-4 text-center" style={{ color: 'var(--text-dim)' }}>
            // COMING_SOON — unlock badges by completing experiments
          </p>
        </div>

      </div>
    </main>
  );
}
