import { createHmac } from 'node:crypto';
import axios, { type AxiosRequestConfig, isAxiosError } from 'axios';
import { secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { bodySmall } from '../../mail/styles';

const logger = createLogger({ module: 'okx-client' });

/** OKX Web3 API host — every marketplace endpoint lives under this origin. */
const OKX_API_BASE = 'https://web3.okx.com';

/** Path prefix for the documented NFT marketplace REST API. */
const OKX_NFT_API_PREFIX = '/api/v5/mktplace/nft';

/**
 * Path prefix for OKX's website-internal NFT API (`/priapi/`). Some workflows
 * (e.g. `createListing` → `submitOrder`) require values OKX only exposes through
 * `/priapi/` — most notably the internal `nftId` returned by `detail-info`.
 */
const OKX_PRIAPI_NFT_PREFIX = '/priapi/v1/nft';

/**
 * Path prefixes the `submitListing` passthrough may forward to. `createListing`
 * returns a `post` instruction whose `endpoint` the adapter relays here
 * verbatim; restricting it to known OKX paths keeps the passthrough from
 * becoming an open SSRF relay.
 */
const OKX_SUBMIT_ALLOWED_PREFIXES = [
  '/api/v5/mktplace/nft/',
  '/priapi/v1/nft/trading/',
] as const;

/** Per-request timeout — OKX order builds can be slow. */
const OKX_REQUEST_TIMEOUT_MS = 20_000;

/**
 * Browser-looking User-Agent. OKX's `/priapi/` endpoints reject server-side /
 * Node-like UAs with `"Request header 'OK-VERIFY-SIGN' can't be empty"` — even
 * when no other auth headers are sent. A real browser UA bypasses that check.
 */
const OKX_BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

/** Standard OKX `{ code, data, msg }` envelope. `code === 0` means success. */
interface OkxEnvelope<T = unknown> {
  code: number;
  data: T;
  msg: string;
}

/**
 * Subset of OKX's `/priapi/v1/nft/detail-info` response we care about. `id` is
 * the internal `nftId` the `/priapi/.../createListing` flow requires; other
 * fields surface trading flags + collection refs useful for building the
 * `createListing` body. The endpoint returns many more fields — typed as
 * `unknown` to stay forward-compatible.
 */
export interface OkxNftDetailInfo {
  /** OKX's internal NFT id (a ~17-digit decimal string) — the `nftId` the create-listing flow needs. */
  id: string;
  /** Whether OKX supports trading this NFT — if `false`, listing will fail. */
  supportTrade: boolean;
  /** Echoed numeric chain id (e.g. `8453`). */
  chain?: number;
  /** Echoed contract address (lowercase). */
  contractAddress?: string;
  /** Echoed tokenId. */
  tokenId?: string;
  /** OKX collection slug. */
  collectionName?: string;
  /** OKX-internal project id (collection level). */
  project?: number;
  /** OKX-internal source enum (`4` for OKX-native listings). */
  source?: number;
  [key: string]: unknown;
}

interface OkxOrdersQuery {
  chain: string;
  collectionAddress: string;
  tokenId: string;
}

interface OkxCreateListingArgs {
  chain: string;
  walletAddress: string;
  items: ReadonlyArray<{
    collectionAddress: string;
    tokenId: string;
    price: string;
    currencyAddress: string;
    count: number;
    validTime: number;
    platform: string;
  }>;
}

interface OkxBuyArgs {
  chain: string;
  walletAddress: string;
  items: ReadonlyArray<{ orderId: string; takeCount: number }>;
}

/**
 * Args for OKX's website-internal `/priapi/v1/nft/trading/createListing` — the
 * working alternative to the now-dead public `/api/v5/.../create-listing`.
 * Different shape: keyed by OKX's internal `nftId` (resolve via
 * `getNftDetailInfo`) instead of `collectionAddress` + `tokenId`, and `chain`
 * is the numeric chain id as a string (e.g. `"8453"`, not `"base"`).
 */
interface OkxCreateListingPriapiArgs {
  chain: string;
  walletAddress: string;
  items: ReadonlyArray<{
    nftId: string;
    price: string;
    currencyAddress: string;
    count: number;
    validTime: number;
    source: number;
    royaltyFeePoints: number;
  }>;
}

/**
 * Backend client for the OKX NFT marketplace REST API.
 *
 * Every request is authenticated with the OKX `OK-ACCESS-*` HMAC scheme:
 * `OK-ACCESS-SIGN = base64(hmacSHA256(secret, timestamp + method + path + body))`.
 * The secret never leaves the backend — this client exists so the frontend OKX
 * adapter can proxy through `nftMarketplacesRouter` instead of holding it.
 */
class OkxClient {
  constructor(
    private readonly apiKey: string | undefined,
    private readonly apiSecret: string | undefined,
    private readonly apiPassphrase: string | undefined,
  ) {}

  /** True when all three OKX credentials are present. */
  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiSecret && this.apiPassphrase);
  }

  private requireCredentials(): {
    apiKey: string;
    apiSecret: string;
    apiPassphrase: string;
  } {
    if (!this.apiKey || !this.apiSecret || !this.apiPassphrase) {
      throw new Error(
        'OKX marketplace proxy is not configured (missing OKX_API_KEY / OKX_API_SECRET / OKX_API_PASSPHRASE)',
      );
    }
    return {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      apiPassphrase: this.apiPassphrase,
    };
  }

  /** OKX HMAC: `base64(hmacSHA256(secret, timestamp + METHOD + path + body))`. */
  private sign(
    secret: string,
    timestamp: string,
    method: string,
    requestPath: string,
    body: string,
  ): string {
    return createHmac('sha256', secret)
      .update(`${timestamp}${method}${requestPath}${body}`)
      .digest('base64');
  }

  private async request<T>(args: {
    method: 'GET' | 'POST';
    /** Path under `OKX_API_BASE`, including a leading slash and (for GET) the query string. */
    path: string;
    body?: unknown;
    /**
     * Add OK-ACCESS-* HMAC headers (default `true`). Set to `false` for
     * `/priapi/` endpoints that reject partial OK-ACCESS-* auth — they require
     * either the browser's `OK-VERIFY-SIGN` (which we can't replicate) or no
     * auth at all.
     */
    signed?: boolean;
  }): Promise<T> {
    // The signed string must byte-match the sent body, so serialize once here
    // and hand axios the exact string (an object would be re-serialized).
    const bodyStr = args.body === undefined ? '' : JSON.stringify(args.body);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': OKX_BROWSER_UA,
    };
    if (args.signed !== false) {
      const { apiKey, apiSecret, apiPassphrase } = this.requireCredentials();
      const timestamp = new Date().toISOString();
      const sign = this.sign(
        apiSecret,
        timestamp,
        args.method,
        args.path,
        bodyStr,
      );
      headers['OK-ACCESS-KEY'] = apiKey;
      headers['OK-ACCESS-SIGN'] = sign;
      headers['OK-ACCESS-TIMESTAMP'] = timestamp;
      headers['OK-ACCESS-PASSPHRASE'] = apiPassphrase;
    }

    const config: AxiosRequestConfig = {
      method: args.method,
      url: `${OKX_API_BASE}${args.path}`,
      timeout: OKX_REQUEST_TIMEOUT_MS,
      headers,
      ...(args.method === 'POST' ? { data: bodyStr } : {}),
    };

    try {
      const response = await axios.request<T>(config);
      return response.data;
    } catch (error) {
      throw this.toError(error, args.method, args.path);
    }
  }

  private toError(error: unknown, method: string, path: string): Error {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const okxMsg = (error.response?.data as { msg?: string } | undefined)
        ?.msg;
      const detail = okxMsg || error.message;
      if (status === 429) {
        logger.warn({ method, path, status }, 'OKX rate limit hit');
      } else {
        logger.error(
          { method, path, status },
          'OKX request failed: %s',
          detail,
        );
      }
      return new Error(
        `OKX request failed (${status ?? 'network'}): ${detail}`,
      );
    }
    logger.error({ method, path }, 'OKX request failed: %s', String(error));
    return error instanceof Error ? error : new Error(String(error));
  }

  /** Unwrap the OKX envelope, logging + throwing on a non-zero `code`. */
  private unwrap<T>(payload: OkxEnvelope<T>): T {
    if (payload.code !== 0) {
      logger.error(
        { code: payload.code, msg: payload.msg },
        'OKX API returned error code %d: %s',
        payload.code,
        payload.msg || 'unknown error',
      );
      throw new Error(
        `OKX API error ${payload.code}: ${payload.msg || 'unknown error'}`,
      );
    }
    return payload.data;
  }

  /**
   * Throw on per-item failures OKX nests in an otherwise-OK (`code === 0`)
   * response. A 200 + `code: 0` doesn't imply success — OKX still surfaces
   * partial failures in `data.errors`, so callers must not treat the wrapper
   * code alone as success.
   */
  private requireNoOperationErrors(operation: string, data: unknown): void {
    const errors = (data as { errors?: unknown[] } | undefined)?.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      logger.error(
        { operation, errors },
        'OKX %s returned operation-level errors',
        operation,
      );
      throw new Error(`OKX ${operation} failed: ${JSON.stringify(errors)}`);
    }
  }

  /** Active listings (sell orders) for one NFT. */
  async getListings(
    query: OkxOrdersQuery,
  ): Promise<{ cursor: string | null; orders: unknown[] }> {
    return this.getOrders('listings', query);
  }

  /** Active offers (buy orders) for one NFT. */
  async getOffers(
    query: OkxOrdersQuery,
  ): Promise<{ cursor: string | null; orders: unknown[] }> {
    return this.getOrders('offers', query);
  }

  private async getOrders(
    kind: 'listings' | 'offers',
    query: OkxOrdersQuery,
  ): Promise<{ cursor: string | null; orders: unknown[] }> {
    const qs = new URLSearchParams({
      chain: query.chain,
      collectionAddress: query.collectionAddress,
      tokenId: query.tokenId,
      status: 'active',
      limit: '50',
    }).toString();
    const payload = await this.request<
      OkxEnvelope<{ cursor?: string | null; data?: unknown[] }>
    >({ method: 'GET', path: `${OKX_NFT_API_PREFIX}/markets/${kind}?${qs}` });
    const data = this.unwrap(payload);
    return {
      cursor: data?.cursor ?? null,
      orders: Array.isArray(data?.data) ? data.data : [],
    };
  }

  /**
   * Retrieve NFT details from OKX's public marketplace API. Returns OKX's raw
   * `data` for the NFT — used to probe whether the response carries an OKX
   * internal `nftId` (which the `create-listing` flow requires) as a passthrough
   * field beyond the documented shape.
   */
  async getNftDetail(query: {
    chain: string;
    contractAddress: string;
    tokenId: string;
  }): Promise<unknown> {
    const qs = new URLSearchParams({
      chain: query.chain,
      contractAddress: query.contractAddress,
      tokenId: query.tokenId,
    }).toString();
    const payload = await this.request<OkxEnvelope>({
      method: 'GET',
      path: `${OKX_NFT_API_PREFIX}/asset/detail?${qs}`,
    });
    return this.unwrap(payload);
  }

  /**
   * List a wallet's NFTs on a chain (optionally narrowed to one collection).
   * Returns OKX's raw `data` — used to probe for the internal `nftId` field
   * beyond what the public schema documents.
   */
  async getOwnerAssets(query: {
    chain: string;
    ownerAddress: string;
    contractAddress?: string;
    limit?: number;
    cursor?: string;
  }): Promise<unknown> {
    const params: Record<string, string> = {
      chain: query.chain,
      ownerAddress: query.ownerAddress,
      limit: String(query.limit ?? 10),
    };
    if (query.contractAddress) params.contractAddress = query.contractAddress;
    if (query.cursor) params.cursor = query.cursor;
    const qs = new URLSearchParams(params).toString();
    const payload = await this.request<OkxEnvelope>({
      method: 'GET',
      path: `${OKX_NFT_API_PREFIX}/owner/asset-list?${qs}`,
    });
    return this.unwrap(payload);
  }

  /**
   * Fetch OKX's current marketplace trade fee — `tradeFees` is a percentage
   * (e.g. `0.00` = 0%, `2.5` = 2.5%). As of 2026-05 OKX charges 0%, but the
   * endpoint is the source of truth; fall back to the constant in
   * `okx/constants.ts` if this fails. Unsigned + browser UA — `/priapi/`
   * doesn't accept partial OK-ACCESS-* auth.
   */
  async getTradeFees(
    query: { chain?: number; nftId?: string } = {},
  ): Promise<{ tradeFees: number; tradeFeesAddress: string }> {
    const params: Record<string, string> = { t: String(Date.now()) };
    if (query.chain !== undefined) {
      params.chain = String(query.chain);
    }
    if (query.nftId !== undefined) {
      params.nftId = query.nftId;
    }
    const qs = new URLSearchParams(params).toString();
    const payload = await this.request<
      OkxEnvelope<{ tradeFees: number; tradeFeesAddress: string }>
    >({
      method: 'GET',
      path: `${OKX_PRIAPI_NFT_PREFIX}/order/tradeFees?${qs}`,
      signed: false,
    });
    return this.unwrap(payload);
  }

  /**
   * Look up OKX's internal `nftId` for `(chain, contractAddress, tokenId)` — the
   * value `/priapi/v1/nft/trading/createListing` requires.
   *
   * Calls OKX's website-internal `/priapi/v1/nft/detail-info` (the same endpoint
   * the NFT detail page on web3.okx.com hydrates on the client). The endpoint
   * is publicly callable; the HMAC headers `request()` adds are accepted and
   * ignored. The `nftId` is exposed as `data.id` (a ~17-digit decimal string) —
   * the response's own `deeplink` field confirms `id` is the `nftId`.
   *
   * @param query.chain numeric chain id (e.g. `8453` for Base) — NOT the public
   *                    `/api/v5/` chain key string like `'base'`.
   */
  async getNftDetailInfo(query: {
    chain: number;
    contractAddress: string;
    tokenId: string;
  }): Promise<OkxNftDetailInfo> {
    const qs = new URLSearchParams({
      contractAddress: query.contractAddress,
      tokenId: query.tokenId,
      chain: String(query.chain),
      looker: '',
      t: String(Date.now()),
    }).toString();
    const payload = await this.request<OkxEnvelope<OkxNftDetailInfo>>({
      method: 'GET',
      path: `${OKX_PRIAPI_NFT_PREFIX}/detail-info?${qs}`,
      signed: false,
    });
    return this.unwrap(payload);
  }

  /**
   * Build a listing. Returns OKX's `{ errors, orders, steps }` — the `steps`
   * carry the NFT approval and the Seaport `OrderComponents` to EIP-712 sign.
   */
  async createListing(args: OkxCreateListingArgs): Promise<unknown> {
    const payload = await this.request<OkxEnvelope>({
      method: 'POST',
      path: `${OKX_NFT_API_PREFIX}/markets/create-listing`,
      body: {
        chain: args.chain,
        walletAddress: args.walletAddress,
        items: args.items,
      },
    });
    const data = this.unwrap(payload);
    this.requireNoOperationErrors('create-listing', data);
    return data;
  }

  /**
   * Build a listing via OKX's website-internal endpoint. Returns the same
   * `{ errors, orders, steps }` shape the (now-dead) public `createListing`
   * does — `steps[]` carries the NFT approval + the Seaport order to sign.
   *
   * The public `/api/v5/.../markets/create-listing` returns
   * `{ code: -1, "No longer available" }`; this endpoint — the one OKX's
   * website actually uses — still works. Unsigned + browser UA (see the
   * `signed` doc on `request()` for the `/priapi/` auth wall).
   */
  async createListingPriapi(
    args: OkxCreateListingPriapiArgs,
  ): Promise<unknown> {
    const payload = await this.request<OkxEnvelope>({
      method: 'POST',
      path: `${OKX_PRIAPI_NFT_PREFIX}/trading/createListing?t=${Date.now()}`,
      body: {
        chain: args.chain,
        walletAddress: args.walletAddress,
        items: args.items,
      },
      signed: false,
    });
    const data = this.unwrap(payload);
    this.requireNoOperationErrors('create-listing-priapi', data);
    return data;
  }

  /**
   * Submit a signed order. `endpoint` + `body` come from the `createListing`
   * response's `SignOrders` step `post` instruction (with the signature
   * filled in). `endpoint` is validated against `OKX_SUBMIT_ALLOWED_PREFIXES`.
   *
   * OKX points the submit at `/priapi/v1/nft/trading/seaport/step/submitOrder`,
   * its internal API surface. `/priapi/` rejects partial `OK-ACCESS-*` auth
   * (see `request()`'s `signed` doc), so we send it unsigned.
   */
  async submitListing(args: {
    endpoint: string;
    body: unknown;
  }): Promise<unknown> {
    const endpoint = args.endpoint.startsWith('/')
      ? args.endpoint
      : `/${args.endpoint}`;
    if (!OKX_SUBMIT_ALLOWED_PREFIXES.some((p) => endpoint.startsWith(p))) {
      throw new Error(`OKX submit endpoint not allowed: ${endpoint}`);
    }
    // /priapi/ rejects partial OK-ACCESS-* auth — strip HMAC for it.
    const signed = !endpoint.startsWith('/priapi/');
    // /priapi may not use the { code, data, msg } envelope — return raw.
    return this.request<unknown>({
      method: 'POST',
      path: endpoint,
      body: args.body,
      signed,
    });
  }

  /**
   * Fill listings. Returns OKX's `{ errors, steps }` — the `TakeOrders` step
   * carries ready-to-send transaction calldata.
   */
  async buy(args: OkxBuyArgs): Promise<unknown> {
    const payload = await this.request<OkxEnvelope>({
      method: 'POST',
      path: `${OKX_NFT_API_PREFIX}/markets/buy`,
      body: {
        chain: args.chain,
        walletAddress: args.walletAddress,
        items: args.items,
      },
    });
    const data = this.unwrap(payload);
    this.requireNoOperationErrors('buy', data);
    return data;
  }
}

