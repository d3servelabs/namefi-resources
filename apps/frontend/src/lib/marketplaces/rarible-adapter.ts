import { type Address, formatUnits, parseUnits } from 'viem';
import {
  NATIVE_TOKEN_ADDRESS,
  findCurrencyByAddress,
  getDefaultListingCurrencyForChain,
  getListingCurrenciesForChain,
} from './currencies';
import type { RaribleAdapterArgs } from './factory';
import {
  type MarketPlace,
  MarketplaceUnsupportedChainError,
  MarketplaceUnsupportedOperationError,
} from './marketplace.interface';
import type { RaribleAssetType, RaribleOrder } from './rarible/api-schemas';
import {
  CHAIN_ID_TO_RARIBLE_BLOCKCHAIN,
  CHAIN_ID_TO_RARIBLE_ENV,
  RARIBLE_PROTOCOL_FEE_BPS,
  type RaribleEnv,
  getRaribleSiteBaseUrl,
} from './rarible/constants';
import { RaribleRestClient } from './rarible/rest-client';
import { withRaribleRetry } from './rarible/retry';
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

/**
 * Hybrid Rarible adapter:
 *   - `RaribleRestClient` (raw v0.1 REST + zod) serves all reads
 *     (`getExistingListings`, `getOffersForListing`) — no wallet, no SDK.
 *   - `@rarible/sdk` builds + signs + posts orders for writes (`createListing`,
 *     `cancelListing`, `approveOffer`). The SDK is ethers-only, so a viem
 *     `WalletClient` is bridged to an ethers v5 `Web3Provider` first.
 *   - The SDK and ethers are loaded via dynamic `import()` inside the write
 *     methods, keeping the heavy multichain SDK off the read path / app shell.
 *
 * v1 scope: fixed-price listings in the chain's native asset (ETH), matching
 * the OpenSea adapter and the create-listing modal.
 */
export class RaribleAdapter implements MarketPlace {
  readonly id = 'rarible' as const;
  readonly displayName = 'Rarible';
  readonly chainId: number;

  private readonly rest: RaribleRestClient;
  private readonly walletClient: RaribleAdapterArgs['walletClient'];
  private readonly walletAddress: Address | undefined;
  private readonly apiKey: string;
  /** Rarible "Blockchain" union id for this chain (`ETHEREUM` / `BASE`). */
  private readonly blockchain: string;
  private readonly raribleEnv: RaribleEnv;
  private readonly siteBaseUrl: string;

  constructor(args: RaribleAdapterArgs) {
    const blockchain = CHAIN_ID_TO_RARIBLE_BLOCKCHAIN[args.chainId];
    const raribleEnv = CHAIN_ID_TO_RARIBLE_ENV[args.chainId];
    if (!blockchain || !raribleEnv) {
      throw new MarketplaceUnsupportedChainError('rarible', args.chainId);
    }
    this.chainId = args.chainId;
    this.walletClient = args.walletClient;
    this.walletAddress = args.walletClient?.account?.address;
    this.apiKey = args.apiKey;
    this.blockchain = blockchain;
    this.raribleEnv = raribleEnv;
    this.siteBaseUrl = getRaribleSiteBaseUrl(args.chainId);
    this.rest = new RaribleRestClient({
      chainId: args.chainId,
      apiKey: args.apiKey,
    });
  }

  // -------- discovery --------

  getAvailableListingTypes(): readonly ListingType[] {
    return ['fixed-price'];
  }

  getAvailableListingCurrency(): readonly ListingCurrency[] {
    // v1 lists in the chain native asset only — consistent with the OpenSea
    // adapter and the create-listing modal.
    return getListingCurrenciesForChain(this.chainId).filter((c) => c.isNative);
  }

  getCapabilities(): MarketplaceCapabilities {
    // Rarible's `byMaker` endpoints accept an optional `collection` filter but
    // there's no "all listings/offers in collection X" endpoint without a
    // maker, so `byCollection` stays false.
    return { byMaker: true, byCollection: false };
  }

