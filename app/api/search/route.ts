import { NextRequest, NextResponse } from 'next/server';
import { createAnonClient } from '@/lib/supabase/anon';
import type { Experiment } from '@/lib/types';
import type { CTGovStudy } from '@/lib/types/ctgov';

// GET /api/search?q=keyword&source=all|biome|ctgov&category=microbiome&sort=relevance|recent|starting
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q        = (searchParams.get('q') ?? '').trim();
  const source   = (searchParams.get('source') ?? 'all') as 'all' | 'biome' | 'ctgov';
  const category = searchParams.get('category') ?? '';
  const sort     = searchParams.get('sort') ?? 'recent';

  if (!q) {
    return NextResponse.json({ biome_results: [], ctgov_results: [], total_biome: 0, total_ctgov: 0 });
  }

  const supabase = createAnonClient();
  const promises: [Promise<Experiment[]>, Promise<CTGovStudy[]>] = [
    Promise.resolve([]),
    Promise.resolve([]),
  ];

  // ── BIOME search ─────────────────────────────────────────────────────���────
  if (source === 'all' || source === 'biome') {
    promises[0] = (async () => {
      let query = supabase
        .from('experiments')
        .select('*')
        .neq('status', 'draft')
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`)
        .limit(50);

      if (category) query = query.ilike('category', `%${category}%`);
      if (sort === 'recent') query = query.order('created_at', { ascending: false });

      const { data } = await query;
      return (data ?? []) as Experiment[];
    })();
  }

  // ── CT.gov search ─────────────────────────────────────────────────────────
  if (source === 'all' || source === 'ctgov') {
    promises[1] = (async () => {
      let query = supabase
        .from('ctgov_studies')
        .select('*')
        .or(`title.ilike.%${q}%,brief_summary.ilike.%${q}%`)
        .in('status', ['RECRUITING', 'NOT_YET_RECRUITING'])
        .limit(100);

      if (category) query = query.eq('biome_category', category.toLowerCase());
      if (sort === 'starting') query = query.order('start_date', { ascending: true });
      else                     query = query.order('last_synced_at', { ascending: false });

      const { data } = await query;
      return (data ?? []) as CTGovStudy[];
    })();
  }

  const [biomeResults, ctgovResults] = await Promise.all(promises);

  return NextResponse.json({
    biome_results: biomeResults,
    ctgov_results: ctgovResults,
    total_biome:   biomeResults.length,
    total_ctgov:   ctgovResults.length,
  });
}
