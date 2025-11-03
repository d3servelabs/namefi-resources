import 'server-only';
// biome-ignore lint/correctness/noNodejsModules: server-side content helpers rely on Node file system APIs.
import fs from 'node:fs';
// biome-ignore lint/correctness/noNodejsModules: server-side content helpers rely on Node path utilities.
import path from 'node:path';
import matter from 'gray-matter';
import { cache } from 'react';
import { i18n, type Locale } from '@/i18n-config';

type Collection = 'blog' | 'authors' | 'tld' | 'partners';

type PostFrontmatter = {
  title: string;
  summary?: string;
  tags: string[];
  authors: string[];
  date: string;
  draft: boolean;
  language: Locale;
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

const DATA_ROOT = path.join(process.cwd(), 'data');
const BLOG_ROOT = path.join(DATA_ROOT, 'blog');
const AUTHOR_ROOT = path.join(DATA_ROOT, 'authors');
const TLD_ROOT = path.join(DATA_ROOT, 'tld');
const PARTNER_ROOT = path.join(DATA_ROOT, 'partners');

const postDirectoryCache = new Map<string, string[]>();
const authorDirectoryCache = new Map<string, string[]>();
const tldDirectoryCache = new Map<string, string[]>();
const partnerDirectoryCache = new Map<string, string[]>();

const postEntryCache = new Map<string, PostEntry | undefined>();
const authorEntryCache = new Map<string, AuthorEntry | undefined>();
const tldEntryCache = new Map<string, TldEntry | undefined>();
const partnerEntryCache = new Map<string, PartnerEntry | undefined>();

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

function ensureLocale(value: unknown, fallback: Locale): Locale {
  if (typeof value === 'string' && i18n.locales.includes(value as Locale)) {
    return value as Locale;
  }
  return fallback;
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

  const language = ensureLocale(data.language, sourceLanguage);
  const summaryFromDescription =
    typeof data.description === 'string' && data.description.trim().length > 0
      ? data.description.trim()
      : undefined;
  const summary =
    typeof data.summary === 'string' && data.summary.trim().length > 0
      ? data.summary.trim()
      : summaryFromDescription;
  const draftValue = toBoolean(data.draft);

  return {
    title: data.title,
    summary,
    tags,
    authors,
    date: rawDate,
    draft: draftValue,
    language,
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

  const language = ensureLocale(data.language, sourceLanguage);

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

  const language = ensureLocale(data.language, sourceLanguage);
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

  const language = ensureLocale(data.language, sourceLanguage);
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

function loadPostEntry(locale: Locale, slug: string): PostEntry | undefined {
  const cacheKey = `${locale}:${slug}`;
  if (postEntryCache.has(cacheKey)) {
    return postEntryCache.get(cacheKey);
  }

  const filePath = resolvePostFilePath(locale, slug);
  if (filePath) {
    const entry = parsePostEntry({ slug, locale, filePath });
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
    if (loadPostEntry(locale, slug)) {
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

export function getAvailableLocalesForTld(slug: string): Locale[] {
  const locales: Locale[] = [];
  for (const locale of i18n.locales) {
    if (loadTldEntry(locale, slug)) {
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

export type {
  PostEntry,
  PostFrontmatter,
  AuthorEntry,
  AuthorFrontmatter,
  TldEntry,
  TldFrontmatter,
  PartnerEntry,
  PartnerFrontmatter,
};
