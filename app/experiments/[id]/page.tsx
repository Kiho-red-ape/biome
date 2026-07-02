import { createAnonClient } from '@/lib/supabase/anon';
import { createServiceClient } from '@/lib/supabase/server';
import { ReimbursementReveal } from '@/components/study/reimbursement-reveal';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Experiment, ExperimentStatus, AmendmentEntry } from '@/lib/types';
import { QASection } from '@/components/qa/qa-section';
import type { Question, QAComment } from '@/components/qa/qa-section';
import { DraftBanner } from '@/components/experiments/draft-banner';
import { ExperimentIdenticon } from '@/components/ui/experiment-identicon';
import { ExperimentCTA } from './experiment-cta';

// ─── Collection summary helpers ───────────────────────────────────────────────

function deriveInputs(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('sleep'))                          return 'Wearable sleep data · daily logs · morning HRV';
  if (c.includes('nutri') || c.includes('diet'))   return 'Food logs · dietary surveys · biometric check-ins';
  if (c.includes('micro') || c.includes('gut'))    return 'Stool / saliva samples · symptom surveys';
  if (c.includes('longev') || c.includes('cold'))  return 'HRV wearable data · subjective energy logs';
  if (c.includes('wear') || c.includes('quantif')) return 'Wearable sensor data · self-report logs';
  return 'Survey responses · self-report logs';
}

function deriveDevices(inclCriteria: string | null, isRemote: boolean): string {
  const t = (inclCriteria ?? '').toLowerCase();
  const wearable = /wearable|oura|fitbit|garmin|whoop|apple watch|polar/.test(t);
  const tools: string[] = [];
  if (wearable)  tools.push('wearable device');
  if (isRemote)  tools.push('mobile app');
  if (tools.length === 0) tools.push('questionnaire');
  return tools.join(' · ');
}

function deriveSample(inclCriteria: string | null, category: string): string {
  const t = (inclCriteria ?? '').toLowerCase();
  const c = category.toLowerCase();
  const parts: string[] = [];
  if (t.includes('stool') || c.includes('micro'))  parts.push('stool');
  if (t.includes('saliva'))                          parts.push('saliva');
  if (t.includes('blood') || t.includes('glucose')) parts.push('blood');
  if (t.includes('urine'))                           parts.push('urine');
  return parts.length > 0 ? parts.join(', ') : 'none';
}

function deriveVisits(isRemote: boolean, region: string | null): string {
  if (isRemote) return 'Remote only';
  return region ? `${region} in-person` : 'In-person';
}

function deadlineDays(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
}

// ─── Category helpers ──────────────────────────────────────────────────────────

function rampKey(cat: string): string {
  const n = (cat ?? '').toLowerCase().replace(/\s+/g, '-');
  if (n.includes('micro') || n.includes('gut'))  return 'microbiome';
  if (n.includes('nutri') || n.includes('diet')) return 'nutrition';
  if (n.includes('sleep') || n.includes('recov')) return 'sleep';
  if (n.includes('wear') || n.includes('device')) return 'wearables';
  if (n.includes('longev') || n.includes('aging')) return 'longevity';
  if (n.includes('quant') || n.includes('self'))  return 'quantified-self';
  const KEYS = ['microbiome','nutrition','sleep','wearables','longevity','quantified-self'];
  return KEYS.includes(n) ? n : 'microbiome';
}

// ─── Status config (canonical clinical pill palette) ──────────────────────────

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string }> = {
  recruiting: { label: 'Recruiting', color: 'var(--teal)'      },
  active:     { label: 'Active',     color: 'var(--teal-dark)' },
  draft:      { label: 'Draft',      color: 'var(--slate)'     },
  completed:  { label: 'Completed',  color: '#15803d'          },
  cancelled:  { label: 'Cancelled',  color: '#dc2626'          },
};

function StatusPill({ status }: { status: ExperimentStatus }) {
  const st = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           6,
        whiteSpace:    'nowrap',
        fontFamily:    'var(--font-mono)',
        fontSize:      10,
        fontWeight:    600,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        color:         st.color,
        background:    'var(--bg-page)',
        border:        '1px solid var(--border-soft)',
        borderRadius:  999,
        padding:       '3px 9px',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
      {st.label}
    </span>
  );
}

