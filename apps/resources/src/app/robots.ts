import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { isIndexableHost } from '@namefi-astra/common/host-policy';
import { resolveBaseUrl } from '@/lib/site-url';

const ROOT_SITEMAP_PATH = '/r/sitemap.xml';

// The resources Vercel project serves multiple hosts:
//   - namefi.io  (user-facing, indexable; reached via frontend's /r/* rewrite)
//   - r.namefi.io / r.namefi.dev (internal proxy origin, NOT user-facing,
//     NOT for direct crawling — robots.txt here tells Google to stay out)
//   - preview deployments (not for indexing)
//
// robots.txt is per-host, so when Googlebot fetches r.namefi.io/robots.txt
// it sees Disallow: /. When the user-facing apex fetches its own
// robots.txt (handled by apps/frontend), it sees the indexable response.
// biome-ignore lint/style/noDefaultExport: Next.js requires a default export for metadata routes.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get('host');

  if (!isIndexableHost(host)) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  const baseUrl = resolveBaseUrl();
  return {
    rules: [{ userAgent: '*' }],
    host: baseUrl,
    sitemap: [`${baseUrl}${ROOT_SITEMAP_PATH}`],
  };
}
