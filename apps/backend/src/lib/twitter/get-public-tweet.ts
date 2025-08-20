import Bottleneck from 'bottleneck';
import { LRUCache } from 'mnemonist';
import { decode as decodeEntities } from 'entities';
import { z } from 'zod';

/* ---------- Types & schema ---------- */
const OEmbed = z.object({
  html: z.string(),
  author_name: z.string(),
  author_url: z.string(),
  cache_age: z.string().optional(),
  url: z.string(),
});

export type PublicTweet = {
  text: string;
  rawHtml: string;
  author: { name: string; url: string; username: string };
  cacheTtlSeconds?: number;
  canonicalUrl: string;
  links: string[]; // unresolved links extracted from oEmbed HTML
  hashtags: Array<{ tag: string; url: string; baseUrl: string }>; // extracted from oEmbed HTML
};

/* ---------- Config ---------- */
const limiter = new Bottleneck({
  /* --- pace control ---------------------------------------------------- */
  maxConcurrent: 2, // never more than 2 requests in flight
  minTime: 200, // 200 ms gap ⇒ ≈5 req/sec sustained

  /* --- sliding‑window budget (15‑min rolling window) ------------------- */
  reservoir: 900, // start with 900 tokens
  reservoirRefreshAmount: 900, // refill to 900 …
  reservoirRefreshInterval: 15 * 60 * 1000, // … every 15 minutes

  /* --- queue‑overflow safety -------------------------------- */
  highWater: 1200, // drop if >1200 queued
  strategy: Bottleneck.strategy.OVERFLOW, // fail fast instead of piling up
});

const CACHE_CAPACITY = 1000;
const MIN_TTL_MS = 30_000; // clamp very small cache_age
const MAX_TTL_MS = 24 * 60 * 60 * 1000; // clamp very large cache_age
const SWR_MS = 10 * 60 * 1000; // serve-stale-while-revalidate window

/* ---------- LRU cache ---------- */
type CacheEntry = { value: PublicTweet; expires: number; swrExpires: number };
const cache = new LRUCache<string, CacheEntry>(CACHE_CAPACITY);

// Coalesce concurrent fetches for the same ID
const inflight = new Map<string, Promise<PublicTweet>>();

/* ---------- Utils ---------- */
const STATUS_ID_REGEX = /status\/(\d{5,30})/;
const NUMERIC_ID_REGEX = /^\d{5,30}$/;
const BLOCKQUOTE_REGEX = /<blockquote[\s\S]*?>\s*<p[^>]*>([\s\S]*?)<\/p>/i;
const BR_TAG_REGEX = /<br\s*\/?>/gi;
const HTML_TAG_REGEX = /<[^>]+>/g;

function toPostUrl(input: string) {
  const m =
    input.match(STATUS_ID_REGEX) ??
    (NUMERIC_ID_REGEX.test(input) ? [undefined, input] : null);
  return m ? `https://x.com/i/status/${m[1]}` : input;
}

function extractId(input: string) {
  const m =
    input.match(STATUS_ID_REGEX) ??
    (NUMERIC_ID_REGEX.test(input) ? [undefined, input] : null);
  return m ? m[1] : input; // fall back to full URL if no numeric ID
}

function extractTextFromOEmbedHtml(html: string) {
  const match = html.match(BLOCKQUOTE_REGEX);
  if (!match) return '';
  const inner = match[1]
    .replace(BR_TAG_REGEX, '\n')
    .replace(HTML_TAG_REGEX, '');
  return decodeEntities(inner).trim();
}

function extractLinksFromOEmbedHtml(html: string): string[] {
  const hrefs: string[] = [];
  const hrefRegex = /<a [^>]*href="([^"]+)"[^>]*>/gi;
  const expandedRegex = /data-expanded-url="([^"]+)"/gi;

  let match: RegExpExecArray | null = hrefRegex.exec(html);
  while (match !== null) {
    if (match[1]) hrefs.push(match[1]);
    match = hrefRegex.exec(html);
  }

  match = expandedRegex.exec(html);
  while (match !== null) {
    if (match[1]) hrefs.push(match[1]);
    match = expandedRegex.exec(html);
  }

  return Array.from(new Set(hrefs));
}

function extractUsernameFromAuthorUrl(authorUrl: string): string {
  const u = new URL(authorUrl);
  const parts = u.pathname.split('/').filter(Boolean);
  return parts[0];
}

function extractHashtagsFromOEmbedHtml(html: string): Array<{
  tag: string;
  url: string;
  baseUrl: string;
}> {
  const results: Array<{ tag: string; url: string; baseUrl: string }> = [];
  const hashtagAnchorRegex =
    /<a [^>]*href="([^"]*(?:twitter|x)\.com\/hashtag\/[^"\s]+)"[^>]*>(#[^<\s]+)<\/a>/gi;
  let m: RegExpExecArray | null = hashtagAnchorRegex.exec(html);
  while (m !== null) {
    const url = m[1] ?? '';
    const tag = m[2] ?? '';
    let baseUrl = url;
    try {
      const u = new URL(url);
      u.search = '';
      baseUrl = u.toString();
    } catch {
      // keep as-is if URL parsing fails
    }
    results.push({ tag, url, baseUrl });
    m = hashtagAnchorRegex.exec(html);
  }
  return results;
}

async function fetchOEmbed(postUrl: string) {
  const qs = new URLSearchParams({
    url: postUrl,
    omit_script: '1',
    dnt: '1',
    hide_thread: '1',
  });
  const res = await limiter.schedule(() =>
    fetch(`https://publish.twitter.com/oembed?${qs}`),
  );
  if (!res.ok) throw new Error(`oEmbed error ${res.status}`);
  return OEmbed.parse(await res.json());
}

async function refresh(id: string, urlOrId: string): Promise<PublicTweet> {
  const postUrl = toPostUrl(urlOrId);
  const data = await fetchOEmbed(postUrl);

  const value: PublicTweet = {
    text: extractTextFromOEmbedHtml(data.html),
    rawHtml: data.html,
    links: extractLinksFromOEmbedHtml(data.html),
    hashtags: extractHashtagsFromOEmbedHtml(data.html),
    author: {
      name: data.author_name,
      url: data.author_url,
      username: `@${extractUsernameFromAuthorUrl(data.author_url)}`,
    },
    cacheTtlSeconds: data.cache_age
      ? Number.parseInt(data.cache_age, 10)
      : undefined,
    canonicalUrl: data.url,
  };

  const now = Date.now();
  const apiTtl = value.cacheTtlSeconds ? value.cacheTtlSeconds * 1000 : 0;
  const ttlMs = Math.min(
    Math.max(apiTtl || MIN_TTL_MS, MIN_TTL_MS),
    MAX_TTL_MS,
  );

  cache.set(id, {
    value,
    expires: now + ttlMs,
    swrExpires: now + ttlMs + SWR_MS,
  });
  return value;
}

/* ---------- Public API ---------- */
export async function getPublicTweet(urlOrId: string): Promise<PublicTweet> {
  const id = extractId(urlOrId);
  const now = Date.now();

  // Fast LRU hit
  const c = cache.get(id);
  if (c && c.expires > now) return c.value;

  // Serve stale while revalidating
  if (c && c.swrExpires > now) {
    // Kick off background refresh if not already running
    if (!inflight.has(id)) void refresh(id, urlOrId);
    return c.value;
  }

  // Dedup multiple concurrent requests
  const existing = inflight.get(id);
  if (existing) return existing;

  const p = refresh(id, urlOrId).finally(() => inflight.delete(id));
  inflight.set(id, p);
  return p;
}
