/**
 * Build the Pagefind search index from the content submodule.
 *
 * The resources app is a standard (non-`output: export`) Next.js build, so there
 * is no flat directory of rendered HTML for Pagefind to crawl. Instead we feed
 * Pagefind directly via its Node Indexing API, reading the same Markdown/MDX the
 * site renders out of `data/content` and emitting one record per page into
 * `public/pagefind/`. Next then serves that directory statically under the app's
 * `/r` basePath (`/r/pagefind/...`), and the client `SearchBar` loads it at
 * runtime.
 *
 * Design notes:
 * - Multilingual: each record is tagged with its `language`, so Pagefind builds
 *   one sub-index per locale and the browser auto-selects the index matching the
 *   page's `<html lang>` — which is exactly the cookie-mode locale. No mixed-
 *   language results.
 * - Fallback parity: the site shows the English source when a translation is
 *   missing, so for every locale we index the union of slugs, resolving each to
 *   the native file when present and falling back to English otherwise. This
 *   keeps non-English search coverage in step with what visitors actually see.
 * - Drafts are excluded (they are not rendered in production).
 *
 * Run via `bun run index:search` (wired into `prebuild`/`predev`).
 */

// biome-ignore lint/correctness/noNodejsModules: build-time Node script.
import fs from 'node:fs';
// biome-ignore lint/correctness/noNodejsModules: build-time Node script.
import path from 'node:path';
import matter from 'gray-matter';
import * as pagefind from 'pagefind';

// Kept in sync with src/i18n-config.ts. This script runs outside the Next module
// graph (plain Bun/Node), so it can't import the `@/` alias; the locale list is
// small and stable enough to mirror here.
const LOCALES = ['en', 'es', 'de', 'fr', 'zh', 'ar', 'hi'] as const;
const DEFAULT_LOCALE = 'en';
type Locale = (typeof LOCALES)[number];

// `dir` is the folder under data/content; `segment` is the URL path segment.
// They happen to match today but are kept distinct so a future rename of either
// side doesn't silently break URLs.
const COLLECTIONS = [
  { dir: 'blog', segment: 'blog' },
  { dir: 'tld', segment: 'tld' },
  { dir: 'glossary', segment: 'glossary' },
  { dir: 'partners', segment: 'partners' },
  { dir: 'careers', segment: 'careers' },
] as const;

const DATA_ROOT = path.join(process.cwd(), 'data', 'content');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'pagefind');
const MARKDOWN_EXTENSION = /\.(md|mdx)$/;
const EXTENSIONS = ['.mdx', '.md'] as const;

function listSlugs(collectionDir: string, locale: Locale): string[] {
  const dir = path.join(DATA_ROOT, collectionDir, locale);
  try {
    return fs
      .readdirSync(dir)
      .filter((name) => MARKDOWN_EXTENSION.test(name))
      .map((name) => name.replace(MARKDOWN_EXTENSION, ''));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

function resolveFile(
  collectionDir: string,
  locale: Locale,
  slug: string,
): string | undefined {
  for (const extension of EXTENSIONS) {
    const candidate = path.join(
      DATA_ROOT,
      collectionDir,
      locale,
      `${slug}${extension}`,
    );
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

function isDraft(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

// Reduce Markdown/MDX to the plain prose Pagefind should tokenize. This is a
// best-effort strip — Pagefind only needs searchable words and a clean excerpt,
// not faithful rendering — so we drop code, imports, JSX/HTML, media and the
// usual inline punctuation rather than fully parsing the AST.
function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/^\s*import\s.+$/gm, ' ') // MDX import statements
    .replace(/^\s*export\s.+$/gm, ' ') // MDX export statements
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links -> link text
    .replace(/<[^>]+>/g, ' ') // JSX / HTML tags
    .replace(/^[\s>#*+-]+/gm, ' ') // leading blockquote/heading/list markers
    .replace(/[*_~`|]/g, ' ') // inline emphasis / table pipes
    .replace(/\s+/g, ' ')
    .trim();
}

async function main(): Promise<void> {
  // A clean rebuild every run keeps the index in lockstep with the content and
  // avoids stale records lingering from a previous build.
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });

  const { index } = await pagefind.createIndex({});
  if (!index) {
    throw new Error('Pagefind failed to create an index.');
  }

  let recordCount = 0;
  const perLocale: Record<string, number> = {};

  for (const collection of COLLECTIONS) {
    // Union of every slug that exists in any locale, so fallback-only pages are
    // searchable under each locale just as they are browsable.
    const slugs = new Set<string>();
    for (const locale of LOCALES) {
      for (const slug of listSlugs(collection.dir, locale)) {
        slugs.add(slug);
      }
    }

    for (const locale of LOCALES) {
      for (const slug of slugs) {
        const file =
          resolveFile(collection.dir, locale, slug) ??
          resolveFile(collection.dir, DEFAULT_LOCALE, slug);
        if (!file) continue;

        const { data, content } = matter(fs.readFileSync(file, 'utf8'));
        if (isDraft(data.draft)) continue;

        const title = firstString(data.title) ?? slug;
        const description = firstString(data.summary, data.description);
        const body = toPlainText(content);

        const filters: Record<string, string[]> = {
          type: [collection.segment],
        };
        if (typeof data.cluster === 'string') filters.cluster = [data.cluster];
        if (typeof data.series === 'string') filters.series = [data.series];

        await index.addCustomRecord({
          // In-app path (no `/r` basePath) — the client renders it through a
          // Next <Link>, which prepends the basePath and keeps navigation on the
          // SPA router.
          url: `/${locale}/${collection.segment}/${slug}`,
          content: [title, description, body].filter(Boolean).join('. '),
          language: locale,
          meta: {
            title,
            type: collection.segment,
            ...(description ? { excerpt: description } : {}),
          },
          filters,
        });

        recordCount += 1;
        perLocale[locale] = (perLocale[locale] ?? 0) + 1;
      }
    }
  }

  await index.writeFiles({ outputPath: OUTPUT_DIR });
  await pagefind.close();

  const localeSummary = LOCALES.map((l) => `${l}:${perLocale[l] ?? 0}`).join(
    ' ',
  );
  console.log(
    `Pagefind: indexed ${recordCount} records (${localeSummary}) -> ${path.relative(process.cwd(), OUTPUT_DIR)}`,
  );
}

main().catch((error) => {
  console.error('Failed to build Pagefind index:', error);
  process.exit(1);
});
