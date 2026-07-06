'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AgentChat } from '@/components/agent/agent-chat';
import { TranslateBar, useTranslation } from '@/components/translate/translate-bar';

// ─── Types ──────────────────────────────────────────────────────────────────

type QuizQuestion = { question: string; options: string[] };

type ConsentNotReady = { ready: false; reason: string; message: string };

type ConsentReady = {
  ready: true;
  alreadyConsented: boolean;
  icf?: { title: string; version: string; hash: string; html: string };
  quiz?: QuizQuestion[];
  quizPassed?: boolean;
};

type ConsentData = ConsentNotReady | ConsentReady;

type QuizResult = { passed: boolean; score: number; total: number; revisit: string[] };

type AffirmResult = { enrolled: boolean; applicationId?: string; studyParticipantId?: string };

// ─── Icons ──────────────────────────────────────────────────────────────────

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5l3 3 7-7" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Step header ──────────────────────────────────────────────────────────────

function StepHeader({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: done ? 'var(--teal-faint)' : active ? 'var(--teal)' : 'var(--bg-page)',
          border: `1px solid ${done ? 'var(--teal-soft)' : active ? 'var(--teal)' : 'var(--border-soft)'}`,
        }}
      >
        {done ? (
          <CheckIcon size={14} />
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 600,
              color: active ? '#ffffff' : 'var(--muted)',
            }}
          >
            {n}
          </span>
        )}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: active || done ? 'var(--ink)' : 'var(--muted)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ConsentFlow({
  privyDid,
  experimentId,
  onEnrolled,
}: {
  privyDid: string;
  experimentId: string;
  onEnrolled?: () => void;
}) {
  const [data, setData] = useState<ConsentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const [affirmed, setAffirmed] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolledResult, setEnrolledResult] = useState<AffirmResult | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Translation of the ICF document itself (quiz + affirmation stay English —
  // the English document is the authoritative version participants agree to).
  const icfSource = data && data.ready && data.icf ? data.icf.html : '';
  const t = useTranslation(icfSource, 'icf');

  // When the displayed language changes the rendered document changes height;
  // re-check the scroll position so the read-to-end gate behaves identically
  // in every language (scrolledToEnd stays sticky once reached).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 24) setScrolledToEnd(true);
  }, [t.active, t.translated]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/agent/consent?privyDid=${encodeURIComponent(privyDid)}&experimentId=${encodeURIComponent(experimentId)}`,
      );
      const json = (await res.json()) as ConsentData & { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to load consent document.');
      setData(json);
      if (json.ready && json.quiz) setAnswers(json.quiz.map(() => null));
      if (json.ready && json.quizPassed) {
        setQuizResult({ passed: true, score: 0, total: 0, revisit: [] });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [privyDid, experimentId]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 24) setScrolledToEnd(true);
  }

  async function submitQuiz() {
    if (submittingQuiz) return;
    if (!answers.every((a) => a !== null)) return;
    setSubmittingQuiz(true);
    setError(null);
    try {
      const res = await fetch('/api/agent/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privyDid, experimentId, action: 'submit_quiz', answers: answers as number[] }),
      });
      const json = (await res.json()) as QuizResult & { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Could not submit the check.');
      setQuizResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error.');
    } finally {
      setSubmittingQuiz(false);
    }
  }

  async function affirm() {
    if (enrolling || !affirmed || !quizResult?.passed) return;
    setEnrolling(true);
    setError(null);
    try {
      const res = await fetch('/api/agent/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privyDid, experimentId, action: 'affirm', affirmed: true }),
      });
      const json = (await res.json()) as AffirmResult & { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Could not record your consent.');
      setEnrolledResult(json);
      onEnrolled?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error.');
    } finally {
      setEnrolling(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={panelStyle}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate)', margin: 0 }}>
          Loading consent document…
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ ...panelStyle, borderColor: '#fecaca' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#dc2626', margin: 0 }}>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  // ── Not ready ──────────────────────────────────────────────────────────────
  if (!data.ready) {
    return (
      <div style={panelStyle}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
          {data.message}
        </p>
        {data.reason && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', margin: '8px 0 0' }}>
            {data.reason}
          </p>
        )}
      </div>
    );
  }

  // ── Already consented ────────────────────────────────────────────────────────
  if (data.alreadyConsented || enrolledResult?.enrolled) {
    return (
      <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckIcon size={20} />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
            {enrolledResult?.enrolled ? "You're enrolled in this study." : "You've already consented to this study."}
          </p>
        </div>
        {enrolledResult?.studyParticipantId && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', margin: '10px 0 0' }}>
            Study participant ID: {enrolledResult.studyParticipantId}
          </p>
        )}
      </div>
    );
  }

  const icf = data.icf;
  const quiz = data.quiz ?? [];
  const quizPassed = quizResult?.passed === true;
  const allAnswered = answers.length > 0 && answers.every((a) => a !== null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Step 1: Read ── */}
      <section style={panelStyle}>
        <StepHeader n={1} label="Read" active={!scrolledToEnd} done={scrolledToEnd} />

        {icf && (
          <>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
                {icf.title}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                Version {icf.version}
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <TranslateBar
                active={t.active}
                loading={t.loading}
                error={t.error}
                onSelect={t.select}
                showFidelityNote
              />
            </div>

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              style={{
                marginTop: 14,
                maxHeight: '50vh',
                overflowY: 'auto',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-page)',
                padding: '18px 18px',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                lineHeight: 1.6,
                color: 'var(--slate)',
              }}
              dangerouslySetInnerHTML={{ __html: t.active !== 'en' && t.translated ? t.translated : icf.html }}
            />

            {!scrolledToEnd && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', margin: '10px 0 0' }}>
                Please read to the end before continuing.
              </p>
            )}
          </>
        )}

        {/* Inline agent helper */}
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'var(--slate)',
              marginBottom: 10,
            }}
          >
            Questions about this document?
          </div>
          <AgentChat
            stage="consent"
            experimentId={experimentId}
            privyDid={privyDid}
            intro="I can explain any part of this consent document in plain language — ask me anything about it."
          />
        </div>
      </section>

      {/* ── Step 2: Comprehension check ── */}
      <section
        style={{
          ...panelStyle,
          opacity: scrolledToEnd ? 1 : 0.6,
          pointerEvents: scrolledToEnd ? 'auto' : 'none',
        }}
      >
        <StepHeader n={2} label="Comprehension check" active={scrolledToEnd && !quizPassed} done={quizPassed} />

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {quiz.map((q, qi) => (
            <fieldset key={qi} style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: 10,
                  padding: 0,
                }}
              >
                {qi + 1}. {q.question}
              </legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.options.map((opt, oi) => {
                  const selected = answers[qi] === oi;
                  return (
                    <label
                      key={oi}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '11px 14px',
                        border: `1px solid ${selected ? 'var(--teal)' : 'var(--border-soft)'}`,
                        background: selected ? 'var(--teal-faint)' : 'var(--surface)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: quizPassed ? 'default' : 'pointer',
                        minHeight: 44,
                      }}
                    >
                      <input
                        type="radio"
                        name={`cq-${qi}`}
                        checked={selected}
                        disabled={quizPassed || submittingQuiz}
                        onChange={() =>
                          setAnswers((prev) => {
                            const next = [...prev];
                            next[qi] = oi;
                            return next;
                          })
                        }
                        style={{ marginTop: 3, accentColor: 'var(--teal)' }}
                      />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', lineHeight: 1.45 }}>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        {quizResult && !quizResult.passed && (
          <div
            style={{
              marginTop: 16,
              padding: '14px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: '#dc2626', margin: 0 }}>
              Not quite — you scored {quizResult.score} of {quizResult.total}.
            </p>
            {quizResult.revisit.length > 0 && (
              <>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', margin: '8px 0 6px' }}>
                  Revisit these sections, then try again:
                </p>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {quizResult.revisit.map((r, i) => (
                    <li key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', lineHeight: 1.5 }}>
                      {r}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {quizPassed && quizResult && (quizResult.total > 0 || quizResult.score > 0) && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              background: 'var(--teal-faint)',
              border: '1px solid var(--teal-soft)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <CheckIcon />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--teal-dark)' }}>
              Passed — you can now confirm your consent below.
            </span>
          </div>
        )}

        {error && data.ready && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#dc2626', marginTop: 12 }}>{error}</p>
        )}

        {!quizPassed && (
          <button
            onClick={() => void submitQuiz()}
            disabled={!allAnswered || submittingQuiz}
            style={{
              marginTop: 18,
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
              color: '#ffffff',
              background: !allAnswered || submittingQuiz ? 'var(--muted)' : 'var(--teal)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '11px 20px',
              cursor: !allAnswered || submittingQuiz ? 'not-allowed' : 'pointer',
            }}
          >
            {submittingQuiz ? 'Checking…' : quizResult ? 'Try again' : 'Submit answers'}
          </button>
        )}
      </section>

      {/* ── Step 3: Affirm ── */}
      <section
        style={{
          ...panelStyle,
          opacity: quizPassed ? 1 : 0.6,
          pointerEvents: quizPassed ? 'auto' : 'none',
        }}
      >
        <StepHeader n={3} label="Affirm & enroll" active={quizPassed} done={false} />

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            marginTop: 16,
            padding: '14px 16px',
            border: `1px solid ${affirmed ? 'var(--teal)' : 'var(--border-soft)'}`,
            background: affirmed ? 'var(--teal-faint)' : 'var(--surface)',
            borderRadius: 'var(--radius-sm)',
            cursor: quizPassed ? 'pointer' : 'not-allowed',
          }}
        >
          <input
            type="checkbox"
            checked={affirmed}
            disabled={!quizPassed || enrolling}
            onChange={(e) => setAffirmed(e.target.checked)}
            style={{ marginTop: 3, accentColor: 'var(--teal)', width: 16, height: 16 }}
          />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>
            I have read and understood this consent document, my participation is voluntary, and I freely agree to take part.
          </span>
        </label>

        {error && quizPassed && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#dc2626', marginTop: 12 }}>{error}</p>
        )}

        <button
          onClick={() => void affirm()}
          disabled={!quizPassed || !affirmed || enrolling}
          style={{
            marginTop: 18,
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            fontWeight: 600,
            color: '#ffffff',
            background: !quizPassed || !affirmed || enrolling ? 'var(--muted)' : 'var(--teal)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 24px',
            cursor: !quizPassed || !affirmed || enrolling ? 'not-allowed' : 'pointer',
          }}
        >
          {enrolling ? 'Enrolling…' : 'I consent and enroll'}
        </button>
      </section>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border-soft)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow-sm)',
  padding: '22px 24px',
};
