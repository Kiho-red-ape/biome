'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/nav/header';

// ─── Baked Ashwagandha KSM-66 demo data ──────────────────────────────────────

const DEMO_EXPERIMENT = {
  id: 'demo-ashwagandha-ksm66',
  title: 'Ashwagandha KSM-66 Stress & Cortisol Study',
  category: 'Longevity',
  status: 'completed',
  duration_weeks: 8,
  bounty_per_participant: 120,
  total_bounty_pool: 3600,
  slots_total: 30,
  slots_filled: 30,
  is_verified: true,
  compliance_threshold: 85,
};

const MILESTONES = [
  { id: 'm1', title: 'Baseline cortisol blood draw',   week: 0, type: 'lab'         },
  { id: 'm2', title: 'Week 2 check-in survey',         week: 2, type: 'self_report'  },
  { id: 'm3', title: 'Week 4 mid-point blood draw',    week: 4, type: 'lab'         },
  { id: 'm4', title: 'Week 4 stress symptom survey',   week: 4, type: 'self_report'  },
  { id: 'm5', title: 'Week 6 check-in survey',         week: 6, type: 'self_report'  },
  { id: 'm6', title: 'Week 8 final blood draw',        week: 8, type: 'lab'         },
  { id: 'm7', title: 'Week 8 exit survey',             week: 8, type: 'self_report'  },
];

type MilestoneStatus = 'completed' | 'rejected' | 'missed';
type ParticipantStatus = 'completed' | 'active' | 'withdrawn';

interface PM {
  milestone_id: string;
  status: MilestoneStatus;
}

interface Participant {
  id: string;
  pseudonym: string;
  status: ParticipantStatus;
  milestones: PM[];
  payout_status: 'paid' | 'pending' | 'partial';
}

// Deterministic fake participants
function makeParticipant(
  id: string,
  pseudonym: string,
  statuses: MilestoneStatus[],
  appStatus: ParticipantStatus,
  payout: 'paid' | 'pending' | 'partial'
): Participant {
  return {
    id,
    pseudonym,
    status: appStatus,
    payout_status: payout,
    milestones: MILESTONES.map((m, i) => ({
      milestone_id: m.id,
      status: statuses[i] ?? 'completed',
    })),
  };
}

