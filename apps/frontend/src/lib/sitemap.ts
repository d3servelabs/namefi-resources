import type { MetadataRoute } from 'next';
import { config } from '@/lib/env';

// Hunt campaign keys to exclude from the sitemap. The campaign pages remain
// reachable via direct links and existing UI surfaces, but are no longer
// announced to search engines.
const SITEMAP_EXCLUDED_CAMPAIGN_KEYS = new Set<string>(['cv-2025-07-16']);

// Legal / compliance pages (/abuse, /registration-agreement, /tos) are
// intentionally omitted: they have no organic-search value and consume
// crawl budget. They remain discoverable via footer links.
//
// Routes are ordered + weighted to steer Google sitelinks toward the six
// surfaces we want surfaced on the brand SERP:
//   1. "What Are Tokenized Domains?" — lives in the resources submodule and
//      is sitemapped via /r/sitemap-pages.xml (referenced by the sitemap
//      index below), so it does not appear in this list.
//   2. Import a Domain — /#import (homepage anchor; not separately indexable,
//      so no sitemap entry. The hash deep-link is for in-app/footer use.)
//   3. Manage Domains & DNS — /manage
//   4. NFT Gallery — /gallery
//   5. Customer Support — /customer-support
//   6. Newsletter — /newsletter (308 → /#newsletter; kept here so the URL is
//      crawlable and the redirect signal flows to the homepage anchor)
// `/hunt` was previously the highest-priority static route and dominated
// sitelinks; demoted so it stops crowding out the targets above.
const PUBLIC_STATIC_ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  // Promoted — sitelink targets
  { path: '/gallery', priority: 0.9, changeFrequency: 'daily' },
  { path: '/manage', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/customer-support', priority: 0.85, changeFrequency: 'monthly' },
  { path: '/newsletter', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/tlds', priority: 0.8, changeFrequency: 'weekly' },
  // Indexable but demoted so they don't compete for sitelink slots.
  // `/hunt` is intentionally omitted from this static list so it cannot
  // surface as a brand-SERP sitelink; the page itself remains reachable
  // via the in-app nav and is not noindexed.
  { path: '/feed', priority: 0.5, changeFrequency: 'daily' },
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
