import type { Metadata } from 'next';
import type { Locale } from '@/i18n-config';
import { i18n, localeDateLocales } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { getAuthorNames, getGlossaryEntriesForLocale } from '@/lib/content';
import { resolveTitle } from '@/lib/site-metadata';
import { resolveBaseUrl } from '@/lib/site-url';
import {
  buildBreadcrumbJsonLd,
  buildDefinedTermSetJsonLd,
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
  const navLabel = dictionary.nav.glossary;
  const baseTitle = resolveTitle(locale);
  const sectionTitle = dictionary.glossary.indexTitle ?? navLabel;
  const sectionDescription = dictionary.glossary.indexDescription ?? navLabel;

  const baseUrl = resolveBaseUrl();
  const selfPath = `/r/${locale}/glossary`;
  const selfUrl = `${baseUrl}${selfPath}`;
  // SEO: declare the English index as canonical so ranking signals
  // consolidate on the English page across locales.
  const canonicalUrl = `${baseUrl}/r/en/glossary`;
  const ogImagePath = `${selfPath}/opengraph-image`;
  const ogImageUrl = `${baseUrl}${ogImagePath}`;
  const pageTitle = `${baseTitle} – ${sectionTitle}`;
  const description = sectionDescription;
  const twitterHandle = '@namefi_io';

  const languageAlternates: Partial<Record<Locale, string>> = {};
  for (const localeOption of i18n.locales) {
    languageAlternates[localeOption] = `${baseUrl}/r/${localeOption}/glossary`;
  }

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

export default async function GlossaryIndex({
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
  const entries = getGlossaryEntriesForLocale(locale);
  const dateLocale = localeDateLocales[locale] ?? localeDateLocales.en;
  const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
    dateStyle: 'long',
  });

  const baseUrl = resolveBaseUrl();
  const glossaryUrl = `${baseUrl}/r/${locale}/glossary`;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: dictionary.nav.resources, url: `${baseUrl}/r/${locale}` },
    { name: dictionary.nav.glossary, url: glossaryUrl },
  ]);
  const definedTermSetJsonLd = buildDefinedTermSetJsonLd({
    name: dictionary.glossary.indexTitle ?? dictionary.nav.glossary,
    description:
      dictionary.glossary.indexDescription ?? dictionary.nav.glossary,
    canonicalUrl: glossaryUrl,
    baseUrl,
    locale,
    terms: entries.map((entry) => ({
      name: entry.frontmatter.title,
      url: `${baseUrl}/r/${locale}/glossary/${entry.slug}`,
    })),
  });

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:px-10 lg:px-12">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={definedTermSetJsonLd} />
      {entries.length === 0 ? (
        <ResourceIndexEmptyState>
          {dictionary.glossary.indexEmpty}
        </ResourceIndexEmptyState>
      ) : (
        <>
          <div className="flex justify-end">
            <ResourceIndexViewSwitcher
              view={view}
              href={`/${locale}/glossary`}
              labels={dictionary.view}
            />
          </div>
          <div className={getResourceIndexGridClass(view)}>
            {entries.map((entry) => {
              const authorNames = getAuthorNames(
                locale,
                entry.frontmatter.authors,
              );
              const href = `/${locale}/glossary/${entry.slug}`;
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
                    'glossary',
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
