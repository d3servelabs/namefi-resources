import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import {
  buildParkCanonicalUrl,
  resolveTrustedParkHost,
} from '@/lib/indexing-policy';

// The park app is non-indexable by default. Indexable parked hosts list only
// their apex root here; subpaths remain crawlable only so X-Robots-Tag noindex
// can be refreshed by Google.
// biome-ignore lint/style/noDefaultExport: Next.js metadata route API requires default export.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHeaders = await headers();
  const host = resolveTrustedParkHost({
    host: requestHeaders.get('host'),
    originalHost: requestHeaders.get('x-original-host'),
  });
  const canonicalUrl = buildParkCanonicalUrl(host);
  return canonicalUrl ? [{ url: canonicalUrl }] : [];
}
