// Google Ads API provider — KeywordPlanIdeaService, the primary volume source.
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
// (`secretctl run --with '^GOOGLE_ADS_.*$=&' -- …`) rather than a plaintext file.

import {
  BAIDU_GAP,
  unknown,
  type QuerySpec,
  type VolumeProvider,
  type VolumeResult,
} from './provider.ts';

export const API_VERSION = 'v21';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

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

export class GoogleAdsProvider implements VolumeProvider {
  readonly id = 'google-ads';
  readonly scope =
    'Google Ads KeywordPlanIdeaService — average monthly searches and up to four years of ' +
    'monthly history, per language and geo. Measures Google only: it is blind to Baidu, ' +
    'Naver and Yandex, so it cannot answer for mainland China.';
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
      language: `languageConstants/${LANGUAGE[locale] ?? LANGUAGE.en}`,
      geoTargetConstants: [`geoTargetConstants/${GEO_TARGET[country] ?? GEO_TARGET.US}`],
      keywordPlanNetwork: 'GOOGLE_SEARCH',
      keywordSeed: { keywords: specs.map((s) => s.query) },
    };
  }

  /** Group specs into one request per (locale, country) market. */
  markets(specs: QuerySpec[]): { locale: string; country: string; specs: QuerySpec[] }[] {
    const by = new Map<string, QuerySpec[]>();
    for (const s of specs) {
      const k = `${s.locale}|${s.country}`;
      by.set(k, [...(by.get(k) ?? []), s]);
    }
    return [...by.entries()].map(([k, group]) => {
      const [locale, country] = k.split('|');
      return { locale, country, specs: group };
    });
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

    const found = new Map<string, { avg: number | null; monthly: VolumeResult['monthly'] }>();
    const notes = new Map<string, string>();

    for (const m of this.markets(specs)) {
      const url =
        `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}` +
        `:generateKeywordIdeas`;
      const res = await globalThis.fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
          'login-customer-id': customerId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.buildRequest(m.specs, m.locale, m.country)),
      });
      if (!res.ok) {
        const why = `HTTP ${res.status} for ${m.locale}/${m.country} — no data, not a zero`;
        for (const s of m.specs) notes.set(`${s.locale}|${s.query.toLowerCase()}`, why);
        continue;
      }
      const body = (await res.json()) as any;
      for (const idea of body.results ?? []) {
        const metrics = idea.keywordIdeaMetrics ?? {};
        found.set(`${m.locale}|${String(idea.text).toLowerCase()}`, {
          avg: metrics.avgMonthlySearches != null ? Number(metrics.avgMonthlySearches) : null,
          monthly: Array.isArray(metrics.monthlySearchVolumes)
            ? metrics.monthlySearchVolumes.map((v: any) => ({
                year: Number(v.year),
                month: v.month,
                searches: Number(v.monthlySearches),
              }))
            : null,
        });
      }
    }

    const at = new Date().toISOString();
    return specs.map((s) => {
      const key = `${s.locale}|${s.query.toLowerCase()}`;
      const hit = found.get(key);
      const zhNote = s.locale === 'zh-CN' ? BAIDU_GAP : null;
      if (!hit) {
        return unknown(
          s,
          this.id,
          [
            notes.get(key) ??
              'no idea returned for this keyword — absent from the response, not measured as zero',
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
        competition: null,
        source: this.id,
        fetchedAt: at,
        note: zhNote,
      };
    });
  }
}
