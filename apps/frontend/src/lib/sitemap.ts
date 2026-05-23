import type { MetadataRoute } from 'next';
import { config } from '@/lib/env';

// Hunt campaign keys to exclude from the sitemap. The campaign pages remain
// reachable via direct links and existing UI surfaces, but are no longer
// announced to search engines.
const SITEMAP_EXCLUDED_CAMPAIGN_KEYS = new Set<string>(['cv-2025-07-16']);

// Legal / compliance pages (/abuse, /registration-agreement, /tos) are
// intentionally omitted: they have no organic-search value and consume
// crawl budget. They remain discoverable via footer links.
const PUBLIC_STATIC_ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/hunt', priority: 0.9, changeFrequency: 'daily' },
  { path: '/feed', priority: 0.8, changeFrequency: 'daily' },
  { path: '/tlds', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/newsletter', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/education', priority: 0.5, changeFrequency: 'monthly' },
] as const;

function toAbsoluteUrl(path: string): string {
  return new URL(path, config.FIRST_PARTY_DEPLOYMENT_URL).toString();
}

function getBaseOrigin() {
  return new URL(config.FIRST_PARTY_DEPLOYMENT_URL).origin;
}

export function buildSitemapEntries(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = PUBLIC_STATIC_ROUTES.map(
    (route) => {
      const entry: MetadataRoute.Sitemap[number] = {
        url: toAbsoluteUrl(route.path),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      };
      // The homepage aggregates frequently-changing content (hunt highlights,
      // feeds, featured TLDs), so we announce it as updated each time the
      // sitemap is generated. Other static pages omit lastModified so we
      // don't send a misleading freshness signal for unchanged copy.
      if (route.path === '/') {
        entry.lastModified = new Date();
      }
      return entry;
    },
  );

  const campaignEntries: MetadataRoute.Sitemap =
    config.HUNT_CAMPAIGN_KEYS.filter(
      (campaignKey) => !SITEMAP_EXCLUDED_CAMPAIGN_KEYS.has(campaignKey),
    ).map((campaignKey) => ({
      url: toAbsoluteUrl(`/hunt/campaigns/${campaignKey}`),
      changeFrequency: 'daily',
      priority: 0.7,
    }));

  return [...staticEntries, ...campaignEntries];
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

// Flat sitemap index — points directly at leaf urlsets. We avoid listing
// /r/sitemap.xml because it is itself a sitemap index, and Google does not
// support sitemap-index files that reference other sitemap-index files.
export function buildSitemapIndexXml(): string {
  const baseOrigin = getBaseOrigin();
  const sitemapUrls = [
    new URL('/sitemap/sitemap.xml', baseOrigin).toString(),
    new URL('/r/sitemap-pages.xml', baseOrigin).toString(),
    new URL('/r/sitemap-videos.xml', baseOrigin).toString(),
  ];
  const sitemapsXml = sitemapUrls
    .map(
      (sitemapUrl) => `<sitemap><loc>${escapeXml(sitemapUrl)}</loc></sitemap>`,
    )
    .join('');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapsXml}</sitemapindex>`
  );
}
