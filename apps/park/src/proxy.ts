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
const ALLOWED_METHODS = 'GET, HEAD';

function methodHeaders() {
  return {
    Allow: ALLOWED_METHODS,
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'X-Robots-Tag': 'noindex, nofollow',
  };
}

export function proxy(request: NextRequest) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new NextResponse(null, {
      status: 405,
      headers: methodHeaders(),
    });
  }

  const response = NextResponse.next();

  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Allow', ALLOWED_METHODS);
  response.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS);

  return response;
}

export const config = {
  matcher: [
    /*
      Apply to pages, but skip Next internals/static assets.
      Adjust this to your app.
    */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
