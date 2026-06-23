'use client';

import { config } from '@/lib/env';
import { logDatadogError } from '@/lib/datadog/logs';
import type { AppRouter } from '@/lib/trpc';
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
  httpSubscriptionLink,
  retryLink,
  splitLink,
} from '@trpc/client';
import { EventSourcePolyfill } from 'event-source-polyfill';
import type React from 'react';
import { useState } from 'react';
import superjson from 'superjson';
import { TRPCProvider } from '@/lib/trpc';
import { getTrpcRequestHeaders } from '@/lib/trpc-request-headers';

function toDatadogError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  return new Error('Non-Error throwable received');
}

function buildDatadogErrorContext(error: unknown) {
  if (error instanceof TRPCClientError) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      trpcCode: error.data?.code,
      trpcHttpStatus: error.data?.httpStatus,
      trpcPath: error.data?.path,
    };
  }

  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
    };
  }

  return {
    nonErrorThrowable: true,
    thrownType: typeof error,
    thrownValue: String(error),
  };
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        onError: (error) => {
          void logDatadogError(
            'Mutation error',
            {
              source: 'trpc.mutation',
              ...buildDatadogErrorContext(error),
            },
            toDatadogError(error),
          );
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

          void logDatadogError(
            'Query error',
            {
              source: 'trpc.query',
              failureCount,
              ...buildDatadogErrorContext(error),
            },
            toDatadogError(error),
          );
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
            // Handle both skipBatch and subscription conditions
            return op.context.skipBatch === true || op.type === 'subscription';
          },
          // when condition is true, use appropriate link based on operation type
          true: splitLink({
            condition: (op) => op.type === 'subscription',
            true: [
              retryLink({
                retry: (opts) => {
                  const code = opts.error.data?.code;
                  if (!code) {
                    // This shouldn't happen as our httpSubscriptionLink will automatically retry within when there's a non-parsable response
                    console.error('No error code found, retrying', opts);
                    return true;
                  }
                  if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN') {
                    console.warn(
                      'Retrying 401/403 error - this will be removed soon',
                    );
                    return true;
                  }
                  return false;
                },
              }),
              httpSubscriptionLink({
                url: `${config.BACKEND_URL}/trpc`,
                transformer: superjson,
                // ponyfill EventSource
                EventSource: EventSourcePolyfill,
                // options to pass to the EventSourcePolyfill constructor
                eventSourceOptions: async () => {
                  // Get fresh access token for each connection attempt
                  const headers = await getTrpcRequestHeaders();
                  return {
                    withCredentials: true,
                    headers,
                  };
                },
              }),
            ],
            false: httpLink({
              url: `${config.BACKEND_URL}/trpc`,
              transformer: superjson,
              headers: getTrpcRequestHeaders,
              fetch(url, options) {
                return fetch(url, { ...options, credentials: 'include' });
              },
            }),
          }),
          // when condition is false, use batching
          false: httpBatchLink({
            url: `${config.BACKEND_URL}/trpc`,
            transformer: superjson,
            headers: getTrpcRequestHeaders,
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
