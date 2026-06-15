import type { AppRouter, AppRouterOutput } from '@/lib/trpc';
import { config } from '@/lib/env';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import {
  AUTH_BOOTSTRAP_MODE_COOKIE,
  AUTH_BOOTSTRAP_MODE_HEADER,
} from '@namefi-astra/common/auth-session';

function getApiAuthKey() {
  const apiAuthKey = process.env.API_AUTH_KEY;
  if (!apiAuthKey) {
    throw new Error('API_AUTH_KEY is required for server tRPC requests');
  }
  return apiAuthKey;
}

export const proxyUnauthenticatedClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${config.BACKEND_URL}/trpc`,
      transformer: superjson,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getApiAuthKey(),
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

type InitialAuthSessionSnapshot = {
  session: AppRouterOutput['users']['getSessionSnapshot'];
  resolvedAtMs: number;
};

export const INITIAL_AUTH_SESSION_SNAPSHOT_TIMEOUT_MS = 1500;

function createTimeoutSignal(timeoutMs: number): AbortSignal | undefined {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return undefined;

  if (typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort(new DOMException('Request timed out', 'TimeoutError'));
  }, timeoutMs);
  if (
    timeout &&
    typeof timeout === 'object' &&
    'unref' in timeout &&
    typeof timeout.unref === 'function'
  ) {
    timeout.unref();
  }
  return controller.signal;
}

function mergeFetchSignals(
  upstreamSignal: AbortSignal | null | undefined,
  timeoutSignal: AbortSignal | undefined,
): AbortSignal | undefined {
  if (!upstreamSignal) return timeoutSignal;
  if (!timeoutSignal) return upstreamSignal;
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([upstreamSignal, timeoutSignal]);
  }
  return timeoutSignal;
}

function createServerAuthBootstrapClient(
  cookieHeader: string,
  { timeoutMs }: { timeoutMs: number },
) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${config.BACKEND_URL}/trpc`,
        transformer: superjson,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': getApiAuthKey(),
          Cookie: cookieHeader,
          [AUTH_BOOTSTRAP_MODE_HEADER]: AUTH_BOOTSTRAP_MODE_COOKIE,
        },
        fetch(url, options) {
          const timeoutSignal = createTimeoutSignal(timeoutMs);
          return fetch(url, {
            ...options,
            credentials: 'include',
            cache: 'no-store',
            signal: mergeFetchSignals(options?.signal, timeoutSignal),
          });
        },
      }),
    ],
  });
}

export async function getInitialAuthSessionSnapshot({
  cookieHeader,
  hasServerReadableToken,
  timeoutMs = INITIAL_AUTH_SESSION_SNAPSHOT_TIMEOUT_MS,
}: {
  cookieHeader: string | null;
  hasServerReadableToken: boolean;
  timeoutMs?: number;
}): Promise<InitialAuthSessionSnapshot | null> {
  if (!hasServerReadableToken || !cookieHeader) return null;

  try {
    const session = await createServerAuthBootstrapClient(cookieHeader, {
      timeoutMs,
    }).users.getSessionSnapshot.query();
    return { session, resolvedAtMs: Date.now() };
  } catch {
    return null;
  }
}
