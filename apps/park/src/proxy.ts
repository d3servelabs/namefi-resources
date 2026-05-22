import { type NextRequest, NextResponse } from 'next/server';

/**
 * Set X-Robots-Tag: noindex, nofollow on every response.
 *
 * The park app exclusively serves tenant subdomains (CV brand pages,
 * parked-domain landing pages) under namefi.io. None of these are
 * intended for public search indexing. Paired with robots.txt Disallow
 * for crawl-time blocking; this header prevents indexing even on URLs
 * Google reaches via backlinks.
 *
 * Unconditional because every host this app serves is non-indexable —
 * there's no allowlisted host on this Vercel project.
 */
export function proxy(_request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
