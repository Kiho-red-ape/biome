'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  OpsPageHeader, OpsCard, OpsBadge, OpsButton, OpsTabs,
  OpsTable, OpsTd, OpsEmpty, OpsAlert,
} from '../_components/ui';

// ─── Types (mirror /api/ops/agent GET response) ──────────────────────────────
interface Flagged {
  id: string;
  participantId: string;
  stage: string;
  experimentId: string | null;
  reason: string | null;
  lastMessage: string | null;
  updatedAt: string;
}
interface Funnel {
  signedUp: number;
  aware: number;
  verified: number;
  communityBuilder: number;
}
interface Referrals {
  totalSent: number;
  signedUp: number;
  awarenessComplete: number;
  builders: number;
}
interface PoolReadiness {
  verifiedCount: number;
  bySample: Record<string, number>;
  byLocation: Record<string, number>;
}
interface Consent {
  id: string;
  participantId: string;
  experimentId: string | null;
  icfVersion: string | null;
  quizScore: number | null;
  quizPassed: boolean | null;
  consentGiven: boolean | null;
  consentAt: string | null;
  withdrawn: boolean | null;
}
interface AgentData {
  flagged: Flagged[];
  funnel: Funnel;
  referrals: Referrals;
  poolReadiness: PoolReadiness;
  consent: Consent[];
}

type TabKey = 'flagged' | 'funnel' | 'consent' | 'referrals' | 'pool';
type BadgeTone = 'teal' | 'green' | 'amber' | 'red' | 'slate' | 'blue';

const STAGE_TONE: Record<string, BadgeTone> = {
  onboard: 'blue',
  screen: 'amber',
  consent: 'teal',
  support: 'slate',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const secs = Math.floor((Date.now() - then) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function truncId(id: string | null): string {
  if (!id) return '—';
  return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

function pct(part: number, whole: number): string {
  if (!whole) return '0%';
  return `${Math.round((part / whole) * 100)}%`;
}

// ─── Funnel stat strip ───────────────────────────────────────────────────────
function FunnelStrip({ funnel }: { funnel: Funnel }) {
  const tiles: { label: string; value: number; accent?: boolean }[] = [
    { label: 'Signed up', value: funnel.signedUp, accent: true },
    { label: 'Aware', value: funnel.aware },
    { label: 'Verified', value: funnel.verified },
    { label: 'Community builder', value: funnel.communityBuilder },
  ];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: 12, marginBottom: 24,
    }}>
      {tiles.map((t) => (
        <div key={t.label} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-sm)',
          padding: '14px 16px',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '1px',
            textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6,
          }}>
            {t.label}
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, lineHeight: 1,
            color: t.accent ? 'var(--teal-dark)' : 'var(--ink)',
          }}>
            {t.value}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 6,
          }}>
            {t.accent ? '100% of signed-up' : `${pct(t.value, funnel.signedUp)} of signed-up`}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Flagged tab ─────────────────────────────────────────────────────────────
function FlaggedTab({
  rows, onResolve,
}: {
  rows: Flagged[];
  onResolve: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState<string | null>(null);

  async function resolve(id: string) {
    setErr(null);
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await onResolve(id);
    } catch {
      setErr('Failed to resolve conversation. Please retry.');
      setBusy((b) => ({ ...b, [id]: false }));
    }
  }

  if (rows.length === 0) {
    return (
      <OpsCard>
        <table style={{ width: '100%' }}>
          <tbody><OpsEmpty>No conversations need attention.</OpsEmpty></tbody>
        </table>
      </OpsCard>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {err && <OpsAlert tone="err">{err}</OpsAlert>}
      {rows.map((c) => (
        <OpsCard key={c.id} style={{ padding: '18px 20px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            gap: 12, flexWrap: 'wrap', marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <OpsBadge tone={STAGE_TONE[c.stage] ?? 'slate'}>{c.stage}</OpsBadge>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)' }}>
                {truncId(c.participantId)}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                {timeAgo(c.updatedAt)}
              </span>
            </div>
            <OpsButton variant="primary" disabled={busy[c.id]} onClick={() => void resolve(c.id)}>
              {busy[c.id] ? 'Resolving…' : 'Resolve'}
            </OpsButton>
          </div>

          {c.reason && (
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)',
              margin: '0 0 10px', lineHeight: 1.5,
            }}>
              {c.reason}
            </p>
          )}

          {c.lastMessage && (
            <blockquote style={{
              margin: 0, padding: '10px 14px',
              background: 'var(--bg-page)',
              borderLeft: '3px solid var(--border-mid)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)',
              lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {c.lastMessage}
            </blockquote>
          )}
        </OpsCard>
      ))}
    </div>
  );
}

