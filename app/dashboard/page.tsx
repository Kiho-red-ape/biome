'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Identicon } from '@/components/identicon';
import { countryFlag } from '@/lib/utils/profile';
import type { ParticipantProfile } from '@/lib/types';
import { PayoutCard } from '@/components/dashboard/payout-card';
import { SiteHeader } from '@/components/nav/header';

// ─── Types ────────────────────────────────────────────────────────────────────

type AppRow = {
  id: string;
  status: string;
  applied_at: string;
  approved_at: string | null;
  completed_at: string | null;
  payout_status: string;
  eligibility_status: string | null;
  payout_initiated_at: string | null;
  payout_completed_at: string | null;
  payout_net_amount: number | null;
  experiments: {
    id: string; title: string; category: string;
    bounty_per_participant: number; status: string;
    compliance_threshold: number | null; duration_weeks: number | null;
    is_remote: boolean | null; region: string | null;
  } | null;
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
  payoutMethodConfigured: boolean;
  payoutMethodType: string | null;
};

// ─── Status maps ──────────────────────────────────────────────────────────────

const STATUS_BG: Record<string, string> = {
  applied:    'var(--teal-soft)',
  approved:   'var(--teal)',
  waitlisted: 'var(--bg-page)',
  enrolled:   'var(--teal)',
  active:     'var(--teal)',
  completed:  'var(--ink)',
  withdrawn:  'var(--bg-page)',
  rejected:   '#dc2626',
};

const STATUS_COLOR: Record<string, string> = {
  applied:    'var(--teal-dark)',
  approved:   '#ffffff',
  waitlisted: 'var(--muted)',
  enrolled:   '#ffffff',
  active:     '#ffffff',
  completed:  '#ffffff',
  withdrawn:  'var(--muted)',
  rejected:   '#ffffff',
};

const STATUS_LABELS: Record<string, string> = {
  applied:    'Under Review',
  approved:   'Accepted',
  waitlisted: 'Waitlisted',
  enrolled:   'Enrolled',
  active:     'Active',
  completed:  'Completed',
  withdrawn:  'Withdrawn',
  rejected:   'Not Selected',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function profileCompleteness(p: ParticipantProfile): { pct: number; missing: { label: string; href: string }[] } {
  const checks = [
    { done: p.onboarding_step >= 1,                            label: 'Account verified',        href: '/onboarding/participant'        },
    { done: !!p.year_of_birth && !!p.nationality,              label: 'Demographics completed',   href: '/onboarding/participant/step-2' },
    { done: !!p.smartphone_os,                                 label: 'Capability profile filled', href: '/onboarding/participant/step-3' },
    { done: p.previous_study_count > 0 || !!p.recent_interventions, label: 'Research history added', href: '/onboarding/participant/step-4' },
  ];
  const done    = checks.filter((c) => c.done).length;
  const missing = checks.filter((c) => !c.done).map((c) => ({ label: c.label, href: c.href }));
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

function reputationLabel(rate: number | null | undefined): { label: string; bg: string; color: string } {
  if (rate == null) return { label: 'New',          bg: 'var(--bg-page)',    color: 'var(--muted)'    };
  if (rate >= 95)   return { label: 'Excellent',    bg: 'var(--teal)',       color: '#ffffff'          };
  if (rate >= 80)   return { label: 'Strong',       bg: 'var(--teal-dark)',  color: '#ffffff'          };
  return               { label: 'Needs Review', bg: 'var(--teal-soft)', color: 'var(--teal-dark)' };
}

// ─── Card shell ───────────────────────────────────────────────────────────────

function DashCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:   'var(--surface)',
      border:       '1px solid var(--border-soft)',
      borderRadius: 'var(--radius)',
      boxShadow:    'var(--shadow-sm)',
      marginBottom: 24,
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding:      '14px 24px',
      borderBottom: '1px solid var(--border-soft)',
      fontFamily:   'var(--font-body)',
      fontSize:     11,
      fontWeight:   600,
      letterSpacing:'2px',
      textTransform:'uppercase' as const,
      color:        'var(--slate)',
      background:   'var(--bg-page)',
      borderRadius: 'var(--radius) var(--radius) 0 0',
    }}>
      {children}
    </div>
  );
}

