import type { MetadataRoute } from 'next';
import { config } from '@/lib/env';

const PUBLIC_STATIC_ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/hunt', priority: 0.9, changeFrequency: 'daily' },
  { path: '/mls/feed', priority: 0.8, changeFrequency: 'daily' },
  { path: '/tlds', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/newsletter', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/education', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/abuse', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/registration-agreement', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/tos', priority: 0.4, changeFrequency: 'yearly' },
] as const;

function toAbsoluteUrl(path: string): string {
  return new URL(path, config.FIRST_PARTY_DEPLOYMENT_URL).toString();
}

// biome-ignore lint/style/noDefaultExport: Next.js metadata route API requires default export.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = PUBLIC_STATIC_ROUTES.map(
    (route) => ({
      url: toAbsoluteUrl(route.path),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }),
  );

  const campaignEntries: MetadataRoute.Sitemap = config.HUNT_CAMPAIGN_KEYS.map(
    (campaignKey) => ({
      url: toAbsoluteUrl(`/hunt/campaigns/${campaignKey}`),
      changeFrequency: 'daily',
      priority: 0.7,
    }),
  );

  return [...staticEntries, ...campaignEntries];
}
