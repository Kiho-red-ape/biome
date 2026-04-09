'use client';

import { useState } from 'react';
import type { ApplicantRow } from '@/components/screening/screening-dashboard';

interface Props {
  experimentId: string;
  experimentTitle: string;
  privyDid: string;
  bountyPerParticipant: number;
  applicants: ApplicantRow[];
  experimentStatus: string;
  bountyPoolDeposited: boolean;
  onRefresh: () => void;
}

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ExperimenterPayoutPanel({
  experimentId,
  experimentTitle,
  privyDid,
  bountyPerParticipant,
  applicants,
  experimentStatus,
  bountyPoolDeposited,
  onRefresh,
}: Props) {
  const [processing, setProcessing] = useState(false);
  const [result,     setResult]     = useState<string | null>(null);
  const [resultOk,   setResultOk]   = useState(true);

  // Show for any applicants — gives early preview of payout structure
  const payoutApplicants = applicants.filter((a) =>
    ['applied', 'enrolled', 'approved', 'completed'].includes(a.status)
  );
  if (payoutApplicants.length === 0) return null;

  // Applicants that count toward actual payouts (approved/enrolled/completed)
  const eligibleApplicants = payoutApplicants.filter((a) =>
    ['enrolled', 'approved', 'completed'].includes(a.status)
  );

  // Count by payout_status (eligible only)
  const counts: Record<string, number> = {};
  for (const a of eligibleApplicants) {
    counts[a.payout_status] = (counts[a.payout_status] ?? 0) + 1;
  }

  const fee    = bountyPerParticipant * 0.005;
  const net    = parseFloat((bountyPerParticipant - fee).toFixed(2));
  const paid   = counts['paid']       ?? 0;
  const proc   = counts['processing'] ?? 0;
  const pend   = counts['pending']    ?? 0;
  const miss   = counts['method_missing'] ?? 0;
  const failed = counts['failed']     ?? 0;
  const pendingApproval = payoutApplicants.filter((a) => a.status === 'applied').length;

  const canProcessPayouts =
    experimentStatus === 'completed' &&
    bountyPoolDeposited === true &&
    pend > 0;

  async function handleProcessPayouts() {
    setProcessing(true);
    setResult(null);
    try {
      const res  = await fetch(`/api/studies/${experimentId}/process-payouts`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ privyDid }),
      });
      const data = await res.json() as {
        paymentsInitiated?: number;
        paymentsMissing?: number;
        paymentsFailed?: number;
        totalAmount?: number;
        warning?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setResult(`Error: ${data.error ?? 'Failed'}`);
        setResultOk(false);
        return;
      }
      if (data.message) {
        setResult(data.message);
        setResultOk(true);
      } else {
        const parts = [`✓ ${data.paymentsInitiated ?? 0} payouts initiated (${fmt(data.totalAmount ?? 0)})`];
        if ((data.paymentsMissing ?? 0) > 0) parts.push(`${data.paymentsMissing} awaiting payout setup`);
        if ((data.paymentsFailed  ?? 0) > 0) parts.push(`${data.paymentsFailed} failed`);
        if (data.warning) parts.push(`⚠ ${data.warning}`);
        setResult(parts.join(' · '));
        setResultOk(!data.warning);
      }
      onRefresh();
    } catch {
      setResult('Network error');
      setResultOk(false);
    } finally {
      setProcessing(false);
    }
  }

  function exportCsv() {
    const rows = [
      ['Participant ID', 'Status', 'Payout Status', 'Gross', 'Fee (0.5%)', 'Net'].join(','),
      ...payoutApplicants.map((a) =>
        [
          a.participant_id,
          a.status,
          a.payout_status,
          bountyPerParticipant.toFixed(2),
          fee.toFixed(2),
          net.toFixed(2),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `${experimentTitle.replace(/\s+/g, '-').toLowerCase()}-payouts.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const statusConfig: Array<{ key: string; label: string; color: string; count: number }> = [
    { key: 'paid',           label: 'PAID',            color: 'var(--green)',    count: paid   },
    { key: 'processing',     label: 'PROCESSING',      color: 'var(--cyan)',     count: proc   },
    { key: 'pending',        label: 'PENDING',         color: 'var(--text-dim)', count: pend   },
    { key: 'method_missing', label: 'SETUP REQUIRED',  color: 'var(--amber)',    count: miss   },
    { key: 'failed',         label: 'FAILED',          color: '#ff8f8f',         count: failed },
  ].filter((s) => s.count > 0);

  return (
    <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(77,255,128,0.10)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3"
        style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
        <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// PAYOUTS</p>
        <button
          onClick={exportCsv}
          className="mono text-xs transition-opacity hover:opacity-80"
          style={{ color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Export CSV ↓
        </button>
      </div>

      {/* Summary stats */}
      <div className="px-4 py-4" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-wrap gap-4 mb-4">
          {statusConfig.map((s) => (
            <div key={s.key}>
              <p className="mono text-xs mb-0.5" style={{ color: 'var(--text-dim)', fontSize: 10 }}>{s.label}</p>
              <p className="mono text-xl font-bold tabular-nums" style={{ color: s.color }}>{s.count}</p>
            </div>
          ))}
          {pendingApproval > 0 && (
            <div>
              <p className="mono text-xs mb-0.5" style={{ color: 'var(--text-dim)', fontSize: 10 }}>PENDING REVIEW</p>
              <p className="mono text-xl font-bold tabular-nums" style={{ color: 'var(--amber)' }}>{pendingApproval}</p>
            </div>
          )}
          <div>
            <p className="mono text-xs mb-0.5" style={{ color: 'var(--text-dim)', fontSize: 10 }}>TOTAL POOL</p>
            <p className="mono text-xl font-bold tabular-nums" style={{ color: 'var(--text-white)' }}>
              {fmt(eligibleApplicants.length * net)}
            </p>
          </div>
        </div>

        {/* Per-participant breakdown */}
        <div className="mono text-xs mb-4" style={{ color: 'var(--text-dim)' }}>
          {fmt(bountyPerParticipant)} gross − {fmt(fee)} fee (0.5%) = <span style={{ color: 'var(--green)' }}>{fmt(net)}</span> net per participant
        </div>

        {/* Escrow warning */}
        {experimentStatus === 'completed' && !bountyPoolDeposited && pend > 0 && (
          <div className="rounded px-3 py-2 mb-4 flex items-center gap-2"
            style={{ background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.2)' }}>
            <span style={{ color: 'var(--amber)', fontSize: 12 }}>⚠</span>
            <p className="mono text-xs" style={{ color: 'var(--amber)' }}>
              Escrow deposit must be confirmed before payouts can be processed.
            </p>
          </div>
        )}

        {/* Process payouts button */}
        {experimentStatus === 'completed' && (
          <div className="flex items-center gap-3 flex-wrap">
            {canProcessPayouts && (
              <button
                onClick={handleProcessPayouts}
                disabled={processing}
                className="mono text-xs px-4 py-2 rounded font-bold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--green)', color: '#050709' }}
              >
                {processing ? 'Processing...' : `Process ${pend} payout${pend !== 1 ? 's' : ''} →`}
              </button>
            )}
            {proc > 0 && (
              <span className="mono text-xs" style={{ color: 'var(--cyan)' }}>
                {proc} payment{proc !== 1 ? 's' : ''} in transit (2–5 business days)
              </span>
            )}
            {miss > 0 && (
              <span className="mono text-xs" style={{ color: 'var(--amber)' }}>
                {miss} participant{miss !== 1 ? 's' : ''} must set up payout method
              </span>
            )}
          </div>
        )}

        {experimentStatus !== 'completed' && (
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            Payouts can be processed once the study is marked completed.
          </p>
        )}

        {result && (
          <p className="mono text-xs mt-3" style={{ color: resultOk ? 'var(--green)' : 'var(--amber)' }}>
            {result}
          </p>
        )}
      </div>

      {/* Per-participant rows */}
      {payoutApplicants.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(77,255,128,0.06)' }}>
          {payoutApplicants.map((a, i) => {
            const isApplied = a.status === 'applied';
            const psColors: Record<string, string> = {
              paid:           'var(--green)',
              processing:     'var(--cyan)',
              pending:        'var(--text-dim)',
              method_missing: 'var(--amber)',
              failed:         '#ff8f8f',
            };
            const psLabels: Record<string, string> = {
              paid:           'PAID ✓',
              processing:     'PROCESSING',
              pending:        'PENDING',
              method_missing: 'SETUP REQUIRED',
              failed:         'FAILED',
            };
            const pc = isApplied ? 'var(--text-dim)' : (psColors[a.payout_status] ?? 'var(--text-dim)');
            const pl = isApplied ? 'UNDER REVIEW' : (psLabels[a.payout_status] ?? a.payout_status.toUpperCase());
            return (
              <div key={a.id}
                className="px-4 py-3 flex items-center justify-between gap-3"
                style={{
                  background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg2)',
                  borderTop:  i === 0 ? 'none' : '1px solid rgba(77,255,128,0.04)',
                }}>
                <span className="mono text-xs" style={{ color: 'var(--text-bright)' }}>
                  {a.participantProfile?.pseudonym ?? a.participant_id}
                </span>
                <div className="flex items-center gap-3">
                  <span className="mono text-xs tabular-nums" style={{ color: 'var(--text-dim)' }}>
                    {fmt(net)}
                  </span>
                  <span className="mono text-xs px-1.5 py-0.5 rounded"
                    style={{ color: pc, border: `1px solid ${pc}40`, background: `${pc}10`, fontSize: 9, letterSpacing: '0.5px' }}>
                    {pl}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
