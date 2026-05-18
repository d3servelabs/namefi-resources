import {
  Chain,
  type Listing as OpenSeaListingV2,
  OpenSeaSDK,
} from '@opensea/sdk/viem';
import { type Address, formatUnits, getAddress } from 'viem';
import { clientSideEnv } from '@/lib/env';
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
import type { GetMarketplaceArgs } from './factory';

/**
 * Hybrid OpenSea adapter:
 *   - `@opensea/sdk/viem` builds + signs + posts orders (createListing,
 *     offchain cancel) — the SDK handles EIP-712, fees, conduit approval,
 *     counter fetching, etc.
 *   - `OpenSeaRestClient` (raw v2 REST + zod) for reads + fulfillment-data lookups.
 *   - viem `walletClient.sendTransaction` for the actual fulfillment tx after
 *     OpenSea hands us ready-to-send `{to, data, value}` from `/offers/fulfillment_data`.
 *   - viem `writeContract` for the on-chain `Seaport.cancel` fallback.
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
  private readonly publicClient: GetMarketplaceArgs['publicClient'];
  private readonly walletClient: GetMarketplaceArgs['walletClient'];
  private readonly walletAddress: Address | undefined;
  private readonly chainSlug: string;
  private readonly externalSiteBaseUrl: string;

  constructor(args: GetMarketplaceArgs) {
    const openSeaChain = CHAIN_ID_TO_OPENSEA_CHAIN[args.chainId];
    const chainSlug = CHAIN_ID_TO_OPENSEA_SLUG[args.chainId];
    if (!openSeaChain || !chainSlug) {
      throw new MarketplaceUnsupportedChainError('opensea', args.chainId);
    }

    this.chainId = args.chainId;
    this.publicClient = args.publicClient;
    this.walletClient = args.walletClient;
    this.walletAddress = args.walletClient?.account?.address;
    this.chainSlug = chainSlug;

    const isTestnet = TESTNET_CHAIN_IDS.has(args.chainId);
    this.externalSiteBaseUrl = isTestnet
      ? OPENSEA_SITE_BASE_TESTNET
      : OPENSEA_SITE_BASE_MAINNET;

    const apiKey = clientSideEnv.NEXT_PUBLIC_OPENSEA_API_KEY;
    this.sdk = new OpenSeaSDK(
      {
        publicClient: args.publicClient,
        walletClient: args.walletClient,
      },
      { chain: openSeaChain, apiKey },
    );
    this.rest = new OpenSeaRestClient({
      chainSlug,
      isTestnet,
      apiKey,
    });
  }

  // -------- discovery --------

  getAvailableListingTypes(): readonly ListingType[] {
    // SDK 10.5's `createListing` only exposes fixed-price. Dutch + English require
    // manual Seaport order construction (deliberately out of scope for v1).
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
      // Royalties are read by the SDK from the collection's on-chain ERC-2981
      // implementation at signing time; we report the preview as an estimate so
      // the UI can show the final number after the order is posted.
      isEstimate: true,
    };
  }

  /**
   * Per-token on-chain royalty lookup. Used by `calculateListingFeesForToken` (UI
   * helper). Returns `0` if the collection doesn't implement ERC-2981.
   */
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

    // The SDK handles conduit approval, EIP-712 signing, OpenSea API posting, and
    // returns a `Listing` payload that mirrors the v2 REST shape (with snake_case
    // fields). We adapt it to our internal `Listing` type below.
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
    const orders = await this.rest.listListings({
      tokenAddress: query.tokenAddress,
      tokenId: query.tokenId,
    });
    return orders
      .filter((o) => deriveStatus(o) === 'active')
      .map((o) => this.adaptApiOrderToListing(o, query));
  }

  async cancelListing(listing: Listing): Promise<{ txHash?: `0x${string}` }> {
    if (!this.walletClient || !this.walletAddress) {
      throw new Error('Wallet not connected — cannot cancel OpenSea listing.');
    }
    const protocolAddress =
      (listing.raw as OpenSeaApiOrder | undefined)?.protocol_address ??
      SEAPORT_V1_6_ADDRESS;
    const chain = CHAIN_ID_TO_OPENSEA_CHAIN[this.chainId];

    try {
      // Gas-free path. SDK signs a personal-cancel message and POSTs to OpenSea.
      await this.sdk.offchainCancelOrder(protocolAddress, listing.id, chain);
      return {};
    } catch {
      // On-chain fallback. Requires the full OrderComponents payload, which we
      // get from the listing's `raw` (validated by zod).
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
    // Seaport has no native update — cancel-old + create-new, two wallet prompts.
    await this.cancelListing(listing);
    return this.createListing(input);
  }

  // -------- offers (buyer side, seller-accepts) --------

  async getOffersForListing(query: OffersQuery): Promise<Offer[]> {
    const orders = await this.rest.listOffers({
      tokenAddress: query.tokenAddress,
      tokenId: query.tokenId,
    });
    return orders
      .filter((o) => deriveStatus(o) === 'active')
      .map((o) => this.adaptApiOrderToOffer(o, query));
  }

  async approveOffer(offer: Offer): Promise<{ txHash?: `0x${string}` }> {
    if (!this.walletClient || !this.walletAddress) {
      throw new Error('Wallet not connected — cannot accept OpenSea offer.');
    }
    const protocolAddress =
      (offer.raw as OpenSeaApiOrder | undefined)?.protocol_address ??
      SEAPORT_V1_6_ADDRESS;

    // OpenSea returns ready-to-send transaction data. We forward it verbatim to
    // viem's `sendTransaction`, which handles signing + broadcasting.
    const fulfillment = await this.rest.getOfferFulfillmentData({
      orderHash: offer.id,
      fulfillerAddress: this.walletAddress,
      protocolAddress,
      consideration: [
        {
          token: offer.tokenAddress,
          identifier: offer.tokenId,
          quantity: '1',
        },
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

  // ---- helpers ----

  private requireCurrency(contract: Address): ListingCurrency {
    const currency = findCurrencyByAddress(this.chainId, contract);
    if (!currency) {
      throw new Error(
        `Currency ${contract} is not in the per-chain matrix for chain ${this.chainId}.`,
      );
    }
    return currency;
  }

  private resolveCurrency(order: OpenSeaApiOrder): ListingCurrency {
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

  private adaptApiOrderToListing(
    raw: OpenSeaApiOrder,
    query: ListingsQuery,
  ): Listing {
    const currency = this.resolveCurrency(raw);
    return {
      id: raw.order_hash,
      marketplace: this.id,
      source: 'OpenSea',
      tokenAddress: query.tokenAddress,
      tokenId: query.tokenId,
      seller: (raw.maker?.address ?? '0x0') as Address,
      price: priceFromWei(raw.current_price ?? '0', currency),
      createdAt: raw.created_date ?? new Date().toISOString(),
      expirationTime: raw.expiration_time
        ? secondsToIso(raw.expiration_time)
        : new Date(0).toISOString(),
      status: deriveStatus(raw),
      externalUrl: this.buildExternalUrl(query.tokenAddress, query.tokenId),
      raw,
    };
  }

  private adaptApiOrderToOffer(
    raw: OpenSeaApiOrder,
    query: OffersQuery,
  ): Offer {
    const currency = this.resolveCurrency(raw);
    return {
      id: raw.order_hash,
      marketplace: this.id,
      source: 'OpenSea',
      tokenAddress: query.tokenAddress,
      tokenId: query.tokenId,
      bidder: (raw.maker?.address ?? '0x0') as Address,
      price: priceFromWei(raw.current_price ?? '0', currency),
      createdAt: raw.created_date ?? new Date().toISOString(),
      expirationTime: raw.expiration_time
        ? secondsToIso(raw.expiration_time)
        : new Date(0).toISOString(),
      status: deriveStatus(raw),
      externalUrl: this.buildExternalUrl(query.tokenAddress, query.tokenId),
      raw,
    };
  }

  /**
   * Adapt the SDK's `Listing` payload to our internal type.
   *
   * The SDK returns a v2-shaped order with snake_case fields. We don't run it through
   * the zod schema (it comes from a typed call inside the SDK, not over the wire), but
   * we still defensively read every field.
   */
  private adaptSdkListing(
    sdkListing: OpenSeaListingV2,
    currency: ListingCurrency,
    query: ListingsQuery,
  ): Listing {
    const priceWei = sdkListing.price?.current?.value ?? '0';
    const params = sdkListing.protocol_data?.parameters;
    const expirationSeconds = params ? Number(params.endTime) : 0;
    const createdSeconds = params
      ? Number(params.startTime)
      : Math.floor(Date.now() / 1000);
    return {
      id: sdkListing.order_hash,
      marketplace: this.id,
      source: 'OpenSea',
      tokenAddress: query.tokenAddress,
      tokenId: query.tokenId,
      seller: (params?.offerer ?? this.walletAddress ?? '0x0') as Address,
      price: priceFromWei(priceWei, currency),
      createdAt: secondsToIso(createdSeconds),
      expirationTime: secondsToIso(expirationSeconds),
      status: 'active',
      externalUrl: this.buildExternalUrl(query.tokenAddress, query.tokenId),
      raw: sdkListing as unknown as OpenSeaApiOrder,
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
 * `remaining_quantity` + `expiration_time`). The API has no single `status` string.
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

function readOrderParameters(raw: unknown): SeaportOrderParameters | undefined {
  const protocolData = (raw as { protocol_data?: OpenSeaProtocolData })
    ?.protocol_data;
  return protocolData?.parameters;
}

/**
 * `Seaport.cancel` accepts `OrderComponents[]`, which equals `OrderParameters` minus
 * `totalOriginalConsiderationItems` plus `counter`. The API payload may include
 * either field; this normalizes to the cancel-call shape.
 */
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

/**
 * The `/offers/fulfillment_data` response can return `input_data` either as raw
 * calldata hex or as a structured object. We pass through hex strings unchanged.
 */
function encodeInputData(inputData: unknown): `0x${string}` {
  if (typeof inputData === 'string' && inputData.startsWith('0x')) {
    return inputData as `0x${string}`;
  }
  // If OpenSea ever returns a structured shape here, we'd need to abi-encode it
  // ourselves. For Seaport `fulfillOrder` flows the API returns raw calldata.
  throw new Error(
    'OpenSea fulfillment_data returned an unexpected input_data shape (expected hex calldata).',
  );
}

// Re-export for downstream type checks (the addresses below come from viem).
void getAddress;
