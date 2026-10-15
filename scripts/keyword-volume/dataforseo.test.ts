// Regression tests for the two DataForSEO findings on PR #311.
//
// Both bugs are ones single-market testing cannot see: the first only appears
// when the same query string is asked of two markets, the second only when one
// task fails while another succeeds. Every assertion here is about the module's
// governing rule — a failed request, a keyword absent from a successful
// response, and an over-limit query are three different facts, each reported as
// null with its own reason, and none of them is ever a zero.

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { DataForSeoProvider } from './dataforseo';
import type { QuerySpec } from './provider';

const realFetch = globalThis.fetch;
const realEnv = { ...process.env };

/** A DataForSEO live-endpoint body carrying one successful task. */
function ok(items: { keyword: string; search_volume: number | null }[]) {
  return { tasks: [{ status_code: 20000, status_message: 'Ok.', result: items }] };
}

/** A body where the HTTP call succeeded but the task itself was refused. */
function taskError(status_code: number, status_message: string) {
  return { tasks: [{ status_code, status_message, result: null }] };
}

function provider(handler: (body: any[]) => Response): DataForSeoProvider {
  const p = new DataForSeoProvider();
  p.minTaskIntervalMs = 0; // do not wait out the 12-tasks-per-minute pacing
  globalThis.fetch = (async (_url: any, init: any) =>
    handler(JSON.parse(init.body))) as typeof globalThis.fetch;
  return p;
}

beforeEach(() => {
  process.env.DATAFORSEO_LOGIN = 'test-login';
  process.env.DATAFORSEO_PASSWORD = 'test-password';
});

afterEach(() => {
  globalThis.fetch = realFetch;
  process.env = { ...realEnv };
});

describe('volume is attributed to the market it was measured in', () => {
  const specs: QuerySpec[] = [
    { query: 'namefi', locale: 'en', country: 'US' },
    { query: 'namefi', locale: 'es', country: 'ES' },
  ];

  test('the same query in two markets keeps two separate numbers', async () => {
    // The response items carry the keyword back but not the market, so keying
    // on the keyword alone lets the second task overwrite the first.
    const p = provider((body) => {
      const volume = body[0].location_name === 'United States' ? 33100 : 720;
      return Response.json(ok([{ keyword: 'namefi', search_volume: volume }]));
    });

    const [us, es] = await p.fetch(specs);

    expect(us.country).toBe('US');
    expect(us.avgMonthlySearches).toBe(33100);
    expect(es.country).toBe('ES');
    expect(es.avgMonthlySearches).toBe(720);
  });

  test('a market that returned nothing does not inherit the other market s number', async () => {
    // Spain's task succeeds and simply has no row for the keyword. That is a
    // measured absence, and it must stay null rather than borrowing 33,100.
    const p = provider((body) =>
      Response.json(
        body[0].location_name === 'United States'
          ? ok([{ keyword: 'namefi', search_volume: 33100 }])
          : ok([]),
      ),
    );

    const [us, es] = await p.fetch(specs);

    expect(us.avgMonthlySearches).toBe(33100);
    expect(es.avgMonthlySearches).toBeNull();
    expect(es.note).toContain('absent from the response');
    expect(es.note).not.toContain('33100');
  });
});

describe('a task failure is reported only to the keywords in that task', () => {
  test('a keyword absent from a task that SUCCEEDED is not told its task failed', async () => {
    const specs: QuerySpec[] = [
      { query: 'alpha', locale: 'en', country: 'US' },
      { query: 'alpha', locale: 'es', country: 'ES' },
      { query: 'beta', locale: 'es', country: 'ES' },
    ];
    // The US task is refused by the rate limiter; the Spanish one runs and
    // answers for `alpha` but not `beta`.
    const p = provider((body) =>
      Response.json(
        body[0].location_name === 'United States'
          ? taskError(40202, 'You have exceeded the rate limit.')
          : ok([{ keyword: 'alpha', search_volume: 500 }]),
      ),
    );

    const [usAlpha, esAlpha, esBeta] = await p.fetch(specs);

    // Its own task really did fail.
    expect(usAlpha.avgMonthlySearches).toBeNull();
    expect(usAlpha.note).toContain('its task failed');
    expect(usAlpha.note).toContain('40202');

    expect(esAlpha.avgMonthlySearches).toBe(500);

    // This one was looked up and came back absent. Different fact, different note.
    expect(esBeta.avgMonthlySearches).toBeNull();
    expect(esBeta.note).toContain('absent from the response');
    expect(esBeta.note).not.toContain('its task failed');
    expect(esBeta.note).not.toContain('40202');
  });

  test('an over-limit query keeps its own reason when another task fails', async () => {
    const tooLong = 'how do i register a domain name for my new company website today';
    const specs: QuerySpec[] = [
      { query: tooLong, locale: 'en', country: 'US' },
      { query: 'alpha', locale: 'en', country: 'US' },
    ];
    const p = provider(() => new Response('upstream is down', { status: 500 }));

    const [held, submitted] = await p.fetch(specs);

    // Held back before anything was billed — it was never part of a task, so a
    // task failure is not its reason.
    expect(held.avgMonthlySearches).toBeNull();
    expect(held.note).toContain('the Google Ads keyword limit');
    expect(held.note).toContain('not submitted');
    expect(held.note).not.toContain('its task failed');

    expect(submitted.avgMonthlySearches).toBeNull();
    expect(submitted.note).toContain('its task failed');
    expect(submitted.note).toContain('HTTP 500');
  });

  test('an over-limit query is never submitted', () => {
    const tooLong = 'how do i register a domain name for my new company website today';
    const p = new DataForSeoProvider();
    const tasks = p.buildTasks([
      { query: tooLong, locale: 'en', country: 'US' },
      { query: 'alpha', locale: 'en', country: 'US' },
    ]) as { keywords: string[] }[];

    expect(tasks).toHaveLength(1);
    expect(tasks[0].keywords).toEqual(['alpha']);
  });
});
