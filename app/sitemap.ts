import type { MetadataRoute } from 'next';
import { createAnonClient } from '@/lib/supabase/anon';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://biome.to';
  const supabase = createAnonClient();

  // Fetch published experiments
  const { data: experiments } = await supabase
    .from('experiments')
    .select('id, updated_at')
    .in('status', ['recruiting', 'active', 'completed'])
    .order('updated_at', { ascending: false });

  // Fetch approved experimenter profiles (org pages)
  const { data: orgs } = await supabase
    .from('experimenter_profiles')
    .select('id, updated_at')
    .eq('screening_status', 'approved');

  const experimentUrls: MetadataRoute.Sitemap = (experiments ?? []).map((e) => ({
    url:          `${base}/experiments/${e.id}`,
    lastModified: e.updated_at ? new Date(e.updated_at) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const orgUrls: MetadataRoute.Sitemap = (orgs ?? []).map((o) => ({
    url:          `${base}/org/${o.id}`,
    lastModified: o.updated_at ? new Date(o.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [
    {
      url:             `${base}/`,
      lastModified:    new Date(),
      changeFrequency: 'hourly',
      priority:        1.0,
    },
    {
      url:             `${base}/experiments`,
      lastModified:    new Date(),
      changeFrequency: 'hourly',
      priority:        0.9,
    },
    ...experimentUrls,
    ...orgUrls,
  ];
}
