'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/nav/header';
import type { Facility } from '@/app/api/ome/facilities/route';

// ── Constants ────────────────────────────────────────────────────────────────

const FACILITY_TYPE_LABELS: Record<string, string> = {
  hospital:          'Hospital',
  diagnostic_lab:    'Diagnostic Lab',
  specialty_clinic:  'Specialty Clinic',
  research_centre:   'Research Centre',
  imaging_centre:    'Imaging Centre',
  phlebotomy_centre: 'Phlebotomy Centre',
  wellness_clinic:   'Wellness Clinic',
};

const FACILITY_TYPES = Object.keys(FACILITY_TYPE_LABELS);

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const CAPABILITY_LABELS: Record<string, string> = {
  blood_tests:      'Blood Tests',
  stool_tests:      'Stool Tests',
  biopsy:           'Biopsy',
  mri:              'MRI',
  ecg:              'ECG',
  eeg:              'EEG',
  biomarker_panel:  'Biomarker Panel',
  microbiome:       'Microbiome',
  genomics:         'Genomics',
  pathology:        'Pathology',
  urine_tests:      'Urine Tests',
};

const CAPABILITIES = Object.keys(CAPABILITY_LABELS);

const PAGE_LIMIT = 24;

// ── Types ────────────────────────────────────────────────────────────────────

type ApiResponse = {
  facilities: Facility[];
  total: number;
  offset: number;
  limit: number;
  error?: string;
};

type Filters = {
  search: string;
  state: string;
  type: string;
  capability: string;
  abdm: boolean;
  ctri: boolean;
  research: boolean;
};

// ── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--radius)',
      padding: 16,
      boxShadow: 'var(--shadow-sm)',
    }}>
      {[80, 50, 100, 60].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 18 : 12,
          width: `${w}%`,
          background: 'var(--border-soft)',
          borderRadius: 4,
          marginBottom: i === 3 ? 0 : 10,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  );
}

// ── Accreditation pill ────────────────────────────────────────────────────────

function AccrPill({ label }: { label: string }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      fontWeight: 600,
      padding: '2px 7px',
      borderRadius: 999,
      background: 'var(--teal-soft)',
      color: 'var(--teal-dark)',
      border: '1px solid rgba(14,116,144,0.18)',
      letterSpacing: '0.02em',
    }}>
      {label}
    </span>
  );
}

// ── Capability chip ────────────────────────────────────────────────────────────

function CapChip({ label }: { label: string }) {
  return (
    <span style={{
      fontFamily: 'var(--font-body)',
      fontSize: 11,
      padding: '2px 8px',
      borderRadius: 999,
      background: '#f1f5f9',
      color: 'var(--slate)',
      border: '1px solid var(--border-soft)',
    }}>
      {label}
    </span>
  );
}

// ── Facility card ─────────────────────────────────────────────────────────────

