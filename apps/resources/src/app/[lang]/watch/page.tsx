import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n-config';
import { i18n, localeDateLocales } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { getWatchData } from '@/lib/watch';
import {
  buildBreadcrumbJsonLd,
  buildVideoCollectionJsonLd,
} from '@/lib/watch/schema-org';
import { resolveDescription, resolveTitle } from '@/lib/site-metadata';
import { resolveBaseUrl } from '@/lib/site-url';
import { ResourceIndexEmptyState } from '@/components/resource-index-card';
import { WatchVideoCard } from '@/components/watch-video-card';
import { JsonLd } from '@/components/json-ld';
import type { WatchVideo } from '@/lib/watch';

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
  const selfPath = `/r/${locale}/watch`;
  const selfUrl = `${baseUrl}${selfPath}`;
  // SEO: declare the English index as canonical so ranking signals
  // consolidate on one page across locales. Same approach as the blog
  // index — hreflang alternates below make translated versions
  // discoverable without diluting authority across duplicates.
  const canonicalUrl = `${baseUrl}/r/en/watch`;
  const ogImagePath = `${selfPath}/opengraph-image`;
  const ogImageUrl = `${baseUrl}${ogImagePath}`;
  const title = resolveTitle(locale);
  const description = resolveDescription(locale);
  const twitterHandle = '@namefi_io';

  const languageAlternates: Partial<Record<Locale, string>> = {};
  for (const localeOption of i18n.locales) {
    languageAlternates[localeOption] = `${baseUrl}/r/${localeOption}/watch`;
  }

  return {
    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates,
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

function VideoGrid({
  videos,
  locale,
  dateFormatter,
}: {
  videos: WatchVideo[];
  locale: Locale;
  dateFormatter: Intl.DateTimeFormat;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <WatchVideoCard
          key={video.videoId}
          href={`/${locale}/watch/${video.videoId}`}
          title={video.title}
          thumbnailUrl={video.thumbnailUrl}
          durationSeconds={video.durationSeconds}
          publishedAt={video.publishedAt}
          dateFormatter={dateFormatter}
        />
      ))}
    </div>
  );
}

export default async function WatchIndex({
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
  const data = await getWatchData();
  const dateLocale = localeDateLocales[locale] ?? localeDateLocales.en;
  const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
    dateStyle: 'long',
  });
  const baseUrl = resolveBaseUrl();
  // Match the canonical URL declared in generateMetadata so the JSON-LD
  // CollectionPage.@id / url and the HTML <link rel="canonical"> agree.
  // Mismatched canonicals cause Google to distrust the structured data.
  const canonicalUrl = `${baseUrl}/r/en/watch`;

  const isEmpty =
    data.featured.length === 0 &&
    data.extras.length === 0 &&
    data.playlists.every((p) => p.videos.length === 0);

  const collectionJsonLd = buildVideoCollectionJsonLd(data.all, {
    baseUrl,
    canonicalUrl,
    locale,
    name: dictionary.watch.indexTitle,
    description: dictionary.watch.indexDescription,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: dictionary.nav.resources, url: `${baseUrl}/r/${locale}` },
    { name: dictionary.nav.watch, url: canonicalUrl },
  ]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-12 md:px-10 lg:px-12">
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {dictionary.watch.indexTitle}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {dictionary.watch.indexDescription}
        </p>
      </header>

      {isEmpty && (
        <ResourceIndexEmptyState>
          {dictionary.watch.indexEmpty}
        </ResourceIndexEmptyState>
      )}

      {data.featured.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary">
            {dictionary.watch.featuredTitle}
          </h2>
          <VideoGrid
            videos={data.featured}
            locale={locale}
            dateFormatter={dateFormatter}
          />
        </section>
      )}

      {data.playlists.map((playlist) =>
        playlist.videos.length === 0 ? null : (
          <section key={playlist.playlistId} className="space-y-5">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {playlist.title}
              </h2>
              {playlist.description && (
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {playlist.description}
                </p>
              )}
            </div>
            <VideoGrid
              videos={playlist.videos}
              locale={locale}
              dateFormatter={dateFormatter}
            />
          </section>
        ),
      )}

      {data.extras.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {dictionary.watch.otherTitle}
          </h2>
          <VideoGrid
            videos={data.extras}
            locale={locale}
            dateFormatter={dateFormatter}
          />
        </section>
      )}
    </section>
  );
}
