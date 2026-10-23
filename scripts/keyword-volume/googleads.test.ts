// Regression tests for the two Google Ads findings on PR #311.
//
// The live API cannot be exercised: the developer token is still Test level, and
// test accounts hold no real data. These run against recorded response shapes
// taken from the service definition itself (googleapis/googleapis,
// google/ads/googleads/v22/services/keyword_plan_idea_service.proto and
// common/keyword_plan_common.proto, read 2026-09-03).

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { GoogleAdsProvider, monthNumber } from './googleads';
import type { QuerySpec } from './provider';

const realFetch = globalThis.fetch;
const realEnv = { ...process.env };

interface Call {
  url: string;
  body: any;
}

/**
 * Stubs the OAuth token exchange, then hands every Google Ads call to
 * `handler`. Returns the recorded API calls so the request itself can be
 * asserted on — which method was invoked, and what was in the body.
 */
function provider(handler: (body: any) => Response): { p: GoogleAdsProvider; calls: Call[] } {
  const calls: Call[] = [];
  globalThis.fetch = (async (url: any, init: any) => {
    const href = String(url);
    // Match the host itself, not a substring of the URL: `includes` would also
    // fire on https://evil.example/?x=oauth2.googleapis.com.
    if (new URL(href).hostname === 'oauth2.googleapis.com')
      return Response.json({ access_token: 'test-token' });
    const body = JSON.parse(init.body);
    calls.push({ url: href, body });
    return handler(body);
  }) as typeof globalThis.fetch;
  return { p: new GoogleAdsProvider(), calls };
}

/** One `GenerateKeywordHistoricalMetricsResult`. int64 fields arrive as strings. */
function result(
  text: string,
  metrics: Record<string, unknown>,
  closeVariants: string[] = [],
): Record<string, unknown> {
  return { text, closeVariants, keywordMetrics: metrics };
}

beforeEach(() => {
  process.env.GOOGLE_ADS_DEVELOPER_TOKEN = 'test-dev-token';
  process.env.GOOGLE_ADS_CLIENT_ID = 'test-client';
  process.env.GOOGLE_ADS_CLIENT_SECRET = 'test-secret';
  process.env.GOOGLE_ADS_REFRESH_TOKEN = 'test-refresh';
  process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID = '350-597-6042';
});

afterEach(() => {
  globalThis.fetch = realFetch;
  process.env = { ...realEnv };
});

describe('it asks for volume, not for ideas', () => {
  const specs: QuerySpec[] = [
    { query: 'domain name registration', locale: 'en', country: 'US' },
    { query: 'comprar dominio', locale: 'es', country: 'ES' },
  ];

  test('calls GenerateKeywordHistoricalMetrics with the keywords themselves', async () => {
    // GenerateKeywordIdeas takes a seed of at most 20 keywords and answers with
    // OTHER keywords; it cannot report volume for the terms asked about.
    const { p, calls } = provider(() => Response.json({ results: [] }));
    await p.fetch(specs);

    expect(calls).toHaveLength(2);
    for (const call of calls) {
      expect(call.url).toContain(':generateKeywordHistoricalMetrics');
      expect(call.url).not.toContain(':generateKeywordIdeas');
      expect(call.body.keywordSeed).toBeUndefined();
    }
    expect(calls[0].body.keywords).toEqual(['domain name registration']);
    expect(calls[1].body.keywords).toEqual(['comprar dominio']);
    expect(calls[0].body.geoTargetConstants).toEqual(['geoTargetConstants/2840']);
    expect(calls[1].body.geoTargetConstants).toEqual(['geoTargetConstants/2724']);
  });

  test('reads the volume out of keywordMetrics, per market', async () => {
    const { p } = provider((body) =>
      Response.json({
        results: [
          body.keywords[0] === 'domain name registration'
            ? result('domain name registration', {
                avgMonthlySearches: '33100',
                competitionIndex: '61',
              })
            : result('comprar dominio', { avgMonthlySearches: '8100' }),
        ],
      }),
    );

    const [us, es] = await p.fetch(specs);

    expect(us.avgMonthlySearches).toBe(33100);
    expect(us.competition).toBe(61);
    expect(us.country).toBe('US');
    expect(es.avgMonthlySearches).toBe(8100);
    expect(es.country).toBe('ES');
  });

  test('matches a keyword folded into a close variant', async () => {
    // "Not all inputs will be returned as a result of near-exact deduplication."
    // The requested spelling comes back in closeVariants, not in text.
    const { p } = provider(() =>
      Response.json({
        results: [
          result('domain registration', { avgMonthlySearches: '110000' }, ['domain registrations']),
        ],
      }),
    );

    const [row] = await p.fetch([{ query: 'domain registrations', locale: 'en', country: 'US' }]);

    expect(row.avgMonthlySearches).toBe(110000);
  });

  test('a keyword the response omits is null with a reason, never a zero', async () => {
    const { p } = provider(() => Response.json({ results: [] }));
    const [row] = await p.fetch([{ query: 'domain name registration', locale: 'en', country: 'US' }]);

    expect(row.avgMonthlySearches).toBeNull();
    expect(row.note).toContain('absent from the response');
  });
});

