import type { Locale } from '@/i18n-config';

type MetadataMap = Record<Locale, string>;

export const mainTitle: MetadataMap = {
  en: 'Namefi Resources',
  es: 'Recursos de Namefi',
  de: 'Namefi Ressourcen',
  fr: 'Ressources Namefi',
  zh: 'Namefi 资源',
  ar: 'موارد Namefi',
  hi: 'Namefi संसाधन',
};

export const mainDescription: MetadataMap = {
  en: 'Resources for and by Namefi',
  es: 'Recursos sobre Namefi y creados por su equipo',
  de: 'Ressourcen über und von Namefi',
  fr: "Ressources sur Namefi, créées par l'équipe Namefi",
  zh: 'Namefi 团队的资源汇总，分享 Namefi 的最新动态',
  ar: 'موارد عن Namefi ومن فريق Namefi',
  hi: 'Namefi और उसकी टीम द्वारा तैयार संसाधनों का संग्रह',
};

export function resolveTitle(locale: Locale) {
  return mainTitle[locale] ?? mainTitle.en;
}

export function resolveDescription(locale: Locale) {
  return mainDescription[locale] ?? mainDescription.en;
}