  async calculateListingFees(input: {
    priceWei: bigint;
    currency: ListingCurrency;
    listingType: ListingType;
  }): Promise<ListingFees> {
    const royaltyFeeBps = 0;
    const totalBps = RARIBLE_PROTOCOL_FEE_BPS + royaltyFeeBps;
    const feeWei = (input.priceWei * BigInt(totalBps)) / 10_000n;
    return {
      marketplaceFeeBps: RARIBLE_PROTOCOL_FEE_BPS,
      royaltyFeeBps,
      netToSellerWei: input.priceWei - feeWei,
      isEstimate: true,
    };
  }

  // -------- listings (seller side) --------

  async createListing(input: ListingInput): Promise<Listing> {
    if (!this.walletClient || !this.walletAddress) {
      throw new Error('Wallet not connected — cannot create Rarible listing.');
    }
    if (input.listingType !== 'fixed-price') {
      throw new MarketplaceUnsupportedOperationError(
        'rarible',
        `create ${input.listingType} listing`,
        'The Rarible adapter supports fixed-price listings only.',
      );
    }
    if (input.durationSeconds <= 0) {
      throw new Error('durationSeconds must be greater than 0');
    }
    const currency = this.requireCurrency(input.currency);
    if (!currency.isNative) {
      throw new MarketplaceUnsupportedOperationError(
        'rarible',
        'list in a custom payment token',
        'The Rarible adapter lists in the chain native asset only.',
      );
    }

    const [sdk, { toItemId, toCurrencyId }] = await Promise.all([
      this.getWriteSdk(),
      import('@rarible/types'),
    ]);

    const startSeconds =
      input.startTimeSeconds ?? Math.floor(Date.now() / 1000);
    const expirationDate = new Date(
      (startSeconds + input.durationSeconds) * 1000,
    );
    // Rarible's `sell` price is per-NFT in the currency's decimal units.
    const priceDecimal = formatUnits(input.priceWei, currency.decimals);

    // The SDK bursts several API calls per order; retry past Rarible's 429s.
    const orderId = await withRaribleRetry(
      () =>
        sdk.order.sell({
          itemId: toItemId(this.buildItemId(input.tokenAddress, input.tokenId)),
          amount: 1,
          price: priceDecimal,
          currency: toCurrencyId(`${this.blockchain}:${NATIVE_TOKEN_ADDRESS}`),
          expirationDate,
        }),
      [10_000, 20_000, 30_000],
    );

    // `sell` returns only the order id. Fetch the full order to return a
    // complete Listing; if the order isn't indexed yet, synthesize from input.
    const orderIdStr = String(orderId);
    const query: ListingsQuery = {
      tokenAddress: input.tokenAddress,
      tokenId: input.tokenId,
    };
    const order = await this.rest.getOrderById(orderIdStr).catch(() => null);
    if (order) return this.adaptOrderToListing(order, query);
    return this.buildPendingListing(orderIdStr, input, currency, startSeconds);
  }

  async getExistingListings(query: ListingsQuery): Promise<Listing[]> {
    const orders = await this.rest.getSellOrdersByItem({
      itemId: this.buildItemId(query.tokenAddress, query.tokenId),
    });
    return orders
      .filter((o) => deriveStatus(o) === 'active')
      .map((o) => this.adaptOrderToListing(o, query));
  }

