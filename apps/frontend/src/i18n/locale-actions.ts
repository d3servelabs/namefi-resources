'use server';

import { cookies } from 'next/headers';
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
  type Locale,
} from './config';

/**
 * Persist the user's chosen locale to the `NEXT_LOCALE` cookie.
 *
 * Server action so the cookie is written through `next/headers` (the
 * next-intl-recommended path) rather than client-side `document.cookie`. The
 * caller refreshes the router afterward so next-intl re-reads the cookie.
 */
export async function setLocaleCookie(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: 'lax',
  });
}
