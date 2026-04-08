import { NextResponse } from 'next/server';
import type { NextRequest, MiddlewareConfig } from 'next/server';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { i18n, type Locale } from '@/i18n-config';

const LOCALES: Locale[] = [...i18n.locales];
const DEFAULT_LOCALE: Locale = i18n.defaultLocale;
const LOCALE_SET = new Set(LOCALES);
export const PUBLIC_FILE = /\.(.*)$/;
const RESOURCES_HOST_TO_FIRST_PARTY_HOST: Record<string, string> = {
  'r.namefi.io': 'namefi.io',
  'r.namefi.dev': 'namefi.dev',
};

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
  const canonicalHost =
    RESOURCES_HOST_TO_FIRST_PARTY_HOST[request.nextUrl.hostname];

  if (!canonicalHost) {
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

export function middleware(request: NextRequest) {
  const canonicalRedirectUrl = resolveCanonicalResourcesHostRedirect(request);
  if (canonicalRedirectUrl) {
    return NextResponse.redirect(canonicalRedirectUrl, 308);
  }

  const { pathname, search } = request.nextUrl;
  const pathnameWithoutBasePath = stripResourcesBasePath(pathname);
  const pathnameHasLocale = hasLocalePrefix(pathnameWithoutBasePath);

  if (pathnameHasLocale || PUBLIC_FILE.test(pathnameWithoutBasePath)) {
    return NextResponse.next();
  }

  const locale = getLocale(request);
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = toLocalePath(pathnameWithoutBasePath, locale);

  // Redirect home (/${locale}) to blog index for now.
  if (redirectUrl.pathname === `/${locale}`) {
    redirectUrl.pathname = `/${locale}/blog`;
    redirectUrl.search = search ? search : '';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)?',
  ],
} satisfies MiddlewareConfig;
