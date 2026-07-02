'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { Identicon } from '@/components/identicon';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ParticipantMeta = { participant_id: string; pseudonym: string };

export type QAComment = {
  id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  profiles: {
    display_name: string | null;
    region: string | null;
    participant_profiles: ParticipantMeta[] | null;
  } | null;
};

export type Question = QAComment & { replies: QAComment[] };

interface Props {
  experimentId: string;
  experimenterUserId: string;
  orgName: string | null;
  initialQuestions: Question[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diffMs   = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0)  return 'today';
  if (diffDays === 1)  return '1d ago';
  if (diffDays < 30)   return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

// ─── Shared clinical styles ───────────────────────────────────────────────────

const TEXTAREA_STYLE: React.CSSProperties = {
  fontFamily:   'var(--font-body)',
  fontSize:     13,
  background:   'var(--surface)',
  border:       '1px solid var(--border-mid)',
  borderRadius: 'var(--radius-sm)',
  color:        'var(--ink)',
};

const BTN_PRIMARY: React.CSSProperties = {
  fontFamily:   'var(--font-body)',
  fontSize:     13,
  fontWeight:   600,
  padding:      '8px 16px',
  borderRadius: 'var(--radius-sm)',
  background:   'var(--teal)',
  border:       '1px solid var(--teal)',
  color:        '#ffffff',
  cursor:       'pointer',
};

const BTN_GHOST: React.CSSProperties = {
  fontFamily:   'var(--font-body)',
  fontSize:     13,
  fontWeight:   500,
  padding:      '8px 14px',
  borderRadius: 'var(--radius-sm)',
  background:   'var(--surface)',
  border:       '1px solid var(--border-mid)',
  color:        'var(--slate)',
  cursor:       'pointer',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function QASection({ experimentId, experimenterUserId, orgName, initialQuestions }: Props) {
  const { user, authenticated } = usePrivy();
  const isExperimenter = authenticated && !!user && user.id === experimenterUserId;

  const [questions,    setQuestions]    = useState<Question[]>(initialQuestions);
  const [questionText, setQuestionText] = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [replyTexts,   setReplyTexts]   = useState<Record<string, string>>({});
  const [replyingTo,   setReplyingTo]   = useState<string | null>(null);
  const [replyLoading, setReplyLoading] = useState<string | null>(null);

  async function submitQuestion() {
    if (!questionText.trim() || !authenticated || !user) return;
    setSubmitting(true);

    const res = await fetch('/api/comments', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ experimentId, authorId: user.id, content: questionText.trim() }),
    });

