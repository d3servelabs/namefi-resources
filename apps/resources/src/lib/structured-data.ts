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

// Emits the site-level WebSite node. This is Google's supported lever for the
// site name shown in search results (the bold source label above the title), so
// it carries name/alternateName and links to the Organization publisher by @id.
// Emitted once per page from the locale layout; @id is per-locale to match the
// self-canonical i18n strategy (each locale is its own canonical rendering,
// tied together by hreflang rather than a shared canonical).
export function buildWebsiteJsonLd(options: {
  baseUrl: string;
  locale: Locale;
}): Record<string, unknown> {
  const url = `${options.baseUrl}/r/${options.locale}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}#website`,
    name: 'Namefi',
    alternateName: 'Namefi Resources',
    url,
    inLanguage: options.locale,
    publisher: buildPublisher(options.baseUrl),
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

export type CollectionItem = { name: string; url: string };

// Emits a CollectionPage whose mainEntity is an ordered ItemList. Used by the
// topic-cluster and series hub pages so Google/LLM crawlers see the hub as a
// curated collection of its member articles (the same shape /watch uses for its
// video index), which is what surfaces cluster-style sitelinks/rich results.
export function buildCollectionJsonLd(options: {
  name: string;
  description: string;
  canonicalUrl: string;
  baseUrl: string;
  locale: Locale;
  items: readonly CollectionItem[];
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${options.canonicalUrl}#collection`,
    name: options.name,
    description: options.description,
    url: options.canonicalUrl,
    inLanguage: options.locale,
    publisher: buildPublisher(options.baseUrl),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: options.items.length,
      itemListElement: options.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: item.url,
        name: item.name,
      })),
    },
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

export type DefinedTermItem = { name: string; url: string };

// Emits a DefinedTermSet for the glossary index — a controlled vocabulary whose
// members are the individual glossary terms. DefinedTerm is not a visual Google
// rich result, but it makes the glossary a machine-readable entity set that
// knowledge-graph and AI answer engines can resolve term-by-term. The set @id is
// per-locale so each term page can reference its own locale's set by @id.
export function buildDefinedTermSetJsonLd(options: {
  name: string;
  description: string;
  canonicalUrl: string;
  baseUrl: string;
  locale: Locale;
  terms: readonly DefinedTermItem[];
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': `${options.canonicalUrl}#definedtermset`,
    name: options.name,
    description: options.description,
    url: options.canonicalUrl,
    inLanguage: options.locale,
    publisher: buildPublisher(options.baseUrl),
    hasDefinedTerm: options.terms.map((term) => ({
      '@type': 'DefinedTerm',
      name: term.name,
      url: term.url,
    })),
  };
}

// Emits a DefinedTerm for a single glossary entry, linked back to its locale's
// DefinedTermSet by @id so the term and the set resolve to one graph across the
// glossary index and the term page.
export function buildDefinedTermJsonLd(options: {
  name: string;
  description?: string;
  url: string;
  canonicalUrl: string;
  locale: Locale;
  termSet: { name: string; url: string };
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': `${options.canonicalUrl}#definedterm`,
    name: options.name,
    ...(options.description ? { description: options.description } : {}),
    url: options.url,
    inLanguage: options.locale,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      '@id': `${options.termSet.url}#definedtermset`,
      name: options.termSet.name,
      url: options.termSet.url,
    },
  };
}
