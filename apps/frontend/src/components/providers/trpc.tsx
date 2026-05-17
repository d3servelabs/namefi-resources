'use client';

import { config } from '@/lib/env';
import { datadogLogs } from '@datadog/browser-logs';
import type { AppRouter } from '@/lib/trpc';
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
  httpSubscriptionLink,
  retryLink,
  splitLink,
} from '@trpc/client';
import { EventSourcePolyfill } from 'event-source-polyfill';
import {
  BROWSER_FINGERPRINT_HEADER,
  C15T_MEASUREMENT_CONSENT_HEADER,
  GA_CLIENT_ID_HEADER,
  GA_SESSION_ID_HEADER,
  normalizeGaClientId,
  normalizeGaSessionId,
  parseGaClientIdFromCookieValue,
  parseGaSessionIdFromCookieValue,
} from '@namefi-astra/common/google-analytics';
import type React from 'react';
import { useState } from 'react';
import superjson from 'superjson';
import { TRPCProvider } from '@/lib/trpc';

const GA_MEASUREMENT_ID_PREFIX_REGEX = /^G-/;

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
          datadogLogs.logger.error(
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

          datadogLogs.logger.error(
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
                  const headers = await getHeaders();
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
              headers: getHeaders,
              fetch(url, options) {
                return fetch(url, { ...options, credentials: 'include' });
              },
            }),
          }),
          // when condition is false, use batching
          false: httpBatchLink({
            url: `${config.BACKEND_URL}/trpc`,
            transformer: superjson,
            headers: getHeaders,
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

// Check if skip auth is active from localStorage
// NOTE: This logic is intentionally duplicated from use-skip-auth.ts because
// this file cannot use React hooks. Keep the environment check and storage key
// in sync with useSkipAuth() in apps/frontend/src/hooks/use-skip-auth.ts
function isSkipAuthActive(): boolean {
  if (typeof window === 'undefined') return false;
  const environment = config.TYPE;
  const isDevEnvironment =
    environment === 'local' ||
    environment === 'development' ||
    environment === 'preview';
  if (!isDevEnvironment) return false;
  try {
    return window.localStorage.getItem('namefi-skip-auth') === '1';
  } catch {
    return false;
  }
}

// Lazy-loaded, cached browser fingerprint. The visitorId is a stable hash of
// hardware/software signals that lets the backend recognize a returning
// browser even when the user is on a brand-new IP / location. We
// dynamically import FingerprintJS so the ~30 KB lib stays out of the
// first-paint bundle, and we cache the resolved id in a module-level
// promise so every tRPC request after the first reuses the same value.
// On any failure (privacy mode, ad-blocker, etc.) we resolve to null
// silently — backend treats the missing header as "no signal."
let fingerprintPromise: Promise<string | null> | null = null;
async function getBrowserFingerprint(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!fingerprintPromise) {
    fingerprintPromise = (async () => {
      try {
        const FingerprintJs = await import('@fingerprintjs/fingerprintjs');
        const fp = await FingerprintJs.load();
        const result = await fp.get();
        return result.visitorId;
      } catch {
        return null;
      }
    })();
  }
  return fingerprintPromise;
}

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`));

  const cookieValue = cookie?.split('=').slice(1).join('=');
  if (!cookieValue) return null;

  try {
    return decodeURIComponent(cookieValue);
  } catch {
    return null;
  }
}

function parseGaClientIdFromCookie(): string | null {
  return parseGaClientIdFromCookieValue(getCookieValue('_ga'));
}

function parseGaSessionIdFromCookie(): string | null {
  if (!config.GA_MEASUREMENT_ID) return null;

  const measurementIdSuffix = config.GA_MEASUREMENT_ID.replace(
    GA_MEASUREMENT_ID_PREFIX_REGEX,
    '',
  );
  return parseGaSessionIdFromCookieValue(
    getCookieValue(`_ga_${measurementIdSuffix}`),
  );
}

let cachedGaClientId: string | null = null;
let gaClientIdPromise: Promise<string | null> | null = null;
let cachedGaSessionId: string | null = null;
let gaSessionIdPromise: Promise<string | null> | null = null;

function hasGoogleAnalyticsMeasurementConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return getGoogleAnalyticsMeasurementConsentHeaderValue() === 'granted';
}

function getGoogleAnalyticsMeasurementConsentHeaderValue():
  | 'granted'
  | 'denied'
  | null {
  if (typeof window === 'undefined') return null;
  const measurementConsent = (
    window as typeof window & { namefiMeasurementConsent?: boolean }
  ).namefiMeasurementConsent;

  if (measurementConsent === true) return 'granted';
  if (measurementConsent === false) return 'denied';
  return null;
}

async function getGoogleAnalyticsClientId(): Promise<string | null> {
  if (typeof window === 'undefined' || !config.GA_MEASUREMENT_ID) return null;
  if (!hasGoogleAnalyticsMeasurementConsent()) {
    cachedGaClientId = null;
    return null;
  }
  if (cachedGaClientId) return cachedGaClientId;

  const cookieClientId = parseGaClientIdFromCookie();
  if (cookieClientId) {
    cachedGaClientId = cookieClientId;
    return cookieClientId;
  }

  if (!gaClientIdPromise) {
    gaClientIdPromise = new Promise<string | null>((resolve) => {
      let settled = false;
      const finish = (clientId: string | null) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(fallbackTimer);
        const resolvedClientId = hasGoogleAnalyticsMeasurementConsent()
          ? clientId
          : null;
        cachedGaClientId = resolvedClientId;
        resolve(resolvedClientId);
      };

      const fallbackTimer = window.setTimeout(() => {
        finish(parseGaClientIdFromCookie());
      }, 250);

      const gtag = window.gtag;
      if (!gtag) {
        finish(parseGaClientIdFromCookie());
        return;
      }

      gtag('get', config.GA_MEASUREMENT_ID, 'client_id', (clientId: unknown) =>
        finish(
          typeof clientId === 'string'
            ? (normalizeGaClientId(clientId) ?? parseGaClientIdFromCookie())
            : parseGaClientIdFromCookie(),
        ),
      );
    }).finally(() => {
      gaClientIdPromise = null;
    });
  }

  return gaClientIdPromise;
}

async function getGoogleAnalyticsSessionId(): Promise<string | null> {
  if (typeof window === 'undefined' || !config.GA_MEASUREMENT_ID) return null;
  if (!hasGoogleAnalyticsMeasurementConsent()) {
    cachedGaSessionId = null;
    gaSessionIdPromise = null;
    return null;
  }

  const cookieSessionId = parseGaSessionIdFromCookie();
  if (cookieSessionId) {
    cachedGaSessionId = cookieSessionId;
    return cookieSessionId;
  }
  if (cachedGaSessionId) return cachedGaSessionId;

  if (!gaSessionIdPromise) {
    gaSessionIdPromise = new Promise<string | null>((resolve) => {
      let settled = false;
      const finish = (sessionId: string | null) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(fallbackTimer);
        const resolvedSessionId = hasGoogleAnalyticsMeasurementConsent()
          ? normalizeGaSessionId(sessionId)
          : null;
        cachedGaSessionId = resolvedSessionId;
        resolve(resolvedSessionId);
      };

      const fallbackTimer = window.setTimeout(() => {
        finish(parseGaSessionIdFromCookie());
      }, 250);

      const gtag = window.gtag;
      if (!gtag) {
        finish(parseGaSessionIdFromCookie());
        return;
      }

      gtag(
        'get',
        config.GA_MEASUREMENT_ID,
        'session_id',
        (sessionId: unknown) =>
          finish(
            typeof sessionId === 'string' || typeof sessionId === 'number'
              ? (normalizeGaSessionId(sessionId) ??
                  parseGaSessionIdFromCookie())
              : parseGaSessionIdFromCookie(),
          ),
      );
    }).finally(() => {
      gaSessionIdPromise = null;
    });
  }

  return gaSessionIdPromise;
}

async function getHeaders(): Promise<Record<string, string>> {
  const skipAuth = isSkipAuthActive();
  const measurementConsentHeader =
    getGoogleAnalyticsMeasurementConsentHeaderValue();
  const [fingerprint, gaClientId, gaSessionId] = await Promise.all([
    getBrowserFingerprint(),
    getGoogleAnalyticsClientId(),
    getGoogleAnalyticsSessionId(),
  ]);

  // If skip auth is active, send the skip auth header instead of the real token
  if (skipAuth) {
    console.log('[skip-auth] Adding X-Skip-Auth header to tRPC request');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Skip-Auth': '1',
    };
    if (measurementConsentHeader) {
      headers[C15T_MEASUREMENT_CONSENT_HEADER] = measurementConsentHeader;
    }
    if (fingerprint) headers[BROWSER_FINGERPRINT_HEADER] = fingerprint;
    if (gaClientId) headers[GA_CLIENT_ID_HEADER] = gaClientId;
    if (gaSessionId) headers[GA_SESSION_ID_HEADER] = gaSessionId;
    return headers;
  }

  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (measurementConsentHeader) {
    headers[C15T_MEASUREMENT_CONSENT_HEADER] = measurementConsentHeader;
  }
  if (fingerprint) headers[BROWSER_FINGERPRINT_HEADER] = fingerprint;
  if (gaClientId) headers[GA_CLIENT_ID_HEADER] = gaClientId;
  if (gaSessionId) headers[GA_SESSION_ID_HEADER] = gaSessionId;
  return headers;
}
