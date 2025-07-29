import Bottleneck from 'bottleneck';
import LruCache from 'mnemonist/lru-cache';
import { decode as decodeEntities } from 'entities';
import { z } from 'zod';

/* ---------- Types & schema ---------- */
const OEmbed = z.object({
  html: z.string(),
  author_name: z.string().optional(),
  author_url: z.string().optional(),
  cache_age: z.string().optional(),
  url: z.string().optional(),
});

export type PublicPost = {
  text: string;
  rawHtml: string;
  author?: { name?: string; url?: string };
  cacheTtlSeconds?: number;
  canonicalUrl?: string;
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
type CacheEntry = { value: PublicPost; expires: number; swrExpires: number };
const cache = new LruCache<string, CacheEntry>(CACHE_CAPACITY);

// Coalesce concurrent fetches for the same ID
const inflight = new Map<string, Promise<PublicPost>>();

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

async function refresh(id: string, urlOrId: string): Promise<PublicPost> {
  const postUrl = toPostUrl(urlOrId);
  const data = await fetchOEmbed(postUrl);

  const value: PublicPost = {
    text: extractTextFromOEmbedHtml(data.html),
    rawHtml: data.html,
    author: { name: data.author_name, url: data.author_url },
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
export async function getPublicTweet(urlOrId: string): Promise<PublicPost> {
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
