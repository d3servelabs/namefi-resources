import { type Address, formatUnits } from 'viem';
import {
  findCurrencyByAddress,
  getDefaultListingCurrencyForChain,
  getListingCurrenciesForChain,
} from './currencies';
import type { GetMarketplaceArgs } from './factory';
import {
  type MarketPlace,
  MarketplaceUnsupportedChainError,
  MarketplaceUnsupportedOperationError,
} from './marketplace.interface';
import {
  type OkxBuyResponse,
  OkxBuyResponseSchema,
  type OkxCreateListingResponse,
  OkxCreateListingResponseSchema,
  type OkxOrder,
  type OkxOrderParameters,
  OkxOrderParametersSchema,
  OkxOrderSchema,
  type OkxStepItem,
} from './okx/api-schemas';
import {
  ERC20_APPROVE_ABI,
  ERC721_SET_APPROVAL_FOR_ALL_ABI,
  getOkxChainKey,
  OKX_PROTOCOL_FEE_BPS,
  OKX_SITE_BASE,
} from './okx/constants';
import { marketplaceProxyClient } from './proxy/trpc-client';
import { SeaportCancelAbi } from './seaport/abi';
import { SEAPORT_V1_6_ADDRESS } from './seaport/constants';
import type {
  CollectionListingsQuery,
  CollectionOffersQuery,
  Listing,
  ListingCurrency,
  ListingFees,
  ListingInput,
  ListingPrice,
  ListingsQuery,
  ListingType,
  MakerListingsQuery,
  MakerOffersQuery,
  MarketplaceCapabilities,
  Offer,
  OffersQuery,
  OrderStatus,
} from './types';

/**
 * OKX NFT marketplace adapter — drives OKX's website-internal `/priapi/`
 * createListing flow.
 *
 * Originally preserved as `LegacyOkxAdapter` after the Seaport-based
 * `OkxAdapter` was built (when the public `/api/v5/.../create-listing`
 * appeared dead). Revived once the working `/priapi/v1/nft/trading/createListing`
 * and `/priapi/v1/nft/detail-info` (nftId lookup) endpoints were discovered;
 * `getMarketplace()` now wires THIS adapter for `okx`. The Seaport-based
 * `OkxAdapter` stays in the codebase as a parallel client-build implementation.
 *
 * OKX is Seaport-based and REST-only (no SDK). Its API HMAC-signs every
 * request with a secret, so the adapter never calls OKX directly — it goes
 * through the backend `nftMarketplaces` proxy (`marketplaceProxyClient`).
 * Wallet signing and on-chain transactions still happen here, client-side.
 *
 * Flow per operation:
 *   - reads      → proxy `okx.getListings` / `okx.getOffers`
 *   - createListing → look up `nftId` via proxy `okx.getNftDetailInfo`, then
 *     proxy `okx.createListingPriapi` returns approval + EIP-712 steps; the
 *     adapter runs the NFT approval, signs the Seaport order, and relays the
 *     signature via proxy `okx.submitListing`
 *   - cancelListing → on-chain Seaport `cancel` (reuses `seaport/`)
 *   - approveOffer  → proxy `okx.buy` returns approval + transaction steps;
 *     the adapter runs them with the wallet
 *
 * v1 scope is fixed-price listings. OKX supports Ethereum mainnet and Base
 * (no testnet) — see `ADAPTER_CHAIN_SUPPORT` in `chains.ts`.
 */
export class OkxAdapter implements MarketPlace {
  readonly id = 'okx' as const;
  readonly displayName = 'OKX';
  readonly chainId: number;

  private readonly publicClient: GetMarketplaceArgs['publicClient'];
  private readonly walletClient: GetMarketplaceArgs['walletClient'];
  private readonly walletAddress: Address | undefined;
  private readonly okxChainKey: string;

