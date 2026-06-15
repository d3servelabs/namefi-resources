import {
  BROWSER_FINGERPRINT_HEADER,
  C15T_MEASUREMENT_CONSENT_HEADER,
  GA_CLIENT_ID_HEADER,
  GA_SESSION_ID_HEADER,
} from '@namefi-astra/common/google-analytics';
import {
  AUTH_BOOTSTRAP_MODE_HEADER,
  PRIVY_ID_TOKEN_HEADER,
} from '@namefi-astra/common/auth-session';
import { beforeAll, describe, expect, it, vi } from 'vitest';

type TrpcRequestHeadersModule = typeof import('./trpc-request-headers');

let trpcRequestHeaders: TrpcRequestHeadersModule;

beforeAll(async () => {
  process.env.LOADED_CONFIG = JSON.stringify({
    TYPE: 'local',
    BACKEND_URL: 'http://localhost:3000',
    RESOURCES_URL: 'http://localhost:3002',
    DOCS_URL: 'http://localhost:3003',
    FIRST_PARTY_DEPLOYMENT_URL: 'http://localhost:3001',
    GA_MEASUREMENT_ID: 'G-TEST',
    PRIVY_APP_ID: 'test-privy-app-id',
    STRIPE_PUBLISHABLE_KEY: 'pk_test',
  });
  trpcRequestHeaders = await import('./trpc-request-headers');
});

describe('shouldIncludePrivyIdTokenHeaders', () => {
  it('includes identity-token headers when any operation explicitly opts in', () => {
    const includePrivyIdTokenKey =
      trpcRequestHeaders.TRPC_INCLUDE_PRIVY_ID_TOKEN_CONTEXT_KEY;

    expect(
      trpcRequestHeaders.shouldIncludePrivyIdTokenHeaders({
        op: { context: { [includePrivyIdTokenKey]: true } },
      }),
    ).toBe(true);

    expect(
      trpcRequestHeaders.shouldIncludePrivyIdTokenHeaders({
        opList: [
          { context: {} },
          { context: { [includePrivyIdTokenKey]: true } },
        ],
      }),
    ).toBe(true);

    expect(
      trpcRequestHeaders.shouldIncludePrivyIdTokenHeaders({
        opList: [{ context: {} }, { context: { skipBatch: true } }],
      }),
    ).toBe(false);
  });
});

