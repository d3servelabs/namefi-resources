import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { cache } from 'react';
import type { ComponentType } from 'react';
import type { MDXComponents } from 'mdx/types';
import { i18n, type Locale } from '@/i18n-config';

type Collection = 'blog' | 'authors';

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
  content: string;
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
  content: string;
};

export type MDXContent = ComponentType<{ components?: MDXComponents }>;

const DATA_ROOT = path.join(process.cwd(), 'data');
const BLOG_ROOT = path.join(DATA_ROOT, 'blog');
const AUTHOR_ROOT = path.join(DATA_ROOT, 'authors');

const postDirectoryCache = new Map<string, string[]>();
const authorDirectoryCache = new Map<string, string[]>();

const postEntryCache = new Map<string, PostEntry | undefined>();
const authorEntryCache = new Map<string, AuthorEntry | undefined>();

const isProduction = process.env.NODE_ENV === 'production';
const MARKDOWN_EXTENSION = /\.(md|mdx)$/;
const POST_EXTENSIONS: readonly string[] = ['.mdx', '.md'];

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
  const cache =
    collection === 'blog' ? postDirectoryCache : authorDirectoryCache;
  const key = getDirectoryKey(collection, locale);

  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const dir =
    collection === 'blog'
      ? path.join(BLOG_ROOT, locale)
      : path.join(AUTHOR_ROOT, locale);

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
    content: parsed.content,
    publishedAt,
  };
}

function parseAuthorEntry({
  slug,
  locale,
}: {
  slug: string;
  locale: Locale;
}): AuthorEntry {
  const filePath = path.join(AUTHOR_ROOT, locale, `${slug}.mdx`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(fileContents);
  const frontmatter = normaliseAuthorFrontmatter(parsed.data, slug, locale);

  return {
    slug,
    frontmatter,
    sourceLanguage: locale,
    requestedLanguage: locale,
    content: parsed.content,
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
    const entry = parseAuthorEntry({ slug, locale });
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

export type { PostEntry, PostFrontmatter, AuthorEntry, AuthorFrontmatter };
