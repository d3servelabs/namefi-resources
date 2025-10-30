import RSS from 'rss';
import type { NextRequest } from 'next/server';
import { i18n, type Locale } from '@/i18n-config';
import { getAuthorNames, getPostsForLocale } from '@/lib/content';
import { resolveDescription, resolveTitle } from '@/lib/site-metadata';

const TRAILING_SLASH_REGEX = /\/$/;
const FEED_CACHE_TTL_SECONDS = 3600;

function normaliseBaseUrl(rawUrl?: string | null) {
  const value =
    rawUrl && rawUrl.length > 0
      ? rawUrl
      : (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
        'localhost:3002');
  const prefixed = value.startsWith('http') ? value : `https://${value}`;
  return prefixed.replace(TRAILING_SLASH_REGEX, '');
}

function resolveLocale(lang: string): Locale {
  return i18n.locales.includes(lang as Locale)
    ? (lang as Locale)
    : i18n.defaultLocale;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ lang: string }> },
) {
  const { lang } = await context.params;
  const locale = resolveLocale(lang);
  const baseUrl = normaliseBaseUrl(
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
  );
  const channelTitle = resolveTitle(locale);
  const channelDescription = resolveDescription(locale);
  const channelLink = `${baseUrl}/r/${locale}/blog`;
  const feedUrl = `${channelLink}/rss.xml`;

  const posts = getPostsForLocale(locale);
  const lastPublishedDate = posts[0]?.publishedAt ?? new Date();

  const feed = new RSS({
    title: channelTitle,
    description: channelDescription,
    feed_url: feedUrl,
    site_url: channelLink,
    language: locale,
    pubDate: lastPublishedDate,
    ttl: Math.floor(FEED_CACHE_TTL_SECONDS / 60),
  });

  for (const post of posts) {
    const itemLink = `${baseUrl}/r/${locale}/blog/${post.slug}`;
    const authorNames = getAuthorNames(locale, post.frontmatter.authors);
    const summary = post.frontmatter.summary ?? '';
    const categories =
      post.frontmatter.tags.length > 0 ? post.frontmatter.tags : undefined;
    const authorText =
      authorNames.length > 0 ? authorNames.join(', ') : undefined;

    feed.item({
      title: post.frontmatter.title,
      description: summary,
      url: itemLink,
      guid: itemLink,
      date: post.publishedAt,
      categories,
      author: authorText,
    });
  }

  const xml = feed.xml({ indent: '  ' });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': `s-maxage=${FEED_CACHE_TTL_SECONDS}, stale-while-revalidate`,
    },
  });
}