// ─── Active Study Card ────────────────────────────────────────────────────────

function ActiveStudyCard({ study, privyDid, onRefresh }: {
  study: ActiveStudy;
  privyDid: string;
  onRefresh: () => void;
}) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const { experiment: exp, milestones, complianceScore, payoutEligible, currentWeek } = study;

  const weekMap = new Map<number, MilestoneRow[]>();
  for (const m of milestones) {
    if (!weekMap.has(m.week_number)) weekMap.set(m.week_number, []);
    weekMap.get(m.week_number)!.push(m);
  }
  const weeks      = Array.from(weekMap.entries()).sort(([a], [b]) => a - b);
  const totalWeeks = exp.duration_weeks ?? weeks.length;
  const progressPct = totalWeeks > 0 ? Math.min(100, Math.round((currentWeek / totalWeeks) * 100)) : 0;

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

  const complianceOk = complianceScore >= exp.compliance_threshold;

  return (
    <DashCard style={{ marginBottom: 16 }}>
      {/* Study header */}
      <div style={{
        padding:        '16px 24px',
        borderBottom:   '1px solid var(--border-soft)',
        display:        'flex',
        alignItems:     'flex-start',
        justifyContent: 'space-between',
        gap:            12,
        background:     'var(--teal)',
        borderRadius:   'var(--radius) var(--radius) 0 0',
      }}>
        <div style={{ minWidth: 0 }}>
          <Link href={`/experiments/${exp.id}`} style={{
            fontFamily:     'var(--font-body)',
            fontWeight:     600,
            fontSize:       16,
            color:          '#ffffff',
            textDecoration: 'none',
          }}>
            {exp.title}
          </Link>
          <div style={{ marginTop: 6 }}>
            <span style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      9,
              fontWeight:    600,
              letterSpacing: '1.5px',
              textTransform: 'uppercase' as const,
              background:    'rgba(255,255,255,0.15)',
              color:         '#ffffff',
              padding:       '2px 6px',
              borderRadius:  '4px',
            }}>
              {exp.category}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize:   18,
            color:      '#ffffff',
          }}>
            {fmt(exp.bounty_per_participant)}
          </div>
          {payoutEligible ? (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              compensation eligible
            </span>
          ) : (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.9)' }}>
              compliance at risk
            </span>
          )}
        </div>
      </div>

      {/* Metrics row */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        borderBottom:        '1px solid var(--border-soft)',
      }}>
        {[
          {
            label: 'Compliance',
            value: `${complianceScore}%`,
            sub:   `threshold ${exp.compliance_threshold}%`,
            color: complianceOk ? 'var(--ink)' : '#dc2626',
          },
          {
            label: 'Progress',
            value: `Week ${currentWeek}/${totalWeeks}`,
            sub:   `${progressPct}% elapsed`,
            color: 'var(--ink)',
          },
          {
            label: 'Milestones',
            value: `${milestones.filter(m => m.status === 'completed').length}/${milestones.length}`,
            sub:   `${milestones.filter(m => m.status === 'missed').length} missed`,
            color: 'var(--ink)',
          },
        ].map((m, i) => (
          <div key={m.label} style={{
            padding:     '16px 20px',
            borderRight: i < 2 ? '1px solid var(--border-soft)' : 'none',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 6 }}>
              {m.label}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 20, color: m.color }}>
              {m.value}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 0 0 0', borderBottom: weeks.length > 0 ? '1px solid var(--border-soft)' : 'none' }}>
        <div style={{ height: 6, background: 'var(--bg-page)' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: complianceOk ? 'var(--teal)' : '#dc2626', transition: 'width 400ms' }} />
        </div>
      </div>

      {/* Milestone timeline */}
      {weeks.length > 0 && (
        <div style={{ padding: '20px 24px' }}>
          {weeks.map(([weekNum, wMilestones]) => {
            const isCurrentWeek = weekNum === currentWeek;
            const isPast        = weekNum < currentWeek;
            return (
              <div key={weekNum} style={{ marginBottom: 16 }}>
                <div style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      10,
                  fontWeight:    600,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase' as const,
                  color:         isCurrentWeek ? 'var(--ink)' : 'var(--muted)',
                  marginBottom:  8,
                  display:       'flex',
                  alignItems:    'center',
                  gap:           8,
                }}>
                  Week {weekNum}
                  {isCurrentWeek && (
                    <span style={{ background: 'var(--teal)', color: '#ffffff', padding: '1px 8px', borderRadius: '4px', fontSize: 9 }}>
                      Current
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {wMilestones.map((m) => {
                    const isCompleted  = ['submitted', 'completed', 'verified'].includes(m.status);
                    const isMissed     = ['missed', 'rejected'].includes(m.status);
                    const isPending    = m.status === 'pending';
                    const isSelfReport = m.milestone_type === 'self_report';
                    return (
                      <div key={m.id} style={{
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'space-between',
                        padding:        '10px 16px',
                        border:         '1px solid var(--border-soft)',
                        borderRadius:   'var(--radius-sm)',
                        background:     isCompleted ? 'var(--bg-page)' : 'var(--surface)',
                        gap:            12,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <span style={{
                            fontFamily: 'var(--font-body)',
                            fontWeight: 700,
                            fontSize:   14,
                            color:      isCompleted ? 'var(--muted)' : isMissed ? '#dc2626' : 'var(--teal)',
                            flexShrink: 0,
                          }}>
                            {isCompleted ? '✓' : isMissed ? '✗' : '○'}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{
                              fontFamily:   'var(--font-body)',
                              fontSize:     13,
                              color:        isCompleted ? 'var(--muted)' : 'var(--ink)',
                              overflow:     'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace:   'nowrap',
                            }}>
                              {m.title}
                            </div>
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                              {isSelfReport ? 'You report' : 'Researcher confirms'}
                            </div>
                          </div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                          {isCompleted && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>
                              Done
                            </span>
                          )}
                          {isMissed && m.status === 'rejected' && (
                            <Link href={`/disputes/raise?milestone_id=${m.id}&application_id=${isPast}&experiment_id=${exp.id}`}
                              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#dc2626', textDecoration: 'none' }}>
                              Dispute →
                            </Link>
                          )}
                          {isMissed && m.status === 'missed' && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#dc2626' }}>Missed</span>
                          )}
                          {isPending && isSelfReport && (
                            <button
                              onClick={() => void submit(m.id)}
                              disabled={submitting === m.id}
                              style={{
                                fontFamily:   'var(--font-body)',
                                fontSize:     12,
                                fontWeight:   600,
                                background:   'var(--teal)',
                                color:        '#ffffff',
                                border:       'none',
                                borderRadius: 'var(--radius-sm)',
                                padding:      '5px 12px',
                                cursor:       submitting === m.id ? 'not-allowed' : 'pointer',
                                opacity:      submitting === m.id ? 0.5 : 1,
                              }}
                            >
                              {submitting === m.id ? '...' : 'Submit →'}
                            </button>
                          )}
                          {isPending && !isSelfReport && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>Awaiting</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashCard>
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

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!ready || loading) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{
            border:       '1px solid var(--border-soft)',
            borderRadius: 'var(--radius)',
            boxShadow:    'var(--shadow-md)',
            background:   'var(--surface)',
            padding:      '32px 48px',
            fontFamily:   'var(--font-body)',
            fontWeight:   500,
            fontSize:     16,
            color:        'var(--ink)',
          }}>
            Loading dashboard...
          </div>
        </div>
      </main>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{
            border:       '1px solid #fecaca',
            borderRadius: 'var(--radius)',
            boxShadow:    'var(--shadow-sm)',
            background:   'var(--surface)',
            padding:      '32px 48px',
            fontFamily:   'var(--font-body)',
            fontWeight:   500,
            fontSize:     15,
            color:        '#dc2626',
          }}>
            Error: {error}
          </div>
        </div>
      </main>
    );
  }

  if (!data?.profile) {
    router.replace('/onboarding/participant');
    return null;
  }

  const { profile, applications, activeStudies, payoutMethodConfigured, payoutMethodType } = data;

  // ── Derived stats ──────────────────────────────────────────────────────────
  const completed    = applications.filter((a) => a.status === 'completed');
  const totalEarned  = completed.reduce((s, a) => s + (a.experiments?.bounty_per_participant ?? 0), 0);
  const completeness = profileCompleteness(profile);
  const repBadge     = reputationLabel(profile.completion_rate);

  // ── Payouts ────────────────────────────────────────────────────────────────
  const payoutApps = applications.filter((a) =>
    ['approved', 'enrolled', 'completed'].includes(a.status) ||
    ['processing', 'paid', 'failed', 'method_missing'].includes(a.payout_status)
  );

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <SiteHeader />

      {/* ── Identity strip ── */}
      <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ border: '2px solid var(--teal)', borderRadius: '50%', flexShrink: 0 }}>
              <Identicon participantId={profile.participant_id} size={56} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', lineHeight: 1.2 }}>
                {profile.pseudonym}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                {profile.participant_id} · {countryFlag(profile.country)} {profile.country}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href={`/profile/${profile.participant_id}`}
              style={{
                fontFamily:     'var(--font-body)',
                fontSize:       13,
                fontWeight:     600,
                color:          '#ffffff',
                background:     'var(--teal)',
                borderRadius:   'var(--radius-sm)',
                padding:        '8px 16px',
                textDecoration: 'none',
              }}>
              Public Profile →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', marginBottom: 24, background: 'var(--surface)' }}
          className="dash-stats-grid">
          {[
            { label: 'Compensation',    value: fmt(totalEarned),                                          sub: 'total'     },
            { label: 'Studies',         value: String(completed.length),                                  sub: 'completed' },
            { label: 'Completion Rate', value: profile.completion_rate != null ? `${profile.completion_rate.toFixed(0)}%` : '—', sub: 'avg' },
            { label: 'Reputation',      value: repBadge.label, valueBg: repBadge.bg, valueColor: repBadge.color, sub: '' },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding:     '20px',
              borderRight: i < 3 ? '1px solid var(--border-soft)' : 'none',
              textAlign:   'center',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 8 }}>
                {s.label}
              </div>
              {s.valueBg ? (
                <span style={{ background: s.valueBg, color: s.valueColor, borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, padding: '4px 10px', display: 'inline-block' }}>
                  {s.value}
                </span>
              ) : (
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 22, color: 'var(--ink)', lineHeight: 1 }}>
                  {s.value}
                </div>
              )}
              {s.sub && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  {s.sub}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Profile completeness */}
        {completeness.pct < 100 && (
          <DashCard>
            <CardLabel>Profile Completeness — {completeness.pct}%</CardLabel>
            <div style={{ padding: '0' }}>
              {/* Progress bar */}
              <div style={{ height: 6, background: 'var(--bg-page)' }}>
                <div style={{ height: '100%', width: `${completeness.pct}%`, background: 'var(--teal)', transition: 'width 400ms' }} />
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {completeness.missing.map((m) => (
                  <div key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-page)' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)' }}>
                      {m.label}
                    </span>
                    <Link href={m.href} style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#ffffff', background: 'var(--teal)', borderRadius: 'var(--radius-sm)', padding: '5px 12px', textDecoration: 'none' }}>
                      Complete →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </DashCard>
        )}

        {/* Active studies */}
        {activeStudies.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' as const, color: 'var(--slate)', marginBottom: 16 }}>
              Active Studies ({activeStudies.length})
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

        {/* Compensation */}
        {payoutApps.length > 0 && (
          <DashCard>
            <CardLabel>
              Compensation ({payoutApps.length})
              {!payoutMethodConfigured && (
                <span style={{ marginLeft: 12, background: 'var(--teal-soft)', color: 'var(--teal-dark)', borderRadius: '4px', padding: '1px 8px', fontSize: 9, fontWeight: 700 }}>
                  Payout method not set up
                </span>
              )}
            </CardLabel>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {payoutApps.map((app) => (
                <PayoutCard
                  key={app.id}
                  applicationId={app.id}
                  studyTitle={app.experiments?.title ?? '—'}
                  grossAmount={app.experiments?.bounty_per_participant ?? 0}
                  payoutStatus={app.payout_status}
                  payoutMethodConfigured={payoutMethodConfigured}
                  payoutMethodType={payoutMethodType}
                  payoutNetAmount={app.payout_net_amount}
                  payoutInitiatedAt={app.payout_initiated_at}
                  payoutCompletedAt={app.payout_completed_at}
                  privyDid={user!.id}
                  experimentId={app.experiments?.id ?? ''}
                />
              ))}
            </div>
          </DashCard>
        )}

        {/* Applications */}
        <DashCard>
          <CardLabel>My Applications ({applications.length})</CardLabel>

          {applications.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>
                No applications yet
              </div>
              <Link href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                Browse Open Studies →
              </Link>
            </div>
          ) : (
            <div>
              {applications.map((app, i) => {
                const exp = app.experiments;
                const sl  = STATUS_LABELS[app.status] ?? app.status;
                const bg  = STATUS_BG[app.status] ?? 'var(--bg-page)';
                const fc  = STATUS_COLOR[app.status] ?? 'var(--ink)';
                return (
                  <div key={app.id} style={{
                    padding:        '16px 24px',
                    borderBottom:   i < applications.length - 1 ? '1px solid var(--border-soft)' : 'none',
                    display:        'flex',
                    alignItems:     'flex-start',
                    justifyContent: 'space-between',
                    gap:            12,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {exp ? (
                        <Link href={`/experiments/${exp.id}`} style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500, color: 'var(--ink)', textDecoration: 'none' }}>
                          {exp.title}
                        </Link>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--muted)' }}>—</span>
                      )}
                      <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                        {exp && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' as const, background: 'var(--teal-faint)', color: 'var(--teal-dark)', borderRadius: '4px', padding: '2px 6px' }}>
                            {exp.category}
                          </span>
                        )}
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)' }}>
                          Applied {relDate(app.applied_at)}
                        </span>
                        {exp?.duration_weeks && (
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)' }}>
                            {exp.duration_weeks} weeks
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <span style={{
                        fontFamily:    'var(--font-mono)',
                        fontSize:      9,
                        fontWeight:    700,
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase' as const,
                        background:    bg,
                        color:         fc,
                        borderRadius:  '4px',
                        padding:       '3px 8px',
                      }}>
                        {sl}
                      </span>
                      {['completed', 'approved'].includes(app.status) && exp && (
                        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--teal-dark)' }}>
                          {fmt(exp.bounty_per_participant)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DashCard>

        {/* Achievements */}
        <DashCard>
          <CardLabel>Achievements</CardLabel>
          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }} className="dash-badges-grid">
            {[
              { icon: '🔬', label: 'First Study' },
              { icon: '⭐', label: '5 Completed' },
              { icon: '💯', label: '100% Streak' },
              { icon: '🏆', label: 'Top 10'      },
              { icon: '🧬', label: 'Verified'    },
            ].map((a) => (
              <div key={a.label} style={{
                border:        '1px solid var(--border-soft)',
                borderRadius:  'var(--radius-sm)',
                padding:       '16px 8px',
                display:       'flex',
                flexDirection: 'column',
                alignItems:    'center',
                gap:           8,
                opacity:       0.35,
                background:    'var(--bg-page)',
              }}>
                <span style={{ fontSize: 24 }}>{a.icon}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, textAlign: 'center', color: 'var(--ink)' }}>
                  {a.label}
                </span>
              </div>
            ))}
          </div>
          <div style={{ padding: '0 24px 20px', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
            Unlock badges by completing studies
          </div>
        </DashCard>

      </div>

      <style>{`
        @media (max-width: 640px) {
          .dash-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-badges-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </main>
  );
}
