'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/nav/header';
import { CTGovCard } from '@/components/registry/ctgov-card';
import { getBountyTier, getTierLabel, getTierColor } from '@/lib/bounty-tiers';
import type { Experiment } from '@/lib/types';
import type { CTGovStudy } from '@/lib/types/ctgov';

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchResults = {
  biome_results: Experiment[];
  ctgov_results: CTGovStudy[];
  total_biome:   number;
  total_ctgov:   number;
};

// ─── Chips config ─────────────────────────────────────────────────────────────

const SOURCE_CHIPS  = [
  { label: 'All',            value: 'all'   },
  { label: 'BIOME studies',  value: 'biome' },
  { label: 'Public registry', value: 'ctgov' },
] as const;

const CATEGORY_CHIPS = [
  'All', 'Microbiome', 'Nutrition', 'Sleep', 'Wearables', 'Longevity', 'Quantified Self',
] as const;

const SORT_OPTIONS = [
  { label: 'Most recent', value: 'recent'    },
  { label: 'Starting soon', value: 'starting' },
] as const;

// ─── Mini BIOME result card ───────────────────────────────────────────────────

function BiomeResultCard({ exp }: { exp: Experiment }) {
  const tier  = getBountyTier(exp.bounty_per_participant);
  const color = getTierColor(tier);
  const label = getTierLabel(tier);

  return (
    <Link
      href={`/experiments/${exp.id}`}
      style={{
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg2)',
        border: '1px solid rgba(77,255,128,0.08)',
        borderTop: `2px solid #b7ff61`,
        borderRadius: 4, textDecoration: 'none',
        padding: 16, gap: 8,
        transition: 'border-color 200ms',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(183,255,97,0.2)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(77,255,128,0.08)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#b7ff61', letterSpacing: '1.5px' }}>
          // BIOME
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase',
          color: '#4a7055', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 2, padding: '1px 5px',
        }}>
          {exp.category}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: exp.status === 'active' ? '#8ee7ff' : '#b7ff61',
          marginLeft: 'auto',
        }}>
          ● {exp.status.toUpperCase()}
        </span>
      </div>

      <p style={{
        fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600,
        color: '#eef4f0', lineHeight: 1.35,
        display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0,
      }}>
        {exp.title}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {exp.status === 'active' ? (
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#b7ff61' }}>
            ${exp.bounty_per_participant}/participant
          </span>
        ) : (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
            color, background: `${color}26`, border: `1px solid ${color}50`,
            borderRadius: 3, padding: '2px 7px',
          }}>
            {label}
          </span>
        )}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#4a7055' }}>
          {exp.slots_filled}/{exp.slots_total} slots
        </span>
      </div>
    </Link>
  );
}

// ─── Search page inner ────────────────────────────────────────────────────────

function SearchInner() {
  const router      = useRouter();
  const searchParams = useSearchParams();

  const [query,    setQuery]    = useState(searchParams.get('q') ?? '');
  const [source,   setSource]   = useState<string>(searchParams.get('source') ?? 'all');
  const [category, setCategory] = useState<string>(searchParams.get('category') ?? 'All');
  const [sort,     setSort]     = useState<string>('recent');
  const [results,  setResults]  = useState<SearchResults | null>(null);
  const [loading,  setLoading]  = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const cat = category === 'All' ? '' : category.toLowerCase().replace(' ', '_');
        const params = new URLSearchParams({ q: query, source, sort });
        if (cat) params.set('category', cat);
        const res  = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json() as SearchResults;
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, source, category, sort]);

  const chipBase: React.CSSProperties = {
    flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
    letterSpacing: '1px', padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#aab8b1', transition: 'all 150ms',
  };
  const chipOn: React.CSSProperties = { ...chipBase, border: '1px solid #b7ff6150', background: 'rgba(183,255,97,0.12)', color: '#b7ff61' };

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader />

      <div className="px-4 sm:px-10 max-w-screen-xl mx-auto" style={{ paddingTop: 40, paddingBottom: 64 }}>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aab8b1" strokeWidth="2"
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search studies by keyword, condition, or intervention..."
            style={{
              width: '100%', height: 56, background: '#0d1117',
              border: `1px solid ${query ? '#b7ff61' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 8, paddingLeft: 48, paddingRight: query ? 44 : 16,
              fontFamily: 'var(--font-mono)', fontSize: 14, color: '#eef4f0',
              outline: 'none', boxSizing: 'border-box', transition: 'border-color 200ms',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#aab8b1', fontSize: 20, lineHeight: 1,
            }}>×</button>
          )}
        </div>

        {/* Source + category chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 12, scrollbarWidth: 'none' }}>
          {SOURCE_CHIPS.map((c) => (
            <button key={c.value} onClick={() => setSource(c.value)} style={source === c.value ? chipOn : chipBase}>
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 8, scrollbarWidth: 'none' }}>
          {CATEGORY_CHIPS.map((c) => (
            <button key={c} onClick={() => setCategory(c)} style={category === c ? chipOn : chipBase}>
              {c}
            </button>
          ))}
        </div>

        {/* Sort + results count */}
        {results && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a7055' }}>
              {results.total_biome} BIOME studies · {results.total_ctgov} public registry trials
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, padding: '4px 10px',
                background: '#0d1117', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 20, color: '#aab8b1', cursor: 'pointer',
              }}
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a7055', marginBottom: 24 }}>Searching…</p>
        )}

        {/* Empty state */}
        {!query.trim() && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#4a7055' }}>
              Type above to search across BIOME studies and ClinicalTrials.gov
            </p>
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <>
            {/* BIOME results */}
            {results.biome_results.length > 0 && (source === 'all' || source === 'biome') && (
              <div style={{ marginBottom: 40 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px', color: '#b7ff61', marginBottom: 16 }}>
                  // BIOME_STUDIES ({results.total_biome})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.biome_results.map((exp) => (
                    <BiomeResultCard key={exp.id} exp={exp} />
                  ))}
                </div>
              </div>
            )}

            {/* CT.gov results */}
            {results.ctgov_results.length > 0 && (source === 'all' || source === 'ctgov') && (
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px', color: '#aab8b1', marginBottom: 16 }}>
                  // PUBLIC_REGISTRY ({results.total_ctgov})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.ctgov_results.map((study) => (
                    <CTGovCard key={study.id} study={study} />
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {results.total_biome === 0 && results.total_ctgov === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#aab8b1' }}>
                  No results for &ldquo;{query}&rdquo;. Try different keywords.
                </p>
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}

// ─── Page wrapper (Suspense required for useSearchParams) ───────────────────��─

export default function SearchPage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}
