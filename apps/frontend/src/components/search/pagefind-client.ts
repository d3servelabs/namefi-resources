'use client';

/**
 * Cross-app Pagefind client for OmniSearch.
 *
 * The resources app (namefi.io/r) builds a static Pagefind index at
 * `/r/pagefind/`. The frontend reaches it same-origin because next.config.mjs
 * rewrites `/r/:path*` to the resources origin, so we can dynamically import the
 * generated bundle and query it from here without a backend or CORS.
 *
 * Stored result URLs are in-app paths (`/{locale}/{collection}/{slug}` with no
 * `/r`). From the frontend (which has no `/r` basePath) we must prepend `/r` so
 * navigation lands on the proxied resources route — see `RESULT_BASE` below.
 */

type PagefindDocMeta = { title?: string; type?: string; excerpt?: string };
type PagefindDoc = { url: string; meta: PagefindDocMeta; excerpt: string };
type PagefindSearchResult = { id: string; data: () => Promise<PagefindDoc> };
type PagefindApi = {
  init?: () => Promise<void>;
  options?: (options: Record<string, unknown>) => Promise<void>;
  search: (term: string) => Promise<{ results: PagefindSearchResult[] } | null>;
};

export type ResourceHit = {
  id: string;
  /** Full frontend href, e.g. `/r/en/blog/what-is-dnssec`. */
  href: string;
  title: string;
  /** Collection segment: `blog` | `tld` | `glossary` | `partners` | `careers`. */
  type: string;
  /** Pagefind excerpt HTML (contains `<mark>` around matched terms). */
  excerptHtml: string;
};

/** Resources app basePath the frontend proxies; prepended to stored URLs. */
const RESULT_BASE = '/r';
const MAX_RESULTS = 5;
const MIN_QUERY_LENGTH = 2;

/**
 * Languages the resources Pagefind index actually contains — the
 * `apps/resources` i18n locales (each record is tagged `language: <locale>`).
 * The frontend ships more/other locale tags (`ar-EG`, `ja`, `ta`), so map to
 * one of these before searching or Pagefind picks the wrong (or no) sub-index.
 */
const RESOURCES_LANGUAGES = new Set(['en', 'es', 'de', 'fr', 'zh', 'ar', 'hi']);

/** Map a frontend locale to the resources index language, falling back to `en`. */
export function toResourcesLanguage(locale: string): string {
  if (locale === 'ar-EG') return 'ar';
  const primary = locale.split('-')[0] ?? 'en';
  return RESOURCES_LANGUAGES.has(primary) ? primary : 'en';
}

let pagefindPromise: Promise<PagefindApi> | null = null;

function loadPagefind(): Promise<PagefindApi> {
  if (!pagefindPromise) {
    // Built statically by the resources app at /r/pagefind and resolved at
    // runtime, never bundled. The ignore comments cover every bundler this file
    // passes through: webpack + turbopack (Next app build) and Vite/Rollup
    // (Storybook). A variable specifier keeps Rollup from statically resolving
    // the runtime-only path at build time.
    const pagefindUrl = '/r/pagefind/pagefind.js';
    pagefindPromise = import(
      /* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ pagefindUrl
    ).then(async (mod: PagefindApi) => {
      // The index stores in-app paths; pin baseUrl to '/' so Pagefind does not
      // prepend its own `/r/pagefind` location to result URLs (we add `/r`).
      await mod.options?.({ baseUrl: '/' });
      await mod.init?.();
      return mod;
    });
    // Never cache a rejected promise: a transient failure (index mid-deploy,
    // network blip) would otherwise wedge search until reload. Clearing it lets
    // the next keystroke retry.
    pagefindPromise.catch(() => {
      pagefindPromise = null;
    });
  }
  return pagefindPromise;
}

/**
 * Search the resources Pagefind index. Returns [] on any failure or a too-short
 * query (degrades gracefully when `/r` is unavailable).
 */
export async function searchResources(
  query: string,
  language?: string,
): Promise<ResourceHit[]> {
  const term = query.trim();
  if (term.length < MIN_QUERY_LENGTH) return [];

  const pagefind = await loadPagefind();
  // Pin the language sub-index to the resources index's own tag instead of
  // letting Pagefind auto-detect from the frontend's `document.lang` (which can
  // be `ar-EG`/`ja`/`ta` — not in the index).
  if (language) await pagefind.options?.({ language });
  const response = await pagefind.search(term);
  const docs = await Promise.all(
    (response?.results ?? [])
      .slice(0, MAX_RESULTS)
      .map((result) => result.data()),
  );

  return docs.map((doc) => ({
    // `doc.url` is unique per indexed page, so it is a stable React key that
    // survives re-ordering as the query narrows (an array index would not).
    id: `resource:${doc.url}`,
    // Stored URLs carry no `/r` prefix, but guard against an index ever built
    // with the `/r` basePath baked in so we never emit `/r/r/...`.
    href: doc.url.startsWith(`${RESULT_BASE}/`)
      ? doc.url
      : `${RESULT_BASE}${doc.url}`,
    // `meta` is typed as present, but real Pagefind payloads can omit it for a
    // page with no frontmatter — optional-chain so one such doc can't reject
    // the whole Promise.all and empty the entire resources group.
    title: doc.meta?.title ?? doc.url,
    type: doc.meta?.type ?? '',
    excerptHtml: doc.excerpt ?? '',
  }));
}