    if (res.ok) {
      const data = await res.json() as { comment: QAComment };
      setQuestions((prev) => [...prev, { ...data.comment, replies: [] }]);
      setQuestionText('');
    }
    setSubmitting(false);
  }

  async function submitReply(parentId: string) {
    const text = replyTexts[parentId]?.trim();
    if (!text || !user) return;
    setReplyLoading(parentId);

    const res = await fetch('/api/comments', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ experimentId, authorId: user.id, content: text, parentId }),
    });

    if (res.ok) {
      const data = await res.json() as { comment: QAComment };
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === parentId ? { ...q, replies: [...q.replies, data.comment] } : q,
        ),
      );
      setReplyTexts((prev) => ({ ...prev, [parentId]: '' }));
      setReplyingTo(null);
    }
    setReplyLoading(null);
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Count */}
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {questions.length} question{questions.length !== 1 ? 's' : ''}
      </p>

      {/* Empty state */}
      {questions.length === 0 && (
        <div
          className="px-4 py-8 text-center rounded"
          style={{ background: 'var(--bg-page)', border: '1px dashed var(--border-mid)', borderRadius: 'var(--radius-sm)' }}
        >
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>
            No questions yet. Ask something about this study.
          </p>
        </div>
      )}

      {/* Questions */}
      {questions.length > 0 && (
        <div className="flex flex-col">
          {questions.map((q, qi) => {
            const pp           = q.profiles?.participant_profiles?.[0] ?? null;
            const name         = pp?.pseudonym ?? q.profiles?.display_name ?? 'anon';
            const profileHref  = pp ? `/profile/${pp.participant_id}` : null;

            return (
              <div
                key={q.id}
                style={{ borderBottom: qi < questions.length - 1 ? '1px solid var(--border-soft)' : 'none' }}
              >
                {/* Question */}
                <div className="py-3">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {pp && <Identicon participantId={pp.participant_id} size={20} />}
                    {profileHref ? (
                      <Link
                        href={profileHref}
                        className="no-underline hover:underline"
                        style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--teal-dark)' }}
                      >
                        {name}
                      </Link>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                        {name}
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                      · {relativeTime(q.created_at)}
                    </span>
                  </div>
                  <p className="leading-relaxed" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)' }}>
                    {q.content}
                  </p>

                  {/* Reply button — experimenter only, if no reply yet */}
                  {isExperimenter && q.replies.length === 0 && replyingTo !== q.id && (
                    <button
                      onClick={() => setReplyingTo(q.id)}
                      className="mt-2 transition-opacity hover:opacity-80"
                      style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--teal-dark)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      Reply →
                    </button>
                  )}
                </div>

                {/* Experimenter reply form */}
                {isExperimenter && replyingTo === q.id && q.replies.length === 0 && (
                  <div
                    className="pb-3 pl-4"
                    style={{ borderLeft: '2px solid var(--teal)', marginLeft: 8, marginBottom: 12 }}
                  >
                    <p className="mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--teal-dark)' }}>
                      {orgName ?? 'Experimenter'} — reply
                    </p>
                    <textarea
                      value={replyTexts[q.id] ?? ''}
                      onChange={(e) =>
                        setReplyTexts((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="Type your reply..."
                      rows={3}
                      className="w-full px-3 py-2 outline-none resize-none"
                      style={TEXTAREA_STYLE}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => submitReply(q.id)}
                        disabled={!replyTexts[q.id]?.trim() || replyLoading === q.id}
                        className="disabled:opacity-40 hover:opacity-90 transition-opacity"
                        style={BTN_PRIMARY}
                      >
                        {replyLoading === q.id ? 'Posting...' : 'Post reply →'}
                      </button>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="hover:opacity-80 transition-opacity"
                        style={BTN_GHOST}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Existing replies */}
                {q.replies.map((reply) => {
                  const isExpReplyRow = reply.author_id === experimenterUserId;
                  const replyPp       = reply.profiles?.participant_profiles?.[0] ?? null;
                  const replyName     = isExpReplyRow
                    ? (orgName ?? reply.profiles?.display_name ?? 'Experimenter')
                    : (replyPp?.pseudonym ?? reply.profiles?.display_name ?? 'anon');
                  const replyHref = replyPp ? `/profile/${replyPp.participant_id}` : null;

                  return (
                    <div
                      key={reply.id}
                      className="px-4 py-3"
                      style={{
                        borderLeft:   `2px solid ${isExpReplyRow ? 'var(--teal)' : 'var(--border-mid)'}`,
                        marginLeft:   8,
                        marginBottom: 12,
                        background:   isExpReplyRow ? 'var(--teal-faint)' : 'var(--bg-page)',
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {!isExpReplyRow && replyPp && (
                          <Identicon participantId={replyPp.participant_id} size={18} />
                        )}
                        {isExpReplyRow && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--teal-dark)', background: 'var(--teal-soft)', padding: '1px 5px', borderRadius: 4 }}>
                            Org
                          </span>
                        )}
                        {replyHref ? (
                          <Link
                            href={replyHref}
                            className="no-underline hover:underline"
                            style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: isExpReplyRow ? 'var(--teal-dark)' : 'var(--ink)' }}
                          >
                            {replyName}
                          </Link>
                        ) : (
                          <span
                            style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: isExpReplyRow ? 'var(--teal-dark)' : 'var(--ink)' }}
                          >
                            {replyName}
                          </span>
                        )}
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                          · {relativeTime(reply.created_at)}
                        </span>
                      </div>
                      <p
                        className="leading-relaxed"
                        style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)' }}
                      >
                        {reply.content}
                      </p>
                    </div>
                  );
                })}

              </div>
            );
          })}
        </div>
      )}

      {/* Ask question form */}
      <div
        className="p-4"
        style={{ background: 'var(--bg-page)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)' }}
      >
        {authenticated ? (
          <>
            <label className="block mb-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Ask a question
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Type your question about this study..."
              rows={3}
              className="w-full px-3 py-2 outline-none resize-none"
              style={TEXTAREA_STYLE}
            />
            <button
              onClick={submitQuestion}
              disabled={!questionText.trim() || submitting}
              className="mt-2 transition-all disabled:opacity-40 hover:opacity-90"
              style={BTN_PRIMARY}
            >
              {submitting ? 'Posting...' : 'Post question →'}
            </button>
          </>
        ) : (
          <p className="text-center" style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>
            Sign in to ask a question.
          </p>
        )}
      </div>

    </div>
  );
}
