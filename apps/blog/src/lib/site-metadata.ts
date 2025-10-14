import type { Locale } from '@/i18n-config';

type MetadataMap = Record<Locale, string>;

export const mainTitle: MetadataMap = {
  en: 'Namefi Blog',
  es: 'Blog de Namefi',
  de: 'Namefi Blog',
  fr: 'Blog Namefi',
  zh: 'Namefi 博客',
  ar: 'مدونة Namefi',
  hi: 'Namefi ब्लॉग',
};

export const mainDescription: MetadataMap = {
  en: 'A blog about and by Namefi',
  es: 'Un blog sobre y por Namefi',
  de: 'Ein Blog über und von Namefi',
  fr: "Un blog sur Namefi, écrit par l'équipe Namefi",
  zh: 'Namefi 团队的博客，分享 Namefi 的最新动态',
  ar: 'مدونة عن Namefi ومن فريق Namefi',
  hi: 'Namefi और उसकी टीम से जुड़ी जानकारियों का ब्लॉग',
};

export function resolveTitle(locale: Locale) {
  return mainTitle[locale] ?? mainTitle.en;
}

export function resolveDescription(locale: Locale) {
  return mainDescription[locale] ?? mainDescription.en;
}
