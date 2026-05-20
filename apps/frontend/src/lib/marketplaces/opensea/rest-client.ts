import {
  type FulfillmentDataResponse,
  FulfillmentDataResponseSchema,
  type OpenSeaApiOrder,
  OpenSeaOrdersResponseSchema,
} from './api-schemas';
import {
  OPENSEA_API_BASE_MAINNET,
  OPENSEA_API_BASE_TESTNET,
} from './constants';

interface OpenSeaRestClientArgs {
  chainSlug: string;
  isTestnet: boolean;
  apiKey: string | undefined;
}

interface OfferFulfillmentArgs {
  orderHash: string;
  fulfillerAddress: string;
  protocolAddress: string;
  /**
   * The asset the seller is transferring to the buyer. OpenSea's
   * `/offers/fulfillment_data` body expects a single object, NOT an array.
   */
  consideration: {
    tokenAddress: string;
    tokenId: string;
  };
}

interface OffersForNftArgs {
  collectionSlug: string;
  tokenId: string;
  /** Max items to fetch (OpenSea default = 50, max = 100). */
  limit?: number;
}

/**
 * Typed wrapper around the slice of OpenSea v2 REST the SDK doesn't cover.
 *
 * `@opensea/sdk/viem` handles listing reads (`sdk.api.getBestListing`) and the
 * single best offer (`sdk.api.getBestOffer`) but doesn't expose a way to fetch
 * **all** active offers on a token — for that we hit the raw v2 path
 * `GET /api/v2/offers/collection/{slug}/nfts/{tokenId}` directly.
 *
 * The other raw call is `POST /api/v2/offers/fulfillment_data`, which returns
 * ready-to-send transaction calldata for accepting an offer.
 */
export class OpenSeaRestClient {
  private readonly chainSlug: string;
  private readonly apiBaseUrl: string;
  private readonly apiKey: string | undefined;

  constructor(args: OpenSeaRestClientArgs) {
    this.chainSlug = args.chainSlug;
    this.apiBaseUrl = args.isTestnet
      ? OPENSEA_API_BASE_TESTNET
      : OPENSEA_API_BASE_MAINNET;
    this.apiKey = args.apiKey;
  }

  /**
   * `GET /api/v2/offers/collection/{slug}/nfts/{tokenId}` — all active offers for
   * a token, paginated. We fetch a single page; if the user wants more we can wire
   * up pagination later.
   */
  async listOffersForNft(args: OffersForNftArgs): Promise<OpenSeaApiOrder[]> {
    const url = new URL(
      `/api/v2/offers/collection/${args.collectionSlug}/nfts/${args.tokenId}`,
      this.apiBaseUrl,
    );
    url.searchParams.set('limit', String(args.limit ?? 50));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.buildHeaders(),
    });
    if (!response.ok) {
      const body = await response.text();
      // OpenSea returns 404 — and sometimes 500 with a "No offers found …" body —
      // when a token simply has no offers. Treat both as an empty result.
      if (response.status === 404 || /no\s+offers?\s+found/i.test(body)) {
        return [];
      }
      throw new Error(
        `OpenSea offers fetch failed (${response.status}): ${body}`,
      );
    }
    const payload = OpenSeaOrdersResponseSchema.parse(await response.json());
    return payload.orders;
  }

  /**
   * `POST /api/v2/offers/fulfillment_data` — returns transaction data for accepting
   * an incoming offer (seller-side). Body shape per OpenSea's API docs: `offer`,
   * `fulfiller`, and a SINGLE `consideration` object (not array).
   */
  async getOfferFulfillmentData(
    args: OfferFulfillmentArgs,
  ): Promise<FulfillmentDataResponse> {
    const url = new URL('/api/v2/offers/fulfillment_data', this.apiBaseUrl);
    const body = {
      offer: {
        hash: args.orderHash,
        chain: this.chainSlug,
        protocol_address: args.protocolAddress,
      },
      fulfiller: { address: args.fulfillerAddress },
      consideration: {
        asset_contract_address: args.consideration.tokenAddress,
        token_id: args.consideration.tokenId,
      },
    };
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { ...this.buildHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(
        `OpenSea fulfillment_data fetch failed (${response.status}): ${await response.text()}`,
      );
    }
    return FulfillmentDataResponseSchema.parse(await response.json());
  }

  private buildHeaders(): HeadersInit {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (this.apiKey) headers['x-api-key'] = this.apiKey;
    return headers;
  }
}
