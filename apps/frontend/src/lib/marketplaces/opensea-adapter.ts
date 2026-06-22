import {
  type Chain,
  type GetOrderByHashResponse,
  type Listing as OpenSeaListingV2,
  type Offer as OpenSeaOfferV2,
  OpenSeaSDK,
  OrderStatus as OpenSeaOrderStatus,
  TokenStandard,
} from '@opensea/sdk/viem';
import { type Address, formatUnits, getAddress } from 'viem';
import {
  findCurrencyByAddress,
  getDefaultListingCurrencyForChain,
  getListingCurrenciesForChain,
} from './currencies';
import {
  type MarketPlace,
  MarketplaceUnsupportedChainError,
  MarketplaceUnsupportedOperationError,
} from './marketplace.interface';
import type {
  OpenSeaProtocolData,
  SeaportOrderParameters,
} from './opensea/api-schemas';
import {
  CHAIN_ID_TO_OPENSEA_CHAIN,
  CHAIN_ID_TO_OPENSEA_SLUG,
  OPENSEA_PROTOCOL_FEE_BPS,
  OPENSEA_SITE_BASE_MAINNET,
  OPENSEA_SITE_BASE_TESTNET,
  TESTNET_CHAIN_IDS,
} from './opensea/constants';
import { Erc2981Abi, SeaportCancelAbi } from './seaport/abi';
import { SEAPORT_V1_6_ADDRESS } from './seaport/constants';
import type {
  CollectionListingsQuery,
  CollectionOffersQuery,
  Listing,
  ListingCurrency,
  ListingFees,
  ListingInput,
  ListingPrice,
  ListingType,
  ListingsQuery,
  MakerListingsQuery,
  MakerOffersQuery,
  MarketplaceCapabilities,
  Offer,
  OffersQuery,
  OrderStatus,
} from './types';
import type { OpenSeaAdapterArgs } from './factory';

/**
 * Hybrid OpenSea adapter:
 *   - `@opensea/sdk/viem` builds + signs + posts orders (createListing, off-chain
 *     cancel) and serves all read endpoints (getBestListing / getOffersByNFT via
 *     the slug-based v2 paths).
 *   - `sdk.fulfillOrder(...)` for buying a listing / accepting an offer: the SDK
 *     fetches OpenSea's fulfillment data, ABI-encodes the Seaport call (its
 *     `input_data` is a decoded params object, NOT ready-to-send calldata), and
 *     sends it via the wallet client. Accepting an offer is preceded by
 *     `sdk.batchApproveAssets(...)` so the conduit can move the seller's NFT.
 *   - viem `writeContract` for the on-chain `Seaport.cancel` fallback when the
 *     off-chain cancel can't be applied.
 *
 * v1 scope is fixed-price listings in the chain's native asset (ETH). Dutch + English
 * auctions and ERC-20 listings require dropping to manual Seaport order construction
 * (deliberately avoided after two prior attempts proved fragile).
 */
export class OpenSeaAdapter implements MarketPlace {
  readonly id = 'opensea' as const;
  readonly displayName = 'OpenSea';
  readonly chainId: number;

  private readonly sdk: OpenSeaSDK;
  private readonly publicClient: OpenSeaAdapterArgs['publicClient'];
  private readonly walletClient: OpenSeaAdapterArgs['walletClient'];
  private readonly walletAddress: Address | undefined;
  private readonly openSeaChain: Chain;
  private readonly chainSlug: string;
  private readonly externalSiteBaseUrl: string;

  /** Lazy `contractAddress.toLowerCase() → collection-slug` cache. */
  private readonly collectionSlugByContract = new Map<
    string,
    Promise<string | null>
  >();
  /** Lazy `contractAddress.toLowerCase() → collection-slug` cache for the
   *  contract-only (no tokenId) lookup path used by collection-scoped queries. */
  private readonly collectionSlugByContractOnly = new Map<
    string,
    Promise<string | null>
  >();

