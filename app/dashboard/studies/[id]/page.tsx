'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { SiteHeader } from '@/components/nav/header';
import { DashCard, CardLabel } from '@/components/dashboard/card';
import { NeedsAttention } from '@/components/dashboard/needs-attention';
import { DocumentsCenter } from '@/components/dashboard/documents-center';
import { MilestonesTimeline } from '@/components/study-workspace/milestones-timeline';
import { ChatThread } from '@/components/study-workspace/chat-thread';
import { AskBiome } from '@/components/agent/ask-biome';
import { TranslateBar, useTranslation } from '@/components/translate/translate-bar';

// ── Types ────────────────────────────────────────────────────────────────────

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

type ExperimentUpdate = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

type SampleKit = {
  id: string;
  kit_type: string | null;
  ship_status: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  tracking_number_outbound: string | null;
  collection_status: string | null;
  collection_due_date: string | null;
  collected_at: string | null;
  return_status: string | null;
  return_shipped_at: string | null;
  received_at_lab_at: string | null;
  phlebotomy_status: string | null;
  phlebotomy_appointment_date: string | null;
  phlebotomy_partner: string | null;
  lab_partner_name: string | null;
  results_ready_at: string | null;
};

type WorkspaceData = {
  application: {
    id: string;
    status: string;
    applied_at: string;
    eligibility_status: string | null;
    study_agreement_accepted_at: string | null;
  };
  experiment: {
    id: string;
    title: string;
    category: string;
    bounty_per_participant: number;
    duration_weeks: number | null;
    compliance_threshold: number | null;
    commenced_at: string | null;
    status: string;
    description: string | null;
    region: string | null;
    is_remote: boolean | null;
  };
  currentWeek: number;
  milestones: MilestoneRow[];
  complianceScore: number;
  payoutEligible: boolean;
  updates: ExperimentUpdate[];
  kit: SampleKit | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Kit timeline step ─────────────────────────────────────────────────────────

type KitStep = {
  label: string;
  done: boolean;
  date: string | null;
  isCurrent: boolean;
};

function buildKitSteps(kit: SampleKit): KitStep[] {
  const steps: KitStep[] = [
    { label: 'Kit dispatched',  done: !!kit.shipped_at,      date: kit.shipped_at,        isCurrent: false },
    { label: 'Delivered to you', done: !!kit.delivered_at,   date: kit.delivered_at,       isCurrent: false },
    { label: 'Sample collected', done: !!kit.collected_at,   date: kit.collected_at,       isCurrent: false },
    { label: 'Kit returned',    done: !!kit.return_shipped_at, date: kit.return_shipped_at, isCurrent: false },
    { label: 'Received at lab', done: !!kit.received_at_lab_at, date: kit.received_at_lab_at, isCurrent: false },
    { label: 'Results ready',   done: !!kit.results_ready_at, date: kit.results_ready_at,  isCurrent: false },
  ];

  // Mark current step (first not done)
  let foundCurrent = false;
  for (const step of steps) {
    if (!step.done && !foundCurrent) {
      step.isCurrent = true;
      foundCurrent = true;
    }
  }

  return steps;
}

// ── About this study (translatable title + description) ──────────────────────

function AboutStudy({ title, description }: { title: string; description: string }) {
  // Title and description travel together so the API translates them as one
  // document; the first paragraph of the result is the translated title.
  const t = useTranslation(`${title}\n\n${description}`, 'study');

  let shownTitle = title;
  let shownBody = description;
  if (t.active !== 'en' && t.translated) {
    const idx = t.translated.indexOf('\n\n');
    if (idx > 0) {
      shownTitle = t.translated.slice(0, idx).trim();
      shownBody = t.translated.slice(idx + 2).trim();
    } else {
      shownBody = t.translated;
    }
  }

  return (
    <DashCard>
      <CardLabel>About This Study</CardLabel>
      <div style={{ padding: '20px 24px' }}>
        <div style={{ marginBottom: 14 }}>
          <TranslateBar active={t.active} loading={t.loading} error={t.error} onSelect={t.select} />
        </div>
        <div style={{
          fontFamily:   'var(--font-body)',
          fontSize:     15,
          fontWeight:   600,
          color:        'var(--ink)',
          marginBottom: 8,
        }}>
          {shownTitle}
        </div>
        {shownBody.split(/\n\s*\n/).map((para, i) => (
          <p key={i} style={{
            fontFamily: 'var(--font-body)',
            fontSize:   14,
            color:      'var(--slate)',
            lineHeight: 1.6,
            margin:     i === 0 ? 0 : '10px 0 0',
          }}>
            {para}
          </p>
        ))}
      </div>
    </DashCard>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export default function StudyWorkspacePage() {
  const router  = useRouter();
  const params  = useParams<{ id: string }>();
  const experimentId = params.id;
  const { user, ready, authenticated } = usePrivy();

  const [data,    setData]    = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadWorkspace = useCallback(async (privyDid: string) => {
    try {
      const res  = await fetch(
        `/api/study/${experimentId}/workspace?privyDid=${encodeURIComponent(privyDid)}`,
      );
      const json = (await res.json()) as WorkspaceData & { error?: string };
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error(json.error ?? 'Failed to load workspace');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [experimentId]);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) { router.replace('/'); return; }
    void loadWorkspace(user.id);
  }, [ready, authenticated, user, router, loadWorkspace]);

  const onRefresh = useCallback(() => {
    if (user) void loadWorkspace(user.id);
  }, [user, loadWorkspace]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (!ready || loading) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{
            border:       '1px solid var(--border-soft)',
            borderRadius: 'var(--radius)',
            background:   'var(--surface)',
            padding:      '32px 48px',
            fontFamily:   'var(--font-body)',
            fontWeight:   500,
            fontSize:     16,
            color:        'var(--ink)',
          }}>
            Loading workspace...
          </div>
        </div>
      </main>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{
            border:       '1px solid #fecaca',
            borderRadius: 'var(--radius)',
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

  // ── Not found ────────────────────────────────────────────────────────────────
  if (notFound || !data) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <SiteHeader />
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>
            Study not found
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>
            You may not be enrolled in this study.
          </div>
          <Link href="/dashboard" style={{
            fontFamily:     'var(--font-body)',
            fontSize:       14,
            fontWeight:     600,
            color:          '#ffffff',
            background:     'var(--teal)',
            borderRadius:   'var(--radius-sm)',
            padding:        '10px 20px',
            textDecoration: 'none',
          }}>
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const { application, experiment: exp, currentWeek, milestones, complianceScore, payoutEligible, updates, kit } = data;
  const totalWeeks    = exp.duration_weeks ?? currentWeek;
  const progressPct   = totalWeeks > 0 ? Math.min(100, Math.round((currentWeek / totalWeeks) * 100)) : 0;
  const complianceOk  = complianceScore >= (exp.compliance_threshold ?? 80);
  const doneCount     = milestones.filter((m) => ['submitted', 'completed', 'verified'].includes(m.status)).length;

  const STATUS_LABELS: Record<string, string> = {
    draft:      'Draft',
    recruiting: 'Recruiting',
    active:     'Active',
    completed:  'Completed',
    cancelled:  'Cancelled',
  };

  return (
    <main style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      <SiteHeader />

      {/* ── Breadcrumb strip ── */}
      <div style={{
        background:   'var(--surface)',
        borderBottom: '1px solid var(--border-soft)',
        padding:      '12px 24px',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{
            fontFamily:     'var(--font-mono)',
            fontSize:       11,
            color:          'var(--muted)',
            textDecoration: 'none',
          }}>
            Dashboard
          </Link>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>/</span>
          <Link href="/dashboard" style={{
            fontFamily:     'var(--font-mono)',
            fontSize:       11,
            color:          'var(--muted)',
            textDecoration: 'none',
          }}>
            Active Studies
          </Link>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)' }}>
            {exp.title}
          </span>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* ── Study header card ── */}
        <DashCard style={{ marginBottom: 24 }}>
          {/* Teal header */}
          <div style={{
            padding:      '20px 24px',
            background:   'var(--teal)',
            borderRadius: 'var(--radius) var(--radius) 0 0',
            display:      'flex',
            alignItems:   'flex-start',
            justifyContent: 'space-between',
            gap:          12,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily:  'var(--font-body)',
                fontWeight:  700,
                fontSize:    20,
                color:       '#ffffff',
                lineHeight:  1.2,
                marginBottom: 8,
              }}>
                {exp.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      9,
                  fontWeight:    600,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  background:    'rgba(255,255,255,0.15)',
                  color:         '#ffffff',
                  padding:       '2px 8px',
                  borderRadius:  '4px',
                }}>
                  {exp.category}
                </span>
                <span style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      9,
                  fontWeight:    600,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  background:    'rgba(255,255,255,0.15)',
                  color:         '#ffffff',
                  padding:       '2px 8px',
                  borderRadius:  '4px',
                }}>
                  {STATUS_LABELS[exp.status] ?? exp.status}
                </span>
                {exp.commenced_at && (
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                    Week {currentWeek} / {totalWeeks}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 22, color: '#ffffff' }}>
                {fmt(exp.bounty_per_participant)}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                {payoutEligible ? 'compensation eligible' : 'compliance at risk'}
              </div>
              <div style={{
                marginTop:   8,
                fontFamily:  'var(--font-mono)',
                fontSize:    9,
                fontWeight:  700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                background:  payoutEligible ? 'rgba(255,255,255,0.2)' : '#dc2626',
                color:       '#ffffff',
                padding:     '3px 8px',
                borderRadius: '4px',
                display:     'inline-block',
              }}>
                {application.status}
              </div>
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
                sub:   `threshold ${exp.compliance_threshold ?? 80}%`,
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
                value: `${doneCount}/${milestones.length}`,
                sub:   `${milestones.filter((m) => m.status === 'missed').length} missed`,
                color: 'var(--ink)',
              },
            ].map((m, i) => (
              <div key={m.label} style={{
                padding:     '16px 20px',
                borderRight: i < 2 ? '1px solid var(--border-soft)' : 'none',
              }}>
                <div style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      10,
                  fontWeight:    600,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color:         'var(--muted)',
                  marginBottom:  6,
                }}>
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
          <div style={{ height: 6, background: 'var(--bg-page)', borderRadius: '0 0 var(--radius) var(--radius)' }}>
            <div style={{
              height:     '100%',
              width:      `${progressPct}%`,
              background: complianceOk ? 'var(--teal)' : '#dc2626',
              transition: 'width 400ms',
              borderRadius: '0 0 0 var(--radius)',
            }} />
          </div>
        </DashCard>

        {/* ── About this study (translatable) ── */}
        {exp.description && (
          <AboutStudy title={exp.title} description={exp.description} />
        )}

        {/* ── Needs attention (filtered to this study) ── */}
        {user && (
          <NeedsAttention privyDid={user.id} filterStudyId={experimentId} />
        )}

        {/* ── Ask BIOME — plain-language study explainer ── */}
        <div style={{ margin: '0 0 16px' }}>
          <AskBiome experimentId={experimentId} studyTitle={data?.experiment.title} />
        </div>

        {/* ── Milestones ── */}
        <DashCard>
          <CardLabel>Milestones</CardLabel>
          {user && (
            <MilestonesTimeline
              milestones={milestones}
              currentWeek={currentWeek}
              experimentId={experimentId}
              privyDid={user.id}
              onRefresh={onRefresh}
            />
          )}
        </DashCard>

        {/* ── Documents (filtered to this study) ── */}
        {user && (
          <DocumentsCenter privyDid={user.id} filterStudyId={experimentId} />
        )}

        {/* ── Study updates ── */}
        {updates.length > 0 && (
          <DashCard>
            <CardLabel>Study Updates</CardLabel>
            <div style={{ padding: '20px 24px' }}>
              {updates.map((u, i) => (
                <div key={u.id}>
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize:   15,
                    fontWeight: 600,
                    color:      'var(--ink)',
                    marginBottom: 4,
                  }}>
                    {u.title}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize:   11,
                    color:      'var(--muted)',
                    marginBottom: 8,
                  }}>
                    {fmtDate(u.created_at)}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize:   14,
                    color:      'var(--muted)',
                    lineHeight: 1.6,
                  }}>
                    {u.content}
                  </div>
                  {i < updates.length - 1 && (
                    <div style={{ borderBottom: '1px solid var(--border-soft)', margin: '20px 0' }} />
                  )}
                </div>
              ))}
            </div>
          </DashCard>
        )}

        {/* ── Sample kit ── */}
        {kit !== null && (
          <DashCard>
            <CardLabel>Sample Kit</CardLabel>
            <div style={{ padding: '20px 24px' }}>
              {/* Tracking info */}
              {kit.tracking_number_outbound && (
                <div style={{
                  marginBottom:  16,
                  padding:       '10px 16px',
                  background:    'var(--teal-faint)',
                  border:        '1px solid var(--teal-soft)',
                  borderRadius:  'var(--radius-sm)',
                  fontFamily:    'var(--font-mono)',
                  fontSize:      12,
                  color:         'var(--teal-dark)',
                }}>
                  Tracking: {kit.tracking_number_outbound}
                </div>
              )}

              {/* Timeline steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {buildKitSteps(kit).map((step) => (
                  <div key={step.label} style={{
                    display:     'flex',
                    alignItems:  'center',
                    gap:         12,
                    padding:     '10px 16px',
                    border:      '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    background:  step.done ? 'var(--bg-page)' : step.isCurrent ? 'var(--teal-faint)' : 'var(--surface)',
                    borderLeft:  step.isCurrent ? '3px solid var(--teal)' : '1px solid var(--border-soft)',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      fontSize:   14,
                      color:      step.done ? 'var(--teal)' : step.isCurrent ? 'var(--teal)' : 'var(--muted)',
                      flexShrink: 0,
                      width:      16,
                    }}>
                      {step.done ? '✓' : step.isCurrent ? '○' : '–'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: 'var(--font-body)',
                        fontSize:   13,
                        fontWeight: step.isCurrent ? 600 : 400,
                        color:      step.done || step.isCurrent ? 'var(--ink)' : 'var(--muted)',
                      }}>
                        {step.label}
                      </div>
                      {step.date && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          {fmtDate(step.date)}
                        </div>
                      )}
                    </div>
                    {step.isCurrent && (
                      <span style={{
                        fontFamily:    'var(--font-mono)',
                        fontSize:      9,
                        fontWeight:    700,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        background:    'var(--teal)',
                        color:         '#ffffff',
                        padding:       '2px 8px',
                        borderRadius:  '4px',
                        flexShrink:    0,
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Phlebotomy appointment */}
              {kit.phlebotomy_appointment_date && (
                <div style={{
                  marginTop:    16,
                  padding:      '12px 16px',
                  background:   'var(--teal-soft)',
                  border:       '1px solid var(--teal)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--teal-dark)', marginBottom: 4 }}>
                    Phlebotomy Appointment
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)' }}>
                    {fmtDate(kit.phlebotomy_appointment_date)}
                    {kit.phlebotomy_partner && (
                      <span style={{ marginLeft: 8, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)' }}>
                        at {kit.phlebotomy_partner}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Lab info */}
              {kit.lab_partner_name && (
                <div style={{
                  marginTop:   12,
                  fontFamily:  'var(--font-body)',
                  fontSize:    12,
                  color:       'var(--muted)',
                }}>
                  Lab partner: {kit.lab_partner_name}
                </div>
              )}
            </div>
          </DashCard>
        )}

        {/* ── Chat thread ── */}
        {user && (
          <ChatThread experimentId={experimentId} privyDid={user.id} />
        )}

      </div>
    </main>
  );
}
