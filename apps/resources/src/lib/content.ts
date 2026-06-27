import 'server-only';
// biome-ignore lint/correctness/noNodejsModules: server-side content helpers rely on Node file system APIs.
import fs from 'node:fs';
// biome-ignore lint/correctness/noNodejsModules: server-side content helpers rely on Node path utilities.
import path from 'node:path';
import matter from 'gray-matter';
import { cache } from 'react';
import { i18n, type Locale } from '@/i18n-config';
import { slugify } from '@/lib/slugify';
import {
  CLUSTER_SLUGS,
  CONTENT_FORMATS,
  type ClusterSlug,
  type ContentFormat,
  isClusterSlug,
  isContentFormat,
  isSeriesSlug,
  SERIES_SLUGS,
  type SeriesSlug,
} from '@/lib/taxonomy';

type Collection =
  | 'blog'
  | 'authors'
  | 'tld'
  | 'partners'
  | 'glossary'
  | 'careers';

type PostFrontmatter = {
  title: string;
  summary?: string;
  tags: string[];
  authors: string[];
  date: string;
  // ISO date of the most recent revision, when a post has been updated after
  // its original publication. Surfaced as a "Last updated" line on the post page.
  updated?: string;
  // Canonical URL of the original publication (e.g. a HackMD note). Surfaced as
  // an "Originally on <domain>" link on the post page.
  originalUrl?: string;
  draft: boolean;
  language: Locale;
  // --- Topic-cluster / series information architecture (additive). ---
  // See lib/taxonomy.ts for the controlled vocabularies. These are optional so
  // existing posts parse unchanged; they are surfaced through new hub pages
  // (/topics, /series) and cross-links, never by moving a post's URL.
  //
  // Primary topic cluster; drives the post's breadcrumb and pillar membership.
  cluster?: ClusterSlug;
  // Editorial series this post is an episode of, if any.
  series?: SeriesSlug;
  // 1-based position within `series` (required when `series` is set).
  seriesOrder?: number;
  // Article type (guide/faq/comparison/...), separated from topical `tags`.
  format?: ContentFormat;
};

type PostEntry = {
  slug: string;
  frontmatter: PostFrontmatter;
  sourceLanguage: Locale;
  requestedLanguage: Locale;
  relativePath: string;
  publishedAt: Date;
};

type AuthorFrontmatter = {
  name: string;
  avatar?: string;
  occupation?: string;
  company?: string;
  twitter?: string;
  linkedin?: string;
  language: Locale;
};

type AuthorEntry = {
  slug: string;
  frontmatter: AuthorFrontmatter;
  sourceLanguage: Locale;
  requestedLanguage: Locale;
  relativePath: string;
};

// A single FAQ entry. Sourced from the `faqs` frontmatter array, surfaced both
// as the visible "Frequently asked questions" section and as FAQPage JSON-LD.
export type TldFaq = {
  question: string;
  answer: string;
};

type TldFrontmatter = {
  title: string;
  summary?: string;
  description?: string;
  tags: string[];
  authors: string[];
  date: string;
  draft: boolean;
  language: Locale;
  keywords: string[];
  faqs: TldFaq[];
  // When true, a non-English variant declares ITSELF as canonical instead of
  // deferring to the English page. Set on topic-relevant pages written natively
  // for a market (e.g. a Spanish .abogado page) so they rank in their own
  // language rather than consolidating ranking onto English.
  selfCanonical: boolean;
};

type TldEntry = {
  slug: string;
  frontmatter: TldFrontmatter;
  sourceLanguage: Locale;
  requestedLanguage: Locale;
  relativePath: string;
  publishedAt: Date;
};

type PartnerFrontmatter = {
  title: string;
  summary?: string;
  description?: string;
  tags: string[];
  authors: string[];
  date: string;
  draft: boolean;
  language: Locale;
  keywords: string[];
};

type PartnerEntry = {
  slug: string;
  frontmatter: PartnerFrontmatter;
  sourceLanguage: Locale;
  requestedLanguage: Locale;
  relativePath: string;
  publishedAt: Date;
};

type GlossaryFrontmatter = {
  title: string;
  summary?: string;
  description?: string;
  tags: string[];
  authors: string[];
  date: string;
  draft: boolean;
  language: Locale;
  keywords: string[];
};

type GlossaryEntry = {
  slug: string;
  frontmatter: GlossaryFrontmatter;
  sourceLanguage: Locale;
  requestedLanguage: Locale;
  relativePath: string;
  publishedAt: Date;
};

type CareerFrontmatter = {
  title: string;
  summary?: string;
  description?: string;
  tags: string[];
  authors: string[];
  date: string;
  draft: boolean;
  language: Locale;
  type: 'job' | 'page';
  employmentType?: string;
  validThrough?: string;
  team?: string;
  location?: string;
  compensation?: string;
};

type CareerEntry = {
  slug: string;
  frontmatter: CareerFrontmatter;
  sourceLanguage: Locale;
  requestedLanguage: Locale;
  relativePath: string;
  publishedAt: Date;
  // Raw markdown body (frontmatter stripped). Used to build the full,
  // HTML-formatted JobPosting `description` that Google requires to match the
  // visible page content.
  body: string;
};

// Content lives inside the data submodule under /data/content.
const DATA_ROOT = path.join(process.cwd(), 'data', 'content');
const BLOG_ROOT = path.join(DATA_ROOT, 'blog');
const AUTHOR_ROOT = path.join(DATA_ROOT, 'authors');
const TLD_ROOT = path.join(DATA_ROOT, 'tld');
const PARTNER_ROOT = path.join(DATA_ROOT, 'partners');
const GLOSSARY_ROOT = path.join(DATA_ROOT, 'glossary');
const CAREER_ROOT = path.join(DATA_ROOT, 'careers');

const postDirectoryCache = new Map<string, string[]>();
const authorDirectoryCache = new Map<string, string[]>();
const tldDirectoryCache = new Map<string, string[]>();
const partnerDirectoryCache = new Map<string, string[]>();
const glossaryDirectoryCache = new Map<string, string[]>();
const careerDirectoryCache = new Map<string, string[]>();

