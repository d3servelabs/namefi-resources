/**
 * i18n locale configuration — single source of truth for supported languages.
 *
 * Astra uses next-intl in "without i18n routing" mode: the active locale lives
 * in the `NEXT_LOCALE` cookie (no `/zh` URL prefix, no `[locale]` route segment).
 * Add a new language by extending `locales` + the label/date-locale maps and
 * dropping a `messages/<locale>.json` file.
 */
export const locales = ['en', 'zh', 'ta', 'ar-EG'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/**
 * Message namespaces — one `messages/<locale>/<namespace>.json` per entry.
 * This is the single registry the dynamic loader (src/i18n/load-messages.ts)
 * iterates, so adding a namespace is: drop the JSON files + add the name here.
 * No per-locale barrel and no hand-maintained import list anywhere, which keeps
 * the setup flat as the app scales to many languages.
 */
export const NAMESPACES = [
  'common',
  'footer',
  'landing',
  'landingMarketing',
  'search',
  'cart',
  'nav',
  'orders',
  'profile',
  'wishlist',
  'paymentMethods',
  'gallery',
  'domains',
  'claim',
  'freeMints',
  'feed',
  'payment',
  'shared',
] as const;

export type MessageNamespace = (typeof NAMESPACES)[number];

/** Cookie that persists the user's locale. Matches next-intl's default name. */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/** One year — the locale preference is sticky until the user changes it. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Native-language labels shown in the language selector. */
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ta: 'தமிழ்',
  'ar-EG': 'العربية',
};

/** BCP-47 tags for `Intl`/`date-fns` formatting per locale. */
export const localeDateLocales: Record<Locale, string> = {
  en: 'en-US',
  zh: 'zh-CN',
  ta: 'ta-IN',
  'ar-EG': 'ar-EG',
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value != null && (locales as readonly string[]).includes(value);
}
