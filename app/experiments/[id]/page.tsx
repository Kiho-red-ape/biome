import { createAnonClient } from '@/lib/supabase/anon';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Experiment, ExperimentStatus, AmendmentEntry } from '@/lib/types';
import { QASection } from '@/components/qa/qa-section';
import type { Question, QAComment } from '@/components/qa/qa-section';
import { DraftBanner } from '@/components/experiments/draft-banner';

// ─── Types ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string }> = {
  recruiting: { label: 'RECRUITING', color: 'var(--green)'    },
  active:     { label: 'ACTIVE',     color: 'var(--cyan)'     },
  draft:      { label: 'DRAFT',      color: 'var(--text-dim)' },
  completed:  { label: 'COMPLETED',  color: 'var(--text-dim)' },
  cancelled:  { label: 'CANCELLED',  color: 'var(--amber)'    },
};

type StudyMilestone = {
  id:             string;
  week_number:    number;
  title:          string;
  description:    string | null;
  milestone_type: 'self_report' | 'experimenter_confirm';
  sort_order:     number;
};

interface Props {
  params: Promise<{ id: string }>;
}

function criteriaList(text: string | null) {
  if (!text) return null;
  return text.split('\n').map((line) => line.trim()).filter(Boolean);
}

function commencementLabel(status: string, commenced: boolean, commencedAt: string | null): string {
  if (status === 'completed') return 'Completed';
  if (status === 'active' && commenced && commencedAt) {
    return `Active — commenced ${new Date(commencedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  if (status === 'recruiting') return 'Screening participants';
  if (status === 'draft') return 'Draft';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function approvalBadgeColor(status: string): string {
  if (status === 'Ethics approved') return 'var(--green)';
  if (status === 'IRB pending')     return 'var(--amber)';
  return 'var(--text-dim)';
}

// ─── Milestone timeline ───────────────────────────────────────────────────────

function MilestoneTimeline({ milestones }: { milestones: StudyMilestone[] }) {
  if (milestones.length === 0) return null;

  // Group by week
  const byWeek: Record<number, StudyMilestone[]> = {};
  for (const m of milestones) {
    if (!byWeek[m.week_number]) byWeek[m.week_number] = [];
    byWeek[m.week_number].push(m);
  }
  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b);

  return (
    <section className="p-6 rounded"
      style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.1)' }}>
      <p className="mono text-xs mb-5" style={{ color: 'var(--text-dim)' }}>
        // STUDY_PROTOCOL — what participants complete each week
      </p>

      <div className="flex flex-col gap-5">
        {weeks.map((week, wi) => (
          <div key={week} className="flex gap-4">
            {/* Vertical timeline spine */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: 28 }}>
              {/* Week dot */}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                style={{ background: 'var(--green-dim)', border: '2px solid var(--green)' }}
              />
              {/* Spine (not on last week) */}
              {wi < weeks.length - 1 && (
                <div
                  className="flex-1 mt-1"
                  style={{ width: 1, background: 'rgba(77,255,128,0.18)', minHeight: 24 }}
                />
              )}
            </div>

            {/* Week content */}
            <div className="flex-1 min-w-0">
              <p className="mono text-xs font-bold mb-2" style={{ color: 'var(--green)' }}>
                WEEK {week}
              </p>
              <div className="flex flex-col gap-2">
                {byWeek[week].sort((a, b) => a.sort_order - b.sort_order).map((m) => (
                  <div key={m.id} className="flex items-start gap-2">
                    <span className="flex-shrink-0 mono text-xs mt-px" style={{ color: 'var(--text-dim)' }}>○</span>
                    <div className="min-w-0">
                      <span className="text-sm" style={{ color: 'var(--text-bright)' }}>{m.title}</span>
                      {m.description && (
                        <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{m.description}</p>
                      )}
                      <span className="mono text-xs" style={{ color: 'var(--text-dim)', opacity: 0.6 }}>
                        {' '}({m.milestone_type === 'self_report' ? 'you report' : 'experimenter confirms'})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ExperimentPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAnonClient();

  const [expResult, commentsResult, milestonesResult] = await Promise.all([
    supabase
      .from('experiments')
      .select('*, profiles!experimenter_id(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('comments')
      .select('*, profiles!author_id(display_name, region, participant_profiles(participant_id, pseudonym))')
      .eq('experiment_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('study_milestones')
      .select('id, week_number, title, description, milestone_type, sort_order')
      .eq('experiment_id', id)
      .order('week_number')
      .order('sort_order'),
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

  // Fetch experimenter org profile
  const { data: orgData } = await supabase
    .from('experimenter_profiles')
    .select('id, org_name')
    .eq('user_id', exp.experimenter_id)
    .maybeSingle();
  const orgProfile = orgData as { id: string; org_name: string } | null;

  // Build Q&A structure
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

  const st             = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.draft;
  const slotPct        = exp.slots_total > 0 ? (exp.slots_filled / exp.slots_total) * 100 : 0;
  const slotsLeft      = exp.slots_total - exp.slots_filled;
  const inclusion      = criteriaList(exp.inclusion_criteria);
  const exclusion      = criteriaList(exp.exclusion_criteria);
  const threshold      = exp.compliance_threshold ?? 80;
  const approvalStatus = exp.iec_approval;
  const commLabel      = commencementLabel(exp.status, exp.commenced ?? false, exp.commenced_at ?? null);

  return (
    <main className="min-h-screen">

      {/* ── Top nav ── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{
          background: 'rgba(10,18,8,0.94)',
          borderBottom: '1px solid rgba(77,255,128,0.14)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Link href="/" className="mono text-xs flex items-center gap-2 no-underline"
          style={{ color: 'var(--text-dim)' }}>
          ← <span style={{ color: 'var(--green)', fontWeight: 800, letterSpacing: '0.18em' }}>BIOME</span>
        </Link>
        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// EXPERIMENT_DETAIL</span>
      </header>

      {exp.status === 'draft' && (
        <DraftBanner experimentId={exp.id} experimenterUserId={exp.experimenter_id} />
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">

        {/* ── Breadcrumb ── */}
        <p className="mono text-xs mb-5" style={{ color: 'var(--text-dim)' }}>
          <Link href="/" style={{ color: 'var(--text-dim)' }}>BIOME</Link>
          {' / '}
          <span style={{ color: 'var(--text-bright)' }}>{exp.title}</span>
        </p>

        {/* ── Title block ── */}
        <div className="corner-bracket p-6 rounded mb-8"
          style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.12)' }}>
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="mono text-xs px-2 py-0.5 rounded"
              style={{ color: 'var(--text-dim)', border: '1px solid rgba(77,255,128,0.15)' }}>
              {exp.category.toUpperCase()}
            </span>
            {exp.is_verified && <span className="badge-verified">✓ BIOME VERIFIED</span>}
            <span className="mono text-xs flex items-center gap-1" style={{ color: st.color }}>
              ● {st.label}
            </span>
            {/* Commencement status */}
            <span className="mono text-xs px-2 py-0.5 rounded"
              style={{
                color: exp.status === 'active' ? 'var(--cyan)' : 'var(--text-dim)',
                border: '1px solid rgba(77,255,128,0.1)',
                background: exp.status === 'active' ? 'rgba(0,229,255,0.05)' : 'transparent',
              }}>
              {commLabel}
            </span>
            {/* Approval badge */}
            {approvalStatus && (
              <span className="mono text-xs px-2 py-0.5 rounded"
                style={{
                  color: approvalBadgeColor(approvalStatus),
                  border: `1px solid ${approvalBadgeColor(approvalStatus)}40`,
                  background: `${approvalBadgeColor(approvalStatus)}08`,
                }}>
                {approvalStatus}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl mb-2">{exp.title}</h1>
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            by {orgProfile?.org_name ?? exp.profiles?.display_name ?? 'Unknown'}
            {' · '}{exp.is_remote ? 'Remote' : (exp.region ?? 'In-person')}
            {exp.duration_weeks ? ` · ${exp.duration_weeks} weeks` : ''}
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid md:grid-cols-3 gap-8">

          {/* ════ LEFT PANEL ════ */}
          <div className="md:col-span-2 flex flex-col gap-6">

            {/* Who's running this */}
            <section className="p-6 rounded"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
              <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// WHO&apos;S RUNNING THIS</p>
              <div className="flex items-start justify-between gap-3 mb-1">
                <p className="font-semibold" style={{ color: 'var(--text-white)' }}>
                  {orgProfile?.org_name ?? exp.profiles?.display_name ?? 'Unknown'}
                </p>
                {orgProfile && (
                  <Link href={`/org/${orgProfile.id}`}
                    className="mono text-xs no-underline transition-opacity hover:opacity-80 flex-shrink-0"
                    style={{ color: 'var(--cyan)' }}>
                    View org profile ↗
                  </Link>
                )}
              </div>
              {exp.profiles?.bio && (
                <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-dim)' }}>
                  {exp.profiles.bio}
                </p>
              )}
              {exp.profiles?.region && (
                <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                  Based in {exp.profiles.region}
                </p>
              )}
              {exp.external_comms_url && (
                <a href={exp.external_comms_url} target="_blank" rel="noopener noreferrer"
                  className="mono text-xs inline-flex items-center gap-1 mt-3 transition-opacity hover:opacity-80"
                  style={{ color: 'var(--cyan)' }}>
                  Community / Discord ↗
                </a>
              )}
            </section>

            {/* About */}
            <section className="p-6 rounded"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
              <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// ABOUT THIS STUDY</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)' }}>
                {exp.description}
              </p>
            </section>

            {/* What you'll need to do */}
            {exp.tests_needed && (
              <section className="p-6 rounded"
                style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
                <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// WHAT YOU&apos;LL NEED TO DO</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)' }}>
                  {exp.tests_needed}
                </p>
              </section>
            )}

            {/* ── Milestone timeline ── */}
            <MilestoneTimeline milestones={milestones} />

            {/* Inclusion */}
            {inclusion && (
              <section className="p-6 rounded"
                style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
                <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// WHO CAN JOIN</p>
                <ul className="flex flex-col gap-2">
                  {inclusion.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-bright)' }}>
                      <span className="flex-shrink-0 mt-0.5" style={{ color: 'var(--green)' }}>✓</span>
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Exclusion */}
            {exclusion && (
              <section className="p-6 rounded"
                style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
                <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// WHO CANNOT JOIN</p>
                <ul className="flex flex-col gap-2">
                  {exclusion.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-bright)' }}>
                      <span className="flex-shrink-0 mt-0.5" style={{ color: 'var(--amber)' }}>✕</span>
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Amendment log */}
            {exp.amendment_log && exp.amendment_log.length > 0 && (
              <section className="p-6 rounded"
                style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
                <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// AMENDMENTS</p>
                <div className="flex flex-col gap-2">
                  {[...exp.amendment_log].reverse().map((a, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="mono" style={{ color: 'var(--text-dim)' }}>
                        {new Date(a.ts).toLocaleDateString()}
                      </span>
                      <span className="mono px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(77,255,128,0.06)', border: '1px solid rgba(77,255,128,0.1)', color: 'var(--green)' }}>
                        {a.field}
                      </span>
                      <span className="mono" style={{ color: 'var(--text-dim)' }}>
                        changed from{' '}
                        <span style={{ color: 'var(--amber)' }}>{a.old_value || '—'}</span>
                        {' to '}
                        <span style={{ color: 'var(--text-bright)' }}>{a.new_value || '—'}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sign up CTA */}
            {exp.status === 'recruiting' && (
              <section className="p-6 rounded"
                style={{ background: 'rgba(77,255,128,0.04)', border: '1px solid var(--green-dim)' }}>
                <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// PARTICIPATE</p>
                <p className="text-sm mb-4" style={{ color: 'var(--text-bright)' }}>
                  Earn{' '}
                  <span className="font-bold" style={{ color: 'var(--green)' }}>
                    ${exp.bounty_per_participant.toFixed(2)}
                  </span>{' '}
                  upon completion. {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} remaining.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="px-5 py-2.5 rounded font-bold mono text-sm transition-all hover:opacity-90"
                    style={{ background: 'var(--green)', color: '#050709' }}>
                    SIGN UP →
                  </button>
                  <button
                    className="px-5 py-2.5 rounded font-bold mono text-sm transition-all hover:opacity-80"
                    style={{ border: '1px solid var(--green-dim)', color: 'var(--green)', background: 'transparent' }}>
                    CHECK ELIGIBILITY →
                  </button>
                </div>
                <p className="mono text-xs mt-3" style={{ color: 'var(--text-dim)' }}>
                  Auth required. Experimenter manually reviews each application.
                </p>
              </section>
            )}

          </div>

          {/* ════ RIGHT PANEL ════ */}
          <div className="flex flex-col gap-5">

            {/* Reward */}
            <div className="p-5 rounded"
              style={{
                background: 'var(--bg2)',
                border: '1px solid rgba(77,255,128,0.12)',
                borderTop: '2px solid var(--green)',
              }}>
              <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>BOUNTY / PARTICIPANT</p>
              <p className="text-3xl font-black mono" style={{ color: 'var(--green)' }}>
                ${exp.bounty_per_participant.toFixed(0)}
              </p>
              <p className="mono text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
                Total pool: ${exp.total_bounty_pool.toLocaleString()}
              </p>
              {/* Compliance threshold */}
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(77,255,128,0.08)' }}>
                <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                  Min. {threshold}% milestone completion for payout
                </p>
              </div>
            </div>

            {/* Slots */}
            <div className="p-5 rounded"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.1)' }}>
              <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>SLOTS</p>
              <div className="w-full h-1.5 rounded overflow-hidden mb-2"
                style={{ background: 'rgba(77,255,128,0.1)' }}>
                <div className="h-1.5 rounded"
                  style={{ width: `${slotPct}%`, background: slotPct >= 90 ? 'var(--amber)' : 'var(--green-dim)' }} />
              </div>
              <p className="mono text-sm tabular-nums" style={{ color: 'var(--text-bright)' }}>
                {exp.slots_filled} / {exp.slots_total}
              </p>
              <p className="mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                {slotsLeft > 0 ? `${slotsLeft} remaining` : 'FULL — no slots left'}
              </p>
            </div>

            {/* Duration */}
            {exp.duration_weeks && (
              <div className="p-5 rounded"
                style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.1)' }}>
                <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>DURATION</p>
                <p className="mono text-lg font-black" style={{ color: 'var(--text-bright)' }}>
                  {exp.duration_weeks} weeks
                </p>
                {milestones.length > 0 && (
                  <p className="mono text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                    {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* Q&A */}
            <QASection
              experimentId={exp.id}
              experimenterUserId={exp.experimenter_id}
              orgName={orgProfile?.org_name ?? null}
              initialQuestions={questions}
            />

          </div>
        </div>
      </div>
    </main>
  );
}
