'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashCard, CardLabel } from '@/components/dashboard/card';

// ─── Types ──────────────────────────────────────────────────────────────────

type ReferralRow = {
  id: string;
  email: string;
  status: string;
  signedUpAt: string | null;
  createdAt: string;
};

type ReferralData = {
  referralCode: string;
  verificationLevel: string;
  successfulReferrals: number;
  communityCredit: number;
  threshold: number;
  referrals: ReferralRow[];
};

const STATUS_LABEL: Record<string, string> = {
  sent: 'Sent',
  signed_up: 'Signed up',
  awareness_complete: 'Awareness complete',
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  sent: { bg: 'var(--bg-page)', color: 'var(--muted)' },
  signed_up: { bg: 'var(--teal-soft)', color: 'var(--teal-dark)' },
  awareness_complete: { bg: 'var(--teal)', color: '#ffffff' },
};

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ReferralCard({ privyDid }: { privyDid: string }) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentNotice, setSentNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/referrals?privyDid=${encodeURIComponent(privyDid)}`);
      const json = (await res.json()) as ReferralData & { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to load.');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [privyDid]);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyLink() {
    if (!data) return;
    const link = `${window.location.origin}/?ref=${data.referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function sendInvite() {
    if (sending || !isValidEmail(email)) return;
    setSending(true);
    setSendError(null);
    setSentNotice(null);
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privyDid, action: 'send', email: email.trim() }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (res.status === 403) {
        setSendError('Complete the research-awareness lessons first to invite others.');
        return;
      }
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not send the invite.');
      setSentNotice(`Invite sent to ${email.trim()}.`);
      setEmail('');
      void load();
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'Network error.');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <DashCard>
        <CardLabel>Grow the research community</CardLabel>
        <div style={{ padding: '24px', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)' }}>
          Loading…
        </div>
      </DashCard>
    );
  }

  if (error || !data) {
    return (
      <DashCard>
        <CardLabel>Grow the research community</CardLabel>
        <div style={{ padding: '24px', fontFamily: 'var(--font-body)', fontSize: 14, color: '#dc2626' }}>
          {error ?? 'Could not load referrals.'}
        </div>
      </DashCard>
    );
  }

  const isBuilder = data.verificationLevel === 'community_builder';
  const progress = data.threshold > 0 ? Math.min(100, Math.round((data.successfulReferrals / data.threshold) * 100)) : 0;
  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${data.referralCode}` : `/?ref=${data.referralCode}`;

  return (
    <DashCard>
      <CardLabel>
        Grow the research community
        {isBuilder && (
          <span
            style={{
              marginLeft: 12,
              background: 'var(--teal)',
              color: '#ffffff',
              borderRadius: 999,
              padding: '2px 10px',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '1px',
            }}
          >
            Community Builder
          </span>
        )}
      </CardLabel>

      <div style={{ padding: '20px 24px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', margin: 0, lineHeight: 1.55 }}>
          Invite people you think would value contributing to research. When three people you invite join and complete
          the research-awareness lessons, you unlock Community Builder status.
        </p>

        {/* Progress toward Community Builder */}
        {!isBuilder && (
          <div style={{ marginTop: 16 }}>
            <div style={{ height: 8, background: 'var(--bg-page)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--teal)', transition: 'width 400ms' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--slate)', marginTop: 8 }}>
              {data.successfulReferrals} of {data.threshold} toward Community Builder
            </div>
          </div>
        )}

        {/* Referral code + share link */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          >
            Your invite link
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <code
              style={{
                flex: 1,
                minWidth: 200,
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: 'var(--ink)',
                background: 'var(--bg-page)',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {shareLink}
            </code>
            <button
              onClick={() => void copyLink()}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 600,
                color: copied ? 'var(--teal-dark)' : '#ffffff',
                background: copied ? 'var(--teal-faint)' : 'var(--teal)',
                border: copied ? '1px solid var(--teal-soft)' : 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 16px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: 42,
              }}
            >
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
            Code: {data.referralCode}
          </div>
        </div>

        {/* Email invite */}
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 10,
            }}
          >
            Invite by email
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              disabled={sending}
              style={{
                flex: 1,
                minWidth: 200,
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--ink)',
                background: 'var(--surface)',
                border: '1px solid var(--border-mid)',
                borderRadius: 'var(--radius-sm)',
                padding: '11px 12px',
                outline: 'none',
                minHeight: 44,
              }}
            />
            <button
              onClick={() => void sendInvite()}
              disabled={sending || !isValidEmail(email)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 600,
                color: '#ffffff',
                background: sending || !isValidEmail(email) ? 'var(--muted)' : 'var(--teal)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '0 18px',
                minHeight: 44,
                cursor: sending || !isValidEmail(email) ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {sending ? 'Sending…' : 'Send invite'}
            </button>
          </div>
          {sendError && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#dc2626', margin: '10px 0 0' }}>
              {sendError}
            </p>
          )}
          {sentNotice && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--teal-dark)', margin: '10px 0 0' }}>
              {sentNotice}
            </p>
          )}
        </div>

        {/* Referral list */}
        {data.referrals.length > 0 && (
          <div style={{ marginTop: 22, borderTop: '1px solid var(--border-soft)', paddingTop: 16 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 12,
              }}
            >
              Your invites ({data.referrals.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.referrals.map((r) => {
                const st = STATUS_STYLE[r.status] ?? { bg: 'var(--bg-page)', color: 'var(--muted)' };
                return (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '10px 14px',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 13,
                        color: 'var(--ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                      }}
                    >
                      {r.email}
                    </span>
                    <span
                      style={{
                        flexShrink: 0,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        background: st.bg,
                        color: st.color,
                        borderRadius: 4,
                        padding: '3px 8px',
                      }}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashCard>
  );
}
