// DataForSEO provider — Google Ads search volume, resold.
//
// Auth (verified against docs.dataforseo.com/v3/auth on 2026-09-02): HTTP Basic,
// `Authorization: Basic base64(login:password)`, where the password is the
// API password generated in the dashboard's API Access tab, NOT the account
// password. Credentials cannot be passed as URL parameters.
//
// Endpoint: keywords_data/google_ads/search_volume/live — POST a task array,
// get results back in the same call.
//
// Credentials are read from the environment and never logged. Put them in
// `~/ws/d3servelabs/namefi-resources/.env.local` (the repo-container root, not
// a worktree) so a grep from inside a worktree cannot find them.

import {
  BAIDU_GAP,
  LOCALE_MARKET,
  unknown,
  type QuerySpec,
  type VolumeProvider,
  type VolumeResult,
} from './provider.ts';

const ENDPOINT = 'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live';

// Google Ads rejects a keyword longer than these, and DataForSEO fails the WHOLE
// task if any single keyword in it is invalid — so one over-long query silently
// costs you every other keyword batched with it. Observed 2026-09-02: three
// 11-word questions in a 400-keyword task returned zero rows for all 400.
// Over-limit queries are therefore held back and reported as unmeasurable
// rather than submitted.
// 12 tasks per minute, account-wide. Exceeding it returns status_code 40202 per
// rejected task at HTTP 200 — the tasks are refused, not queued, and refused
// tasks are not billed. Firing 100 tasks at once loses 88 of them.
export const TASKS_PER_MINUTE = 12;
export const MIN_TASK_INTERVAL_MS = Math.ceil(60_000 / TASKS_PER_MINUTE);

const MAX_WORDS = 10;
const MAX_CHARS = 80;

/** Why this query cannot be submitted, or null when it can. */
function rejectReason(query: string): string | null {
  const words = query.trim().split(/\s+/).length;
  if (words > MAX_WORDS)
    return `query is ${words} words; the Google Ads keyword limit is ${MAX_WORDS} — not submitted, so this is not a zero`;
  if (query.length > MAX_CHARS)
    return `query is ${query.length} characters; the Google Ads keyword limit is ${MAX_CHARS} — not submitted, so this is not a zero`;
  return null;
}

/** DataForSEO location codes are Google geo target constants; ISO-2 works via location_name. */
const COUNTRY_NAME: Record<string, string> = {
  US: 'United States',
  CN: 'China',
  ES: 'Spain',
  DE: 'Germany',
  FR: 'France',
  EG: 'Egypt',
  IN: 'India',
  KR: 'South Korea',
  JP: 'Japan',
};

/** Google language names DataForSEO expects. */
const LANG_NAME: Record<string, string> = {
  en: 'English',
  'zh-CN': 'Chinese (simplified)',
  es: 'Spanish',
  de: 'German',
  fr: 'French',
  ar: 'Arabic',
  hi: 'Hindi',
  ko: 'Korean',
  ja: 'Japanese',
  ta: 'Tamil',
};

export class DataForSeoProvider implements VolumeProvider {
  readonly id = 'dataforseo';
  readonly scope =
    'Google Ads search volume, resold. Same upstream as the Google Ads API, so the same blind spot: ' +
    'it measures Google, not Baidu, Naver or Yandex.';
  readonly envVars = ['DATAFORSEO_LOGIN', 'DATAFORSEO_PASSWORD'];

  /** Which request shape the last fetch actually used. Diagnostic only. */
  transport: string | null = null;

  configured(): boolean {
    return Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
  }

  private authHeader(): string {
    const raw = `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`;
    return `Basic ${Buffer.from(raw).toString('base64')}`;
  }

