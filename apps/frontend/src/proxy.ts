import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES } from './lib/env/consts';

const isPoweredByNamefiDomains = (domain: string) => {
  return POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.includes(domain);
};

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

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Only process /m/* paths
  if (!pathname.startsWith('/m/')) {
    return NextResponse.next();
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
    process.env.NEXT_PUBLIC_FIRST_PARTY_DEPLOYMENT_URL ||
    process.env.FIRST_PARTY_DEPLOYMENT_URL ||
    'https://astra.namefi.io';

  let defaultHost: string;
  try {
    defaultHost = new URL(firstPartyDeploymentUrl).hostname;
  } catch {
    defaultHost = 'astra.namefi.io';
  }

  let redirectHostname = defaultHost;
  const maybePoweredByNamefiDomain = searchParams.get('powered-by-namefi');

  if (
    maybePoweredByNamefiDomain &&
    isPoweredByNamefiDomains(maybePoweredByNamefiDomain)
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
  matcher: '/m/:path*',
};
