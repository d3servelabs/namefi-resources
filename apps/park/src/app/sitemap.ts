import type { MetadataRoute } from 'next';

// The park app is non-indexable across all hosts it serves (see
// apps/park/src/app/robots.ts for rationale). An empty sitemap declares
// no indexable URLs. Kept as a route so anything that hard-coded
// /sitemap.xml gets a valid empty response rather than a 404.
// biome-ignore lint/style/noDefaultExport: Next.js metadata route API requires default export.
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
