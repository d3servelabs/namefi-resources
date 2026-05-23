import type { MetadataRoute } from 'next';
import { i18n, type Locale } from '@/i18n-config';
import {
  getAvailableLocalesForSlug,
  getAvailableLocalesForTld,
  getGlossaryEntriesForLocale,
  getPartnersForLocale,
  getPostCached,
  getPostParams,
  getPostsForLocale,
  getTldCached,
  getTldParams,
  getTldsForLocale,
} from '@/lib/content';
import { getWatchVideos } from '@/lib/watch';
import type { WatchVideo } from '@/lib/watch';

function toAbsoluteUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${path}`;
}

function createLanguageAlternates(
  baseUrl: string,
  locales: readonly Locale[],
  pathBuilder: (locale: Locale) => string,
): Record<string, string> | undefined {
  if (locales.length === 0) return undefined;
  const alternates: Record<string, string> = {};
  for (const locale of locales) {
    alternates[locale] = toAbsoluteUrl(baseUrl, pathBuilder(locale));
  }
  return Object.keys(alternates).length === 0 ? undefined : alternates;
}

function latestDate(dates: Array<Date | undefined>): Date | undefined {
  let latest: Date | undefined;
  for (const date of dates) {
    if (!date) continue;
    if (!latest || date.getTime() > latest.getTime()) {
      latest = date;
    }
  }
  return latest;
}

function createEntry(options: {
  url: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
  lastModified?: Date;
  alternates?: Record<string, string>;
}): MetadataRoute.Sitemap[number] {
  const entry: MetadataRoute.Sitemap[number] = {
    url: options.url,
    changeFrequency: options.changeFrequency,
    priority: options.priority,
  };
  if (options.lastModified) {
    entry.lastModified = options.lastModified;
  }
  if (options.alternates) {
    entry.alternates = { languages: options.alternates };
  }
  return entry;
}

function buildLocaleIndexEntries(
  baseUrl: string,
  locales: readonly Locale[],
  watchLatest: Date | undefined,
): MetadataRoute.Sitemap {
  const homeAlternates = createLanguageAlternates(
    baseUrl,
    i18n.locales,
    (locale) => `/r/${locale}`,
  );
  const blogAlternates = createLanguageAlternates(
    baseUrl,
    i18n.locales,
    (locale) => `/r/${locale}/blog`,
  );
  const glossaryAlternates = createLanguageAlternates(
    baseUrl,
    i18n.locales,
    (locale) => `/r/${locale}/glossary`,
  );
  const partnersAlternates = createLanguageAlternates(
    baseUrl,
    i18n.locales,
    (locale) => `/r/${locale}/partners`,
  );
  const tldAlternates = createLanguageAlternates(
    baseUrl,
    i18n.locales,
    (locale) => `/r/${locale}/tld`,
  );
  const watchAlternates = createLanguageAlternates(
    baseUrl,
    i18n.locales,
    (locale) => `/r/${locale}/watch`,
  );

  return locales.flatMap((locale) => {
    const posts = getPostsForLocale(locale);
    const glossaryEntries = getGlossaryEntriesForLocale(locale);
    const partners = getPartnersForLocale(locale);
    const tlds = getTldsForLocale(locale);

    const homeLastModified = latestDate([
      posts[0]?.publishedAt,
      glossaryEntries[0]?.publishedAt,
      partners[0]?.publishedAt,
      tlds[0]?.publishedAt,
      watchLatest,
    ]);
    const blogLastModified = posts[0]?.publishedAt ?? homeLastModified;
    const glossaryLastModified =
      glossaryEntries[0]?.publishedAt ?? homeLastModified;
    const partnersLastModified = partners[0]?.publishedAt;
    const tldLastModified = tlds[0]?.publishedAt;

    return [
      createEntry({
        url: toAbsoluteUrl(baseUrl, `/r/${locale}`),
        changeFrequency: 'weekly',
        priority: 0.9,
        lastModified: homeLastModified,
        alternates: homeAlternates,
      }),
      createEntry({
        url: toAbsoluteUrl(baseUrl, `/r/${locale}/blog`),
        changeFrequency: 'weekly',
        priority: 0.8,
        lastModified: blogLastModified,
        alternates: blogAlternates,
      }),
      createEntry({
        url: toAbsoluteUrl(baseUrl, `/r/${locale}/watch`),
        changeFrequency: 'weekly',
        priority: 0.7,
        lastModified: watchLatest,
        alternates: watchAlternates,
      }),
      createEntry({
        url: toAbsoluteUrl(baseUrl, `/r/${locale}/glossary`),
        changeFrequency: 'monthly',
        priority: 0.75,
        lastModified: glossaryLastModified,
        alternates: glossaryAlternates,
      }),
      createEntry({
        url: toAbsoluteUrl(baseUrl, `/r/${locale}/partners`),
        changeFrequency: 'monthly',
        priority: 0.7,
        lastModified: partnersLastModified,
        alternates: partnersAlternates,
      }),
      createEntry({
        url: toAbsoluteUrl(baseUrl, `/r/${locale}/tld`),
        changeFrequency: 'monthly',
        priority: 0.7,
        lastModified: tldLastModified,
        alternates: tldAlternates,
      }),
    ];
  });
}

function buildCollectionEntries(
  baseUrl: string,
  options: {
    params: Array<{ lang: Locale; slug: string }>;
    getEntry: (lang: Locale, slug: string) => { publishedAt: Date } | undefined;
    getLocales: (slug: string) => Locale[];
    pathBuilder: (lang: Locale, slug: string) => string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  },
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const { lang, slug } of options.params) {
    const entry = options.getEntry(lang, slug);
    if (!entry) continue;
    entries.push(
      createEntry({
        url: toAbsoluteUrl(baseUrl, options.pathBuilder(lang, slug)),
        changeFrequency: options.changeFrequency,
        priority: options.priority,
        lastModified: entry.publishedAt,
        alternates: createLanguageAlternates(
          baseUrl,
          options.getLocales(slug),
          (locale) => options.pathBuilder(locale, slug),
        ),
      }),
    );
  }
  return entries;
}

export async function buildSitemapEntries(
  baseUrl: string,
  locales: readonly Locale[],
): Promise<MetadataRoute.Sitemap> {
  const localeSet = new Set(locales);
  const entries: MetadataRoute.Sitemap = [];

  // Watch videos pull from YouTube at build/ISR time. Tolerate failures so
  // a transient YouTube outage doesn't break the entire sitemap.
  let watchVideos: Awaited<ReturnType<typeof getWatchVideos>> = [];
  try {
    watchVideos = await getWatchVideos();
  } catch (error) {
    console.error('Failed to load watch videos for sitemap:', error);
  }
  const watchLatest = latestDate(watchVideos.map((video) => video.publishedAt));

  entries.push(...buildLocaleIndexEntries(baseUrl, locales, watchLatest));

  entries.push(
    ...buildCollectionEntries(baseUrl, {
      params: getPostParams().filter(({ lang }) => localeSet.has(lang)),
      getEntry: getPostCached,
      getLocales: getAvailableLocalesForSlug,
      pathBuilder: (lang, slug) => `/r/${lang}/blog/${slug}`,
      changeFrequency: 'monthly',
      // Blog posts are unique long-form content and our highest-value pages.
      // Note: Google ignores <priority>, but Bing/Yandex still respect it and
      // it serves as a declared-intent signal for any future internal tooling.
      priority: 0.8,
    }),
  );

  entries.push(
    ...buildCollectionEntries(baseUrl, {
      params: getTldParams().filter(({ lang }) => localeSet.has(lang)),
      getEntry: getTldCached,
      getLocales: getAvailableLocalesForTld,
      pathBuilder: (lang, slug) => `/r/${lang}/tld/${slug}`,
      changeFrequency: 'monthly',
      // TLD detail pages are templated landing pages; deprioritized vs blog
      // to express our preference that crawl effort favors blog content.
      priority: 0.2,
    }),
  );

  // Watch detail pages are intentionally NOT included here — they live in
  // their own sitemap (/r/sitemap-videos.xml) with Google's <video:video>
  // schema, referenced from /r/sitemap.xml (the sitemap index). This keeps
  // the page sitemap focused on document URLs and lets the video sitemap
  // carry rich video-search metadata (thumbnail, duration, embed URL).

  // Intentionally omitted: glossary and partners detail pages.
  // Both are templated reference content (short entries, similar structure)
  // that Google's quality algorithms tend to deprioritize. Announcing them
  // in the sitemap competes with higher-value blog/tld pages for crawl
  // budget. They remain fully discoverable via internal links from blog
  // posts and TLD pages, and their index pages (/r/en/glossary,
  // /r/en/partners) are still announced via buildLocaleIndexEntries.

  return entries;
}

// XML serialization helpers — used by the route handlers under app/.
// We render XML by hand instead of relying on Next.js's MetadataRoute
// rendering so the video sitemap can declare the xmlns:video namespace
// and emit <video:video> children, which the metadata route type doesn't
// support.

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderSitemapEntry(entry: MetadataRoute.Sitemap[number]): string {
  const parts: string[] = ['  <url>', `    <loc>${escapeXml(entry.url)}</loc>`];
  if (entry.lastModified) {
    const iso =
      entry.lastModified instanceof Date
        ? entry.lastModified.toISOString()
        : entry.lastModified;
    parts.push(`    <lastmod>${escapeXml(iso)}</lastmod>`);
  }
  if (entry.changeFrequency) {
    parts.push(`    <changefreq>${entry.changeFrequency}</changefreq>`);
  }
  if (typeof entry.priority === 'number') {
    parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
  }
  const languageAlternates = entry.alternates?.languages;
  if (languageAlternates) {
    for (const [hreflang, href] of Object.entries(languageAlternates)) {
      if (!href) continue;
      parts.push(
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}" />`,
      );
    }
  }
  parts.push('  </url>');
  return parts.join('\n');
}

