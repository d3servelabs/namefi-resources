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
  getResourceIndexGridClass,
  ResourceIndexCard,
  ResourceIndexViewSwitcher,
  resolveResourceIndexViewMode,
} from '@/components/resource-index-card';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { JsonLd } from '@/components/json-ld';
import { getBlogPostPreviewImageSrc } from '@/lib/resource-index-preview';
import {
  SERIES,
  SERIES_SLUGS,
  isSeriesSlug,
  localizeText,
} from '@/lib/taxonomy';

export function generateStaticParams(): Array<{
  lang: Locale;
  series: string;
}> {
  return i18n.locales.flatMap((lang) =>
    SERIES_SLUGS.map((series) => ({ lang, series })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; series: string }>;
}): Promise<Metadata> {
  const { lang, series } = await params;
  const locale = i18n.locales.includes(lang as Locale)
    ? (lang as Locale)
    : i18n.defaultLocale;
  if (!isSeriesSlug(series)) return {};

  const meta = SERIES[series];
  const baseUrl = resolveBaseUrl();
  const selfUrl = `${baseUrl}/r/${locale}/series/${series}`;
  const languageAlternates: Partial<Record<Locale | 'x-default', string>> = {};
  for (const localeOption of i18n.locales) {
    languageAlternates[localeOption] =
      `${baseUrl}/r/${localeOption}/series/${series}`;
  }
  languageAlternates['x-default'] = `${baseUrl}/r/en/series/${series}`;

  const title = localizeText(meta.title, locale);
  const description = localizeText(meta.description, locale);

  return {
    alternates: { canonical: selfUrl, languages: languageAlternates },
    title,
    description,
    openGraph: { title, description, url: selfUrl, locale, type: 'website' },
    twitter: { card: 'summary', title, description, site: '@namefi_io' },
  };
}

export default async function SeriesHub({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; series: string }>;
  searchParams?: Promise<{ view?: string | string[] }>;
}) {
  const { lang, series } = await params;
  const { view: viewParam } = (await searchParams) ?? {};
  if (!i18n.locales.includes(lang as Locale) || !isSeriesSlug(series)) {
    notFound();
  }
  const locale = lang as Locale;
  const view = resolveResourceIndexViewMode(viewParam);
  const dictionary = await getDictionary(locale);
  const meta = SERIES[series];
  const baseUrl = resolveBaseUrl();
  const selfUrl = `${baseUrl}/r/${locale}/series/${series}`;

  const episodes = getPostsInSeries(locale, series);

  const collectionJsonLd = buildCollectionJsonLd({
    name: localizeText(meta.title, locale),
    description: localizeText(meta.description, locale),
    canonicalUrl: selfUrl,
    baseUrl,
    locale,
    items: episodes.map((post) => ({
      name: post.frontmatter.title,
      url: `${baseUrl}/r/${locale}/blog/${post.slug}`,
    })),
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: dictionary.nav.resources, url: `${baseUrl}/r/${locale}` },
    {
      name: dictionary.series.indexTitle,
      url: `${baseUrl}/r/${locale}/series`,
    },
    { name: localizeText(meta.title, locale), url: selfUrl },
  ]);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:px-10 lg:px-12">
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <BreadcrumbNav
        items={[
          { name: dictionary.nav.resources, href: `/${locale}` },
          { name: dictionary.series.indexTitle, href: `/${locale}/series` },
          { name: localizeText(meta.title, locale) },
        ]}
      />

      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {localizeText(meta.title, locale)}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {localizeText(meta.description, locale)}
        </p>
      </header>

      {episodes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {dictionary.series.episodesEmpty}
        </p>
      ) : (
        <>
          <div className="flex justify-end">
            <ResourceIndexViewSwitcher
              view={view}
              href={`/${locale}/series/${series}`}
              labels={dictionary.view}
            />
          </div>
          <div className={getResourceIndexGridClass(view)}>
            {episodes.map((post, index) => (
              <ResourceIndexCard
                key={`${post.slug}-${post.sourceLanguage}`}
                title={post.frontmatter.title}
                href={`/${locale}/blog/${post.slug}`}
                summary={post.frontmatter.summary}
                tags={[`#${index + 1}`]}
                metaItems={[]}
                imageSrc={getBlogPostPreviewImageSrc(locale, post.slug)}
                imageAlt={post.frontmatter.title}
                view={view}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
