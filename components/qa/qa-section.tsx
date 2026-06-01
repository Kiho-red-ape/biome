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
    <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(77,255,128,0.06)' }}>

      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.06)' }}
      >
        <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
          // QUESTIONS
        </p>
        <span className="mono text-xs" style={{ color: 'var(--green)' }}>
          [{questions.length}]
        </span>
      </div>

      {/* Empty state */}
      {questions.length === 0 && (
        <div className="px-4 py-8 text-center" style={{ background: 'var(--bg)' }}>
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            {'>'}_{'  '}No questions yet. Ask something about this study.
          </p>
        </div>
      )}

      {/* Questions */}
      {questions.length > 0 && (
        <div className="flex flex-col" style={{ background: 'var(--bg)' }}>
          {questions.map((q) => {
            const pp           = q.profiles?.participant_profiles?.[0] ?? null;
            const name         = pp?.pseudonym ?? q.profiles?.display_name ?? 'anon';
            const profileHref  = pp ? `/profile/${pp.participant_id}` : null;
            const isExpReply   = false; // questions are from participants, not experimenters

            return (
              <div
                key={q.id}
                className="border-b"
                style={{ borderColor: 'rgba(77,255,128,0.05)' }}
              >
                {/* Question */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {pp && <Identicon participantId={pp.participant_id} size={20} />}
                    {profileHref ? (
                      <Link
                        href={profileHref}
                        className="mono text-xs font-bold no-underline hover:underline"
                        style={{ color: 'var(--green)' }}
                      >
                        {name}
                      </Link>
                    ) : (
                      <span className="mono text-xs font-bold" style={{ color: 'var(--green)' }}>
                        {name}
                      </span>
                    )}
                    <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                      · {relativeTime(q.created_at)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)', fontSize: '0.82rem' }}>
                    {q.content}
                  </p>

                  {/* Reply button — experimenter only, if no reply yet */}
                  {isExperimenter && q.replies.length === 0 && replyingTo !== q.id && (
                    <button
                      onClick={() => setReplyingTo(q.id)}
                      className="mono mt-2 transition-opacity hover:opacity-80"
                      style={{ color: 'var(--cyan)', fontSize: '0.7rem' }}
                    >
                      reply ↩
                    </button>
                  )}
                </div>

                {/* Experimenter reply form */}
                {isExperimenter && replyingTo === q.id && q.replies.length === 0 && (
                  <div
                    className="px-4 pb-3"
                    style={{ borderLeft: '2px solid rgba(0,229,255,0.2)', marginLeft: 12 }}
                  >
                    <p className="mono text-xs mb-2" style={{ color: 'var(--cyan)' }}>
                      {orgName ?? 'Experimenter'} — reply
                    </p>
                    <textarea
                      value={replyTexts[q.id] ?? ''}
                      onChange={(e) =>
                        setReplyTexts((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="Type your reply..."
                      rows={3}
                      className="w-full px-3 py-2 rounded mono text-sm outline-none resize-none"
                      style={{
                        background: 'var(--bg3)',
                        border: '1px solid rgba(0,229,255,0.2)',
                        color: 'var(--text-bright)',
                      }}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => submitReply(q.id)}
                        disabled={!replyTexts[q.id]?.trim() || replyLoading === q.id}
                        className="mono text-xs px-4 py-1.5 rounded font-bold disabled:opacity-40 hover:opacity-90"
                        style={{ background: 'var(--cyan)', color: '#060a14' }}
                      >
                        {replyLoading === q.id ? 'Posting...' : 'Post reply →'}
                      </button>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="mono text-xs px-3 py-1.5 rounded hover:opacity-80"
                        style={{ color: 'var(--text-dim)', border: '1px solid rgba(77,255,128,0.1)' }}
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
                        borderLeft: `2px solid ${isExpReplyRow ? 'rgba(0,229,255,0.25)' : 'rgba(77,255,128,0.12)'}`,
                        marginLeft: 12,
                        background: isExpReplyRow ? 'rgba(0,229,255,0.03)' : 'rgba(77,255,128,0.015)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {!isExpReplyRow && replyPp && (
                          <Identicon participantId={replyPp.participant_id} size={18} />
                        )}
                        {isExpReplyRow && (
                          <span className="mono text-xs" style={{ color: 'var(--cyan)', fontSize: '0.65rem' }}>
                            ORG
                          </span>
                        )}
                        {replyHref ? (
                          <Link
                            href={replyHref}
                            className="mono text-xs font-bold no-underline hover:underline"
                            style={{ color: isExpReplyRow ? 'var(--cyan)' : 'var(--text-bright)' }}
                          >
                            {replyName}
                          </Link>
                        ) : (
                          <span
                            className="mono text-xs font-bold"
                            style={{ color: isExpReplyRow ? 'var(--cyan)' : 'var(--text-bright)' }}
                          >
                            {replyName}
                          </span>
                        )}
                        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                          · {relativeTime(reply.created_at)}
                        </span>
                      </div>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--text-bright)', fontSize: '0.82rem' }}
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
        style={{ background: 'var(--bg2)', borderTop: '1px solid rgba(77,255,128,0.06)' }}
      >
        {authenticated ? (
          <>
            <label className="mono text-xs block mb-2" style={{ color: 'var(--text-dim)' }}>
              ASK A QUESTION
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Type your question about this study..."
              rows={3}
              className="w-full px-3 py-2 rounded mono text-sm outline-none resize-none"
              style={{
                background: 'var(--bg3)',
                border: '1px solid rgba(77,255,128,0.15)',
                color: 'var(--text-bright)',
              }}
            />
            <button
              onClick={submitQuestion}
              disabled={!questionText.trim() || submitting}
              className="mono text-xs px-4 py-2 rounded font-bold mt-2 transition-all disabled:opacity-40 hover:opacity-90"
              style={{ background: 'var(--green)', color: '#060a14' }}
            >
              {submitting ? 'Posting...' : 'Post question →'}
            </button>
          </>
        ) : (
          <p className="mono text-xs text-center" style={{ color: 'var(--text-dim)' }}>
            Sign in to ask a question.
          </p>
        )}
      </div>

    </div>
  );
}
