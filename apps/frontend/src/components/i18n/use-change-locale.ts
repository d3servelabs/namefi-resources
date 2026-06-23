'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  type PropsWithChildren,
} from 'react';
import { useInteractionLoggers } from '@/components/providers/analytics';
import type { Locale } from '@/i18n/config';
import { setLocaleCookie } from '@/i18n/locale-actions';
import {
  InteractionLoggingEventName,
  type LanguageChangeSource,
} from '@/lib/analytics-events';

type LocaleChangeContextValue = {
  activeLocale: Locale;
  changeLocale: (nextLocale: Locale) => void;
};

const LocaleChangeContext = createContext<LocaleChangeContextValue | null>(
  null,
);

export function LocaleChangeProvider({
  activeLocale,
  changeLocale,
  children,
}: PropsWithChildren<LocaleChangeContextValue>) {
  return createElement(
    LocaleChangeContext.Provider,
    { value: { activeLocale, changeLocale } },
    children,
  );
}

/**
 * Shared logic for both language selectors (footer + sidebar user dropdown).
 *
 * Persists the choice to the `NEXT_LOCALE` cookie, logs a `language_changed`
 * analytics event tagged with which selector fired it, then refreshes the
 * server tree so next-intl re-reads the cookie and re-renders in the new
 * locale (cookie-mode i18n — no navigation, the URL stays put).
 */
export function useChangeLocale(source: LanguageChangeSource) {
  const override = useContext(LocaleChangeContext);
  const activeLocale = useLocale() as Locale;
  const router = useRouter();
  const { logEventWithInteractionLoggers } = useInteractionLoggers();

  const changeLocale = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === activeLocale) return;

      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.LanguageChanged,
        properties: {
          fromLocale: activeLocale,
          toLocale: nextLocale,
          source,
        },
      });

      void setLocaleCookie(nextLocale).then(() => {
        router.refresh();
      });
    },
    [activeLocale, logEventWithInteractionLoggers, router, source],
  );

  if (override) return override;

  return { activeLocale, changeLocale };
}
