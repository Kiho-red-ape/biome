'use client';

interface Props {
  experimentId: string;
  experimentTitle: string;
  experimentCode: string | null;
  approvedCount: number;
  bountyPerParticipant: number;
  escrowStatus: string;
}

export function EscrowDepositPanel({
  experimentTitle,
  experimentCode,
  approvedCount,
  bountyPerParticipant,
  escrowStatus,
}: Props) {
  const subtotal      = bountyPerParticipant * approvedCount;
  const platformFee   = subtotal * 0.025;
  const escrowTotal   = subtotal + platformFee;
  const ref           = experimentCode ?? 'BIOME-STUDY';

  const isDeposited = escrowStatus === 'deposited';

  return (
    <div className="rounded overflow-hidden" style={{ border: `1px solid ${isDeposited ? 'rgba(77,255,128,0.2)' : 'rgba(255,179,0,0.2)'}` }}>

      {/* Header */}
      <div className="px-5 py-3 flex items-center gap-3"
        style={{ background: isDeposited ? 'rgba(77,255,128,0.05)' : 'rgba(255,179,0,0.06)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="mono text-xs font-bold"
          style={{ color: isDeposited ? 'var(--green)' : 'var(--amber)' }}>
          {isDeposited ? '✓ ESCROW_DEPOSITED' : '// FUNDING_HOLD'}
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
              { label: 'Approved participants', value: String(approvedCount) },
              { label: 'Reward per participant', value: `$${bountyPerParticipant.toFixed(2)}` },
              { label: 'Subtotal', value: `$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
              { label: 'Platform fee (2.5%)', value: `$${platformFee.toFixed(2)}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{label}</span>
                <span className="mono text-xs" style={{ color: 'var(--text)' }}>{value}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="mono text-xs font-bold" style={{ color: 'var(--text-bright)' }}>Total escrow required</span>
              <span className="mono text-sm font-bold" style={{ color: 'var(--green)' }}>
                ${escrowTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {isDeposited ? (
          <div className="rounded px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(77,255,128,0.05)', border: '1px solid rgba(77,255,128,0.15)' }}>
            <span style={{ color: 'var(--green)', fontSize: 18 }}>✓</span>
            <div>
              <p className="mono text-xs font-bold" style={{ color: 'var(--green)' }}>Escrow deposit confirmed</p>
              <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                You can now launch the study. Funds will be released to participants after completion.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Payment instructions */}
            <div className="rounded px-4 py-4 mb-4"
              style={{ background: 'rgba(255,179,0,0.04)', border: '1px solid rgba(255,179,0,0.15)' }}>
              <p className="mono text-xs mb-3" style={{ color: 'var(--amber)' }}>PAYMENT METHOD: Bank transfer to BIOME escrow</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Account name',   value: 'BIOME Labs Inc.' },
                  { label: 'Reference',       value: ref },
                  { label: 'Amount',          value: `$${escrowTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{label}</span>
                    <span className="mono text-xs font-bold" style={{ color: 'var(--text-bright)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded px-4 py-3"
              style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.12)' }}>
              <p className="mono text-xs" style={{ color: 'var(--cyan)' }}>
                After transferring, email <strong>hello@biome.to</strong> with your reference <strong>{ref}</strong>.
                BIOME will confirm receipt and unlock your launch within 1 business day.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
