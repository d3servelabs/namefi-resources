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

interface OrdersByMakerArgs {
  /** Rarible union address — `BLOCKCHAIN:0xaddress`. */
  maker: string;
  /** Rarible blockchain id to narrow to (e.g. `'ETHEREUM'`, `'BASE'`). */
  blockchain: string;
  /** Optional union contract address to narrow to a single collection. */
  collection?: string;
  /** Page size. Rarible's default is 50. */
  size?: number;
}

/** Only surface Rarible-native orders — the API also aggregates OpenSea/others. */
const RARIBLE_PLATFORM = 'RARIBLE';
const STATUS_ACTIVE = 'ACTIVE';
/** Per-request deadline — a stalled connection shouldn't hang the panel. */
const RARIBLE_REQUEST_TIMEOUT_MS = 15_000;
/** Rarible's documented page default and effective max for orders endpoints. */
const RARIBLE_PAGE_SIZE = 50;
/**
 * Safety cap on `fetchOrdersByMaker` pagination — at the default page size
 * this is 1,000 orders per maker × chain combination, which comfortably
 * covers real-world domain portfolios without letting a malformed
 * `continuation` cursor loop indefinitely.
 */
const MAX_ORDERS_BY_MAKER_PAGES = 20;

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

  /** Active Rarible-native sell orders (listings) created by a maker. */
  getSellOrdersByMaker(args: OrdersByMakerArgs): Promise<RaribleOrder[]> {
    return this.fetchOrdersByMaker('/v0.1/orders/sell/byMaker', args);
  }

  /** Active Rarible-native bid orders (outgoing offers) made by a maker. */
  getOrderBidsByMaker(args: OrdersByMakerArgs): Promise<RaribleOrder[]> {
    return this.fetchOrdersByMaker('/v0.1/orders/bids/byMaker', args);
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

  /**
   * Batch-fetch full orders by their ids.
   * `POST /v0.1/orders/byIds` accepts `{ ids: string[] }` and returns the
   * same `orders` envelope as the byItem/byMaker endpoints. Used to enrich
   * by-maker results — those responses may omit `endedAt` and other
   * optional fields, but the per-id detail response populates them.
   */
  getOrdersByIds(ids: string[]): Promise<RaribleOrder[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return withRaribleRetry(async () => {
      const url = new URL('/v0.1/orders/byIds', this.apiBaseUrl);
      const response = await this.requestJson(url.toString(), { ids });
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new RaribleHttpError(
          response.status,
          `Rarible orders byIds fetch failed (${response.status}): ${await response.text()}`,
        );
      }
      const payload = RaribleOrdersResponseSchema.parse(await response.json());
      return payload.orders;
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
   * Page through a by-maker endpoint until the `continuation` cursor
   * stops being returned. A single request only yields `size` orders
   * (default 50, see `RARIBLE_PAGE_SIZE`) — without pagination, makers
   * with more open orders would be silently truncated. Each page goes
   * through `withRaribleRetry`, and the loop is capped at
   * `MAX_ORDERS_BY_MAKER_PAGES` so a malformed cursor can't run away.
   */
  private async fetchOrdersByMaker(
    path: string,
    args: OrdersByMakerArgs,
  ): Promise<RaribleOrder[]> {
    const pageSize = args.size ?? RARIBLE_PAGE_SIZE;
    const all: RaribleOrder[] = [];
    let continuation: string | undefined;

    for (let page = 0; page < MAX_ORDERS_BY_MAKER_PAGES; page += 1) {
      const result = await withRaribleRetry(async () => {
        const url = new URL(path, this.apiBaseUrl);
        // Rarible's by-maker endpoints take `maker[]` (an array). With a single
        // maker, repeated `maker=…` works; using the bracketed form is more
        // explicit and matches the published schema.
        url.searchParams.append('maker', args.maker);
        url.searchParams.append('blockchains', args.blockchain);
        url.searchParams.set('platform', RARIBLE_PLATFORM);
        url.searchParams.set('status', STATUS_ACTIVE);
        url.searchParams.set('size', String(pageSize));
        if (args.collection) {
          url.searchParams.set('collection', args.collection);
        }
        if (continuation) {
          url.searchParams.set('continuation', continuation);
        }

        const response = await this.request(url.toString());
        if (!response.ok) {
          if (response.status === 404) {
            return {
              orders: [] as RaribleOrder[],
              next: null as string | null,
            };
          }
          throw new RaribleHttpError(
            response.status,
            `Rarible orders-by-maker fetch failed (${response.status}): ${await response.text()}`,
          );
        }
        const payload = RaribleOrdersResponseSchema.parse(
          await response.json(),
        );
        return { orders: payload.orders, next: payload.continuation ?? null };
      }, READ_RETRY_DELAYS_MS);

      all.push(...result.orders);
      if (!result.next || result.orders.length === 0) break;
      continuation = result.next;
    }

    return all;
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

  /** POST a JSON body with the same timeout + abort handling as `request`. */
  private async requestJson(url: string, body: unknown): Promise<Response> {
    try {
      return await fetch(url, {
        method: 'POST',
        headers: { ...this.buildHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(RARIBLE_REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
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
