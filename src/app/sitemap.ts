import type { MetadataRoute } from 'next';
import { i18n } from '@/i18n-config';
import { resolveBaseUrl } from '@/lib/site-url';
import { buildSitemapEntries } from '@/lib/sitemap';

// biome-ignore lint/style/noDefaultExport: Next.js requires a default export for metadata routes.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolveBaseUrl();
  return buildSitemapEntries(baseUrl, i18n.locales);
}
