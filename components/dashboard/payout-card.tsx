'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  applicationId: string;
  studyTitle: string;
  grossAmount: number;
  payoutStatus: string;
  payoutMethodConfigured: boolean;
  payoutMethodType: string | null;
  payoutNetAmount: number | null;
  payoutInitiatedAt: string | null;
  payoutCompletedAt: string | null;
  privyDid: string;
  experimentId: string;
}

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function relDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function PayoutCard({
  studyTitle, grossAmount, payoutStatus, payoutMethodConfigured,
  payoutMethodType, payoutNetAmount, payoutInitiatedAt, payoutCompletedAt,
  privyDid, experimentId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fee = grossAmount * 0.005;
  const net = payoutNetAmount ?? parseFloat((grossAmount - fee).toFixed(2));

  async function handleSetupPayout() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/payout/setup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ privyDid }),
      });
      const data = await res.json() as { onboardingUrl?: string; error?: string };
      if (!res.ok || !data.onboardingUrl) {
        setError(data.error ?? 'Failed to start payout setup');
        return;
      }
      window.location.href = data.onboardingUrl;
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  const statusConfig: Record<string, { color: string; label: string }> = {
    pending:        { color: 'var(--text-dim)',  label: 'ELIGIBLE' },
    method_missing: { color: 'var(--amber)',     label: 'SETUP REQUIRED' },
    processing:     { color: 'var(--cyan)',      label: 'PROCESSING' },
    paid:           { color: 'var(--green)',     label: 'PAID ✓' },
    failed:         { color: '#ff8f8f',          label: 'FAILED ⚠' },
  };
  const sc = statusConfig[payoutStatus] ?? { color: 'var(--text-dim)', label: payoutStatus.toUpperCase() };

  return (
    <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(77,255,128,0.08)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3"
        style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
        <div className="min-w-0">
          <Link href={`/experiments/${experimentId}`}
            className="text-sm font-medium no-underline truncate block hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-bright)' }}>
            {studyTitle}
          </Link>
        </div>
        <span className="mono text-xs px-2 py-0.5 rounded shrink-0"
          style={{ color: sc.color, border: `1px solid ${sc.color}40`, background: `${sc.color}10`, fontSize: 9, letterSpacing: '1px' }}>
          {sc.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-4" style={{ background: 'var(--bg)' }}>
        {/* Amount row */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="mono text-xl font-bold tabular-nums" style={{ color: payoutStatus === 'paid' ? 'var(--green)' : 'var(--text-white)' }}>
            {fmt(net)}
          </span>
          <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            net ({fmt(grossAmount)} − {fmt(fee)} processing)
          </span>
        </div>

        {/* Status-specific body */}
        {payoutStatus === 'pending' && !payoutMethodConfigured && (
          <div>
            <div className="rounded px-3 py-2 mb-3 flex items-center gap-2"
              style={{ background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.2)' }}>
              <span style={{ color: 'var(--amber)', fontSize: 12 }}>⚠</span>
              <p className="mono text-xs" style={{ color: 'var(--amber)' }}>
                Set up your payout method to receive payment.
              </p>
            </div>
            {error && <p className="mono text-xs mb-2" style={{ color: '#ff8f8f' }}>{error}</p>}
            <button
              onClick={handleSetupPayout}
              disabled={loading}
              className="mono text-xs px-4 py-2 rounded font-bold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'var(--green)', color: '#060a14' }}
            >
              {loading ? 'Loading...' : 'Set up payout →'}
            </button>
          </div>
        )}

        {payoutStatus === 'pending' && payoutMethodConfigured && (
          <div className="flex items-center gap-3">
            <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              Payout method: <span style={{ color: 'var(--green)' }}>{payoutMethodType ?? 'configured'} ✓</span>
            </span>
            <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              · Payout being prepared
            </span>
          </div>
        )}

        {payoutStatus === 'processing' && (
          <div>
            <p className="mono text-xs mb-1" style={{ color: 'var(--cyan)' }}>
              Transfer in progress — 2–5 business days
            </p>
            {payoutInitiatedAt && (
              <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                Initiated {relDate(payoutInitiatedAt)}
              </p>
            )}
          </div>
        )}

        {payoutStatus === 'paid' && (
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            Paid {payoutCompletedAt ? relDate(payoutCompletedAt) : ''}
          </p>
        )}

        {payoutStatus === 'failed' && (
          <div>
            <p className="mono text-xs mb-2" style={{ color: '#ff8f8f' }}>
              Payout failed. Verify your payout details and contact hello@biome.to.
            </p>
            {error && <p className="mono text-xs mb-2" style={{ color: '#ff8f8f' }}>{error}</p>}
            <button
              onClick={handleSetupPayout}
              disabled={loading}
              className="mono text-xs px-4 py-2 rounded transition-all hover:opacity-80 disabled:opacity-40"
              style={{ border: '1px solid rgba(255,143,143,0.3)', color: '#ff8f8f' }}
            >
              {loading ? 'Loading...' : 'Update payout method →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
