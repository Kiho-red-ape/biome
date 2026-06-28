'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { OpsPageHeader, OpsCard, OpsBadge, OpsButton } from '../_components/ui';

type LaunchRequest = {
  id: string;
  title: string;
  category: string | null;
  slotsTotal: number | null;
  bountyPerParticipant: number | null;
  totalPool: number | null;
  orgName: string;
  requestedAt: string | null;
};

function relDate(d: string | null): string {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function OpsLaunchRequestsPage() {
  const { user } = usePrivy();

  const [requests, setRequests] = useState<LaunchRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [working,  setWorking]  = useState<string | null>(null);
  const [note,     setNote]     = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/ops/launch-requests');
      const data = await res.json() as { requests?: LaunchRequest[] };
      setRequests(data.requests ?? []);
    } catch {
      setError('Failed to load launch requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function confirm(req: LaunchRequest) {
    if (!user) return;
    setWorking(req.id);
    setError(null);
    setNote(null);
    try {
      const res = await fetch('/api/ops/launch-requests', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ experimentId: req.id, operatorPrivyDid: user.id, action: 'confirm_paid' }),
      });
      const data = await res.json() as { ok?: boolean; status?: string; stage0?: string; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Failed to confirm payment.');
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      setNote(`"${req.title}" is now recruiting — Stage 0 find agent queued.`);
    } catch {
      setError('Failed to confirm payment.');
    } finally {
      setWorking(null);
    }
  }

  return (
    <div>
      <OpsPageHeader
        label="Operations"
        title="Launch Requests"
        subtitle="Confirm deposits and open recruiting"
      />

      {note && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '11px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20, background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.25)', color: '#15803d' }}>
          {note}
        </div>
      )}
      {error && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '11px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>Loading…</p>
      ) : requests.length === 0 ? (
        <OpsCard style={{ padding: 40 }}>
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            No studies are awaiting payment confirmation.
          </p>
        </OpsCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map((req) => (
            <OpsCard key={req.id} style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)', margin: '0 0 4px' }}>
                    {req.title}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', margin: 0 }}>
                    {req.orgName} · requested {relDate(req.requestedAt)}
                  </p>
                </div>
                {req.category && <OpsBadge tone="slate">{req.category}</OpsBadge>}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
                {[
                  ['Slots',           req.slotsTotal != null ? String(req.slotsTotal) : '—'],
                  ['Comp / participant', req.bountyPerParticipant != null ? `$${req.bountyPerParticipant.toLocaleString()}` : '—'],
                  ['Total pool',      req.totalPool != null ? `$${req.totalPool.toLocaleString()}` : '—'],
                ].map(([k, v]) => (
                  <span key={k} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)' }}>
                    <span style={{ color: 'var(--muted)' }}>{k}:</span> {v}
                  </span>
                ))}
              </div>

              <OpsButton onClick={() => confirm(req)} disabled={working === req.id}>
                {working === req.id ? 'Confirming…' : 'Confirm payment & open recruiting →'}
              </OpsButton>
            </OpsCard>
          ))}
        </div>
      )}
    </div>
  );
}
