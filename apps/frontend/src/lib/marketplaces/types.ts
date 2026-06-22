import type { Address } from 'viem';

/** Stable identifier for a marketplace adapter. */
export type MarketplaceId = 'opensea' | 'rarible' | 'okx';

/** Listing types a marketplace may support. */
export type ListingType = 'fixed-price' | 'english-auction' | 'dutch-auction';

/** Status of an order on a marketplace orderbook. */
export type OrderStatus = 'active' | 'filled' | 'cancelled' | 'expired';

/**
 * Currency descriptor for a marketplace payment token.
 * `isNative` distinguishes the chain's native asset (ETH) from ERC-20s (WETH/USDC).
 */
export interface ListingCurrency {
  /** Lowercased ERC-20 contract address. Native ETH uses the zero address. */
  contract: Address;
  name: string;
  symbol: string;
  decimals: number;
  isNative: boolean;
}

/**
 * Price in both raw and human-friendly forms.
 * The `decimal` field is for display only — never use it for math.
 */
export interface ListingPrice {
  /** Wei amount as a decimal string (avoids JSON BigInt encoding issues). */
  raw: string;
  /** Number for display only. */
  decimal: number;
  currency: ListingCurrency;
}

/** A single active listing returned by a marketplace adapter. */
export interface Listing {
  /** Order hash from the marketplace orderbook — stable identifier. */
  id: string;
  marketplace: MarketplaceId;
  /** Human-readable source name shown in UI ("OpenSea"). */
  source: string;
  tokenAddress: Address;
  tokenId: string;
  seller: Address;
  price: ListingPrice;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  expirationTime: string;
  status: OrderStatus;
  /** Direct link to view / edit the listing on the marketplace. */
  externalUrl: string;
  /** Adapter-specific opaque blob needed for cancel/update operations. */
  raw: unknown;
}

/** An incoming offer/bid on a token. */
export interface Offer {
  /** Order hash from the marketplace orderbook — stable identifier. */
  id: string;
  marketplace: MarketplaceId;
  source: string;
  tokenAddress: Address;
  tokenId: string;
  /** Address that placed the bid. */
  bidder: Address;
  price: ListingPrice;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  expirationTime: string;
  status: OrderStatus;
  /** Direct link to view the offer on the marketplace. */
  externalUrl: string;
  /** Adapter-specific opaque blob needed for accept/reject operations. */
  raw: unknown;
}

export interface ListingInput {
  tokenAddress: Address;
  tokenId: string;
  /** Listing price in wei (regardless of currency decimals). */
  priceWei: bigint;
  /** Currency contract address — must be one of getAvailableListingCurrency(). */
  currency: Address;
  /** Listing duration in seconds from the effective start. */
  durationSeconds: number;
  listingType: ListingType;
  /** Unix seconds. Defaults to now. */
  startTimeSeconds?: number;
  /**
   * Dutch-auction only: the price the listing decays to at expiration, in wei.
   * Must be <= priceWei (the start price). Required when listingType === 'dutch-auction'.
   */
  endPriceWei?: bigint;
}

export interface ListingFees {
  /** Marketplace protocol fee in basis points (e.g. 250 = 2.5%). */
  marketplaceFeeBps: number;
  /** Creator royalty in basis points. */
  royaltyFeeBps: number;
  /** Seller take-home in wei after fees. */
  netToSellerWei: bigint;
  /** True when fees were estimated rather than queried from the marketplace. */
  isEstimate: boolean;
}

export interface ListingsQuery {
  tokenAddress: Address;
  tokenId: string;
}

export type OffersQuery = ListingsQuery;

/**
 * Per-adapter capability discovery — the panel uses these flags to skip
 * adapters that don't support a given query scope, instead of try/catching
 * around `MarketplaceUnsupportedOperationError`.
 *
 * `byToken` (the existing `getExistingListings` / `getOffersForListing`)
 * is implicit — every adapter supports it — so it isn't listed here.
 */
export interface MarketplaceCapabilities {
  /**
   * Adapter can query listings/offers by maker (wallet) address.
   * Implementations may optionally accept a `collectionAddress` to narrow
   * the result to a single collection.
   */
  readonly byMaker: boolean;
  /**
   * Adapter can query all listings/offers in a collection *without* a maker
   * filter (the OpenSea "all listings for collection X" endpoint). Adapters
   * whose only maker endpoint requires the collection as a filter (Rarible)
   * still report `false` here.
   */
  readonly byCollection: boolean;
  /**
   * Adapter can FULFILL (buy) an existing listing from the buyer's wallet — the
   * in-app "Buy Now" flow. Adapters without a buyer-side fulfillment path report
   * `false`, and the UI hides their Buy-Now button (the card falls back to the
   * external marketplace link).
   */
  readonly canFulfillListing: boolean;
}

/**
 * Query args for "all my listings (or offers) across a chain".
 * `collectionAddress` is optional — when set, narrows to a single collection.
 */
export interface MakerListingsQuery {
  makerAddress: Address;
  collectionAddress?: Address;
}

export type MakerOffersQuery = MakerListingsQuery;

/** Query args for "all listings (or offers) in a collection, no maker filter". */
export interface CollectionListingsQuery {
  collectionAddress: Address;
}

export type CollectionOffersQuery = CollectionListingsQuery;
