'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { SiteHeader } from '@/components/nav/header';

type ExpRow = {
  id: string;
  title: string;
  status: string;
  category: string;
  bounty_per_participant: number;
  total_bounty_pool: number;
  slots_total: number;
  slots_filled: number;
  is_verified: boolean;
  launch_date: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft:      'var(--muted)',
  recruiting: 'var(--teal)',
  active:     'var(--teal-dark)',
  completed:  'var(--muted)',
  cancelled:  '#dc2626',
};

function relDate(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30)  return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function MyExperimentsPage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();

  const [orgId,        setOrgId]        = useState<string | null>(null);
  const [orgStatus,    setOrgStatus]    = useState<string | null>(null);
  const [experiments,  setExperiments]  = useState<ExpRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) { router.replace('/'); return; }

    async function load() {
      try {
        const epRes  = await fetch(`/api/experimenter-profile?privyDid=${encodeURIComponent(user!.id)}`);
        const epData = (await epRes.json()) as { profile?: { id: string; screening_status: string } | null };

        // Org access is invitation-only — a non-org account can't self-onboard here.
        if (!epData.profile) { router.replace('/dashboard'); return; }
        setOrgId(epData.profile.id);
        setOrgStatus(epData.profile.screening_status ?? null);

        const exRes  = await fetch(`/api/experiments/mine?privyDid=${encodeURIComponent(user!.id)}`);
        const exData = (await exRes.json()) as { experiments?: ExpRow[] };
        setExperiments(exData.experiments ?? []);
      } catch {
        setError('Failed to load studies');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [ready, authenticated, user, router]);

  if (!ready || loading) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <SiteHeader />
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)' }}>
            Loading studies...
          </span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <SiteHeader />
        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#dc2626' }}>Error: {error}</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <SiteHeader />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Review-status banner — the dashboard must reflect where the org stands */}
        {orgStatus === 'pending' && (
          <div style={{
            marginBottom: 20, padding: '14px 18px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.25)',
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
              <strong>Your organization is under review.</strong> You can prepare drafts, but
              posting studies unlocks once the BIOME team approves your profile — you&apos;ll
              get an email and an in-app notification the moment that happens.
            </p>
          </div>
        )}
        {orgStatus === 'rejected' && (
          <div style={{
            marginBottom: 20, padding: '14px 18px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.25)',
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#991b1b', margin: 0, lineHeight: 1.5 }}>
              <strong>Your organization was not approved.</strong> If you believe this is a
              mistake, contact <a href="mailto:hello@biome.to" style={{ color: '#991b1b' }}>hello@biome.to</a>.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
              My Studies
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--ink)', lineHeight: 1.2, margin: 0 }}>
              Studies
            </h1>
            <div className="flex items-center flex-wrap" style={{ gap: 16 }}>
              {orgId && (
                <Link href={`/org/${orgId}`}
                  className="no-underline transition-opacity hover:opacity-80"
                  style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--teal-dark)' }}>
                  View researcher profile ↗
                </Link>
              )}
              <Link href="/dashboard/org"
                className="no-underline transition-opacity hover:opacity-80"
                style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--teal-dark)' }}>
                Organization →
              </Link>
            </div>
          </div>
          <Link
            href="/post"
            className="no-underline transition-opacity hover:opacity-90"
            style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, padding: '10px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--teal)', color: '#ffffff' }}
          >
            + Post new study
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0"
          style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', background: 'var(--surface)', overflow: 'hidden', marginBottom: 24 }}>
          {[
            { label: 'Total',      value: String(experiments.length)                                          },
            { label: 'Recruiting', value: String(experiments.filter((e) => e.status === 'recruiting').length) },
            { label: 'Active',     value: String(experiments.filter((e) => e.status === 'active').length)     },
            { label: 'Completed',  value: String(experiments.filter((e) => e.status === 'completed').length)  },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: '20px', borderRight: i < 3 ? '1px solid var(--border-soft)' : 'none' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 22, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Studies table */}
        <div style={{ border: '1px solid var(--border-soft)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', background: 'var(--surface)' }}>
          <div className="flex items-center gap-2"
            style={{ padding: '14px 24px', background: 'var(--bg-page)', borderBottom: '1px solid var(--border-soft)' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--slate)' }}>Studies</p>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--teal-dark)' }}>{experiments.length}</span>
          </div>

          {experiments.length === 0 ? (
            <div className="text-center" style={{ padding: '64px 24px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>
                No studies posted yet.
              </p>
              <Link href="/post" className="no-underline transition-opacity hover:opacity-80"
                style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--teal-dark)' }}>
                Post your first study →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-soft)', background: 'var(--bg-page)' }}>
                    {['Study', 'Status', 'Slots', 'Reward', 'Posted', ''].map((h) => (
                      <th key={h} className="text-left"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', padding: '12px 16px' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {experiments.map((e, idx) => {
                    const sc  = STATUS_COLORS[e.status] ?? 'var(--muted)';
                    const pct = e.slots_total > 0 ? (e.slots_filled / e.slots_total) * 100 : 0;
                    return (
                      <tr key={e.id}
                        style={{ borderBottom: idx < experiments.length - 1 ? '1px solid var(--border-soft)' : 'none' }}
                      >
                        <td className="max-w-xs" style={{ padding: '16px' }}>
                          <div className="flex flex-col gap-1.5">
                            <span className="truncate" style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                              {e.title}
                            </span>
                            <span className="self-start"
                              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--teal-dark)', background: 'var(--teal-faint)', borderRadius: '4px', padding: '2px 6px' }}>
                              {e.category}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="inline-flex items-center gap-1.5" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: sc }}>
                            <span>●</span> {e.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div className="flex items-center gap-2">
                            <div className="overflow-hidden" style={{ width: 64, height: 4, borderRadius: 4, background: 'var(--bg-page)' }}>
                              <div style={{ height: 4, borderRadius: 4, width: `${pct}%`, background: pct >= 90 ? 'var(--teal-dark)' : 'var(--teal)' }} />
                            </div>
                            <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
                              {e.slots_filled}/{e.slots_total}
                            </span>
                          </div>
                        </td>
                        <td className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--teal-dark)', padding: '16px' }}>
                          ${e.bounty_per_participant.toFixed(0)}/p
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', padding: '16px' }}>
                          {relDate(e.created_at)}
                        </td>
                        <td className="text-right" style={{ padding: '16px' }}>
                          <Link
                            href={`/dashboard/experiments/${e.id}`}
                            className="no-underline transition-opacity hover:opacity-80"
                            style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--teal-dark)', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)', padding: '6px 12px' }}
                          >
                            Manage →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
