import type { MlsListing } from '@namefi-astra/common/contract/mls-contract';
import { normalizePublicHttpUrl } from './normalization';

const DEFAULT_FEED_TITLE = 'Namefi Domain Sales Feed';
const DEFAULT_FEED_DESCRIPTION =
  'Latest public domain sale listings detected by the Namefi feed ingestion pipeline.';
const DEFAULT_FEED_LANGUAGE = 'en-US';
const MAX_MESSAGE_DESCRIPTION_LENGTH = 280;

export interface BuildNamefiFeedRssXmlOptions {
  rows: ReadonlyArray<MlsListing>;
  feedUrl: string;
  siteUrl: string;
  generatedAt?: Date;
  feedTitle?: string;
  feedDescription?: string;
}

export function buildNamefiFeedRssXml({
  rows,
  feedUrl,
  siteUrl,
  generatedAt = new Date(),
  feedTitle = DEFAULT_FEED_TITLE,
  feedDescription = DEFAULT_FEED_DESCRIPTION,
}: BuildNamefiFeedRssXmlOptions): string {
  const latestPublishedAt =
    rows.reduce<Date | null>((latest, row) => {
      const candidate = coerceDate(row.postedAt);
      if (!candidate) {
        return latest;
      }
      return !latest || candidate > latest ? candidate : latest;
    }, null) ?? generatedAt;
  const items = rows.map((row) => buildItemXml(row)).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(feedTitle)}</title>`,
    `    <description>${escapeXml(feedDescription)}</description>`,
    `    <link>${escapeXml(siteUrl)}</link>`,
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    `    <language>${DEFAULT_FEED_LANGUAGE}</language>`,
    `    <lastBuildDate>${escapeXml(latestPublishedAt.toUTCString())}</lastBuildDate>`,
    '    <ttl>10</ttl>',
    items,
    '  </channel>',
    '</rss>',
  ].join('\n');
}

function buildItemXml(row: MlsListing): string {
  const publishedAt = coerceDate(row.postedAt) ?? new Date();
  const askingLabel = formatAsking(row.askingPrice, row.askingCurrency);
  const sellerLabel = resolveSellerLabel(row);
  const sourceTweetUrl = normalizeAbsoluteUrl(row.sourceTweetUrl);
  const itemLink =
    normalizeAbsoluteUrl(row.purchaseUrl) ??
    sourceTweetUrl ??
    'https://namefi.io';
  const titleParts = [row.domain.trim()];

  if (askingLabel) {
    titleParts.push(askingLabel);
  }
  if (sellerLabel) {
    titleParts.push(`by ${sellerLabel}`);
  }

  return [
    '    <item>',
    `      <title>${escapeXml(titleParts.join(' | '))}</title>`,
    `      <guid isPermaLink="false">${escapeXml(`domain-sale-${row.id}`)}</guid>`,
    `      <pubDate>${escapeXml(publishedAt.toUTCString())}</pubDate>`,
    `      <link>${escapeXml(itemLink)}</link>`,
    `      <description>${escapeXml(buildDescription(row, askingLabel, sellerLabel, itemLink))}</description>`,
    '    </item>',
  ].join('\n');
}

function buildDescription(
  row: MlsListing,
  askingLabel: string | null,
  sellerLabel: string | null,
  itemLink: string,
): string {
  const purchaseUrl = normalizeAbsoluteUrl(row.purchaseUrl);
  const messageText = normalizeText(row.messageText);
  return [
    `Domain: ${row.domain}`,
    askingLabel ? `Asking: ${askingLabel}` : null,
    `Seller: ${sellerLabel ?? 'unknown'}`,
    purchaseUrl ? `Purchase URL: ${purchaseUrl}` : null,
    `Source tweet: ${normalizeAbsoluteUrl(row.sourceTweetUrl) ?? '-'}`,
    messageText
      ? `Source text: ${truncateText(messageText, MAX_MESSAGE_DESCRIPTION_LENGTH)}`
      : null,
    `Open listing: ${itemLink}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
}

function formatAsking(
  askingPrice: string | null,
  askingCurrency: string | null,
): string | null {
  const price = normalizeText(askingPrice);
  const currency = normalizeText(askingCurrency);
  if (!price) {
    return null;
  }
  return currency ? `${price} ${currency}` : price;
}

function resolveSellerLabel(row: MlsListing): string | null {
  return (
    normalizeText(row.seller.username) ?? normalizeText(row.seller.displayName)
  );
}

function normalizeText(value: string | null | undefined): string | null {
  const normalized = value?.trim().replace(/\s+/g, ' ') ?? '';
  return normalized ? normalized : null;
}

function normalizeAbsoluteUrl(value: string | null | undefined): string | null {
  return normalizePublicHttpUrl(value);
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function coerceDate(value: string | Date): Date | null {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