// ─── Awareness funnel tab ────────────────────────────────────────────────────
function FunnelTab({ funnel }: { funnel: Funnel }) {
  const stages: { label: string; value: number; tone: string }[] = [
    { label: 'Signed up', value: funnel.signedUp, tone: 'var(--teal-dark)' },
    { label: 'Aware', value: funnel.aware, tone: 'var(--teal)' },
    { label: 'Verified', value: funnel.verified, tone: '#0369a1' },
    { label: 'Community builder', value: funnel.communityBuilder, tone: '#15803d' },
  ];
  const max = Math.max(funnel.signedUp, 1);

  const conversions: { from: string; to: string; rate: string }[] = [
    { from: 'Signed up', to: 'Aware', rate: pct(funnel.aware, funnel.signedUp) },
    { from: 'Aware', to: 'Verified', rate: pct(funnel.verified, funnel.aware) },
    { from: 'Verified', to: 'Community builder', rate: pct(funnel.communityBuilder, funnel.verified) },
  ];

  return (
    <OpsCard style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {stages.map((s) => (
          <div key={s.label}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              marginBottom: 6,
            }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>
                {s.label}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--slate)' }}>
                {s.value}
                <span style={{ color: 'var(--muted)', marginLeft: 8 }}>
                  {pct(s.value, funnel.signedUp)}
                </span>
              </span>
            </div>
            <div style={{
              height: 12, background: 'var(--bg-page)',
              border: '1px solid var(--border-soft)', borderRadius: 999, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.max((s.value / max) * 100, s.value > 0 ? 2 : 0)}%`,
                background: s.tone, borderRadius: 999, transition: 'width 200ms',
              }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border-soft)',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12,
      }}>
        {conversions.map((c) => (
          <div key={`${c.from}-${c.to}`}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '1px',
              textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4,
            }}>
              {c.from} → {c.to}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--ink)',
            }}>
              {c.rate}
            </div>
          </div>
        ))}
      </div>
    </OpsCard>
  );
}

// ─── Consent audit tab ───────────────────────────────────────────────────────
function ConsentTab({ rows }: { rows: Consent[] }) {
  function exportCsv() {
    const header = ['participant_id', 'experiment_id', 'icf_version', 'quiz_score', 'quiz_passed', 'consent_given', 'withdrawn', 'consent_at'];
    const esc = (v: string | number | boolean | null): string => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      header.join(','),
      ...rows.map((r) => [
        r.participantId, r.experimentId, r.icfVersion, r.quizScore,
        r.quizPassed, r.consentGiven, r.withdrawn, r.consentAt,
      ].map(esc).join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consent-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <OpsButton variant="ghost" disabled={rows.length === 0} onClick={exportCsv}>
          Export CSV
        </OpsButton>
      </div>
      <OpsTable head={['Participant', 'Study', 'ICF ver', 'Quiz', 'Consent', 'When', '']}>
        {rows.length === 0 && <OpsEmpty>No consent records yet.</OpsEmpty>}
        {rows.map((r) => (
          <tr key={r.id}>
            <OpsTd mono dim nowrap>{truncId(r.participantId)}</OpsTd>
            <OpsTd mono dim nowrap>{truncId(r.experimentId)}</OpsTd>
            <OpsTd mono>{r.icfVersion ?? '—'}</OpsTd>
            <OpsTd nowrap>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {r.quizScore ?? '—'}
                </span>
                {r.quizPassed === true && <OpsBadge tone="green">Pass</OpsBadge>}
                {r.quizPassed === false && <OpsBadge tone="red">Fail</OpsBadge>}
              </span>
            </OpsTd>
            <OpsTd nowrap>
              {r.withdrawn
                ? <OpsBadge tone="red">Withdrawn</OpsBadge>
                : r.consentGiven
                  ? <OpsBadge tone="green">Given</OpsBadge>
                  : <OpsBadge tone="slate">No</OpsBadge>}
            </OpsTd>
            <OpsTd mono dim nowrap>{fmtDate(r.consentAt)}</OpsTd>
            <OpsTd>{null}</OpsTd>
          </tr>
        ))}
      </OpsTable>
    </div>
  );
}

// ─── Referrals tab ───────────────────────────────────────────────────────────
function ReferralsTab({ referrals }: { referrals: Referrals }) {
  const tiles: { label: string; value: number }[] = [
    { label: 'Invites sent', value: referrals.totalSent },
    { label: 'Signed up', value: referrals.signedUp },
    { label: 'Awareness complete', value: referrals.awarenessComplete },
    { label: 'Community builders', value: referrals.builders },
  ];
  return (
    <div>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)',
        margin: '0 0 16px', lineHeight: 1.5,
      }}>
        Community growth — invites that convert into research-aware contributors.
      </p>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12,
      }}>
        {tiles.map((t) => (
          <OpsCard key={t.label} style={{ padding: '14px 16px' }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '1px',
              textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6,
            }}>
              {t.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, lineHeight: 1,
              color: 'var(--ink)',
            }}>
              {t.value}
            </div>
          </OpsCard>
        ))}
      </div>
    </div>
  );
}

// ─── Pool readiness tab ──────────────────────────────────────────────────────
function PoolTab({ pool }: { pool: PoolReadiness }) {
  if (pool.verifiedCount === 0) {
    return (
      <OpsCard>
        <table style={{ width: '100%' }}>
          <tbody><OpsEmpty>No verified participants ready to match yet.</OpsEmpty></tbody>
        </table>
      </OpsCard>
    );
  }

  const sample = Object.entries(pool.bySample).sort((a, b) => b[1] - a[1]);
  const location = Object.entries(pool.byLocation).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <OpsCard style={{ padding: '20px 24px' }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '1px',
          textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8,
        }}>
          Verified participants ready to match
        </div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 40, lineHeight: 1,
          color: 'var(--teal-dark)',
        }}>
          {pool.verifiedCount}
        </div>
      </OpsCard>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16,
      }}>
        <BreakdownList title="By sample comfort" rows={sample} />
        <BreakdownList title="By location" rows={location} />
      </div>
    </div>
  );
}

function BreakdownList({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <OpsCard style={{ padding: '16px 18px' }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '1px',
        textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 12,
      }}>
        {title}
      </div>
      {rows.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>
          No data.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map(([label, count]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink)' }}>
                {label}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--slate)',
              }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </OpsCard>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ParticipantsAgentPage() {
  const [data, setData] = useState<AgentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('flagged');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ops/agent');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AgentData;
      setData(json);
    } catch {
      setError('Could not load the agent console. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function resolveConversation(id: string) {
    const res = await fetch('/api/ops/agent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: id, action: 'resolve' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setData((prev) => prev
      ? { ...prev, flagged: prev.flagged.filter((f) => f.id !== id) }
      : prev);
  }

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'flagged', label: 'Flagged', count: data?.flagged.length },
    { key: 'funnel', label: 'Awareness funnel' },
    { key: 'consent', label: 'Consent audit', count: data?.consent.length },
    { key: 'referrals', label: 'Referrals' },
    { key: 'pool', label: 'Pool readiness' },
  ];

  return (
    <div>
      <OpsPageHeader
        label="Participants"
        title="Agent Console"
        subtitle="Conversational onboarding, awareness, consent & growth"
      />

      {loading && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
          Loading agent console…
        </p>
      )}

      {!loading && error && (
        <>
          <OpsAlert tone="err">{error}</OpsAlert>
          <OpsButton variant="ghost" onClick={() => void load()}>Retry</OpsButton>
        </>
      )}

      {!loading && !error && data && (
        <>
          <FunnelStrip funnel={data.funnel} />

          <OpsTabs tabs={tabs} active={tab} onChange={setTab} />

          {tab === 'flagged' && (
            <FlaggedTab rows={data.flagged} onResolve={resolveConversation} />
          )}
          {tab === 'funnel' && <FunnelTab funnel={data.funnel} />}
          {tab === 'consent' && <ConsentTab rows={data.consent} />}
          {tab === 'referrals' && <ReferralsTab referrals={data.referrals} />}
          {tab === 'pool' && <PoolTab pool={data.poolReadiness} />}
        </>
      )}
    </div>
  );
}
