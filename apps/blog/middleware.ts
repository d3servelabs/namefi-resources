import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { i18n } from '@/i18n-config';

function getLocale(request: NextRequest) {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    negotiatorHeaders[key] = value;
  });

  const locales = Array.from(i18n.locales);
  const languages = new Negotiator({
    headers: negotiatorHeaders,
  }).languages(locales);

  // biome-ignore lint/suspicious/noConsole: Temporary debug logging for locale resolution.
  console.info(
    '[i18n] resolved languages',
    JSON.stringify({
      acceptLanguage: negotiatorHeaders['accept-language'],
      languages,
    }),
  );

  return matchLocale(languages, locales, i18n.defaultLocale);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // biome-ignore lint/suspicious/noConsole: Temporary debug logging for locale middleware flow.
  console.info('[i18n] incoming request', pathname);

  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) {
    return;
  }

  const locale = getLocale(request) ?? i18n.defaultLocale;

  const pathnameWithLeading = pathname.startsWith('/')
    ? pathname
    : `/${pathname}`;
  const newPathname =
    pathnameWithLeading === '/'
      ? `/${locale}`
      : `/${locale}${pathnameWithLeading}`;

  // biome-ignore lint/suspicious/noConsole: Temporary debug logging for locale middleware flow.
  console.info(
    '[i18n] redirecting',
    JSON.stringify({
      locale,
      pathname,
      pathnameWithLeading,
      newPathname,
    }),
  );

  return NextResponse.redirect(new URL(newPathname, request.url));
}

export const config = {
  matcher: ['/', '/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
