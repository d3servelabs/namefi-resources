import { createHash } from 'node:crypto';
import { decode as decodeEntities } from 'entities';
import {
  extractDomainsFromText,
  normalizePublicHttpUrl,
} from './normalization';

export type NamefiFeedMarketplaceRssSource = 'dnforum' | 'namepros';

export interface NamefiFeedMarketplaceRssFeed {
  id: string;
  source: NamefiFeedMarketplaceRssSource;
  title: string;
  url: string;
  allowedCategories: readonly string[];
}

export interface NamefiFeedMarketplaceRssItem {
  feed: NamefiFeedMarketplaceRssFeed;
  guid: string;
  externalPostId: string;
  title: string;
  description: string;
  contentHtml: string;
  text: string;
  link: string;
  sourceUrl: string;
  category: string;
  authorRaw: string | null;
  authorUsername: string | null;
  authorDisplayName: string | null;
  postedAt: Date;
  candidateUrls: string[];
  domains: string[];
  contentHash: string;
}

const NAMEPROS_MARKETPLACE_CATEGORIES = [
  'Top Domains',
  'Exclusive Domains For Sale',
  'Fixed Price',
  'Buy Now: Minimum $100',
  'Buy Now: Minimum $500',
  'Make an Offer',
  'Make Offer: Minimum $100',
  'Make Offer: Minimum $500',
  'Domain Auctions',
  'External Domain and Website Sales',
  'Bargain Bin',
  'Liquid Domains for Sale',
  'Numeric Domains for Sale',
  'Brandable Domains for Sale',
  'Traffic Domains for Sale',
  'New generic top-level domains (New gTLDs)',
  'Country code top-level domains (ccTLDs)',
] as const;

export const NAMEFI_FEED_MARKETPLACE_RSS_FEEDS = [
  {
    id: 'dnforum-com-domain-market',
    source: 'dnforum',
    title: 'DNForum .com Domain Market',
    url: 'https://www.dnforum.com/forums/com-domain-marketplace/index.rss',
    allowedCategories: ['.com Domain Market'],
  },
  {
    id: 'dnforum-gtld-domain-market',
    source: 'dnforum',
    title: 'DNForum gTLD Domain Market',
    url: 'https://www.dnforum.com/forums/gtld-domain-marketplace/index.rss',
    allowedCategories: ['gTLD Domain Market'],
  },
  {
    id: 'dnforum-cctld-domain-market',
    source: 'dnforum',
    title: 'DNForum ccTLD Domain Market',
    url: 'https://www.dnforum.com/forums/cctld-domain-marketplace/index.rss',
    allowedCategories: ['ccTLD Domain Market'],
  },
  {
    id: 'namepros-buy-domains',
    source: 'namepros',
    title: 'NamePros Buy Domains',
    url: 'https://www.namepros.com/marketplace/buy-domains/index.rss',
    allowedCategories: NAMEPROS_MARKETPLACE_CATEGORIES,
  },
  {
    id: 'namepros-top-domains',
    source: 'namepros',
    title: 'NamePros Top Domains',
    url: 'https://www.namepros.com/forums/top-domains.122/index.rss',
    allowedCategories: ['Top Domains'],
  },
  {
    id: 'namepros-fixed-price',
    source: 'namepros',
    title: 'NamePros Fixed Price',
    url: 'https://www.namepros.com/forums/fixed-price.115/index.rss',
    allowedCategories: ['Fixed Price'],
  },
  {
    id: 'namepros-buy-now-minimum-100',
    source: 'namepros',
    title: 'NamePros Buy Now: Minimum $100',
    url: 'https://www.namepros.com/forums/buy-now-minimum-100.220/index.rss',
    allowedCategories: ['Buy Now: Minimum $100'],
  },
  {
    id: 'namepros-buy-now-minimum-500',
    source: 'namepros',
    title: 'NamePros Buy Now: Minimum $500',
    url: 'https://www.namepros.com/forums/buy-now-minimum-500.221/index.rss',
    allowedCategories: ['Buy Now: Minimum $500'],
  },
  {
    id: 'namepros-make-an-offer',
    source: 'namepros',
    title: 'NamePros Make an Offer',
    url: 'https://www.namepros.com/forums/make-an-offer.4/index.rss',
    allowedCategories: ['Make an Offer'],
  },
  {
    id: 'namepros-make-offer-minimum-100',
    source: 'namepros',
    title: 'NamePros Make Offer: Minimum $100',
    url: 'https://www.namepros.com/forums/make-offer-minimum-100.224/index.rss',
    allowedCategories: ['Make Offer: Minimum $100'],
  },
  {
    id: 'namepros-make-offer-minimum-500',
    source: 'namepros',
    title: 'NamePros Make Offer: Minimum $500',
    url: 'https://www.namepros.com/forums/make-offer-minimum-500.225/index.rss',
    allowedCategories: ['Make Offer: Minimum $500'],
  },
  {
    id: 'namepros-domain-auctions',
    source: 'namepros',
    title: 'NamePros Domain Auctions',
    url: 'https://www.namepros.com/forums/domain-auctions.63/index.rss',
    allowedCategories: ['Domain Auctions'],
  },
  {
    id: 'namepros-external-sales',
    source: 'namepros',
    title: 'NamePros External Sales',
    url: 'https://www.namepros.com/forums/external-domain-and-website-sales.162/index.rss',
    allowedCategories: ['External Domain and Website Sales'],
  },
  {
    id: 'namepros-bargain-bin',
    source: 'namepros',
    title: 'NamePros Bargain Bin',
    url: 'https://www.namepros.com/forums/bargain-bin.168/index.rss',
    allowedCategories: ['Bargain Bin'],
  },
  {
    id: 'namepros-liquid-domains',
    source: 'namepros',
    title: 'NamePros Liquid Domains',
    url: 'https://www.namepros.com/forums/liquid-domains-for-sale.338/index.rss',
    allowedCategories: ['Liquid Domains for Sale'],
  },
  {
    id: 'namepros-numeric-domains',
    source: 'namepros',
    title: 'NamePros Numeric Domains',
    url: 'https://www.namepros.com/forums/numeric-domains-for-sale.351/index.rss',
    allowedCategories: ['Numeric Domains for Sale'],
  },
  {
    id: 'namepros-brandable-domains',
    source: 'namepros',
    title: 'NamePros Brandable Domains',
    url: 'https://www.namepros.com/forums/brandable-domains-for-sale.364/index.rss',
    allowedCategories: ['Brandable Domains for Sale'],
  },
  {
    id: 'namepros-traffic-domains',
    source: 'namepros',
    title: 'NamePros Traffic Domains',
    url: 'https://www.namepros.com/forums/traffic-domains-for-sale.119/index.rss',
    allowedCategories: ['Traffic Domains for Sale'],
  },
  {
    id: 'namepros-new-gtlds',
    source: 'namepros',
    title: 'NamePros New gTLDs',
    url: 'https://www.namepros.com/forums/new-generic-top-level-domains-new-gtlds.300/index.rss',
    allowedCategories: ['New generic top-level domains (New gTLDs)'],
  },
  {
    id: 'namepros-cctlds',
    source: 'namepros',
    title: 'NamePros ccTLDs',
    url: 'https://www.namepros.com/forums/country-code-top-level-domains-cctlds.120/index.rss',
    allowedCategories: ['Country code top-level domains (ccTLDs)'],
  },
] as const satisfies readonly NamefiFeedMarketplaceRssFeed[];

