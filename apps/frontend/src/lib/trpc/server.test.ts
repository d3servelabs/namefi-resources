import {
  AUTH_BOOTSTRAP_MODE_COOKIE,
  AUTH_BOOTSTRAP_MODE_HEADER,
} from '@namefi-astra/common/auth-session';
import { afterEach, describe, expect, it, vi } from 'vitest';

type ServerTrpcModule = typeof import('./server');
type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

const loadedConfig = {
  TYPE: 'local',
  BACKEND_URL: 'http://backend.test',
  RESOURCES_URL: 'http://resources.test',
  DOCS_URL: 'http://docs.test',
  FIRST_PARTY_DEPLOYMENT_URL: 'http://frontend.test',
  GA_MEASUREMENT_ID: 'G-TEST',
  PRIVY_APP_ID: 'test-privy-app-id',
  STRIPE_PUBLISHABLE_KEY: 'pk_test',
};

async function importServerTrpc(): Promise<ServerTrpcModule> {
  process.env.API_AUTH_KEY = 'test-api-key';
  process.env.LOADED_CONFIG = JSON.stringify(loadedConfig);
  return import('./server');
}

function createSessionSnapshot() {
  const createdAt = new Date('2026-06-12T01:00:00.000Z');
  const updatedAt = new Date('2026-06-12T01:01:00.000Z');
  const user = {
    id: 'd8988592-91c7-4b2c-a2ca-1eb612386f43',
    privyUserId: 'did:privy:test-user',
    subscribeToEmails: true,
    stripeCustomerId: null,
    createdAt,
    updatedAt,
    lastSignInAt: null,
    lastAccessedSessionAt: null,
    displayProfile: {
      displayName: 'Test User',
      email: 'test@example.com',
      walletAddress: '0xabc',
    },
  };

  return {
    user,
    permissions: ['READ_USERS'],
    impersonationStatus: {
      impersonating: false as const,
      actorUserId: user.id,
      targetUserId: null,
      actor: null,
      target: null,
      targetPrivyUser: null,
      effectiveUser: user,
    },
  };
}

function createTrpcResponse(data: unknown) {
  return new Response(JSON.stringify({ result: { data: { json: data } } }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('getInitialAuthSessionSnapshot', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.API_AUTH_KEY;
    delete process.env.LOADED_CONFIG;
  });

  it('does not call the backend without a server-readable token and cookie header', async () => {
    const fetchMock = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
    const { getInitialAuthSessionSnapshot } = await importServerTrpc();

    await expect(
      getInitialAuthSessionSnapshot({
        cookieHeader: 'privy-token=token',
        hasServerReadableToken: false,
      }),
    ).resolves.toBeNull();
    await expect(
      getInitialAuthSessionSnapshot({
        cookieHeader: null,
        hasServerReadableToken: true,
      }),
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses cookie-bootstrap headers and an abortable no-store fetch for the server snapshot', async () => {
    const fetchMock = vi.fn(async (_url: FetchInput, _init?: FetchInit) =>
      createTrpcResponse(createSessionSnapshot()),
    );
    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
    const { getInitialAuthSessionSnapshot } = await importServerTrpc();

    const snapshot = await getInitialAuthSessionSnapshot({
      cookieHeader: 'privy-token=token',
      hasServerReadableToken: true,
      timeoutMs: 500,
    });

    expect(snapshot?.session.user.privyUserId).toBe('did:privy:test-user');
    expect(snapshot?.resolvedAtMs).toEqual(expect.any(Number));
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/trpc/users.getSessionSnapshot');
    expect(init.credentials).toBe('include');
    expect(init.cache).toBe('no-store');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      'x-api-key': 'test-api-key',
      Cookie: 'privy-token=token',
      [AUTH_BOOTSTRAP_MODE_HEADER]: AUTH_BOOTSTRAP_MODE_COOKIE,
    });
  });

  it('falls back to client auth when the server snapshot fetch times out', async () => {
    const fetchMock = vi.fn((_url: FetchInput, init?: FetchInit) => {
      const signal = init?.signal;
      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener(
          'abort',
          () => reject(signal.reason ?? new Error('aborted')),
          { once: true },
        );
      });
    });
    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
    const { getInitialAuthSessionSnapshot } = await importServerTrpc();

    await expect(
      getInitialAuthSessionSnapshot({
        cookieHeader: 'privy-token=token',
        hasServerReadableToken: true,
        timeoutMs: 1,
      }),
    ).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