  constructor(args: OpenSeaAdapterArgs) {
    const openSeaChain = CHAIN_ID_TO_OPENSEA_CHAIN[args.chainId];
    const chainSlug = CHAIN_ID_TO_OPENSEA_SLUG[args.chainId];
    if (!openSeaChain || !chainSlug) {
      throw new MarketplaceUnsupportedChainError('opensea', args.chainId);
    }

    this.chainId = args.chainId;
    this.publicClient = args.publicClient;
    this.walletClient = args.walletClient;
    this.walletAddress = args.walletClient?.account?.address;
    this.openSeaChain = openSeaChain;
    this.chainSlug = chainSlug;

    const isTestnet = TESTNET_CHAIN_IDS.has(args.chainId);
    this.externalSiteBaseUrl = isTestnet
      ? OPENSEA_SITE_BASE_TESTNET
      : OPENSEA_SITE_BASE_MAINNET;

    this.sdk = new OpenSeaSDK(
      {
        publicClient: args.publicClient,
        walletClient: args.walletClient,
        // The SDK bridges to ethers/seaport-js internally for order construction;
        // that bridge needs a concrete RPC URL. Pass it explicitly so calls like
        // `Seaport.getCounter` resolve against the right chain instead of the
        // bridge's mainnet default (which CALL_EXCEPTIONs for non-mainnet NFTs).
        rpcUrl: extractRpcUrl(args.publicClient),
      },
      { chain: openSeaChain, apiKey: args.apiKey },
    );
  }

  // -------- discovery --------

  getAvailableListingTypes(): readonly ListingType[] {
    return ['fixed-price'];
  }

  getAvailableListingCurrency(): readonly ListingCurrency[] {
    // SDK 10.5's `createListing` doesn't accept `paymentTokenAddress`, so listings
    // always settle in the chain's native asset (ETH on every supported chain).
    return getListingCurrenciesForChain(this.chainId).filter((c) => c.isNative);
  }

  getCapabilities(): MarketplaceCapabilities {
    // `sdk.api.getProfileListings/getProfileOffers` cover the maker scope;
    // `sdk.api.getAllListings/getCollectionOffers` cover the collection scope.
    // `fulfillListing` is backed by `/api/v2/listings/fulfillment_data`.
    return { byMaker: true, byCollection: true, canFulfillListing: true };
  }

  async calculateListingFees(input: {
    priceWei: bigint;
    currency: ListingCurrency;
    listingType: ListingType;
  }): Promise<ListingFees> {
    const royaltyFeeBps = 0;
    const totalBps = OPENSEA_PROTOCOL_FEE_BPS + royaltyFeeBps;
    const feeWei = (input.priceWei * BigInt(totalBps)) / 10_000n;
    return {
      marketplaceFeeBps: OPENSEA_PROTOCOL_FEE_BPS,
      royaltyFeeBps,
      netToSellerWei: input.priceWei - feeWei,
      isEstimate: true,
    };
  }

  async readRoyaltyBpsForToken(
    tokenAddress: Address,
    tokenId: bigint,
    salePriceWei: bigint,
  ): Promise<number> {
    try {
      const [, royaltyAmount] = await this.publicClient.readContract({
        address: tokenAddress,
        abi: Erc2981Abi,
        functionName: 'royaltyInfo',
        args: [tokenId, salePriceWei],
      });
      if (salePriceWei === 0n) return 0;
      return Number((royaltyAmount * 10_000n) / salePriceWei);
    } catch {
      return 0;
    }
  }

  // -------- listings (seller side) --------

  async createListing(input: ListingInput): Promise<Listing> {
    if (!this.walletClient || !this.walletAddress) {
      throw new Error('Wallet not connected — cannot create OpenSea listing.');
    }
    if (input.listingType !== 'fixed-price') {
      throw new MarketplaceUnsupportedOperationError(
        'opensea',
        `create ${input.listingType} listing`,
        'OpenSea SDK 10.5 only exposes fixed-price createListing.',
      );
    }
    if (input.durationSeconds <= 0) {
      throw new Error('durationSeconds must be greater than 0');
    }
    const currency = this.requireCurrency(input.currency);
    if (!currency.isNative) {
      throw new MarketplaceUnsupportedOperationError(
        'opensea',
        'list in a custom payment token',
        'OpenSea SDK 10.5 dropped paymentTokenAddress from createListing — listings settle in the chain native asset only.',
      );
    }

    const listingStartSeconds =
      input.startTimeSeconds ?? Math.floor(Date.now() / 1000);
    const expirationSeconds = listingStartSeconds + input.durationSeconds;
    const amountDecimal = formatUnits(input.priceWei, currency.decimals);

    const order = await this.sdk.createListing({
      asset: {
        tokenAddress: input.tokenAddress,
        tokenId: input.tokenId,
      },
      accountAddress: this.walletAddress,
      amount: amountDecimal,
      listingTime: listingStartSeconds,
      expirationTime: expirationSeconds,
      domain: 'namefi.io',
    });

    return this.adaptSdkListing(order, currency, {
      tokenAddress: input.tokenAddress,
      tokenId: input.tokenId,
    });
  }

