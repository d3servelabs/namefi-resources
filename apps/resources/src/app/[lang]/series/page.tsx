import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n-config';
import { i18n } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { getPostsInSeries } from '@/lib/content';
import {
  buildBreadcrumbJsonLd,
  buildCollectionJsonLd,
} from '@/lib/structured-data';
import { resolveBaseUrl } from '@/lib/site-url';
import {
  ResourceIndexCard,
  ResourceIndexEmptyState,
} from '@/components/resource-index-card';
import { JsonLd } from '@/components/json-ld';
import { SERIES, SERIES_SLUGS, localizeText } from '@/lib/taxonomy';

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
  const selfUrl = `${baseUrl}/r/${locale}/series`;
  const languageAlternates: Partial<Record<Locale | 'x-default', string>> = {};
  for (const localeOption of i18n.locales) {
    languageAlternates[localeOption] = `${baseUrl}/r/${localeOption}/series`;
  }
  languageAlternates['x-default'] = `${baseUrl}/r/en/series`;

  const title = dictionary.series.indexTitle;
  const description = dictionary.series.indexDescription;

  return {
    alternates: { canonical: selfUrl, languages: languageAlternates },
    title,
    description,
    openGraph: { title, description, url: selfUrl, locale, type: 'website' },
    twitter: { card: 'summary', title, description, site: '@namefi_io' },
  };
}

export default async function SeriesIndex({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!i18n.locales.includes(lang as Locale)) {
    notFound();
  }
  const locale = lang as Locale;
  const dictionary = await getDictionary(locale);
  const baseUrl = resolveBaseUrl();
  const selfUrl = `${baseUrl}/r/${locale}/series`;

  const series = SERIES_SLUGS.map((slug) => ({
    slug,
    meta: SERIES[slug],
    count: getPostsInSeries(locale, slug).length,
  })).filter((entry) => entry.count > 0);

  const collectionJsonLd = buildCollectionJsonLd({
    name: dictionary.series.indexTitle,
    description: dictionary.series.indexDescription,
    canonicalUrl: selfUrl,
    baseUrl,
    locale,
    items: series.map((entry) => ({
      name: localizeText(entry.meta.title, locale),
      url: `${baseUrl}/r/${locale}/series/${entry.slug}`,
    })),
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: dictionary.nav.resources, url: `${baseUrl}/r/${locale}` },
    { name: dictionary.series.indexTitle, url: selfUrl },
  ]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 md:px-10 lg:px-12">
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {dictionary.series.indexTitle}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {dictionary.series.indexDescription}
        </p>
      </header>

      {series.length === 0 ? (
        <ResourceIndexEmptyState>
          {dictionary.series.indexEmpty}
        </ResourceIndexEmptyState>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {series.map((entry) => (
            <ResourceIndexCard
              key={entry.slug}
              title={localizeText(entry.meta.title, locale)}
              href={`/${locale}/series/${entry.slug}`}
              summary={localizeText(entry.meta.description, locale)}
              tags={[`${entry.count} ${dictionary.series.episodesCountLabel}`]}
              metaItems={[]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
