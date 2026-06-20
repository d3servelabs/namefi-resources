'use client';

import { reportAppRouterError } from '@/lib/datadog-react-error';
import { useEffect, useState } from 'react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { ErrorHelpLinks } from '@/components/error-help-links';
import enError from '../../messages/en/error.json';
import enCommon from '../../messages/en/common.json';
import {
  defaultLocale,
  isLocale,
  type Locale,
  LOCALE_COOKIE,
} from '@/i18n/config';

function readLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return defaultLocale;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${LOCALE_COOKIE}=`));
  const value = match?.split('=')[1];
  return value && isLocale(value) ? value : defaultLocale;
}

function GlobalErrorContent({ reset }: { reset: () => void }) {
  const t = useTranslations('error');
  const tCommon = useTranslations('common');
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="mb-2 text-5xl font-bold tracking-tight">500</h1>
      <h2 className="mb-2 text-xl font-semibold">{t('status500.title')}</h2>
      <p className="mb-8 max-w-sm text-center text-sm text-muted-foreground">
        {t('status500.description')}
      </p>
      <div className="flex gap-3">
        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          onClick={() => reset()}
          type="button"
        >
          {tCommon('actions.tryAgain')}
        </button>
        <a
          className="inline-flex h-10 items-center justify-center rounded-md border border-input px-4 text-sm font-medium"
          href="/"
        >
          {t('actions.goHome')}
        </a>
      </div>
      <ErrorHelpLinks />
    </main>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // The root layout (and its NextIntlClientProvider) is gone when this boundary
  // renders, so we provide messages ourselves. Start with the bundled English
  // catalog, then swap in the user's locale once the cookie is read on mount.
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, unknown>>({
    error: enError,
    common: enCommon,
  });

  useEffect(() => {
    reportAppRouterError('app/global-error.tsx', error, {
      fatalBoundary: 'root',
    });
  }, [error]);

  useEffect(() => {
    const cookieLocale = readLocaleFromCookie();
    if (cookieLocale === defaultLocale) return;
    let active = true;
    void Promise.all([
      import(`../../messages/${cookieLocale}/error.json`),
      import(`../../messages/${cookieLocale}/common.json`),
    ])
      .then(([err, common]) => {
        if (!active) return;
        setMessages({ error: err.default, common: common.default });
        setLocale(cookieLocale);
      })
      .catch(() => {
        // Keep the English fallback if the locale catalog fails to load.
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <html lang={locale} className="dark h-full" suppressHydrationWarning={true}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <GlobalErrorContent reset={reset} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