  async getExistingListings(query: ListingsQuery): Promise<Listing[]> {
    const slug = await this.getCollectionSlug(
      query.tokenAddress,
      query.tokenId,
    );
    if (!slug) return [];
    try {
      const best = await this.sdk.api.getBestListing(slug, query.tokenId);
      if (!best || normalizeSdkStatus(best.status) !== 'active') return [];
      const currency = this.resolveCurrencyFromSdk(best);
      return [this.adaptSdkListing(best, currency, query)];
    } catch (error) {
      if (isEmptyResultError(error)) return [];
      throw error;
    }
  }

  async cancelListing(listing: Listing): Promise<{ txHash?: `0x${string}` }> {
    if (!this.walletClient || !this.walletAddress) {
      throw new Error('Wallet not connected — cannot cancel OpenSea listing.');
    }
    const protocolAddress =
      (listing.raw as { protocol_address?: string } | undefined)
        ?.protocol_address ?? SEAPORT_V1_6_ADDRESS;

    try {
      await this.sdk.offchainCancelOrder(
        protocolAddress,
        listing.id,
        this.openSeaChain,
      );
      return {};
    } catch {
      const params = readOrderParameters(listing.raw);
      if (!params) {
        throw new Error(
          'Cannot cancel OpenSea listing on-chain: missing protocol_data.parameters payload.',
        );
      }
      const orderComponents = orderComponentsForCancel(params);
      const txHash = await this.walletClient.writeContract({
        address: SEAPORT_V1_6_ADDRESS,
        abi: SeaportCancelAbi,
        functionName: 'cancel',
        args: [[orderComponents]],
        account: this.walletClient.account ?? null,
        chain: null,
      });
      return { txHash };
    }
  }

  async updateListing(listing: Listing, input: ListingInput): Promise<Listing> {
    await this.cancelListing(listing);
    return this.createListing(input);
  }

  /**
   * Buy (fulfill) an existing listing from the connected buyer's wallet.
   *
   * Delegates to the OpenSea SDK's `fulfillOrder`, which fetches the
   * fulfillment data and — crucially — ABI-encodes the Seaport call before
   * sending. OpenSea's `fulfillment_data.transaction.input_data` is a *decoded*
   * params object, not ready-to-send hex calldata, so the raw-REST path can't
   * submit it without re-encoding the order against its Seaport function (the
   * fragile manual-Seaport route this adapter deliberately avoids). The SDK
   * does that encoding internally and signs with the wallet client passed at
   * construction.
   */
  async fulfillListing(listing: Listing): Promise<{ txHash?: `0x${string}` }> {
    if (!this.walletClient || !this.walletAddress) {
      throw new Error('Wallet not connected — cannot buy OpenSea listing.');
    }
    // `listing.raw` is the enriched SDK order (with protocol_data) we stored in
    // `adaptSdkListing` — exactly the shape `fulfillOrder` expects.
    const order = listing.raw as OpenSeaListingV2;
    const txHash = await this.sdk.fulfillOrder({
      order,
      accountAddress: this.walletAddress,
    });
    return { txHash: txHash as `0x${string}` };
  }

  // -------- offers (buyer side, seller-accepts) --------

  async getOffersForListing(query: OffersQuery): Promise<Offer[]> {
    const slug = await this.getCollectionSlug(
      query.tokenAddress,
      query.tokenId,
    );
    if (!slug) return [];
    try {
      // `sdk.api.getOffersByNFT` → `GET /api/v2/offers/collection/{slug}/nfts/
      // {tokenId}` returns every active offer on the token, correctly typed by
      // the SDK. A hand-rolled REST shape mis-read the price + expiry fields
      // (`current_price` / `expiration_time` aren't on these objects).
      const { offers } = await this.sdk.api.getOffersByNFT(slug, query.tokenId);
      return (offers ?? [])
        .filter((o) => normalizeSdkStatus(o.status) === 'active')
        .map((o) =>
          this.adaptSdkOffer(o, this.resolveCurrencyFromSdk(o), query),
        );
    } catch (error) {
      if (isEmptyResultError(error)) return [];
      throw error;
    }
  }

