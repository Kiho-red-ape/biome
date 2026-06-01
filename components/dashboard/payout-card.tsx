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

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pending:        { bg: 'var(--off-white)', color: 'var(--gray)',  label: 'Eligible'       },
  method_missing: { bg: 'var(--amber)',     color: 'var(--black)', label: 'Setup Required' },
  processing:     { bg: 'var(--navy)',      color: 'var(--white)', label: 'Processing'     },
  paid:           { bg: 'var(--black)',     color: 'var(--amber)', label: 'Paid ✓'         },
  failed:         { bg: '#dc2626',          color: 'var(--white)', label: 'Failed ⚠'       },
};

export function PayoutCard({
  studyTitle, grossAmount, payoutStatus, payoutMethodConfigured,
  payoutMethodType, payoutNetAmount, payoutInitiatedAt, payoutCompletedAt,
  privyDid, experimentId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fee = grossAmount * 0.005;
  const net = payoutNetAmount ?? parseFloat((grossAmount - fee).toFixed(2));
  const sc  = STATUS_CONFIG[payoutStatus] ?? { bg: 'var(--off-white)', color: 'var(--gray)', label: payoutStatus };

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

  return (
    <div style={{ border: '2px solid var(--black)', background: 'var(--white)' }}>
      {/* Header */}
      <div style={{
        padding:        '12px 20px',
        borderBottom:   '2px solid var(--black)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            12,
        background:     'var(--off-white)',
      }}>
        <Link href={`/experiments/${experimentId}`} style={{
          fontFamily:     'var(--font-body)',
          fontSize:       14,
          fontWeight:     500,
          color:          'var(--black)',
          textDecoration: 'none',
          flex:           1,
          minWidth:       0,
          overflow:       'hidden',
          textOverflow:   'ellipsis',
          whiteSpace:     'nowrap',
        }}>
          {studyTitle}
        </Link>
        <span style={{
          fontFamily:    'var(--font-display)',
          fontSize:      9,
          fontWeight:    700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase' as const,
          background:    sc.bg,
          color:         sc.color,
          border:        '1.5px solid var(--black)',
          padding:       '3px 8px',
          flexShrink:    0,
        }}>
          {sc.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 20px' }}>
        {/* Amount */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: payoutStatus === 'paid' ? 'var(--black)' : 'var(--black)' }}>
            {fmt(net)}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--gray)' }}>
            net ({fmt(grossAmount)} − {fmt(fee)} processing)
          </span>
        </div>

        {/* Status-specific body */}
        {payoutStatus === 'pending' && !payoutMethodConfigured && (
          <div>
            <div style={{ padding: '10px 14px', marginBottom: 12, border: '2px solid var(--amber)', background: 'rgba(245,158,11,0.06)' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--black)', margin: 0 }}>
                Set up your payout method to receive payment.
              </p>
            </div>
            {error && <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{error}</p>}
            <button onClick={handleSetupPayout} disabled={loading} className="btn-primary"
              style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Loading...' : 'Set up payout →'}
            </button>
          </div>
        )}

        {payoutStatus === 'pending' && payoutMethodConfigured && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--gray)' }}>
            Payout method: <strong style={{ color: 'var(--black)' }}>{payoutMethodType ?? 'configured'} ✓</strong> · Payout being prepared.
          </p>
        )}

        {payoutStatus === 'processing' && (
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--navy)', marginBottom: 4 }}>
              Transfer in progress — 2–5 business days.
            </p>
            {payoutInitiatedAt && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--gray)' }}>
                Initiated {relDate(payoutInitiatedAt)}
              </p>
            )}
          </div>
        )}

        {payoutStatus === 'paid' && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--gray)' }}>
            Paid {payoutCompletedAt ? relDate(payoutCompletedAt) : ''}
          </p>
        )}

        {payoutStatus === 'failed' && (
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#dc2626', marginBottom: 10 }}>
              Payout failed. Verify your payout details and contact hello@biome.to.
            </p>
            {error && <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{error}</p>}
            <button onClick={handleSetupPayout} disabled={loading} className="btn-primary"
              style={{ cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Loading...' : 'Update payout method →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
