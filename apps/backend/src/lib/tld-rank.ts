/**
 * Ranked list of TLDs for fast search suggestions
 * These are ordered by popularity/preference for quick domain suggestions
 * Note: .ai, .app, .dev are not supported by the registrar and have been replaced
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
] as const;

export type RankedTLD = (typeof RANKED_TLDS)[number];
