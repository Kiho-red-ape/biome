'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/nav/header';
import { ScreeningDashboard } from '@/components/screening/screening-dashboard';
import type { ApplicantRow } from '@/components/screening/screening-dashboard';
import { BIOME_ORG, DEMO_EXPERIMENTS, DEMO_APPLICANTS_MAP } from '@/lib/demo-data';
import type { DemoExperiment } from '@/lib/demo-data';
import { categoryColor } from '@/lib/utils/profile';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft:      'var(--text-dim)',
  recruiting: 'var(--green)',
  active:     'var(--cyan)',
  completed:  'var(--text-dim)',
  cancelled:  'var(--amber)',
};

function StatusDot({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? 'var(--text-dim)';
  return (
    <span className="mono text-xs font-bold uppercase" style={{ color }}>
      ● {status}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BiomeDemoPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = DEMO_EXPERIMENTS.find((e) => e.id === selectedId) ?? null;
  const applicants = selectedId ? (DEMO_APPLICANTS_MAP[selectedId] ?? []) : [];

  const totalPool    = DEMO_EXPERIMENTS.reduce((s, e) => s + e.total_bounty_pool, 0);
  const activeCount  = DEMO_EXPERIMENTS.filter((e) => ['recruiting', 'active'].includes(e.status)).length;
  const completedCount = DEMO_EXPERIMENTS.filter((e) => e.status === 'completed').length;

  return (
    <main className="min-h-screen">
      <SiteHeader />

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Banner ── */}
        <div
          className="rounded px-5 py-3 mb-6 mono text-xs"
          style={{ border: '1px solid rgba(77,255,128,0.3)', color: 'var(--green)', background: 'rgba(77,255,128,0.04)' }}
        >
          // INTERACTIVE_DEMO — Approve · Waitlist · Deny buttons are fully functional. State resets on refresh. No auth required.
        </div>

        {/* ── Back ── */}
        <Link href="/" className="mono text-xs no-underline mb-6 inline-block transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-dim)' }}>
          ← EXPLORE
        </Link>

        {/* ── Org header ── */}
        <div className="rounded p-6 mb-6"
          style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.14)' }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">

              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="mono text-xs px-2 py-0.5 rounded font-bold"
                  style={{ background: 'rgba(77,255,128,0.1)', border: '1px solid rgba(77,255,128,0.25)', color: 'var(--green)' }}>
                  ● VERIFIED ORG
                </span>
                <span className="mono text-xs px-2 py-0.5 rounded"
                  style={{ background: 'rgba(77,255,128,0.06)', border: '1px solid rgba(77,255,128,0.15)', color: 'var(--green)' }}>
                  ✓ {BIOME_ORG.verified_experiments} BIOME VERIFIED
                </span>
              </div>

              <h1 className="text-2xl font-black mb-2"
                style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
                {BIOME_ORG.org_name}
              </h1>

              <p className="text-sm mb-3" style={{ color: 'var(--text-dim)', maxWidth: '52rem' }}>
                {BIOME_ORG.org_description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {BIOME_ORG.expertise_areas.map((a) => (
                  <span key={a} className="mono text-xs px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', color: 'var(--cyan)' }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Org stats */}
            <div className="grid grid-cols-3 gap-3 flex-shrink-0">
              {[
                { label: 'TOTAL POOL',  value: `$${(totalPool / 1000).toFixed(0)}K` },
                { label: 'ACTIVE',      value: String(activeCount),  color: 'var(--green)' },
                { label: 'COMPLETED',   value: String(completedCount) },
              ].map((s) => (
                <div key={s.label} className="rounded p-3 text-center"
                  style={{ background: 'var(--bg)', border: '1px solid rgba(77,255,128,0.1)' }}>
                  <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>{s.label}</p>
                  <p className="mono text-lg font-bold" style={{ color: s.color ?? 'var(--text-white)' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Experiment list + inline screening ── */}
        <div className="mb-2">
          <p className="mono text-xs mb-4" style={{ color: 'var(--text-dim)' }}>// STUDIES — click MANAGE to open screening window</p>
        </div>

        <div className="flex flex-col gap-4">
          {DEMO_EXPERIMENTS.map((exp) => (
            <ExperimentBlock
              key={exp.id}
              exp={exp}
              applicantCount={DEMO_APPLICANTS_MAP[exp.id]?.length ?? 0}
              isSelected={selectedId === exp.id}
              onToggle={() => setSelectedId((prev) => (prev === exp.id ? null : exp.id))}
              applicants={applicants}
            />
          ))}
        </div>

        {/* ── Footer note ── */}
        <div className="mt-10 pt-6" style={{ borderTop: '1px solid rgba(77,255,128,0.08)' }}>
          <p className="mono text-xs text-center" style={{ color: 'var(--text-dim)' }}>
            // Ready to post your own study?{' '}
            <Link href="/onboarding" className="no-underline hover:underline" style={{ color: 'var(--green)' }}>
              Create an experimenter account →
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}

// ─── Experiment block ─────────────────────────────────────────────────────────

function ExperimentBlock({
  exp,
  applicantCount,
  isSelected,
  onToggle,
  applicants,
}: {
  exp: DemoExperiment;
  applicantCount: number;
  isSelected: boolean;
  onToggle: () => void;
  applicants: ApplicantRow[];
}) {
  const sc   = STATUS_COLORS[exp.status] ?? 'var(--text-dim)';
  const cc   = categoryColor(exp.category);
  const pct  = exp.slots_total > 0 ? (exp.slots_filled / exp.slots_total) * 100 : 0;

  const expInfo = {
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
      className="rounded overflow-hidden"
      style={{
        border: isSelected
          ? '1px solid rgba(77,255,128,0.35)'
          : '1px solid rgba(77,255,128,0.12)',
        background: 'var(--bg2)',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* ── Header row ── */}
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">

          {/* Left: title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <StatusDot status={exp.status} />
              <span className="mono text-xs px-1.5 py-0.5 rounded"
                style={{ color: cc, border: `1px solid ${cc}35`, background: `${cc}0a` }}>
                {exp.category.toUpperCase()}
              </span>
              {exp.is_verified && (
                <span className="badge-verified">✓ BIOME VERIFIED</span>
              )}
              {!exp.is_remote && (
                <span className="mono text-xs px-1.5 py-0.5 rounded"
                  style={{ color: 'var(--text-dim)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {exp.region}
                </span>
              )}
            </div>

            <h2 className="font-black text-lg mb-1"
              style={{ color: 'var(--text-white)', fontFamily: 'var(--font-heading)' }}>
              {exp.title}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-dim)', maxWidth: '48rem' }}>
              {exp.short_description}
            </p>
          </div>

          {/* Right: stats + action */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-right">
              <p className="mono text-xs mb-0.5" style={{ color: 'var(--text-dim)' }}>BOUNTY</p>
              <p className="mono text-xl font-bold" style={{ color: 'var(--green)' }}>
                ${exp.bounty_per_participant}
              </p>
            </div>
            <div className="text-right">
              <p className="mono text-xs mb-0.5" style={{ color: 'var(--text-dim)' }}>SLOTS</p>
              <p className="mono text-sm font-bold" style={{ color: 'var(--text-white)' }}>
                {exp.slots_filled}/{exp.slots_total}
              </p>
              <div className="w-16 h-1 rounded overflow-hidden mt-1 ml-auto"
                style={{ background: 'rgba(77,255,128,0.1)' }}>
                <div className="h-1 rounded"
                  style={{ width: `${pct}%`, background: pct >= 90 ? 'var(--amber)' : 'var(--green-dim)' }} />
              </div>
            </div>
            <div className="text-right">
              <p className="mono text-xs mb-0.5" style={{ color: 'var(--text-dim)' }}>APPLICANTS</p>
              <p className="mono text-sm font-bold" style={{ color: 'var(--text-white)' }}>
                {applicantCount}
              </p>
            </div>
            <button
              onClick={onToggle}
              className="mono text-xs px-4 py-2 rounded font-bold transition-all"
              style={isSelected ? {
                background: 'var(--green)',
                color: '#050709',
                border: '1px solid var(--green)',
              } : {
                border: '1px solid rgba(0,229,255,0.3)',
                color: 'var(--cyan)',
                background: 'transparent',
              }}
            >
              {isSelected ? '▲ Close' : 'MANAGE →'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Inline screening ── */}
      {isSelected && (
        <div
          className="px-5 pb-6 pt-2"
          style={{ borderTop: '1px solid rgba(77,255,128,0.1)', background: 'rgba(77,255,128,0.015)' }}
        >
          <div className="flex items-center gap-2 mb-4 pt-2">
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// APPLICANT_SCREENING</p>
            <span className="mono text-xs" style={{ color: 'var(--green)' }}>[{applicantCount}]</span>
          </div>
          <ScreeningDashboard
            experimentId={exp.id}
            privyDid="demo"
            initialApplicants={applicants}
            experiment={expInfo}
            interactiveDemoMode={true}
          />
        </div>
      )}
    </div>
  );
}
