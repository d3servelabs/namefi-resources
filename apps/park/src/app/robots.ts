import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import {
  buildParkCanonicalUrl,
  isIndexableParkHost,
  resolveTrustedParkHost,
} from '@/lib/indexing-policy';

// The park app exclusively serves tenant subdomains and the parked-domain
// landing service (e.g., taylor.cv.poweredby.namefi.io,
// li.cv.astra.namefi.io, *.today.*.namefi.io, park.namefi.io itself).
//
// Default policy remains non-indexable. A tiny allowlist can opt specific
// parked apex hosts into crawling. For those hosts, robots.txt must not
// disallow subpaths: Google needs to crawl a stale subpath to observe the
// X-Robots-Tag noindex header and refresh or remove it from the index.
//
// Paired with the X-Robots-Tag proxy (apps/park/src/proxy.ts) for
// path-level noindex coverage.
// biome-ignore lint/style/noDefaultExport: Next.js metadata route API requires default export.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const host = resolveTrustedParkHost({
    host: requestHeaders.get('host'),
    originalHost: requestHeaders.get('x-original-host'),
  });

  if (isIndexableParkHost(host)) {
    const canonicalUrl = buildParkCanonicalUrl(host);
    return {
      rules: [{ userAgent: '*', allow: '/' }],
      ...(canonicalUrl ? { sitemap: `${canonicalUrl}sitemap.xml` } : {}),
    };
  }

  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  };
}