export function renderSitemapXml(entries: MetadataRoute.Sitemap): string {
  const body = entries.map(renderSitemapEntry).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;
}

export function renderSitemapIndexXml(
  sitemapUrls: readonly string[],
  lastModified?: Date,
): string {
  const iso = lastModified ? lastModified.toISOString() : undefined;
  const body = sitemapUrls
    .map((url) => {
      const lines = ['  <sitemap>', `    <loc>${escapeXml(url)}</loc>`];
      if (iso) lines.push(`    <lastmod>${escapeXml(iso)}</lastmod>`);
      lines.push('  </sitemap>');
      return lines.join('\n');
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>
`;
}

// Truncates a video description for the <video:description> element, which
// Google caps at 2048 characters. We trim conservatively and append an
// ellipsis when truncation actually happens.
function truncateForVideoDescription(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 2048) return trimmed;
  return `${trimmed.slice(0, 2045).trim()}...`;
}

function renderVideoEntry(baseUrl: string, video: WatchVideo): string {
  const pageUrl = `${baseUrl}/r/en/watch/${video.videoId}`;
  const watchUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${video.videoId}`;
  const description = truncateForVideoDescription(
    video.description || video.title,
  );
  const publicationDate = video.publishedAt.toISOString();
  const videoLines = [
    '    <video:video>',
    `      <video:thumbnail_loc>${escapeXml(video.thumbnailUrl)}</video:thumbnail_loc>`,
    `      <video:title>${escapeXml(video.title)}</video:title>`,
    `      <video:description>${escapeXml(description)}</video:description>`,
    `      <video:player_loc allow_embed="yes">${escapeXml(embedUrl)}</video:player_loc>`,
    `      <video:content_loc>${escapeXml(watchUrl)}</video:content_loc>`,
  ];
  if (video.durationSeconds > 0) {
    // Google supports values between 0 and 28800 (8 hours); clamp to be safe.
    const safeDuration = Math.min(
      Math.max(0, Math.floor(video.durationSeconds)),
      28800,
    );
    videoLines.push(`      <video:duration>${safeDuration}</video:duration>`);
  }
  videoLines.push(
    `      <video:publication_date>${escapeXml(publicationDate)}</video:publication_date>`,
    '      <video:family_friendly>yes</video:family_friendly>',
    `      <video:platform relationship="allow">web mobile tv</video:platform>`,
    '    </video:video>',
  );
  return [
    '  <url>',
    `    <loc>${escapeXml(pageUrl)}</loc>`,
    `    <lastmod>${escapeXml(publicationDate)}</lastmod>`,
    ...videoLines,
    '  </url>',
  ].join('\n');
}

export function renderVideoSitemapXml(
  baseUrl: string,
  videos: readonly WatchVideo[],
): string {
  const body = videos
    .map((video) => renderVideoEntry(baseUrl, video))
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${body}
</urlset>
`;
}
