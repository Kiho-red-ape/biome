import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://biome.to';
  return {
    rules: [
      {
        userAgent: '*',
        allow:     ['/', '/experiments', '/experiments/', '/org/'],
        disallow:  [
          '/api/',
          '/dashboard/',
          '/onboarding/',
          '/post',
          '/admin/',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
