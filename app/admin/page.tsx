'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ExperimenterRow = {
  id: string;
  user_id: string;
  org_name: string;
  org_website: string | null;
  org_description: string | null;
  role_title: string | null;
  screening_status: string;
  created_at: string;
  profiles: {
    display_name: string | null;
    email: string | null;
    region: string | null;
  } | null;
};

type PayoutSummary = {
  experiment: {
    id: string; title: string; status: string;
    escrow_status: string | null; escrow_total: number | null; experiment_code: string | null;
  };
  summary: {
    total: number; paid: number; processing: number;
    pending: number; method_missing: number; failed: number;
    total_paid: number; total_net: number;
  };
  applications: Array<{
    id: string; participant_id: string; pseudonym: string;
    payout_status: string; payout_net_amount: number | null;
    payout_initiated_at: string | null; payout_completed_at: string | null;
    trolley_payment_id: string | null; payout_method_configured: boolean;
  }>;
};

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function relDate(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_COLOR: Record<string, string> = {
  approved: 'var(--green)',
  rejected: '#ff8f8f',
  pending:  'var(--amber)',
};

export default function AdminPage() {
  const { user, ready, authenticated } = usePrivy();
  const router = useRouter();

  const [profiles, setProfiles]   = useState<ExperimenterRow[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [denied,   setDenied]     = useState(false);
  const [acting,   setActing]     = useState<string | null>(null);
  const [msg,      setMsg]        = useState<string | null>(null);

  const [filter,      setFilter]      = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [activeTab,   setActiveTab]   = useState<'orgs' | 'payouts'>('orgs');

  // Payouts tab state
  const [expIdInput,  setExpIdInput]  = useState('');
  const [payoutData,  setPayoutData]  = useState<PayoutSummary | null>(null);
  const [payoutErr,   setPayoutErr]   = useState<string | null>(null);
  const [payoutLoad,  setPayoutLoad]  = useState(false);
  const [actionMsg,   setActionMsg]   = useState<string | null>(null);
  const [actioning,   setActioning]   = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin?privyDid=${encodeURIComponent(user.id)}`);
      if (res.status === 403) { setDenied(true); return; }
      const data = await res.json() as { profiles?: ExperimenterRow[] };
      setProfiles(data.profiles ?? []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) { router.replace('/'); return; }
    void load();
  }, [ready, authenticated, user, router, load]);

  async function act(profileId: string, action: 'approve' | 'reject') {
    if (!user) return;
    setActing(profileId);
    setMsg(null);
    const res  = await fetch('/api/admin', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid: user.id, profileId, action }),
    });
    const data = await res.json() as { profile?: { org_name: string; screening_status: string }; error?: string };
    if (!res.ok) {
      setMsg(`Error: ${data.error ?? 'Failed'}`);
    } else {
      setMsg(`✓ ${data.profile?.org_name} → ${data.profile?.screening_status}`);
      void load();
    }
    setActing(null);
  }

  async function loadPayouts() {
    if (!user || !expIdInput.trim()) return;
    setPayoutLoad(true);
    setPayoutErr(null);
    setPayoutData(null);
    try {
      const res  = await fetch(`/api/admin/payout-summary/${encodeURIComponent(expIdInput.trim())}?privyDid=${encodeURIComponent(user.id)}`);
      const data = await res.json() as PayoutSummary & { error?: string };
      if (!res.ok) { setPayoutErr(data.error ?? 'Failed'); return; }
      setPayoutData(data);
    } finally {
      setPayoutLoad(false);
    }
  }

  async function confirmDeposit(experimentId: string) {
    if (!user) return;
    setActioning(`deposit-${experimentId}`);
    setActionMsg(null);
    const res  = await fetch(`/api/admin/confirm-deposit/${experimentId}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid: user.id }),
    });
    const data = await res.json() as { message?: string; error?: string };
    setActionMsg(res.ok ? `✓ ${data.message ?? 'Deposit confirmed'}` : `Error: ${data.error ?? 'Failed'}`);
    setActioning(null);
    if (res.ok) void loadPayouts();
  }

  async function retryPayout(applicationId: string) {
    if (!user) return;
    setActioning(`retry-${applicationId}`);
    setActionMsg(null);
    const res  = await fetch(`/api/admin/retry-payout/${applicationId}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid: user.id }),
    });
    const data = await res.json() as { paymentId?: string; error?: string };
    setActionMsg(res.ok ? `✓ Retry initiated (${data.paymentId ?? ''})` : `Error: ${data.error ?? 'Failed'}`);
    setActioning(null);
    if (res.ok) void loadPayouts();
  }

  async function manualPayout(applicationId: string, netAmount: number) {
    if (!user) return;
    setActioning(`manual-${applicationId}`);
    setActionMsg(null);
    const res  = await fetch(`/api/admin/manual-payout/${applicationId}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid: user.id, netAmount }),
    });
    const data = await res.json() as { message?: string; error?: string };
    setActionMsg(res.ok ? `✓ ${data.message ?? 'Manual payout recorded'}` : `Error: ${data.error ?? 'Failed'}`);
    setActioning(null);
    if (res.ok) void loadPayouts();
  }

  const filtered = profiles.filter((p) => filter === 'all' || p.screening_status === filter);
  const counts   = {
    all:      profiles.length,
    pending:  profiles.filter((p) => p.screening_status === 'pending').length,
    approved: profiles.filter((p) => p.screening_status === 'approved').length,
    rejected: profiles.filter((p) => p.screening_status === 'rejected').length,
  };

  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// LOADING...</span>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="mono text-xs" style={{ color: '#ff8f8f' }}>// ACCESS_DENIED</p>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          This page is restricted to BIOME admins.
        </p>
        <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
          If you are the admin, run the migration and set is_admin = true for your account.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="mono text-xs mb-2" style={{ color: 'var(--green)' }}>// ADMIN_PANEL</p>
          <h1 className="text-2xl font-black mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-white)' }}>
            BIOME Admin
          </h1>
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            Experimenter profile approvals · logged in as {user?.email?.address ?? user?.id}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 p-1 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)', width: 'fit-content' }}>
          {(['orgs', 'payouts'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="mono text-xs px-4 py-2 rounded transition-all"
              style={{
                background: activeTab === t ? 'rgba(77,255,128,0.12)' : 'transparent',
                color:      activeTab === t ? 'var(--green)' : 'var(--text-dim)',
                border:     activeTab === t ? '1px solid rgba(77,255,128,0.2)' : '1px solid transparent',
              }}
            >
              {t === 'orgs' ? 'ORG APPROVALS' : 'PAYOUTS'}
            </button>
          ))}
        </div>

        {/* ── Payouts tab ── */}
        {activeTab === 'payouts' && (
          <div>
            {/* Experiment lookup */}
            <div className="rounded p-5 mb-6" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
              <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// EXPERIMENT_PAYOUT_LOOKUP</p>
              <div className="flex gap-3">
                <input
                  className="mono text-sm px-3 py-2 rounded flex-1 outline-none focus:ring-1 ring-green-400/30"
                  style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.12)', color: 'var(--text-bright)' }}
                  placeholder="Experiment ID (UUID)..."
                  value={expIdInput}
                  onChange={(e) => setExpIdInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void loadPayouts(); }}
                />
                <button
                  onClick={loadPayouts}
                  disabled={payoutLoad || !expIdInput.trim()}
                  className="mono text-xs px-4 py-2 rounded font-bold transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'var(--green)', color: '#050709' }}
                >
                  {payoutLoad ? '...' : 'Load →'}
                </button>
              </div>
              {payoutErr && <p className="mono text-xs mt-2" style={{ color: 'var(--amber)' }}>{payoutErr}</p>}
            </div>

            {/* Payout summary */}
            {payoutData && (() => {
              const { experiment: pExp, summary, applications: pApps } = payoutData;
              const escrowOk = pExp.escrow_status === 'deposited';
              return (
                <div>
                  {/* Experiment header */}
                  <div className="rounded p-4 mb-4" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="mono text-xs mb-0.5" style={{ color: 'var(--text-dim)' }}>
                          {pExp.experiment_code ?? pExp.id}
                        </p>
                        <Link href={`/dashboard/experiments/${pExp.id}`} target="_blank"
                          className="text-sm font-bold no-underline hover:opacity-80 transition-opacity"
                          style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
                          {pExp.title} ↗
                        </Link>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                            STATUS: <span style={{ color: 'var(--text-bright)' }}>{pExp.status.toUpperCase()}</span>
                          </span>
                          <span className="mono text-xs" style={{ color: escrowOk ? 'var(--green)' : 'var(--amber)' }}>
                            ESCROW: {(pExp.escrow_status ?? 'not_required').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      {!escrowOk && (
                        <button
                          onClick={() => confirmDeposit(pExp.id)}
                          disabled={actioning === `deposit-${pExp.id}`}
                          className="mono text-xs px-4 py-2 rounded font-bold transition-all hover:opacity-90 disabled:opacity-40"
                          style={{ background: 'var(--amber)', color: '#050709' }}
                        >
                          {actioning === `deposit-${pExp.id}` ? '...' : 'Confirm Deposit ✓'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary stats */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                    {[
                      { label: 'TOTAL',    value: summary.total,          color: 'var(--text-white)' },
                      { label: 'PENDING',  value: summary.pending,        color: 'var(--text-dim)'   },
                      { label: 'SETUP ✗',  value: summary.method_missing, color: 'var(--amber)'      },
                      { label: 'IN TRANSIT', value: summary.processing,   color: 'var(--cyan)'       },
                      { label: 'PAID',     value: summary.paid,           color: 'var(--green)'      },
                      { label: 'FAILED',   value: summary.failed,         color: '#ff8f8f'            },
                    ].map((s) => (
                      <div key={s.label} className="rounded p-3" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
                        <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)', fontSize: 9 }}>{s.label}</p>
                        <p className="mono text-lg font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mono text-xs mb-4" style={{ color: 'var(--text-dim)' }}>
                    Total paid: <span style={{ color: 'var(--green)' }}>{fmt(summary.total_paid)}</span>
                    &nbsp;· Total net pool: <span style={{ color: 'var(--text-bright)' }}>{fmt(summary.total_net)}</span>
                  </p>

                  {actionMsg && (
                    <p className="mono text-xs mb-4" style={{ color: actionMsg.startsWith('Error') ? 'var(--amber)' : 'var(--green)' }}>
                      {actionMsg}
                    </p>
                  )}

                  {/* Per-application rows */}
                  <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(77,255,128,0.08)' }}>
                    <div className="px-4 py-3" style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
                      <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// APPLICATIONS [{pApps.length}]</p>
                    </div>
                    {pApps.length === 0 ? (
                      <div className="px-4 py-8 text-center" style={{ background: 'var(--bg)' }}>
                        <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>No applications.</p>
                      </div>
                    ) : (
                      pApps.map((a, i) => {
                        const psColors: Record<string, string> = {
                          paid:           'var(--green)',
                          processing:     'var(--cyan)',
                          pending:        'var(--text-dim)',
                          method_missing: 'var(--amber)',
                          failed:         '#ff8f8f',
                        };
                        const pc = psColors[a.payout_status] ?? 'var(--text-dim)';
                        const canRetry  = ['failed', 'method_missing'].includes(a.payout_status) && a.payout_method_configured;
                        const canManual = a.payout_status !== 'paid';
                        return (
                          <div key={a.id}
                            className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
                            style={{
                              background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg2)',
                              borderTop: i === 0 ? 'none' : '1px solid rgba(77,255,128,0.04)',
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="mono text-xs" style={{ color: 'var(--text-bright)' }}>{a.pseudonym}</span>
                              <span className="mono text-xs px-1.5 py-0.5 rounded"
                                style={{ color: pc, border: `1px solid ${pc}40`, background: `${pc}10`, fontSize: 9 }}>
                                {a.payout_status.toUpperCase().replace('_', ' ')}
                              </span>
                              {a.payout_net_amount != null && (
                                <span className="mono text-xs tabular-nums" style={{ color: 'var(--text-dim)' }}>
                                  {fmt(a.payout_net_amount)}
                                </span>
                              )}
                              {!a.payout_method_configured && (
                                <span className="mono text-xs" style={{ color: 'var(--amber)', fontSize: 9 }}>no payout method</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {canRetry && (
                                <button
                                  onClick={() => retryPayout(a.id)}
                                  disabled={actioning === `retry-${a.id}`}
                                  className="mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-80 disabled:opacity-40"
                                  style={{ border: '1px solid rgba(0,229,255,0.3)', color: 'var(--cyan)' }}
                                >
                                  {actioning === `retry-${a.id}` ? '...' : 'Retry →'}
                                </button>
                              )}
                              {canManual && (
                                <button
                                  onClick={() => manualPayout(a.id, a.payout_net_amount ?? 0)}
                                  disabled={actioning === `manual-${a.id}`}
                                  className="mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-70 disabled:opacity-40"
                                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-dim)' }}
                                >
                                  {actioning === `manual-${a.id}` ? '...' : 'Mark paid'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Org approvals tab ── */}
        {activeTab === 'orgs' && <>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded p-3 text-left transition-all hover:opacity-80"
              style={{
                background: filter === f ? 'rgba(77,255,128,0.08)' : 'var(--bg2)',
                border: `1px solid ${filter === f ? 'rgba(77,255,128,0.3)' : 'rgba(77,255,128,0.06)'}`,
              }}
            >
              <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>{f.toUpperCase()}</p>
              <p className="mono text-xl font-bold" style={{ color: STATUS_COLOR[f] ?? 'var(--text-white)' }}>
                {counts[f]}
              </p>
            </button>
          ))}
        </div>

        {msg && (
          <p className="mono text-xs mb-4" style={{ color: msg.startsWith('Error') ? 'var(--amber)' : 'var(--green)' }}>
            {msg}
          </p>
        )}

        {/* Profiles table */}
        {filtered.length === 0 ? (
          <div className="rounded px-6 py-10 text-center" style={{ border: '1px solid rgba(77,255,128,0.06)' }}>
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              No {filter === 'all' ? '' : filter} profiles.
            </p>
          </div>
        ) : (
          <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(77,255,128,0.1)' }}>
            {filtered.map((p, i) => (
              <div
                key={p.id}
                className="px-5 py-4 flex flex-wrap items-start gap-4"
                style={{
                  background: i % 2 === 0 ? 'var(--bg2)' : 'var(--bg)',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(77,255,128,0.05)' : 'none',
                }}
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <p className="mono text-sm font-bold" style={{ color: 'var(--text-bright)' }}>
                      {p.org_name}
                    </p>
                    <span
                      className="mono text-xs px-2 py-0.5 rounded"
                      style={{
                        color: STATUS_COLOR[p.screening_status] ?? 'var(--text-dim)',
                        border: `1px solid ${STATUS_COLOR[p.screening_status] ?? 'rgba(255,255,255,0.1)'}40`,
                        background: `${STATUS_COLOR[p.screening_status] ?? 'rgba(255,255,255,0.05)'}12`,
                      }}
                    >
                      {p.screening_status.toUpperCase()}
                    </span>
                  </div>
                  <p className="mono text-xs mb-0.5" style={{ color: 'var(--text-dim)' }}>
                    {p.profiles?.display_name ?? 'No name'}
                    {p.profiles?.email && <> · {p.profiles.email}</>}
                    {p.profiles?.region && <> · {p.profiles.region}</>}
                  </p>
                  {p.role_title && (
                    <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{p.role_title}</p>
                  )}
                  {p.org_description && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-dim)', maxWidth: 500 }}>
                      {p.org_description.slice(0, 140)}{p.org_description.length > 140 ? '…' : ''}
                    </p>
                  )}
                  {p.org_website && (
                    <a href={p.org_website} target="_blank" rel="noopener noreferrer"
                      className="mono text-xs" style={{ color: 'var(--cyan)' }}>
                      {p.org_website}
                    </a>
                  )}
                  <p className="mono text-xs mt-1" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
                    Applied {relDate(p.created_at)}
                  </p>
                </div>

                {/* Actions */}
                {p.screening_status === 'pending' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => act(p.id, 'approve')}
                      disabled={acting === p.id}
                      className="mono text-xs px-4 py-2 rounded font-bold transition-all hover:opacity-90 disabled:opacity-40"
                      style={{ background: 'var(--green)', color: '#050709' }}
                    >
                      {acting === p.id ? '...' : 'Approve ✓'}
                    </button>
                    <button
                      onClick={() => act(p.id, 'reject')}
                      disabled={acting === p.id}
                      className="mono text-xs px-4 py-2 rounded transition-all hover:opacity-80 disabled:opacity-40"
                      style={{ border: '1px solid rgba(255,100,100,0.3)', color: '#ff8f8f' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {p.screening_status === 'approved' && (
                  <button
                    onClick={() => act(p.id, 'reject')}
                    disabled={acting === p.id}
                    className="mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-70 disabled:opacity-40 flex-shrink-0"
                    style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-dim)' }}
                  >
                    Revoke
                  </button>
                )}
                {p.screening_status === 'rejected' && (
                  <button
                    onClick={() => act(p.id, 'approve')}
                    disabled={acting === p.id}
                    className="mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-80 disabled:opacity-40 flex-shrink-0"
                    style={{ border: '1px solid rgba(77,255,128,0.2)', color: 'var(--green)' }}
                  >
                    Re-approve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        </> /* end orgs tab */}

      </div>
    </main>
  );
}
