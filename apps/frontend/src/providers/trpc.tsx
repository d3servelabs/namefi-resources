'use client';

import { config } from '@/lib/env';
import { datadogLogs } from '@datadog/browser-logs';
import type { AppRouter } from '@namefi-astra/backend/trpc';
import { getAccessToken } from '@privy-io/react-auth';
import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from '@tanstack/react-query';
import {
  TRPCClientError,
  createTRPCClient,
  httpBatchLink,
  httpLink,
  splitLink,
} from '@trpc/client';
import type React from 'react';
import { useState } from 'react';
import superjson from 'superjson';
import { TRPCProvider } from '../utils/trpc';

if (process.env.NEXT_PUBLIC_DATADOG_LOGS_CLIENT_TOKEN) {
  datadogLogs.init({
    clientToken: process.env.NEXT_PUBLIC_DATADOG_LOGS_CLIENT_TOKEN,
    site: 'us5.datadoghq.com',
    service: `namefi-astra-frontend-${process.env.ENVIRONMENT}`,
    forwardErrorsToLogs: true,
    forwardConsoleLogs: ['error', 'info'],
    sessionSampleRate: 100,
  });
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        onError: (error) => {
          datadogLogs.logger.error('Mutation error', error);
        },
      },
      queries: {
        retry(failureCount, error) {
          if (
            typeof window === 'undefined' ||
            !(error instanceof TRPCClientError)
          ) {
            return false;
          }

          if (failureCount < 2) {
            return true;
          }

          datadogLogs.logger.error('Query error', error);
          return false;
        },
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        splitLink({
          condition(op) {
            // check for context property `skipBatch`
            return op.context.skipBatch === true;
          },
          // when condition is true, use normal request
          true: httpLink({
            url: `${config.BACKEND_URL}/trpc`,
            transformer: superjson,
            async headers() {
              return {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${(await getAccessToken()) || ''}`,
              };
            },
            fetch(url, options) {
              return fetch(url, { ...options, credentials: 'include' });
            },
          }),
          // when condition is false, use batching
          false: httpBatchLink({
            url: `${config.BACKEND_URL}/trpc`,
            transformer: superjson,
            async headers() {
              return {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${(await getAccessToken()) || ''}`,
              };
            },
            fetch(url, options) {
              return fetch(url, { ...options, credentials: 'include' });
            },
          }),
        }),
      ],
    }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
