import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n-config';
import { localeDateLocales, i18n } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { getAuthorNames, getFaqPostsForLocale } from '@/lib/content';
import {
  buildBreadcrumbJsonLd,
  buildCollectionJsonLd,
} from '@/lib/structured-data';
import { resolveBaseUrl } from '@/lib/site-url';
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
  const dictionary = await getDictionary(locale);

  const baseUrl = resolveBaseUrl();
  const selfUrl = `${baseUrl}/r/${locale}/faq`;
  const languageAlternates: Partial<Record<Locale | 'x-default', string>> = {};
  for (const localeOption of i18n.locales) {
    languageAlternates[localeOption] = `${baseUrl}/r/${localeOption}/faq`;
  }
  languageAlternates['x-default'] = `${baseUrl}/r/en/faq`;

  const title = dictionary.faq.indexTitle;
  const description = dictionary.faq.indexDescription;

  return {
    alternates: { canonical: selfUrl, languages: languageAlternates },
    title,
    description,
    openGraph: { title, description, url: selfUrl, locale, type: 'website' },
    twitter: { card: 'summary', title, description, site: '@namefi_io' },
  };
}

export default async function FaqIndex({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ view?: string | string[] }>;
}) {
  const { lang } = await params;
  const { view: viewParam } = (await searchParams) ?? {};
  if (!i18n.locales.includes(lang as Locale)) {
    notFound();
  }

  const locale = lang as Locale;
  const view = resolveResourceIndexViewMode(viewParam);
  const dictionary = await getDictionary(locale);
  const posts = getFaqPostsForLocale(locale);
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
  const selfUrl = `${baseUrl}/r/${locale}/faq`;
  const collectionJsonLd = buildCollectionJsonLd({
    name: dictionary.faq.indexTitle,
    description: dictionary.faq.indexDescription,
    canonicalUrl: selfUrl,
    baseUrl,
    locale,
    items: posts.map((post) => ({
      name: post.frontmatter.title,
      url: `${baseUrl}/r/${locale}/blog/${post.slug}`,
    })),
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: dictionary.nav.resources, url: `${baseUrl}/r/${locale}` },
    { name: dictionary.faq.indexTitle, url: selfUrl },
  ]);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:px-10 lg:px-12">
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {dictionary.faq.indexTitle}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {dictionary.faq.indexDescription}
        </p>
      </header>

      {posts.length === 0 ? (
        <ResourceIndexEmptyState>
          {dictionary.faq.indexEmpty}
        </ResourceIndexEmptyState>
      ) : (
        <>
          <div className="flex justify-end">
            <ResourceIndexViewSwitcher
              view={view}
              href={`/${locale}/faq`}
              labels={dictionary.view}
            />
          </div>
          <div className={getResourceIndexGridClass(view)}>
            {postsWithReadingTime.map(({ post, readingTimeText }) => {
              const authorNames = getAuthorNames(
                locale,
                post.frontmatter.authors,
              );
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
                  href={`/${locale}/blog/${post.slug}`}
                  summary={post.frontmatter.summary}
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
