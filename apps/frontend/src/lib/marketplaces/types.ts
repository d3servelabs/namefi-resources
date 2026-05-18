import type { Address } from 'viem';

/** Stable identifier for a marketplace adapter. */
export type MarketplaceId = 'opensea';

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
