'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { ReimbursementReveal } from '@/components/study/reimbursement-reveal';
import type { ApplyExperiment, ApplyMilestone } from './page';
export type QuizQuestion = {
  id: string;
  text: string;
  expected_answer: boolean;
  disqualifier: boolean;
};
import { LegalModal } from '@/components/ui/legal-modal';
import type { LegalDocKey } from '@/lib/legal/documents';

// ─── Step machine ─────────────────────────────────────────────────────────────

type Step = 'init' | 'auth' | 'profile' | 'quiz' | 'review' | 'submitted' | 'closed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deadlineDays(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function evaluateQuiz(
  questions: QuizQuestion[],
  answers: Record<string, boolean | null>,
): 'eligible' | 'not_eligible' | 'incomplete' {
  for (const q of questions) {
    if (answers[q.id] === null || answers[q.id] === undefined) return 'incomplete';
    if (q.disqualifier && answers[q.id] !== q.expected_answer) return 'not_eligible';
  }
  return 'eligible';
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ text, color = 'var(--muted)' }: { text: string; color?: string }) {
  return (
    <p className="mono mb-5"
      style={{ color, fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
      {text}
    </p>
  );
}

// ─── Collection summary strip ─────────────────────────────────────────────────

function CollectionSummary({ exp }: { exp: ApplyExperiment }) {
  const fields = [
    { label: 'Format',          value: exp.is_remote ? 'Remote' : (exp.region ?? 'In-person') },
    { label: 'Duration',        value: exp.duration_weeks ? `~${exp.duration_weeks} weeks` : '—'  },
    { label: 'Inputs',          value: exp.inputs          },
    { label: 'Devices / Tools', value: exp.devices_tools   },
    { label: 'Sample type',     value: exp.sample_type     },
    { label: 'Visits',          value: exp.visits          },
    { label: 'Compliance min.', value: `${exp.compliance_threshold}%` },
  ];
  return (
    <div className="p-4 mb-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}>
      <p className="mono text-xs mb-3" style={{ color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>What you are signing up for</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
        {fields.map(({ label, value }) => (
          <div key={label}>
            <p className="mono text-xs mb-0.5" style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase' }}>
              {label}
            </p>
            <p className="text-xs" style={{ color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Milestones preview ───────────────────────────────────────────────────────

function MilestonesPreview({ milestones }: { milestones: ApplyMilestone[] }) {
  if (milestones.length === 0) return null;
  // Show at most 4 milestone entries grouped by unique weeks
  const seen = new Set<number>();
  const preview: ApplyMilestone[] = [];
  for (const m of milestones) {
    if (!seen.has(m.week_number) && preview.length < 4) {
      seen.add(m.week_number);
      preview.push(m);
    }
  }
  return (
    <div className="p-4 mb-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}>
      <p className="mono text-xs mb-3" style={{ color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Milestones preview</p>
      <div className="flex flex-col gap-2">
        {preview.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="mono text-xs flex-shrink-0" style={{ color: 'var(--muted)', minWidth: 52 }}>
              Week {m.week_number}
            </span>
            <span className="text-xs truncate" style={{ color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
              {m.title}
            </span>
            <span className="mono text-xs flex-shrink-0 ml-auto" style={{ color: 'var(--muted)', fontSize: 10 }}>
              {m.milestone_type === 'self_report' ? 'self-report' : 'researcher confirms'}
            </span>
          </div>
        ))}
        {milestones.length > 4 && (
          <p className="mono text-xs" style={{ color: 'var(--muted)' }}>
            + {milestones.length - 4} more milestones — see full protocol on the study page
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  experiment: ApplyExperiment;
  milestones: ApplyMilestone[];
  quiz: QuizQuestion[];
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ApplyFlowClient({ experiment: exp, milestones, quiz }: Props) {
  const { authenticated, user, login, ready } = usePrivy();

  const [step,       setStep]       = useState<Step>('init');
  const [answers,    setAnswers]    = useState<Record<string, boolean | null>>(() =>
    Object.fromEntries(quiz.map((q) => [q.id, null]))
  );
  const [quizResult, setQuizResult] = useState<'eligible' | 'not_eligible' | null>(null);
  const [agreed,     setAgreed]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [legalDoc,   setLegalDoc]   = useState<LegalDocKey | null>(null);

  // ── Determine initial step ─────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;

    const deadlinePassed = exp.application_deadline
      ? deadlineDays(exp.application_deadline) <= 0
      : false;

    if (deadlinePassed) {
      setStep('closed');
      return;
    }
    if (!authenticated) {
      setStep('auth');
      return;
    }
    // Profile check: we optimistically assume complete for demo.
    // In production: call /api/participant-profile and check onboarding_step.
    if (quiz.length > 0) {
      setStep('quiz');
    } else {
      setStep('review');
    }
  }, [ready, authenticated, exp.application_deadline, quiz.length]);

  // ── Submit application ─────────────────────────────────────────────────────
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!agreed || submitting || !user) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/experiments/${exp.id}/applications`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          privyDid:    user.id,
          quizResult:  quizResult ?? 'not_applicable',
          quizAnswers: answers,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        // 409 = already applied, treat as success
        if (res.status === 409) {
          setStep('submitted');
          return;
        }
        setSubmitError(data.error ?? 'Failed to submit application. Please try again.');
        return;
      }

      setStep('submitted');
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shared shell ──────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>

      {/* Legal modal — renders on top, form stays mounted */}
      {legalDoc && <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />}

      {/* Top nav */}
      <header className="px-4 sm:px-10" style={{
        position: 'sticky', top: 0, zIndex: 200,
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-soft)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <Link href={`/experiments/${exp.id}`}
          style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--teal)', textDecoration: 'none' }}>
          ← {exp.title.length > 40 ? exp.title.slice(0, 40) + '…' : exp.title}
        </Link>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase' }}>
          Apply
        </span>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Study title */}
        <p className="mono text-xs mb-2" style={{ color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {exp.category.toUpperCase()}
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(20px, 3vw, 28px)',
          fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 6,
        }}>
          {exp.title}
        </h1>
        <p className="mono text-xs mb-8" style={{ color: 'var(--slate)' }}>
          Reimbursement available on request
          {exp.application_deadline && deadlineDays(exp.application_deadline) > 0 && (
            <> · Closes in {deadlineDays(exp.application_deadline)}d</>
          )}
        </p>

        {/* Step: init (loading) */}
        {step === 'init' && (
          <p className="mono text-xs" style={{ color: 'var(--muted)' }}>Loading...</p>
        )}

        {/* Step: closed */}
        {step === 'closed' && (
          <div className="p-8 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
            <p className="mono text-xl mb-3" style={{ color: 'var(--muted)' }}>⊘</p>
            <p className="text-sm mb-2" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--ink)' }}>
              Applications closed
            </p>
            <p className="text-xs mb-5" style={{ fontFamily: 'var(--font-body)', color: 'var(--slate)' }}>
              The application deadline for this study has passed.
            </p>
            <Link href="/experiments" style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--teal)', textDecoration: 'none' }}>
              Browse open studies →
            </Link>
          </div>
        )}

        {/* Step: auth */}
        {step === 'auth' && (
          <div>
            <SectionLabel text="SIGN IN REQUIRED" />
            <div className="p-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate)', lineHeight: 1.7, marginBottom: 20 }}>
                You need to sign in to apply to this study. Your research partner profile is used
                for eligibility screening and to match you with the right studies.
              </p>
              <CollectionSummary exp={exp} />
              <button
                onClick={() => void login()}
                className="btn-primary"
                style={{ width: '100%', marginTop: 4 }}
              >
                Sign in to apply →
              </button>
            </div>
          </div>
        )}

        {/* Step: profile incomplete */}
        {step === 'profile' && (
          <div>
            <SectionLabel text="COMPLETE YOUR PROFILE" />
            <div className="p-6"
              style={{ background: 'var(--surface)', border: '1px solid rgba(180,83,9,0.35)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <p className="mono text-xs mb-3" style={{ color: 'var(--warning)' }}>
                ⚠ Profile incomplete
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate)', lineHeight: 1.7, marginBottom: 20 }}>
                Your research partner profile is needed for eligibility screening.
                Researchers review your profile to ensure you meet study requirements before approving your application.
              </p>
              <CollectionSummary exp={exp} />
              <Link href="/onboarding/participant" className="btn-primary"
                style={{ display: 'flex', justifyContent: 'center', marginTop: 4, textDecoration: 'none' }}>
                Complete your profile →
              </Link>
            </div>
          </div>
        )}

        {/* Step: eligibility quiz */}
        {step === 'quiz' && (
          <div>
            <SectionLabel text="ELIGIBILITY SCREENING" />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.7, marginBottom: 24 }}>
              Answer the following questions. Your responses are sent to the researcher as part of your application.
              This quiz does not guarantee acceptance — the researcher makes the final decision.
            </p>

            <div className="flex flex-col gap-3 mb-8">
              {quiz.map((q, i) => {
                const ans = answers[q.id];
                return (
                  <div key={q.id} className="p-4"
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid ${ans !== null ? 'var(--teal)' : 'var(--border-soft)'}`,
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-sm)',
                    }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink)', marginBottom: 12 }}>
                      <span className="mono text-xs mr-2" style={{ color: 'var(--muted)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {q.text}
                    </p>
                    <div className="flex gap-2">
                      {([true, false] as const).map((val) => (
                        <button
                          key={String(val)}
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                          className="mono text-xs px-4 py-1.5 transition-all"
                          style={{
                            borderRadius: 'var(--radius-sm)',
                            background: ans === val ? (val ? 'var(--teal-soft)' : 'var(--warning-soft)') : 'transparent',
                            border:     `1px solid ${ans === val ? (val ? 'var(--teal)' : 'var(--warning)') : 'var(--border-mid)'}`,
                            color:      ans === val ? (val ? 'var(--teal-dark)' : 'var(--warning)') : 'var(--slate)',
                          }}
                        >
                          {val ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit quiz */}
            {(() => {
              const result = evaluateQuiz(quiz, answers);
              const allAnswered = result !== 'incomplete';
              return (
                <div>
                  {allAnswered && result === 'not_eligible' && (
                    <div className="p-4 mb-4"
                      style={{ background: 'var(--warning-soft)', border: '1px solid rgba(180,83,9,0.35)', borderRadius: 'var(--radius-sm)' }}>
                      <p className="mono text-xs mb-1" style={{ color: 'var(--warning)' }}>
                        ⚠ Based on your answers, you may not meet the eligibility criteria.
                      </p>
                      <p className="mono text-xs" style={{ color: 'var(--slate)' }}>
                        You can still submit your application — the researcher makes the final decision.
                      </p>
                    </div>
                  )}
                  {allAnswered && result === 'eligible' && (
                    <div className="p-4 mb-4"
                      style={{ background: 'var(--teal-faint)', border: '1px solid var(--teal)', borderRadius: 'var(--radius-sm)' }}>
                      <p className="mono text-xs" style={{ color: 'var(--success)' }}>
                        ✓ You appear to meet the eligibility criteria for this study.
                      </p>
                    </div>
                  )}
                  <button
                    disabled={!allAnswered}
                    onClick={() => {
                      setQuizResult(result === 'incomplete' ? null : result);
                      setStep('review');
                    }}
                    className="btn-primary text-xs py-3 rounded font-bold transition-all disabled:opacity-30"
                    style={{
                      width: '100%',
                    }}
                  >
                    {allAnswered ? 'Continue to application →' : `Answer all ${quiz.length} questions to continue`}
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Step: review */}
        {step === 'review' && (
          <div>
            <SectionLabel text="REVIEW AND SUBMIT" />

            {quizResult && (
              <div className="px-4 py-2 mb-5 flex items-center gap-2"
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background: quizResult === 'eligible' ? 'var(--teal-faint)' : 'var(--warning-soft)',
                  border: `1px solid ${quizResult === 'eligible' ? 'var(--teal)' : 'rgba(180,83,9,0.35)'}`,
                }}>
                <span className="mono text-xs" style={{ color: quizResult === 'eligible' ? 'var(--success)' : 'var(--warning)' }}>
                  {quizResult === 'eligible' ? '✓ Eligible' : '⚠ Not eligible'}
                </span>
                <span className="mono text-xs" style={{ color: 'var(--slate)' }}>
                  — based on your quiz responses. Researcher makes the final decision.
                </span>
              </div>
            )}

            <CollectionSummary exp={exp} />
            <MilestonesPreview milestones={milestones} />

            {/* Compliance note */}
            <div className="p-4 mb-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}>
              <p className="mono text-xs mb-1.5" style={{ color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', fontSize: 10 }}>
                Compliance requirement
              </p>
              <p className="text-xs" style={{ color: 'var(--slate)', fontFamily: 'var(--font-body)' }}>
                You must complete at least <strong style={{ color: 'var(--ink)' }}>{exp.compliance_threshold}%</strong> of
                required milestones to be eligible for reimbursement.
                Partial completion may result in a prorated reimbursement at the researcher&apos;s discretion.
              </p>
            </div>

            {/* Reimbursement — shown only if the participant explicitly asks */}
            <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)' }}>
              <ReimbursementReveal amount={exp.bounty_per_participant} />
            </div>

            {/* Research partner agreement checkbox */}
            <div className="p-4 mb-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)', marginTop: 16 }}>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setAgreed((a) => !a)}
                  className="mt-0.5 flex-shrink-0 w-4 h-4 rounded transition-all flex items-center justify-center"
                  style={{
                    background: agreed ? 'var(--teal)' : 'transparent',
                    border: `1px solid ${agreed ? 'var(--teal)' : 'var(--border-mid)'}`,
                  }}
                >
                  {agreed && <span style={{ color: 'var(--surface)', fontSize: 10, fontWeight: 900 }}>✓</span>}
                </div>
                <span className="text-xs leading-relaxed" style={{ color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
                  I understand the study requirements, compliance expectations, and compensation conditions.
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setLegalDoc('participant_agreement')}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--teal)', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit' }}
                  >
                    Research Partner Study Agreement
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={() => setLegalDoc('payout_policy')}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--teal)', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit' }}
                  >
                    Compensation Policy
                  </button>
                  .
                </span>
              </label>
            </div>

            {submitError && (
              <p className="text-xs py-2 px-3 mb-2"
                style={{ color: 'var(--error)', background: 'var(--error-soft)', border: '1px solid rgba(185,28,28,0.35)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)' }}>
                {submitError}
              </p>
            )}
            <button
              onClick={() => void handleSubmit()}
              disabled={!agreed || submitting}
              className="btn-primary text-xs py-3 rounded font-bold transition-all disabled:opacity-30"
              style={{
                width: '100%',
              }}
            >
              {submitting ? 'Submitting…' : 'Submit application →'}
            </button>
          </div>
        )}

        {/* Step: submitted */}
        {step === 'submitted' && (
          <div className="p-8"
            style={{ background: 'var(--surface)', border: '1px solid var(--teal)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
            <p className="mono text-2xl mb-3" style={{ color: 'var(--success)' }}>✓</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
              Application received.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', lineHeight: 1.75, marginBottom: 24 }}>
              You&apos;ll be notified when the researcher reviews your application.
              You can track your application status in your dashboard.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/dashboard" className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', padding: '10px 20px' }}>
                Go to dashboard →
              </Link>
              <Link href="/experiments" className="btn-ghost"
                style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', padding: '10px 20px' }}>
                Browse more studies
              </Link>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
