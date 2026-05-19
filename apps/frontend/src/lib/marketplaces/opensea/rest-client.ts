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
  /** Asset items the seller is transferring to the buyer. */
  consideration: ReadonlyArray<{
    token: string;
    identifier: string;
    quantity?: string;
  }>;
}

/**
 * Typed wrapper around the small slice of OpenSea v2 REST API the SDK doesn't cover.
 *
 * The SDK handles listing/offer reads via slug-based endpoints (see
 * `opensea-adapter.ts` for the integration). The only operation we still POST to the
 * raw REST API for is `/api/v2/offers/fulfillment_data` — OpenSea returns ready-to-send
 * transaction calldata, which we forward to viem's `walletClient.sendTransaction(...)`.
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

  private buildHeaders(): HeadersInit {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (this.apiKey) headers['x-api-key'] = this.apiKey;
    return headers;
  }
}
