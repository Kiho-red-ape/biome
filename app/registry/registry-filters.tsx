'use client';

import { useRouter, usePathname } from 'next/navigation';

interface Props {
  categories:      readonly string[];
  sponsorClasses:  readonly string[];
  currentCategory: string;
  currentSponsor:  string;
  currentStatus:   string;
  totalCount:      number;
}

export function RegistryFilters({
  categories, sponsorClasses,
  currentCategory, currentSponsor, currentStatus, totalCount,
}: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  function update(key: string, value: string) {
    const params = new URLSearchParams();
    if (currentCategory && key !== 'category') params.set('category', currentCategory);
    if (currentSponsor  && key !== 'sponsor')  params.set('sponsor', currentSponsor);
    if (currentStatus   && key !== 'status')   params.set('status', currentStatus);
    if (value) params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  const chipBase: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px',
    padding: '5px 12px', borderRadius: 20, cursor: 'pointer', transition: 'all 150ms',
    border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#aab8b1',
  };
  const chipActive: React.CSSProperties = {
    ...chipBase,
    border: '1px solid rgba(170,184,177,0.4)', background: 'rgba(170,184,177,0.1)', color: '#eef4f0',
  };

  return (
    <div style={{ marginBottom: 4 }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055', marginBottom: 16 }}>
        {totalCount} trial{totalCount !== 1 ? 's' : ''}
      </p>

      {/* Category */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 12, scrollbarWidth: 'none' }}>
        <button onClick={() => update('category', '')} style={!currentCategory ? chipActive : chipBase}>All</button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => update('category', currentCategory === cat ? '' : cat)}
            style={currentCategory === cat ? chipActive : chipBase}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Sponsor + status row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select
          value={currentSponsor}
          onChange={(e) => update('sponsor', e.target.value)}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, padding: '5px 10px',
            background: '#0d1117', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20, color: '#aab8b1', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px',
          }}
        >
          <option value="">All sponsors</option>
          {sponsorClasses.map((sc) => (
            <option key={sc} value={sc}>{sc}</option>
          ))}
        </select>

        <select
          value={currentStatus}
          onChange={(e) => update('status', e.target.value)}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, padding: '5px 10px',
            background: '#0d1117', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20, color: '#aab8b1', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px',
          }}
        >
          <option value="">All statuses</option>
          <option value="RECRUITING">Recruiting</option>
          <option value="NOT_YET_RECRUITING">Not yet recruiting</option>
        </select>
      </div>
    </div>
  );
}
