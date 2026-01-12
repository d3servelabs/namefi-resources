import createClient, { type Middleware } from 'openapi-fetch';
import type { paths, components } from './generated/cache';

export interface CoreDNSClientConfig {
  /** Base URL of the CoreDNS cache API (e.g., "http://localhost:8181") */
  baseUrl: string;
  /** API key for authentication via X-API-Key header */
  apiKey?: string;
}

/**
 * Creates an auth middleware that adds the X-API-Key header to all requests
 */
const createAuthMiddleware = (apiKey: string): Middleware => ({
  async onRequest({ request }) {
    request.headers.set('X-Api-Key', apiKey);
    return request;
  },
});

/**
 * Creates a type-safe CoreDNS Cache API client
 *
 * @example
 * ```typescript
 * const client = createCoreDNSClient({
 *   baseUrl: "http://localhost:8181",
 *   apiKey: "my-api-key",
 * });
 *
 * // Get cache statistics
 * const { data, error } = await client.GET("/cache/stats");
 *
 * // Query a specific cache entry
 * const { data: entry } = await client.GET("/cache/query", {
 *   params: { query: { name: "example.com.", type: "A" } },
 * });
 *
 * // Flush cache entries
 * await client.POST("/cache/flush", {
 *   body: { zone: "example.com.", qtype: "A" },
 * });
 *
 * // Dump cache contents with pagination
 * const { data: dump } = await client.GET("/cache/dump", {
 *   params: { query: { page: 1, limit: 100 } },
 * });
 * ```
 */
export function createCoreDNSClient(config: CoreDNSClientConfig) {
  const client = createClient<paths>({
    baseUrl: config.baseUrl,
    headers: {
      Accept: 'application/json',
    },
  });

  if (config.apiKey) {
    client.use(createAuthMiddleware(config.apiKey));
  }

  return client;
}

// Re-export types for consumers
export type { paths, components };

// Export commonly used schema types for convenience
export type FlushRequest = components['schemas']['FlushRequest'];
export type FlushResponse = components['schemas']['FlushResponse'];
export type StatsResponse = components['schemas']['StatsResponse'];
export type CacheStats = components['schemas']['CacheStats'];
export type CacheConfiguration = components['schemas']['CacheConfiguration'];
export type CacheEntry = components['schemas']['CacheEntry'];
export type DumpResponse = components['schemas']['DumpResponse'];
export type ErrorResponse = components['schemas']['ErrorResponse'];
