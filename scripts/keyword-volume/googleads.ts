// Google Ads API provider — KeywordPlanIdeaService, the primary volume source.
//
// The method is `GenerateKeywordHistoricalMetrics`, NOT `GenerateKeywordIdeas`.
// The two are neighbours in the same service and answer different questions,
// and only one of them answers ours:
//
//   GenerateKeywordIdeas               "what else could I bid on?" — takes a
//                                      seed of at most 20 keywords and returns
//                                      OTHER, related keywords. Asking it about
//                                      640 of our own queries returns neither
//                                      those queries nor their volume.
//   GenerateKeywordHistoricalMetrics   "how often is THIS searched?" — takes up
//                                      to 10,000 keywords and returns average
//                                      monthly searches and monthly history for
//                                      exactly the keywords asked about.
//
// Verified against the service definition (googleapis/googleapis,
// google/ads/googleads/v22/services/keyword_plan_idea_service.proto, read
// 2026-09-03): `KeywordSeed.keywords` is documented "no more than 20 keywords",
// while `GenerateKeywordHistoricalMetricsRequest.keywords` is "a maximum of
// 10,000 keywords can be used". The same distinction was observed empirically
// through DataForSEO's mirror of this upstream on 2026-09-02: a keyword-ideas
// call seeded with `domain name registration` returned 1,496 OTHER keywords and
// no figure for the seed itself.
//
// This is the one source that measures the whole search market rather than our
// slice of it, which is why it, and not Search Console, is what the editorial
// backlog's rank key needs. Search Console reports only on pages that already
// exist; a hundred unwritten candidates return nothing from it.
//
// Four credentials are required and none is optional:
//   GOOGLE_ADS_DEVELOPER_TOKEN   from the API Center on a manager account
//   GOOGLE_ADS_CLIENT_ID         OAuth2 client from a Google Cloud project
//   GOOGLE_ADS_CLIENT_SECRET     ditto
//   GOOGLE_ADS_REFRESH_TOKEN     from one interactive consent, then reused
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID the manager account id, digits only
//
// Access level matters: a Test-level developer token cannot return real volume,
// because test accounts hold no real data. Basic access is the real prerequisite.
//
// Nothing here logs a credential. Read them from the local secrets broker
// (one `secretctl run --with '^NAME$=NAME'` per secret) rather than a plaintext file.

import {
  BAIDU_GAP,
  unknown,
  type QuerySpec,
  type VolumeProvider,
  type VolumeResult,
} from './provider.ts';

// Current as of 2026-09-03. v21 and earlier are sunset and return a generic
// HTML 404 from Google's edge — the request never reaches the API at all.
export const API_VERSION = 'v25';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

/**
 * `GenerateKeywordHistoricalMetricsRequest.keywords`: "A maximum of 10,000
 * keywords can be used." Requests are chunked to it so a large market cannot
 * silently overflow.
 */
const MAX_KEYWORDS_PER_REQUEST = 10_000;

/** Google Ads geo target constant ids. Only the markets this repo publishes to. */
const GEO_TARGET: Record<string, string> = {
  US: '2840',
  CN: '2156',
  ES: '2724',
  DE: '2276',
  FR: '2250',
  EG: '2818',
  IN: '2356',
  KR: '2410',
  JP: '2392',
};

/** Google Ads language constant ids. */
const LANGUAGE: Record<string, string> = {
  en: '1000',
  'zh-CN': '1017',
  es: '1003',
  de: '1001',
  fr: '1002',
  ar: '1019',
  hi: '1023',
  ko: '1012',
  ja: '1005',
  ta: '1030',
};

/**
 * `MonthlySearchVolume.month` is a `MonthOfYear` enum, which the REST/JSON
 * surface renders as the name — `JANUARY`, not `1`. `VolumeResult.monthly.month`
 * is a number, because that is what the other provider produces and what a
 * caller comparing two months has to be able to do arithmetic on. Translate
 * here, so the two providers cannot emit incompatible series behind one
 * interface. `UNSPECIFIED` and `UNKNOWN` are deliberately absent: they name no
 * month and must not be coerced into one.
 */
