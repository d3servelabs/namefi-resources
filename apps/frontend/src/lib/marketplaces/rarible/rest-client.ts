import {
  type RaribleOrder,
  RaribleOrderSchema,
  RaribleOrdersResponseSchema,
} from './api-schemas';
import { getRaribleApiBaseUrl } from './constants';
import {
  READ_RETRY_DELAYS_MS,
  RaribleHttpError,
  withRaribleRetry,
} from './retry';

interface RaribleRestClientArgs {
  chainId: number;
  apiKey: string;
}

interface OrdersByItemArgs {
  /** Rarible item id — `BLOCKCHAIN:CONTRACT:TOKEN_ID`. */
  itemId: string;
  /** Page size. Rarible's default is 50. */
  size?: number;
}

/** Only surface Rarible-native orders — the API also aggregates OpenSea/others. */
const RARIBLE_PLATFORM = 'RARIBLE';
const STATUS_ACTIVE = 'ACTIVE';
/** Per-request deadline — a stalled connection shouldn't hang the panel. */
const RARIBLE_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Typed wrapper around the slice of the Rarible v0.1 REST API the adapter reads.
 *
 * Reads go through plain REST (not the SDK) so they need no wallet and don't
 * pull the heavy multichain SDK into the bundle. Every response is validated by
 * the zod schemas in `api-schemas.ts`.
 */
export class RaribleRestClient {
  private readonly apiBaseUrl: string;
  private readonly apiKey: string;

  constructor(args: RaribleRestClientArgs) {
    this.apiBaseUrl = getRaribleApiBaseUrl(args.chainId);
    this.apiKey = args.apiKey;
  }

  /** Active Rarible-native sell orders (listings) for one NFT. */
  getSellOrdersByItem(args: OrdersByItemArgs): Promise<RaribleOrder[]> {
    return this.fetchOrders('/v0.1/orders/sell/byItem', args);
  }

  /** Active Rarible-native bid orders (offers) for one NFT. */
  getBidOrdersByItem(args: OrdersByItemArgs): Promise<RaribleOrder[]> {
    return this.fetchOrders('/v0.1/orders/bids/byItem', args);
  }

  /** Fetch a single order by its Rarible order id (used after `createListing`). */
  getOrderById(orderId: string): Promise<RaribleOrder> {
    return withRaribleRetry(async () => {
      const url = new URL(
        `/v0.1/orders/${encodeURIComponent(orderId)}`,
        this.apiBaseUrl,
      );
      const response = await this.request(url.toString());
      if (!response.ok) {
        throw new RaribleHttpError(
          response.status,
          `Rarible order fetch failed (${response.status}): ${await response.text()}`,
        );
      }
      return RaribleOrderSchema.parse(await response.json());
    }, READ_RETRY_DELAYS_MS);
  }

  private fetchOrders(
    path: string,
    args: OrdersByItemArgs,
  ): Promise<RaribleOrder[]> {
    return withRaribleRetry(async () => {
      const url = new URL(path, this.apiBaseUrl);
      url.searchParams.set('itemId', args.itemId);
      url.searchParams.set('platform', RARIBLE_PLATFORM);
      url.searchParams.set('status', STATUS_ACTIVE);
      url.searchParams.set('size', String(args.size ?? 50));

      const response = await this.request(url.toString());
      if (!response.ok) {
        // 404 — the item isn't indexed / has no orders. Empty list, not error.
        if (response.status === 404) return [];
        throw new RaribleHttpError(
          response.status,
          `Rarible orders fetch failed (${response.status}): ${await response.text()}`,
        );
      }
      const payload = RaribleOrdersResponseSchema.parse(await response.json());
      return payload.orders;
    }, READ_RETRY_DELAYS_MS);
  }

  /**
   * GET with an explicit timeout. Without a deadline a stalled connection
   * hangs the marketplace panel indefinitely; on timeout we throw a
   * `RaribleHttpError` so it flows through the same handling as HTTP failures.
   */
  private async request(url: string): Promise<Response> {
    try {
      return await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders(),
        signal: AbortSignal.timeout(RARIBLE_REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      // `AbortSignal.timeout()` aborts with a `TimeoutError`, but some fetch
      // runtimes surface it as `AbortError` — treat both as a timeout.
      const name = (error as { name?: string } | undefined)?.name;
      if (name === 'TimeoutError' || name === 'AbortError') {
        throw new RaribleHttpError(
          408,
          `Rarible request timed out after ${RARIBLE_REQUEST_TIMEOUT_MS}ms: ${url}`,
        );
      }
      throw error;
    }
  }

  private buildHeaders(): HeadersInit {
    return { accept: 'application/json', 'X-API-KEY': this.apiKey };
  }
}
