import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getCanonicalRedirect,
  isIndexableHost,
} from '@namefi-astra/common/host-policy';
import { config as configEnv } from './lib/env';
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
  isLocale,
} from './i18n/config';
import {
  negotiateLocaleFromAcceptLanguage,
  resolveLocaleFromParam,
} from './i18n/negotiate';
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
  // Forward (possibly `?hl=`-mutated) request cookies to the rewritten render.
  return NextResponse.rewrite(destination, {
    request: { headers: request.headers },
  });
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

/** Google-style locale override query param (e.g. `?hl=zh`, `?hl=ar-EG`). */
const LOCALE_PARAM = 'hl';

/**
 * Apply a Google-style `?hl=<locale>` override onto the *request* so this very
 * render already resolves to it — next-intl reads the `NEXT_LOCALE` cookie in
 * src/i18n/request.ts, so pinning it on `request.cookies` and forwarding the
 * request downstream avoids a first-paint language flash on a shared link. The
 * matching *response* cookie is set separately (see {@link ensureLocaleCookie})
 * so the choice persists for later navigations. Returns the override locale, or
 * `null` when there is no valid `?hl=` or it already matches the active cookie.
 */
function applyLocaleOverrideToRequest(request: NextRequest): Locale | null {
  const override = resolveLocaleFromParam(
    request.nextUrl.searchParams.get(LOCALE_PARAM),
  );
  if (!override) return null;
  if (request.cookies.get(LOCALE_COOKIE)?.value === override) return null;
  request.cookies.set(LOCALE_COOKIE, override);
  return override;
}

/**
 * Locale auto-detection (cookie-mode i18n — no URL rewriting).
 *
 * A Google-style `?hl=` override (when present, resolved upstream) wins and is
 * persisted to the cookie. Otherwise, on the first visit (no valid
 * `NEXT_LOCALE` cookie), negotiate the locale from the browser's
 * `Accept-Language` and persist it. We never redirect or rewrite for locale, so
 * there is zero SEO impact: a cookie-less crawler sees the same English HTML as
 * before. Once the cookie exists — set here, by the `?hl=` override, or by the
 * language selector — the Accept-Language path is a no-op.
 */
function ensureLocaleCookie(
  request: NextRequest,
  response: NextResponse,
  overrideLocale: Locale | null,
): NextResponse {
  if (overrideLocale) {
    response.cookies.set(LOCALE_COOKIE, overrideLocale, {
      path: '/',
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    return response;
  }
  const existing = request.cookies.get(LOCALE_COOKIE)?.value;
  if (!isLocale(existing)) {
    const locale = negotiateLocaleFromAcceptLanguage(
      request.headers.get('accept-language'),
    );
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
  }
  return response;
}

/**
 * Apply host-indexing policy to a response: stamp X-Robots-Tag when the
 * incoming host is not on the public-indexable allowlist. Pairs with
 * the robots.ts allowlist for belt-and-suspenders coverage. Also seeds the
 * locale cookie (see {@link ensureLocaleCookie}).
 */
function withHostPolicyHeader(
  request: NextRequest,
  response: NextResponse,
  overrideLocale: Locale | null = null,
): NextResponse {
  if (!isIndexableHost(request.headers.get('host'))) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return ensureLocaleCookie(request, response, overrideLocale);
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
    // `?hl=` is preserved in the query, so the canonical host handles it.
    return NextResponse.redirect(redirectTo, 308);
  }

  // Resolve a Google-style `?hl=` override once (mutates request cookies so the
  // render below already sees it); persisted onto each response further down.
  // Skip `/r` and `/r/*`: those are proxied to the resources app, which owns
  // its locale via the URL path — applying the override there would mutate the
  // shared main-site cookie while resources content stays on the path locale.
  const isResourcesPath = pathname === '/r' || pathname.startsWith('/r/');
  if (isResourcesPath) {
    const destination = new URL(
      `${pathname}${request.nextUrl.search}`,
      configEnv.RESOURCES_URL,
    );
    return withHostPolicyHeader(
      request,
      NextResponse.rewrite(destination, {
        request: { headers: request.headers },
      }),
    );
  }

  const localeOverride = applyLocaleOverrideToRequest(request);

  if (pathname === '/') {
    const hostname = getRequestHostname(request);
    const canonicalHostname = getCanonicalThirdPartyHostname(hostname);

    if (canonicalHostname) {
      const routeSegment = getThirdPartyOriginRouteSegment(canonicalHostname);
      return withHostPolicyHeader(
        request,
        rewritePath(request, `/site/${routeSegment}/landing/${routeSegment}`),
        localeOverride,
      );
    }
  }

  // Only process /m/* paths for further redirect handling; everything else
  // passes through with the host-policy header applied.
  if (!pathname.startsWith('/m/')) {
    return withHostPolicyHeader(
      request,
      // Forward the (possibly `?hl=`-mutated) request cookies to the render.
      NextResponse.next({ request: { headers: request.headers } }),
      localeOverride,
    );
  }

  // Find matching route
  const matchedRoute = redirectRoutes.find((route) =>
    route.pattern.test(pathname),
  );

  if (!matchedRoute) {
    return withHostPolicyHeader(
      request,
      NextResponse.next({ request: { headers: request.headers } }),
      localeOverride,
    );
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

  return withHostPolicyHeader(
    request,
    NextResponse.redirect(destination, { status: 307 }),
    localeOverride,
  );
}

export const config = {
  // Matcher runs on:
  //   - `/` and `/m/:path*` for the original third-party-origin / mobile-app
  //     redirect logic
  //   - everything else (except Next.js internals) so the host-policy
  //     X-Robots-Tag header and the canonical-host 308 redirect can apply
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
