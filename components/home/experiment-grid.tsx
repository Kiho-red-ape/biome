'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExperimentIdenticon } from '@/components/ui/experiment-identicon';
import type { Experiment, ExperimentStatus } from '@/lib/types';
import type { OrgMap } from '@/app/page';
import { getBountyTier, getTierLabel, getTierColor, getTierRange } from '@/lib/bounty-tiers';

// ─── Tier badge with tooltip ───────────────────────────────────────────────────

function TierBadge({ amount }: { amount: number }) {
  const [hovered, setHovered] = useState(false);
  const tier  = getBountyTier(amount);
  const color = getTierColor(tier);
  const label = getTierLabel(tier);
  const range = getTierRange(tier);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered(true)}
        onTouchEnd={() => setHovered(false)}
        style={{
          display:         'inline-block',
          fontFamily:      'var(--font-mono)',
          fontSize:        10,
          textTransform:   'uppercase',
          letterSpacing:   '1px',
          color,
          background:      `${color}26`,
          border:          `1px solid ${color}50`,
          borderRadius:    3,
          padding:         '3px 7px',
          cursor:          'default',
          userSelect:      'none',
          whiteSpace:      'nowrap',
        }}
      >
        {label}
      </span>

      {hovered && (
        <div style={{
          position:     'absolute',
          bottom:       '100%',
          left:         '50%',
          transform:    'translateX(-50%)',
          marginBottom: 8,
          zIndex:       50,
          pointerEvents: 'none',
        }}>
          <div style={{
            background:   '#0d1117',
            border:       '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding:      '8px 12px',
            whiteSpace:   'nowrap',
          }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#fff', margin: 0, marginBottom: 3 }}>
              {range}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#aab8b1', margin: 0 }}>
              Exact amount shown after application
            </p>
          </div>
          {/* Arrow */}
          <div style={{
            width: 0, height: 0,
            borderLeft:  '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop:   '5px solid rgba(255,255,255,0.1)',
            margin:      '0 auto',
          }} />
        </div>
      )}
    </div>
  );
}

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
  microbiome:         '#b7ff61',
  nutrition:          '#8ee7ff',
  sleep:              '#ffd166',
  wearables:          '#ff8f8f',
  longevity:          '#d8c4ff',
  'quantified-self':  '#88bbff',
};
function catColor(cat: string): string {
  return CAT_COLORS[rampKey(cat)] ?? '#b7ff61';
}

// ─── Status badge config ───────────────────────────────────────────────────────

type StatusCfg = { label: string; color: string; bg: string; border: string; shadow?: string; pulse?: boolean };
const STATUS_CFG: Record<ExperimentStatus, StatusCfg> = {
  recruiting: {
    label: 'RECRUITING',
    color:  '#b7ff61',
    bg:     'rgba(183,255,97,0.08)',
    border: '1px solid rgba(183,255,97,0.35)',
    shadow: '0 0 8px rgba(183,255,97,0.15)',
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
          {exp.status === 'active' ? (
            <>
              <p className="exp-card-bounty" style={{
                fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700,
                color: '#b7ff61', lineHeight: 1, margin: 0,
              }}>
                ${exp.bounty_per_participant.toFixed(0)}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a7055', margin: 0, marginTop: 2 }}>
                per participant
              </p>
            </>
          ) : (
            <TierBadge amount={exp.bounty_per_participant} />
          )}
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
              background: '#b7ff61',
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
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#aab8b1', margin: 0, lineHeight: 1 }}>
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
        border: '1px dashed rgba(183,255,97,0.2)',
        background: 'transparent', borderRadius: 2,
        textDecoration: 'none',
        fontFamily: 'var(--font-mono)', fontSize: 12,
        textTransform: 'uppercase', letterSpacing: '2px', color: '#b7ff61',
        transition: 'border-color 200ms ease, background 200ms ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(183,255,97,0.4)';
        el.style.background  = 'rgba(183,255,97,0.03)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'rgba(183,255,97,0.2)';
        el.style.background  = 'transparent';
      }}
    >
      Browse all {total} studies →
    </Link>
  );
}

// ─── Category chips ────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Microbiome', 'Nutrition', 'Sleep', 'Wearables', 'Longevity', 'Quantified Self'] as const;

// ─── Main grid ─────────────────────────────────────────────────────────────────

interface Props {
  experiments: Experiment[];
  orgMap: OrgMap;
}

