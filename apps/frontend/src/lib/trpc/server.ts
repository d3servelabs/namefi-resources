import type { AppRouter } from '@namefi-astra/backend/trpc';
import { config } from '@/lib/env';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

export const proxyUnauthenticatedClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${config.BACKEND_URL}/trpc`,
      transformer: superjson,
      headers: {
        'Content-Type': 'application/json',
      },
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
          cache: 'no-store',
        });
      },
    }),
  ],
});
