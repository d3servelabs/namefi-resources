import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getCanonicalRedirect,
  isIndexableHost,
} from '@namefi-astra/common/host-policy';
import { config as configEnv } from './lib/env';
import {
  isThirdPartyOriginKey,
  getThirdPartyOriginRouteSegment,
  type ThirdPartyOriginKey,
} from './lib/origin/keys';

function getOwnRecordValue(
  record: Record<string, string>,
  key: string,
): string | null {
  return Object.hasOwn(record, key) ? (record[key] ?? null) : null;
}

function getCanonicalThirdPartyHostname(
  hostname: string,
): ThirdPartyOriginKey | null {
  if (isThirdPartyOriginKey(hostname)) {
    return hostname;
  }

  const mappedHostname = getOwnRecordValue(
    configEnv.ADDITIONAL_HOSTNAME_MAP,
    hostname,
  );

  return mappedHostname && isThirdPartyOriginKey(mappedHostname)
    ? mappedHostname
    : null;
}

function getRequestHostname(request: NextRequest): string {
  const forwardedHost =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    request.nextUrl.host;

  const candidate = forwardedHost.split(',')[0]?.trim();
  if (!candidate) {
    return '';
  }

  try {
    return new URL(`http://${candidate}`).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function rewritePath(request: NextRequest, pathname: string): NextResponse {
  const destination = request.nextUrl.clone();
  destination.pathname = pathname;
  return NextResponse.rewrite(destination);
}

/**
 * Extracts path params from a pathname based on a route pattern.
 * Example: extractPathParams("/m/user/orders/123", "/m/user/orders/[orderId]") => { orderId: "123" }
 */
function extractPathParams(
  pathname: string,
  pattern: string,
): Record<string, string> {
  const pathParts = pathname.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);
  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    if (patternPart?.startsWith('[') && patternPart.endsWith(']')) {
      const paramName = patternPart.slice(1, -1);
      const pathPart = pathParts[i];
      if (pathPart) {
        params[paramName] = pathPart;
      }
    }
  }

  return params;
}

/**
 * Route definitions for /m/* redirects
 */
const redirectRoutes = [
  {
    pattern: /^\/m\/user\/payment-methods$/,
    getDestination: () => '/payment-methods',
  },
  {
    pattern: /^\/m\/user\/nfsc\/recharge$/,
    getDestination: () => '/payment-methods?charge-nfsc=true',
  },
  {
    pattern: /^\/m\/cart$/,
    getDestination: () => '/cart',
  },
  {
    pattern: /^\/m\/user\/orders\/([^/]+)$/,
    getDestination: (pathname: string) => {
      const params = extractPathParams(
        pathname,
        '/m/user/orders/[orderId]/details',
      );
      return `/orders/${params.orderId}`;
    },
  },
  {
    pattern: /^\/m\/user\/orders$/,
    getDestination: () => '/orders',
  },
  {
    pattern: /^\/m\/user\/domains\/([^/]+)$/,
    getDestination: (pathname: string) => {
      const params = extractPathParams(pathname, '/m/user/domains/[domain]');
      return `/domains/${params.domain}`;
    },
  },
  {
    pattern: /^\/m\/user\/domains$/,
    getDestination: () => '/domains',
  },
  {
    pattern: /^\/m\/user\/email\/subscription$/,
    getDestination: () =>
      '/profile?tab=contact-details&focus=email-subscription',
  },
  {
    pattern: /^\/m\/user\/contact$/,
    getDestination: () => '/profile?tab=contact-details',
  },
  {
    pattern: /^\/m\/user\/rewards\/domains$/,
    getDestination: () => '/free-mints',
  },
];

/**
 * Apply host-indexing policy to a response: stamp X-Robots-Tag when the
 * incoming host is not on the public-indexable allowlist. Pairs with
 * the robots.ts allowlist for belt-and-suspenders coverage.
 */
function withHostPolicyHeader(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  if (!isIndexableHost(request.headers.get('host'))) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const host = request.headers.get('host');

  // 308 redirect deprecated/duplicate hosts (astra.namefi.io, app.namefi.io,
  // www.namefi.io) to their canonical equivalents. Preserves path + query.
  // Done first so the redirect short-circuits all other proxy logic.
  //
  // Security: do NOT compose the destination as
  //   new URL(pathname + search, canonicalOrigin)
  // because the URL constructor would interpret a pathname starting with
  // `//attacker.com` as a scheme-relative reference and switch the origin
  // to attacker.com — an open redirect. Instead, start from the canonical
  // origin and assign pathname/search on the resulting URL; that pins the
  // origin regardless of what the pathname contains.
  const canonicalOrigin = getCanonicalRedirect(host);
  if (canonicalOrigin) {
    const redirectTo = new URL(canonicalOrigin);
    redirectTo.pathname = pathname;
    redirectTo.search = request.nextUrl.search;
    return NextResponse.redirect(redirectTo, 308);
  }

  if (pathname === '/') {
    const hostname = getRequestHostname(request);
    const canonicalHostname = getCanonicalThirdPartyHostname(hostname);

    if (canonicalHostname) {
      const routeSegment = getThirdPartyOriginRouteSegment(canonicalHostname);
      return rewritePath(
        request,
        `/site/${routeSegment}/landing/${routeSegment}`,
      );
    }
  }

  // Only process /m/* paths for further redirect handling; everything else
  // passes through with the host-policy header applied.
  if (!pathname.startsWith('/m/')) {
    return withHostPolicyHeader(request, NextResponse.next());
  }

  // Find matching route
  const matchedRoute = redirectRoutes.find((route) =>
    route.pattern.test(pathname),
  );

  if (!matchedRoute) {
    return NextResponse.next();
  }

  // Get default hostname from environment
  // In middleware, we need to parse the URL from env var or use a default
  const firstPartyDeploymentUrl =
    configEnv.FIRST_PARTY_DEPLOYMENT_URL || 'https://namefi.io';

  let defaultHost: string;
  try {
    defaultHost = new URL(firstPartyDeploymentUrl).hostname;
  } catch {
    defaultHost = 'namefi.io';
  }

  let redirectHostname = defaultHost;
  const maybePoweredByNamefiDomain = searchParams
    .get('powered-by-namefi')
    ?.toLowerCase();

  if (
    maybePoweredByNamefiDomain &&
    isThirdPartyOriginKey(maybePoweredByNamefiDomain)
  ) {
    redirectHostname = maybePoweredByNamefiDomain;
  }

  // Build destination path
  const destinationPath = matchedRoute.getDestination(pathname);

  // Remove powered-by-namefi from search params
  const newSearchParams = new URLSearchParams(searchParams);
  newSearchParams.delete('powered-by-namefi');
  const queryString = newSearchParams.toString();

  // Determine protocol
  const isLocalhost =
    redirectHostname === 'localhost' ||
    redirectHostname.startsWith('localhost:');
  const protocol = isLocalhost ? 'http' : 'https';

  // Build final destination URL
  const destination = `${protocol}://${redirectHostname}${destinationPath}${
    queryString ? `?${queryString}` : ''
  }`;

  return NextResponse.redirect(destination, { status: 307 });
}

export const config = {
  // Matcher runs on:
  //   - `/` and `/m/:path*` for the original third-party-origin / mobile-app
  //     redirect logic
  //   - everything else (except Next.js internals) so the host-policy
  //     X-Robots-Tag header and the canonical-host 308 redirect can apply
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
