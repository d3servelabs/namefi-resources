export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'de', 'fr', 'zh', 'ar', 'hi'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  es: 'ltr',
  de: 'ltr',
  fr: 'ltr',
  zh: 'ltr',
  ar: 'rtl',
  hi: 'ltr',
};

export const isRtlLocale = (locale: Locale) =>
  localeDirections[locale] === 'rtl';

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  zh: '中文',
  ar: 'العربية',
  hi: 'हिन्दी',
};

export const localeDateLocales: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  fr: 'fr-FR',
  zh: 'zh-CN',
  ar: 'ar-SA',
  hi: 'hi-IN',
};
