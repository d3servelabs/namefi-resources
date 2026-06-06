import { beforeEach, describe, expect, it, vi } from 'vitest';

const handler = vi.fn();
const mocks = {
  handler,
  c15tInstance: vi.fn(() => ({ handler })),
  drizzleAdapter: vi.fn(() => ({})),
  getPoweredByNamefi3PHostnames: vi.fn(async () => []),
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  },
};

vi.mock('@c15t/backend', () => ({
  c15tInstance: mocks.c15tInstance,
  policyPackPresets: {
    europeOptIn: vi.fn(() => ({ id: 'europe' })),
    californiaOptOut: vi.fn(() => ({ id: 'california' })),
    quebecOptIn: vi.fn(() => ({ id: 'quebec' })),
    worldNoBanner: vi.fn(() => ({ id: 'world' })),
  },
}));

vi.mock('@c15t/backend/db/adapters/drizzle', () => ({
  drizzleAdapter: mocks.drizzleAdapter,
}));

vi.mock('#lib/env', () => ({
  config: {
    ALLOW_ALL_ORIGINS: true,
    LOG_LEVEL: 'silent',
    NAMEFI_FIRST_PARTY_HOSTNAMES: [],
  },
}));

vi.mock('#lib/logger', () => ({
  createLogger: vi.fn(() => mocks.logger),
}));

vi.mock('#lib/namefi-registry', () => ({
  getPoweredByNamefi3PHostnames: mocks.getPoweredByNamefi3PHostnames,
}));

vi.mock('@namefi-astra/db', () => ({
  db: {},
}));

const { isC15tMeasurementConsentAutoGranted } = await import('./c15t');
const c15tInstanceCalls = mocks.c15tInstance.mock.calls as unknown as Array<
  [Record<string, unknown>]
>;
const c15tOptions = c15tInstanceCalls[0]?.[0];

describe('c15t instance configuration', () => {
  it('uses Drizzle schema names without applying a second table prefix', () => {
    expect(c15tOptions).toBeDefined();
    expect(c15tOptions).toMatchObject({
      basePath: '/c15t',
      policyPacks: [
        { id: 'europe' },
        { id: 'california' },
        { id: 'quebec' },
        { id: 'world' },
      ],
    });
    expect(c15tOptions).not.toHaveProperty('tablePrefix');
  });
});

describe('isC15tMeasurementConsentAutoGranted', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not call c15t init without passthrough request context', async () => {
    await expect(
      isC15tMeasurementConsentAutoGranted(new Headers()),
    ).resolves.toBe(false);

    expect(mocks.handler).not.toHaveBeenCalled();
  });

  it('auto-grants measurement for permissive c15t init policy data', async () => {
    mocks.handler.mockResolvedValueOnce(
      Response.json({
        jurisdiction: 'CCPA',
        policy: { model: 'opt-out', ui: { mode: 'none' } },
      }),
    );

    await expect(
      isC15tMeasurementConsentAutoGranted(
        new Headers({
          'x-client-geo-location-region': 'US',
          'x-client-geo-location-region-subdivision': 'USCA',
        }),
      ),
    ).resolves.toBe(true);

    const initRequest = mocks.handler.mock.calls[0]?.[0] as Request;
    expect(initRequest.url).toBe('http://namefi.local/c15t/init');
    expect(initRequest.headers.get('x-c15t-country')).toBe('US');
    expect(initRequest.headers.get('x-c15t-region')).toBe('USCA');
  });
});
