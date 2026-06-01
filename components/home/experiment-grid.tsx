'use client';

import Link from 'next/link';
import { ExperimentIdenticon } from '@/components/ui/experiment-identicon';
import type { Experiment, ExperimentStatus } from '@/lib/types';
import type { OrgMap } from '@/lib/types';

// ─── Category helpers ──────────────────────────────────────────────────────────

function rampKey(cat: string): string {
  const n = (cat ?? '').toLowerCase().replace(/\s+/g, '-');
  if (n.includes('micro') || n.includes('gut'))  return 'microbiome';
  if (n.includes('nutri') || n.includes('diet')) return 'nutrition';
  if (n.includes('sleep') || n.includes('recov')) return 'sleep';
  if (n.includes('wear') || n.includes('device')) return 'wearables';
  if (n.includes('longev') || n.includes('aging')) return 'longevity';
  if (n.includes('quant') || n.includes('self'))  return 'quantified-self';
  const KEYS = ['microbiome','nutrition','sleep','wearables','longevity','quantified-self'];
  return KEYS.includes(n) ? n : 'microbiome';
}

const CAT_COLORS: Record<string, string> = {
  microbiome:         '#f59e0b',
  nutrition:          '#8ee7ff',
  sleep:              '#ffd166',
  wearables:          '#ff8f8f',
  longevity:          '#d8c4ff',
  'quantified-self':  '#88bbff',
};
function catColor(cat: string): string {
  return CAT_COLORS[rampKey(cat)] ?? '#f59e0b';
}

// ─── Status badge config ───────────────────────────────────────────────────────

type StatusCfg = { label: string; color: string; bg: string; border: string; shadow?: string; pulse?: boolean };
const STATUS_CFG: Record<ExperimentStatus, StatusCfg> = {
  recruiting: {
    label: 'RECRUITING',
    color:  '#f59e0b',
    bg:     'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.35)',
    shadow: '0 0 8px rgba(245,158,11,0.15)',
    pulse:  true,
  },
  active: {
    label: 'ACTIVE',
    color:  '#8ee7ff',
    bg:     'rgba(142,231,255,0.08)',
    border: '1px solid rgba(142,231,255,0.3)',
  },
  draft: {
    label: 'DRAFT',
    color:  '#7f8e87',
    bg:     'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  completed: {
    label: 'COMPLETED',
    color:  '#7f8e87',
    bg:     'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  cancelled: {
    label: 'CANCELLED',
    color:  '#ffd166',
    bg:     'rgba(255,209,102,0.06)',
    border: '1px solid rgba(255,209,102,0.2)',
  },
};

// ─── Sort + fill helpers ───────────────────────────────────────────────────────

function sortExps(exps: Experiment[]): Experiment[] {
  return [...exps].sort((a, b) => {
    if (b.bounty_per_participant !== a.bounty_per_participant)
      return b.bounty_per_participant - a.bounty_per_participant;
    return b.slots_total - a.slots_total;
  });
}

function fillToThree(statusExps: Experiment[], all: Experiment[]): Experiment[] {
  if (statusExps.length >= 3) return statusExps.slice(0, 3);
  const ids = new Set(statusExps.map((e) => e.id));
  const extras = all.filter((e) => !ids.has(e.id));
  return [...statusExps, ...extras].slice(0, 3);
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginTop: 28,
      marginBottom: 14,
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '3px',
        textTransform: 'uppercase',
        color,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        // {label}
      </span>
      <div style={{ flex: 1, height: 1, background: color, opacity: 0.2 }} />
    </div>
  );
}

// ─── Experiment card ───────────────────────────────────────────────────────────