  constructor(args: GetMarketplaceArgs) {
    const okxChainKey = getOkxChainKey(args.chainId);
    if (!okxChainKey) {
      throw new MarketplaceUnsupportedChainError('okx', args.chainId);
    }
    this.chainId = args.chainId;
    this.publicClient = args.publicClient;
    this.walletClient = args.walletClient;
    this.walletAddress = args.walletClient?.account?.address;
    this.okxChainKey = okxChainKey;
  }

  // -------- discovery --------

  getAvailableListingTypes(): readonly ListingType[] {
    return ['fixed-price'];
  }

  getAvailableListingCurrency(): readonly ListingCurrency[] {
    // v1: native asset only, for parity with the OpenSea / Rarible adapters.
    return getListingCurrenciesForChain(this.chainId).filter((c) => c.isNative);
  }

  getCapabilities(): MarketplaceCapabilities {
    // The OKX backend proxy only exposes per-NFT endpoints today; there are no
    // by-maker or by-collection listing/offer endpoints. Until the proxy grows
    // those routes, the maker-/collection-scoped query methods on this adapter
    // throw and the UI hides OKX from cross-token panels via these flags.
    return { byMaker: false, byCollection: false };
  }

  async calculateListingFees(input: {
    priceWei: bigint;
    currency: ListingCurrency;
    listingType: ListingType;
  }): Promise<ListingFees> {
    // Pull the live OKX trade fee (`/priapi/v1/nft/order/tradeFees`); fall
    // back to the constant on any failure so the preview stays usable when
    // the proxy is unconfigured / offline. `tradeFees` is a percentage
    // (`0.00` = 0%, `2.5` = 2.5%) — convert to basis points.
    let marketplaceFeeBps = OKX_PROTOCOL_FEE_BPS;
    let isEstimate = true;
    try {
      const { tradeFees } =
        await marketplaceProxyClient.nftMarketplaces.okx.getTradeFees.query({
          chain: this.chainId,
        });
      marketplaceFeeBps = Math.round(tradeFees * 100);
      isEstimate = false;
    } catch {
      // proxy unconfigured / network error — silent fallback to the constant.
    }
    const royaltyFeeBps = 0;
    const totalBps = marketplaceFeeBps + royaltyFeeBps;
    const feeWei = (input.priceWei * BigInt(totalBps)) / 10_000n;
    return {
      marketplaceFeeBps,
      royaltyFeeBps,
      netToSellerWei: input.priceWei - feeWei,
      isEstimate,
    };
  }

  // -------- listings (seller side) --------

  async createListing(input: ListingInput): Promise<Listing> {
    const wallet = this.requireWallet('create an OKX listing');
    if (input.listingType !== 'fixed-price') {
      throw new MarketplaceUnsupportedOperationError(
        'okx',
        `create a ${input.listingType} listing`,
        'The OKX adapter supports fixed-price listings only.',
      );
    }
    if (input.durationSeconds <= 0) {
      throw new Error('durationSeconds must be greater than 0');
    }
    const currency = this.requireCurrency(input.currency);

    const startSeconds =
      input.startTimeSeconds ?? Math.floor(Date.now() / 1000);
    const validTime = startSeconds + input.durationSeconds;

    // OKX's /priapi/ createListing is keyed by OKX's internal `nftId`, not
    // `(collectionAddress, tokenId)`. Resolve it via the detail-info proxy.
    const nftInfo =
      await marketplaceProxyClient.nftMarketplaces.okx.getNftDetailInfo.query({
        chain: this.chainId,
        contractAddress: input.tokenAddress,
        tokenId: input.tokenId,
      });
    if (!nftInfo.supportTrade) {
      throw new MarketplaceUnsupportedOperationError(
        'okx',
        'create a listing',
        "OKX doesn't support trading this NFT.",
      );
    }

    let response: OkxCreateListingResponse;
    try {
      response = OkxCreateListingResponseSchema.parse(
        await marketplaceProxyClient.nftMarketplaces.okx.createListingPriapi.mutate(
          {
            // /priapi/ uses the numeric chain id as a string (e.g. "8453"),
            // not the public-API chain key ("base").
            chain: String(this.chainId),
            walletAddress: wallet.address,
            items: [
              {
                nftId: nftInfo.id,
                price: input.priceWei.toString(),
                currencyAddress: currency.contract,
                count: 1,
                validTime,
                source: 4,
                royaltyFeePoints: 0,
              },
            ],
          },
        ),
      );
    } catch (error) {
      // Defensive: if OKX disables /priapi/ createListing too, surface a
      // clean unsupported-operation error instead of a raw 500.
      rethrowIfOkxDiscontinued(error, 'create a listing');
    }
    if (response.errors.length > 0) {
      throw new Error(
        `OKX rejected the listing: ${JSON.stringify(response.errors)}`,
      );
    }

    // Steps are ordered: NFT approval first, then sign + submit the order.
    await this.runListingSteps(response.steps);

    const created = response.orders[0];
    return {
      id:
        created?.id ??
        `okx-${input.tokenAddress}-${input.tokenId}-${validTime}`,
      marketplace: this.id,
      source: 'OKX',
      tokenAddress: input.tokenAddress,
      tokenId: input.tokenId,
      seller: wallet.address,
      price: priceFromWei(
        created?.price ?? input.priceWei.toString(),
        currency,
      ),
      createdAt: secondsToIso(startSeconds),
      expirationTime: secondsToIso(validTime),
      status: 'active',
      externalUrl: this.buildExternalUrl(input.tokenAddress, input.tokenId),
      raw: response,
    };
  }

