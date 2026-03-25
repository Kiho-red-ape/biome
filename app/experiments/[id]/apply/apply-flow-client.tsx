'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import type { ApplyExperiment, ApplyMilestone } from './page';
import type { QuizQuestion } from '@/lib/demo-data';
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

function SectionLabel({ text, color = 'var(--green)' }: { text: string; color?: string }) {
  return (
    <p className="mono text-xs mb-5"
      style={{ color, letterSpacing: '3px', textTransform: 'uppercase' }}>
      // {text}
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
    <div className="rounded p-4 mb-5"
      style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
      <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// WHAT YOU ARE SIGNING UP FOR</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
        {fields.map(({ label, value }) => (
          <div key={label}>
            <p className="mono text-xs mb-0.5" style={{ color: 'var(--text-dim)', fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              {label}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-bright)', fontFamily: 'var(--font-heading)' }}>
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
    <div className="rounded p-4 mb-5"
      style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
      <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// MILESTONES PREVIEW</p>
      <div className="flex flex-col gap-2">
        {preview.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="mono text-xs flex-shrink-0" style={{ color: 'var(--text-dim)', minWidth: 52 }}>
              Week {m.week_number}
            </span>
            <span className="text-xs truncate" style={{ color: 'var(--text-bright)', fontFamily: 'var(--font-heading)' }}>
              {m.title}
            </span>
            <span className="mono text-xs flex-shrink-0 ml-auto" style={{ color: 'var(--text-dim)', fontSize: 9 }}>
              {m.milestone_type === 'self_report' ? 'self-report' : 'experimenter confirms'}
            </span>
          </div>
        ))}
        {milestones.length > 4 && (
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
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
  async function handleSubmit() {
    if (!agreed || submitting) return;
    setSubmitting(true);
    try {
      if (user) {
        await fetch(`/api/experiments/${exp.id}/applications`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            privyDid:    user.id,
            quizResult:  quizResult ?? 'not_applicable',
            quizAnswers: answers,
          }),
        });
      }
      // In demo mode or on success, advance to submitted
    } catch {
      // fail gracefully — show submitted either way (demo)
    }
    setStep('submitted');
    setSubmitting(false);
  }

  // ── Shared shell ──────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Legal modal — renders on top, form stays mounted */}
      {legalDoc && <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />}

      {/* Top nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px',
        background: 'rgba(5,7,9,0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(183,255,97,0.12)',
      }}>
        <Link href={`/experiments/${exp.id}`} className="hover-green"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px' }}>
          ← {exp.title.length > 40 ? exp.title.slice(0, 40) + '…' : exp.title}
        </Link>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px', color: '#4a7055' }}>
          // APPLY
        </span>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Study title */}
        <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          {exp.category.toUpperCase()}
        </p>
        <h1 style={{
          fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px, 3vw, 28px)',
          fontWeight: 700, color: '#eef4f0', lineHeight: 1.2, marginBottom: 6,
        }}>
          {exp.title}
        </h1>
        <p className="mono text-xs mb-8" style={{ color: '#4a7055' }}>
          Reward: <span style={{ color: 'var(--green)' }}>${exp.bounty_per_participant.toFixed(0)}</span>
          {exp.application_deadline && deadlineDays(exp.application_deadline) > 0 && (
            <> · Closes in {deadlineDays(exp.application_deadline)}d</>
          )}
        </p>

        {/* Step: init (loading) */}
        {step === 'init' && (
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// LOADING...</p>
        )}

        {/* Step: closed */}
        {step === 'closed' && (
          <div className="rounded p-8 text-center"
            style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="mono text-xl mb-3" style={{ color: '#4a7055' }}>⊘</p>
            <p className="mono text-sm mb-2" style={{ color: 'var(--text-bright)' }}>
              Applications closed
            </p>
            <p className="mono text-xs mb-5" style={{ color: 'var(--text-dim)' }}>
              The application deadline for this study has passed.
            </p>
            <Link href="/experiments" className="mono text-xs" style={{ color: 'var(--green)' }}>
              Browse open studies →
            </Link>
          </div>
        )}

        {/* Step: auth */}
        {step === 'auth' && (
          <div>
            <SectionLabel text="SIGN IN REQUIRED" />
            <div className="rounded p-6"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.12)' }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: '#aab8b1', lineHeight: 1.7, marginBottom: 20 }}>
                You need to sign in to apply to this study. Your participant profile is used
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
            <div className="rounded p-6"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(255,179,0,0.2)' }}>
              <p className="mono text-xs mb-3" style={{ color: 'var(--amber)' }}>
                ⚠ Profile incomplete
              </p>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: '#aab8b1', lineHeight: 1.7, marginBottom: 20 }}>
                Your participant profile is needed for eligibility screening.
                Experimenters review your profile to ensure you meet study requirements before approving your application.
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
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#7f8e87', lineHeight: 1.7, marginBottom: 24 }}>
              Answer the following questions. Your responses are sent to the experimenter as part of your application.
              This quiz does not guarantee acceptance — the experimenter makes the final decision.
            </p>

            <div className="flex flex-col gap-3 mb-8">
              {quiz.map((q, i) => {
                const ans = answers[q.id];
                return (
                  <div key={q.id} className="rounded p-4"
                    style={{
                      background: 'var(--bg2)',
                      border: `1px solid ${ans !== null ? 'rgba(77,255,128,0.15)' : 'rgba(77,255,128,0.07)'}`,
                    }}>
                    <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#c0d4c4', marginBottom: 12 }}>
                      <span className="mono text-xs mr-2" style={{ color: 'var(--text-dim)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {q.text}
                    </p>
                    <div className="flex gap-2">
                      {([true, false] as const).map((val) => (
                        <button
                          key={String(val)}
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                          className="mono text-xs px-4 py-1.5 rounded transition-all"
                          style={{
                            background: ans === val ? (val ? 'rgba(77,255,128,0.15)' : 'rgba(255,179,0,0.1)') : 'transparent',
                            border:     `1px solid ${ans === val ? (val ? 'rgba(77,255,128,0.35)' : 'rgba(255,179,0,0.35)') : 'rgba(77,255,128,0.1)'}`,
                            color:      ans === val ? (val ? 'var(--green)' : 'var(--amber)') : 'var(--text-dim)',
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
                    <div className="rounded p-4 mb-4"
                      style={{ background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.2)' }}>
                      <p className="mono text-xs mb-1" style={{ color: 'var(--amber)' }}>
                        ⚠ Based on your answers, you may not meet the eligibility criteria.
                      </p>
                      <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                        You can still submit your application — the experimenter makes the final decision.
                      </p>
                    </div>
                  )}
                  {allAnswered && result === 'eligible' && (
                    <div className="rounded p-4 mb-4"
                      style={{ background: 'rgba(77,255,128,0.05)', border: '1px solid rgba(77,255,128,0.2)' }}>
                      <p className="mono text-xs" style={{ color: 'var(--green)' }}>
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
                    className="mono text-xs py-3 rounded font-bold transition-all disabled:opacity-30"
                    style={{
                      width: '100%',
                      background: allAnswered ? 'rgba(77,255,128,0.12)' : 'transparent',
                      border: '1px solid rgba(77,255,128,0.3)',
                      color: 'var(--green)',
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
              <div className="rounded px-4 py-2 mb-5 flex items-center gap-2"
                style={{
                  background: quizResult === 'eligible' ? 'rgba(77,255,128,0.05)' : 'rgba(255,179,0,0.05)',
                  border: `1px solid ${quizResult === 'eligible' ? 'rgba(77,255,128,0.2)' : 'rgba(255,179,0,0.2)'}`,
                }}>
                <span className="mono text-xs" style={{ color: quizResult === 'eligible' ? 'var(--green)' : 'var(--amber)' }}>
                  {quizResult === 'eligible' ? '✓ Eligible' : '⚠ Not eligible'}
                </span>
                <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                  — based on your quiz responses. Experimenter makes the final decision.
                </span>
              </div>
            )}

            <CollectionSummary exp={exp} />
            <MilestonesPreview milestones={milestones} />

            {/* Compliance note */}
            <div className="rounded p-4 mb-5"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
              <p className="mono text-xs mb-1.5" style={{ color: 'var(--text-dim)', letterSpacing: '1.5px', textTransform: 'uppercase', fontSize: 9 }}>
                Compliance requirement
              </p>
              <p className="text-xs" style={{ color: '#aab8b1', fontFamily: 'var(--font-heading)' }}>
                You must complete at least <strong style={{ color: 'var(--text-white)' }}>{exp.compliance_threshold}%</strong> of
                required milestones to be eligible for the{' '}
                <strong style={{ color: 'var(--green)' }}>${exp.bounty_per_participant.toFixed(0)} reward</strong>.
                Partial completion may result in a prorated payout at the experimenter&apos;s discretion.
              </p>
            </div>

            {/* Participant agreement checkbox */}
            <div className="rounded p-4 mb-5"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setAgreed((a) => !a)}
                  className="mt-0.5 flex-shrink-0 w-4 h-4 rounded transition-all flex items-center justify-center"
                  style={{
                    background: agreed ? 'var(--green)' : 'transparent',
                    border: `1px solid ${agreed ? 'var(--green)' : 'rgba(77,255,128,0.3)'}`,
                  }}
                >
                  {agreed && <span style={{ color: '#050709', fontSize: 10, fontWeight: 900 }}>✓</span>}
                </div>
                <span className="mono text-xs leading-relaxed" style={{ color: 'var(--text-bright)' }}>
                  I understand the study requirements, compliance expectations, and payout conditions.
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setLegalDoc('participant_agreement')}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--green)', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit' }}
                  >
                    Participant Study Agreement
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={() => setLegalDoc('payout_policy')}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--green)', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit' }}
                  >
                    Payout Policy
                  </button>
                  .
                </span>
              </label>
            </div>

            <button
              onClick={() => void handleSubmit()}
              disabled={!agreed || submitting}
              className="mono text-xs py-3 rounded font-bold transition-all disabled:opacity-30"
              style={{
                width: '100%',
                background: agreed ? '#b7ff61' : 'transparent',
                border: '1px solid rgba(183,255,97,0.4)',
                color: agreed ? '#050709' : 'var(--text-dim)',
              }}
            >
              {submitting ? 'Submitting…' : 'Submit application →'}
            </button>
          </div>
        )}

        {/* Step: submitted */}
        {step === 'submitted' && (
          <div className="rounded p-8"
            style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.15)' }}>
            <p className="mono text-2xl mb-3" style={{ color: 'var(--green)' }}>✓</p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#eef4f0', marginBottom: 12 }}>
              Application received.
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#aab8b1', lineHeight: 1.75, marginBottom: 24 }}>
              You&apos;ll be notified when the experimenter reviews your application.
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
