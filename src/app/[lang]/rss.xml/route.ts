import type { NextRequest } from 'next/server';
import RSS from 'rss';
import { i18n, type Locale } from '@/i18n-config';
import {
  getAuthorNames,
  getPartnersForLocale,
  getPostsForLocale,
  getTldsForLocale,
} from '@/lib/content';
import { resolveDescription, resolveTitle } from '@/lib/site-metadata';
import { resolveBaseUrl } from '@/lib/site-url';

const FEED_CACHE_TTL_SECONDS = 3600;

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
  const baseUrl = resolveBaseUrl();
  const channelTitle = resolveTitle(locale);
  const channelDescription = resolveDescription(locale);
  const channelLink = `${baseUrl}/r/${locale}`;
  const feedUrl = `${baseUrl}/r/${locale}/rss.xml`;

  const blogPosts = getPostsForLocale(locale);
  const partnerPosts = getPartnersForLocale(locale);
  const tldPosts = getTldsForLocale(locale);

  const combinedPosts = [
    ...blogPosts.map((post) => ({
      id: `blog-${post.slug}-${post.sourceLanguage}`,
      title: post.frontmatter.title,
      summary: post.frontmatter.summary ?? '',
      tags: post.frontmatter.tags,
      publishedAt: post.publishedAt,
      authors: getAuthorNames(locale, post.frontmatter.authors),
      url: `${baseUrl}/r/${locale}/blog/${post.slug}`,
    })),
    ...partnerPosts.map((post) => ({
      id: `partner-${post.slug}-${post.sourceLanguage}`,
      title: post.frontmatter.title,
      summary: post.frontmatter.summary ?? post.frontmatter.description ?? '',
      tags: post.frontmatter.tags,
      publishedAt: post.publishedAt,
      authors: getAuthorNames(locale, post.frontmatter.authors),
      url: `${baseUrl}/r/${locale}/partners/${post.slug}`,
    })),
    ...tldPosts.map((post) => ({
      id: `tld-${post.slug}-${post.sourceLanguage}`,
      title: post.frontmatter.title,
      summary: post.frontmatter.summary ?? post.frontmatter.description ?? '',
      tags: post.frontmatter.tags,
      publishedAt: post.publishedAt,
      authors: getAuthorNames(locale, post.frontmatter.authors),
      url: `${baseUrl}/r/${locale}/tld/${post.slug}`,
    })),
  ].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  const lastPublishedDate = combinedPosts[0]?.publishedAt ?? new Date();

  const feed = new RSS({
    title: channelTitle,
    description: channelDescription,
    feed_url: feedUrl,
    site_url: channelLink,
    language: locale,
    pubDate: lastPublishedDate,
    ttl: Math.floor(FEED_CACHE_TTL_SECONDS / 60),
  });

  for (const post of combinedPosts) {
    const categories = post.tags.length > 0 ? post.tags : undefined;
    const authorText =
      post.authors.length > 0 ? post.authors.join(', ') : undefined;

    feed.item({
      title: post.title,
      description: post.summary,
      url: post.url,
      guid: post.id,
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
