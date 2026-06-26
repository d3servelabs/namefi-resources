import type { Metadata } from 'next';
import type { Locale } from '@/i18n-config';
import { localeDateLocales, i18n } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { getAuthorNames, getPostsForLocale } from '@/lib/content';
import { resolveDescription, resolveTitle } from '@/lib/site-metadata';
import { resolveBaseUrl } from '@/lib/site-url';
import {
  buildBreadcrumbJsonLd,
  buildCollectionJsonLd,
} from '@/lib/structured-data';
import {
  getResourceIndexGridClass,
  ResourceIndexCard,
  ResourceIndexEmptyState,
  ResourceIndexViewSwitcher,
  resolveResourceIndexViewMode,
} from '@/components/resource-index-card';
import { JsonLd } from '@/components/json-ld';
import { createResourceMetaItems } from '@/lib/resource-meta-items';
import { loadMdxReadingTime } from '@/lib/load-mdx-module';
import { getBlogPostPreviewImageSrc } from '@/lib/resource-index-preview';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = i18n.locales.includes(lang as Locale)
    ? (lang as Locale)
    : i18n.defaultLocale;

  const baseUrl = resolveBaseUrl();
  const selfPath = `/r/${locale}/blog`;
  const selfUrl = `${baseUrl}${selfPath}`;
  // SEO: each locale index is self-canonical so it can rank in its own
  // language; hreflang `languages` + `x-default` (below) map the cluster.
  const canonicalUrl = selfUrl;
  const ogImagePath = `${selfPath}/opengraph-image`;
  const ogImageUrl = `${baseUrl}${ogImagePath}`;
  const rssFeedUrl = `${baseUrl}/r/${locale}/rss.xml`;
  const title = resolveTitle(locale);
  const description = resolveDescription(locale);
  const twitterHandle = '@namefi_io';

  const languageAlternates: Partial<Record<Locale | 'x-default', string>> = {};
  for (const localeOption of i18n.locales) {
    languageAlternates[localeOption] = `${baseUrl}/r/${localeOption}/blog`;
  }
  languageAlternates['x-default'] = `${baseUrl}/r/en/blog`;

  return {
    alternates: {
      canonical: canonicalUrl,
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
      url: selfUrl,
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
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ view?: string | string[] }>;
}) {
  const { lang } = await params;
  const { view: viewParam } = (await searchParams) ?? {};
  const locale = lang as Locale;
  const view = resolveResourceIndexViewMode(viewParam);
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

  const baseUrl = resolveBaseUrl();
  const selfUrl = `${baseUrl}/r/${locale}/blog`;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: dictionary.nav.resources, url: `${baseUrl}/r/${locale}` },
    { name: dictionary.nav.blog, url: selfUrl },
  ]);
  // CollectionPage + ItemList for the post list, matching the topics/series/
  // watch indexes — this is the one listing page that lacked it. Self-canonical
  // per locale (same as this page's metadata canonical) so each language ranks
  // on its own.
  const collectionJsonLd = buildCollectionJsonLd({
    name: resolveTitle(locale),
    description: resolveDescription(locale),
    canonicalUrl: selfUrl,
    baseUrl,
    locale,
    items: posts.map((post) => ({
      name: post.frontmatter.title,
      url: `${baseUrl}/r/${locale}/blog/${post.slug}`,
    })),
  });

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:px-10 lg:px-12">
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {posts.length === 0 ? (
        <ResourceIndexEmptyState>
          {dictionary.blog.indexEmpty}
        </ResourceIndexEmptyState>
      ) : (
        <>
          <div className="flex justify-end">
            <ResourceIndexViewSwitcher
              view={view}
              href={`/${locale}/blog`}
              labels={dictionary.view}
            />
          </div>
          <div className={getResourceIndexGridClass(view)}>
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
                  imageSrc={getBlogPostPreviewImageSrc(locale, post.slug)}
                  imageAlt={post.frontmatter.title}
                  view={view}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
