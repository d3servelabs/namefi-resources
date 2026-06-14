import type { Locale } from '@/i18n-config';

// Shared Schema.org publisher payload referenced by every structured-data
// payload (articles, videos, collections) so the Organization is consistently
// described and de-duplicated by @id on the Google side.
export function buildPublisher(baseUrl: string): Record<string, unknown> {
  return {
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'Namefi',
    url: 'https://namefi.io',
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/r/logotype.svg`,
    },
    sameAs: [
      'https://x.com/namefi_io',
      'https://www.youtube.com/@namefi',
      'https://github.com/d3servelabs',
    ],
  };
}

export type Breadcrumb = { name: string; url: string };

export function buildBreadcrumbJsonLd(
  items: readonly Breadcrumb[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export type ArticleAuthor = {
  name: string;
  // Optional canonical profile (twitter/linkedin/site) so the author resolves
  // to a stable entity rather than a bare string.
  url?: string;
};

// Emits a BlogPosting payload for long-form posts. BlogPosting is the most
// specific Article subtype Google recognizes for editorial content and unlocks
// the Article rich result (headline, author, dates) while giving LLM crawlers a
// clean, machine-readable summary of the page's main entity.
export function buildArticleJsonLd(options: {
  headline: string;
  description?: string;
  url: string;
  canonicalUrl: string;
  imageUrl: string;
  datePublished: string;
  dateModified?: string;
  authors: readonly ArticleAuthor[];
  baseUrl: string;
  locale: Locale;
  keywords?: readonly string[];
}): Record<string, unknown> {
  const authors = options.authors.map((author) => ({
    '@type': 'Person',
    name: author.name,
    ...(author.url ? { url: author.url } : {}),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${options.canonicalUrl}#article`,
    headline: options.headline,
    ...(options.description ? { description: options.description } : {}),
    image: [options.imageUrl],
    datePublished: options.datePublished,
    dateModified: options.dateModified ?? options.datePublished,
    inLanguage: options.locale,
    url: options.url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': options.canonicalUrl,
    },
    ...(authors.length > 0 ? { author: authors } : {}),
    publisher: buildPublisher(options.baseUrl),
    ...(options.keywords && options.keywords.length > 0
      ? { keywords: options.keywords.join(', ') }
      : {}),
  };
}