  async approveOffer(offer: Offer): Promise<{ txHash?: `0x${string}` }> {
    if (!this.walletClient || !this.walletAddress) {
      throw new Error('Wallet not connected — cannot accept OpenSea offer.');
    }
    // Accepting a bid transfers the NFT FROM the seller, so the Seaport conduit
    // must be approved to move it. Unlike buying a listing, `fulfillOrder` does
    // NOT auto-approve. `batchApproveAssets` is conditional — it returns
    // `undefined` and sends no tx when the conduit is already approved — so it
    // only adds a wallet prompt the first time this seller sells the collection.
    await this.sdk.batchApproveAssets({
      assets: [
        {
          asset: {
            tokenAddress: offer.tokenAddress,
            tokenId: offer.tokenId,
            tokenStandard: TokenStandard.ERC721,
          },
        },
      ],
      fromAddress: this.walletAddress,
    });
    // Same SDK fulfillment path as buying a listing: it fetches fulfillment
    // data, ABI-encodes the Seaport call, and signs with the wallet client.
    const txHash = await this.sdk.fulfillOrder({
      order: offer.raw as OpenSeaOfferV2,
      accountAddress: this.walletAddress,
    });
    return { txHash: txHash as `0x${string}` };
  }

  rejectOffer(): Promise<never> {
    throw new MarketplaceUnsupportedOperationError(
      'opensea',
      'reject an offer',
      "Seaport orderbooks don't support active rejection — bids expire, get filled, or the bidder cancels them.",
    );
  }

  // -------- maker- / collection-scoped queries --------

  async getListingsByMaker(query: MakerListingsQuery): Promise<Listing[]> {
    const args = await this.buildProfileOrdersArgs(query.collectionAddress);
    if (args === null) return []; // collection not on OpenSea — empty result
    const { listings } = await this.sdk.api.getProfileListings(
      query.makerAddress,
      args,
    );
    const enriched = await this.enrichOrdersByHash<OpenSeaListingV2>(
      (listings ?? []) as OpenSeaListingV2[],
    );
    return enriched
      .filter((l) => normalizeSdkStatus(l.status) === 'active')
      .map((l) =>
        this.adaptSdkListing(
          l,
          this.resolveCurrencyFromSdk(l),
          extractListingToken(l),
        ),
      );
  }

  async getOffersByMaker(query: MakerOffersQuery): Promise<Offer[]> {
    const args = await this.buildProfileOrdersArgs(query.collectionAddress);
    if (args === null) return [];
    const { offers } = await this.sdk.api.getProfileOffers(
      query.makerAddress,
      args,
    );
    const enriched = await this.enrichOrdersByHash<OpenSeaOfferV2>(
      (offers ?? []) as OpenSeaOfferV2[],
    );
    return enriched
      .filter((o) => normalizeSdkStatus(o.status) === 'active')
      .map((o) =>
        this.adaptSdkOffer(
          o,
          this.resolveCurrencyFromSdk(o),
          extractOfferToken(o),
        ),
      );
  }

  async getListingsByCollection(
    query: CollectionListingsQuery,
  ): Promise<Listing[]> {
    const slug = await this.getCollectionSlugByContract(
      query.collectionAddress,
    );
    if (!slug) return [];
    try {
      const { listings } = await this.sdk.api.getAllListings(slug);
      const enriched = await this.enrichOrdersByHash<OpenSeaListingV2>(
        (listings ?? []) as OpenSeaListingV2[],
      );
      return enriched
        .filter((l) => normalizeSdkStatus(l.status) === 'active')
        .map((l) =>
          this.adaptSdkListing(
            l,
            this.resolveCurrencyFromSdk(l),
            extractListingToken(l),
          ),
        );
    } catch (error) {
      if (isEmptyResultError(error)) return [];
      throw error;
    }
  }