const postEntryCache = new Map<string, PostEntry | undefined>();
const authorEntryCache = new Map<string, AuthorEntry | undefined>();
const tldEntryCache = new Map<string, TldEntry | undefined>();
const partnerEntryCache = new Map<string, PartnerEntry | undefined>();
const glossaryEntryCache = new Map<string, GlossaryEntry | undefined>();
const careerEntryCache = new Map<string, CareerEntry | undefined>();

const isProduction = process.env.NODE_ENV === 'production';
const MARKDOWN_EXTENSION = /\.(md|mdx)$/;
const POST_EXTENSIONS: readonly string[] = ['.mdx', '.md'];

function getCacheForCollection(collection: Collection) {
  switch (collection) {
    case 'blog':
      return postDirectoryCache;
    case 'authors':
      return authorDirectoryCache;
    case 'tld':
      return tldDirectoryCache;
    case 'partners':
      return partnerDirectoryCache;
    case 'glossary':
      return glossaryDirectoryCache;
    case 'careers':
      return careerDirectoryCache;
    default:
      return postDirectoryCache;
  }
}

function getRootForCollection(collection: Collection) {
  switch (collection) {
    case 'blog':
      return BLOG_ROOT;
    case 'authors':
      return AUTHOR_ROOT;
    case 'tld':
      return TLD_ROOT;
    case 'partners':
      return PARTNER_ROOT;
    case 'glossary':
      return GLOSSARY_ROOT;
    case 'careers':
      return CAREER_ROOT;
    default:
      return BLOG_ROOT;
  }
}

function toRelativeDataPath(filePath: string): string {
  const relative = path.relative(DATA_ROOT, filePath);
  return relative.split(path.sep).join('/');
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
}

// Parses the `faqs` frontmatter array, keeping only entries that have both a
// non-empty question and answer. Returns [] for missing/malformed input so the
// FAQ section and FAQPage JSON-LD simply don't render when absent.
function toFaqs(value: unknown): TldFaq[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null;
      const { question, answer } = item as Record<string, unknown>;
      if (typeof question !== 'string' || typeof answer !== 'string') {
        return null;
      }
      const trimmedQuestion = question.trim();
      const trimmedAnswer = answer.trim();
      if (trimmedQuestion.length === 0 || trimmedAnswer.length === 0) {
        return null;
      }
      return { question: trimmedQuestion, answer: trimmedAnswer };
    })
    .filter((faq): faq is TldFaq => faq !== null);
}

function getDirectoryKey(collection: Collection, locale: Locale) {
  return `${collection}:${locale}`;
}

function listSlugs(collection: Collection, locale: Locale): string[] {
  const cache = getCacheForCollection(collection);
  const key = getDirectoryKey(collection, locale);

  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const dir = path.join(getRootForCollection(collection), locale);

  let entries: string[] = [];
  try {
    entries = fs.readdirSync(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  const slugs = entries
    .filter((name) => MARKDOWN_EXTENSION.test(name))
    .map((name) => name.replace(MARKDOWN_EXTENSION, ''));

  cache.set(key, slugs);
  return slugs;
}

type PostTaxonomyFields = Pick<
  PostFrontmatter,
  'cluster' | 'series' | 'seriesOrder' | 'format'
>;

/**
 * Parse the optional topic-cluster / series frontmatter fields. Each is
 * optional, but when present it must be a known value from the controlled
 * vocabulary (lib/taxonomy.ts), so a typo fails the build rather than silently
 * dropping a post out of its hub or series.
 */
function parsePostTaxonomyFields(
  data: Record<string, unknown>,
  slug: string,
): PostTaxonomyFields {
  const cluster = isClusterSlug(data.cluster) ? data.cluster : undefined;
  if (data.cluster !== undefined && cluster === undefined) {
    throw new Error(
      `Post "${slug}" has an unknown "cluster": ${JSON.stringify(data.cluster)}. Expected one of: ${CLUSTER_SLUGS.join(', ')}.`,
    );
  }

  const series = isSeriesSlug(data.series) ? data.series : undefined;
  if (data.series !== undefined && series === undefined) {
    throw new Error(
      `Post "${slug}" has an unknown "series": ${JSON.stringify(data.series)}. Expected one of: ${SERIES_SLUGS.join(', ')}.`,
    );
  }

  // `seriesOrder` is the 1-based episode position within `series`, so it must be
  // a positive integer. Distinguish "present but invalid" (wrong type/range)
  // from "absent" so a build failure points at the real fix — mirroring how the
  // cluster/series/format checks above report unknown values.
  const seriesOrderProvided = data.seriesOrder !== undefined;
  const seriesOrder =
    typeof data.seriesOrder === 'number' &&
    Number.isInteger(data.seriesOrder) &&
    data.seriesOrder >= 1
      ? data.seriesOrder
      : undefined;
  if (seriesOrderProvided && seriesOrder === undefined) {
    throw new Error(
      `Post "${slug}" has an invalid "seriesOrder": ${JSON.stringify(data.seriesOrder)}. Expected a positive integer (1-based position within the series).`,
    );
  }
  if (series !== undefined && seriesOrder === undefined) {
    throw new Error(
      `Post "${slug}" is in series "${series}" but is missing a numeric "seriesOrder".`,
    );
  }

  const format = isContentFormat(data.format) ? data.format : undefined;
  if (data.format !== undefined && format === undefined) {
    throw new Error(
      `Post "${slug}" has an unknown "format": ${JSON.stringify(data.format)}. Expected one of: ${CONTENT_FORMATS.join(', ')}.`,
    );
  }

  return { cluster, series, seriesOrder, format };
}

function normalisePostFrontmatter(
  data: Record<string, unknown>,
  slug: string,
  sourceLanguage: Locale,
): PostFrontmatter {
  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    throw new Error(`Post "${slug}" is missing a valid "title" field.`);
  }

  const rawDate =
    typeof data.date === 'string'
      ? data.date
      : data.date instanceof Date
        ? data.date.toISOString()
        : undefined;

  if (!rawDate) {
    throw new Error(`Post "${slug}" is missing a valid "date" field.`);
  }

  const tags = toStringArray(data.tags);
  const authors = toStringArray(data.authors);

  const language = sourceLanguage;
  const summaryFromDescription =
    typeof data.description === 'string' && data.description.trim().length > 0
      ? data.description.trim()
      : undefined;
  const summary =
    typeof data.summary === 'string' && data.summary.trim().length > 0
      ? data.summary.trim()
      : summaryFromDescription;
  const draftValue = toBoolean(data.draft);

  const updated =
    typeof data.updated === 'string'
      ? data.updated
      : data.updated instanceof Date
        ? data.updated.toISOString()
        : undefined;
  const originalUrl =
    typeof data.originalUrl === 'string' && data.originalUrl.trim().length > 0
      ? data.originalUrl.trim()
      : undefined;

  const taxonomy = parsePostTaxonomyFields(data, slug);

  return {
    title: data.title,
    summary,
    tags,
    authors,
    date: rawDate,
    updated,
    originalUrl,
    draft: draftValue,
    language,
    ...taxonomy,
  };
}

function normaliseAuthorFrontmatter(
  data: Record<string, unknown>,
  slug: string,
  sourceLanguage: Locale,
): AuthorFrontmatter {
  if (typeof data.name !== 'string' || data.name.trim().length === 0) {
    throw new Error(`Author "${slug}" is missing a valid "name" field.`);
  }

  const language = sourceLanguage;

  return {
    name: data.name,
    avatar:
      typeof data.avatar === 'string' && data.avatar.trim().length > 0
        ? data.avatar.trim()
        : undefined,
    occupation:
      typeof data.occupation === 'string' && data.occupation.trim().length > 0
        ? data.occupation.trim()
        : undefined,
    company:
      typeof data.company === 'string' && data.company.trim().length > 0
        ? data.company.trim()
        : undefined,
    twitter:
      typeof data.twitter === 'string' && data.twitter.trim().length > 0
        ? data.twitter.trim()
        : undefined,
    linkedin:
      typeof data.linkedin === 'string' && data.linkedin.trim().length > 0
        ? data.linkedin.trim()
        : undefined,
    language,
  };
}

function normaliseTldFrontmatter(
  data: Record<string, unknown>,
  slug: string,
  sourceLanguage: Locale,
): TldFrontmatter {
  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    throw new Error(`TLD "${slug}" is missing a valid "title" field.`);
  }

  const rawDate =
    typeof data.date === 'string'
      ? data.date
      : data.date instanceof Date
        ? data.date.toISOString()
        : undefined;

  if (!rawDate) {
    throw new Error(`TLD "${slug}" is missing a valid "date" field.`);
  }

  const tags = toStringArray(data.tags);
  const authors = toStringArray(data.authors);
  const keywords = toStringArray(data.keywords);
  const faqs = toFaqs(data.faqs);

  const language = sourceLanguage;
  const description =
    typeof data.description === 'string' && data.description.trim().length > 0
      ? data.description.trim()
      : undefined;
  const summary =
    typeof data.summary === 'string' && data.summary.trim().length > 0
      ? data.summary.trim()
      : description;
  const draftValue = toBoolean(data.draft);

  return {
    title: data.title,
    summary,
    description,
    tags,
    authors,
    date: rawDate,
    draft: draftValue,
    language,
    keywords,
    faqs,
    selfCanonical: toBoolean(data.selfCanonical),
  };
}

