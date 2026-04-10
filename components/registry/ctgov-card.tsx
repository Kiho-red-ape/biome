import type { CTGovStudy } from '@/lib/types/ctgov';

const CATEGORY_COLORS: Record<string, string> = {
  microbiome:      '#b7ff61',
  nutrition:       '#8ee7ff',
  sleep:           '#ffd166',
  wearables:       '#ff8f8f',
  longevity:       '#d8c4ff',
  quantified_self: '#88bbff',
  other:           '#aab8b1',
};

function catColor(cat: string | null): string {
  return CATEGORY_COLORS[cat ?? 'other'] ?? '#aab8b1';
}

export function CTGovCard({ study }: { study: CTGovStudy }) {
  const cc        = catColor(study.biome_category);
  const locations = (study.locations ?? []) as Array<{ city?: string; state?: string; country?: string }>;
  const locCount  = locations.length;
  const firstLoc  = locations[0];
  const locStr    = firstLoc
    ? [firstLoc.city, firstLoc.state, firstLoc.country].filter(Boolean).join(', ')
    : null;

  return (
    <a
      href={study.ctgov_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', flexDirection: 'column',
        background: '#0d1117',
        border: '1px solid rgba(255,255,255,0.08)',
        borderTop: '2px solid rgba(255,255,255,0.15)',
        borderRadius: 4,
        textDecoration: 'none',
        overflow: 'hidden',
        transition: 'border-color 200ms, background 200ms',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = '#111820'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = '#0d1117'; }}
    >
      {/* Top strip */}
      <div style={{
        padding: '8px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '1.5px',
          color: '#aab8b1', textTransform: 'uppercase',
        }}>
          // CT.GOV
        </span>
        {study.biome_category && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase',
            color: cc, background: `${cc}14`, border: `1px solid ${cc}30`,
            borderRadius: 2, padding: '1px 6px',
          }}>
            {study.biome_category.replace('_', ' ')}
          </span>
        )}
        {study.status === 'RECRUITING' && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#b7ff61', marginLeft: 'auto' }}>
            ● RECRUITING
          </span>
        )}
        {study.status === 'NOT_YET_RECRUITING' && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#ffd166', marginLeft: 'auto' }}>
            ◌ UPCOMING
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{
          fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600,
          color: '#c8d8cc', lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          margin: 0,
        }}>
          {study.title}
        </p>

        {study.sponsor_name && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', margin: 0 }}>
            {study.sponsor_name}
          </p>
        )}

        {/* Conditions */}
        {study.conditions && study.conditions.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {study.conditions.slice(0, 2).map((c, i) => (
              <span key={i} style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase',
                color: '#7f8e87', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 2, padding: '1px 5px',
              }}>
                {c.length > 20 ? c.slice(0, 20) + '…' : c}
              </span>
            ))}
          </div>
        )}

        {/* Locations */}
        {locCount > 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', margin: 0 }}>
            {locCount} location{locCount !== 1 ? 's' : ''}
            {locStr ? ` · ${locStr}` : ''}
            {locCount > 1 ? ' + more' : ''}
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a7055', letterSpacing: '1px' }}>
          {study.nct_id}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#7f8e87' }}>
          View on ClinicalTrials.gov →
        </span>
      </div>
    </a>
  );
}
