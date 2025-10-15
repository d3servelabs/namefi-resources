import { NextResponse } from 'next/server';
import type { NextRequest, MiddlewareConfig } from 'next/server';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { i18n, type Locale } from '@/i18n-config';

const LOCALES: Locale[] = [...i18n.locales];
const DEFAULT_LOCALE: Locale = i18n.defaultLocale;
const LOCALE_SET = new Set(LOCALES);
const LOCALE_PREFIX = new RegExp(`^/(?:${LOCALES.join('|')})(?:/|$)`, 'i');
export const PUBLIC_FILE = /\.(.*)$/;
const PUBLIC_FILE_MATCHER = PUBLIC_FILE.source.replace(/\((?!\?:)/g, '(?:');
const MATCHER_EXCLUSIONS = [
  `(?:${LOCALES.join('|')})(?:/|$)`,
  'api',
  '_next/static',
  '_next/image',
  '_next/data',
  '_vercel',
  `.*${PUBLIC_FILE_MATCHER}`,
];
const MATCHER_EXCLUSION_PATTERN = `(?:${MATCHER_EXCLUSIONS.join('|')})`;
const MATCHER_RAW_PATTERN = `((?!${MATCHER_EXCLUSION_PATTERN}).*)`;
export const MATCHER_PATTERN = `/${MATCHER_RAW_PATTERN}` as const;
const MATCHER_REGEX = new RegExp(`^${MATCHER_RAW_PATTERN}$`, 'i');

function isLocale(value: string): value is Locale {
  return LOCALE_SET.has(value as Locale);
}

function getPathWithoutBase(request: NextRequest) {
  const { pathname, basePath } = request.nextUrl;

  if (!basePath) {
    return pathname;
  }

  if (!pathname.startsWith(basePath)) {
    return pathname;
  }

  const stripped = pathname.slice(basePath.length);
  if (!stripped) {
    return '/';
  }

  return stripped.startsWith('/') ? stripped : `/${stripped}`;
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
  const pathname = getPathWithoutBase(request) || '/';
  const relativePath = pathname.replace(/^\/+/, '');

  const match = MATCHER_REGEX.exec(relativePath);
  if (!match) {
    return NextResponse.next();
  }

  const matchedPath = match[1] ?? '';

  const locale = getLocale(request);
  const basePath =
    request.nextUrl.basePath && request.nextUrl.basePath !== '/'
      ? request.nextUrl.basePath.replace(/\/$/, '')
      : '';
  const normalizedBasePath =
    basePath && LOCALE_PREFIX.test(basePath) ? '' : basePath;
  const normalizedPathname = matchedPath ? `/${matchedPath}` : '/';
  const pathSuffix = normalizedPathname === '/' ? '' : normalizedPathname;
  const url = request.nextUrl.clone();
  const nextPath = `${normalizedBasePath}/${locale}${pathSuffix}`.replace(
    /\/{2,}/g,
    '/',
  );
  url.pathname = nextPath || '/';

  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    {
      source: MATCHER_PATTERN,
      locale: false,
    },
  ],
} satisfies MiddlewareConfig;
