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

export const DEFAULT_MLS_FEED_LIMIT = 20;
export const MAX_MLS_FEED_LIMIT = 50;