function normalisePartnerFrontmatter(
  data: Record<string, unknown>,
  slug: string,
  sourceLanguage: Locale,
): PartnerFrontmatter {
  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    throw new Error(`Partner "${slug}" is missing a valid "title" field.`);
  }

  const rawDate =
    typeof data.date === 'string'
      ? data.date
      : data.date instanceof Date
        ? data.date.toISOString()
        : undefined;

  if (!rawDate) {
    throw new Error(`Partner "${slug}" is missing a valid "date" field.`);
  }

  const tags = toStringArray(data.tags);
  const authors = toStringArray(data.authors);
  const keywords = toStringArray(data.keywords);

  const language = sourceLanguage;
  const description =
    typeof data.description === 'string' && data.description.trim().length > 0
      ? data.description.trim()
      : undefined;
  const summary =
    typeof data.summary === 'string' && data.summary.trim().length > 0
      ? data.summary.trim()
      : description;
  const draftValue = toBoolean(data.draft);

  return {
    title: data.title,
    summary,
    description,
    tags,
    authors,
    date: rawDate,
    draft: draftValue,
    language,
    keywords,
  };
}

function normaliseGlossaryFrontmatter(
  data: Record<string, unknown>,
  slug: string,
  sourceLanguage: Locale,
): GlossaryFrontmatter {
  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    throw new Error(
      `Glossary term "${slug}" is missing a valid "title" field.`,
    );
  }

  const rawDate =
    typeof data.date === 'string'
      ? data.date
      : data.date instanceof Date
        ? data.date.toISOString()
        : undefined;

  if (!rawDate) {
    throw new Error(`Glossary term "${slug}" is missing a valid "date" field.`);
  }

  const tags = toStringArray(data.tags);
  const authors = toStringArray(data.authors);
  const keywords = toStringArray(data.keywords);

  const language = sourceLanguage;
  const description =
    typeof data.description === 'string' && data.description.trim().length > 0
      ? data.description.trim()
      : undefined;
  const summary =
    typeof data.summary === 'string' && data.summary.trim().length > 0
      ? data.summary.trim()
      : description;
  const draftValue = toBoolean(data.draft);

  return {
    title: data.title,
    summary,
    description,
    tags,
    authors,
    date: rawDate,
    draft: draftValue,
    language,
    keywords,
  };
}