  /** Run the create-listing steps: NFT approval(s), then sign + submit. */
  private async runListingSteps(
    steps: OkxCreateListingResponse['steps'],
  ): Promise<void> {
    for (const step of steps) {
      for (const item of step.items) {
        if (isIncompleteApproval(item)) {
          await this.runApprovalStep(item);
        }
        if (item.kind === 'signature' && item.status !== 'complete') {
          await this.signAndSubmitOrder(item);
        }
      }
    }
  }

  async getExistingListings(query: ListingsQuery): Promise<Listing[]> {
    const orders = await this.fetchOrders('listings', query);
    return orders
      .filter(
        (o) =>
          o.orderType !== 'Offer' && normalizeOkxStatus(o.status) === 'active',
      )
      .map((o) => this.adaptListing(o, query));
  }

  async cancelListing(listing: Listing): Promise<{ txHash?: `0x${string}` }> {
    const wallet = this.requireWallet('cancel an OKX listing');
    const params = readOkxOrderParameters(listing.raw);
    if (!params) {
      throw new Error(
        'Cannot cancel OKX listing: the order is missing its Seaport protocol data.',
      );
    }
    // OKX listings are Seaport orders — cancel on-chain via `Seaport.cancel`.
    const txHash = await wallet.client.writeContract({
      address: SEAPORT_V1_6_ADDRESS,
      abi: SeaportCancelAbi,
      functionName: 'cancel',
      args: [[toSeaportOrderComponents(params)]],
      account: wallet.client.account ?? null,
      chain: null,
    });
    return { txHash };
  }

  async updateListing(listing: Listing, input: ListingInput): Promise<Listing> {
    await this.cancelListing(listing);
    return this.createListing(input);
  }

  // -------- offers (buyer side, seller-accepts) --------

  async getOffersForListing(query: OffersQuery): Promise<Offer[]> {
    const orders = await this.fetchOrders('offers', query);
    return orders
      .filter((o) => normalizeOkxStatus(o.status) === 'active')
      .map((o) => this.adaptOffer(o, query));
  }