  async cancelListing(listing: Listing): Promise<{ txHash?: `0x${string}` }> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected — cannot cancel Rarible listing.');
    }
    const [sdk, { toOrderId }] = await Promise.all([
      this.getWriteSdk(),
      import('@rarible/types'),
    ]);
    // Rarible cancel is an on-chain transaction (gas), unlike OpenSea's
    // gas-free off-chain cancel.
    const tx = await withRaribleRetry(() =>
      sdk.order.cancel({ orderId: toOrderId(listing.id) }),
    );
    return { txHash: tx.hash() as `0x${string}` };
  }

  async updateListing(listing: Listing, input: ListingInput): Promise<Listing> {
    await this.cancelListing(listing);
    return this.createListing(input);
  }

  // -------- offers (buyer side, seller-accepts) --------

  async getOffersForListing(query: OffersQuery): Promise<Offer[]> {
    const orders = await this.rest.getBidOrdersByItem({
      itemId: this.buildItemId(query.tokenAddress, query.tokenId),
    });
    return orders
      .filter((o) => deriveStatus(o) === 'active')
      .map((o) => this.adaptOrderToOffer(o, query));
  }

  async approveOffer(offer: Offer): Promise<{ txHash?: `0x${string}` }> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected — cannot accept Rarible offer.');
    }
    const [sdk, { toOrderId }] = await Promise.all([
      this.getWriteSdk(),
      import('@rarible/types'),
    ]);
    // The simplified `acceptBid` runs the approval + fill actions and resolves
    // to the final fill transaction.
    const tx = await withRaribleRetry(() =>
      sdk.order.acceptBid({ orderId: toOrderId(offer.id), amount: 1 }),
    );
    return { txHash: tx.hash() as `0x${string}` };
  }

  rejectOffer(): Promise<never> {
    throw new MarketplaceUnsupportedOperationError(
      'rarible',
      'reject an offer',
      "Rarible orderbooks don't support active rejection — bids expire, get filled, or the bidder cancels them.",
    );
  }

  // -------- maker- / collection-scoped queries --------

  async getListingsByMaker(query: MakerListingsQuery): Promise<Listing[]> {
    const initial = await this.rest.getSellOrdersByMaker({
      maker: this.toUnionAddress(query.makerAddress),
      blockchain: this.blockchain,
      collection: query.collectionAddress
        ? this.toUnionAddress(query.collectionAddress)
        : undefined,
    });
    const orders = await this.enrichOrders(initial);
    return orders
      .filter((o) => deriveStatus(o) === 'active')
      .map((o) => {
        // Sell order: `make` is the NFT, `take` is the currency.
        const tokenQuery = extractTokenFromAsset(o.make.type);
        return this.adaptOrderToListing(o, tokenQuery);
      });
  }

  async getOffersByMaker(query: MakerOffersQuery): Promise<Offer[]> {
    const initial = await this.rest.getOrderBidsByMaker({
      maker: this.toUnionAddress(query.makerAddress),
      blockchain: this.blockchain,
      collection: query.collectionAddress
        ? this.toUnionAddress(query.collectionAddress)
        : undefined,
    });
    const orders = await this.enrichOrders(initial);
    return orders
      .filter((o) => deriveStatus(o) === 'active')
      .map((o) => {
        // Bid order: `make` is the currency, `take` is the NFT.
        const tokenQuery = extractTokenFromAsset(o.take.type);
        return this.adaptOrderToOffer(o, tokenQuery);
      });
  }

  /**
   * Re-fetch each by-maker order via the batch `getOrdersByIds` endpoint to
   * populate optional fields (`endedAt`, full `make`/`take.type`) the by-maker
   * shape may omit. Falls back to the lightweight original if the enrichment
   * call fails for the whole batch — partial-failure isn't surfaced by the
   * batch endpoint, so one error means "use what we have".
   */
  private async enrichOrders(orders: RaribleOrder[]): Promise<RaribleOrder[]> {
    if (orders.length === 0) return orders;
    const ids = orders.map((o) => o.id);
    let detailed: RaribleOrder[] = [];
    try {
      detailed = await this.rest.getOrdersByIds(ids);
    } catch {
      return orders;
    }
    const byId = new Map(detailed.map((o) => [o.id, o]));
    return orders.map((o) => byId.get(o.id) ?? o);
  }

  getListingsByCollection(_query: CollectionListingsQuery): Promise<Listing[]> {
    throw new MarketplaceUnsupportedOperationError(
      'rarible',
      'list listings by collection',
      "Rarible's order endpoints filter by maker (with optional collection); there's no maker-less collection-scoped endpoint.",
    );
  }

  getOffersByCollection(_query: CollectionOffersQuery): Promise<Offer[]> {
    throw new MarketplaceUnsupportedOperationError(
      'rarible',
      'list offers by collection',
      "Rarible's order endpoints filter by maker (with optional collection); there's no maker-less collection-scoped endpoint.",
    );
  }

  /** Convert a plain address into a Rarible union address (`BLOCKCHAIN:0x…`). */
  private toUnionAddress(address: Address): string {
    return `${this.blockchain}:${address}`;
  }

  // ---- write SDK ----

  /**
   * Build a Rarible SDK instance bound to the connected wallet. The SDK,
   * `@rarible/ethers-ethereum`, `@rarible/sdk-wallet` and `ethers` are all
   * dynamically imported so they never enter the read-path bundle.
   */
  private async getWriteSdk() {
    if (!this.walletClient) {
      throw new Error('Wallet not connected.');
    }
    const [{ createRaribleSdk }, { clientToSigner }] = await Promise.all([
      import('@rarible/sdk'),
      import('./rarible/viem-ethers-signer'),
    ]);
    const signer = clientToSigner(this.walletClient);

    return createRaribleSdk(signer, this.raribleEnv, {
      apiKey: this.apiKey,
      // Rarible's free API tier rate-limits aggressively, and the SDK bursts
      // several calls per order operation. This middleware paces every SDK API
      // response by 2s to stay under the limit — without it a 429 aborts the
      // write. Complements `withRaribleRetry`; revisit (make configurable or
      // drop) once on a paid Rarible tier with higher limits.
      apiClientParams: {
        middleware: [
          {
            post: async () => {
              //because of rate-limits, sdk call can map to a burst of api calls, so calls were failing because of rate-limits
              await new Promise((resolve) => {
                setTimeout(() => {
                  resolve(undefined);
                }, 2_000);
              });
            },
          },
        ],
      },
    });
  }

  // ---- adaptation helpers ----

  private buildItemId(tokenAddress: Address, tokenId: string): string {
    return `${this.blockchain}:${tokenAddress}:${tokenId}`;
  }

  private requireCurrency(contract: Address): ListingCurrency {
    const currency = findCurrencyByAddress(this.chainId, contract);
    if (!currency) {
      throw new Error(
        `Currency ${contract} is not in the per-chain matrix for chain ${this.chainId}.`,
      );
    }
    return currency;
  }

  /**
   * Adapt a Rarible sell order to an internal `Listing`. For a sell order
   * `take` is the currency the buyer pays, so the price is `take.value`.
   */
  private adaptOrderToListing(
    order: RaribleOrder,
    query: ListingsQuery,
  ): Listing {
    const currency = this.resolveCurrency(order.take.type);
    const priceWei = assetValueToWei(order.take.value, currency.decimals);
    return {
      id: order.id,
      marketplace: this.id,
      source: 'Rarible',
      tokenAddress: query.tokenAddress,
      tokenId: query.tokenId,
      seller: stripUnionPrefix(order.maker) as Address,
      price: priceFromWei(priceWei, currency),
      createdAt: order.startedAt ?? order.createdAt ?? new Date().toISOString(),
      expirationTime: order.endedAt ?? NO_EXPIRATION_ISO,
      status: deriveStatus(order),
      externalUrl: this.buildExternalUrl(query.tokenAddress, query.tokenId),
      raw: order,
    };
  }

  /**
   * Adapt a Rarible bid order to an internal `Offer`. For a bid order `make`
   * is the currency the bidder offers, so the price is `make.value`.
   */
  private adaptOrderToOffer(order: RaribleOrder, query: OffersQuery): Offer {
    const currency = this.resolveCurrency(order.make.type);
    const priceWei = assetValueToWei(order.make.value, currency.decimals);
    return {
      id: order.id,
      marketplace: this.id,
      source: 'Rarible',
      tokenAddress: query.tokenAddress,
      tokenId: query.tokenId,
      bidder: stripUnionPrefix(order.maker) as Address,
      price: priceFromWei(priceWei, currency),
      createdAt: order.startedAt ?? order.createdAt ?? new Date().toISOString(),
      expirationTime: order.endedAt ?? NO_EXPIRATION_ISO,
      status: deriveStatus(order),
      externalUrl: this.buildExternalUrl(query.tokenAddress, query.tokenId),
      raw: order,
    };
  }

  /** A freshly-created listing not yet indexed by the Rarible API. */
  private buildPendingListing(
    orderId: string,
    input: ListingInput,
    currency: ListingCurrency,
    startSeconds: number,
  ): Listing {
    return {
      id: orderId,
      marketplace: this.id,
      source: 'Rarible',
      tokenAddress: input.tokenAddress,
      tokenId: input.tokenId,
      seller: (this.walletAddress ?? '0x0') as Address,
      price: priceFromWei(input.priceWei.toString(), currency),
      createdAt: new Date(startSeconds * 1000).toISOString(),
      expirationTime: new Date(
        (startSeconds + input.durationSeconds) * 1000,
      ).toISOString(),
      status: 'active',
      externalUrl: this.buildExternalUrl(input.tokenAddress, input.tokenId),
      raw: { orderId },
    };
  }

  private resolveCurrency(assetType: RaribleAssetType): ListingCurrency {
    const fallback =
      getDefaultListingCurrencyForChain(this.chainId) ??
      getListingCurrenciesForChain(this.chainId)[0];
    const type = assetType['@type'];
    if (type === 'ETH') {
      const native = getListingCurrenciesForChain(this.chainId).find(
        (c) => c.isNative,
      );
      if (native) return native;
    }
    if (assetType.contract) {
      const matched = findCurrencyByAddress(
        this.chainId,
        stripUnionPrefix(assetType.contract) as Address,
      );
      if (matched) return matched;
    }
    if (fallback) return fallback;
    return {
      contract: NATIVE_TOKEN_ADDRESS,
      name: 'Unknown',
      symbol: '?',
      decimals: 18,
      isNative: true,
    };
  }

  private buildExternalUrl(tokenAddress: string, tokenId: string): string {
    if (!tokenAddress || !tokenId) return this.siteBaseUrl;
    // e.g. https://rarible.com/token/base/0xCONTRACT:TOKENID
    return `${this.siteBaseUrl}/${this.blockchain.toLowerCase()}/items/${tokenAddress}:${tokenId}`;
  }
}

