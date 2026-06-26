import type { Metadata } from 'next';
import type { Locale } from '@/i18n-config';
import { localeDateLocales, i18n } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { getAuthorNames, getTldsForLocale } from '@/lib/content';
import { resolveTitle } from '@/lib/site-metadata';
import { resolveBaseUrl } from '@/lib/site-url';
import { buildBreadcrumbJsonLd } from '@/lib/structured-data';
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
import { getResourceEntryPreviewImageSrc } from '@/lib/resource-index-preview';

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
  const navLabel = dictionary.nav.tld;
  const baseTitle = resolveTitle(locale);
  const sectionTitle = dictionary.tld.indexTitle ?? navLabel;
  const sectionDescription = dictionary.tld.indexDescription ?? navLabel;

  const baseUrl = resolveBaseUrl();
  const selfPath = `/r/${locale}/tld`;
  const selfUrl = `${baseUrl}${selfPath}`;
  // SEO: each locale index is self-canonical so it can rank in its own
  // language; hreflang `languages` + `x-default` (below) map the cluster.
  const canonicalUrl = selfUrl;
  const ogImagePath = `${selfPath}/opengraph-image`;
  const ogImageUrl = `${baseUrl}${ogImagePath}`;
  const pageTitle = `${baseTitle} – ${sectionTitle}`;
  const description = sectionDescription;
  const twitterHandle = '@namefi_io';

  const languageAlternates: Partial<Record<Locale | 'x-default', string>> = {};
  for (const localeOption of i18n.locales) {
    languageAlternates[localeOption] = `${baseUrl}/r/${localeOption}/tld`;
  }
  languageAlternates['x-default'] = `${baseUrl}/r/en/tld`;

  return {
    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates,
    },
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      url: selfUrl,
      locale,
      type: 'website',
      siteName: baseTitle,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [ogImageUrl],
      site: twitterHandle,
      creator: twitterHandle,
    },
  };
}

export default async function TldIndex({
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
  const entries = getTldsForLocale(locale);
  const entriesWithReadingTime = await Promise.all(
    entries.map(async (entry) => {
      const readingTime = await loadMdxReadingTime(entry.relativePath);
      return { entry, readingTimeText: readingTime?.text };
    }),
  );
  const dateLocale = localeDateLocales[locale] ?? localeDateLocales.en;
  const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
    dateStyle: 'long',
  });

  const baseUrl = resolveBaseUrl();
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: dictionary.nav.resources, url: `${baseUrl}/r/${locale}` },
    { name: dictionary.nav.tld, url: `${baseUrl}/r/${locale}/tld` },
  ]);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:px-10 lg:px-12">
      <JsonLd data={breadcrumbJsonLd} />
      {entries.length === 0 ? (
        <ResourceIndexEmptyState>
          {dictionary.tld.indexEmpty}
        </ResourceIndexEmptyState>
      ) : (
        <>
          <div className="flex justify-end">
            <ResourceIndexViewSwitcher
              view={view}
              href={`/${locale}/tld`}
              labels={dictionary.view}
            />
          </div>
          <div className={getResourceIndexGridClass(view)}>
            {entriesWithReadingTime.map(({ entry, readingTimeText }) => {
              const authorNames = getAuthorNames(
                locale,
                entry.frontmatter.authors,
              );
              const href = `/${locale}/tld/${entry.slug}`;
              const summary =
                entry.frontmatter.summary ?? entry.frontmatter.description;
              const metaItems = createResourceMetaItems({
                labels: {
                  publishedOn: dictionary.blog.detailPublishedOn,
                  by: dictionary.blog.detailBy,
                  sourceLanguage: dictionary.blog.detailSourceLanguage,
                },
                publishedAt: entry.publishedAt,
                authorNames,
                dateFormatter,
                sourceLanguage: entry.sourceLanguage,
                requestedLanguage: entry.requestedLanguage,
                readingTimeText,
              });

              return (
                <ResourceIndexCard
                  key={`${entry.slug}-${entry.sourceLanguage}`}
                  title={entry.frontmatter.title}
                  href={href}
                  summary={summary}
                  tags={entry.frontmatter.tags}
                  metaItems={metaItems}
                  imageSrc={getResourceEntryPreviewImageSrc(
                    locale,
                    'tld',
                    entry.slug,
                  )}
                  imageAlt={entry.frontmatter.title}
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
