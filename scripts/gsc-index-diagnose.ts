#!/usr/bin/env bun
/**
 * GSC Index Diagnose
 *
 * Pulls indexing status from Google Search Console, buckets URLs by
 * URL-path template, fetches each URL to compare raw HTML vs. rendered
 * content, and writes a prioritized CSV.
 *
 * Setup (one-time, ~5 min):
 *   1. Create / pick a GCP project, enable Search Console API:
 *      https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
 *   2. APIs & Services → OAuth consent screen → User type "External" →
 *      App name anything → add your own Google account under "Test users".
 *   3. APIs & Services → Credentials → Create credentials → OAuth client ID →
 *      Application type **Desktop app** → Download JSON.
 *   4. bun add -D googleapis @google-cloud/local-auth
 *   5. Save the downloaded file as ./scripts/.gsc-oauth-client.json (gitignored).
 *      export GSC_SITE_URL='sc-domain:namefi.io'   # or 'https://namefi.io/'
 *
 * Run:
 *   bun tsx scripts/gsc-index-diagnose.ts
 *   bun tsx scripts/gsc-index-diagnose.ts --limit 200 --sample-fetch 20
 *
 * On first run a browser window opens for Google sign-in; the refresh token
 * is cached at ./scripts/.gsc-oauth-token.json for subsequent runs.
 *
 * Output:
 *   ./out/gsc-diagnose-<timestamp>.csv
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
// Deps live in a sandbox to avoid the workspace catalog. See scripts/.gsc-deps/.
import { google } from './.gsc-deps/node_modules/googleapis/build/src/index.js';
import { authenticate } from './.gsc-deps/node_modules/@google-cloud/local-auth/build/src/index.js';

type Args = {
  limit: number;
  sampleFetch: number;
  daysBack: number;
  inputCsv: string | null;
};

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (flag: string, def: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : def;
  };
  return {
    limit: Number(get('--limit', '500')),
    sampleFetch: Number(get('--sample-fetch', '15')),
    daysBack: Number(get('--days-back', '28')),
    inputCsv: get('--input-csv', '') || null,
  };
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var: ${name}`);
    process.exit(1);
  }
  return v;
}

const OAUTH_CLIENT_PATH = resolve('scripts/.gsc-oauth-client.json');
const OAUTH_TOKEN_PATH = resolve('scripts/.gsc-oauth-token.json');
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

async function authClient() {
  const saKey = process.env.GSC_SA_KEY_PATH;
  if (saKey) {
    console.log(`Authenticating as service account from ${saKey}`);
    const auth = new google.auth.GoogleAuth({
      keyFile: resolve(saKey),
      scopes: SCOPES,
    });
    return auth.getClient();
  }

  if (!existsSync(OAUTH_CLIENT_PATH)) {
    console.error(`Missing OAuth client file: ${OAUTH_CLIENT_PATH}`);
    console.error(
      'Download from GCP → Credentials → OAuth client ID (Desktop app) and save there.',
    );
    process.exit(1);
  }

  if (existsSync(OAUTH_TOKEN_PATH)) {
    const creds = JSON.parse(readFileSync(OAUTH_TOKEN_PATH, 'utf8'));
    const clientFile = JSON.parse(readFileSync(OAUTH_CLIENT_PATH, 'utf8'));
    const { client_id, client_secret, redirect_uris } =
      clientFile.installed ?? clientFile.web;
    const oauth2 = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris?.[0],
    );
    oauth2.setCredentials(creds);
    return oauth2;
  }

  console.log('Opening browser for Google sign-in...');
  const client = await authenticate({
    keyfilePath: OAUTH_CLIENT_PATH,
    scopes: SCOPES,
  });
  if (client.credentials) {
    writeFileSync(
      OAUTH_TOKEN_PATH,
      JSON.stringify(client.credentials, null, 2),
    );
    console.log(`Cached refresh token → ${OAUTH_TOKEN_PATH}`);
  }
  return client;
}

/**
 * Pull top URLs in the property via the Search Analytics API. GSC does not
 * expose the "Crawled - currently not indexed" bucket directly via API
 * (only URL Inspection works per-URL), so we use SA top URLs as candidates
 * and inspect each one.
 */
async function listCandidateUrls(
  siteUrl: string,
  daysBack: number,
  limit: number,
) {
  const webmasters = google.webmasters('v3');
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - daysBack);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const res = await webmasters.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      dimensions: ['page'],
      rowLimit: limit,
    },
  });
  return (res.data.rows ?? [])
    .map((r) => r.keys?.[0])
    .filter(Boolean) as string[];
}

async function inspectUrl(siteUrl: string, url: string) {
  const inspector = google.searchconsole('v1');
  try {
    const res = await inspector.urlInspection.index.inspect({
      requestBody: { inspectionUrl: url, siteUrl },
    });
    return res.data.inspectionResult;
  } catch (e: any) {
    return { error: e?.message ?? 'inspect failed' } as any;
  }
}

function templateOf(url: string): string {
  try {
    const u = new URL(url);
    const segs = u.pathname.split('/').filter(Boolean);
    const norm = segs.map((s) => {
      if (/^\d+$/.test(s)) return ':num';
      if (/^[0-9a-f]{8}-/i.test(s)) return ':uuid';
      if (s.length > 24) return ':slug';
      return s;
    });
    return `/${norm.join('/')}` || '/';
  } catch {
    return url;
  }
}