// ---------------------------------------------------------------------------
// Module-level helpers
// ---------------------------------------------------------------------------

/**
 * Sentinel `expirationTime` for orders with no `endedAt` — a far-future date so
 * a no-expiry order never reads as expired downstream (epoch 0 would).
 */
const NO_EXPIRATION_ISO = new Date('9999-12-31T23:59:59Z').toISOString();

function priceFromWei(rawWei: string, currency: ListingCurrency): ListingPrice {
  return {
    raw: rawWei,
    decimal: Number(formatUnits(BigInt(rawWei || '0'), currency.decimals)),
    currency,
  };
}

/**
 * Normalize a Rarible asset value to a wei string. Rarible returns asset
 * values as raw base units (integers); the decimal branch is a defensive
 * fallback in case a value ever arrives in human-decimal form.
 */
function assetValueToWei(value: string | number, decimals: number): string {
  const raw = String(value).trim();
  if (raw.includes('.')) {
    return parseUnits(raw as `${number}`, decimals).toString();
  }
  return raw || '0';
}

/** Strip a Rarible union prefix: `BASE:0xabc…` → `0xabc…`. */
function stripUnionPrefix(value: string): string {
  const colon = value.lastIndexOf(':');
  return colon >= 0 ? value.slice(colon + 1) : value;
}

/**
 * Pull the (tokenAddress, tokenId) pair off a Rarible asset type. Used by the
 * maker-scoped query methods where each returned order is on a different NFT,
 * so the caller can't pre-specify the token.
 */
function extractTokenFromAsset(assetType: RaribleAssetType): {
  tokenAddress: Address;
  tokenId: string;
} {
  return {
    tokenAddress: (assetType.contract
      ? stripUnionPrefix(assetType.contract)
      : '0x0000000000000000000000000000000000000000') as Address,
    tokenId: assetType.tokenId !== undefined ? String(assetType.tokenId) : '',
  };
}

/** Derive a normalized `OrderStatus` from a Rarible order. */
function deriveStatus(order: RaribleOrder): OrderStatus {
  if (order.cancelled === true || order.status === 'CANCELLED') {
    return 'cancelled';
  }
  if (order.status === 'FILLED') return 'filled';
  if (order.status === 'INACTIVE') return 'expired';
  if (order.endedAt) {
    const endMs = Date.parse(order.endedAt);
    if (Number.isFinite(endMs) && endMs > 0 && endMs < Date.now()) {
      return 'expired';
    }
  }
  return 'active';
}
