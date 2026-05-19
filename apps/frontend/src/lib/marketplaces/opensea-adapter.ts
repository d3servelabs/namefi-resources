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
    const slug = await this.getCollectionSlug(query.tokenAddress);
    if (!slug) return [];
    try {
      const best = await this.sdk.api.getBestListing(slug, query.tokenId);
      if (!best || normalizeSdkStatus(best.status) !== 'active') return [];
      const currency = this.resolveCurrencyFromSdk(best);
      return [this.adaptSdkListing(best, currency, query)];
    } catch (error) {
      if (isNotFoundError(error)) return [];
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
    const slug = await this.getCollectionSlug(query.tokenAddress);
    if (!slug) return [];
    try {
      const best = await this.sdk.api.getBestOffer(slug, query.tokenId);
      if (!best || normalizeSdkStatus(best.status) !== 'active') return [];
      const currency = this.resolveCurrencyFromSdk(best);
      return [this.adaptSdkOffer(best, currency, query)];
    } catch (error) {
      if (isNotFoundError(error)) return [];
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
      consideration: [
        { token: offer.tokenAddress, identifier: offer.tokenId, quantity: '1' },
      ],
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

  private getCollectionSlug(tokenAddress: Address): Promise<string | null> {
    const key = tokenAddress.toLowerCase();
    const cached = this.collectionSlugByContract.get(key);
    if (cached) return cached;
    const fetched = this.fetchCollectionSlug(tokenAddress).catch(() => null);
    this.collectionSlugByContract.set(key, fetched);
    return fetched;
  }

  private async fetchCollectionSlug(
    tokenAddress: Address,
  ): Promise<string | null> {
    try {
      // Any indexed tokenId works — the collection slug is constant per contract.
      // Use `'1'` as a probe; if the NFT contract doesn't have token #1, OpenSea
      // still returns the collection mapping.
      const collection = await this.sdk.api.getNFTCollection(
        tokenAddress,
        '1',
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

function isNotFoundError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return /\b404\b/.test(message) || /not\s*found/i.test(message);
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
