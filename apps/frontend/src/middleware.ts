import { type NextRequest, NextResponse } from 'next/server';
import {
  getCanonicalRedirect,
  isIndexableHost,
} from '@namefi-astra/common/host-policy';

/**
 * Host-policy middleware.
 *
 * Two responsibilities:
 *
 * 1. **308 redirect deprecated/duplicate hosts** to their canonical
 *    equivalents (e.g., astra.namefi.io → namefi.io). Preserves path
 *    and query string. Transfers SEO rank from the old URL.
 *
 * 2. **noindex header on non-indexable hosts.** Belt-and-suspenders
 *    alongside robots.txt: even if Google reaches a page on a
 *    non-allowlisted host via a backlink, this header prevents indexing.
 *    robots.txt only governs crawling, not indexing.
 *
 * Policy lives in packages/common/src/host-policy.ts.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get('host');

  const canonical = getCanonicalRedirect(host);
  if (canonical) {
    const redirectTo = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      canonical,
    );
    return NextResponse.redirect(redirectTo, 308);
  }

  const response = NextResponse.next();
  if (!isIndexableHost(host)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}

export const config = {
  // Run on all paths except Next.js internals and static assets.
  // Robots.txt and sitemap.xml are deliberately included so the
  // canonical-redirect rule applies to them too.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
