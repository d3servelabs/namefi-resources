import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from './config';
import { loadMessages } from './load-messages';
import { negotiateLocaleFromAcceptLanguage } from './negotiate';

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

  return { locale: locale ?? defaultLocale, messages };
});
