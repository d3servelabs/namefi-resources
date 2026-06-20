import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { defaultLocale, isLocale, locales, type Locale } from './config';

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

// Sentinel returned by `matchLocale` when an explicit `hl` value matches no
// supported locale — deliberately not a valid BCP-47 tag (underscores) so it
// can never coincide with a real match.
const NO_LOCALE_MATCH = '__no_locale_match__';

/**
 * Resolve an explicit locale request (Google-style `?hl=<lang(-locale)>`) to a
 * supported `Locale`, or `null` when it matches none.
 *
 * Accepts an exact tag (`zh`, `ar-EG`), a language-only tag that maps to a
 * regional locale (`ar` → `ar-EG`), or a `lang-region` tag whose language is
 * supported (`zh-CN` → `zh`, `en-GB` → `en`). Unlike `Accept-Language`
 * negotiation, an unmatched value returns `null` (not the default) so callers
 * can ignore a bogus `?hl=` and leave the cookie / `Accept-Language` in charge.
 */
export function resolveLocaleFromParam(
  value: string | null | undefined,
): Locale | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (isLocale(trimmed)) return trimmed;

  try {
    const matched = matchLocale([trimmed], [...locales], NO_LOCALE_MATCH);
    return matched === NO_LOCALE_MATCH ? null : (matched as Locale);
  } catch {
    // `matchLocale` throws on malformed tags — treat as "no match".
    return null;
  }
}