describe('getTrpcRequestHeadersWithDependencies', () => {
  it('does not emit the cookie-bootstrap header through the exported browser helper', async () => {
    await expect(trpcRequestHeaders.getTrpcRequestHeaders()).resolves.toEqual({
      'Content-Type': 'application/json',
    });
    await expect(
      trpcRequestHeaders.getTrpcRequestHeaders({
        op: { context: { cookieAuthBootstrap: true } },
      }),
    ).resolves.not.toHaveProperty(AUTH_BOOTSTRAP_MODE_HEADER);
  });

  it('does not emit the cookie-bootstrap header from browser tRPC helpers', async () => {
    const dependencies = {
      getAuthToken: vi.fn(async () => 'auth-token'),
      getPrivyIdToken: vi.fn(async () => 'identity-token'),
      getBrowserFingerprint: vi.fn(async () => 'fingerprint'),
      getGoogleAnalyticsClientId: vi.fn(async () => '123.456'),
      getGoogleAnalyticsSessionId: vi.fn(async () => '789'),
      getMeasurementConsentHeader: vi.fn(() => 'granted' as const),
    };

    const headers =
      await trpcRequestHeaders.getTrpcRequestHeadersWithDependencies(
        {
          includeAuthToken: false,
          includeClientSignals: false,
          includePrivyIdToken: false,
        },
        dependencies,
      );

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      [C15T_MEASUREMENT_CONSENT_HEADER]: 'granted',
    });
    expect(dependencies.getAuthToken).not.toHaveBeenCalled();
    expect(dependencies.getPrivyIdToken).not.toHaveBeenCalled();
    expect(dependencies.getMeasurementConsentHeader).toHaveBeenCalledOnce();
    expect(dependencies.getBrowserFingerprint).not.toHaveBeenCalled();
    expect(dependencies.getGoogleAnalyticsClientId).not.toHaveBeenCalled();
    expect(dependencies.getGoogleAnalyticsSessionId).not.toHaveBeenCalled();
  });

  it('keeps auth token fallback without client signals in auth-only mode', async () => {
    const dependencies = {
      getAuthToken: vi.fn(async () => 'auth-token'),
      getPrivyIdToken: vi.fn(async () => 'identity-token'),
      getBrowserFingerprint: vi.fn(async () => 'fingerprint'),
      getGoogleAnalyticsClientId: vi.fn(async () => '123.456'),
      getGoogleAnalyticsSessionId: vi.fn(async () => '789'),
      getMeasurementConsentHeader: vi.fn(() => 'granted' as const),
    };

    const headers =
      await trpcRequestHeaders.getTrpcRequestHeadersWithDependencies(
        {
          includeAuthToken: true,
          includeClientSignals: false,
          includePrivyIdToken: false,
        },
        dependencies,
      );

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer auth-token',
      [C15T_MEASUREMENT_CONSENT_HEADER]: 'granted',
    });
    expect(dependencies.getAuthToken).toHaveBeenCalledOnce();
    expect(dependencies.getPrivyIdToken).not.toHaveBeenCalled();
    expect(dependencies.getBrowserFingerprint).not.toHaveBeenCalled();
    expect(dependencies.getGoogleAnalyticsClientId).not.toHaveBeenCalled();
    expect(dependencies.getGoogleAnalyticsSessionId).not.toHaveBeenCalled();
  });

  it('short-circuits auth, fingerprint, and GA dependencies when dev skip-auth is active', async () => {
    const dependencies = {
      getAuthToken: vi.fn(async () => 'auth-token'),
      getPrivyIdToken: vi.fn(async () => 'identity-token'),
      getBrowserFingerprint: vi.fn(async () => 'fingerprint'),
      getGoogleAnalyticsClientId: vi.fn(async () => '123.456'),
      getGoogleAnalyticsSessionId: vi.fn(async () => '789'),
      getMeasurementConsentHeader: vi.fn(() => 'granted' as const),
      isSkipAuthActive: vi.fn(() => true),
    };

    const headers =
      await trpcRequestHeaders.getTrpcRequestHeadersWithDependencies(
        {
          includeAuthToken: true,
          includeClientSignals: true,
          includePrivyIdToken: true,
        },
        dependencies,
      );

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      'X-Skip-Auth': '1',
      [C15T_MEASUREMENT_CONSENT_HEADER]: 'granted',
    });
    expect(dependencies.getAuthToken).not.toHaveBeenCalled();
    expect(dependencies.getPrivyIdToken).not.toHaveBeenCalled();
    expect(dependencies.getBrowserFingerprint).not.toHaveBeenCalled();
    expect(dependencies.getGoogleAnalyticsClientId).not.toHaveBeenCalled();
    expect(dependencies.getGoogleAnalyticsSessionId).not.toHaveBeenCalled();
  });

  it('keeps fingerprint and GA enrichment on the default enriched path without identity token', async () => {
    const dependencies = {
      getAuthToken: vi.fn(async () => 'auth-token'),
      getPrivyIdToken: vi.fn(async () => 'identity-token'),
      getBrowserFingerprint: vi.fn(async () => 'fingerprint'),
      getGoogleAnalyticsClientId: vi.fn(async () => '123.456'),
      getGoogleAnalyticsSessionId: vi.fn(async () => '789'),
      getMeasurementConsentHeader: vi.fn(() => 'granted' as const),
    };

    const headers =
      await trpcRequestHeaders.getTrpcRequestHeadersWithDependencies(
        {
          includeAuthToken: true,
          includeClientSignals: true,
          includePrivyIdToken: false,
        },
        dependencies,
      );

    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer auth-token',
      [C15T_MEASUREMENT_CONSENT_HEADER]: 'granted',
      [BROWSER_FINGERPRINT_HEADER]: 'fingerprint',
      [GA_CLIENT_ID_HEADER]: '123.456',
      [GA_SESSION_ID_HEADER]: '789',
    });
    expect(dependencies.getPrivyIdToken).not.toHaveBeenCalled();
    expect(dependencies.getBrowserFingerprint).toHaveBeenCalledOnce();
    expect(dependencies.getGoogleAnalyticsClientId).toHaveBeenCalledOnce();
    expect(dependencies.getGoogleAnalyticsSessionId).toHaveBeenCalledOnce();
  });

  it('includes the Privy identity token only on explicit display-profile requests', async () => {
    const dependencies = {
      getAuthToken: vi.fn(async () => 'auth-token'),
      getPrivyIdToken: vi.fn(async () => 'identity-token'),
      getBrowserFingerprint: vi.fn(async () => 'fingerprint'),
      getGoogleAnalyticsClientId: vi.fn(async () => '123.456'),
      getGoogleAnalyticsSessionId: vi.fn(async () => '789'),
      getMeasurementConsentHeader: vi.fn(() => 'granted' as const),
    };

    const headers =
      await trpcRequestHeaders.getTrpcRequestHeadersWithDependencies(
        {
          includeAuthToken: true,
          includeClientSignals: true,
          includePrivyIdToken: true,
        },
        dependencies,
      );

    expect(headers).toMatchObject({
      Authorization: 'Bearer auth-token',
      [PRIVY_ID_TOKEN_HEADER]: 'identity-token',
    });
    expect(dependencies.getPrivyIdToken).toHaveBeenCalledOnce();
  });

  it('does not send a Privy identity token when no auth token is available', async () => {
    const dependencies = {
      getAuthToken: vi.fn(async () => null),
      getPrivyIdToken: vi.fn(async () => 'identity-token'),
      getBrowserFingerprint: vi.fn(async () => null),
      getGoogleAnalyticsClientId: vi.fn(async () => null),
      getGoogleAnalyticsSessionId: vi.fn(async () => null),
      getMeasurementConsentHeader: vi.fn(() => null),
    };

    const headers =
      await trpcRequestHeaders.getTrpcRequestHeadersWithDependencies(
        {
          includeAuthToken: true,
          includeClientSignals: true,
          includePrivyIdToken: true,
        },
        dependencies,
      );

    expect(headers).toEqual({
      'Content-Type': 'application/json',
    });
    expect(dependencies.getAuthToken).toHaveBeenCalledOnce();
    expect(dependencies.getPrivyIdToken).not.toHaveBeenCalled();
  });
});