function ExperimentCard({ exp, orgName, expNumber }: {
  exp: Experiment;
  orgName: string;
  expNumber: number;
}) {
  const cc      = catColor(exp.category);
  const rk      = rampKey(exp.category);
  const st      = STATUS_CFG[exp.status] ?? STATUS_CFG.draft;
  const slotPct = exp.slots_total > 0 ? (exp.slots_filled / exp.slots_total) * 100 : 0;
  const durWks  = (exp as unknown as Record<string, unknown>).duration_weeks as number | null;

  return (
    <Link
      href={`/experiments/${exp.id}`}
      className="exp-card"
      style={{ borderLeft: `3px solid ${cc}` }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = `0 4px 20px ${cc}0f, 0 0 0 1px ${cc}1a`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      {/* ZONE 1 — Identicon strip (auto-height, square cells) */}
      <div style={{ position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <ExperimentIdenticon
          experimentId={exp.id}
          category={rk}
          orgName={orgName}
          experimentNumber={expNumber}
        />
        {/* Status badge */}
        <span
          className={st.pulse ? 'blink-recruit' : undefined}
          style={{
            position: 'absolute', bottom: 8, right: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            padding: '4px 10px',
            borderRadius: 2,
            color: st.color, background: st.bg,
            border: st.border,
            boxShadow: st.shadow ?? 'none',
            lineHeight: 1,
          }}
        >
          {st.label}
        </span>
        {/* Verified */}
        {exp.is_verified && (
          <span className="badge-verified" style={{ position: 'absolute', bottom: 8, left: 8 }}>
            ✓ VERIFIED
          </span>
        )}
      </div>

      {/* ZONE 2 — Metadata row */}
      <div style={{
        padding: '5px 12px',
        borderTop: `1px solid ${cc}26`,
        background: 'rgba(255,255,255,0.015)',
        flexShrink: 0, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 18 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            textTransform: 'uppercase', letterSpacing: '1.5px', color: cc,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {exp.category.toUpperCase()}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, color: '#7f8e87',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '55%', marginLeft: 8, textAlign: 'right',
          }}>
            {exp.is_remote ? (
              <span style={{ color: '#4a7055' }}>🌐 REMOTE</span>
            ) : (
              exp.region ?? orgName
            )}
          </span>
        </div>
        {exp.experiment_code && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 8,
            color: '#4a7055', letterSpacing: '1px', lineHeight: 1, marginTop: 2,
          }}>
            {exp.experiment_code} · {orgName}
          </div>
        )}
      </div>

      {/* ZONE 2b — Task summary */}
      {exp.task_summary && (
        <div style={{
          padding: '0 12px',
          height: 18,
          borderTop: '1px solid rgba(255,255,255,0.03)',
          display: 'flex', alignItems: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: '#7f8e87', fontStyle: 'italic',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            ↳ {exp.task_summary}
          </span>
        </div>
      )}

      {/* ZONE 3 — Title (min 48px) */}
      <div style={{
        padding: '10px 12px', minHeight: 48, maxHeight: 64,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden', flexShrink: 0,
      }}>
        <p className="exp-card-title" style={{
          fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 600,
          color: '#eef4f0', lineHeight: 1.35,
          display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', margin: 0,
        }}>
          {exp.title}
        </p>
      </div>

      {/* ZONE 4 — Bounty + Apply + Progress */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', height: 44,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}>
        <div>
          <p className="exp-card-bounty" style={{
            fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700,
            color: '#f59e0b', lineHeight: 1, margin: 0,
          }}>
            ${exp.bounty_per_participant.toFixed(0)}
          </p>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a7055', margin: 0, marginTop: 2,
          }}>
            per participant
          </p>
        </div>

        {/* Apply button — only for recruiting */}
        {exp.status === 'recruiting' && (
          <Link
            href={`/experiments/${exp.id}/apply`}
            onClick={(e) => e.stopPropagation()}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              textTransform: 'uppercase', letterSpacing: '1.5px',
              fontWeight: 700, color: '#070c07',
              background: '#f59e0b',
              padding: '5px 10px',
              textDecoration: 'none',
              borderRadius: 2,
              flexShrink: 0,
            }}
          >
            Apply →
          </Link>
        )}

        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1 }}>
            {exp.slots_filled}/{exp.slots_total}
          </p>
          <div style={{ width: 48, height: 3, background: 'rgba(255,255,255,0.06)', marginTop: 4 }}>
            <div style={{ height: 3, width: `${slotPct}%`, background: cc }} />
          </div>
          {durWks && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a7055', margin: 0, marginTop: 2 }}>
              {durWks} WKS
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Browse all card ───────────────────────────────────────────────────────────

function BrowseAllCard({ total }: { total: number }) {
  return (
    <Link
      href="/experiments"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 80,
        border: '1px dashed rgba(245,158,11,0.2)',
        background: 'transparent', borderRadius: 2,
        textDecoration: 'none',
        fontFamily: 'var(--font-mono)', fontSize: 12,
        textTransform: 'uppercase', letterSpacing: '2px', color: '#f59e0b',
        transition: 'border-color 200ms ease, background 200ms ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(245,158,11,0.4)';
        el.style.background  = 'rgba(245,158,11,0.03)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(245,158,11,0.2)';
        el.style.background  = 'transparent';
      }}
    >
      Browse all {total} studies →
    </Link>
  );
}

// ─── Main grid ─────────────────────────────────────────────────────────────────

interface Props {
  experiments: Experiment[];
  orgMap: OrgMap;
}

export function ExperimentGrid({ experiments, orgMap }: Props) {
  const sorted      = sortExps(experiments);
  const recruiting  = sorted.filter((e) => e.status === 'recruiting');
  const active      = sorted.filter((e) => e.status === 'active');
  const completed   = sorted.filter((e) => e.status === 'completed');

  const rowRecruiting = fillToThree(recruiting, sorted);
  const rowActive     = fillToThree(active,     sorted);
  const rowCompleted  = fillToThree(completed,  sorted);

  const getOrgName = (exp: Experiment) => orgMap[exp.experimenter_id]?.org_name ?? 'BIOME';
  const getExpNum  = (exp: Experiment) => sorted.indexOf(exp) + 1;

  return (
    <div className="px-4 sm:px-10" style={{ paddingTop: 32, paddingBottom: 48 }}>

      {rowRecruiting.length > 0 && (
        <>
          <div style={{ marginTop: 8 }} />
          <SectionHeader label="RECRUITING STUDIES" color="#f59e0b" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rowRecruiting.map((exp) => (
              <ExperimentCard key={exp.id} exp={exp} orgName={getOrgName(exp)} expNumber={getExpNum(exp)} />
            ))}
          </div>
        </>
      )}

      {rowActive.length > 0 && (
        <>
          <SectionHeader label="ACTIVE STUDIES" color="#8ee7ff" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rowActive.map((exp) => (
              <ExperimentCard key={exp.id} exp={exp} orgName={getOrgName(exp)} expNumber={getExpNum(exp)} />
            ))}
          </div>
        </>
      )}

      {rowCompleted.length > 0 && (
        <>
          <SectionHeader label="COMPLETED STUDIES" color="#7f8e87" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rowCompleted.map((exp) => (
              <ExperimentCard key={exp.id} exp={exp} orgName={getOrgName(exp)} expNumber={getExpNum(exp)} />
            ))}
          </div>
        </>
      )}

      {/* Browse all — centered 1/3 width on desktop, full width on mobile */}
      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
        <div className="w-full sm:w-1/2 lg:w-1/3">
          <BrowseAllCard total={experiments.length} />
        </div>
      </div>

    </div>
  );
}
