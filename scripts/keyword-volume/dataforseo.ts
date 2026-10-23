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

/**
 * A keyword is only meaningful together with the market it was asked about:
 * `域名注册` in zh-CN/CN and in zh-CN/TW are two different questions, and the
 * same English string asked of the US and of Spain returns two different
 * numbers. Every lookup in this file is keyed on all three so a row can never
 * inherit a figure measured for a different market.
 */
function marketKey(locale: string, country: string, query: string): string {
  return `${locale}|${country}|${String(query).toLowerCase()}`;
}

/**
 * One submittable task, kept next to the market that produced it. The response
 * items carry only the keyword back — not the language or location they were
 * looked up for — so attribution has to come from the request side.
 */
export interface TaskPlan {
  locale: string;
  country: string;
  /** The specs this task covers, over-limit queries already held back. */
  specs: QuerySpec[];
  /** The exact JSON body posted for this task. */
  body: Record<string, unknown>;
}

export class DataForSeoProvider implements VolumeProvider {
  readonly id = 'dataforseo';
  readonly scope =
    'Google Ads search volume, resold. Same upstream as the Google Ads API, so the same blind spot: ' +
    'it measures Google, not Baidu, Naver or Yandex.';
  readonly envVars = ['DATAFORSEO_LOGIN', 'DATAFORSEO_PASSWORD'];

  /** Which request shape the last fetch actually used. Diagnostic only. */
  transport: string | null = null;

  /**
   * Gap between tasks, to stay under the account-wide 12-per-minute limit.
   * Settable so tests can drive the request loop without waiting on the clock.
   */
  minTaskIntervalMs = MIN_TASK_INTERVAL_MS;

  configured(): boolean {
    return Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
  }

  private authHeader(): string {
    const raw = `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`;
    return `Basic ${Buffer.from(raw).toString('base64')}`;
  }

  /** The tasks to submit, each carrying the market it belongs to. */
  planTasks(specs: QuerySpec[]): TaskPlan[] {
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
    const plans: TaskPlan[] = [];
    for (const [key, group] of byMarket) {
      const [locale, country] = key.split('|');
      for (let i = 0; i < group.length; i += MAX_PER_TASK) {
        const chunk = group.slice(i, i + MAX_PER_TASK);
        plans.push({
          locale,
          country,
          specs: chunk,
          body: {
            keywords: chunk.map((g) => g.query),
            location_name: COUNTRY_NAME[country] ?? country,
            language_name: LANG_NAME[locale] ?? locale,
            search_partners: false,
          },
        });
      }
    }
    return plans;
  }

  /** The exact request bodies, exposed so `--dry-run` can print them without credentials. */
  buildTasks(specs: QuerySpec[]): unknown[] {
    return this.planTasks(specs).map((p) => p.body);
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
    const plans = this.planTasks(specs);
    const found = new Map<string, any>();
    // Failures are recorded against the task that suffered them, never pooled:
    // a keyword missing from a task that SUCCEEDED was looked up and came back
    // absent, which is a different fact from a keyword whose task never ran.
    const taskFailures = new Map<number, string[]>();
    // Which task each spec was submitted in, so a spec can be told about its own
    // task and no other.
    const taskOf = new Map<string, number>();
    for (const [i, plan] of plans.entries()) {
      for (const s of plan.specs) taskOf.set(marketKey(s.locale, s.country, s.query), i);
    }

    const post = async (plan: TaskPlan, index: number): Promise<void> => {
      const fail = (why: string) =>
        taskFailures.set(index, [...(taskFailures.get(index) ?? []), why]);
      let res: Response;
      try {
        res = await globalThis.fetch(ENDPOINT, {
          method: 'POST',
          headers: { Authorization: this.authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify([plan.body]),
        });
      } catch (e) {
        // A transport error is zero evidence, never a zero volume.
        fail(`request failed: ${(e as Error).message}`);
        return;
      }
      if (!res.ok) {
        // A non-200 is zero evidence, never a zero volume.
        fail(`HTTP ${res.status}`);
        return;
      }
      const body = (await res.json()) as any;
      const tasks = body?.tasks ?? [];
      if (!Array.isArray(tasks) || tasks.length === 0) {
        fail('no task in the response body');
        return;
      }
      for (const t of tasks) {
        // A task can fail while the HTTP call succeeds. Record it: a failed task
        // means its keywords were never looked up, which is not the same as a
        // keyword that was looked up and came back absent.
        if (t?.status_code !== 20000) {
          fail(`task ${t?.status_code} ${t?.status_message ?? ''}`.trim());
          continue;
        }
        // The response repeats the keyword but not the market, so the market
        // comes from the plan that produced this request.
        for (const item of t.result ?? []) {
          if (item?.keyword) found.set(marketKey(plan.locale, plan.country, item.keyword), item);
        }
      }
    };

    for (const [i, plan] of plans.entries()) {
      if (i > 0 && this.minTaskIntervalMs > 0)
        await new Promise((r) => setTimeout(r, this.minTaskIntervalMs));
      await post(plan, i);
    }
    this.transport = `${plans.length} task(s), one request each`;

    const at = new Date().toISOString();
    return specs.map((s) => {
      // An over-limit query was never submitted at all, so its own reason stands
      // ahead of anything that happened to the tasks that did run.
      const rejected = rejectReason(s.query);
      if (rejected) return unknown(s, this.id, rejected);

      const key = marketKey(s.locale, s.country, s.query);
      const hit = found.get(key);
      if (!hit) {
        const index = taskOf.get(key);
        const failures = index === undefined ? undefined : taskFailures.get(index);
        const why = failures?.length
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
        note: s.locale === 'zh-CN' ? BAIDU_GAP : null,
      };
    });
  }
}

export { LOCALE_MARKET };
