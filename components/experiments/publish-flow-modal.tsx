'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  experimentId: string;
  privyDid: string;
  experimentTitle: string;
  category: string;
  reward: number;
  slots: number;
  durationWeeks: number | null;
  freeStudyUsed: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 4;

const WINDOW_OPTIONS = [
  { days: 14, label: '2 weeks' },
  { days: 30, label: '30 days' },
  { days: 60, label: '60 days' },
  { days: 90, label: '90 days' },
  { days: 120, label: '4 months' },
];

function formatDeadline(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function PublishFlowModal({
  experimentId, privyDid, experimentTitle, category, reward, slots,
  durationWeeks, freeStudyUsed, onClose,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [recruitmentDays, setRecruitmentDays] = useState(30);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const totalPool = reward * slots;
  const platformFee = totalPool * 0.025;
  const feeStatus = freeStudyUsed ? 'pending' : 'free_tier';

  async function handleConfirmPublish() {
    setPublishing(true);
    setError(null);

    const res = await fetch(`/api/experiments/${experimentId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        privyDid,
        action:                  'publish',
        recruitment_window_days: recruitmentDays,
        publish_fee_status:      feeStatus,
      }),
    });

    if (res.ok) {
      router.refresh();
      onClose();
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? 'Failed to publish');
      setPublishing(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          background: '#0b120b',
          border: '1px solid rgba(77,255,128,0.18)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(77,255,128,0.1)',
          background: 'rgba(77,255,128,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '2px', color: 'var(--green)' }}>
              // PUBLISH_STUDY
            </span>
            {/* Step indicators */}
            <div style={{ display: 'flex', gap: 6 }}>
              {([1, 2, 3, 4] as Step[]).map((s) => (
                <div key={s} style={{
                  width: 18, height: 18, borderRadius: '50%',
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step >= s ? 'var(--green)' : 'rgba(255,255,255,0.05)',
                  color: step >= s ? '#050709' : 'var(--text-dim)',
                  border: step === s ? '2px solid var(--green)' : '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.15s',
                  fontWeight: 700,
                }}>
                  {s}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '24px 24px 20px' }}>

          {/* ── Step 1: Review ── */}
          {step === 1 && (
            <div>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 6 }}>
                Review your study
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 20 }}>
                Confirm the details before publishing. Once live, applicants will be able to apply.
              </p>

              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 3, padding: '16px 18px',
                display: 'flex', flexDirection: 'column', gap: 12,
                marginBottom: 20,
              }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', color: 'var(--text-dim)', marginBottom: 4 }}>TITLE</p>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 600, color: 'var(--text-bright)', margin: 0 }}>{experimentTitle}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', color: 'var(--text-dim)', marginBottom: 4 }}>CATEGORY</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)', margin: 0 }}>{category}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', color: 'var(--text-dim)', marginBottom: 4 }}>REWARD</p>
                    <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--green)', margin: 0 }}>${reward}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', color: 'var(--text-dim)', marginBottom: 4 }}>SLOTS</p>
                    <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{slots}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', color: 'var(--text-dim)', marginBottom: 4 }}>DURATION</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)', margin: 0 }}>{durationWeeks ? `${durationWeeks} weeks` : '—'}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px', color: 'var(--text-dim)', marginBottom: 4 }}>TOTAL POOL</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)', margin: 0 }}>${totalPool.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                style={{
                  width: '100%', padding: '12px',
                  fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                  background: 'var(--green)', color: '#060a14',
                  border: 'none', borderRadius: 3, cursor: 'pointer',
                }}
              >
                Looks good — set timeline →
              </button>
            </div>
          )}

          {/* ── Step 2: Recruitment timeline ── */}
          {step === 2 && (
            <div>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 6 }}>
                Recruitment timeline
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 20 }}>
                How long should applications stay open? The deadline is calculated from today.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {WINDOW_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setRecruitmentDays(opt.days)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px',
                      fontFamily: 'var(--font-mono)', fontSize: 12,
                      background: recruitmentDays === opt.days ? 'rgba(77,255,128,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${recruitmentDays === opt.days ? 'rgba(77,255,128,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      color: recruitmentDays === opt.days ? 'var(--green)' : 'var(--text)',
                      borderRadius: 3, cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span>{opt.label}</span>
                    <span style={{ color: recruitmentDays === opt.days ? 'rgba(77,255,128,0.6)' : 'var(--text-dim)', fontSize: 11 }}>
                      {opt.days} days
                    </span>
                  </button>
                ))}
              </div>

              <div style={{
                padding: '10px 14px',
                background: 'rgba(0,229,255,0.04)',
                border: '1px solid rgba(0,229,255,0.15)',
                borderRadius: 3, marginBottom: 20,
              }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--cyan)', margin: 0 }}>
                  Applications close: <strong>{formatDeadline(recruitmentDays)}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1, padding: '12px',
                    fontFamily: 'var(--font-mono)', fontSize: 12,
                    background: 'transparent', color: 'var(--text-dim)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  style={{
                    flex: 2, padding: '12px',
                    fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                    background: 'var(--green)', color: '#060a14',
                    border: 'none', borderRadius: 3, cursor: 'pointer',
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Publish fee ── */}
          {step === 3 && (
            <div>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 6 }}>
                Publish fee
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 20 }}>
                BIOME charges a one-time fee to publish a study to the platform.
              </p>

              {!freeStudyUsed ? (
                <div style={{
                  padding: '20px',
                  background: 'rgba(77,255,128,0.05)',
                  border: '1px solid rgba(77,255,128,0.2)',
                  borderRadius: 3, marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--green)', lineHeight: 1 }}>✓</span>
                    <div>
                      <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>
                        Your first study is free to publish
                      </p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', margin: 0 }}>
                        No publish fee for your first study. The 2.5% platform fee still applies to participant payouts.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '20px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 3, marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 4 }}>
                        Publish fee
                      </p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', margin: 0 }}>
                        One-time fee per study published to the platform. Invoiced separately.
                      </p>
                    </div>
                    <p style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--text-bright)', margin: 0, flexShrink: 0, paddingLeft: 16 }}>
                      $99
                    </p>
                  </div>
                </div>
              )}

              <div style={{
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 3, marginBottom: 20,
              }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', margin: 0 }}>
                  Platform fee of 2.5% (${platformFee.toFixed(2)}) applies to total payout pool of ${totalPool.toLocaleString()}.
                  Fee is charged to you, not deducted from participant rewards.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    flex: 1, padding: '12px',
                    fontFamily: 'var(--font-mono)', fontSize: 12,
                    background: 'transparent', color: 'var(--text-dim)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  style={{
                    flex: 2, padding: '12px',
                    fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                    background: 'var(--green)', color: '#060a14',
                    border: 'none', borderRadius: 3, cursor: 'pointer',
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Confirm publish ── */}
          {step === 4 && (
            <div>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 6 }}>
                Confirm & publish
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 20 }}>
                Your study will go live immediately and appear in the recruiting list.
              </p>

              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 3, padding: '16px 18px',
                display: 'flex', flexDirection: 'column', gap: 10,
                marginBottom: 20,
              }}>
                <Row label="Study" value={experimentTitle} />
                <Row label="Applications open for" value={`${recruitmentDays} days (closes ${formatDeadline(recruitmentDays)})`} />
                <Row label="Publish fee" value={!freeStudyUsed ? 'Free (first study)' : '$99 — invoiced'} />
                <Row label="Platform fee" value={`2.5% of $${totalPool.toLocaleString()} = $${platformFee.toFixed(2)}`} />
              </div>

              {error && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber)', marginBottom: 12 }}>
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setStep(3)}
                  disabled={publishing}
                  style={{
                    flex: 1, padding: '12px',
                    fontFamily: 'var(--font-mono)', fontSize: 12,
                    background: 'transparent', color: 'var(--text-dim)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, cursor: 'pointer',
                    opacity: publishing ? 0.4 : 1,
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleConfirmPublish}
                  disabled={publishing}
                  style={{
                    flex: 2, padding: '12px',
                    fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                    background: 'var(--green)', color: '#060a14',
                    border: 'none', borderRadius: 3, cursor: publishing ? 'not-allowed' : 'pointer',
                    opacity: publishing ? 0.7 : 1,
                  }}
                >
                  {publishing ? 'Publishing...' : 'Publish study →'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
