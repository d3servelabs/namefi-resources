import { config } from '@/lib/env';

export interface MlsSaleSeller {
  username: string | null;
  displayName: string | null;
  namefiDomainsCount?: number;
  tierDomainCount?: number;
}

export interface MlsSaleListingSource {
  id: string;
  label: string;
  kind: 'social' | 'internal_marketplace' | 'external';
  url: string;
}

export interface MlsSaleListing {
  id: string;
  domain: string;
  logoUrl: string | null;
  askingPrice: string | null;
  askingCurrency: string | null;
  purchaseUrl: string | null;
  messageText: string | null;
  seller: MlsSaleSeller;
  otherDomainsCount: number;
  source?: MlsSaleListingSource;
  sourceTweetUrl: string;
  postedAt: string;
  listedAt: string;
}

export interface MlsSalesFeedPage {
  rows: MlsSaleListing[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface MlsSalesByHandleSeller {
  source: MlsSaleListingSource;
  authorId: string | null;
  username: string | null;
  displayName: string | null;
  namefiDomainsCount?: number;
  tierDomainCount?: number;
}

export interface MlsSalesByHandlePage {
  source: MlsSaleListingSource;
  handle: string;
  seller: MlsSalesByHandleSeller;
  rows: MlsSaleListing[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
  totalDomains: number;
}

export type MlsSellerPriority = 'P0' | 'P1' | 'P2';
export type MlsSellerDirectorySortBy =
  | 'salePosts'
  | 'domains'
  | 'recent'
  | 'cadence';
export type MlsSellerDirectorySortOrder = 'asc' | 'desc';

export interface MlsSellerDirectoryRow {
  priority: MlsSellerPriority;
  source: MlsSaleListingSource;
  handle: string;
  displayName: string | null;
  profileUrl: string;
  listingUrl: string;
  salePostCount: number;
  domainCount: number;
  namefiDomainsCount?: number;
  tierDomainCount?: number;
  postsPerWeek: number;
  domainsPerPost: number;
  purchaseUrlCount: number;
  daysSinceLastPost: number;
  activeDays: number;
  firstPostedAt: string;
  lastPostedAt: string;
  latestSourceTweetUrl: string;
  sampleDomains: string[];
  sourceTweetUrls: string[];
}

export interface MlsSellerDirectoryPage {
  rows: MlsSellerDirectoryRow[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
  total: number;
  generatedAt: string;
}

export const DEFAULT_MLS_FEED_LIMIT = 20;
export const MAX_MLS_FEED_LIMIT = 50;
export const DEFAULT_MLS_SELLER_MIN_POSTS = 10;
const TRAILING_SLASHES_PATTERN = /\/+$/;
const SAFE_MLS_URL_PROTOCOLS = new Set(['http:', 'https:']);
const MLS_SOURCE_FALLBACK_URL = buildMlsSourceFallbackUrl();
export const MLS_FEED_RSS_PATH = buildMlsFeedRssUrl();

export const MLS_LISTING_REPORT_REASONS = [
  'already_sold',
  'inaccurate_price',
  'not_for_sale',
  'duplicate_listing',
  'other',
] as const;

export type MlsListingReportReason =
  (typeof MLS_LISTING_REPORT_REASONS)[number];

export function resolveMlsListingSource(
  listing: Pick<MlsSaleListing, 'source' | 'sourceTweetUrl'>,
): MlsSaleListingSource {
  const source = listing.source ?? {
    id: 'x',
    label: 'X',
    kind: 'social',
    url: listing.sourceTweetUrl,
  };

  return {
    ...source,
    url:
      toSafeMlsListingUrl(source.url) ??
      toSafeMlsListingUrl(listing.sourceTweetUrl) ??
      MLS_SOURCE_FALLBACK_URL,
  };
}

export function toSafeMlsListingUrl(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    return SAFE_MLS_URL_PROTOCOLS.has(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export interface MlsCreateListingReportInput {
  listingId: string;
  reason: MlsListingReportReason;
  details?: string;
}

export interface MlsCreateListingReportResponse {
  id: string;
  status: 'active' | 'resolved';
}

function buildMlsFeedRssUrl() {
  const backendUrl = new URL(config.BACKEND_URL);
  const normalizedPath = backendUrl.pathname.replace(
    TRAILING_SLASHES_PATTERN,
    '',
  );

  backendUrl.pathname = `${normalizedPath}/feed/rss.xml`;

  return backendUrl.toString();
}

function buildMlsSourceFallbackUrl() {
  return new URL('/feed', config.FIRST_PARTY_DEPLOYMENT_URL).toString();
}
