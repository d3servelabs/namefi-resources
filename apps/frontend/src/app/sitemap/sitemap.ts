import type { MetadataRoute } from 'next';
import { buildSitemapEntries } from '@/lib/sitemap';

// biome-ignore lint/style/noDefaultExport: Next.js metadata route API requires default export.
export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries();
}