async function fetchHtmlSnapshot(url: string) {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; gsc-diagnose/1.0)' },
      redirect: 'follow',
    });
    const text = await res.text();
    const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? text;
    const stripped = bodyMatch
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ');
    const wordCount = stripped.split(/\s+/).filter(Boolean).length;
    const hasNoindex = /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(text);
    const canonicalMatch = text.match(
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i,
    );
    return {
      status: res.status,
      wordCount,
      hasNoindex,
      canonical: canonicalMatch?.[1] ?? null,
    };
  } catch (e: any) {
    return {
      status: 0,
      wordCount: 0,
      hasNoindex: false,
      canonical: null,
      error: e?.message,
    };
  }
}

function diagnose(row: {
  coverageState?: string;
  htmlWords?: number;
  hasNoindex?: boolean;
  canonical?: string | null;
  url: string;
}): string {
  const reasons: string[] = [];
  if (row.hasNoindex) reasons.push('noindex meta tag');
  if ((row.htmlWords ?? 0) < 100)
    reasons.push('thin server-rendered HTML (likely client-only render)');
  if (row.canonical && row.canonical !== row.url)
    reasons.push(`canonical points elsewhere (${row.canonical})`);
  if (row.coverageState?.toLowerCase().includes('duplicate'))
    reasons.push('duplicate per GSC');
  if (row.coverageState?.toLowerCase().includes('crawled'))
    reasons.push('crawled-not-indexed (quality signal)');
  if (row.coverageState?.toLowerCase().includes('discovered'))
    reasons.push('discovered-not-crawled (crawl budget / internal linking)');
  if (row.coverageState?.toLowerCase().includes('soft 404'))
    reasons.push('soft 404 (empty state)');
  return reasons.join('; ') || 'unknown';
}

async function main() {
  const { limit, sampleFetch, daysBack, inputCsv } = parseArgs();
  const siteUrl = requireEnv('GSC_SITE_URL');

  const client = await authClient();
  google.options({ auth: client as any });

  let urls: string[];
  if (inputCsv) {
    console.log(`Reading URLs from ${inputCsv}`);
    const raw = readFileSync(inputCsv, 'utf8');
    urls = raw
      .split(/\r?\n/)
      .map((l) => {
        const cell = l.split(',')[0]?.trim().replace(/^"|"$/g, '');
        return cell;
      })
      .filter((u): u is string => !!u && /^https?:\/\//.test(u))
      .slice(0, limit);
  } else {
    console.log(
      `Fetching top ${limit} URLs from ${siteUrl} (last ${daysBack}d)...`,
    );
    urls = await listCandidateUrls(siteUrl, daysBack, limit);
  }
  console.log(`Got ${urls.length} candidate URLs.`);

  const rows: Record<string, string | number | boolean | null>[] = [];

  let i = 0;
  for (const url of urls) {
    i++;
    process.stdout.write(`\rInspecting ${i}/${urls.length}`);
    const inspection: any = await inspectUrl(siteUrl, url);
    const indexStatus = inspection?.indexStatusResult ?? {};
    const coverageState: string =
      indexStatus.coverageState ?? inspection?.error ?? 'unknown';
    const verdict: string = indexStatus.verdict ?? '';
    const lastCrawl: string = indexStatus.lastCrawlTime ?? '';
    const gscCanonical: string = indexStatus.googleCanonical ?? '';
    const userCanonical: string = indexStatus.userCanonical ?? '';

    let htmlWords: number | undefined;
    let hasNoindex: boolean | undefined;
    let canonical: string | null | undefined;
    let httpStatus: number | undefined;

    if (i <= sampleFetch) {
      const snap = await fetchHtmlSnapshot(url);
      htmlWords = snap.wordCount;
      hasNoindex = snap.hasNoindex;
      canonical = snap.canonical;
      httpStatus = snap.status;
    }

    const reason = diagnose({
      coverageState,
      htmlWords,
      hasNoindex,
      canonical,
      url,
    });

    rows.push({
      url,
      template: templateOf(url),
      verdict,
      coverageState,
      lastCrawl,
      gscCanonical,
      userCanonical,
      httpStatus: httpStatus ?? '',
      htmlWords: htmlWords ?? '',
      hasNoindex: hasNoindex ?? '',
      pageCanonical: canonical ?? '',
      likelyCause: reason,
    });
  }
  process.stdout.write('\n');

  // Bucket summary
  const bucketCounts = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.template} | ${r.coverageState}`;
    bucketCounts.set(key, (bucketCounts.get(key) ?? 0) + 1);
  }
  const sortedBuckets = [...bucketCounts.entries()].sort((a, b) => b[1] - a[1]);

  console.log('\nTop buckets (template | coverageState | count):');
  for (const [k, v] of sortedBuckets.slice(0, 20))
    console.log(`  ${v.toString().padStart(4)}  ${k}`);

  // Write CSV
  if (!existsSync('out')) mkdirSync('out');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = `out/gsc-diagnose-${ts}.csv`;
  const headers = Object.keys(rows[0] ?? { url: '' });
  const escapeCsvField = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escapeCsvField(r[h])).join(',')),
  ].join('\n');
  writeFileSync(outPath, csv);
  console.log(`\nWrote ${rows.length} rows → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