  async approveOffer(offer: Offer): Promise<{ txHash?: `0x${string}` }> {
    const wallet = this.requireWallet('accept an OKX offer');
    const orderId = readOkxOrderId(offer.raw);
    if (!orderId) {
      throw new Error(
        'Cannot accept OKX offer: the offer is missing its OKX orderId.',
      );
    }
    let response: OkxBuyResponse;
    try {
      response = OkxBuyResponseSchema.parse(
        await marketplaceProxyClient.nftMarketplaces.okx.buy.mutate({
          chain: this.okxChainKey,
          walletAddress: wallet.address,
          items: [{ orderId, takeCount: 1 }],
        }),
      );
    } catch (error) {
      rethrowIfOkxDiscontinued(error, 'accept an offer');
    }
    if (response.errors.length > 0) {
      throw new Error(
        `OKX rejected the offer fulfillment: ${JSON.stringify(response.errors)}`,
      );
    }

    let txHash: `0x${string}` | undefined;
    for (const step of response.steps) {
      for (const item of step.items) {
        if (isIncompleteApproval(item)) {
          await this.runApprovalStep(item);
        }
        if (item.kind === 'transaction' && item.status !== 'complete') {
          txHash = await this.runTransactionStep(item);
        }
      }
    }
    return { txHash };
  }

  rejectOffer(): Promise<never> {
    throw new MarketplaceUnsupportedOperationError(
      'okx',
      'reject an offer',
      "Seaport orderbooks don't support active rejection — offers expire, get filled, or the bidder cancels them.",
    );
  }

  // -------- maker- / collection-scoped queries --------

  getListingsByMaker(_query: MakerListingsQuery): Promise<Listing[]> {
    throw new MarketplaceUnsupportedOperationError(
      'okx',
      'list listings by maker',
      'The OKX backend proxy only exposes per-NFT endpoints today.',
    );
  }

  getOffersByMaker(_query: MakerOffersQuery): Promise<Offer[]> {
    throw new MarketplaceUnsupportedOperationError(
      'okx',
      'list offers by maker',
      'The OKX backend proxy only exposes per-NFT endpoints today.',
    );
  }

  getListingsByCollection(_query: CollectionListingsQuery): Promise<Listing[]> {
    throw new MarketplaceUnsupportedOperationError(
      'okx',
      'list listings by collection',
      'The OKX backend proxy only exposes per-NFT endpoints today.',
    );
  }

  getOffersByCollection(_query: CollectionOffersQuery): Promise<Offer[]> {
    throw new MarketplaceUnsupportedOperationError(
      'okx',
      'list offers by collection',
      'The OKX backend proxy only exposes per-NFT endpoints today.',
    );
  }

  // -------- internals --------

  /** Fetch raw OKX orders via the proxy, tolerating an unconfigured proxy. */
  private async fetchOrders(
    kind: 'listings' | 'offers',
    query: ListingsQuery,
  ): Promise<OkxOrder[]> {
    try {
      const result =
        kind === 'listings'
          ? await marketplaceProxyClient.nftMarketplaces.okx.getListings.query({
              chain: this.okxChainKey,
              collectionAddress: query.tokenAddress,
              tokenId: query.tokenId,
            })
          : await marketplaceProxyClient.nftMarketplaces.okx.getOffers.query({
              chain: this.okxChainKey,
              collectionAddress: query.tokenAddress,
              tokenId: query.tokenId,
            });
      return result.orders.flatMap((raw) => {
        const parsed = OkxOrderSchema.safeParse(raw);
        return parsed.success ? [parsed.data] : [];
      });
    } catch (error) {
      // An unconfigured OKX proxy shouldn't surface as a panel error — the
      // marketplace simply contributes nothing. Real failures still throw.
      if (isNotConfiguredError(error)) return [];
      throw error;
    }
  }

