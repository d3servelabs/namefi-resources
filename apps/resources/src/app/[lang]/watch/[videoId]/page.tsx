import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '@/i18n-config';
import { i18n, localeDateLocales } from '@/i18n-config';
import { getDictionary } from '@/get-dictionary';
import { getWatchVideo, getWatchVideos } from '@/lib/watch';
import { formatChapterTime } from '@/lib/watch/chapters';
import { buildVideoObjectJsonLd } from '@/lib/watch/schema-org';
import { buildBreadcrumbJsonLd } from '@/lib/structured-data';
import { resolveBaseUrl } from '@/lib/site-url';
import { resolveTitle } from '@/lib/site-metadata';
import { YouTubeLite } from '@/components/youtube-lite';
import { JsonLd } from '@/components/json-ld';

export async function generateStaticParams() {
  const videos = await getWatchVideos();
  const params: Array<{ lang: Locale; videoId: string }> = [];
  for (const locale of i18n.locales) {
    for (const video of videos) {
      params.push({ lang: locale, videoId: video.videoId });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; videoId: string }>;
}): Promise<Metadata> {
  const { lang, videoId } = await params;
  const locale = lang as Locale;
  const video = await getWatchVideo(videoId);

  if (!video) return {};

  const baseUrl = resolveBaseUrl();
  const selfPath = `/r/${locale}/watch/${videoId}`;
  const selfUrl = `${baseUrl}${selfPath}`;
  const canonicalUrl =
    locale === 'en' ? selfUrl : `${baseUrl}/r/en/watch/${videoId}`;
  const ogImageUrl = video.thumbnailUrl;
  const siteName = resolveTitle(locale);
  const publishedTime = video.publishedAt.toISOString();
  const twitterHandle = '@namefi_io';
  const description = video.description
    .split('\n')
    .slice(0, 3)
    .join(' ')
    .trim();

  const languageAlternates: Partial<Record<Locale, string>> = {};
  for (const localeOption of i18n.locales) {
    languageAlternates[localeOption] =
      `${baseUrl}/r/${localeOption}/watch/${videoId}`;
  }

  return {
    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates,
    },
    title: video.title,
    description,
    openGraph: {
      title: video.title,
      description,
      url: selfUrl,
      locale,
      type: 'video.other',
      siteName,
      videos: [
        {
          url: `https://www.youtube.com/watch?v=${videoId}`,
          secureUrl: `https://www.youtube.com/watch?v=${videoId}`,
          type: 'text/html',
          width: 1280,
          height: 720,
        },
      ],
      images: [
        {
          url: ogImageUrl,
          width: 1280,
          height: 720,
          alt: video.title,
        },
      ],
    },
    // summary_large_image renders the thumbnail prominently and works without
    // additional player setup. Twitter's `player` card requires a separate
    // whitelisted iframe URL we don't host today.
    twitter: {
      card: 'summary_large_image',
      title: video.title,
      description,
      images: [ogImageUrl],
      site: twitterHandle,
      creator: twitterHandle,
    },
    other: {
      'video:duration': String(video.durationSeconds),
      'video:release_date': publishedTime,
    },
  };
}

export default async function WatchVideoPage({
  params,
}: {
  params: Promise<{ lang: string; videoId: string }>;
}) {
  const { lang, videoId } = await params;
  if (!i18n.locales.includes(lang as Locale)) {
    notFound();
  }
  const locale = lang as Locale;
  const dictionary = await getDictionary(locale);
  const video = await getWatchVideo(videoId);

  if (!video) {
    notFound();
  }

  const dateLocale = localeDateLocales[locale] ?? localeDateLocales.en;
  const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
    dateStyle: 'long',
  });
  const baseUrl = resolveBaseUrl();
  const canonicalUrl =
    locale === 'en'
      ? `${baseUrl}/r/${locale}/watch/${videoId}`
      : `${baseUrl}/r/en/watch/${videoId}`;
  const watchUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
  const videoJsonLd = buildVideoObjectJsonLd(video, {
    baseUrl,
    canonicalUrl,
    locale,
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    {
      name: dictionary.nav.resources,
      url: `${baseUrl}/r/${locale}`,
    },
    {
      name: dictionary.nav.watch,
      url: `${baseUrl}/r/${locale}/watch`,
    },
    {
      name: video.title,
      url: `${baseUrl}/r/${locale}/watch/${videoId}`,
    },
  ]);

  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12 text-start md:px-10 lg:px-12">
      <Link
        href={`/${locale}/watch`}
        className="inline-flex w-fit items-center rounded-full border border-border/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground transition hover:border-brand-primary/60 hover:text-foreground"
      >
        {dictionary.watch.detailBack}
      </Link>

      <YouTubeLite
        videoId={video.videoId}
        title={video.title}
        thumbnailUrl={video.thumbnailUrl}
      />

      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {video.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <time dateTime={video.publishedAt.toISOString()}>
            {dateFormatter.format(video.publishedAt)}
          </time>
          {video.durationSeconds > 0 && (
            <span>{formatChapterTime(video.durationSeconds)}</span>
          )}
          <a
            href={watchUrl}
            target="_blank"
            rel="noreferrer"
            className="text-brand-primary underline-offset-4 hover:underline"
          >
            {dictionary.watch.watchOnYoutube}
          </a>
        </div>
      </header>

      {video.chapters.length > 0 && (
        <section className="surface-card space-y-4 rounded-2xl border border-border/60 bg-card/70 p-6">
          <h2 className="text-lg font-semibold">
            {dictionary.watch.chaptersHeading}
          </h2>
          <ol className="space-y-2 text-sm">
            {video.chapters.map((chapter) => (
              <li key={chapter.startSeconds} className="flex gap-3">
                <a
                  href={`${watchUrl}&t=${chapter.startSeconds}s`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 gap-3 rounded-md px-2 py-1.5 transition hover:bg-white/5"
                >
                  <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {formatChapterTime(chapter.startSeconds)}
                  </span>
                  <span className="text-foreground">{chapter.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      {video.description && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            {dictionary.watch.descriptionHeading}
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {video.description}
          </p>
        </section>
      )}

      <JsonLd data={videoJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
    </article>
  );
}
