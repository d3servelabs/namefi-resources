import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { defaultLocale, locales, type Locale } from './config';

/**
 * Pick the best supported locale from an `Accept-Language` header value.
 *
 * Shared by the cookie-setting middleware (first visit) and the next-intl
 * request config (fallback when no cookie is present). Edge-runtime safe:
 * both `negotiator` and `@formatjs/intl-localematcher` are pure JS.
 */
export function negotiateLocaleFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): Locale {
  if (!acceptLanguage) return defaultLocale;

  const languages = new Negotiator({
    headers: { 'accept-language': acceptLanguage },
  }).languages([...locales]);

  try {
    return matchLocale(languages, [...locales], defaultLocale) as Locale;
  } catch {
    // `matchLocale` throws on malformed language tags — fall back rather than 500.
    return defaultLocale;
  }
}
