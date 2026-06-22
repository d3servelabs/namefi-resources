import type {
  CollectionListingsQuery,
  CollectionOffersQuery,
  Listing,
  ListingCurrency,
  ListingFees,
  ListingInput,
  ListingType,
  ListingsQuery,
  MakerListingsQuery,
  MakerOffersQuery,
  MarketplaceCapabilities,
  MarketplaceId,
  Offer,
  OffersQuery,
} from './types';

/**
 * Abstract marketplace adapter.
 *
 * Implementations are constructed per (marketplace, chain) pair via `getMarketplace()` in
 * `./factory`. They close over viem `publicClient` / `walletClient` instances so individual
 * method calls don't need to pass them.
 *
 * Adapter responsibilities:
 *   - listings (create / read / cancel / update)
 *   - offers (read / accept; reject is a soft op — see `rejectOffer`)
 *   - currency + fee discovery
 */
export interface MarketPlace {
  readonly id: MarketplaceId;
  readonly displayName: string;
  readonly chainId: number;

  // -------- discovery --------

  getAvailableListingTypes(): readonly ListingType[];
  getAvailableListingCurrency(): readonly ListingCurrency[];
  /**
   * Per-adapter capability flags for the maker-/collection-scoped query
   * methods below. Callers should gate `getListingsByMaker` etc. on these
   * instead of try/catching `MarketplaceUnsupportedOperationError`.
   *
   * `byToken` (the existing `getExistingListings` / `getOffersForListing`)
   * is implicit — every adapter supports it — so it isn't part of the shape.
   */
  getCapabilities(): MarketplaceCapabilities;

  /**
   * Estimate fees for a hypothetical listing at the given price.
   * `isEstimate: true` indicates the values are not authoritative (the marketplace
   * recomputes them at signing time using on-chain royalty + protocol fee config).
   */
  calculateListingFees(input: {
    priceWei: bigint;
    currency: ListingCurrency;
    listingType: ListingType;
  }): Promise<ListingFees>;

  // -------- listings (seller side) --------

  createListing(input: ListingInput): Promise<Listing>;
  getExistingListings(query: ListingsQuery): Promise<Listing[]>;
  cancelListing(listing: Listing): Promise<{ txHash?: `0x${string}` }>;
  /**
   * Replace an existing listing with new terms. Implemented as cancel-old + create-new,
   * which produces two wallet prompts (Seaport has no native update operation).
   */
  updateListing(listing: Listing, input: ListingInput): Promise<Listing>;
  /**
   * Fulfill (buy) an existing listing from the connected buyer's wallet —
   * transfers the NFT to the buyer and pays the seller the listing price.
   * Requires a wallet signature + sufficient balance. Adapters that lack a
   * buyer-side fulfillment path report `canFulfillListing: false` from
   * `getCapabilities()` and throw `MarketplaceUnsupportedOperationError`.
   */
  fulfillListing(listing: Listing): Promise<{ txHash?: `0x${string}` }>;

  // -------- offers (buyer side, seller-accepts) --------

  getOffersForListing(query: OffersQuery): Promise<Offer[]>;
  /**
   * Accept an incoming offer — transfers the NFT to the bidder and credits the bid
   * amount to the seller. Requires a wallet signature.
   */
  approveOffer(offer: Offer): Promise<{ txHash?: `0x${string}` }>;
  /**
   * "Reject" an offer. Seaport-style orderbooks don't support active rejection — bids
   * either expire, get filled, or the bidder cancels them. Adapters throw a friendly
   * error so the UI can surface the limitation.
   */
  rejectOffer(offer: Offer): Promise<never>;

  // -------- maker- / collection-scoped queries --------
  //
  // Powers cross-collection / cross-domain panels (e.g. "My listings &
  // offers"). Adapters that can't serve a scope throw
  // `MarketplaceUnsupportedOperationError` and report `false` for the
  // matching `getCapabilities()` flag; the UI gates on the flag.

  /** Listings the maker has open on this chain. */
  getListingsByMaker(query: MakerListingsQuery): Promise<Listing[]>;
  /** Outgoing offers the maker has open on this chain. */
  getOffersByMaker(query: MakerOffersQuery): Promise<Offer[]>;
  /** All active listings in a single collection on this chain. */
  getListingsByCollection(query: CollectionListingsQuery): Promise<Listing[]>;
  /** All active offers in a single collection on this chain. */
  getOffersByCollection(query: CollectionOffersQuery): Promise<Offer[]>;
}

export class MarketplaceNotImplementedError extends Error {
  constructor(method: string) {
    super(`${method} is not implemented`);
    this.name = 'MarketplaceNotImplementedError';
  }
}

export class MarketplaceNotConfiguredError extends Error {
  constructor(marketplaceId: MarketplaceId, missingKey: string) {
    super(
      `${marketplaceId} marketplace is not configured for this environment (missing ${missingKey})`,
    );
    this.name = 'MarketplaceNotConfiguredError';
  }
}

export class MarketplaceUnsupportedChainError extends Error {
  constructor(marketplaceId: MarketplaceId, chainId: number) {
    super(`${marketplaceId} marketplace does not support chain ${chainId}`);
    this.name = 'MarketplaceUnsupportedChainError';
  }
}

export class MarketplaceUnsupportedOperationError extends Error {
  constructor(marketplaceId: MarketplaceId, operation: string, reason: string) {
    super(`${marketplaceId} cannot ${operation}: ${reason}`);
    this.name = 'MarketplaceUnsupportedOperationError';
  }
}
