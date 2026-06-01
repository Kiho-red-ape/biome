import { createAnonClient } from '@/lib/supabase/anon';
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

const CAT_COLORS: Record<string, string> = {
  microbiome: '#f59e0b', nutrition: '#8ee7ff', sleep: '#ffd166',
  wearables: '#ff8f8f', longevity: '#d8c4ff', 'quantified-self': '#88bbff',
};
function catColor(cat: string): string { return CAT_COLORS[rampKey(cat)] ?? '#f59e0b'; }

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string; bg: string; border: string }> = {
  recruiting: { label: 'RECRUITING', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' },
  active:     { label: 'ACTIVE',     color: '#8ee7ff', bg: 'rgba(142,231,255,0.08)', border: '1px solid rgba(142,231,255,0.25)' },
  draft:      { label: 'DRAFT',      color: '#7f8e87', bg: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' },
  completed:  { label: 'COMPLETED',  color: '#7f8e87', bg: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' },
  cancelled:  { label: 'CANCELLED',  color: '#ffd166', bg: 'rgba(255,209,102,0.06)', border: '1px solid rgba(255,209,102,0.2)' },
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

// ─── Section divider ───────────────────────────────────────────────────────────

function ThickDivider({ color }: { color: string }) {
  return (
    <div style={{ height: 2, background: color, opacity: 0.25, margin: '0' }} />
  );
}
function ThinDivider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />;
}

// ─── Milestone timeline ───────────────────────────────────────────────────────

function MilestoneTimeline({ milestones, catColor: cc }: { milestones: StudyMilestone[]; catColor: string }) {
  if (milestones.length === 0) return null;

  const byWeek: Record<number, StudyMilestone[]> = {};
  for (const m of milestones) {
    if (!byWeek[m.week_number]) byWeek[m.week_number] = [];
    byWeek[m.week_number].push(m);
  }
  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b);

  return (
    <div style={{ padding: '24px 0' }}>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        letterSpacing: '3px', textTransform: 'uppercase',
        color: cc, marginBottom: 20,
      }}>
        // PROTOCOL
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {weeks.map((week, wi) => (
          <div key={week} style={{ display: 'flex', gap: 16 }}>
            {/* Spine */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: cc, flexShrink: 0 }} />
              {wi < weeks.length - 1 && (
                <div style={{ width: 1, flex: 1, background: `${cc}30`, marginTop: 4, minHeight: 20 }} />
              )}
            </div>
            {/* Content */}
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
                color: cc, marginBottom: 8, letterSpacing: '1px',
              }}>
                WEEK {week}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {byWeek[week].sort((a, b) => a.sort_order - b.sort_order).map((m) => (
                  <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#4a7055', flexShrink: 0, marginTop: 1 }}>○</span>
                    <div>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#94a3b8' }}>{m.title}</span>
                      {m.description && (
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', marginTop: 2 }}>{m.description}</p>
                      )}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', opacity: 0.7 }}>
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

  const st          = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.draft;
  const cc          = catColor(exp.category);
  const rk          = rampKey(exp.category);
  const slotPct     = exp.slots_total > 0 ? (exp.slots_filled / exp.slots_total) * 100 : 0;
  const slotsLeft   = exp.slots_total - exp.slots_filled;
  const inclusion   = criteriaList(exp.inclusion_criteria);
  const exclusion   = criteriaList(exp.exclusion_criteria);
  const threshold   = exp.compliance_threshold ?? 80;
  const orgName     = orgProfile?.org_name ?? exp.profiles?.display_name ?? 'Unknown';
  const durWks      = (exp as unknown as Record<string, unknown>).duration_weeks as number | null;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Sticky mini nav ── */}
      <header className="px-4 sm:px-10" style={{
        position: 'sticky', top: 0, zIndex: 200,
        height: 52, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(5,7,9,0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(245,158,11,0.12)',
      }}>
        <Link href="/experiments" className="hover-green" style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '2px',
        }}>
          ← Back to studies
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="hidden sm:inline" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px', color: '#4a7055' }}>
            // STUDY_DETAIL
          </span>
          {exp.status === 'recruiting' && slotsLeft > 0 && (
            <Link
              href={`/experiments/${exp.id}/apply`}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '1.5px',
                fontWeight: 700, color: '#070c07',
                background: '#f59e0b',
                padding: '7px 16px',
                textDecoration: 'none',
                borderRadius: 2,
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

      <div className="px-4 sm:px-10 has-sticky-cta" style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Identicon strip (auto-height) ── */}
        <div style={{ marginTop: 0 }}>
          <ThickDivider color={cc} />
          <ExperimentIdenticon
            experimentId={exp.id}
            category={rk}
            orgName={orgName}
            experimentNumber={1}
          />
          <ThickDivider color={cc} />
        </div>

        {/* ── Title block ── */}
        <div style={{ padding: '24px 0 0' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {exp.is_verified && (
              <span className="badge-verified">✓ BIOME VERIFIED</span>
            )}
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              textTransform: 'uppercase', letterSpacing: '2px',
              color: cc,
              border: `1px solid ${cc}40`,
              background: `${cc}0a`,
              padding: '3px 8px',
            }}>
              {exp.category.toUpperCase()}
            </span>
            {Boolean((exp as unknown as Record<string, unknown>).experiment_code) && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: '#4a7055',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
                padding: '3px 8px',
                letterSpacing: '1px',
              }}>
                {(exp as unknown as Record<string, unknown>).experiment_code as string}
              </span>
            )}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 700, color: '#eef4f0',
            lineHeight: 1.15, marginBottom: 8,
          }}>
            {exp.title}
          </h1>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a7055',
            letterSpacing: '0.5px',
          }}>
            by {orgName}
            {orgProfile && (
              <>
                {' '}·{' '}
                <Link href={`/org/${orgProfile.id}`} style={{ color: '#7f8e87', textDecoration: 'none' }}>
                  View org →
                </Link>
              </>
            )}
          </p>
        </div>

        <ThinDivider />

        {/* ── 4-col metadata grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 0, padding: '20px 0' }}>
          {[
            { label: 'CATEGORY', value: exp.category.toUpperCase() },
            { label: 'TYPE', value: 'INTERVENTIONAL' },
            { label: 'DURATION', value: durWks ? `${durWks} WEEKS` : '—' },
            { label: 'STATUS', value: null, status: st },
          ].map((item, i) => (
            <div key={i} style={{
              paddingRight: 24,
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              paddingLeft: i > 0 ? 24 : 0,
            }}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                textTransform: 'uppercase', letterSpacing: '2px',
                color: '#4a7055', marginBottom: 6,
              }}>
                {item.label}
              </p>
              {item.status ? (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12,
                  padding: '4px 10px',
                  color: item.status.color,
                  background: item.status.bg,
                  border: item.status.border,
                  letterSpacing: '1px',
                }}>
                  ● {item.status.label}
                </span>
              ) : (
                <p style={{
                  fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 600,
                  color: '#eef4f0', margin: 0,
                }}>
                  {item.value}
                </p>
              )}
            </div>
          ))}
        </div>

        <ThinDivider />

        {/* ── Reward row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 0, padding: '20px 0' }}>
          {/* Reward per participant */}
          <div style={{ paddingRight: 24, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a7055', marginBottom: 6 }}>
              REWARD
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, color: '#f59e0b', margin: 0, lineHeight: 1 }}>
              ${exp.bounty_per_participant.toFixed(0)}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a7055', marginTop: 4 }}>per participant</p>
          </div>

          {/* Pool */}
          <div style={{ paddingLeft: 24, paddingRight: 24, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a7055', marginBottom: 6 }}>
              POOL
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600, color: '#94a3b8', margin: 0, lineHeight: 1 }}>
              ${exp.total_bounty_pool.toLocaleString()}
            </p>
          </div>

          {/* Enrolled */}
          <div style={{ paddingLeft: 24, paddingRight: 24, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a7055', marginBottom: 6 }}>
              ENROLLED
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600, color: '#94a3b8', margin: 0, lineHeight: 1 }}>
              {exp.slots_filled}/{exp.slots_total}
            </p>
            <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', marginTop: 6 }}>
              <div style={{ height: 3, width: `${slotPct}%`, background: cc }} />
            </div>
          </div>

          {/* Compliance */}
          <div style={{ paddingLeft: 24 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a7055', marginBottom: 6 }}>
              COMPLIANCE
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600, color: '#94a3b8', margin: 0, lineHeight: 1 }}>
              {threshold}%
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a7055', marginTop: 4 }}>min. threshold</p>
          </div>
        </div>

        <ThickDivider color={cc} />

        {/* ── Description ── */}
        <div style={{ padding: '28px 0', maxWidth: 800 }}>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
            textTransform: 'uppercase', color: cc, marginBottom: 16,
          }}>
            // DESCRIPTION
          </p>
          <p style={{
            fontFamily: 'var(--font-heading)', fontSize: 15, color: '#94a3b8',
            lineHeight: 1.75,
          }}>
            {exp.description}
          </p>
          {exp.tests_needed && (
            <div style={{ marginTop: 20 }}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px',
                textTransform: 'uppercase', color: '#4a7055', marginBottom: 10,
              }}>
                What you&apos;ll need to do
              </p>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: '#94a3b8', lineHeight: 1.75 }}>
                {exp.tests_needed}
              </p>
            </div>
          )}
        </div>

        <ThickDivider color={cc} />

        {/* ── Protocol ── */}
        {milestones.length > 0 && (
          <>
            <MilestoneTimeline milestones={milestones} catColor={cc} />
            <ThickDivider color={cc} />
          </>
        )}

        {/* ── Eligibility ── */}
        {(inclusion ?? exclusion) && (
          <>
            <div style={{ padding: '28px 0' }}>
              <p style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
                textTransform: 'uppercase', color: cc, marginBottom: 20,
              }}>
                // ELIGIBILITY
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 32 }}>
                {/* LEFT: WHO IS ELIGIBLE */}
                <div>
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px',
                    textTransform: 'uppercase', color: '#f59e0b', marginBottom: 12,
                  }}>
                    WHO IS ELIGIBLE
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {inclusion ? inclusion.map((line, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: '#f59e0b', flexShrink: 0 }}>✓</span>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#94a3b8' }}>{line}</span>
                      </div>
                    )) : (
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#4a7055' }}>Open to all eligible adults.</span>
                    )}
                  </div>
                </div>
                {/* RIGHT: WHO IS NOT ELIGIBLE */}
                <div>
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px',
                    textTransform: 'uppercase', color: '#ff8f8f', marginBottom: 12,
                  }}>
                    WHO IS NOT ELIGIBLE
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {exclusion ? exclusion.map((line, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: '#ff8f8f', flexShrink: 0 }}>✕</span>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#94a3b8' }}>{line}</span>
                      </div>
                    )) : (
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#4a7055' }}>No specific exclusions listed.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <ThickDivider color={cc} />
          </>
        )}

        {/* ── What is collected ── */}
        {(() => {
          const expRaw    = exp as unknown as Record<string, unknown>;
          const deadline  = expRaw.application_deadline as string | null ?? null;
          const daysLeft  = deadline ? deadlineDays(deadline) : null;
          const inputsVal   = deriveInputs(exp.category);
          const devicesVal  = deriveDevices(exp.inclusion_criteria ?? null, exp.is_remote);
          const sampleVal   = deriveSample(exp.inclusion_criteria ?? null, exp.category);
          const visitsVal   = deriveVisits(exp.is_remote, exp.region ?? null);

          const fields: { label: string; value: string }[] = [
            { label: 'FORMAT',             value: exp.is_remote ? 'Remote' : (exp.region ?? 'In-person') },
            { label: 'DURATION',           value: durWks ? `~${durWks} weeks` : '—'                     },
            { label: 'COMPLIANCE MINIMUM', value: `${threshold}%`                                        },
            { label: 'INPUTS',             value: inputsVal                                               },
            { label: 'DEVICES / TOOLS',    value: devicesVal                                              },
            { label: 'SAMPLE TYPE',        value: sampleVal                                               },
            { label: 'VISITS',             value: visitsVal                                               },
          ];

          return (
            <div style={{ padding: '28px 0' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 16, marginBottom: 20 }}>
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
                  textTransform: 'uppercase', color: cc, margin: 0,
                }}>
                  // WHAT IS COLLECTED
                </p>
                {daysLeft !== null && daysLeft > 0 && (
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: daysLeft <= 14 ? '#ffb300' : '#4a7055',
                    border: `1px solid ${daysLeft <= 14 ? 'rgba(255,179,0,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    background: daysLeft <= 14 ? 'rgba(255,179,0,0.05)' : 'transparent',
                    padding: '2px 8px',
                  }}>
                    Applications close in {daysLeft}d
                    {' · '}
                    {new Date(deadline!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {daysLeft !== null && daysLeft <= 0 && (
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: '#7f8e87',
                    border: '1px solid rgba(255,255,255,0.07)', padding: '2px 8px',
                  }}>
                    Applications closed
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px 32px' }}>
                {fields.map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a7055', marginBottom: 5 }}>
                      {label}
                    </p>
                    <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#94a3b8', margin: 0 }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <ThickDivider color={cc} />

        {/* ── Q&A ── */}
        <div style={{ padding: '28px 0' }}>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '3px',
            textTransform: 'uppercase', color: cc, marginBottom: 20,
          }}>
            // QUESTIONS
          </p>
          <QASection
            experimentId={exp.id}
            experimenterUserId={exp.experimenter_id}
            orgName={orgProfile?.org_name ?? null}
            initialQuestions={questions}
          />
        </div>

        <ThickDivider color={cc} />

        {/* ── CTA button (desktop) ── */}
        {(() => {
          const expRaw         = exp as unknown as Record<string, unknown>;
          const deadline       = expRaw.application_deadline as string | null ?? null;
          const deadlineClosed = deadline ? deadlineDays(deadline) <= 0 : false;
          return (
            <>
              <div className="sticky-cta-desktop" style={{ padding: '28px 0 48px' }}>
                <ExperimentCTA
                  experimentId={exp.id}
                  experimentStatus={exp.status}
                  slotsLeft={slotsLeft}
                  deadlineClosed={deadlineClosed}
                />
              </div>
              {/* Sticky mobile CTA */}
              <div className="sticky-cta-mobile">
                <ExperimentCTA
                  experimentId={exp.id}
                  experimentStatus={exp.status}
                  slotsLeft={slotsLeft}
                  deadlineClosed={deadlineClosed}
                />
              </div>
            </>
          );
        })()}

        {/* Amendment log */}
        {exp.amendment_log && exp.amendment_log.length > 0 && (
          <div style={{ paddingBottom: 48 }}>
            <ThinDivider />
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px',
              textTransform: 'uppercase', color: '#4a7055',
              marginTop: 20, marginBottom: 12,
            }}>
              // AMENDMENTS
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...exp.amendment_log].reverse().map((a, i) => (
                <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055' }}>
                    {new Date(a.ts).toLocaleDateString()}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.1)',
                    color: '#f59e0b', padding: '2px 6px',
                  }}>
                    {a.field}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055' }}>
                    changed from{' '}
                    <span style={{ color: '#ffd166' }}>{a.old_value || '—'}</span>
                    {' to '}
                    <span style={{ color: '#94a3b8' }}>{a.new_value || '—'}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