  async getOffersByCollection(query: CollectionOffersQuery): Promise<Offer[]> {
    const slug = await this.getCollectionSlugByContract(
      query.collectionAddress,
    );
    if (!slug) return [];
    try {
      const { offers } = await this.sdk.api.getAllOffers(slug);
      const enriched = await this.enrichOrdersByHash<OpenSeaOfferV2>(
        (offers ?? []) as OpenSeaOfferV2[],
      );
      return enriched
        .filter((o) => normalizeSdkStatus(o.status) === 'active')
        .map((o) =>
          this.adaptSdkOffer(
            o,
            this.resolveCurrencyFromSdk(o),
            extractOfferToken(o),
          ),
        );
    } catch (error) {
      if (isEmptyResultError(error)) return [];
      throw error;
    }
  }

  /**
   * Re-fetch each lightweight profile/collection order through
   * `sdk.api.getOrderByHash(orderHash, protocolAddress, chain)` to populate
   * the `protocol_data` block that the profile-scoped responses strip for
   * bandwidth. Without this enrichment, `extractListingToken` returns
   * `(0x0…0, "")` and `deriveExpirationFromRaw` falls back to the
   * 9999-12-31 sentinel — so every downstream feature (nested bids,
   * expiration display, domain-detail lookup) breaks.
   *
   * Calls are issued in chunks of `ENRICHMENT_CONCURRENCY` to keep
   * cross-wallet × cross-chain aggregation from bursting all at once and
   * tripping OpenSea's rate limits. `Promise.allSettled` per chunk so a
   * single 404/timeout doesn't lose the rest of the batch — failed
   * enrichments keep their lightweight original (the card will still
   * render, just with the "Never expires" / truncated-token fallback for
   * that one row).
   */
  private async enrichOrdersByHash<T extends OpenSeaListingV2 | OpenSeaOfferV2>(
    items: T[],
  ): Promise<T[]> {
    if (items.length === 0) return items;
    const results: Array<PromiseSettledResult<GetOrderByHashResponse>> = [];
    for (let i = 0; i < items.length; i += ENRICHMENT_CONCURRENCY) {
      const chunk = items.slice(i, i + ENRICHMENT_CONCURRENCY);
      const chunkResults = await Promise.allSettled(
        chunk.map((item) => {
          const protocolAddress = item.protocol_address ?? SEAPORT_V1_6_ADDRESS;
          return this.sdk.api.getOrderByHash(
            item.order_hash,
            protocolAddress,
            this.openSeaChain,
          );
        }),
      );
      results.push(...chunkResults);
    }
    return items.map((original, idx) => {
      const r = results[idx];
      if (r.status !== 'fulfilled' || !r.value) return original;
      // `getOrderByHash` returns the union `Listing | Offer`; since we ask
      // by hash and the original is of type `T`, the response is the same
      // shape (a sell-order hash returns a Listing, a bid hash returns an
      // Offer). Cast back to `T` to preserve the call-site narrowing.
      return r.value as unknown as T;
    });
  }

  /**
   * Build the `ProfileOrdersArgs` for `getProfileListings`/`getProfileOffers`
   * narrowed to this adapter's chain (and optionally a single collection).
   * Returns `null` when the caller asked for a collection that doesn't have an
   * OpenSea slug — short-circuit to an empty result instead of querying every
   * collection on the account.
   */
  private async buildProfileOrdersArgs(
    collectionAddress: Address | undefined,
  ): Promise<{ chains: string[]; collection_slugs?: string[] } | null> {
    if (!collectionAddress) return { chains: [this.chainSlug] };
    const slug = await this.getCollectionSlugByContract(collectionAddress);
    if (!slug) return null;
    return { chains: [this.chainSlug], collection_slugs: [slug] };
  }

  // ---- collection slug cache ----

  private getCollectionSlug(
    tokenAddress: Address,
    tokenId: string,
  ): Promise<string | null> {
    const key = tokenAddress.toLowerCase();
    const cached = this.collectionSlugByContract.get(key);
    if (cached) return cached;
    // Cache is keyed by contract only — the slug is constant per contract. The
    // tokenId is just needed for the lookup endpoint to address an indexed NFT.
    const fetched = this.fetchCollectionSlug(tokenAddress, tokenId).catch(
      () => null,
    );
    this.collectionSlugByContract.set(key, fetched);
    return fetched;
  }

