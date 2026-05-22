import type { MetadataRoute } from 'next';
import { buildSitemapEntries } from '@/lib/sitemap';
import { resolveBaseUrl } from '@/lib/site-url';

// Only English pages are announced in the sitemap. Non-English locales remain
// crawlable via hreflang on English pages, but are not advertised to search
// engines as primary indexable content. This is part of an SEO recovery effort
// to address ~1,371 "Crawled - currently not indexed" pages caused by thin
// templated content across locales.
// biome-ignore lint/style/noDefaultExport: Next.js requires a default export for metadata routes.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolveBaseUrl();
  return buildSitemapEntries(baseUrl, ['en']);
}