const okxClient = new OkxClient(
  secrets.OKX_API_KEY,
  secrets.OKX_API_SECRET,
  secrets.OKX_API_PASSPHRASE,
);

export default okxClient;
export { OkxClient };
const exampleCreateListing712 = {
  types: {
    ConsiderationItem: [
      { name: 'itemType', type: 'uint8' },
      { name: 'token', type: 'address' },
      { name: 'identifierOrCriteria', type: 'uint256' },
      { name: 'startAmount', type: 'uint256' },
      { name: 'endAmount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    OrderComponents: [
      { name: 'offerer', type: 'address' },
      { name: 'zone', type: 'address' },
      { name: 'offer', type: 'OfferItem[]' },
      { name: 'consideration', type: 'ConsiderationItem[]' },
      { name: 'orderType', type: 'uint8' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'zoneHash', type: 'bytes32' },
      { name: 'salt', type: 'uint256' },
      { name: 'conduitKey', type: 'bytes32' },
      { name: 'counter', type: 'uint256' },
    ],
    OfferItem: [
      { name: 'itemType', type: 'uint8' },
      { name: 'token', type: 'address' },
      { name: 'identifierOrCriteria', type: 'uint256' },
      { name: 'startAmount', type: 'uint256' },
      { name: 'endAmount', type: 'uint256' },
    ],
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
  },
  domain: {
    name: 'Seaport',
    version: '1.6',
    chainId: '0x2105',
    verifyingContract: '0x0000000000000068f116a894984e2db1123eb395',
  },
  primaryType: 'OrderComponents',
  message: {
    offerer: '0xb5856d4598c919834913b8656ebc15a64d3c7836',
    zone: '0xdf2d4bffec010debd302674c9fb9cda99bb5e852',
    offer: [
      {
        itemType: '2',
        token: '0x0000000000cf80e7cf8fa4480907f692177f8e06',
        identifierOrCriteria:
          '21566448524101138150075329647689973848436879916789281993601523690510645643019',
        startAmount: '1',
        endAmount: '1',
      },
    ],
    consideration: [
      {
        itemType: '0',
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: '0',
        startAmount: '50000000000000000',
        endAmount: '50000000000000000',
        recipient: '0xb5856d4598c919834913b8656ebc15a64d3c7836',
      },
    ],
    orderType: '2',
    startTime: '1779441094',
    endTime: '1780045893',
    zoneHash:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    salt: '113335539188866038021340280639199533004618272455350364514241757479981342503155',
    conduitKey:
      '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000',
    counter: '0',
  },
};
//Conduit 0x1E0049783F008A0085193E00003D00cd54003c71

const exampleCreateListingRequestResponse = {
  request: {
    type: 'POST',
    endpoint:
      'https://web3.okx.com/priapi/v1/nft/trading/createListing?t=1779660468382',
    searchParams: {
      t: '1779660468382', // timestamp query param, not part of the signature Date.now() value in ms
    },
    body: {
      chain: '8453',
      walletAddress: '0xb5856d4598c919834913b8656ebc15a64d3c7836',
      items: [
        {
          nftId: '48694822013246982',
          price: '50000000000000000',
          currencyAddress: '0x0000000000000000000000000000000000000000',
          count: 1,
          validTime: 1780265267,
          source: 4,
          royaltyFeePoints: 0,
        },
      ],
    },
  },
  response: {
    code: 0,
    data: {
      errors: [],
      orders: [
        {
          collectionAddress: '',
          count: '1',
          currencyAddress: '0x0000000000000000000000000000000000000000',
          id: '51e54d07f0e34a63b69aacb082baa4cc',
          listingProfit: '',
          nftId: '48694822013246982',
          orderId: null,
          platform: 'okx',
          platformFeePoints: null,
          price: '50000000000000000',
          project: '',
          protocolFeePoints: null,
          royaltyFeePoints: 0,
          source: 4,
          tokenId: '',
          validTime: 1780265267,
        },
      ],
      steps: [
        {
          action: 'ApprovalItems',
          items: [
            {
              approvalAddress: '0x1e0049783f008a0085193e00003d00cd54003c71',
              chain: 8453,
              collectionAddress: '0x0000000000cf80e7cf8fa4480907f692177f8e06',
              description: '',
              kind: 'nftApproval',
              orderIds: ['51e54d07f0e34a63b69aacb082baa4cc'],
              platform: {
                icon: 'https://web3.okx.com/cdn/nft/1f4d2f3f-774c-4386-b8e1-52533d1af81d.webp',
                name: 'OKX',
                source: 4,
              },
              platforms: [
                {
                  icon: 'https://web3.okx.com/cdn/nft/1f4d2f3f-774c-4386-b8e1-52533d1af81d.webp',
                  name: 'OKX',
                  source: 4,
                },
              ],
              status: 'complete',
            },
          ],
        },
        {
          action: 'SignOrders',
          items: [
            {
              data: {
                conduitKey:
                  '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000',
                consideration: [
                  {
                    endAmount: '50000000000000000',
                    identifierOrCriteria: '0',
                    itemType: 0,
                    recipient: '0xb5856d4598c919834913b8656ebc15a64d3c7836',
                    startAmount: '50000000000000000',
                    token: '0x0000000000000000000000000000000000000000',
                  },
                ],
                counter: '0',
                endTime: '1780265267',
                offer: [
                  {
                    endAmount: '1',
                    identifierOrCriteria:
                      '35583575623294619557198868913773705441949338414040475302676002897188383508640',
                    itemType: 2,
                    startAmount: '1',
                    token: '0x0000000000cf80e7cf8fa4480907f692177f8e06',
                  },
                ],
                offerer: '0xb5856d4598c919834913b8656ebc15a64d3c7836',
                orderType: 2,
                salt: '72737015798719272043440428434829328917016384522774359784584667371172918577989',
                startTime: 1779660468,
                totalOriginalConsiderationItems: 1,
                zone: '0xdf2d4bffec010debd302674c9fb9cda99bb5e852',
                zoneHash:
                  '0x0000000000000000000000000000000000000000000000000000000000000000',
              },
              description: '',
              domain: {
                chainId: 8453,
                name: 'Seaport',
                verifyingContract: '0x0000000000000068f116a894984e2db1123eb395',
                version: '1.6',
              },
              kind: 'signature',
              orderIds: ['51e54d07f0e34a63b69aacb082baa4cc'],
              platform: {
                icon: 'https://web3.okx.com/cdn/nft/1f4d2f3f-774c-4386-b8e1-52533d1af81d.webp',
                name: 'OKX',
                source: 4,
              },
              platforms: [
                {
                  icon: 'https://web3.okx.com/cdn/nft/1f4d2f3f-774c-4386-b8e1-52533d1af81d.webp',
                  name: 'OKX',
                  source: 4,
                },
              ],
              post: {
                body: {
                  chain: 8453,
                  items: [
                    {
                      collectionAddress: '',
                      count: '1',
                      currencyAddress:
                        '0x0000000000000000000000000000000000000000',
                      id: '51e54d07f0e34a63b69aacb082baa4cc',
                      listingProfit: '',
                      nftId: '48694822013246982',
                      orderId: null,
                      platform: 'okx',
                      platformFeePoints: null,
                      price: '50000000000000000',
                      project: '',
                      protocolFeePoints: null,
                      royaltyFeePoints: 0,
                      source: 4,
                      tokenId: '',
                      validTime: 1780265267,
                    },
                  ],
                  orderData: '',
                  r: '',
                  s: '',
                  signature: '',
                  walletAddress: '0xb5856d4598c919834913b8656ebc15a64d3c7836',
                },
                endpoint: '/priapi/v1/nft/trading/seaport/step/submitOrder',
                method: 'post',
              },
              primaryType: 'OrderComponents',
              signKind: 'eip712',
              status: 'incomplete',
              types: {
                ConsiderationItem: [
                  {
                    name: 'itemType',
                    type: 'uint8',
                  },
                  {
                    name: 'token',
                    type: 'address',
                  },
                  {
                    name: 'identifierOrCriteria',
                    type: 'uint256',
                  },
                  {
                    name: 'startAmount',
                    type: 'uint256',
                  },
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
                  {
                    name: 'recipient',
                    type: 'address',
                  },
                ],
                OrderComponents: [
                  {
                    name: 'offerer',
                    type: 'address',
                  },
                  {
                    name: 'zone',
                    type: 'address',
                  },
                  {
                    name: 'offer',
                    type: 'OfferItem[]',
                  },
                  {
                    name: 'consideration',
                    type: 'ConsiderationItem[]',
                  },
                  {
                    name: 'orderType',
                    type: 'uint8',
                  },
                  {
                    name: 'startTime',
                    type: 'uint256',
                  },
                  {
                    name: 'endTime',
                    type: 'uint256',
                  },
                  {
                    name: 'zoneHash',
                    type: 'bytes32',
                  },
                  {
                    name: 'salt',
                    type: 'uint256',
                  },
                  {
                    name: 'conduitKey',
                    type: 'bytes32',
                  },
                  {
                    name: 'counter',
                    type: 'uint256',
                  },
                ],
                EIP712Domain: [
                  {
                    name: 'name',
                    type: 'string',
                  },
                  {
                    name: 'version',
                    type: 'string',
                  },
                  {
                    name: 'chainId',
                    type: 'uint256',
                  },
                  {
                    name: 'verifyingContract',
                    type: 'address',
                  },
                ],
                OfferItem: [
                  {
                    name: 'itemType',
                    type: 'uint8',
                  },
                  {
                    name: 'token',
                    type: 'address',
                  },
                  {
                    name: 'identifierOrCriteria',
                    type: 'uint256',
                  },
                  {
                    name: 'startAmount',
                    type: 'uint256',
                  },
                  {
                    name: 'endAmount',
                    type: 'uint256',
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    msg: '',
  },
};

const exampleSubmitListingRequest = {
  endpoint:
    'https://web3.okx.com/priapi/v1/nft/trading/seaport/step/submitOrder?t=1779658437271',
  searchParams: {
    t: '1779658437271', // timestamp query param, not part of the signature Date.now() value in ms
  },
  body: {
    chain: 8453,
    items: [
      {
        collectionAddress: '',
        count: '1',
        currencyAddress: '0x0000000000000000000000000000000000000000',
        id: '61377a4dcd64482db7e1225d6e2564db',
        listingProfit: '',
        nftId: '51567576358067718',
        orderId: null,
        platform: 'okx',
        platformFeePoints: null,
        price: '50000000000000000',
        project: '',
        protocolFeePoints: null,
        royaltyFeePoints: 0,
        source: 4,
        tokenId: '',
        validTime: 1780263208,
      },
    ],
    orderData: '',
    r: '',
    s: '',
    signature:
      '0xa60110fb6b4a2fc08cf7f8f082ae9b9d34326d88cca01e0ed4e6d634d3c1874a0d50be1f14642ce8e0c58dd29ba1a5dda9961153eb1f2a7dad5fb067d01bd72a1c',
    walletAddress: '0xb5856d4598c919834913b8656ebc15a64d3c7836',
  },
};
