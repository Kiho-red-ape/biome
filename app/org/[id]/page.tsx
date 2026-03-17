import { createAnonClient } from '@/lib/supabase/anon';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { ExperimentStatus } from '@/lib/types';
import { categoryColor } from '@/lib/utils/profile';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrgExp = {
  id: string;
  title: string;
  status: ExperimentStatus;
  bounty_per_participant: number;
  slots_total: number;
  slots_filled: number;
  category: string;
};

const STATUS_COLORS: Record<ExperimentStatus, string> = {
  recruiting: 'var(--green)',
  active:     'var(--cyan)',
  draft:      'var(--text-dim)',
  completed:  'var(--text-dim)',
  cancelled:  'var(--amber)',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OrgProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAnonClient();

  const { data: org } = await supabase
    .from('experimenter_profiles')
    .select('id, user_id, org_name, org_website, org_description, role_title, expertise_areas, screening_status, experiments_posted, verified_experiments, created_at')
    .eq('id', id)
    .single();

  if (!org) notFound();

  const { data: exps } = await supabase
    .from('experiments')
    .select('id, title, status, bounty_per_participant, slots_total, slots_filled, category')
    .eq('experimenter_id', org.user_id)
    .order('created_at', { ascending: false });

  const experiments = (exps ?? []) as OrgExp[];
  const approved = org.screening_status === 'approved';

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">

        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="mono text-xs no-underline" style={{ color: 'var(--text-dim)' }}>
            ← BACK
          </Link>
          <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            // EXPERIMENTER_PROFILE
          </span>
        </div>

        {/* ── Org header ───────────────────────────────────────────── */}
        <div
          className="rounded p-6 mb-4"
          style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.08)' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <h1
              className="text-2xl font-black leading-tight"
              style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}
            >
              {org.org_name}
            </h1>
            <span
              className="mono text-xs px-2.5 py-1 rounded flex items-center gap-1.5"
              style={{
                color:      approved ? 'var(--green)' : 'var(--amber)',
                background: approved ? 'rgba(77,255,128,0.06)' : 'rgba(255,179,0,0.06)',
                border:     `1px solid ${approved ? 'rgba(77,255,128,0.2)' : 'rgba(255,179,0,0.2)'}`,
              }}
            >
              <span className={approved ? 'blink' : ''}>●</span>
              {approved ? '✓ APPROVED' : 'PENDING REVIEW'}
            </span>
          </div>

          {org.role_title && (
            <p className="text-sm mb-3" style={{ color: 'var(--text-dim)' }}>{org.role_title}</p>
          )}

          {org.org_description && (
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-bright)' }}>
              {org.org_description}
            </p>
          )}

          {org.org_website && (
            <a
              href={org.org_website}
              target="_blank"
              rel="noopener noreferrer"
              className="mono text-xs inline-flex items-center gap-1 transition-opacity hover:opacity-80"
              style={{ color: 'var(--cyan)' }}
            >
              {org.org_website} ↗
            </a>
          )}

          {/* Expertise tags */}
          {org.expertise_areas && org.expertise_areas.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {(org.expertise_areas as string[]).map((area) => (
                <span
                  key={area}
                  className="mono text-xs px-2 py-0.5 rounded"
                  style={{
                    color:      categoryColor(area),
                    border:     `1px solid ${categoryColor(area)}30`,
                    background: `${categoryColor(area)}08`,
                  }}
                >
                  {area.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Stats row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'EXPERIMENTS POSTED',  value: String(org.experiments_posted)  },
            { label: 'BIOME VERIFIED',       value: String(org.verified_experiments) },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded p-4"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}
            >
              <p className="mono text-xs mb-1.5" style={{ color: 'var(--text-dim)' }}>{s.label}</p>
              <p className="mono text-2xl font-bold" style={{ color: 'var(--text-white)' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Experiments ──────────────────────────────────────────── */}
        <div
          className="rounded overflow-hidden"
          style={{ border: '1px solid rgba(77,255,128,0.08)' }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.06)' }}
          >
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// EXPERIMENTS</p>
            <span className="mono text-xs" style={{ color: 'var(--green)' }}>[{experiments.length}]</span>
          </div>

          {experiments.length === 0 ? (
            <div className="px-4 py-10 text-center" style={{ background: 'var(--bg)' }}>
              <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                // NO_EXPERIMENTS_POSTED
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" style={{ background: 'var(--bg)' }}>
              <table className="w-full border-collapse" style={{ minWidth: 500 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(77,255,128,0.06)' }}>
                    {['EXPERIMENT', 'STATUS', 'REWARD', 'SLOTS'].map((h) => (
                      <th key={h} className="mono text-xs font-normal px-4 py-2.5 text-left" style={{ color: 'var(--text-dim)' }}>
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
                      <tr key={e.id} style={{ borderBottom: '1px solid rgba(77,255,128,0.04)' }}>
                        <td className="px-4 py-3">
                          <Link href={`/experiments/${e.id}`} className="flex flex-col gap-1 no-underline">
                            <span className="text-sm font-medium" style={{ color: 'var(--text-bright)' }}>
                              {e.title}
                            </span>
                            <span
                              className="mono text-xs px-1.5 py-0.5 rounded self-start"
                              style={{ color: cc, border: `1px solid ${cc}30`, background: `${cc}08` }}
                            >
                              {e.category.toUpperCase()}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 mono text-xs uppercase" style={{ color: sc }}>
                          {e.status}
                        </td>
                        <td className="px-4 py-3 mono text-xs tabular-nums" style={{ color: 'var(--green)' }}>
                          ${e.bounty_per_participant.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1 rounded overflow-hidden" style={{ background: 'rgba(77,255,128,0.1)' }}>
                              <div className="h-1 rounded" style={{ width: `${pct}%`, background: 'var(--green-dim)' }} />
                            </div>
                            <span className="mono text-xs tabular-nums" style={{ color: 'var(--text-dim)' }}>
                              {e.slots_filled}/{e.slots_total}
                            </span>
                          </div>
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