function resolvePostFilePath(locale: Locale, slug: string): string | undefined {
  for (const extension of POST_EXTENSIONS) {
    const candidate = path.join(BLOG_ROOT, locale, `${slug}${extension}`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function parsePostEntry({
  slug,
  locale,
  filePath,
}: {
  slug: string;
  locale: Locale;
  filePath: string;
}): PostEntry {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(fileContents);
  const frontmatter = normalisePostFrontmatter(parsed.data, slug, locale);
  const publishedAt = new Date(frontmatter.date);

  if (Number.isNaN(publishedAt.getTime())) {
    throw new Error(
      `Post "${slug}" has an invalid "date": ${frontmatter.date}`,
    );
  }

  return {
    slug,
    frontmatter,
    sourceLanguage: locale,
    requestedLanguage: locale,
    relativePath: toRelativeDataPath(filePath),
    publishedAt,
  };
}

function resolveTldFilePath(locale: Locale, slug: string): string | undefined {
  for (const extension of POST_EXTENSIONS) {
    const candidate = path.join(TLD_ROOT, locale, `${slug}${extension}`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function parseTldEntry({
  slug,
  locale,
  filePath,
}: {
  slug: string;
  locale: Locale;
  filePath: string;
}): TldEntry {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(fileContents);
  const frontmatter = normaliseTldFrontmatter(parsed.data, slug, locale);
  const publishedAt = new Date(frontmatter.date);

  if (Number.isNaN(publishedAt.getTime())) {
    throw new Error(`TLD "${slug}" has an invalid "date": ${frontmatter.date}`);
  }

  return {
    slug,
    frontmatter,
    sourceLanguage: locale,
    requestedLanguage: locale,
    relativePath: toRelativeDataPath(filePath),
    publishedAt,
  };
}

function resolvePartnerFilePath(
  locale: Locale,
  slug: string,
): string | undefined {
  for (const extension of POST_EXTENSIONS) {
    const candidate = path.join(PARTNER_ROOT, locale, `${slug}${extension}`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function parsePartnerEntry({
  slug,
  locale,
  filePath,
}: {
  slug: string;
  locale: Locale;
  filePath: string;
}): PartnerEntry {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(fileContents);
  const frontmatter = normalisePartnerFrontmatter(parsed.data, slug, locale);
  const publishedAt = new Date(frontmatter.date);

  if (Number.isNaN(publishedAt.getTime())) {
    throw new Error(
      `Partner "${slug}" has an invalid "date": ${frontmatter.date}`,
    );
  }

  return {
    slug,
    frontmatter,
    sourceLanguage: locale,
    requestedLanguage: locale,
    relativePath: toRelativeDataPath(filePath),
    publishedAt,
  };
}

function parseAuthorEntry({
  slug,
  locale,
  filePath,
}: {
  slug: string;
  locale: Locale;
  filePath: string;
}): AuthorEntry {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(fileContents);
  const frontmatter = normaliseAuthorFrontmatter(parsed.data, slug, locale);

  return {
    slug,
    frontmatter,
    sourceLanguage: locale,
    requestedLanguage: locale,
    relativePath: toRelativeDataPath(filePath),
  };
}

function resolveGlossaryFilePath(
  locale: Locale,
  slug: string,
): string | undefined {
  for (const extension of POST_EXTENSIONS) {
    const candidate = path.join(GLOSSARY_ROOT, locale, `${slug}${extension}`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function parseGlossaryEntry({
  slug,
  locale,
  filePath,
}: {
  slug: string;
  locale: Locale;
  filePath: string;
}): GlossaryEntry {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(fileContents);
  const frontmatter = normaliseGlossaryFrontmatter(parsed.data, slug, locale);
  const publishedAt = new Date(frontmatter.date);

  if (Number.isNaN(publishedAt.getTime())) {
    throw new Error(
      `Glossary term "${slug}" has an invalid "date": ${frontmatter.date}`,
    );
  }

  return {
    slug,
    frontmatter,
    sourceLanguage: locale,
    requestedLanguage: locale,
    relativePath: toRelativeDataPath(filePath),
    publishedAt,
  };
}

// Topic-cluster / series taxonomy (cluster/series/seriesOrder/format) is
// language-independent and is authored only on the English source post. A
// translated post that exists as its own file would otherwise parse with these
// unset and silently drop out of its hub/series, so when a translation declares
// no taxonomy of its own, inherit the full set from the English entry — keeping
// a single source of truth while letting a translation override wholesale if it
// ever does set its own.
function inheritTaxonomyFromDefaultLocale(
  entry: PostEntry,
  slug: string,
): PostEntry {
  if (entry.sourceLanguage === i18n.defaultLocale) return entry;
  const { cluster, series, seriesOrder, format } = entry.frontmatter;
  if (
    cluster !== undefined ||
    series !== undefined ||
    seriesOrder !== undefined ||
    format !== undefined
  ) {
    return entry;
  }
  const source = loadPostEntry(i18n.defaultLocale, slug);
  if (!source) return entry;
  return {
    ...entry,
    frontmatter: {
      ...entry.frontmatter,
      cluster: source.frontmatter.cluster,
      series: source.frontmatter.series,
      seriesOrder: source.frontmatter.seriesOrder,
      format: source.frontmatter.format,
    },
  };
}

function loadPostEntry(locale: Locale, slug: string): PostEntry | undefined {
  const cacheKey = `${locale}:${slug}`;
  if (postEntryCache.has(cacheKey)) {
    return postEntryCache.get(cacheKey);
  }

  const filePath = resolvePostFilePath(locale, slug);
  if (filePath) {
    const entry = inheritTaxonomyFromDefaultLocale(
      parsePostEntry({ slug, locale, filePath }),
      slug,
    );
    postEntryCache.set(cacheKey, entry);
    return entry;
  }

  if (locale !== i18n.defaultLocale) {
    const fallback = loadPostEntry(i18n.defaultLocale, slug);
    if (fallback) {
      const derived: PostEntry = {
        ...fallback,
        requestedLanguage: locale,
      };
      postEntryCache.set(cacheKey, derived);
      return derived;
    }
  }

  postEntryCache.set(cacheKey, undefined);
  return undefined;
}

function loadAuthorEntry(
  locale: Locale,
  slug: string,
): AuthorEntry | undefined {
  const cacheKey = `${locale}:${slug}`;
  if (authorEntryCache.has(cacheKey)) {
    return authorEntryCache.get(cacheKey);
  }

  const filePath = path.join(AUTHOR_ROOT, locale, `${slug}.mdx`);
  if (fs.existsSync(filePath)) {
    const entry = parseAuthorEntry({ slug, locale, filePath });
    authorEntryCache.set(cacheKey, entry);
    return entry;
  }

  if (locale !== i18n.defaultLocale) {
    const fallback = loadAuthorEntry(i18n.defaultLocale, slug);
    if (fallback) {
      const derived: AuthorEntry = {
        ...fallback,
        requestedLanguage: locale,
      };
      authorEntryCache.set(cacheKey, derived);
      return derived;
    }
  }

  authorEntryCache.set(cacheKey, undefined);
  return undefined;
}

function loadTldEntry(locale: Locale, slug: string): TldEntry | undefined {
  const cacheKey = `${locale}:${slug}`;
  if (tldEntryCache.has(cacheKey)) {
    return tldEntryCache.get(cacheKey);
  }

  const filePath = resolveTldFilePath(locale, slug);
  if (filePath) {
    const entry = parseTldEntry({ slug, locale, filePath });
    tldEntryCache.set(cacheKey, entry);
    return entry;
  }

  if (locale !== i18n.defaultLocale) {
    const fallback = loadTldEntry(i18n.defaultLocale, slug);
    if (fallback) {
      const derived: TldEntry = {
        ...fallback,
        requestedLanguage: locale,
      };
      tldEntryCache.set(cacheKey, derived);
      return derived;
    }
  }

  tldEntryCache.set(cacheKey, undefined);
  return undefined;
}

function loadPartnerEntry(
  locale: Locale,
  slug: string,
): PartnerEntry | undefined {
  const cacheKey = `${locale}:${slug}`;
  if (partnerEntryCache.has(cacheKey)) {
    return partnerEntryCache.get(cacheKey);
  }

  const filePath = resolvePartnerFilePath(locale, slug);
  if (filePath) {
    const entry = parsePartnerEntry({ slug, locale, filePath });
    partnerEntryCache.set(cacheKey, entry);
    return entry;
  }

  if (locale !== i18n.defaultLocale) {
    const fallback = loadPartnerEntry(i18n.defaultLocale, slug);
    if (fallback) {
      const derived: PartnerEntry = {
        ...fallback,
        requestedLanguage: locale,
      };
      partnerEntryCache.set(cacheKey, derived);
      return derived;
    }
  }

  partnerEntryCache.set(cacheKey, undefined);
  return undefined;
}

function loadGlossaryEntry(
  locale: Locale,
  slug: string,
): GlossaryEntry | undefined {
  const cacheKey = `${locale}:${slug}`;
  if (glossaryEntryCache.has(cacheKey)) {
    return glossaryEntryCache.get(cacheKey);
  }

  const filePath = resolveGlossaryFilePath(locale, slug);
  if (filePath) {
    const entry = parseGlossaryEntry({ slug, locale, filePath });
    glossaryEntryCache.set(cacheKey, entry);
    return entry;
  }

  if (locale !== i18n.defaultLocale) {
    const fallback = loadGlossaryEntry(i18n.defaultLocale, slug);
    if (fallback) {
      const derived: GlossaryEntry = {
        ...fallback,
        requestedLanguage: locale,
      };
      glossaryEntryCache.set(cacheKey, derived);
      return derived;
    }
  }

  glossaryEntryCache.set(cacheKey, undefined);
  return undefined;
}

function getAllPostSlugs(): Set<string> {
  const slugs = new Set<string>();
  for (const locale of i18n.locales) {
    for (const slug of listSlugs('blog', locale)) {
      slugs.add(slug);
    }
  }
  return slugs;
}

function isDraft(entry: PostEntry) {
  return entry.frontmatter.draft;
}

export function getPostParams(): Array<{ lang: Locale; slug: string }> {
  const params: Array<{ lang: Locale; slug: string }> = [];
  const slugs = getAllPostSlugs();

  for (const locale of i18n.locales) {
    for (const slug of slugs) {
      const entry = loadPostEntry(locale, slug);
      if (!entry) continue;
      // Only the locale's OWN file gets a pre-rendered/announced URL. A
      // default-locale fallback (sourceLanguage !== locale) is served by a
      // redirect to the source locale, so it must not become a static param
      // or a sitemap entry.
      if (entry.sourceLanguage !== locale) continue;
      if (isProduction && isDraft(entry)) continue;
      params.push({ lang: locale, slug: entry.slug });
    }
  }

  return params;
}

export function getPostsForLocale(locale: Locale): PostEntry[] {
  const slugs = getAllPostSlugs();
  const posts: PostEntry[] = [];

  for (const slug of slugs) {
    const entry = loadPostEntry(locale, slug);
    if (!entry) continue;
    if (isProduction && isDraft(entry)) continue;
    posts.push(entry);
  }

  return posts.sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
  );
}

export function getPost(locale: Locale, slug: string): PostEntry | undefined {
  const entry = loadPostEntry(locale, slug);
  if (!entry) return undefined;
  if (isProduction && isDraft(entry)) return undefined;
  return entry;
}

export const getPostCached = cache((locale: Locale, slug: string) =>
  getPost(locale, slug),
);

// Posts sharing at least one tag with the given post, ranked by tag overlap then
// recency, excluding the post itself. Powers the "Related guides" block.
export function getRelatedPosts(
  locale: Locale,
  slug: string,
  limit = 4,
): PostEntry[] {
  const current = getPost(locale, slug);
  if (!current) return [];
  const tags = new Set(current.frontmatter.tags);
  if (tags.size === 0) return [];
  return getPostsForLocale(locale)
    .filter((post) => post.slug !== slug)
    .map((post) => ({
      post,
      overlap: post.frontmatter.tags.filter((tag) => tags.has(tag)).length,
    }))
    .filter(({ overlap }) => overlap > 0)
    .sort(
      (a, b) =>
        b.overlap - a.overlap ||
        b.post.publishedAt.getTime() - a.post.publishedAt.getTime(),
    )
    .slice(0, limit)
    .map(({ post }) => post);
}

// All non-draft posts whose primary cluster is `cluster`, newest first (the
// shared sort from getPostsForLocale). Powers the /topics/[cluster] pillar hubs.
export function getPostsInCluster(
  locale: Locale,
  cluster: ClusterSlug,
): PostEntry[] {
  return getPostsForLocale(locale).filter(
    (post) => post.frontmatter.cluster === cluster,
  );
}

function isFaqPost(post: PostEntry): boolean {
  return (
    post.frontmatter.format === 'faq' || post.frontmatter.tags.includes('faq')
  );
}

export function getFaqPostsForLocale(locale: Locale): PostEntry[] {
  return getPostsForLocale(locale).filter(isFaqPost);
}

// A heading in a post's Table of Contents. `id` matches the slug the MDX heading
// renderer (mdx-components) stamps on the rendered heading, so an anchor link to
// `#id` jumps to the section.
export type TocEntry = { id: string; text: string; depth: 2 | 3 };

const CODE_FENCE_PATTERN = /^\s*(```|~~~)/;
const HEADING_PATTERN = /^(#{2,3})\s+(.+?)\s*#*\s*$/;

// Reduce an MDX heading line to the plain text the heading renderer sees (so the
// slug matches): drop images, unwrap links, strip inline code / emphasis markers
// and stray tags.
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

// De-dup heading ids exactly like github-slugger (and the remark-heading-ids
// plugin): track every EMITTED id, not just base-slug counts, so a heading whose
// slug is literally `foo-1` can't collide with the suffix minted for a duplicate
// `foo`. KEEP IN SYNC with createDeduper in mdx-plugins/remark-heading-ids.js.
function createHeadingIdDeduper(): (base: string) => string {
  const occurrences = new Map<string, number>();
  return (base) => {
    let result = base;
    while (occurrences.has(result)) {
      const count = (occurrences.get(base) ?? 0) + 1;
      occurrences.set(base, count);
      result = `${base}-${count}`;
    }
    occurrences.set(result, occurrences.get(result) ?? 0);
    return result;
  };
}

// Build the Table of Contents for a post by scanning the same source file the
// MDX renderer renders (so heading text/order match), slugging each heading with
// the same `slugify` the remark-heading-ids plugin uses, then applying the same
// id de-dup. Pass the post's sourceLanguage so EN-fallback posts get the EN
// headings that are actually rendered. h2/h3 only.
export function getPostToc(locale: Locale, slug: string): TocEntry[] {
  const filePath = resolvePostFilePath(locale, slug);
  if (!filePath) return [];
  const { content } = matter(fs.readFileSync(filePath, 'utf8'));
  const entries: TocEntry[] = [];
  const uniqueId = createHeadingIdDeduper();
  let inCodeFence = false;
  for (const line of content.split('\n')) {
    if (CODE_FENCE_PATTERN.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    const match = HEADING_PATTERN.exec(line);
    if (!match) continue;
    const text = stripInlineMarkdown(match[2]);
    if (!text) continue;
    const base = slugify(text);
    if (!base) continue;
    entries.push({
      id: uniqueId(base),
      text,
      depth: match[1].length as 2 | 3,
    });
  }
  return entries;
}

// All non-draft posts in `series`, ordered by their 1-based seriesOrder (ties
// fall back to recency from getPostsForLocale). Powers the /series/[series]
// landing pages and the on-post episode (prev/next) navigation.
export function getPostsInSeries(
  locale: Locale,
  series: SeriesSlug,
): PostEntry[] {
  return getPostsForLocale(locale)
    .filter((post) => post.frontmatter.series === series)
    .sort(
      (a, b) =>
        (a.frontmatter.seriesOrder ?? 0) - (b.frontmatter.seriesOrder ?? 0),
    );
}

const ASSETS_ROOT = path.join(DATA_ROOT, 'assets');
const POST_OG_ASSET_EXTENSIONS: readonly string[] = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
];

export type PostOgAsset = {
  absolutePath: string;
  extension: string;
  contentType: string;
};

function extensionToContentType(extension: string): string {
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

// Looks up the hand-made open-graph hero image for a blog post by convention:
// data/content/assets/<slug>-og.{jpg,jpeg,png,webp}. Shared across locales —
// translations reuse the source-language asset. Returns undefined when no
// asset is committed for the slug; callers should fall back to generated OG.
// Slugs traverse the user-facing URL, so we resolve and assert containment
// inside ASSETS_ROOT before touching the filesystem.
export function getPostOgAsset(slug: string): PostOgAsset | undefined {
  const assetsRootWithSep = `${ASSETS_ROOT}${path.sep}`;
  for (const extension of POST_OG_ASSET_EXTENSIONS) {
    const absolutePath = path.resolve(ASSETS_ROOT, `${slug}-og${extension}`);
    if (!absolutePath.startsWith(assetsRootWithSep)) continue;
    if (fs.existsSync(absolutePath)) {
      return {
        absolutePath,
        extension,
        contentType: extensionToContentType(extension),
      };
    }
  }
  return undefined;
}

export function getAuthor(
  locale: Locale,
  slug: string,
): AuthorEntry | undefined {
  return loadAuthorEntry(locale, slug);
}

export function getAuthorNames(locale: Locale, slugs: string[]): string[] {
  return slugs
    .map((slug) => getAuthor(locale, slug)?.frontmatter.name ?? slug)
    .filter((name, index, list) => list.indexOf(name) === index);
}

export function getAvailableLocalesForSlug(slug: string): Locale[] {
  const locales: Locale[] = [];
  for (const locale of i18n.locales) {
    const entry = loadPostEntry(locale, slug);
    // Only locales whose OWN file defines the slug are real translations and
    // earn an hreflang alternate; a default-locale fallback is not one.
    if (entry && entry.sourceLanguage === locale) {
      locales.push(locale);
    }
  }
  return locales;
}

function getAllGlossarySlugs(): Set<string> {
  const slugs = new Set<string>();
  for (const locale of i18n.locales) {
    for (const slug of listSlugs('glossary', locale)) {
      slugs.add(slug);
    }
  }
  return slugs;
}

function isGlossaryDraft(entry: GlossaryEntry) {
  return entry.frontmatter.draft;
}

export function getGlossaryParams(): Array<{ lang: Locale; slug: string }> {
  const params: Array<{ lang: Locale; slug: string }> = [];
  const slugs = getAllGlossarySlugs();

  for (const locale of i18n.locales) {
    for (const slug of slugs) {
      const entry = loadGlossaryEntry(locale, slug);
      if (!entry) continue;
      // Skip default-locale fallbacks (see getPostParams) — they redirect.
      if (entry.sourceLanguage !== locale) continue;
      if (isProduction && isGlossaryDraft(entry)) continue;
      params.push({ lang: locale, slug: entry.slug });
    }
  }

  return params;
}

export function getGlossaryEntriesForLocale(locale: Locale): GlossaryEntry[] {
  const slugs = getAllGlossarySlugs();
  const entries: GlossaryEntry[] = [];

  for (const slug of slugs) {
    const entry = loadGlossaryEntry(locale, slug);
    if (!entry) continue;
    if (isProduction && isGlossaryDraft(entry)) continue;
    entries.push(entry);
  }

  return entries.sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
  );
}

export function getGlossaryEntry(
  locale: Locale,
  slug: string,
): GlossaryEntry | undefined {
  const entry = loadGlossaryEntry(locale, slug);
  if (!entry) return undefined;
  if (isProduction && isGlossaryDraft(entry)) return undefined;
  return entry;
}

export const getGlossaryCached = cache((locale: Locale, slug: string) =>
  getGlossaryEntry(locale, slug),
);

export function getAvailableLocalesForGlossary(slug: string): Locale[] {
  const locales: Locale[] = [];
  for (const locale of i18n.locales) {
    if (loadGlossaryEntry(locale, slug)) {
      locales.push(locale);
    }
  }
  return locales;
}

function getAllTldSlugs(): Set<string> {
  const slugs = new Set<string>();
  for (const locale of i18n.locales) {
    for (const slug of listSlugs('tld', locale)) {
      slugs.add(slug);
    }
  }
  return slugs;
}

function isTldDraft(entry: TldEntry) {
  return entry.frontmatter.draft;
}

function getAllPartnerSlugs(): Set<string> {
  const slugs = new Set<string>();
  for (const locale of i18n.locales) {
    for (const slug of listSlugs('partners', locale)) {
      slugs.add(slug);
    }
  }
  return slugs;
}

function isPartnerDraft(entry: PartnerEntry) {
  return entry.frontmatter.draft;
}

export function getTldParams(): Array<{ lang: Locale; slug: string }> {
  const params: Array<{ lang: Locale; slug: string }> = [];
  const slugs = getAllTldSlugs();

  for (const locale of i18n.locales) {
    for (const slug of slugs) {
      const entry = loadTldEntry(locale, slug);
      if (!entry) continue;
      // Skip default-locale fallbacks (see getPostParams) — they redirect.
      if (entry.sourceLanguage !== locale) continue;
      if (isProduction && isTldDraft(entry)) continue;
      params.push({ lang: locale, slug: entry.slug });
    }
  }

  return params;
}

export function getTldsForLocale(locale: Locale): TldEntry[] {
  const slugs = getAllTldSlugs();
  const entries: TldEntry[] = [];

  for (const slug of slugs) {
    const entry = loadTldEntry(locale, slug);
    if (!entry) continue;
    if (isProduction && isTldDraft(entry)) continue;
    entries.push(entry);
  }

  return entries.sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
  );
}

export function getTld(locale: Locale, slug: string): TldEntry | undefined {
  const entry = loadTldEntry(locale, slug);
  if (!entry) return undefined;
  if (isProduction && isTldDraft(entry)) return undefined;
  return entry;
}

export const getTldCached = cache((locale: Locale, slug: string) =>
  getTld(locale, slug),
);

// A curated set of mainstream TLD pages to cross-link from any TLD page, kept to
// ones that reliably exist, filtered to those present in this locale and
// excluding the current slug. Powers the related-TLD chips.
const RELATED_TLD_SLUGS: readonly string[] = [
  'com',
  'io',
  'ai',
  'xyz',
  'app',
  'dev',
  'net',
  'org',
  'shop',
  'store',
];

export function getRelatedTlds(
  locale: Locale,
  slug: string,
  limit = 6,
): TldEntry[] {
  if (limit <= 0) return [];
  const entries: TldEntry[] = [];
  for (const candidate of RELATED_TLD_SLUGS) {
    if (candidate === slug) continue;
    const entry = getTld(locale, candidate);
    if (entry) entries.push(entry);
    if (entries.length >= limit) break;
  }
  return entries;
}

export function getAvailableLocalesForTld(slug: string): Locale[] {
  const locales: Locale[] = [];
  for (const locale of i18n.locales) {
    const entry = loadTldEntry(locale, slug);
    // Only locales whose OWN file defines the slug are real translations and
    // earn an hreflang alternate; a default-locale fallback is not one.
    if (entry && entry.sourceLanguage === locale) {
      locales.push(locale);
    }
  }
  return locales;
}

export function getPartnerParams(): Array<{ lang: Locale; slug: string }> {
  const params: Array<{ lang: Locale; slug: string }> = [];
  const slugs = getAllPartnerSlugs();

  for (const locale of i18n.locales) {
    for (const slug of slugs) {
      const entry = loadPartnerEntry(locale, slug);
      if (!entry) continue;
      // Skip default-locale fallbacks (see getPostParams) — they redirect.
      if (entry.sourceLanguage !== locale) continue;
      if (isProduction && isPartnerDraft(entry)) continue;
      params.push({ lang: locale, slug: entry.slug });
    }
  }

  return params;
}

export function getPartnersForLocale(locale: Locale): PartnerEntry[] {
  const slugs = getAllPartnerSlugs();
  const entries: PartnerEntry[] = [];

  for (const slug of slugs) {
    const entry = loadPartnerEntry(locale, slug);
    if (!entry) continue;
    if (isProduction && isPartnerDraft(entry)) continue;
    entries.push(entry);
  }

  return entries.sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
  );
}

export function getPartner(
  locale: Locale,
  slug: string,
): PartnerEntry | undefined {
  const entry = loadPartnerEntry(locale, slug);
  if (!entry) return undefined;
  if (isProduction && isPartnerDraft(entry)) return undefined;
  return entry;
}

export const getPartnerCached = cache((locale: Locale, slug: string) =>
  getPartner(locale, slug),
);

export function getAvailableLocalesForPartner(slug: string): Locale[] {
  const locales: Locale[] = [];
  for (const locale of i18n.locales) {
    if (loadPartnerEntry(locale, slug)) {
      locales.push(locale);
    }
  }
  return locales;
}

// ---------------------------------------------------------------------------
// Career collection
// ---------------------------------------------------------------------------

function normaliseCareerFrontmatter(
  data: Record<string, unknown>,
  slug: string,
  sourceLanguage: Locale,
): CareerFrontmatter {
  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    throw new Error(`Career "${slug}" is missing a valid "title" field.`);
  }

  const rawDate =
    typeof data.date === 'string'
      ? data.date
      : data.date instanceof Date
        ? data.date.toISOString()
        : undefined;

  if (!rawDate) {
    throw new Error(`Career "${slug}" is missing a valid "date" field.`);
  }

  const tags = toStringArray(data.tags);
  const authors = toStringArray(data.authors);
  const language = sourceLanguage;
  const description =
    typeof data.description === 'string' && data.description.trim().length > 0
      ? data.description.trim()
      : undefined;
  const summary =
    typeof data.summary === 'string' && data.summary.trim().length > 0
      ? data.summary.trim()
      : description;
  const draftValue = toBoolean(data.draft);
  const contentType =
    typeof data.type === 'string' &&
    (data.type === 'page' || data.type === 'job')
      ? data.type
      : 'page';

  return {
    title: data.title,
    summary,
    description,
    tags,
    authors,
    date: rawDate,
    draft: draftValue,
    language,
    type: contentType,
    employmentType:
      typeof data.employmentType === 'string'
        ? data.employmentType.trim()
        : undefined,
    validThrough:
      typeof data.validThrough === 'string'
        ? data.validThrough.trim()
        : undefined,
    team: typeof data.team === 'string' ? data.team.trim() : undefined,
    location:
      typeof data.location === 'string' ? data.location.trim() : undefined,
    compensation:
      typeof data.compensation === 'string'
        ? data.compensation.trim()
        : undefined,
  };
}

function resolveCareerFilePath(
  locale: Locale,
  slug: string,
): string | undefined {
  for (const extension of POST_EXTENSIONS) {
    const candidate = path.join(CAREER_ROOT, locale, `${slug}${extension}`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function parseCareerEntry({
  slug,
  locale,
  filePath,
}: {
  slug: string;
  locale: Locale;
  filePath: string;
}): CareerEntry {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(fileContents);
  const frontmatter = normaliseCareerFrontmatter(parsed.data, slug, locale);
  const publishedAt = new Date(frontmatter.date);

  if (Number.isNaN(publishedAt.getTime())) {
    throw new Error(
      `Career "${slug}" has an invalid "date": ${frontmatter.date}`,
    );
  }

  return {
    slug,
    frontmatter,
    sourceLanguage: locale,
    requestedLanguage: locale,
    relativePath: toRelativeDataPath(filePath),
    publishedAt,
    body: parsed.content,
  };
}

function loadCareerEntry(
  locale: Locale,
  slug: string,
): CareerEntry | undefined {
  const cacheKey = `${locale}:${slug}`;
  if (careerEntryCache.has(cacheKey)) {
    return careerEntryCache.get(cacheKey);
  }

  const filePath = resolveCareerFilePath(locale, slug);
  if (filePath) {
    const entry = parseCareerEntry({ slug, locale, filePath });
    careerEntryCache.set(cacheKey, entry);
    return entry;
  }

  if (locale !== i18n.defaultLocale) {
    const fallback = loadCareerEntry(i18n.defaultLocale, slug);
    if (fallback) {
      const derived: CareerEntry = {
        ...fallback,
        requestedLanguage: locale,
      };
      careerEntryCache.set(cacheKey, derived);
      return derived;
    }
  }

  careerEntryCache.set(cacheKey, undefined);
  return undefined;
}

function getAllCareerSlugs(): Set<string> {
  const slugs = new Set<string>();
  for (const locale of i18n.locales) {
    for (const slug of listSlugs('careers', locale)) {
      slugs.add(slug);
    }
  }
  return slugs;
}

function isCareerDraft(entry: CareerEntry) {
  return entry.frontmatter.draft;
}

export function getCareerParams(): Array<{ lang: Locale; slug: string }> {
  const params: Array<{ lang: Locale; slug: string }> = [];
  const slugs = getAllCareerSlugs();

  for (const locale of i18n.locales) {
    for (const slug of slugs) {
      const entry = loadCareerEntry(locale, slug);
      if (!entry) continue;
      // Skip default-locale fallbacks (see getPostParams) — they redirect.
      if (entry.sourceLanguage !== locale) continue;
      if (isProduction && isCareerDraft(entry)) continue;
      params.push({ lang: locale, slug: entry.slug });
    }
  }

  return params;
}

export function getCareerEntriesForLocale(locale: Locale): CareerEntry[] {
  const slugs = getAllCareerSlugs();
  const entries: CareerEntry[] = [];

  for (const slug of slugs) {
    const entry = loadCareerEntry(locale, slug);
    if (!entry) continue;
    if (isProduction && isCareerDraft(entry)) continue;
    entries.push(entry);
  }

  return entries.sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
  );
}

export function getCareerEntry(
  locale: Locale,
  slug: string,
): CareerEntry | undefined {
  const entry = loadCareerEntry(locale, slug);
  if (!entry) return undefined;
  if (isProduction && isCareerDraft(entry)) return undefined;
  return entry;
}

export const getCareerCached = cache((locale: Locale, slug: string) =>
  getCareerEntry(locale, slug),
);

export type {
  PostEntry,
  PostFrontmatter,
  AuthorEntry,
  AuthorFrontmatter,
  TldEntry,
  TldFrontmatter,
  PartnerEntry,
  PartnerFrontmatter,
  GlossaryEntry,
  GlossaryFrontmatter,
  CareerEntry,
  CareerFrontmatter,
};
