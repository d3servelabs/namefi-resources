import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { config } from '@/lib/env';
import type { AppRouter } from '@/lib/trpc';
import { BROWSER_FINGERPRINT_HEADER } from '@namefi-astra/common/google-analytics';
import { getAccessToken } from '@privy-io/react-auth';

/**
 * Vanilla (non-React) tRPC client for the marketplace adapters.
 *
 * The OKX and LooksRare adapters run in the browser but must reach the
 * backend `nftMarketplaces` proxy router — the OKX HMAC secret and the
 * LooksRare API key live server-side. The app's React tRPC client can't be
 * called from plain `lib/` classes, and `@/lib/trpc/server` is server-only
 * (it imports server secrets), so this is a dedicated browser client.
 *
 * The proxy's reads (`getListings` etc.) are `publicProcedure`, but the
 * writes (`createListing` / `submitListing` / `buy`) are
 * `protectedProcedure`. Authentication uses two complementary mechanisms:
 * `credentials: 'include'` forwards the session cookie, and `getHeaders`
 * attaches `Authorization: Bearer <token>` when `getAccessToken()` returns
 * a Privy token. Either path is sufficient on its own; both are sent so
 * the mutation works in cookieless contexts (e.g. embedded surfaces) as
 * well as the standard session-cookie flow. Keeping this self-contained
 * means the marketplace hooks, the panel, and `getMarketplace()` need no
 * changes to support proxied adapters — the adapter just imports this
 * client like any other transport.
 */
export const marketplaceProxyClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${config.BACKEND_URL}/trpc`,
      transformer: superjson,
      fetch(url, options) {
        return fetch(url, { ...options, credentials: 'include' });
      },
      headers: getHeaders,
    }),
  ],
});

async function getHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}
