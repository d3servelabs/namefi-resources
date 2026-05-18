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

interface ListingsQuery {
  tokenAddress: string;
  tokenId: string;
}

interface OfferFulfillmentArgs {
  orderHash: string;
  fulfillerAddress: string;
  /** OpenSea expects the asset items that will be transferred to the buyer. */
  consideration: ReadonlyArray<{
    token: string;
    identifier: string;
    quantity?: string;
  }>;
  protocolAddress: string;
}

/**
 * Typed wrapper around OpenSea's v2 REST API.
 *
 * Every response is parsed through a zod schema (see `./api-schemas.ts`) so a shape
 * change in OpenSea's API surfaces as a clear error instead of corrupt UI state.
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

  async listListings(query: ListingsQuery): Promise<OpenSeaApiOrder[]> {
    return this.fetchOrders('listings', query);
  }

  async listOffers(query: ListingsQuery): Promise<OpenSeaApiOrder[]> {
    return this.fetchOrders('offers', query);
  }

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
      consideration: args.consideration.map((item) => ({
        asset_contract_address: item.token,
        token_id: item.identifier,
        quantity: item.quantity ?? '1',
      })),
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

  private async fetchOrders(
    kind: 'listings' | 'offers',
    query: ListingsQuery,
  ): Promise<OpenSeaApiOrder[]> {
    const url = new URL(
      `/api/v2/orders/${this.chainSlug}/seaport/${kind}`,
      this.apiBaseUrl,
    );
    url.searchParams.set('asset_contract_address', query.tokenAddress);
    url.searchParams.set('token_ids', query.tokenId);
    url.searchParams.set('order_by', 'created_date');
    url.searchParams.set('order_direction', 'desc');
    url.searchParams.set('limit', '20');

    const response = await fetch(url.toString(), {
      headers: this.buildHeaders(),
    });
    if (!response.ok) {
      throw new Error(
        `OpenSea ${kind} fetch failed (${response.status}): ${await response.text()}`,
      );
    }
    const payload = OpenSeaOrdersResponseSchema.parse(await response.json());
    return payload.orders;
  }

  private buildHeaders(): HeadersInit {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (this.apiKey) headers['x-api-key'] = this.apiKey;
    return headers;
  }
}
