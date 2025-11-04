import type { MetadataRoute } from 'next';
import { i18n, type Locale } from '@/i18n-config';
import {
  getAvailableLocalesForGlossary,
  getAvailableLocalesForPartner,
  getAvailableLocalesForSlug,
  getAvailableLocalesForTld,
  getGlossaryCached,
  getGlossaryEntriesForLocale,
  getGlossaryParams,
  getPartnerCached,
  getPartnerParams,
  getPartnersForLocale,
  getPostCached,
  getPostParams,
  getPostsForLocale,
  getTldCached,
  getTldParams,
  getTldsForLocale,
} from '@/lib/content';

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

export function buildSitemapEntries(
  baseUrl: string,
  locales: readonly Locale[],
): MetadataRoute.Sitemap {
  const localeSet = new Set(locales);
  const entries: MetadataRoute.Sitemap = [];

  entries.push(...buildLocaleIndexEntries(baseUrl, locales));

  entries.push(
    ...buildCollectionEntries(baseUrl, {
      params: getPostParams().filter(({ lang }) => localeSet.has(lang)),
      getEntry: getPostCached,
      getLocales: getAvailableLocalesForSlug,
      pathBuilder: (lang, slug) => `/r/${lang}/blog/${slug}`,
      changeFrequency: 'monthly',
      priority: 0.6,
    }),
  );

  entries.push(
    ...buildCollectionEntries(baseUrl, {
      params: getGlossaryParams().filter(({ lang }) => localeSet.has(lang)),
      getEntry: getGlossaryCached,
      getLocales: getAvailableLocalesForGlossary,
      pathBuilder: (lang, slug) => `/r/${lang}/glossary/${slug}`,
      changeFrequency: 'monthly',
      priority: 0.6,
    }),
  );

  entries.push(
    ...buildCollectionEntries(baseUrl, {
      params: getPartnerParams().filter(({ lang }) => localeSet.has(lang)),
      getEntry: getPartnerCached,
      getLocales: getAvailableLocalesForPartner,
      pathBuilder: (lang, slug) => `/r/${lang}/partners/${slug}`,
      changeFrequency: 'monthly',
      priority: 0.6,
    }),
  );

  entries.push(
    ...buildCollectionEntries(baseUrl, {
      params: getTldParams().filter(({ lang }) => localeSet.has(lang)),
      getEntry: getTldCached,
      getLocales: getAvailableLocalesForTld,
      pathBuilder: (lang, slug) => `/r/${lang}/tld/${slug}`,
      changeFrequency: 'monthly',
      priority: 0.6,
    }),
  );

  return entries;
}
