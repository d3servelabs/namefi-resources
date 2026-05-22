import type { MetadataRoute } from 'next';

// The park app exclusively serves tenant subdomains and the parked-domain
// landing service (e.g., taylor.cv.poweredby.namefi.io,
// li.cv.astra.namefi.io, *.today.*.namefi.io, park.namefi.io itself).
//
// None of these surfaces are intended for public search indexing — they
// represent customer-owned brand pages and infrastructure rather than
// namefi.io content. Returning Disallow: / unconditionally keeps Google
// out and reclaims crawl budget for the namefi.io main site.
//
// Paired with the X-Robots-Tag middleware (apps/park/src/middleware.ts)
// for belt-and-suspenders noindex coverage.
// biome-ignore lint/style/noDefaultExport: Next.js metadata route API requires default export.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  };
}
