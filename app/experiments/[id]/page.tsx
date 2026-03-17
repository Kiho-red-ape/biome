import { createAnonClient } from '@/lib/supabase/anon';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Experiment, ExperimentStatus, Comment } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string }> = {
  recruiting: { label: 'RECRUITING', color: 'var(--green)'    },
  active:     { label: 'ACTIVE',     color: 'var(--cyan)'     },
  draft:      { label: 'DRAFT',      color: 'var(--text-dim)' },
  completed:  { label: 'COMPLETED',  color: 'var(--text-dim)' },
  cancelled:  { label: 'CANCELLED',  color: 'var(--amber)'    },
};

type ParticipantMeta = { participant_id: string; pseudonym: string };

type CommentWithProfile = Comment & {
  profiles: {
    display_name: string | null;
    region: string | null;
    // participant_profiles is an array in Supabase nested select (1-to-many FK direction)
    participant_profiles: ParticipantMeta[] | null;
  } | null;
};

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

const HANDLE_COLORS = [
  'var(--green)', 'var(--cyan)', 'var(--amber)', '#a78bfa', '#f97316', '#34d399',
];
function handleColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return HANDLE_COLORS[h % HANDLE_COLORS.length];
}

function criteriaList(text: string | null) {
  if (!text) return null;
  return text.split('\n').map((line) => line.trim()).filter(Boolean);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ExperimentPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAnonClient();

  const [expResult, commentsResult] = await Promise.all([
    supabase
      .from('experiments')
      .select('*, profiles!experimenter_id(*)')
      .eq('id', id)
      .single(),
    supabase
      .from('comments')
      .select('*, profiles!author_id(display_name, region, participant_profiles(participant_id, pseudonym))')
      .eq('experiment_id', id)
      .order('upvotes', { ascending: false }),
  ]);

  if (!expResult.data) notFound();

  const exp = expResult.data as Experiment & {
    profiles: { display_name: string | null; bio: string | null; region: string | null } | null;
  };
  const allComments = (commentsResult.data ?? []) as CommentWithProfile[];
  const topLevel = allComments.filter((c) => !c.parent_id);
  const repliesFor = (parentId: string) =>
    allComments.filter((c) => c.parent_id === parentId);

  const st = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.draft;
  const slotPct = exp.slots_total > 0 ? (exp.slots_filled / exp.slots_total) * 100 : 0;
  const slotsLeft = exp.slots_total - exp.slots_filled;
  const inclusion = criteriaList(exp.inclusion_criteria);
  const exclusion = criteriaList(exp.exclusion_criteria);

  return (
    <main className="min-h-screen">

      {/* ── Top nav ── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{ background: 'rgba(7,12,7,0.92)', borderBottom: '1px solid rgba(77,255,128,0.08)', backdropFilter: 'blur(12px)' }}
      >
        <Link href="/" className="mono text-xs flex items-center gap-2 no-underline" style={{ color: 'var(--text-dim)' }}>
          ← <span style={{ color: 'var(--green)', fontWeight: 800, letterSpacing: '0.18em' }}>BIOME</span>
        </Link>
        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// EXPERIMENT_DETAIL</span>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">

        {/* ── Breadcrumb ── */}
        <p className="mono text-xs mb-5" style={{ color: 'var(--text-dim)' }}>
          <Link href="/" style={{ color: 'var(--text-dim)' }}>BIOME</Link>
          {' / '}
          <span style={{ color: 'var(--text-bright)' }}>{exp.title}</span>
        </p>

        {/* ── Title block ── */}
        <div className="corner-bracket p-6 rounded mb-8" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="mono text-xs px-2 py-0.5 rounded"
              style={{ color: 'var(--text-dim)', border: '1px solid rgba(77,255,128,0.1)' }}>
              {exp.category.toUpperCase()}
            </span>
            {exp.is_verified && <span className="badge-verified">✓ BIOME VERIFIED</span>}
            <span className="mono text-xs flex items-center gap-1" style={{ color: st.color }}>
              ● {st.label}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl mb-2">{exp.title}</h1>
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            by {exp.profiles?.display_name ?? 'Unknown'} · {exp.is_remote ? 'Remote' : (exp.region ?? 'In-person')}
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid md:grid-cols-3 gap-8">

          {/* ════════════════════════════════════════
              LEFT PANEL — experiment detail
          ════════════════════════════════════════ */}
          <div className="md:col-span-2 flex flex-col gap-6">

            {/* Who's running this */}
            <section className="p-6 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
              <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// WHO&apos;S RUNNING THIS</p>
              <p className="font-semibold mb-1" style={{ color: 'var(--text-white)' }}>
                {exp.profiles?.display_name ?? 'Unknown'}
              </p>
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
            <section className="p-6 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
              <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// ABOUT THIS EXPERIMENT</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)' }}>
                {exp.description}
              </p>
            </section>

            {/* What you'll do */}
            {exp.tests_needed && (
              <section className="p-6 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
                <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// WHAT YOU&apos;LL NEED TO DO</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)' }}>
                  {exp.tests_needed}
                </p>
              </section>
            )}

            {/* Inclusion criteria */}
            {inclusion && (
              <section className="p-6 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
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

            {/* Exclusion criteria */}
            {exclusion && (
              <section className="p-6 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
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

            {/* Ethics & Approval */}
            {exp.iec_approval && (
              <section className="p-6 rounded" style={{ background: 'rgba(77,255,128,0.02)', border: '1px solid rgba(77,255,128,0.1)' }}>
                <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// ETHICS &amp; APPROVAL</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)' }}>
                  {exp.iec_approval}
                </p>
              </section>
            )}

            {/* Eligibility + Sign up CTA */}
            {exp.status === 'recruiting' && (
              <section className="p-6 rounded" style={{ background: 'rgba(77,255,128,0.04)', border: '1px solid var(--green-dim)' }}>
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
                    style={{ background: 'var(--green)', color: 'var(--bg)' }}>
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

          {/* ════════════════════════════════════════
              RIGHT PANEL — stats + discussion
          ════════════════════════════════════════ */}
          <div className="flex flex-col gap-5">

            {/* Reward */}
            <div className="p-5 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
              <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>BOUNTY / PARTICIPANT</p>
              <p className="text-3xl font-black mono" style={{ color: 'var(--green)' }}>
                ${exp.bounty_per_participant.toFixed(0)}
              </p>
              <p className="mono text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
                Total pool: ${exp.total_bounty_pool.toLocaleString()}
              </p>
            </div>

            {/* Slots */}
            <div className="p-5 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
              <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>SLOTS</p>
              <div className="w-full h-1.5 rounded overflow-hidden mb-2" style={{ background: 'rgba(77,255,128,0.08)' }}>
                <div className="h-1.5 rounded" style={{ width: `${slotPct}%`, background: slotPct >= 90 ? 'var(--amber)' : 'var(--green-dim)' }} />
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
              <div className="p-5 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
                <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>DURATION</p>
                <p className="mono text-lg font-black" style={{ color: 'var(--text-bright)' }}>
                  {exp.duration_weeks} weeks
                </p>
              </div>
            )}

            {/* ─── Discussion ─────────────────────────────────── */}
            <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(77,255,128,0.06)' }}>
              <div className="px-4 py-3" style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
                <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                  // DISCUSSION
                  <span className="ml-2" style={{ color: 'var(--green)' }}>[{allComments.length}]</span>
                </p>
              </div>

              {allComments.length === 0 ? (
                <div className="px-4 py-8 text-center" style={{ background: 'var(--bg)' }}>
                  <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                    No comments yet. Be the first.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y" style={{ background: 'var(--bg)', borderColor: 'rgba(77,255,128,0.04)' }}>
                  {topLevel.map((comment) => (
                    <CommentThread
                      key={comment.id}
                      comment={comment}
                      replies={repliesFor(comment.id)}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Comment components ───────────────────────────────────────────────────────

function CommentBubble({ comment, indent = false }: { comment: CommentWithProfile; indent?: boolean }) {
  // Prefer pseudonym (participant) over display_name (experimenter / anon)
  const pp          = comment.profiles?.participant_profiles?.[0] ?? null;
  const displayName = pp?.pseudonym ?? comment.profiles?.display_name ?? 'anon';
  const profileHref = pp ? `/profile/${pp.participant_id}` : null;
  const region      = comment.profiles?.region;
  const color       = handleColor(displayName);

  return (
    <div
      className="px-4 py-3"
      style={{
        background: indent ? 'rgba(77,255,128,0.015)' : 'transparent',
        borderLeft: indent ? '2px solid rgba(77,255,128,0.12)' : 'none',
        marginLeft: indent ? '12px' : '0',
      }}
    >
      {/* Meta row */}
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        {profileHref ? (
          <Link href={profileHref} className="mono text-xs font-bold no-underline hover:underline" style={{ color }}>
            {displayName}
          </Link>
        ) : (
          <span className="mono text-xs font-bold" style={{ color }}>{displayName}</span>
        )}
        {region && (
          <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{region}</span>
        )}
        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
          · {relativeTime(comment.created_at)}
        </span>
        <span className="mono text-xs ml-auto flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
          <span style={{ color: 'var(--green)', fontSize: '10px' }}>▲</span>
          {comment.upvotes}
        </span>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)', fontSize: '0.82rem' }}>
        {comment.content}
      </p>

      {/* Reply stub */}
      <button className="mono mt-2 transition-opacity hover:opacity-80" style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
        reply ↩
      </button>
    </div>
  );
}

function CommentThread({ comment, replies }: { comment: CommentWithProfile; replies: CommentWithProfile[] }) {
  return (
    <div>
      <CommentBubble comment={comment} />
      {replies.map((r) => (
        <CommentBubble key={r.id} comment={r} indent />
      ))}
    </div>
  );
}
