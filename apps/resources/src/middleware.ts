import { NextResponse } from 'next/server';
import type { NextRequest, MiddlewareConfig } from 'next/server';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { i18n, type Locale } from '@/i18n-config';

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = LOCALES.some(
    (locale) =>
      pathname.startsWith(`/r/${locale}/`) || pathname === `/r/${locale}`,
  );

  if (pathnameHasLocale || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const locale = getLocale(request);
  request.nextUrl.pathname = `/r/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ['/((?!_next).*)'],
} satisfies MiddlewareConfig;