function FacilityCard({ facility: f }: { facility: Facility }) {
  const caps = f.capabilities ?? [];
  const visibleCaps = caps.slice(0, 4);
  const extraCaps = caps.length > 4 ? caps.length - 4 : 0;

  const typeLabel = FACILITY_TYPE_LABELS[f.facility_type] ?? f.facility_type;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--radius)',
      padding: 16,
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Name + type */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 14,
          color: 'var(--ink)',
          margin: 0,
          lineHeight: 1.35,
          flex: 1,
        }}>
          {f.name}
        </p>
        {f.website && (
          <a
            href={f.website.startsWith('http') ? f.website : `https://${f.website}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13,
              color: 'var(--teal)',
              textDecoration: 'none',
              flexShrink: 0,
              lineHeight: 1,
            }}
            title="Visit website"
          >
            ↗
          </a>
        )}
      </div>

      {/* Type pill */}
      <div>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 500,
          padding: '3px 10px',
          borderRadius: 999,
          background: 'var(--teal-soft)',
          color: 'var(--teal-dark)',
        }}>
          {typeLabel}
        </span>
      </div>

      {/* Location */}
      {(f.city ?? f.state) && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          color: 'var(--slate)',
          margin: 0,
        }}>
          {[f.city, f.state].filter(Boolean).join(' · ')}
        </p>
      )}

      {/* Accreditation chips */}
      {(f.nabh_accredited || f.nabl_accredited || f.icmr_registered || f.ctri_site || f.abdm_registered) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {f.nabh_accredited  && <AccrPill label="NABH" />}
          {f.nabl_accredited  && <AccrPill label="NABL" />}
          {f.icmr_registered  && <AccrPill label="ICMR" />}
          {f.ctri_site        && <AccrPill label="CTRI" />}
          {f.abdm_registered  && <AccrPill label="ABDM" />}
        </div>
      )}

      {/* Capabilities */}
      {caps.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {visibleCaps.map((c) => (
            <CapChip key={c} label={CAPABILITY_LABELS[c] ?? c} />
          ))}
          {extraCaps > 0 && (
            <CapChip label={`+${extraCaps} more`} />
          )}
        </div>
      )}

      {/* Contact email */}
      {f.contact_email && (
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--muted)',
          margin: 0,
          wordBreak: 'break-all',
        }}>
          {f.contact_email}
        </p>
      )}
    </div>
  );
}

// ── Toggle button ─────────────────────────────────────────────────────────────

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 500,
        padding: '6px 12px',
        borderRadius: 999,
        border: `1px solid ${active ? 'var(--teal)' : 'var(--border-mid)'}`,
        background: active ? 'var(--teal-soft)' : 'var(--surface)',
        color: active ? 'var(--teal-dark)' : 'var(--slate)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        color: 'var(--ink)',
        background: 'var(--surface)',
        border: '1px solid var(--border-mid)',
        borderRadius: 'var(--radius-sm)',
        padding: '7px 10px',
        cursor: 'pointer',
        outline: 'none',
        minWidth: 140,
      }}
    >
      {children}
    </select>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FacilitiesPage() {
  const [filters, setFilters] = useState<Filters>({
    search: '', state: '', type: '', capability: '', abdm: false, ctri: false, research: false,
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [filters.search]);

  const buildParams = useCallback(
    (currentOffset: number) => {
      const p = new URLSearchParams();
      if (debouncedSearch) p.set('search', debouncedSearch);
      if (filters.state)      p.set('state', filters.state);
      if (filters.type)       p.set('type', filters.type);
      if (filters.capability) p.set('capability', filters.capability);
      if (filters.abdm)       p.set('abdm', 'true');
      if (filters.ctri)       p.set('ctri', 'true');
      if (filters.research)   p.set('research', 'true');
      p.set('limit', String(PAGE_LIMIT));
      p.set('offset', String(currentOffset));
      return p;
    },
    [debouncedSearch, filters.state, filters.type, filters.capability, filters.abdm, filters.ctri, filters.research]
  );

  // Initial / filter-change fetch
  useEffect(() => {
    setOffset(0);
    setFacilities([]);
    setTotal(0);
    setError(null);
    setLoading(true);

    fetch(`/api/ome/facilities?${buildParams(0).toString()}`)
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setFacilities(data.facilities);
        setTotal(data.total);
        setOffset(data.offset + data.facilities.length);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load facilities');
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildParams]);

  function loadMore() {
    setLoadingMore(true);

    fetch(`/api/ome/facilities?${buildParams(offset).toString()}`)
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setFacilities((prev) => [...prev, ...data.facilities]);
        setOffset(offset + data.facilities.length);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load more facilities');
      })
      .finally(() => setLoadingMore(false));
  }

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const hasMore = total > offset;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <SiteHeader />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 26,
            color: 'var(--ink)',
            margin: '0 0 4px',
          }}>
            Facility Directory
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--slate)',
            margin: 0,
          }}>
            Hospitals, labs, and clinics across India
          </p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search by name, city, or state…"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            style={{
              width: '100%',
              maxWidth: 480,
              padding: '10px 14px',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--ink)',
              background: 'var(--surface)',
              border: '1px solid var(--border-mid)',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--teal)'; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border-mid)'; }}
          />
        </div>

        {/* Filter row */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          marginBottom: 28,
          padding: '14px 16px',
          background: 'var(--surface)',
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius)',
        }}>
          {/* Facility type */}
          <FilterSelect value={filters.type} onChange={(v) => setFilter('type', v)}>
            <option value="">All types</option>
            {FACILITY_TYPES.map((t) => (
              <option key={t} value={t}>{FACILITY_TYPE_LABELS[t]}</option>
            ))}
          </FilterSelect>

          {/* State */}
          <FilterSelect value={filters.state} onChange={(v) => setFilter('state', v)}>
            <option value="">All states</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </FilterSelect>

          {/* Capability */}
          <FilterSelect value={filters.capability} onChange={(v) => setFilter('capability', v)}>
            <option value="">All capabilities</option>
            {CAPABILITIES.map((c) => (
              <option key={c} value={c}>{CAPABILITY_LABELS[c]}</option>
            ))}
          </FilterSelect>

          {/* Toggle buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <ToggleBtn active={filters.abdm}     onClick={() => setFilter('abdm',     !filters.abdm)}>ABDM</ToggleBtn>
            <ToggleBtn active={filters.ctri}     onClick={() => setFilter('ctri',     !filters.ctri)}>CTRI</ToggleBtn>
            <ToggleBtn active={filters.research} onClick={() => setFilter('research', !filters.research)}>Research Active</ToggleBtn>
          </div>

          {/* Result count */}
          {!loading && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--muted)',
              marginLeft: 'auto',
            }}>
              {total} {total === 1 ? 'facility' : 'facilities'}
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '16px 20px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 24,
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#b91c1c', margin: 0 }}>
              {error}
            </p>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && facilities.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '64px 24px',
            background: 'var(--surface)',
            border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius)',
          }}>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              color: 'var(--slate)',
              margin: '0 0 8px',
            }}>
              No facilities match your filters
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>
              Try adjusting the search or removing some filters.
            </p>
          </div>
        )}

        {/* Results grid */}
        {!loading && facilities.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {facilities.map((f) => <FacilityCard key={f.id} facility={f} />)}
          </div>
        )}

        {/* Load more */}
        {!loading && hasMore && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <button
              onClick={loadMore}
              disabled={loadingMore}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 600,
                padding: '10px 28px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-mid)',
                background: 'var(--surface)',
                color: 'var(--slate)',
                cursor: loadingMore ? 'not-allowed' : 'pointer',
                opacity: loadingMore ? 0.6 : 1,
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!loadingMore) {
                  e.currentTarget.style.background = 'var(--teal-faint)';
                  e.currentTarget.style.borderColor = 'var(--teal)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface)';
                e.currentTarget.style.borderColor = 'var(--border-mid)';
              }}
            >
              {loadingMore ? 'Loading…' : `Load more (${total - offset} remaining)`}
            </button>
          </div>
        )}
      </div>

      {/* Pulse animation for skeletons */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}
