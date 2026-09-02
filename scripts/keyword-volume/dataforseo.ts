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
    const tasks = this.buildTasks(specs);
    const res = await globalThis.fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: this.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(tasks),
    });
    if (!res.ok) {
      // A non-200 is zero evidence, never a zero volume.
      return specs.map((s) => unknown(s, this.id, `HTTP ${res.status} — no data, not a zero`));
    }
    const body = (await res.json()) as any;
    const found = new Map<string, any>();
    for (const task of body.tasks ?? []) {
      for (const item of task.result ?? []) {
        if (item?.keyword) found.set(String(item.keyword).toLowerCase(), item);
      }
    }
    const at = new Date().toISOString();
    return specs.map((s) => {
      const hit = found.get(s.query.toLowerCase());
      const zhNote = s.locale === 'zh-CN' ? BAIDU_GAP : null;
      if (!hit) {
        return unknown(
          s,
          this.id,
          ['no row returned for this keyword — absent from the response, not measured as zero', zhNote]
            .filter(Boolean)
            .join(' '),
        );
      }
      return {
        ...s,
        avgMonthlySearches: hit.search_volume ?? null,
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
