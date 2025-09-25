import type { AppRouter } from '@namefi-astra/backend/trpc';
import { config } from '@/lib/env';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { secrets } from '@/lib/env/secrets';
import superjson from 'superjson';

export const proxyUnauthenticatedClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${config.BACKEND_URL}/trpc`,
      transformer: superjson,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': secrets.API_AUTH_KEY,
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