  /** Run an NFT (`setApprovalForAll`) or ERC-20 (`approve`) approval step. */
  private async runApprovalStep(item: OkxStepItem): Promise<void> {
    const wallet = this.requireWallet('approve a token for OKX');
    let txHash: `0x${string}`;
    if (item.kind === 'erc20Approval') {
      if (!item.tokenAddress || !item.approvalAddress) {
        throw new Error(
          'OKX ERC-20 approval step is missing the token or approval address.',
        );
      }
      txHash = await wallet.client.writeContract({
        address: item.tokenAddress as Address,
        abi: ERC20_APPROVE_ABI,
        functionName: 'approve',
        args: [item.approvalAddress as Address, BigInt(item.amount ?? 0)],
        account: wallet.client.account ?? null,
        chain: null,
      });
    } else {
      if (!item.collectionAddress || !item.approvalAddress) {
        throw new Error(
          'OKX NFT approval step is missing the collection or approval address.',
        );
      }
      txHash = await wallet.client.writeContract({
        address: item.collectionAddress as Address,
        abi: ERC721_SET_APPROVAL_FOR_ALL_ABI,
        functionName: 'setApprovalForAll',
        args: [item.approvalAddress as Address, true],
        account: wallet.client.account ?? null,
        chain: null,
      });
    }
    // Wait for the approval to mine — OKX rejects the order submit / fill
    // until the on-chain approval is visible.
    await this.publicClient.waitForTransactionReceipt({ hash: txHash });
  }

  /**
   * Sign the Seaport `OrderComponents` OKX built, then relay the signature
   * back through the proxy's `submitListing` passthrough.
   */
  private async signAndSubmitOrder(item: OkxStepItem): Promise<void> {
    const wallet = this.requireWallet('sign the OKX listing');
    if (item.signKind && item.signKind !== 'eip712') {
      throw new Error(
        `OKX returned an unsupported signature kind: ${item.signKind}`,
      );
    }
    if (!item.domain || !item.types || !item.primaryType || !item.post) {
      throw new Error(
        'OKX signature step is missing its typed-data or submit instructions.',
      );
    }
    const parameters = OkxOrderParametersSchema.parse(item.data);
    // viem derives the `EIP712Domain` type from `domain` — it must not also
    // appear in `types`.
    const signTypes = Object.fromEntries(
      Object.entries(item.types).filter(([key]) => key !== 'EIP712Domain'),
    );
    const signature = await wallet.client.signTypedData({
      account: wallet.address,
      domain: {
        name: item.domain.name,
        version: item.domain.version,
        chainId:
          item.domain.chainId !== undefined
            ? Number(item.domain.chainId)
            : this.chainId,
        verifyingContract: item.domain.verifyingContract as Address | undefined,
      },
      types: signTypes,
      primaryType: item.primaryType,
      message: toSigningMessage(parameters),
    } as Parameters<typeof wallet.client.signTypedData>[0]);

    // OKX templates the submit body; fill in the signature and relay it.
    const baseBody =
      item.post.body && typeof item.post.body === 'object'
        ? (item.post.body as Record<string, unknown>)
        : {};
    await marketplaceProxyClient.nftMarketplaces.okx.submitListing.mutate({
      chain: this.okxChainKey,
      endpoint: item.post.endpoint,
      body: {
        ...baseBody,
        signature,
        r: signature.slice(0, 66),
        s: `0x${signature.slice(66, 130)}`,
      },
    });
  }

  /** Send a ready-built OKX transaction step (e.g. `TakeOrders`). */
  private async runTransactionStep(item: OkxStepItem): Promise<`0x${string}`> {
    const wallet = this.requireWallet('submit an OKX transaction');
    if (!item.contractAddress || !item.input) {
      throw new Error(
        'OKX transaction step is missing the target contract or calldata.',
      );
    }
    return wallet.client.sendTransaction({
      to: item.contractAddress as Address,
      data: item.input as `0x${string}`,
      value: BigInt(item.value ?? 0),
      account: wallet.client.account ?? null,
      chain: null,
    });
  }

  private adaptListing(order: OkxOrder, query: ListingsQuery): Listing {
    const currency = this.resolveCurrency(order.currencyAddress);
    return {
      id: order.orderHash ?? order.orderId,
      marketplace: this.id,
      source: 'OKX',
      tokenAddress: query.tokenAddress,
      tokenId: query.tokenId,
      seller: order.maker as Address,
      price: priceFromWei(order.price, currency),
      createdAt: secondsToIso(order.createTime ?? order.listingTime),
      expirationTime: secondsToIso(order.expirationTime),
      status: normalizeOkxStatus(order.status),
      externalUrl: this.buildExternalUrl(query.tokenAddress, query.tokenId),
      raw: order,
    };
  }

