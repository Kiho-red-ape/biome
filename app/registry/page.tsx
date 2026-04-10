import { createAnonClient } from '@/lib/supabase/anon';
import { SiteHeader } from '@/components/nav/header';
import type { CTGovStudy } from '@/lib/types/ctgov';
import { CTGovCard } from '@/components/registry/ctgov-card';
import { RegistryFilters } from './registry-filters';

const CATEGORIES = ['microbiome', 'nutrition', 'sleep', 'wearables', 'longevity', 'quantified_self', 'other'] as const;
const SPONSOR_CLASSES = ['INDUSTRY', 'NIH', 'ACADEMIC', 'OTHER'] as const;

interface PageProps {
  searchParams: Promise<{ category?: string; sponsor?: string; status?: string }>;
}

export default async function RegistryPage({ searchParams }: PageProps) {
  const params   = await searchParams;
  const category = params.category ?? '';
  const sponsor  = params.sponsor  ?? '';
  const status   = params.status   ?? '';

  const supabase = createAnonClient();

  let query = supabase
    .from('ctgov_studies')
    .select('*')
    .in('status', ['RECRUITING', 'NOT_YET_RECRUITING'])
    .order('last_synced_at', { ascending: false })
    .limit(200);

  if (category) query = query.eq('biome_category', category);
  if (sponsor)  query = query.eq('sponsor_class', sponsor);
  if (status)   query = query.eq('status', status);

  const { data, error } = await query;
  const studies = (error ? [] : (data ?? [])) as CTGovStudy[];

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <SiteHeader />

      <div className="px-4 sm:px-10 max-w-screen-xl mx-auto" style={{ paddingTop: 40, paddingBottom: 64 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#aab8b1', textTransform: 'uppercase', marginBottom: 8 }}>
            // PUBLIC_REGISTRY
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: '#eef4f0', marginBottom: 12, lineHeight: 1.2 }}>
            Clinical Trials Registry
          </h1>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#7f8e87', maxWidth: 640, lineHeight: 1.6 }}>
            Studies from ClinicalTrials.gov in BIOME&apos;s categories. These trials are not operated by BIOME.
            Click through to apply directly on the official ClinicalTrials.gov page.
          </p>
        </div>

        {/* Filters (client component) */}
        <RegistryFilters
          categories={[...CATEGORIES]}
          sponsorClasses={[...SPONSOR_CLASSES]}
          currentCategory={category}
          currentSponsor={sponsor}
          currentStatus={status}
          totalCount={studies.length}
        />

        {/* Grid */}
        {studies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#aab8b1', marginBottom: 8 }}>
              No trials found matching your filters.
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#4a7055' }}>
              The registry is synced weekly from ClinicalTrials.gov.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ marginTop: 24 }}>
            {studies.map((study) => (
              <CTGovCard key={study.id} study={study} />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