  private async fetchCollectionSlug(
    tokenAddress: Address,
    tokenId: string,
  ): Promise<string | null> {
    try {
      // The slug-lookup endpoint requires a real, indexed tokenId — passing a
      // placeholder like "1" 404s for collections whose token IDs are hashed
      // (e.g. the Namefi NFT uses keccak256(domainName) for tokenId).
      const collection = await this.sdk.api.getNFTCollection(
        tokenAddress,
        tokenId,
        this.openSeaChain,
      );
      return collection?.collection ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Resolve the OpenSea collection slug from a contract address alone (no
   * tokenId). Used by the collection-scoped query methods; the contract-only
   * endpoint avoids the per-token quirks of `getNFTCollection`.
   */
  private getCollectionSlugByContract(
    tokenAddress: Address,
  ): Promise<string | null> {
    const key = tokenAddress.toLowerCase();
    const cached = this.collectionSlugByContractOnly.get(key);
    if (cached) return cached;
    const fetched = (async () => {
      try {
        const contract = await this.sdk.api.getContract(
          tokenAddress,
          this.openSeaChain,
        );
        return contract?.collection ?? null;
      } catch {
        return null;
      }
    })();
    this.collectionSlugByContractOnly.set(key, fetched);
    return fetched;
  }

  // ---- adaptation helpers ----

  private requireCurrency(contract: Address): ListingCurrency {
    const currency = findCurrencyByAddress(this.chainId, contract);
    if (!currency) {
      throw new Error(
        `Currency ${contract} is not in the per-chain matrix for chain ${this.chainId}.`,
      );
    }
    return currency;
  }

  private resolveCurrencyFromSdk(
    order: OpenSeaListingV2 | OpenSeaOfferV2,
  ): ListingCurrency {
    const fallback =
      getDefaultListingCurrencyForChain(this.chainId) ??
      getListingCurrenciesForChain(this.chainId)[0];
    const currencyAddress =
      order.price && 'current' in order.price
        ? order.price.current.currency
        : (order.price as { currency?: string } | undefined)?.currency;
    if (currencyAddress) {
      const matched = findCurrencyByAddress(
        this.chainId,
        currencyAddress as Address,
      );
      if (matched) return matched;
    }
    if (fallback) return fallback;
    return {
      contract: '0x0000000000000000000000000000000000000000',
      name: 'Unknown',
      symbol: '?',
      decimals: 18,
      isNative: true,
    };
  }

  private adaptSdkListing(
    raw: OpenSeaListingV2,
    currency: ListingCurrency,
    query: ListingsQuery,
  ): Listing {
    const priceWei = raw.price?.current?.value ?? '0';
    const params = raw.protocol_data?.parameters;
    return {
      id: raw.order_hash,
      marketplace: this.id,
      source: 'OpenSea',
      tokenAddress: query.tokenAddress,
      tokenId: query.tokenId,
      seller: (params?.offerer ?? this.walletAddress ?? '0x0') as Address,
      price: priceFromWei(priceWei, currency),
      createdAt: deriveCreatedAtFromRaw(raw, params?.startTime),
      expirationTime: deriveExpirationFromRaw(params?.endTime),
      status: normalizeSdkStatus(raw.status),
      externalUrl: this.buildExternalUrl(query.tokenAddress, query.tokenId),
      raw,
    };
  }

  private adaptSdkOffer(
    raw: OpenSeaOfferV2,
    currency: ListingCurrency,
    query: OffersQuery,
  ): Offer {
    const priceWei =
      (raw.price as { current?: { value?: string }; value?: string })?.current
        ?.value ??
      (raw.price as { value?: string })?.value ??
      '0';
    const params = raw.protocol_data?.parameters;
    return {
      id: raw.order_hash,
      marketplace: this.id,
      source: 'OpenSea',
      tokenAddress: query.tokenAddress,
      tokenId: query.tokenId,
      bidder: (params?.offerer ?? '0x0') as Address,
      price: priceFromWei(priceWei, currency),
      createdAt: deriveCreatedAtFromRaw(raw, params?.startTime),
      expirationTime: deriveExpirationFromRaw(params?.endTime),
      status: normalizeSdkStatus(raw.status),
      externalUrl: this.buildExternalUrl(query.tokenAddress, query.tokenId),
      raw,
    };
  }

  private buildExternalUrl(tokenAddress: string, tokenId: string): string {
    if (!tokenAddress || !tokenId) return this.externalSiteBaseUrl;
    return `${this.externalSiteBaseUrl}/assets/${this.chainSlug}/${tokenAddress}/${tokenId}`;
  }
}

// ---------------------------------------------------------------------------
// Module-level helpers
// ---------------------------------------------------------------------------

function priceFromWei(rawWei: string, currency: ListingCurrency): ListingPrice {
  return {
    raw: rawWei,
    decimal: Number(formatUnits(BigInt(rawWei || '0'), currency.decimals)),
    currency,
  };
}

function secondsToIso(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0)
    return new Date(0).toISOString();
  return new Date(seconds * 1000).toISOString();
}

/**
 * Sentinel for orders whose `protocol_data.parameters.endTime` is missing —
 * profile-listing responses from `getProfileListings` sometimes omit
 * `protocol_data` entirely, and falling back to `new Date(0)` made every
 * such row render as "expires 1970-01-01" in the My-Listings panel. A
 * far-future ISO keeps the order sorted at "latest expiry" and the UI can
 * detect it to render "Never".
 */
const NO_EXPIRATION_ISO = '9999-12-31T23:59:59.000Z';

/**
 * Pick the best createdAt for an OpenSea listing/offer:
 *   1. `protocol_data.parameters.startTime` (unix seconds, may be string /
 *      number / bigint depending on the SDK encoding) — present on per-token
 *      reads via `getBestListing` / `getOffersByNFT`.
 *   2. `order_created_at` (unix seconds, optional on api-types `Listing`) —
 *      what `getProfileListings`/`getAllListings` return when
 *      `protocol_data` is absent. The SDK's own `OpenSeaListingV2` type
 *      doesn't model this field, so we read it via an `unknown` cast.
 *   3. Current time — final fallback so the row doesn't sort as "1970".
 */
function deriveCreatedAtFromRaw(
  raw: unknown,
  startTime: string | number | bigint | undefined,
): string {
  const startSeconds = toFiniteSeconds(startTime);
  if (startSeconds !== null) return secondsToIso(startSeconds);
  const createdAt = (raw as { order_created_at?: unknown } | null | undefined)
    ?.order_created_at;
  const createdSeconds = toFiniteSeconds(createdAt);
  if (createdSeconds !== null) return secondsToIso(createdSeconds);
  return new Date().toISOString();
}

/**
 * Pick the best expirationTime — same fallback chain as createdAt minus the
 * "current time" leg (which would render as already-expired). Falls back to
 * `NO_EXPIRATION_ISO` so the row sorts to the end and the UI can render
 * "Never" instead of "1970-01-01".
 */
function deriveExpirationFromRaw(
  endTime: string | number | bigint | undefined,
): string {
  const endSeconds = toFiniteSeconds(endTime);
  if (endSeconds !== null) return secondsToIso(endSeconds);
  return NO_EXPIRATION_ISO;
}

/** Coerce an arbitrary timestamp scalar to positive finite seconds, or `null`. */
function toFiniteSeconds(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n =
    typeof value === 'bigint'
      ? Number(value)
      : typeof value === 'number'
        ? value
        : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function normalizeSdkStatus(
  status: OpenSeaOrderStatus | string | undefined,
): OrderStatus {
  switch (status) {
    case OpenSeaOrderStatus.ACTIVE:
    case 'ACTIVE':
      return 'active';
    case OpenSeaOrderStatus.FULFILLED:
    case 'FULFILLED':
      return 'filled';
    case OpenSeaOrderStatus.CANCELLED:
    case 'CANCELLED':
      return 'cancelled';
    case OpenSeaOrderStatus.EXPIRED:
    case 'EXPIRED':
      return 'expired';
    case OpenSeaOrderStatus.INACTIVE:
    case 'INACTIVE':
      return 'expired';
    default:
      return 'active';
  }
}

/**
 * True when an error from OpenSea means "there's simply nothing here" rather than a
 * real failure. OpenSea returns HTTP 500 (not 404) with a body like
 * `No listings found for NFT … in collection …` when a token has no orders — that
 * should surface as an empty list, not a red error banner.
 */
function isEmptyResultError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return (
    /\b404\b/.test(message) ||
    /not\s*found/i.test(message) ||
    /no\s+(listings?|offers?|orders?)\s+found/i.test(message)
  );
}

/**
 * Extract a concrete HTTP RPC URL from a viem `PublicClient` for the OpenSea SDK's
 * ethers/seaport-js bridge. Falls back to the chain's default RPC.
 */
function extractRpcUrl(
  publicClient: OpenSeaAdapterArgs['publicClient'],
): string | undefined {
  const transport = publicClient.transport as
    | { url?: string; transports?: Array<{ value?: { url?: string } }> }
    | undefined;
  if (typeof transport?.url === 'string') return transport.url;
  // Fallback transport: take the first inner transport's URL.
  const innerUrl = transport?.transports?.[0]?.value?.url;
  if (typeof innerUrl === 'string') return innerUrl;
  return publicClient.chain?.rpcUrls?.default?.http?.[0];
}

function readOrderParameters(raw: unknown): SeaportOrderParameters | undefined {
  const protocolData = (raw as { protocol_data?: OpenSeaProtocolData })
    ?.protocol_data;
  return protocolData?.parameters;
}

/** Seaport `itemType` values for NFT items (ERC721 / ERC1155, including criteria-based). */
const NFT_SEAPORT_ITEM_TYPES = new Set([2, 3, 4, 5]);

/**
 * Max in-flight `getOrderByHash` calls during profile-listing enrichment.
 * The maker/collection methods can return dozens of orders per wallet ×
 * chain combination, and the My-Listings panel fans out across every
 * supported chain — so the unbounded `Promise.all` we previously used
 * could burst 50+ requests in a single tick and trip OpenSea's
 * rate limits. 5 is conservative; raise if the throughput becomes a
 * pain-point.
 */
const ENRICHMENT_CONCURRENCY = 5;

/**
 * Pull (tokenAddress, tokenId) off a sell-order's `protocol_data` — for a
 * sell order the NFT lives in `offer[0]`.
 */
function extractListingToken(raw: OpenSeaListingV2): {
  tokenAddress: Address;
  tokenId: string;
} {
  const params = readOrderParameters(raw);
  const item =
    params?.offer.find((o) => NFT_SEAPORT_ITEM_TYPES.has(Number(o.itemType))) ??
    params?.offer[0];
  return {
    tokenAddress: ((item?.token as string | undefined) ??
      '0x0000000000000000000000000000000000000000') as Address,
    tokenId: item ? String(item.identifierOrCriteria) : '',
  };
}

/**
 * Pull (tokenAddress, tokenId) off an offer's `protocol_data` — for an offer
 * the NFT lives in `consideration` (bidder receives the NFT), typically at
 * index 0 with the remaining items being fee/royalty payouts.
 */
function extractOfferToken(raw: OpenSeaOfferV2): {
  tokenAddress: Address;
  tokenId: string;
} {
  const params = readOrderParameters(raw);
  const item =
    params?.consideration.find((c) =>
      NFT_SEAPORT_ITEM_TYPES.has(Number(c.itemType)),
    ) ?? params?.consideration[0];
  return {
    tokenAddress: ((item?.token as string | undefined) ??
      '0x0000000000000000000000000000000000000000') as Address,
    tokenId: item ? String(item.identifierOrCriteria) : '',
  };
}

function orderComponentsForCancel(params: SeaportOrderParameters) {
  return {
    offerer: params.offerer as Address,
    zone: params.zone as Address,
    offer: params.offer.map((item) => ({
      itemType: Number(item.itemType),
      token: item.token as Address,
      identifierOrCriteria: BigInt(item.identifierOrCriteria),
      startAmount: BigInt(item.startAmount),
      endAmount: BigInt(item.endAmount),
    })),
    consideration: params.consideration.map((item) => ({
      itemType: Number(item.itemType),
      token: item.token as Address,
      identifierOrCriteria: BigInt(item.identifierOrCriteria),
      startAmount: BigInt(item.startAmount),
      endAmount: BigInt(item.endAmount),
      recipient: item.recipient as Address,
    })),
    orderType: Number(params.orderType),
    startTime: BigInt(params.startTime),
    endTime: BigInt(params.endTime),
    zoneHash: params.zoneHash as `0x${string}`,
    salt: BigInt(params.salt),
    conduitKey: params.conduitKey as `0x${string}`,
    counter: BigInt(params.counter ?? 0),
  };
}

void getAddress;