  private adaptOffer(order: OkxOrder, query: OffersQuery): Offer {
    const currency = this.resolveCurrency(order.currencyAddress);
    return {
      id: order.orderHash ?? order.orderId,
      marketplace: this.id,
      source: 'OKX',
      tokenAddress: query.tokenAddress,
      tokenId: query.tokenId,
      bidder: order.maker as Address,
      price: priceFromWei(order.price, currency),
      createdAt: secondsToIso(order.createTime ?? order.listingTime),
      expirationTime: secondsToIso(order.expirationTime),
      status: normalizeOkxStatus(order.status),
      externalUrl: this.buildExternalUrl(query.tokenAddress, query.tokenId),
      raw: order,
    };
  }

  private requireWallet(action: string): {
    client: NonNullable<GetMarketplaceArgs['walletClient']>;
    address: Address;
  } {
    if (!this.walletClient || !this.walletAddress) {
      throw new Error(`Connect a wallet to ${action}.`);
    }
    return { client: this.walletClient, address: this.walletAddress };
  }

  private requireCurrency(contract: Address): ListingCurrency {
    const currency = findCurrencyByAddress(this.chainId, contract);
    if (!currency) {
      throw new Error(
        `Currency ${contract} is not configured for chain ${this.chainId}.`,
      );
    }
    return currency;
  }

  private resolveCurrency(contract: string): ListingCurrency {
    return (
      findCurrencyByAddress(this.chainId, contract as Address) ??
      getDefaultListingCurrencyForChain(this.chainId) ??
      getListingCurrenciesForChain(this.chainId)[0] ??
      UNKNOWN_CURRENCY
    );
  }

  private buildExternalUrl(tokenAddress: string, tokenId: string): string {
    if (!tokenAddress || !tokenId) return OKX_SITE_BASE;
    return `${OKX_SITE_BASE}/nft/asset/${this.okxChainKey}/${tokenAddress}/${tokenId}`;
  }
}

// ---------------------------------------------------------------------------
// Module-level helpers
// ---------------------------------------------------------------------------

/** Fallback currency for an order whose payment token isn't in the matrix. */
const UNKNOWN_CURRENCY: ListingCurrency = {
  contract: '0x0000000000000000000000000000000000000000',
  name: 'Unknown',
  symbol: '?',
  decimals: 18,
  isNative: true,
};

/** Matches a string of ASCII digits only. */
const DIGITS_ONLY_PATTERN = /^\d+$/;

/** Matches the "not configured" message thrown by the OKX proxy. */
const NOT_CONFIGURED_PATTERN = /not configured/i;

/** Matches OKX's "No longer available" response for a disabled endpoint. */
const OKX_DISCONTINUED_PATTERN = /no longer available/i;

function priceFromWei(rawWei: string, currency: ListingCurrency): ListingPrice {
  const safeWei = DIGITS_ONLY_PATTERN.test(rawWei) ? rawWei : '0';
  return {
    raw: safeWei,
    decimal: Number(formatUnits(BigInt(safeWei), currency.decimals)),
    currency,
  };
}

/**
 * Far-future sentinel for "no/unknown timestamp". Epoch-0 was wrong here —
 * it made any order with a missing OKX timestamp render as "expired" in the
 * panel, even though the OKX-side status was still `active`. A far-future
 * ISO keeps such orders sorted as "latest expiry / most recent" instead.
 */
const UNKNOWN_TIMESTAMP_ISO = '9999-12-31T23:59:59.000Z';

function secondsToIso(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) {
    return UNKNOWN_TIMESTAMP_ISO;
  }
  return new Date(seconds * 1000).toISOString();
}