const ITEM_PATTERN = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
const HREF_PATTERN = /\bhref\s*=\s*(["'])([\s\S]*?)\1/gi;
const PLAIN_URL_PATTERN = /\bhttps?:\/\/[^\s<>"')]+/gi;
const THREAD_ID_PATTERN = /\/threads\/[^/]*\.(\d+)(?:\/|$)/i;
const CDATA_PATTERN = /^<!\[CDATA\[([\s\S]*)\]\]>$/;
const HTML_BLOCK_BREAK_PATTERN =
  /<(?:br|\/p|\/div|\/li|\/tr|\/h[1-6])\b[^>]*>/gi;
const HTML_TAG_PATTERN = /<[^>]+>/g;
const WHITESPACE_PATTERN = /\s+/g;
const AUTHOR_HTML_TAG_PATTERN = /<[^>]*>/g;
const AUTHOR_DISPLAY_NAME_PATTERN = /\(([^)]+)\)\s*$/;
const AUTHOR_EMAIL_SUFFIX_PATTERN = /\s*\([^)]*\)\s*$/;
const AUTHOR_USERNAME_PREFIX_PATTERN = /^@/;
const URL_QUERY_OR_HASH_PATTERN = /[?#].*$/;
const TRAILING_SLASH_PATTERN = /\/$/;
const MAX_CANDIDATE_URLS = 12;

export function parseNamefiFeedMarketplaceRss(
  xml: string,
  feed: NamefiFeedMarketplaceRssFeed,
): NamefiFeedMarketplaceRssItem[] {
  const items: NamefiFeedMarketplaceRssItem[] = [];

  for (const match of xml.matchAll(ITEM_PATTERN)) {
    const itemXml = match[1] ?? '';
    const parsed = parseMarketplaceRssItem(itemXml, feed);
    if (parsed) {
      items.push(parsed);
    }
  }

  return items;
}

export function shouldQueueNamefiFeedMarketplaceRssItem(
  item: NamefiFeedMarketplaceRssItem,
): boolean {
  if (!item.text) {
    return false;
  }
  return item.feed.allowedCategories.includes(item.category);
}

function parseMarketplaceRssItem(
  itemXml: string,
  feed: NamefiFeedMarketplaceRssFeed,
): NamefiFeedMarketplaceRssItem | null {
  const title = compactText(decodeXml(extractXmlTag(itemXml, 'title')));
  const description = decodeXml(extractXmlTag(itemXml, 'description'));
  const contentHtml =
    decodeXml(extractXmlTag(itemXml, 'content:encoded')) || description;
  const link = normalizePublicHttpUrl(
    decodeXml(extractXmlTag(itemXml, 'link')),
  );
  const guid = compactText(decodeXml(extractXmlTag(itemXml, 'guid')));
  const category = compactText(decodeXml(extractXmlTag(itemXml, 'category')));
  const pubDate = compactText(decodeXml(extractXmlTag(itemXml, 'pubDate')));
  const authorRaw =
    compactText(decodeXml(extractXmlTag(itemXml, 'author'))) ||
    compactText(decodeXml(extractXmlTag(itemXml, 'dc:creator'))) ||
    null;
  const sourceUrl = link ?? normalizePublicHttpUrl(guid);

  if (!title || !sourceUrl) {
    return null;
  }

  const postedAt = pubDate ? new Date(pubDate) : new Date();
  if (Number.isNaN(postedAt.getTime())) {
    return null;
  }

  const bodyText = htmlToText(contentHtml || description);
  const text = compactText(
    [
      `Source: ${feed.title}`,
      category ? `Category: ${category}` : null,
      `Title: ${title}`,
      bodyText ? `Post: ${bodyText}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  );
  const candidateUrls = collectCandidateUrls(
    sourceUrl,
    contentHtml,
    description,
  );
  const domains = extractDomainsFromText(`${title}\n${bodyText}`);
  const author = parseAuthor(authorRaw);

  return {
    feed,
    guid,
    externalPostId: buildExternalPostId(sourceUrl, guid),
    title,
    description: htmlToText(description),
    contentHtml,
    text,
    link: sourceUrl,
    sourceUrl,
    category,
    authorRaw,
    authorUsername: author.username,
    authorDisplayName: author.displayName,
    postedAt,
    candidateUrls,
    domains,
    contentHash: hashMarketplaceRssItemContent({
      title,
      category,
      contentHtml,
      sourceUrl,
    }),
  };
}

function extractXmlTag(xml: string, tagName: string): string {
  const pattern = new RegExp(
    `<${escapeRegExp(tagName)}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapeRegExp(
      tagName,
    )}>`,
    'i',
  );
  return unwrapCdata(xml.match(pattern)?.[1]?.trim() ?? '');
}

function unwrapCdata(value: string): string {
  return value.match(CDATA_PATTERN)?.[1] ?? value;
}

function decodeXml(value: string): string {
  return decodeEntities(value).trim();
}

function htmlToText(value: string): string {
  return compactText(
    decodeEntities(
      value
        .replace(HTML_BLOCK_BREAK_PATTERN, '\n')
        .replace(HTML_TAG_PATTERN, ' '),
    ),
  );
}

function compactText(value: string): string {
  return value.replace(WHITESPACE_PATTERN, ' ').trim();
}

function collectCandidateUrls(...values: Array<string | null>): string[] {
  const urls = new Set<string>();

  for (const value of values) {
    if (!value) {
      continue;
    }

    for (const match of value.matchAll(HREF_PATTERN)) {
      addCandidateUrl(urls, decodeEntities(match[2] ?? ''));
    }
    for (const match of value.matchAll(PLAIN_URL_PATTERN)) {
      addCandidateUrl(urls, decodeEntities(match[0] ?? ''));
    }
  }

  return Array.from(urls).slice(0, MAX_CANDIDATE_URLS);
}

function addCandidateUrl(urls: Set<string>, candidate: string) {
  const normalized = normalizePublicHttpUrl(candidate);
  if (normalized) {
    urls.add(normalized);
  }
}

function parseAuthor(authorRaw: string | null): {
  username: string | null;
  displayName: string | null;
} {
  if (!authorRaw) {
    return { username: null, displayName: null };
  }

  const parenthesizedName = authorRaw
    .match(AUTHOR_DISPLAY_NAME_PATTERN)?.[1]
    ?.trim();
  const fallbackName = authorRaw
    .replace(AUTHOR_HTML_TAG_PATTERN, '')
    .replace(AUTHOR_EMAIL_SUFFIX_PATTERN, '')
    .trim();
  const displayName = parenthesizedName || fallbackName || null;
  const username = displayName
    ? displayName.replace(AUTHOR_USERNAME_PREFIX_PATTERN, '').trim() || null
    : null;

  return { username, displayName };
}

function buildExternalPostId(sourceUrl: string, guid: string): string {
  const threadId = sourceUrl.match(THREAD_ID_PATTERN)?.[1];
  if (threadId) {
    return threadId;
  }

  const normalizedGuid = guid.trim();
  if (normalizedGuid && !normalizedGuid.startsWith('http')) {
    return normalizedGuid;
  }

  return sourceUrl
    .replace(URL_QUERY_OR_HASH_PATTERN, '')
    .replace(TRAILING_SLASH_PATTERN, '');
}

function hashMarketplaceRssItemContent(input: {
  title: string;
  category: string;
  contentHtml: string;
  sourceUrl: string;
}): string {
  return createHash('sha256')
    .update(input.title)
    .update('\n')
    .update(input.category)
    .update('\n')
    .update(input.contentHtml)
    .update('\n')
    .update(input.sourceUrl)
    .digest('hex');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
