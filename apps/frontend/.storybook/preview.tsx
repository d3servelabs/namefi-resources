import type { Preview } from '@storybook/nextjs-vite';
import { OpenFeatureTestProvider } from '@openfeature/react-sdk';
import isChromatic from 'chromatic/isChromatic';
import { MotionConfig } from 'motion/react';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';
import '@/app/globals.css';
import {
  type Locale,
  defaultLocale,
  isLocale,
  localeLabels,
  locales,
} from '@/i18n/config';
import { loadMessages } from '@/i18n/load-messages';
import { defaultChromaticModes, storybookViewports } from './modes';

/**
 * Resolve the locale for a story. A story can pin one via `parameters.locale`;
 * otherwise the global toolbar selection wins, falling back to the default.
 */
function resolveStoryLocale(context: {
  parameters: { locale?: string };
  globals: { locale?: string };
}): Locale {
  const fromParam = context.parameters.locale;
  if (isLocale(fromParam)) return fromParam;
  const fromGlobal = context.globals.locale;
  if (isLocale(fromGlobal)) return fromGlobal;
  return defaultLocale;
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },

    /**
     * Storybook viewport addon configuration.
     * Provides viewport switching in the Storybook UI.
     */
    viewport: {
      viewports: storybookViewports,
      defaultViewport: 'macbook-air-13',
    },

    /**
     * Chromatic visual regression testing configuration.
     * Snapshots are taken at each mode's viewport size.
     *
     * @see https://www.chromatic.com/docs/modes/viewports/
     */
    chromatic: {
      modes: defaultChromaticModes,
      pauseAnimationAtEnd: false,
    },
  },

  /**
   * `locale` toolbar lets any story be previewed in English or 中文. Stories
   * that need a fixed locale for snapshots set `parameters.locale` instead.
   */
  globalTypes: {
    locale: {
      description: 'Language',
      defaultValue: defaultLocale,
      toolbar: {
        icon: 'globe',
        // Data-driven from the locale registry — adding a language needs no edit here.
        items: locales.map((locale) => ({
          value: locale,
          title: localeLabels[locale],
        })),
        dynamicTitle: true,
      },
    },
  },

  /**
   * Load the selected locale's messages before each render. Async loader so
   * only the active locale is fetched (scales to many languages), mirroring the
   * server runtime in src/i18n/request.ts.
   */
  loaders: [
    async (context) => ({
      messages: await loadMessages(resolveStoryLocale(context)),
    }),
  ],

  /**
   * Global decorators keep stories deterministic: NextIntlClientProvider gives
   * every story a translation context (any component calling `useTranslations`
   * would otherwise throw), OpenFeature uses its SDK test provider so flags
   * resolve from each flag's default unless a story overrides them, and
   * MotionConfig disables animation during Chromatic snapshots.
   */
  decorators: [
    (Story, context) => {
      const locale = resolveStoryLocale(context);
      return (
        <NextIntlClientProvider
          locale={locale}
          messages={context.loaded.messages}
        >
          <OpenFeatureTestProvider>
            <MotionConfig reducedMotion={isChromatic() ? 'always' : 'never'}>
              <Story />
            </MotionConfig>
          </OpenFeatureTestProvider>
        </NextIntlClientProvider>
      );
    },
  ],
};

export default preview;
