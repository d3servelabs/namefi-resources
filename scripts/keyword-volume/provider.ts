// One provider interface behind which every keyword-volume source sits, so the
// source can be swapped without touching the callers — the arrangement the
// editorial pipeline's keyword data stack asks for.
//
// Every provider returns the same shape, and every field it cannot fill is
// `null`, never a guess. A provider that cannot answer for a locale says so by
// returning `null` volume with a `note`, so the caller can print UNKNOWN rather
// than inventing a number.

/** A query as we intend to compete for it, in one specific market. */
export interface QuerySpec {
  /** The query string exactly as a person would type it. */
  query: string;
  /** BCP-47-ish locale tag as used across this repo: en, zh-CN, es, … */
  locale: string;
  /** ISO-3166-1 alpha-2 country the demand is being asked about. */
  country: string;
}

export interface VolumeResult extends QuerySpec {
  /** Average monthly searches over the trailing 12 months, or null if unknown. */
  avgMonthlySearches: number | null;
  /** Per-month series, newest last, when the provider exposes one. */
  monthly: { year: number; month: number; searches: number }[] | null;
  /** 0–100 competition index where the provider gives one. */
  competition: number | null;
  /** Provider id that produced this row. */
  source: string;
  /** ISO-8601 UTC timestamp of the fetch. */
  fetchedAt: string;
  /** Why a field is null, or any caveat that must travel with the number. */
  note: string | null;
}

export interface VolumeProvider {
  readonly id: string;
  /** Human-readable statement of what this provider can and cannot answer. */
  readonly scope: string;
  /** True when the credentials this provider needs are present in the env. */
  configured(): boolean;
  /** Names of the environment variables it reads, for the setup checklist. */
  readonly envVars: string[];
  fetch(specs: QuerySpec[]): Promise<VolumeResult[]>;
}

export function unknown(spec: QuerySpec, source: string, note: string): VolumeResult {
  return {
    ...spec,
    avgMonthlySearches: null,
    monthly: null,
    competition: null,
    source,
    fetchedAt: new Date().toISOString(),
    note,
  };
}

/**
 * Locales this repo publishes, and the country whose search market we mean when
 * we ask about that locale. The mapping is a judgment call and is stated here
 * rather than buried: `zh-CN` is mapped to CN even though the provider below
 * reads Google, which mainland users do not use — the resulting row is expected
 * to be near-zero and must NOT be read as absence of demand. See `baidu-gap`.
 */
export const LOCALE_MARKET: Record<string, string> = {
  en: 'US',
  'zh-CN': 'CN',
  es: 'ES',
  de: 'DE',
  fr: 'FR',
  ar: 'EG',
  hi: 'IN',
  ko: 'KR',
  ja: 'JP',
  ta: 'IN',
};

/**
 * The standing caveat that must be attached to any zh-CN row produced by a
 * Google-derived provider. Kept next to the mapping so it cannot drift away
 * from it.
 */
export const BAIDU_GAP =
  'Google-derived volume for zh-CN reflects overseas Chinese plus HK/TW, not mainland China, ' +
  'where Baidu is the search engine. A low number here is not evidence of low demand.';
