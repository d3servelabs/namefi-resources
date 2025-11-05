import type { Metadata } from 'next';
import type { Locale } from '@/i18n-config';
import { localeDateLocales, i18n } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { getAuthorNames, getPostsForLocale } from '@/lib/content';
import { resolveDescription, resolveTitle } from '@/lib/site-metadata';
import {
  ResourceIndexCard,
  ResourceIndexEmptyState,
} from '@/components/resource-index-card';
import { createResourceMetaItems } from '@/lib/resource-meta-items';
import { loadMdxReadingTime } from '@/lib/load-mdx-module';

const TRAILING_SLASH_REGEX = /\/$/;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = i18n.locales.includes(lang as Locale)
    ? (lang as Locale)
    : i18n.defaultLocale;

  const rawBaseUrl =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? 'localhost:3002';
  const normalisedBaseUrl = rawBaseUrl.startsWith('https')
    ? rawBaseUrl
    : `https://${rawBaseUrl}`;
  const baseUrl = normalisedBaseUrl.replace(TRAILING_SLASH_REGEX, '');
  const canonicalPath = `/r/${locale}/blog`;
  const url = `${baseUrl}${canonicalPath}`;
  const ogImagePath = `${canonicalPath}/opengraph-image`;
  const ogImageUrl = `${baseUrl}${ogImagePath}`;
  const rssFeedUrl = `${baseUrl}/r/${locale}/rss.xml`;
  const title = resolveTitle(locale);
  const description = resolveDescription(locale);
  const twitterHandle = '@namefi_io';

  const languageAlternates: Partial<Record<Locale, string>> = {};
  for (const localeOption of i18n.locales) {
    languageAlternates[localeOption] = `${baseUrl}/r/${localeOption}/blog`;
  }

  return {
    alternates: {
      canonical: url,
      languages: languageAlternates,
      types: {
        'application/rss+xml': rssFeedUrl,
      },
    },
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      locale,
      type: 'website',
      siteName: title,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      site: twitterHandle,
      creator: twitterHandle,
    },
  };
}

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dictionary = await getDictionary(locale);
  const posts = getPostsForLocale(locale);
  const postsWithReadingTime = await Promise.all(
    posts.map(async (post) => {
      const readingTime = await loadMdxReadingTime(post.relativePath);
      return { post, readingTimeText: readingTime?.text };
    }),
  );
  const dateLocale = localeDateLocales[locale] ?? localeDateLocales.en;
  const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
    dateStyle: 'long',
  });

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 md:px-10 lg:px-12">
      {posts.length === 0 ? (
        <ResourceIndexEmptyState>
          {dictionary.blog.indexEmpty}
        </ResourceIndexEmptyState>
      ) : (
        <div className="grid gap-6">
          {postsWithReadingTime.map(({ post, readingTimeText }) => {
            const authorNames = getAuthorNames(
              locale,
              post.frontmatter.authors,
            );
            const href = `/${locale}/blog/${post.slug}`;
            const summary = post.frontmatter.summary;
            const metaItems = createResourceMetaItems({
              labels: {
                publishedOn: dictionary.blog.detailPublishedOn,
                by: dictionary.blog.detailBy,
                sourceLanguage: dictionary.blog.detailSourceLanguage,
              },
              publishedAt: post.publishedAt,
              authorNames,
              dateFormatter,
              sourceLanguage: post.sourceLanguage,
              requestedLanguage: post.requestedLanguage,
              readingTimeText,
            });

            return (
              <ResourceIndexCard
                key={`${post.slug}-${post.sourceLanguage}`}
                title={post.frontmatter.title}
                href={href}
                summary={summary}
                tags={post.frontmatter.tags}
                metaItems={metaItems}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
