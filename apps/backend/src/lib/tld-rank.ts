/**
 * Ranked list of TLDs for fast search suggestions.
 * Ordered by popularity/preference for quick domain suggestions.
 * Note: .ai, .app, .dev are not supported by the registrar and have been replaced.
 */
export const RANKED_TLDS = [
  'com',
  'xyz',
  'io',
  '0x.city',
  'net',
  'org',
  'co',
  'site',
  'tech',
  'online',
  'store',
  'club',
  'pro',
  'info',
  'biz',
  'me',
  'live',
  'world',
  'studio',
  'cloud',
  'link',
  'work',
  'top',
  'digital',
  'news',
  'media',
  'press',
  'space',
  'fun',
  'blog',
  'one',
  'team',
  'art',
  'design',
  'agency',
  'solutions',
  'company',
  'capital',
  'finance',
  'ventures',
  'partners',
  'global',
  'network',
  'support',
  'services',
  'consulting',
  'gallery',
  'zone',
] as const;

export type RankedTLD = (typeof RANKED_TLDS)[number];

export const DEFAULT_RANKED_TLD_PAGE_SIZE = 16;