export function ExperimentGrid({ experiments, orgMap }: Props) {
  const [query,       setQuery]       = useState('');
  const [activeChip,  setActiveChip]  = useState<string>('All');
  const [debouncedQ,  setDebouncedQ]  = useState('');

  // Debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const getOrgName = (exp: Experiment) => orgMap[exp.experimenter_id]?.org_name ?? 'BIOME';

  const sorted = sortExps(experiments);

  // Filter: category chip + search query (only recruiting + active)
  const visible = sorted.filter((e) => {
    if (e.status === 'completed' || e.status === 'cancelled' || e.status === 'draft') return false;
    if (activeChip !== 'All') {
      const key = rampKey(activeChip);
      if (rampKey(e.category) !== key) return false;
    }
    if (debouncedQ.trim()) {
      const q  = debouncedQ.toLowerCase();
      const org = getOrgName(e).toLowerCase();
      if (
        !e.title.toLowerCase().includes(q) &&
        !(e.description ?? '').toLowerCase().includes(q) &&
        !(e.category ?? '').toLowerCase().includes(q) &&
        !org.includes(q)
      ) return false;
    }
    return true;
  });

  const recruiting = visible.filter((e) => e.status === 'recruiting');
  const active     = visible.filter((e) => e.status === 'active');

  // Recruiting: up to 6 shown (2 rows of 3), with "browse all" link if more
  const recruitingShown = recruiting.slice(0, 6);
  const recruitingExtra = recruiting.length > 6;

  return (
    <div className="px-4 sm:px-10" style={{ paddingTop: 32, paddingBottom: 48 }}>

      {/* ── Search bar ── */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aab8b1" strokeWidth="2"
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search studies by keyword, condition, or category..."
          style={{
            width:          '100%',
            height:         48,
            background:     '#0d1117',
            border:         `1px solid ${query ? '#b7ff61' : 'rgba(255,255,255,0.15)'}`,
            borderRadius:   8,
            paddingLeft:    40,
            paddingRight:   query ? 40 : 16,
            fontFamily:     'var(--font-mono)',
            fontSize:       13,
            color:          '#eef4f0',
            outline:        'none',
            transition:     'border-color 200ms',
            boxSizing:      'border-box',
          }}
          onFocus={(e)  => { e.currentTarget.style.borderColor = '#b7ff61'; }}
          onBlur={(e)   => { e.currentTarget.style.borderColor = query ? '#b7ff61' : 'rgba(255,255,255,0.15)'; }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setDebouncedQ(''); }}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#aab8b1', fontSize: 18, lineHeight: 1, padding: 2,
            }}
            aria-label="Clear search"
          >×</button>
        )}
      </div>

      {/* ── Category chips ── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 24, scrollbarWidth: 'none' }}>
        {CATEGORIES.map((cat) => {
          const isActive = activeChip === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveChip(cat)}
              style={{
                flexShrink:   0,
                fontFamily:   'var(--font-mono)',
                fontSize:     10,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                padding:      '5px 12px',
                borderRadius: 20,
                border:       isActive ? '1px solid #b7ff6150' : '1px solid rgba(255,255,255,0.12)',
                background:   isActive ? 'rgba(183,255,97,0.12)' : 'transparent',
                color:        isActive ? '#b7ff61' : '#aab8b1',
                cursor:       'pointer',
                transition:   'all 150ms',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── No results ── */}
      {visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#aab8b1' }}>
            No studies match your search. Try different keywords.
          </p>
        </div>
      )}

      {/* ── Recruiting rows ── */}
      {recruitingShown.length > 0 && (
        <>
          <SectionHeader label="RECRUITING STUDIES" color="#b7ff61" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recruitingShown.map((exp, i) => (
              <ExperimentCard key={exp.id} exp={exp} orgName={getOrgName(exp)} expNumber={sorted.indexOf(exp) + 1} />
            ))}
          </div>
          {recruitingExtra && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Link href="/experiments"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#b7ff61', textDecoration: 'none',
                  textTransform: 'uppercase', letterSpacing: '2px' }}>
                Browse all {recruiting.length} recruiting studies →
              </Link>
            </div>
          )}
        </>
      )}

      {/* ── Active row ── */}
      {active.length > 0 && (
        <>
          <SectionHeader label="ACTIVE STUDIES" color="#8ee7ff" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.slice(0, 3).map((exp) => (
              <ExperimentCard key={exp.id} exp={exp} orgName={getOrgName(exp)} expNumber={sorted.indexOf(exp) + 1} />
            ))}
          </div>
        </>
      )}

      {/* ── No recruiting placeholder ── */}
      {recruiting.length === 0 && active.length === 0 && visible.length === 0 && !debouncedQ && activeChip === 'All' && (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#aab8b1', marginBottom: 8 }}>
            No studies currently recruiting.
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a7055' }}>
            Check back soon or create your profile to get notified.
          </p>
        </div>
      )}

      {/* ── Browse all ── */}
      {visible.length > 0 && (
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
          <div className="w-full sm:w-1/2 lg:w-1/3">
            <BrowseAllCard total={experiments.filter((e) => e.status !== 'draft').length} />
          </div>
        </div>
      )}

    </div>
  );
}
