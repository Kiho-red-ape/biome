'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { SiteHeader } from '@/components/nav/header';
import { TranslateBar, useTranslation } from '@/components/translate/translate-bar';

// ─── Types ──────────────────────────────────────────────────────────────────

type QuizQuestion = { question: string; options: string[] };

type ModuleProgress = {
  completed: boolean;
  quizPassed: boolean;
  quizScore: number;
  attempts: number;
  completedAt: string | null;
};

type AwarenessModule = {
  id: string;
  order: number;
  title: string;
  summary: string;
  lesson: string;
  quiz: QuizQuestion[];
  progress: ModuleProgress;
};

type AwarenessData = {
  modules: AwarenessModule[];
  passedCount: number;
  totalModules: number;
  verificationLevel: string;
  awarenessCompletedAt: string | null;
};

type SubmitResponse = {
  passed: boolean;
  score: number;
  total: number;
  attempts: number;
  passedCount: number;
  totalModules: number;
  allPassed: boolean;
  levelChange: { verificationLevel: string } | null;
};

const VERIFIED_LEVELS = ['aware', 'verified', 'community_builder'];

// ─── Tiny markdown renderer (**bold**, - bullets, blank-line paragraphs) ──────

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} style={{ fontWeight: 700, color: 'var(--ink)' }}>
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={`${keyPrefix}-t-${i}`}>{p}</Fragment>;
  });
}

function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n');
        const isList = lines.every((l) => l.trim().startsWith('-') || l.trim() === '');
        if (isList) {
          const items = lines.filter((l) => l.trim().startsWith('-'));
          return (
            <ul key={bi} style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map((item, ii) => (
                <li
                  key={ii}
                  style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.55, color: 'var(--slate)' }}
                >
                  {renderInline(item.trim().replace(/^-\s*/, ''), `${bi}-${ii}`)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={bi}
            style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.6, color: 'var(--slate)', margin: 0 }}
          >
            {renderInline(block, `${bi}`)}
          </p>
        );
      })}
    </div>
  );
}

// ─── Small icons ──────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5l3 3 7-7" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2.5" y="6" width="9" height="6.5" rx="1.2" stroke="var(--muted)" strokeWidth="1.4" />
      <path d="M4.5 6V4.3a2.5 2.5 0 015 0V6" stroke="var(--muted)" strokeWidth="1.4" />
    </svg>
  );
}

// ─── Module quiz ──────────────────────────────────────────────────────────────

