import {
  type Chain,
  type Listing as OpenSeaListingV2,
  type Offer as OpenSeaOfferV2,
  OpenSeaSDK,
  OrderStatus as OpenSeaOrderStatus,
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
  OpenSeaApiOrder,
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
import { OpenSeaRestClient } from './opensea/rest-client';
import { Erc2981Abi, SeaportCancelAbi } from './seaport/abi';
import { SEAPORT_V1_6_ADDRESS } from './seaport/constants';
import type {
  Listing,
  ListingCurrency,
  ListingFees,
  ListingInput,
  ListingPrice,
  ListingType,
  ListingsQuery,
  Offer,
  OffersQuery,
  OrderStatus,
} from './types';
import type { OpenSeaAdapterArgs } from './factory';

/**
 * Hybrid OpenSea adapter:
 *   - `@opensea/sdk/viem` builds + signs + posts orders (createListing, off-chain
 *     cancel) and serves all read endpoints (getBestListing / getBestOffer via the
 *     slug-based v2 paths).
 *   - `OpenSeaRestClient` (raw v2 REST + zod) for `/api/v2/offers/fulfillment_data`,
 *     which the SDK doesn't wrap.
 *   - viem `walletClient.sendTransaction(...)` for the actual fulfillment tx after
 *     OpenSea hands us ready-to-send `{to, data, value}`.
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
  private readonly rest: OpenSeaRestClient;
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
    this.rest = new OpenSeaRestClient({
      chainSlug,
      isTestnet,
      apiKey: args.apiKey,
    });
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

  // -------- offers (buyer side, seller-accepts) --------

  async getOffersForListing(query: OffersQuery): Promise<Offer[]> {
    const slug = await this.getCollectionSlug(
      query.tokenAddress,
      query.tokenId,
    );
    if (!slug) return [];
    try {
      // `GET /api/v2/offers/collection/{slug}/nfts/{tokenId}` returns ALL active
      // offers on the token (paginated). The SDK only exposes `getBestOffer` which
      // would lose all but the top bid — for the per-domain panel we want to show
      // every offer so the seller can accept a non-top bid if they prefer.
      const orders = await this.rest.listOffersForNft({
        collectionSlug: slug,
        tokenId: query.tokenId,
      });
      return orders
        .filter((o) => deriveStatus(o) === 'active')
        .map((o) => this.adaptApiOrderToOffer(o, query));
    } catch (error) {
      if (isEmptyResultError(error)) return [];
      throw error;
    }
  }

  async approveOffer(offer: Offer): Promise<{ txHash?: `0x${string}` }> {
    if (!this.walletClient || !this.walletAddress) {
      throw new Error('Wallet not connected — cannot accept OpenSea offer.');
    }
    const protocolAddress =
      (offer.raw as { protocol_address?: string } | undefined)
        ?.protocol_address ?? SEAPORT_V1_6_ADDRESS;

    const fulfillment = await this.rest.getOfferFulfillmentData({
      orderHash: offer.id,
      fulfillerAddress: this.walletAddress,
      protocolAddress,
      consideration: {
        tokenAddress: offer.tokenAddress,
        tokenId: offer.tokenId,
      },
    });

    const tx =
      fulfillment.fulfillment_data?.transaction ??
      fulfillment.actions?.find((a) => a.transaction)?.transaction;
    if (!tx) {
      throw new Error(
        'OpenSea did not return fulfillment transaction data for this offer.',
      );
    }

    const txHash = await this.walletClient.sendTransaction({
      to: tx.to as `0x${string}`,
      data: encodeInputData(tx.input_data),
      value: BigInt(
        typeof tx.value === 'number' ? tx.value : (tx.value ?? '0'),
      ),
      account: this.walletClient.account ?? null,
      chain: null,
    });
    return { txHash };
  }

  rejectOffer(): Promise<never> {
    throw new MarketplaceUnsupportedOperationError(
      'opensea',
      'reject an offer',
      "Seaport orderbooks don't support active rejection — bids expire, get filled, or the bidder cancels them.",
    );
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
      createdAt: params?.startTime
        ? secondsToIso(Number(params.startTime))
        : new Date().toISOString(),
      expirationTime: params?.endTime
        ? secondsToIso(Number(params.endTime))
        : new Date(0).toISOString(),
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
      createdAt: params?.startTime
        ? secondsToIso(Number(params.startTime))
        : new Date().toISOString(),
      expirationTime: params?.endTime
        ? secondsToIso(Number(params.endTime))
        : new Date(0).toISOString(),
      status: normalizeSdkStatus(raw.status),
      externalUrl: this.buildExternalUrl(query.tokenAddress, query.tokenId),
      raw,
    };
  }

  /**
   * Adapt a raw v2 REST order payload (boolean status flags, `payment_token_contract`
   * for currency) into our internal `Offer` shape.
   */
  private adaptApiOrderToOffer(
    raw: OpenSeaApiOrder,
    query: OffersQuery,
  ): Offer {
    const currency = this.resolveCurrencyFromApi(raw);
    const priceWei = raw.current_price ?? '0';
    const params = raw.protocol_data?.parameters;
    return {
      id: raw.order_hash,
      marketplace: this.id,
      source: 'OpenSea',
      tokenAddress: query.tokenAddress,
      tokenId: query.tokenId,
      bidder: (raw.maker?.address ?? params?.offerer ?? '0x0') as Address,
      price: priceFromWei(priceWei, currency),
      createdAt: raw.created_date ?? new Date().toISOString(),
      expirationTime: raw.expiration_time
        ? secondsToIso(raw.expiration_time)
        : new Date(0).toISOString(),
      status: deriveStatus(raw),
      externalUrl: this.buildExternalUrl(query.tokenAddress, query.tokenId),
      raw,
    };
  }

  private resolveCurrencyFromApi(order: OpenSeaApiOrder): ListingCurrency {
    const fallback =
      getDefaultListingCurrencyForChain(this.chainId) ??
      getListingCurrenciesForChain(this.chainId)[0];
    const paymentToken = order.payment_token_contract?.address;
    if (paymentToken) {
      const matched = findCurrencyByAddress(
        this.chainId,
        paymentToken as Address,
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
 * Derive a normalized `OrderStatus` from the v2 REST shape (boolean flags +
 * `remaining_quantity` + `expiration_time`). The raw API has no `status` string.
 */
function deriveStatus(order: OpenSeaApiOrder): OrderStatus {
  if (order.cancelled === true) return 'cancelled';
  if (order.marked_invalid === true) return 'expired';
  if (order.finalized === true) return 'filled';
  if (
    typeof order.remaining_quantity === 'number' &&
    order.remaining_quantity === 0
  ) {
    return 'filled';
  }
  const expirationMs = (order.expiration_time ?? 0) * 1000;
  if (expirationMs > 0 && expirationMs < Date.now()) return 'expired';
  return 'active';
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

function encodeInputData(inputData: unknown): `0x${string}` {
  if (typeof inputData === 'string' && inputData.startsWith('0x')) {
    return inputData as `0x${string}`;
  }
  throw new Error(
    'OpenSea fulfillment_data returned an unexpected input_data shape (expected hex calldata).',
  );
}

void getAddress;