describe('monthly series is numeric in both providers', () => {
  test('MonthOfYear enum names become 1-12', async () => {
    const { p } = provider(() =>
      Response.json({
        results: [
          result('domain name registration', {
            avgMonthlySearches: '33100',
            monthlySearchVolumes: [
              { year: '2025', month: 'NOVEMBER', monthlySearches: '27100' },
              { year: '2025', month: 'DECEMBER', monthlySearches: '33100' },
              { year: '2026', month: 'JANUARY', monthlySearches: '40500' },
            ],
          }),
        ],
      }),
    );

    const [row] = await p.fetch([
      { query: 'domain name registration', locale: 'en', country: 'US' },
    ]);

    expect(row.monthly).toEqual([
      { year: 2025, month: 11, searches: 27100 },
      { year: 2025, month: 12, searches: 33100 },
      { year: 2026, month: 1, searches: 40500 },
    ]);
    for (const m of row.monthly ?? []) expect(typeof m.month).toBe('number');
  });

  test('a month with no volume is dropped, not zero-filled', async () => {
    const { p } = provider(() =>
      Response.json({
        results: [
          result('domain name registration', {
            avgMonthlySearches: '33100',
            monthlySearchVolumes: [
              { year: '2025', month: 'NOVEMBER' }, // monthlySearches absent = unavailable
              { year: '2025', month: 'UNSPECIFIED', monthlySearches: '10' },
              { year: '2025', month: 'DECEMBER', monthlySearches: '33100' },
            ],
          }),
        ],
      }),
    );

    const [row] = await p.fetch([
      { query: 'domain name registration', locale: 'en', country: 'US' },
    ]);

    expect(row.monthly).toEqual([{ year: 2025, month: 12, searches: 33100 }]);
  });

  test('monthNumber converts names and refuses everything else', () => {
    expect(monthNumber('JANUARY')).toBe(1);
    expect(monthNumber('DECEMBER')).toBe(12);
    expect(monthNumber(7)).toBe(7);
    expect(monthNumber('UNSPECIFIED')).toBeNull();
    expect(monthNumber('UNKNOWN')).toBeNull();
    expect(monthNumber(0)).toBeNull();
    expect(monthNumber(13)).toBeNull();
    expect(monthNumber(undefined)).toBeNull();
  });
});

describe('a per-market failure stays in its market', () => {
  test('the market that answered still carries its number', async () => {
    const { p } = provider((body) =>
      body.keywords[0] === 'domain name registration'
        ? new Response('quota exhausted', { status: 429 })
        : Response.json({ results: [result('comprar dominio', { avgMonthlySearches: '8100' })] }),
    );

    const [us, es] = await p.fetch([
      { query: 'domain name registration', locale: 'en', country: 'US' },
      { query: 'comprar dominio', locale: 'es', country: 'ES' },
    ]);

    expect(us.avgMonthlySearches).toBeNull();
    expect(us.note).toContain('HTTP 429');
    expect(es.avgMonthlySearches).toBe(8100);
    expect(es.note).toBeNull();
  });
});