function ModuleView({
  mod,
  privyDid,
  onPassed,
}: {
  mod: AwarenessModule;
  privyDid: string;
  onPassed: (res: SubmitResponse) => void;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => mod.quiz.map(() => null));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResponse | null>(null);

  // Lesson translation — the comprehension check below stays English.
  const t = useTranslation(mod.lesson, 'lesson');

  const allAnswered = answers.every((a) => a !== null);

  async function submit() {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/agent/awareness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privyDid, moduleId: mod.id, answers: answers as number[] }),
      });
      const json = (await res.json()) as SubmitResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Could not submit your answers.');
      setResult(json);
      if (json.passed) onPassed(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: '4px 0 4px' }}>
      <div style={{ marginBottom: 14 }}>
        <TranslateBar active={t.active} loading={t.loading} error={t.error} onSelect={t.select} />
      </div>

      <Markdown text={t.active !== 'en' && t.translated ? t.translated : mod.lesson} />

      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid var(--border-soft)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--slate)',
            marginBottom: 16,
          }}
        >
          Comprehension check
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {mod.quiz.map((q, qi) => (
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
                        cursor: result?.passed ? 'default' : 'pointer',
                        minHeight: 44,
                      }}
                    >
                      <input
                        type="radio"
                        name={`q-${mod.id}-${qi}`}
                        checked={selected}
                        disabled={result?.passed || submitting}
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

        {error && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#dc2626', marginTop: 14 }}>{error}</p>
        )}

        {result && !result.passed && (
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
              Not quite — you scored {result.score} of {result.total}.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', margin: '6px 0 0' }}>
              Take another look at the lesson above and try again.
            </p>
          </div>
        )}

        {result?.passed && (
          <div
            style={{
              marginTop: 16,
              padding: '14px 16px',
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
              {result.allPassed
                ? "You're a verified contributor."
                : 'Passed — the next lesson is now unlocked.'}
            </span>
          </div>
        )}

        {!result?.passed && (
          <button
            onClick={() => void submit()}
            disabled={!allAnswered || submitting}
            style={{
              marginTop: 18,
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
              color: '#ffffff',
              background: !allAnswered || submitting ? 'var(--muted)' : 'var(--teal)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '11px 20px',
              cursor: !allAnswered || submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Checking…' : result ? 'Try again' : 'Check my understanding'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LearnPage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();

  const [data, setData] = useState<AwarenessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async (privyDid: string) => {
    try {
      const res = await fetch(`/api/agent/awareness?privyDid=${encodeURIComponent(privyDid)}`);
      const json = (await res.json()) as AwarenessData & { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to load lessons.');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) {
      router.replace('/');
      return;
    }
    void load(user.id);
  }, [ready, authenticated, user, router, load]);

  if (!ready || loading || !user) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div
            style={{
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-sm)',
              background: 'var(--surface)',
              padding: '28px 44px',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 16,
              color: 'var(--ink)',
            }}
          >
            Loading lessons…
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div
            style={{
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius)',
              background: 'var(--surface)',
              padding: '28px 44px',
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              color: '#dc2626',
            }}
          >
            {error ?? 'Could not load lessons.'}
          </div>
        </div>
      </main>
    );
  }

  const modules = [...data.modules].sort((a, b) => a.order - b.order);
  const isVerified = VERIFIED_LEVELS.includes(data.verificationLevel);
  const pct = data.totalModules > 0 ? Math.round((data.passedCount / data.totalModules) * 100) : 0;
  const allPassed = data.passedCount >= data.totalModules && data.totalModules > 0;

  function isUnlocked(index: number): boolean {
    if (index === 0) return true;
    return modules[index - 1].progress.quizPassed;
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <SiteHeader />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Header card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-sm)',
            padding: '24px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h1
              style={{
                fontFamily: 'var(--font-display, var(--font-body))',
                fontWeight: 700,
                fontSize: 24,
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              Research Awareness
            </h1>
            {isVerified && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: 'var(--teal-dark)',
                  background: 'var(--teal-faint)',
                  border: '1px solid var(--teal-soft)',
                  borderRadius: 999,
                  padding: '5px 12px',
                }}
              >
                <CheckIcon />
                Verified contributor
              </span>
            )}
          </div>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--slate)',
              margin: '12px 0 18px',
              lineHeight: 1.55,
            }}
          >
            Completing these short lessons makes you a verified contributor — verified members are matched to studies first.
          </p>

          {/* Progress bar */}
          <div style={{ height: 8, background: 'var(--bg-page)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--teal)', transition: 'width 400ms' }} />
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--slate)',
              marginTop: 10,
            }}
          >
            {data.passedCount} of {data.totalModules} lessons complete
            {allPassed ? ' — all done' : ''}
          </div>
        </div>

        {/* Module list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {modules.map((mod, index) => {
            const unlocked = isUnlocked(index);
            const passed = mod.progress.quizPassed;
            const open = openId === mod.id;

            return (
              <div
                key={mod.id}
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${open ? 'var(--teal)' : 'var(--border-soft)'}`,
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                  opacity: unlocked ? 1 : 0.7,
                }}
              >
                <button
                  onClick={() => {
                    if (!unlocked) return;
                    setOpenId(open ? null : mod.id);
                  }}
                  disabled={!unlocked}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '18px 20px',
                    background: 'none',
                    border: 'none',
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                    minHeight: 56,
                  }}
                >
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      flexShrink: 0,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: passed ? 'var(--teal-faint)' : unlocked ? 'var(--bg-page)' : 'var(--bg-page)',
                      border: `1px solid ${passed ? 'var(--teal-soft)' : 'var(--border-soft)'}`,
                    }}
                  >
                    {passed ? <CheckIcon /> : unlocked ? (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--slate)' }}>
                        {mod.order}
                      </span>
                    ) : (
                      <LockIcon />
                    )}
                  </span>

                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontFamily: 'var(--font-body)',
                        fontSize: 16,
                        fontWeight: 600,
                        color: unlocked ? 'var(--ink)' : 'var(--muted)',
                      }}
                    >
                      {mod.title}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontFamily: 'var(--font-body)',
                        fontSize: 13,
                        color: 'var(--muted)',
                        marginTop: 3,
                      }}
                    >
                      {unlocked ? mod.summary : 'Complete the previous lesson to unlock'}
                    </span>
                  </span>

                  {unlocked && (
                    <span style={{ flexShrink: 0, color: 'var(--muted)', fontSize: 12, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}>
                      ▾
                    </span>
                  )}
                </button>

                {open && unlocked && (
                  <div style={{ padding: '0 20px 22px', borderTop: '1px solid var(--border-soft)' }}>
                    <div style={{ paddingTop: 18 }}>
                      <ModuleView
                        mod={mod}
                        privyDid={user.id}
                        onPassed={() => {
                          void load(user.id);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* All passed celebration */}
        {allPassed && (
          <div
            style={{
              marginTop: 24,
              padding: '24px',
              background: 'var(--teal-faint)',
              border: '1px solid var(--teal-soft)',
              borderRadius: 'var(--radius)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 700, color: 'var(--teal-dark)', margin: 0 }}>
              You&apos;re a verified contributor.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', margin: '8px 0 16px' }}>
              Verified members are matched to studies first.
            </p>
            <Link
              href="/dashboard"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 600,
                color: '#ffffff',
                background: 'var(--teal)',
                borderRadius: 'var(--radius-sm)',
                padding: '11px 22px',
                textDecoration: 'none',
              }}
            >
              Back to dashboard →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
