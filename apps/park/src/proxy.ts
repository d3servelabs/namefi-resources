import { type NextRequest, NextResponse } from 'next/server';
import { shouldNoindexParkRequest } from '@/lib/indexing-policy';

/**
 * Set X-Robots-Tag: noindex, nofollow on non-indexable park responses.
 *
 * The park app exclusively serves tenant subdomains (CV brand pages,
 * parked-domain landing pages) under namefi.io. Default policy is
 * non-indexable, with explicit host/path exceptions for parked roots that
 * should appear in Google. Robots.txt remains permissive on allowlisted hosts
 * so Google can crawl subpaths and observe this noindex header.
 *
 * The current allowlist indexes only https://30003.click/ and no subpaths.
 */
const ALLOWED_METHODS = 'GET, HEAD';

function methodHeaders(shouldNoindex: boolean) {
  const headers: Record<string, string> = {
    Allow: ALLOWED_METHODS,
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
  };
  if (shouldNoindex) {
    headers['X-Robots-Tag'] = 'noindex, nofollow';
  }
  return headers;
}

export function proxy(request: NextRequest) {
  const shouldNoindex = shouldNoindexParkRequest({
    host: request.headers.get('x-original-host') ?? request.headers.get('host'),
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
  });

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new NextResponse(null, {
      status: 405,
      headers: methodHeaders(true),
    });
  }

  const response = NextResponse.next();

  if (shouldNoindex) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
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
