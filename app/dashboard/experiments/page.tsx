'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { categoryColor } from '@/lib/utils/profile';

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
  draft:      'var(--text-dim)',
  recruiting: 'var(--green)',
  active:     'var(--cyan)',
  completed:  'var(--text-dim)',
  cancelled:  'var(--amber)',
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

        if (!epData.profile) { router.replace('/onboarding/experimenter'); return; }
        setOrgId(epData.profile.id);

        const exRes  = await fetch(`/api/experiments/mine?privyDid=${encodeURIComponent(user!.id)}`);
        const exData = (await exRes.json()) as { experiments?: ExpRow[] };
        setExperiments(exData.experiments ?? []);
      } catch {
        setError('Failed to load experiments');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [ready, authenticated, user, router]);

  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// LOADING...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="mono text-xs" style={{ color: 'var(--amber)' }}>// ERROR: {error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="mono text-xs no-underline" style={{ color: 'var(--text-dim)' }}>
            ← BIOME
          </Link>
          <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// MY_STUDIES</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black mb-1"
              style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
              My Studies
            </h1>
            {orgId && (
              <Link href={`/org/${orgId}`} className="mono text-xs no-underline transition-opacity hover:opacity-80"
                style={{ color: 'var(--text-dim)' }}>
                View org profile ↗
              </Link>
            )}
          </div>
          <Link
            href="/post"
            className="mono text-xs px-4 py-2.5 rounded font-bold no-underline transition-all hover:opacity-90"
            style={{ background: 'var(--green)', color: '#050709' }}
          >
            + Post new study
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'TOTAL',      value: String(experiments.length)                                                    },
            { label: 'RECRUITING', value: String(experiments.filter((e) => e.status === 'recruiting').length)           },
            { label: 'ACTIVE',     value: String(experiments.filter((e) => e.status === 'active').length)               },
            { label: 'COMPLETED',  value: String(experiments.filter((e) => e.status === 'completed').length)            },
          ].map((s) => (
            <div key={s.label} className="rounded p-4"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
              <p className="mono text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>{s.label}</p>
              <p className="mono text-xl font-bold" style={{ color: 'var(--text-white)' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Experiments table */}
        <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(77,255,128,0.08)' }}>
          <div className="px-4 py-3 flex items-center gap-2"
            style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// EXPERIMENTS</p>
            <span className="mono text-xs" style={{ color: 'var(--green)' }}>[{experiments.length}]</span>
          </div>

          {experiments.length === 0 ? (
            <div className="px-4 py-16 text-center" style={{ background: 'var(--bg)' }}>
              <p className="mono text-xs mb-4" style={{ color: 'var(--text-dim)' }}>
                {'>'}_{'  '}No studies posted yet.
              </p>
              <Link href="/post" className="mono text-xs no-underline transition-opacity hover:opacity-80"
                style={{ color: 'var(--green)' }}>
                Post your first study →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto" style={{ background: 'var(--bg)' }}>
              <table className="w-full border-collapse" style={{ minWidth: 700 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(77,255,128,0.06)', background: 'var(--bg2)' }}>
                    {['STUDY', 'STATUS', 'SLOTS', 'REWARD', 'POSTED', ''].map((h) => (
                      <th key={h} className="mono text-xs font-normal px-4 py-2.5 text-left"
                        style={{ color: 'var(--text-dim)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {experiments.map((e) => {
                    const sc  = STATUS_COLORS[e.status] ?? 'var(--text-dim)';
                    const cc  = categoryColor(e.category);
                    const pct = e.slots_total > 0 ? (e.slots_filled / e.slots_total) * 100 : 0;
                    return (
                      <tr key={e.id}
                        style={{ borderBottom: '1px solid rgba(77,255,128,0.04)' }}
                        className="hover:bg-opacity-5"
                      >
                        <td className="px-4 py-3 max-w-xs">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium truncate" style={{ color: 'var(--text-bright)' }}>
                              {e.title}
                            </span>
                            <span className="mono text-xs px-1.5 py-0.5 rounded self-start"
                              style={{ color: cc, border: `1px solid ${cc}30`, background: `${cc}08` }}>
                              {e.category.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 mono text-xs uppercase" style={{ color: sc }}>
                          ● {e.status}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1 rounded overflow-hidden"
                              style={{ background: 'rgba(77,255,128,0.08)' }}>
                              <div className="h-1 rounded"
                                style={{ width: `${pct}%`, background: pct >= 90 ? 'var(--amber)' : 'var(--green-dim)' }} />
                            </div>
                            <span className="mono text-xs tabular-nums" style={{ color: 'var(--text-dim)' }}>
                              {e.slots_filled}/{e.slots_total}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 mono text-xs tabular-nums" style={{ color: 'var(--green)' }}>
                          ${e.bounty_per_participant.toFixed(0)}/p
                        </td>
                        <td className="px-4 py-3 mono text-xs" style={{ color: 'var(--text-dim)' }}>
                          {relDate(e.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/dashboard/experiments/${e.id}`}
                            className="mono text-xs no-underline transition-opacity hover:opacity-80 px-3 py-1.5 rounded"
                            style={{ color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.2)' }}
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