// ─── Card shells ───────────────────────────────────────────────────────────────

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section style={{
      background:   'var(--surface)',
      border:       '1px solid var(--border-soft)',
      borderRadius: 'var(--radius)',
      boxShadow:    'var(--shadow-sm)',
      marginBottom: 16,
      overflow:     'hidden',
      ...style,
    }}>
      {children}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding:       '14px 24px',
      borderBottom:  '1px solid var(--border-soft)',
      background:    'var(--bg-page)',
      display:       'flex',
      flexWrap:      'wrap',
      alignItems:    'center',
      gap:           12,
      fontFamily:    'var(--font-mono)',
      fontSize:      11,
      fontWeight:    600,
      letterSpacing: '2px',
      textTransform: 'uppercase',
      color:         'var(--muted)',
    }}>
      {children}
    </div>
  );
}

const FIELD_LABEL: React.CSSProperties = {
  fontFamily:    'var(--font-mono)',
  fontSize:      9,
  fontWeight:    600,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color:         'var(--muted)',
  marginBottom:  6,
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type StudyMilestone = {
  id: string;
  week_number: number;
  title: string;
  description: string | null;
  milestone_type: 'self_report' | 'experimenter_confirm';
  sort_order: number;
};

interface Props {
  params: Promise<{ id: string }>;
}

function criteriaList(text: string | null) {
  if (!text) return null;
  return text.split('\n').map((l) => l.trim()).filter(Boolean);
}

// ─── Milestone timeline ───────────────────────────────────────────────────────

function MilestoneTimeline({ milestones }: { milestones: StudyMilestone[] }) {
  if (milestones.length === 0) return null;

  const byWeek: Record<number, StudyMilestone[]> = {};
  for (const m of milestones) {
    if (!byWeek[m.week_number]) byWeek[m.week_number] = [];
    byWeek[m.week_number].push(m);
  }
  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {weeks.map((week, wi) => (
        <div key={week} style={{ display: 'flex', gap: 16 }}>
          {/* Spine */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', flexShrink: 0, marginTop: 4 }} />
            {wi < weeks.length - 1 && (
              <div style={{ width: 1, flex: 1, background: 'var(--border-soft)', marginTop: 4, minHeight: 20 }} />
            )}
          </div>
          {/* Content */}
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
              color: 'var(--teal-dark)', marginBottom: 8, letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              Week {week}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {byWeek[week].sort((a, b) => a.sort_order - b.sort_order).map((m) => (
                <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', flexShrink: 0, marginTop: 1 }}>○</span>
                  <div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{m.title}</span>
                    {m.description && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>{m.description}</p>
                    )}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                      {' '}({m.milestone_type === 'self_report' ? 'participant reports' : 'experimenter confirms'})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function ExperimentPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAnonClient();

  const [expResult, commentsResult, milestonesResult] = await Promise.all([
    supabase.from('experiments').select('*, profiles!experimenter_id(*)').eq('id', id).single(),
    supabase
      .from('comments')
      .select('*, profiles!author_id(display_name, region, participant_profiles(participant_id, pseudonym))')
      .eq('experiment_id', id).order('created_at', { ascending: true }),
    supabase
      .from('study_milestones')
      .select('id, week_number, title, description, milestone_type, sort_order')
      .eq('experiment_id', id).order('week_number').order('sort_order'),
  ]);

  if (!expResult.data) notFound();

  const exp = expResult.data as Experiment & {
    profiles:             { display_name: string | null; bio: string | null; region: string | null } | null;
    amendment_log:        AmendmentEntry[] | null;
    commenced:            boolean;
    commenced_at:         string | null;
    compliance_threshold: number | null;
    iec_approval:         string | null;
    enrollment_url:       string | null;
  };

  const milestones = (milestonesResult.data ?? []) as StudyMilestone[];

  const { data: orgData } = await supabase
    .from('experimenter_profiles').select('id, org_name').eq('user_id', exp.experimenter_id).maybeSingle();
  const orgProfile = orgData as { id: string; org_name: string } | null;

  // Does this study have an approved, readable IRB consent document? If so, the
  // apply CTA routes through the comprehension-gated consent flow. (study_documents
  // is RLS-locked, so this needs the service client.)
  const { data: icfDoc } = await createServiceClient()
    .from('study_documents')
    .select('id')
    .eq('experiment_id', id)
    .eq('document_type', 'consent_form')
    .in('status', ['approved', 'signed', 'pending_signature'])
    .not('content_html', 'is', null)
    .limit(1)
    .maybeSingle();
  const hasIcf = !!icfDoc;

  const allComments = (commentsResult.data ?? []) as QAComment[];
  const replyMap: Record<string, QAComment[]> = {};
  for (const c of allComments) {
    if (c.parent_id) {
      if (!replyMap[c.parent_id]) replyMap[c.parent_id] = [];
      replyMap[c.parent_id].push(c);
    }
  }
  const questions: Question[] = allComments
    .filter((c) => !c.parent_id)
    .map((c) => ({ ...c, replies: replyMap[c.id] ?? [] }));

  const rk          = rampKey(exp.category);
  const slotPct     = exp.slots_total > 0 ? (exp.slots_filled / exp.slots_total) * 100 : 0;
  const slotsLeft   = exp.slots_total - exp.slots_filled;
  const inclusion   = criteriaList(exp.inclusion_criteria);
  const exclusion   = criteriaList(exp.exclusion_criteria);
  const threshold   = exp.compliance_threshold ?? 80;
  const orgName     = orgProfile?.org_name ?? exp.profiles?.display_name ?? 'Unknown';
  const durWks      = (exp as unknown as Record<string, unknown>).duration_weeks as number | null;

  const expRaw         = exp as unknown as Record<string, unknown>;
  const deadline       = expRaw.application_deadline as string | null ?? null;
  const daysLeft       = deadline ? deadlineDays(deadline) : null;
  const deadlineClosed = daysLeft !== null && daysLeft <= 0;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>

      {/* ── Sticky mini nav ── */}
      <header className="px-4 sm:px-10" style={{
        position: 'sticky', top: 0, zIndex: 200,
        height: 52, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-soft)',
      }}>
        <Link href="/experiments" style={{
          fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
          color: 'var(--slate)',
        }}>
          ← Back to studies
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="hidden sm:inline" style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Study detail
          </span>
          {exp.status === 'recruiting' && slotsLeft > 0 && (
            <Link
              href={`/experiments/${exp.id}/apply`}
              style={{
                fontFamily: 'var(--font-display)', fontSize: 12,
                textTransform: 'uppercase', letterSpacing: '0.5px',
                fontWeight: 700, color: '#ffffff',
                background: 'var(--teal)',
                padding: '7px 16px',
                textDecoration: 'none',
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'nowrap',
              }}
            >
              Apply → {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left
            </Link>
          )}
        </div>
      </header>

      {exp.status === 'draft' && (
        <DraftBanner
          experimentId={exp.id}
          experimenterUserId={exp.experimenter_id}
          experimentTitle={exp.title}
          category={exp.category}
          reward={exp.bounty_per_participant}
          slots={exp.slots_total}
          durationWeeks={durWks ?? null}
        />
      )}

      <div className="px-4 sm:px-6 has-sticky-cta" style={{ maxWidth: 960, margin: '0 auto', paddingTop: 24, paddingBottom: 48 }}>

        {/* ── Header card ── */}
        <SectionCard style={{ borderTop: '2px solid var(--teal)' }}>
          {/* Identicon hero strip */}
          <div style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <ExperimentIdenticon
              experimentId={exp.id}
              category={rk}
              orgName={orgName}
              experimentNumber={1}
            />
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {exp.is_verified && (
                <span className="badge-verified">✓ BIOME VERIFIED</span>
              )}
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '1px',
                color: 'var(--teal-dark)',
                background: 'var(--teal-faint)',
                padding: '2px 6px',
                borderRadius: 4,
              }}>
                {exp.category}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '1px',
                color: 'var(--muted)',
                background: 'var(--bg-page)',
                border: '1px solid var(--border-soft)',
                padding: '2px 6px',
                borderRadius: 4,
              }}>
                Interventional
              </span>
              {Boolean(expRaw.experiment_code) && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--muted)',
                  border: '1px solid var(--border-soft)',
                  background: 'var(--bg-page)',
                  padding: '3px 8px',
                  letterSpacing: '1px',
                  borderRadius: 999,
                }}>
                  {expRaw.experiment_code as string}
                </span>
              )}
              <StatusPill status={exp.status} />
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 700, color: 'var(--ink)',
              lineHeight: 1.15, marginBottom: 8,
            }}>
              {exp.title}
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)',
              margin: 0,
            }}>
              by <span style={{ color: 'var(--slate)', fontWeight: 500 }}>{orgName}</span>
              {orgProfile && (
                <>
                  {' '}·{' '}
                  <Link href={`/org/${orgProfile.id}`} style={{ color: 'var(--teal-dark)', textDecoration: 'none' }}>
                    View org →
                  </Link>
                </>
              )}
            </p>
          </div>
        </SectionCard>

        {/* ── 4-cell stat row ── */}
        <SectionCard>
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {/* Reimbursement — not disclosed until the participant asks */}
            <div className="border-r border-b sm:border-b-0" style={{ padding: '20px 24px', borderColor: 'var(--border-soft)' }}>
              <ReimbursementReveal amount={exp.bounty_per_participant} />
            </div>

            {/* Duration (replaces the bounty-pool money disclosure) */}
            <div className="border-b sm:border-b-0 sm:border-r" style={{ padding: '20px 24px', borderColor: 'var(--border-soft)' }}>
              <p style={FIELD_LABEL}>Duration</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>
                {exp.duration_weeks ? `${exp.duration_weeks} wks` : '—'}
              </p>
            </div>

            {/* Enrolled */}
            <div className="border-r" style={{ padding: '20px 24px', borderColor: 'var(--border-soft)' }}>
              <p style={FIELD_LABEL}>Enrolled</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>
                {exp.slots_filled}/{exp.slots_total}
              </p>
              <div style={{ width: '100%', height: 4, background: 'var(--border-soft)', marginTop: 8, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: 4, width: `${slotPct}%`, background: 'var(--teal)', borderRadius: 2 }} />
              </div>
            </div>

            {/* Compliance */}
            <div style={{ padding: '20px 24px' }}>
              <p style={FIELD_LABEL}>Compliance</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>
                {threshold}%
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>min. threshold</p>
            </div>
          </div>
        </SectionCard>

        {/* ── Description ── */}
        <SectionCard>
          <SectionLabel>Description</SectionLabel>
          <div style={{ padding: '24px', maxWidth: 760 }}>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate)',
              lineHeight: 1.75, margin: 0,
            }}>
              {exp.description}
            </p>
            {exp.tests_needed && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-soft)' }}>
                <p style={{ ...FIELD_LABEL, letterSpacing: '2px', fontSize: 10, marginBottom: 10 }}>
                  What you&apos;ll need to do
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate)', lineHeight: 1.75, margin: 0 }}>
                  {exp.tests_needed}
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── Protocol ── */}
        {milestones.length > 0 && (
          <SectionCard>
            <SectionLabel>Protocol</SectionLabel>
            <div style={{ padding: '24px' }}>
              <MilestoneTimeline milestones={milestones} />
            </div>
          </SectionCard>
        )}

        {/* ── Eligibility ── */}
        {(inclusion ?? exclusion) && (
          <SectionCard>
            <SectionLabel>Eligibility</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 32, padding: '24px' }}>
              {/* LEFT: WHO IS ELIGIBLE */}
              <div>
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '2px',
                  textTransform: 'uppercase', color: 'var(--success)', marginBottom: 12,
                }}>
                  Who is eligible
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {inclusion ? inclusion.map((line, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)' }}>{line}</span>
                    </div>
                  )) : (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)' }}>Open to all eligible adults.</span>
                  )}
                </div>
              </div>
              {/* RIGHT: WHO IS NOT ELIGIBLE */}
              <div>
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '2px',
                  textTransform: 'uppercase', color: 'var(--error)', marginBottom: 12,
                }}>
                  Who is not eligible
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {exclusion ? exclusion.map((line, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--error)', flexShrink: 0 }}>✕</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)' }}>{line}</span>
                    </div>
                  )) : (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)' }}>No specific exclusions listed.</span>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── What is collected ── */}
        {(() => {
          const inputsVal   = deriveInputs(exp.category);
          const devicesVal  = deriveDevices(exp.inclusion_criteria ?? null, exp.is_remote);
          const sampleVal   = deriveSample(exp.inclusion_criteria ?? null, exp.category);
          const visitsVal   = deriveVisits(exp.is_remote, exp.region ?? null);

          const fields: { label: string; value: string }[] = [
            { label: 'Format',             value: exp.is_remote ? 'Remote' : (exp.region ?? 'In-person') },
            { label: 'Duration',           value: durWks ? `~${durWks} weeks` : '—'                     },
            { label: 'Compliance minimum', value: `${threshold}%`                                        },
            { label: 'Inputs',             value: inputsVal                                               },
            { label: 'Devices / tools',    value: devicesVal                                              },
            { label: 'Sample type',        value: sampleVal                                               },
            { label: 'Visits',             value: visitsVal                                               },
          ];

          return (
            <SectionCard>
              <SectionLabel>
                <span>What is collected</span>
                {daysLeft !== null && daysLeft > 0 && (
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
                    letterSpacing: 0, textTransform: 'none',
                    color: daysLeft <= 14 ? 'var(--warning)' : 'var(--muted)',
                    border: `1px solid ${daysLeft <= 14 ? 'rgba(180,83,9,0.25)' : 'var(--border-soft)'}`,
                    background: daysLeft <= 14 ? 'var(--warning-soft)' : 'var(--surface)',
                    padding: '2px 8px',
                    borderRadius: 999,
                  }}>
                    Applications close in {daysLeft}d
                    {' · '}
                    {new Date(deadline!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {daysLeft !== null && daysLeft <= 0 && (
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
                    letterSpacing: 0, textTransform: 'none', color: 'var(--muted)',
                    border: '1px solid var(--border-soft)', background: 'var(--surface)',
                    padding: '2px 8px', borderRadius: 999,
                  }}>
                    Applications closed
                  </span>
                )}
              </SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 32px', padding: '24px' }}>
                {fields.map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ ...FIELD_LABEL, marginBottom: 5 }}>{label}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', margin: 0 }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          );
        })()}

        {/* ── Q&A ── */}
        <SectionCard>
          <SectionLabel>Questions</SectionLabel>
          <div style={{ padding: '24px' }}>
            <QASection
              experimentId={exp.id}
              experimenterUserId={exp.experimenter_id}
              orgName={orgProfile?.org_name ?? null}
              initialQuestions={questions}
            />
          </div>
        </SectionCard>

        {/* ── CTA (desktop) ── */}
        <div className="sticky-cta-desktop">
          <SectionCard>
            <div style={{ padding: '20px 24px' }}>
              <ExperimentCTA
                experimentId={exp.id}
                experimentStatus={exp.status}
                slotsLeft={slotsLeft}
                deadlineClosed={deadlineClosed}
                hasIcf={hasIcf}
              />
            </div>
          </SectionCard>
        </div>
        {/* Sticky mobile CTA */}
        <div className="sticky-cta-mobile">
          <ExperimentCTA
            experimentId={exp.id}
            experimentStatus={exp.status}
            slotsLeft={slotsLeft}
            deadlineClosed={deadlineClosed}
            hasIcf={hasIcf}
          />
        </div>

        {/* Amendment log */}
        {exp.amendment_log && exp.amendment_log.length > 0 && (
          <SectionCard>
            <SectionLabel>Amendments</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '20px 24px' }}>
              {[...exp.amendment_log].reverse().map((a, i) => (
                <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                    {new Date(a.ts).toLocaleDateString()}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    background: 'var(--teal-faint)', border: '1px solid var(--border-soft)',
                    color: 'var(--teal-dark)', padding: '2px 6px',
                    borderRadius: 999,
                  }}>
                    {a.field}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                    changed from{' '}
                    <span style={{ color: 'var(--warning)' }}>{a.old_value || '—'}</span>
                    {' to '}
                    <span style={{ color: 'var(--ink)' }}>{a.new_value || '—'}</span>
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

      </div>
    </main>
  );
}