  /** The exact request body, exposed so `--dry-run` can print it without credentials. */
  buildTasks(specs: QuerySpec[]): unknown[] {
    const byMarket = new Map<string, QuerySpec[]>();
    for (const s of specs) {
      if (rejectReason(s.query)) continue;
      const key = `${s.locale}|${s.country}`;
      byMarket.set(key, [...(byMarket.get(key) ?? []), s]);
    }
    // Billing and the API are both per task, capped at 1,000 keywords per task
    // (verified against dataforseo.com/pricing/keywords-data/google-ads on
    // 2026-09-02: $0.09 per live task, up to 1,000 keywords). Chunk so a large
    // market cannot silently overflow the cap.
    const MAX_PER_TASK = 1000;
    const tasks: unknown[] = [];
    for (const [key, group] of byMarket) {
      const [locale, country] = key.split('|');
      for (let i = 0; i < group.length; i += MAX_PER_TASK) {
        tasks.push({
          keywords: group.slice(i, i + MAX_PER_TASK).map((g) => g.query),
          location_name: COUNTRY_NAME[country] ?? country,
          language_name: LANG_NAME[locale] ?? locale,
          search_partners: false,
        });
      }
    }
    return tasks;
  }

  async fetch(specs: QuerySpec[]): Promise<VolumeResult[]> {
    if (!this.configured()) {
      return specs.map((s) =>
        unknown(s, this.id, `not configured: set ${this.envVars.join(' and ')}`),
      );
    }
    // ONE TASK PER REQUEST. This endpoint accepts a JSON array, which reads like
    // a batch API, but it processes only the first element: a two-task body
    // returns HTTP 200 while the second task carries status_code 40000, "You
    // can set only one task at a time". Verified 2026-09-02 — the first task's
    // 400 keywords came back fine and the second task's 240 were never looked
    // up. Billing is per task, so splitting costs exactly the same.
    //
    // Before the account was verified the same body failed earlier, with HTTP
    // 403 / 40104 ("please verify your account"). That was a separate problem
    // and it masked this one; do not read a 403 here as a batching error.
    const tasks = this.buildTasks(specs);
    const found = new Map<string, any>();
    const failures: string[] = [];

    const post = async (batch: unknown[]): Promise<boolean> => {
      const res = await globalThis.fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: this.authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });
      if (!res.ok) {
        // A non-200 is zero evidence, never a zero volume.
        failures.push(`HTTP ${res.status}`);
        return false;
      }
      const body = (await res.json()) as any;
      let anyResult = false;
      for (const t of body.tasks ?? []) {
        // A task can fail while the HTTP call succeeds. Record it: a failed task
        // means its keywords were never looked up, which is not the same as a
        // keyword that was looked up and came back absent.
        if (t?.status_code !== 20000) {
          failures.push(`task ${t?.status_code} ${t?.status_message ?? ''}`.trim());
          continue;
        }
        for (const item of t.result ?? []) {
          if (item?.keyword) {
            found.set(String(item.keyword).toLowerCase(), item);
            anyResult = true;
          }
        }
      }
      return anyResult;
    };

    for (const [i, task] of tasks.entries()) {
      if (i > 0) await new Promise((r) => setTimeout(r, MIN_TASK_INTERVAL_MS));
      await post([task]);
    }
    this.transport = `${tasks.length} task(s), one request each`;

    if (found.size === 0 && failures.length) {
      return specs.map((s) =>
        unknown(s, this.id, `${failures.join(', ')} — no data, not a zero`),
      );
    }
    const at = new Date().toISOString();
    return specs.map((s) => {
      const hit = found.get(s.query.toLowerCase());
      const zhNote = s.locale === 'zh-CN' ? BAIDU_GAP : null;
      const rejected = rejectReason(s.query);
      if (rejected) return unknown(s, this.id, rejected);
      if (!hit) {
        const why = failures.length
          ? `its task failed (${failures.join('; ')}) — never looked up, not a zero`
          : 'no row returned for this keyword — absent from the response, not measured as zero';
        return unknown(s, this.id, why);
      }
      if (typeof hit.search_volume !== 'number') {
        return unknown(
          s,
          this.id,
          'looked up, but Google Ads reports no volume for it — below its reporting threshold, not measured as zero',
        );
      }
      return {
        ...s,
        avgMonthlySearches: hit.search_volume,
        monthly: Array.isArray(hit.monthly_searches)
          ? hit.monthly_searches.map((m: any) => ({
              year: m.year,
              month: m.month,
              searches: m.search_volume,
            }))
          : null,
        competition: typeof hit.competition_index === 'number' ? hit.competition_index : null,
        source: this.id,
        fetchedAt: at,
        note: zhNote,
      };
    });
  }
}

export { LOCALE_MARKET };
