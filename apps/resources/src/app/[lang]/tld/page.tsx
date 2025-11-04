import type { Metadata } from 'next';
import type { Locale } from '@/i18n-config';
import { localeDateLocales, i18n } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { getAuthorNames, getTldsForLocale } from '@/lib/content';
import { resolveTitle } from '@/lib/site-metadata';
import {
  ResourceIndexCard,
  ResourceIndexEmptyState,
} from '@/components/resource-index-card';
import { createResourceMetaItems } from '@/lib/resource-meta-items';

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
  const dictionary = await getDictionary(locale);
  const navLabel = dictionary.nav.tld;
  const baseTitle = resolveTitle(locale);
  const sectionTitle = dictionary.tld.indexTitle ?? navLabel;
  const sectionDescription = dictionary.tld.indexDescription ?? navLabel;

  const rawBaseUrl =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? 'localhost:3002';
  const normalisedBaseUrl = rawBaseUrl.startsWith('https')
    ? rawBaseUrl
    : `https://${rawBaseUrl}`;
  const baseUrl = normalisedBaseUrl.replace(TRAILING_SLASH_REGEX, '');
  const canonicalPath = `/r/${locale}/tld`;
  const url = `${baseUrl}${canonicalPath}`;
  const ogImagePath = `${canonicalPath}/opengraph-image`;
  const ogImageUrl = `${baseUrl}${ogImagePath}`;
  const pageTitle = `${baseTitle} – ${sectionTitle}`;
  const description = sectionDescription;
  const twitterHandle = '@namefi_io';

  const languageAlternates: Partial<Record<Locale, string>> = {};
  for (const localeOption of i18n.locales) {
    languageAlternates[localeOption] = `${baseUrl}/r/${localeOption}/tld`;
  }

  return {
    alternates: {
      canonical: url,
      languages: languageAlternates,
    },
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      url,
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
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dictionary = await getDictionary(locale);
  const entries = getTldsForLocale(locale);
  const dateLocale = localeDateLocales[locale] ?? localeDateLocales.en;
  const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
    dateStyle: 'long',
  });

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 md:px-10 lg:px-12">
      {entries.length === 0 ? (
        <ResourceIndexEmptyState>
          {dictionary.tld.indexEmpty}
        </ResourceIndexEmptyState>
      ) : (
        <div className="grid gap-6">
          {entries.map((entry) => {
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
            });

            return (
              <ResourceIndexCard
                key={`${entry.slug}-${entry.sourceLanguage}`}
                title={entry.frontmatter.title}
                href={href}
                summary={summary}
                tags={entry.frontmatter.tags}
                metaItems={metaItems}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
