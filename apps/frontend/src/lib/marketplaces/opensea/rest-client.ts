import {
  type FulfillmentDataResponse,
  FulfillmentDataResponseSchema,
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

/**
 * Typed wrapper around the one slice of OpenSea v2 REST the SDK doesn't cover:
 * `POST /api/v2/offers/fulfillment_data`, which returns ready-to-send
 * transaction calldata for accepting an offer. All listing / offer reads go
 * through `@opensea/sdk/viem` directly.
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
