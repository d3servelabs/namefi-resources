import { NextResponse } from 'next/server';
import type { NextRequest, MiddlewareConfig } from 'next/server';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { isIndexableHost } from '@namefi-astra/common/host-policy';
import { i18n, type Locale } from '@/i18n-config';
import { LEGACY_RESOURCES_HOSTNAME_MAP } from '@/lib/resources-host-map';

const LOCALES: Locale[] = [...i18n.locales];
const DEFAULT_LOCALE: Locale = i18n.defaultLocale;
const LOCALE_SET = new Set(LOCALES);
export const PUBLIC_FILE = /\.(.*)$/;

function isLocale(value: string): value is Locale {
  return LOCALE_SET.has(value as Locale);
}

function getLocale(request: NextRequest): Locale {
  const localeFromCookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (localeFromCookie && isLocale(localeFromCookie)) {
    return localeFromCookie;
  }

  const negotiatorHeaders = Object.fromEntries(
    request.headers.entries(),
  ) as Record<string, string>;
  const languages = new Negotiator({
    headers: negotiatorHeaders,
  }).languages(LOCALES);

  return matchLocale(languages, LOCALES, DEFAULT_LOCALE) as Locale;
}

function stripResourcesBasePath(pathname: string): string {
  if (pathname === '/r') {
    return '/';
  }

  return pathname.startsWith('/r/') ? pathname.slice(2) : pathname;
}

function hasLocalePrefix(pathname: string): boolean {
  return LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );
}

function toLocalePath(pathname: string, locale: Locale): string {
  if (pathname === '/') {
    return `/${locale}`;
  }

  if (pathname.startsWith('/')) {
    return `/${locale}${pathname}`;
  }

  return `/${locale}/${pathname}`;
}

function resolveCanonicalResourcesHostRedirect(
  request: NextRequest,
): URL | undefined {
  const rawPathname = new URL(request.url).pathname;
  const canonicalHost = LEGACY_RESOURCES_HOSTNAME_MAP[request.nextUrl.hostname];
  const hasResourcesBasePath =
    rawPathname === '/r' || rawPathname.startsWith('/r/');

  if (!canonicalHost) {
    return undefined;
  }

  if (hasResourcesBasePath) {
    return undefined;
  }

  const requestHost = request.nextUrl.hostname.toLowerCase();
  const forwardedHost = request.headers
    .get('x-forwarded-host')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  if (forwardedHost && forwardedHost !== requestHost) {
    // Allow reverse-proxy traffic (frontend rewrites / preview proxies)
    // to flow through without bouncing back and creating redirect loops.
    return undefined;
  }

  const redirectUrl = new URL(request.url);
  redirectUrl.protocol = 'https:';
  redirectUrl.hostname = canonicalHost;
  redirectUrl.port = '';

  if (rawPathname === '/') {
    redirectUrl.pathname = '/r';
    return redirectUrl;
  }
  if (rawPathname === '/r' || rawPathname.startsWith('/r/')) {
    redirectUrl.pathname = rawPathname;
    return redirectUrl;
  }

  redirectUrl.pathname = `/r${rawPathname.startsWith('/') ? '' : '/'}${rawPathname}`;
  return redirectUrl;
}

/**
 * True iff this request is a direct external hit (browser/Googlebot) on the
 * resources project, not a server-side proxy fetch from the frontend's
 * `/r/*` rewrite.
 *
 * Direct hits: x-forwarded-host matches the actual host (or is missing).
 * Proxy fetches: x-forwarded-host is the user-facing host (e.g., namefi.io)
 * while the actual host is the proxy origin (e.g., r.namefi.io).
 */
function isDirectExternalRequest(request: NextRequest): boolean {
  const requestHost = request.nextUrl.hostname.toLowerCase();
  const forwardedHost = request.headers
    .get('x-forwarded-host')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  return !forwardedHost || forwardedHost === requestHost;
}

function withNoindexIfDirect(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  // Only set X-Robots-Tag on direct hits to non-indexable hosts. Proxy
  // fetches must NOT carry this header back to the user-facing apex
  // response, since the apex is indexable.
  if (
    !isIndexableHost(request.nextUrl.hostname) &&
    isDirectExternalRequest(request)
  ) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}

export function middleware(request: NextRequest) {
  const canonicalRedirectUrl = resolveCanonicalResourcesHostRedirect(request);
  if (canonicalRedirectUrl) {
    return NextResponse.redirect(canonicalRedirectUrl, 308);
  }

  const { pathname, search } = request.nextUrl;
  const hasResourcesBasePath = pathname === '/r' || pathname.startsWith('/r/');
  const pathnameWithoutBasePath = stripResourcesBasePath(pathname);
  const pathnameHasLocale = hasLocalePrefix(pathnameWithoutBasePath);

  if (pathnameHasLocale || PUBLIC_FILE.test(pathnameWithoutBasePath)) {
    return withNoindexIfDirect(request, NextResponse.next());
  }

  const locale = getLocale(request);
  const redirectUrl = request.nextUrl.clone();
  const localizedPath = toLocalePath(pathnameWithoutBasePath, locale);
  redirectUrl.pathname = hasResourcesBasePath
    ? `/r${localizedPath}`
    : localizedPath;

  // Redirect home (/${locale}) to blog index for now.
  const localizedHomePath = hasResourcesBasePath
    ? `/r/${locale}`
    : `/${locale}`;
  if (redirectUrl.pathname === localizedHomePath) {
    redirectUrl.pathname = `${localizedHomePath}/blog`;
    redirectUrl.search = search ? search : '';
    return withNoindexIfDirect(request, NextResponse.redirect(redirectUrl));
  }

  return withNoindexIfDirect(request, NextResponse.redirect(redirectUrl));
}

export const config = {
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)?',
  ],
} satisfies MiddlewareConfig;
