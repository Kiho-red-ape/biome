import { createAnonClient } from '@/lib/supabase/anon';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Experiment, ExperimentStatus, AmendmentEntry } from '@/lib/types';
import { QASection } from '@/components/qa/qa-section';
import type { Question, QAComment } from '@/components/qa/qa-section';
import { DraftBanner } from '@/components/experiments/draft-banner';
import { ExperimentIdenticon } from '@/components/ui/experiment-identicon';

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
  microbiome: '#b7ff61', nutrition: '#8ee7ff', sleep: '#ffd166',
  wearables: '#ff8f8f', longevity: '#d8c4ff', 'quantified-self': '#88bbff',
};
function catColor(cat: string): string { return CAT_COLORS[rampKey(cat)] ?? '#b7ff61'; }

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string; bg: string; border: string }> = {
  recruiting: { label: 'RECRUITING', color: '#b7ff61', bg: 'rgba(183,255,97,0.08)', border: '1px solid rgba(183,255,97,0.3)' },
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
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#aab8b1' }}>{m.title}</span>
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
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        height: 52, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        background: 'rgba(5,7,9,0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(183,255,97,0.12)',
      }}>
        <Link href="/experiments" className="hover-green" style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '2px',
        }}>
          ← Back to experiments
        </Link>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px', color: '#4a7055' }}>
          // EXPERIMENT_DETAIL
        </span>
      </header>

      {exp.status === 'draft' && (
        <DraftBanner experimentId={exp.id} experimenterUserId={exp.experimenter_id} />
      )}

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px' }}>

        {/* ── Identicon banner (120px) ── */}
        <div style={{ marginTop: 0 }}>
          <ThickDivider color={cc} />
          <ExperimentIdenticon
            experimentId={exp.id}
            category={rk}
            orgName={orgName}
            experimentNumber={1}
            width="100%"
            height={120}
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
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
          padding: '20px 0',
        }}>
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
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
          padding: '20px 0',
        }}>
          {/* Reward per participant */}
          <div style={{ paddingRight: 24, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a7055', marginBottom: 6 }}>
              REWARD
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, color: '#b7ff61', margin: 0, lineHeight: 1 }}>
              ${exp.bounty_per_participant.toFixed(0)}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a7055', marginTop: 4 }}>per participant</p>
          </div>

          {/* Pool */}
          <div style={{ paddingLeft: 24, paddingRight: 24, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a7055', marginBottom: 6 }}>
              POOL
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600, color: '#aab8b1', margin: 0, lineHeight: 1 }}>
              ${exp.total_bounty_pool.toLocaleString()}
            </p>
          </div>

          {/* Enrolled */}
          <div style={{ paddingLeft: 24, paddingRight: 24, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#4a7055', marginBottom: 6 }}>
              ENROLLED
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600, color: '#aab8b1', margin: 0, lineHeight: 1 }}>
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
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600, color: '#aab8b1', margin: 0, lineHeight: 1 }}>
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
            fontFamily: 'var(--font-heading)', fontSize: 15, color: '#aab8b1',
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
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: '#aab8b1', lineHeight: 1.75 }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                {inclusion && (
                  <div>
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px',
                      textTransform: 'uppercase', color: '#b7ff61', marginBottom: 12,
                    }}>
                      INCLUSION
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {inclusion.map((line, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8 }}>
                          <span style={{ color: '#b7ff61', flexShrink: 0 }}>✓</span>
                          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#aab8b1' }}>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {exclusion && (
                  <div>
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px',
                      textTransform: 'uppercase', color: '#ff8f8f', marginBottom: 12,
                    }}>
                      EXCLUSION
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {exclusion.map((line, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8 }}>
                          <span style={{ color: '#ff8f8f', flexShrink: 0 }}>✕</span>
                          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#aab8b1' }}>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <ThickDivider color={cc} />
          </>
        )}

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

        {/* ── CTA button ── */}
        <div style={{ padding: '28px 0 48px' }}>
          {exp.status === 'recruiting' && (
            <button className="cta-apply-btn">
              Apply to this study → ({slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} remaining)
            </button>
          )}
          {exp.status === 'active' && (
            <button
              style={{
                width: '100%', height: 48,
                fontFamily: 'var(--font-mono)', fontWeight: 700,
                fontSize: 13, textTransform: 'uppercase', letterSpacing: '3px',
                background: 'rgba(142,231,255,0.1)', color: '#8ee7ff',
                border: '1px solid rgba(142,231,255,0.25)', cursor: 'default', borderRadius: 2,
              }}
            >
              Join waitlist →
            </button>
          )}
          {(exp.status === 'completed' || exp.status === 'cancelled') && (
            <div
              style={{
                width: '100%', height: 48,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 13,
                textTransform: 'uppercase', letterSpacing: '3px',
                color: '#4a7055',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 2,
              }}
            >
              Enrollment closed
            </div>
          )}
        </div>

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
                    background: 'rgba(183,255,97,0.06)', border: '1px solid rgba(183,255,97,0.1)',
                    color: '#b7ff61', padding: '2px 6px',
                  }}>
                    {a.field}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055' }}>
                    changed from{' '}
                    <span style={{ color: '#ffd166' }}>{a.old_value || '—'}</span>
                    {' to '}
                    <span style={{ color: '#aab8b1' }}>{a.new_value || '—'}</span>
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
