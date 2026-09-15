// The library entry point. Upper layers import from here; the CLI in `index.ts`
// is just one caller of it.
//
//   import { searchVolume, providers } from './scripts/keyword-volume/api.ts';
//
//   const rows = await searchVolume([
//     { query: 'domain name registration', locale: 'en', country: 'US' },
//   ]);
//
// Every row comes back with `avgMonthlySearches` either a measured number or
// `null` with a `note` saying why. Nothing here ever invents or zero-fills a
// figure: a failed request, a keyword absent from the response and an
// unconfigured provider are three different states and all three are reported
// as null, never as zero.

import { GoogleAdsProvider } from './googleads.ts';
import { DataForSeoProvider } from './dataforseo.ts';
import { LOCALE_MARKET, type QuerySpec, type VolumeProvider, type VolumeResult } from './provider.ts';

export type { QuerySpec, VolumeResult, VolumeProvider };
export { LOCALE_MARKET };

/**
 * In priority order. Google Ads is primary: it is the same upstream data as the
 * reseller below and it is free, so the reseller exists only to keep the desk
 * moving while a developer token is pending, and should be dropped once Basic
 * access is granted.
 */
export const providers: VolumeProvider[] = [new GoogleAdsProvider(), new DataForSeoProvider()];

export interface SearchVolumeOptions {
  /** Force a specific provider by id instead of taking the first configured one. */
  provider?: string;
  /** Only fetch this locale. */
  locale?: string;
}

/** The provider that will actually be used, or the primary one if none is configured. */
export function activeProvider(opts: SearchVolumeOptions = {}): VolumeProvider {
  if (opts.provider) {
    const named = providers.find((p) => p.id === opts.provider);
    if (!named) throw new Error(`unknown provider: ${opts.provider}`);
    return named;
  }
  return providers.find((p) => p.configured()) ?? providers[0];
}

/** Build query specs from a per-locale map, dropping placeholders and duplicates. */
export function toSpecs(
  rows: Record<string, unknown>[],
  only?: string,
): QuerySpec[] {
  const out: QuerySpec[] = [];
  for (const row of rows) {
    for (const [locale, queries] of Object.entries(row)) {
      if (locale === 'id' || !Array.isArray(queries)) continue;
      if (only && locale !== only) continue;
      const country = LOCALE_MARKET[locale];
      if (!country) continue;
      for (const q of queries) {
        if (typeof q !== 'string' || q === 'LOW-DEMAND') continue;
        out.push({ query: q, locale, country });
      }
    }
  }
  const seen = new Set<string>();
  return out.filter((s) => {
    const k = `${s.locale}|${s.query.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Fetch measured volume for a set of queries. The one call upper layers need. */
export async function searchVolume(
  specs: QuerySpec[],
  opts: SearchVolumeOptions = {},
): Promise<VolumeResult[]> {
  const provider = activeProvider(opts);
  const scoped = opts.locale ? specs.filter((s) => s.locale === opts.locale) : specs;
  return provider.fetch(scoped);
}

/** How many rows carry a real measurement, for the caller to report honestly. */
export function measuredCount(rows: VolumeResult[]): { measured: number; unknown: number } {
  const measured = rows.filter((r) => r.avgMonthlySearches !== null).length;
  return { measured, unknown: rows.length - measured };
}
