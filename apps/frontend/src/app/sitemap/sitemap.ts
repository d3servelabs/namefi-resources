import type { MetadataRoute } from 'next';
import { buildSitemapEntries } from '@/lib/sitemap';

// Refresh the sitemap once per day so the homepage's lastModified actually
// reflects "today" rather than the deploy timestamp.
export const revalidate = 86400;

// biome-ignore lint/style/noDefaultExport: Next.js metadata route API requires default export.
export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries();
}
