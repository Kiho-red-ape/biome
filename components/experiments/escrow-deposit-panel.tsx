'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

interface Props {
  experimentId: string;
  experimentTitle: string;
  experimentCode: string | null;
  approvedCount: number;
  bountyPerParticipant: number;
  bountyPoolDeposited: boolean;
}

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function EscrowDepositPanel({
  experimentId,
  experimentTitle,
  approvedCount,
  bountyPerParticipant,
  bountyPoolDeposited,
}: Props) {
  const { user } = usePrivy();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const subtotal    = bountyPerParticipant * approvedCount;
  const platformFee = subtotal * 0.025;
  const total       = subtotal + platformFee;

  async function handleDeposit() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/payments/bounty-deposit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ experimentId, privyDid: user.id }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Failed to start deposit');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded overflow-hidden"
      style={{ border: `1px solid ${bountyPoolDeposited ? 'rgba(77,255,128,0.2)' : 'rgba(255,179,0,0.2)'}` }}>

      {/* Header */}
      <div className="px-5 py-3 flex items-center gap-3"
        style={{ background: bountyPoolDeposited ? 'rgba(77,255,128,0.05)' : 'rgba(255,179,0,0.06)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="mono text-xs font-bold"
          style={{ color: bountyPoolDeposited ? 'var(--green)' : 'var(--amber)' }}>
          {bountyPoolDeposited ? '✓ BOUNTY_POOL_DEPOSITED' : '// FUNDING_HOLD'}
        </span>
      </div>

      <div className="px-5 py-5">
        {/* Study + breakdown */}
        <div className="mb-5 rounded px-4 py-4"
          style={{ background: 'var(--bg2)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
            Study: <span style={{ color: 'var(--text-bright)' }}>{experimentTitle}</span>
          </p>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Approved participants',  value: String(approvedCount) },
              { label: 'Reward per participant', value: fmt(bountyPerParticipant) },
              { label: 'Subtotal',               value: fmt(subtotal) },
              { label: 'Platform fee (2.5%)',    value: fmt(platformFee) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{label}</span>
                <span className="mono text-xs" style={{ color: 'var(--text)' }}>{value}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="mono text-xs font-bold" style={{ color: 'var(--text-bright)' }}>Total to deposit</span>
              <span className="mono text-sm font-bold" style={{ color: 'var(--green)' }}>{fmt(total)}</span>
            </div>
          </div>
        </div>

        {bountyPoolDeposited ? (
          <div className="rounded px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(77,255,128,0.05)', border: '1px solid rgba(77,255,128,0.15)' }}>
            <span style={{ color: 'var(--green)', fontSize: 18 }}>✓</span>
            <div>
              <p className="mono text-xs font-bold" style={{ color: 'var(--green)' }}>Bounty pool deposited</p>
              <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                Funds held by Stripe. Payouts will be released to participants after study completion.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="mono text-xs mb-4" style={{ color: 'var(--text-dim)' }}>
              Deposit the full bounty pool via Stripe before launching your study. Funds are held securely until participants complete.
            </p>
            {error && (
              <p className="mono text-xs mb-3" style={{ color: '#ff8f8f' }}>{error}</p>
            )}
            <button
              onClick={handleDeposit}
              disabled={loading || !user}
              className="mono text-xs px-5 py-2.5 rounded font-bold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'var(--amber)', color: '#050709' }}
            >
              {loading ? 'Redirecting...' : `Deposit ${fmt(total)} via Stripe →`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
