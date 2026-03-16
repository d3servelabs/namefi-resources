import { config } from '@/lib/env';

export interface MlsSaleSeller {
  username: string | null;
  displayName: string | null;
}

export interface MlsSaleListing {
  id: string;
  domain: string;
  askingPrice: string | null;
  askingCurrency: string | null;
  purchaseUrl: string | null;
  messageText: string | null;
  seller: MlsSaleSeller;
  otherDomainsCount: number;
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
  authorId: string | null;
  username: string | null;
  displayName: string | null;
}

export interface MlsSalesByHandlePage {
  handle: string;
  seller: MlsSalesByHandleSeller;
  rows: MlsSaleListing[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
  totalDomains: number;
}

export const DEFAULT_MLS_FEED_LIMIT = 20;
export const MAX_MLS_FEED_LIMIT = 50;
const TRAILING_SLASHES_PATTERN = /\/+$/;
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

  backendUrl.pathname = `${normalizedPath}/mls/feed/rss.xml`;

  return backendUrl.toString();
}