const PARTICIPANTS: Participant[] = [
  makeParticipant('p1',  'neutron_fox',    ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p2',  'vanta_quark',    ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p3',  'cyan_heron',     ['completed','completed','completed','rejected', 'completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p4',  'zephyr_elk',     ['completed','completed','completed','completed','missed',   'completed','completed'], 'completed', 'paid'),
  makeParticipant('p5',  'amber_wolf',     ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p6',  'obsidian_hawk',  ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p7',  'tidal_moss',     ['completed','missed',   'completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p8',  'verdant_lynx',   ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p9',  'steel_crane',    ['completed','completed','rejected', 'completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p10', 'prism_otter',    ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p11', 'cobalt_fern',    ['completed','completed','completed','completed','missed',   'missed',   'completed'], 'completed', 'partial'),
  makeParticipant('p12', 'flux_raven',     ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p13', 'helio_coyote',   ['completed','completed','completed','rejected', 'completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p14', 'echo_sparrow',   ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p15', 'maren_blaze',    ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p16', 'solstice_wren',  ['completed','missed',   'completed','completed','missed',   'completed','missed'  ], 'completed', 'partial'),
  makeParticipant('p17', 'graphite_teal',  ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p18', 'quartz_viper',   ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p19', 'stellar_moth',   ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p20', 'arctic_pine',    ['completed','completed','completed','completed','completed','rejected', 'completed'], 'completed', 'paid'),
  makeParticipant('p21', 'basalt_tern',    ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p22', 'kinetic_owl',    ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p23', 'phantom_birch',  ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p24', 'rhodium_finch',  ['completed','missed',   'completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p25', 'delta_osprey',   ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p26', 'nimbus_stoat',   ['completed','completed','completed','missed',   'completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p27', 'zenith_vole',    ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p28', 'lux_kestrel',    ['completed','completed','completed','completed','rejected', 'completed','completed'], 'completed', 'paid'),
  makeParticipant('p29', 'nova_ibis',      ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
  makeParticipant('p30', 'boreal_gecko',   ['completed','completed','completed','completed','completed','completed','completed'], 'completed', 'paid'),
];

// ─── Scoring ──────────────────────────────────────────────────────────────────

function complianceScore(p: Participant): number {
  const done   = p.milestones.filter((m) => m.status === 'completed').length;
  const failed = p.milestones.filter((m) => m.status === 'missed' || m.status === 'rejected').length;
  const denom  = done + failed;
  return denom === 0 ? 100 : Math.round((done / denom) * 100);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const MS_COLOR: Record<MilestoneStatus, string> = {
  completed: 'var(--green)',
  rejected:  'var(--amber)',
  missed:    'rgba(77,255,128,0.15)',
};
const MS_LABEL: Record<MilestoneStatus, string> = {
  completed: '✓',
  rejected:  '✗',
  missed:    '○',
};

function MilestoneCell({ status }: { status: MilestoneStatus }) {
  return (
    <span
      className="mono text-xs inline-block w-5 text-center"
      title={status}
      style={{ color: MS_COLOR[status] }}
    >
      {MS_LABEL[status]}
    </span>
  );
}

type SortField = 'pseudonym' | 'compliance' | 'payout';
type SortDir   = 'asc' | 'desc';

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DemoCompliancePage() {
  const [sortField, setSortField] = useState<SortField>('compliance');
  const [sortDir,   setSortDir]   = useState<SortDir>('asc');
  const [expanded,  setExpanded]  = useState<string | null>(null);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir(field === 'compliance' ? 'asc' : 'asc'); }
  }

  const sorted = [...PARTICIPANTS].sort((a, b) => {
    let va: string | number, vb: string | number;
    if (sortField === 'compliance') {
      va = complianceScore(a); vb = complianceScore(b);
    } else if (sortField === 'payout') {
      const order = { paid: 0, partial: 1, pending: 2 };
      va = order[a.payout_status]; vb = order[b.payout_status];
    } else {
      va = a.pseudonym; vb = b.pseudonym;
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  // Summary stats
  const avgCompliance = Math.round(
    PARTICIPANTS.reduce((s, p) => s + complianceScore(p), 0) / PARTICIPANTS.length
  );
  const paidCount     = PARTICIPANTS.filter((p) => p.payout_status === 'paid').length;
  const partialCount  = PARTICIPANTS.filter((p) => p.payout_status === 'partial').length;
  const totalPaid     = paidCount * DEMO_EXPERIMENT.bounty_per_participant +
                        partialCount * DEMO_EXPERIMENT.bounty_per_participant * 0.7;
  const fullCompliant = PARTICIPANTS.filter((p) => complianceScore(p) === 100).length;

  function exportCSV() {
    const header = ['Pseudonym', 'Compliance%', ...MILESTONES.map((m) => m.title), 'Payout'];
    const rows   = PARTICIPANTS.map((p) => [
      p.pseudonym,
      String(complianceScore(p)),
      ...p.milestones.map((m) => m.status),
      p.payout_status,
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = 'ashwagandha_ksm66_compliance.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />

      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 md:px-8 py-8">

        {/* ── Breadcrumb ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mono text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
          <Link href="/demo/biome" className="no-underline hover:underline" style={{ color: 'var(--text-dim)' }}>DEMO</Link>
          <span>›</span>
          <span style={{ color: 'var(--text-bright)' }}>COMPLIANCE DASHBOARD</span>
        </div>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-verified">✓ BIOME VERIFIED</span>
              <span className="mono text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.1)', color: 'var(--text-dim)' }}>
                COMPLETED
              </span>
            </div>
            <h1
              className="text-2xl font-black mb-1"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-white)' }}
            >
              {DEMO_EXPERIMENT.title}
            </h1>
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              {DEMO_EXPERIMENT.duration_weeks} weeks · {DEMO_EXPERIMENT.slots_total} participants · ${DEMO_EXPERIMENT.bounty_per_participant}/person
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="mono text-xs px-4 py-2 rounded transition-all hover:opacity-80 flex-shrink-0"
            style={{ border: '1px solid var(--green-dim)', color: 'var(--green)', background: 'rgba(77,255,128,0.04)' }}
          >
            ↓ EXPORT CSV
          </button>
        </div>

        {/* ── Summary stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'AVG COMPLIANCE', value: `${avgCompliance}%`,           color: avgCompliance >= 85 ? 'var(--green)' : 'var(--amber)' },
            { label: 'FULL COMPLIANT', value: `${fullCompliant}/30`,         color: 'var(--text-white)' },
            { label: 'PAID OUT',       value: `$${totalPaid.toLocaleString()}`, color: 'var(--green)'  },
            { label: 'MILESTONES',     value: String(MILESTONES.length),     color: 'var(--text-white)' },
            { label: 'POOL',           value: `$${DEMO_EXPERIMENT.total_bounty_pool.toLocaleString()}`, color: 'var(--text-dim)' },
          ].map((s) => (
            <div
              key={s.label}
              className="p-3 rounded"
              style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.07)' }}
            >
              <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>{s.label}</p>
              <p className="mono text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Milestone legend ────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// MILESTONE_GRID</p>
          {(['completed', 'missed', 'rejected'] as MilestoneStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1 mono text-xs" style={{ color: 'var(--text-dim)' }}>
              <span style={{ color: MS_COLOR[s] }}>{MS_LABEL[s]}</span> {s}
            </span>
          ))}
        </div>

        {/* ── Participant table ───────────────────────────────────── */}
        <div className="rounded overflow-x-auto mb-6" style={{ border: '1px solid rgba(77,255,128,0.07)' }}>
          <table className="w-full border-collapse" style={{ minWidth: '900px' }}>
            <thead>
              <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid rgba(77,255,128,0.08)' }}>
                <th className="mono text-xs font-normal px-3 py-3 text-left w-10 select-none" style={{ color: 'var(--text-dim)' }}>#</th>
                <th
                  className="mono text-xs font-normal px-3 py-3 text-left cursor-pointer select-none"
                  style={{ color: sortField === 'pseudonym' ? 'var(--text-bright)' : 'var(--text-dim)' }}
                  onClick={() => toggleSort('pseudonym')}
                >
                  PARTICIPANT {sortField === 'pseudonym' ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}
                </th>
                <th
                  className="mono text-xs font-normal px-3 py-3 text-right cursor-pointer select-none w-28"
                  style={{ color: sortField === 'compliance' ? 'var(--text-bright)' : 'var(--text-dim)' }}
                  onClick={() => toggleSort('compliance')}
                >
                  COMPLIANCE {sortField === 'compliance' ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}
                </th>
                {MILESTONES.map((m, i) => (
                  <th
                    key={m.id}
                    className="mono text-xs font-normal px-2 py-3 text-center w-10"
                    title={m.title}
                    style={{ color: 'var(--text-dim)' }}
                  >
                    M{i + 1}
                  </th>
                ))}
                <th
                  className="mono text-xs font-normal px-3 py-3 text-left cursor-pointer select-none w-24"
                  style={{ color: sortField === 'payout' ? 'var(--text-bright)' : 'var(--text-dim)' }}
                  onClick={() => toggleSort('payout')}
                >
                  PAYOUT {sortField === 'payout' ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => {
                const score = complianceScore(p);
                const scoreColor = score === 100 ? 'var(--green)' : score >= 85 ? 'var(--text-white)' : 'var(--amber)';
                const isOpen = expanded === p.id;
                return (
                  <>
                    <tr
                      key={p.id}
                      className="cursor-pointer"
                      style={{
                        borderBottom: '1px solid rgba(77,255,128,0.04)',
                        background: isOpen ? 'var(--bg3)' : 'transparent',
                      }}
                      onClick={() => setExpanded(isOpen ? null : p.id)}
                      onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.background = 'var(--bg3)'; }}
                      onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td className="px-3 py-3 mono text-xs text-center tabular-nums" style={{ color: 'var(--text-dim)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="px-3 py-3 mono text-xs" style={{ color: 'var(--text-bright)' }}>
                        {p.pseudonym}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1 rounded overflow-hidden" style={{ background: 'rgba(77,255,128,0.1)' }}>
                            <div className="h-1 rounded" style={{ width: `${score}%`, background: scoreColor }} />
                          </div>
                          <span className="mono text-xs tabular-nums" style={{ color: scoreColor }}>{score}%</span>
                        </div>
                      </td>
                      {p.milestones.map((m) => (
                        <td key={m.milestone_id} className="px-2 py-3 text-center">
                          <MilestoneCell status={m.status} />
                        </td>
                      ))}
                      <td className="px-3 py-3 mono text-xs">
                        {p.payout_status === 'paid'
                          ? <span style={{ color: 'var(--green)' }}>✓ PAID</span>
                          : p.payout_status === 'partial'
                          ? <span style={{ color: 'var(--amber)' }}>~ PARTIAL</span>
                          : <span style={{ color: 'var(--text-dim)' }}>PENDING</span>}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${p.id}-detail`} style={{ borderBottom: '1px solid rgba(77,255,128,0.08)', background: 'var(--bg3)' }}>
                        <td colSpan={3 + MILESTONES.length + 1}>
                          <div className="px-8 py-4">
                            <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// MILESTONE_DETAIL — {p.pseudonym}</p>
                            <div className="flex flex-col gap-2">
                              {MILESTONES.map((m, mi) => {
                                const ms = p.milestones[mi];
                                return (
                                  <div key={m.id} className="flex items-center gap-3">
                                    <MilestoneCell status={ms.status} />
                                    <span className="mono text-xs" style={{ color: 'var(--text-bright)' }}>{m.title}</span>
                                    <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>Week {m.week}</span>
                                    <span className="mono text-xs px-1.5 py-px rounded" style={{ background: 'var(--bg2)', color: 'var(--text-dim)' }}>
                                      {m.type}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Milestone header key ─────────────────────────────────── */}
        <div className="rounded p-4 mb-8" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.07)' }}>
          <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// MILESTONE_KEY</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {MILESTONES.map((m, i) => (
              <div key={m.id} className="flex items-center gap-2 mono text-xs">
                <span style={{ color: 'var(--green)' }}>M{i + 1}</span>
                <span style={{ color: 'var(--text-bright)' }}>{m.title}</span>
                <span style={{ color: 'var(--text-dim)' }}>Wk {m.week} · {m.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Payout summary ──────────────────────────────────────── */}
        <div className="rounded p-4" style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// PAYOUT_SUMMARY</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>FULL PAYOUT ({paidCount})</p>
              <p className="mono text-xl font-black" style={{ color: 'var(--green)' }}>
                ${(paidCount * DEMO_EXPERIMENT.bounty_per_participant).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>PARTIAL ({partialCount})</p>
              <p className="mono text-xl font-black" style={{ color: 'var(--amber)' }}>
                ${(partialCount * DEMO_EXPERIMENT.bounty_per_participant * 0.7).toFixed(0)}
              </p>
            </div>
            <div>
              <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>PLATFORM FEE (2.5%)</p>
              <p className="mono text-xl font-black" style={{ color: 'var(--text-dim)' }}>
                ${(totalPaid * 0.025).toFixed(0)}
              </p>
            </div>
          </div>
        </div>

      </div>

      <footer
        className="text-center py-4 mono text-xs"
        style={{ color: 'var(--text-dim)', borderTop: '1px solid rgba(77,255,128,0.06)' }}
      >
        // DEMO_MODE — baked data — not a live study
      </footer>
    </main>
  );
}
