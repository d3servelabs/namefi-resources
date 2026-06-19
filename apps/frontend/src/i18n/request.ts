import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from './config';
import { loadMessages } from './load-messages';
import { negotiateLocaleFromAcceptLanguage } from './negotiate';

type MessageTree = { [key: string]: string | MessageTree };

/**
 * Deep-merge message catalogs, with `override` winning over `base`. Plain
 * nested objects are merged recursively; leaf values from `override` replace
 * `base`. Used to layer the active locale on top of the English base.
 */
function deepMerge(base: MessageTree, override: MessageTree): MessageTree {
  const out: MessageTree = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const existing = out[key];
    if (
      existing != null &&
      typeof existing === 'object' &&
      typeof value === 'object'
    ) {
      out[key] = deepMerge(existing, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Resolves the active locale on the server for every request.
 *
 * Priority: `NEXT_LOCALE` cookie (explicit user choice, normally set by the
 * middleware on first visit) → `Accept-Language` negotiation → `en`. Reading the
 * header server-side (not `navigator.language`) keeps SSR and the client in
 * agreement, avoiding a first-paint language flash.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  let locale: Locale;
  if (isLocale(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const headerStore = await headers();
    locale = negotiateLocaleFromAcceptLanguage(
      headerStore.get('accept-language'),
    );
  }

  const messages = await loadMessages(locale);

  // Guarantee an English fallback for every key: layer the active locale on top
  // of the English base so a missing or not-yet-translated key renders English
  // instead of the raw key path. (No-op when the active locale already is `en`.)
  const withFallback =
    locale === defaultLocale
      ? messages
      : deepMerge(
          (await loadMessages(defaultLocale)) as MessageTree,
          messages as MessageTree,
        );

  return { locale: locale ?? defaultLocale, messages: withFallback };
});