const MONTH_NUMBER: Record<string, number> = {
  JANUARY: 1,
  FEBRUARY: 2,
  MARCH: 3,
  APRIL: 4,
  MAY: 5,
  JUNE: 6,
  JULY: 7,
  AUGUST: 8,
  SEPTEMBER: 9,
  OCTOBER: 10,
  NOVEMBER: 11,
  DECEMBER: 12,
};

/** 1–12, or null when the value names no month we can convert. */
export function monthNumber(month: unknown): number | null {
  if (typeof month === 'number') return Number.isInteger(month) && month >= 1 && month <= 12 ? month : null;
  if (typeof month === 'string') return MONTH_NUMBER[month] ?? null;
  return null;
}

/** int64 fields arrive as JSON strings over REST; anything unparseable is unknown, not zero. */
function int64(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * A keyword is only meaningful together with the market it was asked about, so
 * every lookup carries locale AND country. Keying on the keyword alone would
 * let one market's figure be served for another's.
 */
function marketKey(locale: string, country: string, query: string): string {
  return `${locale}|${country}|${String(query).toLowerCase()}`;
}

interface Metrics {
  avg: number | null;
  monthly: VolumeResult['monthly'];
  competition: number | null;
}

export class GoogleAdsProvider implements VolumeProvider {
  readonly id = 'google-ads';
  readonly scope =
    'Google Ads KeywordPlanIdeaService.GenerateKeywordHistoricalMetrics — average monthly searches ' +
    'and up to four years of monthly history for exactly the keywords asked about, per language and ' +
    'geo. Measures Google only: it is blind to Baidu, Naver and Yandex, so it cannot answer for ' +
    'mainland China.';
  readonly envVars = [
    'GOOGLE_ADS_DEVELOPER_TOKEN',
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_REFRESH_TOKEN',
    'GOOGLE_ADS_LOGIN_CUSTOMER_ID',
  ];

  configured(): boolean {
    return this.envVars.every((v) => Boolean(process.env[v]));
  }

  /**
   * Exchange the long-lived refresh token for a short-lived access token.
   *
   * Public because `associate-token.ts` needs the same exchange and there must
   * be exactly one implementation of it in this directory.
   */
  async accessToken(): Promise<string> {
    const body = new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    });
    const res = await globalThis.fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) throw new Error(`token exchange failed: HTTP ${res.status}`);
    return ((await res.json()) as { access_token: string }).access_token;
  }

  /** The request body for one market, exposed so `--dry-run` needs no credentials. */
  buildRequest(specs: QuerySpec[], locale: string, country: string): Record<string, unknown> {
    return {
      keywords: specs.map((s) => s.query),
      language: `languageConstants/${LANGUAGE[locale] ?? LANGUAGE.en}`,
      geoTargetConstants: [`geoTargetConstants/${GEO_TARGET[country] ?? GEO_TARGET.US}`],
      keywordPlanNetwork: 'GOOGLE_SEARCH',
    };
  }

  /** One entry per request: grouped by (locale, country), chunked to the keyword cap. */
  markets(specs: QuerySpec[]): { locale: string; country: string; specs: QuerySpec[] }[] {
    const by = new Map<string, QuerySpec[]>();
    for (const s of specs) {
      const k = `${s.locale}|${s.country}`;
      by.set(k, [...(by.get(k) ?? []), s]);
    }
    const out: { locale: string; country: string; specs: QuerySpec[] }[] = [];
    for (const [k, group] of by) {
      const [locale, country] = k.split('|');
      for (let i = 0; i < group.length; i += MAX_KEYWORDS_PER_REQUEST) {
        out.push({ locale, country, specs: group.slice(i, i + MAX_KEYWORDS_PER_REQUEST) });
      }
    }
    return out;
  }

  async fetch(specs: QuerySpec[]): Promise<VolumeResult[]> {
    if (!this.configured()) {
      const missing = this.envVars.filter((v) => !process.env[v]);
      return specs.map((s) => unknown(s, this.id, `not configured: missing ${missing.join(', ')}`));
    }

    const customerId = String(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID).replace(/\D/g, '');
    let token: string;
    try {
      token = await this.accessToken();
    } catch (e) {
      // A failed token exchange is zero evidence, never a zero volume.
      return specs.map((s) => unknown(s, this.id, `${(e as Error).message} — no data, not a zero`));
    }

    const found = new Map<string, Metrics>();
    const notes = new Map<string, string>();

    for (const m of this.markets(specs)) {
      const url =
        `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}` +
        `:generateKeywordHistoricalMetrics`;
      let res: Response;
      try {
        res = await globalThis.fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
            'login-customer-id': customerId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.buildRequest(m.specs, m.locale, m.country)),
        });
      } catch (e) {
        const why = `request failed for ${m.locale}/${m.country}: ${(e as Error).message} — no data, not a zero`;
        for (const s of m.specs) notes.set(marketKey(s.locale, s.country, s.query), why);
        continue;
      }
      if (!res.ok) {
        // The failure belongs to this market's request and to no other: a spec
        // in a market that answered fine must not be told this happened to it.
        const why = `HTTP ${res.status} for ${m.locale}/${m.country} — no data, not a zero`;
        for (const s of m.specs) notes.set(marketKey(s.locale, s.country, s.query), why);
        continue;
      }
      const body = (await res.json()) as any;
      for (const result of body.results ?? []) {
        const km = result?.keywordMetrics ?? {};
        const metrics: Metrics = {
          avg: int64(km.avgMonthlySearches),
          monthly: Array.isArray(km.monthlySearchVolumes)
            ? km.monthlySearchVolumes
                .map((v: any) => {
                  const month = monthNumber(v?.month);
                  const year = int64(v?.year);
                  const searches = int64(v?.monthlySearches);
                  // A month whose volume is unavailable is dropped, never
                  // carried through as a zero.
                  if (month === null || year === null || searches === null) return null;
                  return { year, month, searches };
                })
                .filter((v: unknown): v is { year: number; month: number; searches: number } =>
                  Boolean(v),
                )
            : null,
          competition: int64(km.competitionIndex),
        };
        // Near-exact duplicates are collapsed: ask for "car" and "cars" and the
        // response carries one `text` with the rest in `closeVariants`. Index
        // every spelling that was folded in, or the query we actually asked
        // about reads as absent.
        for (const spelling of [result?.text, ...(result?.closeVariants ?? [])]) {
          if (typeof spelling === 'string')
            found.set(marketKey(m.locale, m.country, spelling), metrics);
        }
      }
    }

    const at = new Date().toISOString();
    return specs.map((s) => {
      const key = marketKey(s.locale, s.country, s.query);
      const hit = found.get(key);
      const zhNote = s.locale === 'zh-CN' ? BAIDU_GAP : null;
      if (!hit) {
        return unknown(
          s,
          this.id,
          [
            notes.get(key) ??
              'no metrics returned for this keyword — absent from the response, not measured as zero',
            zhNote,
          ]
            .filter(Boolean)
            .join(' '),
        );
      }
      if (hit.avg === null) {
        return unknown(
          s,
          this.id,
          [
            'looked up, but Google Ads reports no average monthly searches for it — below its ' +
              'reporting threshold, not measured as zero',
            zhNote,
          ]
            .filter(Boolean)
            .join(' '),
        );
      }
      return {
        ...s,
        avgMonthlySearches: hit.avg,
        monthly: hit.monthly,
        competition: hit.competition,
        source: this.id,
        fetchedAt: at,
        note: zhNote,
      };
    });
  }
}
