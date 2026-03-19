'use client';

import { useState } from 'react';
import { ScreeningDashboard } from '@/components/screening/screening-dashboard';
import type { ApplicantRow, ExpInfo } from '@/components/screening/screening-dashboard';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DemoExperiment = {
  id: string;
  title: string;
  category: string;
  status: string;
  bounty_per_participant: number;
  total_bounty_pool: number;
  slots_total: number;
  slots_filled: number;
  duration_weeks: number | null;
  is_remote: boolean;
  region: string | null;
  is_verified: boolean;
  verification_level: string;
  inclusion_criteria: string | null;
  exclusion_criteria: string | null;
  created_at: string;
};

type Tab = 'all' | 'recruiting' | 'active' | 'completed' | 'draft';

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
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Completion summary (for completed experiments) ───────────────────────────

function CompletionSummary({ exp }: { exp: DemoExperiment }) {
  const totalPaid = exp.bounty_per_participant * exp.slots_filled;
  return (
    <div className="mx-2 mb-3 mt-1 rounded p-5"
      style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.06)' }}>
      <p className="mono text-xs mb-4" style={{ color: 'var(--text-dim)' }}>// COMPLETION SUMMARY</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'PARTICIPANTS',  value: String(exp.slots_filled),               color: 'var(--green)' },
          { label: 'SLOTS TOTAL',   value: String(exp.slots_total)                                        },
          { label: 'TOTAL PAID',    value: `$${totalPaid.toLocaleString()}`,        color: 'var(--cyan)'  },
          { label: 'BOUNTY / P',    value: `$${exp.bounty_per_participant.toFixed(0)}`                    },
        ].map((s) => (
          <div key={s.label} className="rounded p-3"
            style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
            <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>{s.label}</p>
            <p className="mono text-lg font-bold" style={{ color: s.color ?? 'var(--text-white)' }}>{s.value}</p>
          </div>
        ))}
      </div>
      <p className="mono text-xs mt-3" style={{ color: 'var(--text-dim)' }}>
        Study completed — all slots filled. Final biomarker analysis in progress.
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DemoOrgClient({
  experiments,
  applicantsPerExp,
}: {
  experiments: DemoExperiment[];
  applicantsPerExp: Record<string, ApplicantRow[]>;
}) {
  const [tab,      setTab]      = useState<Tab>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const allTabs: { key: Tab; label: string }[] = [
    { key: 'all',        label: `ALL (${experiments.length})`                                                    },
    { key: 'recruiting', label: `RECRUITING (${experiments.filter((e) => e.status === 'recruiting').length})`    },
    { key: 'active',     label: `ACTIVE (${experiments.filter((e) => e.status === 'active').length})`            },
    { key: 'completed',  label: `COMPLETED (${experiments.filter((e) => e.status === 'completed').length})`      },
    { key: 'draft',      label: `DRAFT (${experiments.filter((e) => e.status === 'draft').length})`              },
  ];
  const tabs = allTabs.filter((t) => t.key === 'all' || experiments.some((e) => e.status === t.key));

  const filtered = tab === 'all' ? experiments : experiments.filter((e) => e.status === tab);

  return (
    <div>
      {/* ── Status tabs ── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setExpanded(null); }}
            className="mono text-xs px-3 py-1.5 rounded transition-all"
            style={{
              background: tab === t.key ? 'rgba(77,255,128,0.1)' : 'transparent',
              border:     `1px solid ${tab === t.key ? 'rgba(77,255,128,0.3)' : 'rgba(77,255,128,0.1)'}`,
              color:       tab === t.key ? 'var(--green)' : 'var(--text-dim)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Experiment list ── */}
      {filtered.length === 0 && (
        <div className="rounded py-12 text-center"
          style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.06)' }}>
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// No studies in this category.</p>
        </div>
      )}

      <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(77,255,128,0.08)' }}>
        {filtered.map((exp, i) => {
          const sc       = STATUS_COLORS[exp.status] ?? 'var(--text-dim)';
          const isOpen   = expanded === exp.id;
          const applicants = applicantsPerExp[exp.id] ?? [];
          const canExpand  = ['recruiting', 'active', 'completed'].includes(exp.status);

          const expInfo: ExpInfo = {
            id:                 exp.id,
            title:              exp.title,
            category:           exp.category,
            inclusion_criteria: exp.inclusion_criteria,
            exclusion_criteria: exp.exclusion_criteria,
            is_remote:          exp.is_remote,
            region:             exp.region,
            slots_total:        exp.slots_total,
            slots_filled:       exp.slots_filled,
          };

          return (
            <div
              key={exp.id}
              style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(77,255,128,0.06)' }}
            >
              {/* Row */}
              <div
                className="px-4 py-4"
                style={{ background: isOpen ? 'rgba(77,255,128,0.025)' : 'var(--bg)' }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Left: title + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="mono text-xs font-bold" style={{ color: sc }}>● {exp.status.toUpperCase()}</span>
                      <span className="mono text-xs px-1.5 py-0.5 rounded"
                        style={{ color: 'var(--text-dim)', border: '1px solid rgba(77,255,128,0.1)' }}>
                        {exp.category.toUpperCase()}
                      </span>
                      {exp.is_verified && (
                        <span className="mono text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(77,255,128,0.06)', border: '1px solid rgba(77,255,128,0.2)', color: 'var(--green)' }}>
                          ✓ BIOME VERIFIED
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-sm mb-1"
                      style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
                      {exp.title}
                    </p>
                    <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                      Posted {relDate(exp.created_at)}
                      {exp.duration_weeks && ` · ${exp.duration_weeks}wk`}
                      {exp.is_remote ? ' · Remote' : exp.region ? ` · ${exp.region}` : ''}
                    </p>
                  </div>

                  {/* Right: stats + expand */}
                  <div className="flex items-center gap-5 flex-shrink-0">
                    <div className="text-right">
                      <p className="mono text-sm font-bold" style={{ color: 'var(--green)' }}>
                        ${exp.bounty_per_participant.toFixed(0)}<span className="text-xs font-normal" style={{ color: 'var(--text-dim)' }}>/p</span>
                      </p>
                      <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                        {exp.slots_filled}/{exp.slots_total} slots
                      </p>
                    </div>

                    {canExpand && (
                      <button
                        onClick={() => setExpanded(isOpen ? null : exp.id)}
                        className="mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-80"
                        style={{
                          border:  `1px solid rgba(0,229,255,0.25)`,
                          color:   'var(--cyan)',
                          background: isOpen ? 'rgba(0,229,255,0.06)' : 'transparent',
                        }}
                      >
                        {isOpen ? 'Collapse ↑' : exp.status === 'completed' ? 'Summary ↓' : `Screen (${applicants.length}) ↓`}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded panel */}
              {isOpen && (
                <div style={{ background: 'var(--bg)', borderTop: '1px solid rgba(77,255,128,0.04)' }}>
                  {exp.status === 'completed' ? (
                    <CompletionSummary exp={exp} />
                  ) : (
                    <div className="px-2 py-3">
                      {applicants.length === 0 ? (
                        <p className="mono text-xs py-8 text-center" style={{ color: 'var(--text-dim)' }}>
                          // No applications yet for this study.
                        </p>
                      ) : (
                        <ScreeningDashboard
                          experimentId={exp.id}
                          privyDid=""
                          initialApplicants={applicants}
                          experiment={expInfo}
                          demoMode={true}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