function normalizeOkxStatus(status: string): OrderStatus {
  switch (status.toLowerCase()) {
    case 'active':
      return 'active';
    case 'sold':
      return 'filled';
    case 'cancelled':
      return 'cancelled';
    case 'inactive':
    case 'expired':
      return 'expired';
    default:
      return 'active';
  }
}

/** True when a step item is an approval that still needs to be sent. */
function isIncompleteApproval(item: OkxStepItem): boolean {
  return (
    (item.kind === 'nftApproval' || item.kind === 'erc20Approval') &&
    item.status !== 'complete'
  );
}

/** True when an error means the OKX proxy isn't configured (missing secrets). */
function isNotConfiguredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return NOT_CONFIGURED_PATTERN.test(message);
}

/**
 * Rethrow an OKX proxy error. If OKX reports the endpoint is disabled
 * (`{ code: -1, "No longer available" }`) surface a clean
 * `MarketplaceUnsupportedOperationError`; otherwise rethrow unchanged.
 */
function rethrowIfOkxDiscontinued(error: unknown, operation: string): never {
  const message = error instanceof Error ? error.message : String(error);
  if (OKX_DISCONTINUED_PATTERN.test(message)) {
    throw new MarketplaceUnsupportedOperationError(
      'okx',
      operation,
      'OKX has disabled this operation on its NFT marketplace API.',
    );
  }
  throw error instanceof Error ? error : new Error(message);
}

/**
 * Pull the Seaport `OrderComponents` out of a listing's `raw` blob.
 *
 * `raw` carries one of two shapes:
 *   1. an OKX read-side order (`getListings` / `getOffers`) — parameters
 *      live under `protocolData.parameters`.
 *   2. an OKX `create-listing` response (stashed by `createListing` so a
 *      freshly-built listing is cancelable without a refetch) — parameters
 *      live on the signature step's `item.data`.
 */
function readOkxOrderParameters(raw: unknown): OkxOrderParameters | undefined {
  const order = OkxOrderSchema.safeParse(raw);
  if (order.success) return order.data.protocolData?.parameters;

  const created = OkxCreateListingResponseSchema.safeParse(raw);
  if (created.success) {
    for (const step of created.data.steps) {
      for (const item of step.items) {
        if (item.kind !== 'signature') continue;
        const params = OkxOrderParametersSchema.safeParse(item.data);
        if (params.success) return params.data;
      }
    }
  }
  return undefined;
}

function readOkxOrderId(raw: unknown): string | undefined {
  const order = OkxOrderSchema.safeParse(raw);
  if (order.success) return order.data.orderId;

  const created = OkxCreateListingResponseSchema.safeParse(raw);
  if (created.success) return created.data.orders[0]?.id;

  return undefined;
}

/** Build the viem `OrderComponents` tuple for the on-chain `Seaport.cancel`. */
function toSeaportOrderComponents(params: OkxOrderParameters) {
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
      recipient: (item.recipient ?? params.offerer) as Address,
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
 * Build the EIP-712 `message` for `signTypedData` from OKX's order data.
 * Every uint field is widened to `bigint` — OKX mixes string and number
 * encodings, and viem's typed-data encoder requires numeric values.
 */
function toSigningMessage(params: OkxOrderParameters): Record<string, unknown> {
  const adaptItem = (item: OkxOrderParameters['offer'][number]) => ({
    itemType: BigInt(item.itemType),
    token: item.token,
    identifierOrCriteria: BigInt(item.identifierOrCriteria),
    startAmount: BigInt(item.startAmount),
    endAmount: BigInt(item.endAmount),
    ...(item.recipient !== undefined ? { recipient: item.recipient } : {}),
  });
  return {
    offerer: params.offerer,
    zone: params.zone,
    offer: params.offer.map(adaptItem),
    consideration: params.consideration.map(adaptItem),
    orderType: BigInt(params.orderType),
    startTime: BigInt(params.startTime),
    endTime: BigInt(params.endTime),
    zoneHash: params.zoneHash,
    salt: BigInt(params.salt),
    conduitKey: params.conduitKey,
    counter: BigInt(params.counter ?? 0),
  };
}
