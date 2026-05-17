import { beforeEach, describe, expect, it, vi } from 'vitest';

const queryBuilder = {
  from: vi.fn(),
  leftJoin: vi.fn(),
  where: vi.fn(),
};

const mocks = {
  defaultKeyv: {
    get: vi.fn(),
    set: vi.fn(),
  },
  db: {
    select: vi.fn(),
  },
  queryBuilder,
  getUserCookieConsentState: vi.fn(),
  loggerWarn: vi.fn(),
};

vi.mock('#lib/keyv', () => ({
  defaultKeyv: mocks.defaultKeyv,
}));

vi.mock('#lib/consent', () => ({
  getUserCookieConsentState: mocks.getUserCookieConsentState,
}));

vi.mock('#lib/logger', () => ({
  logger: {
    warn: mocks.loggerWarn,
  },
}));

vi.mock('@namefi-astra/db', () => ({
  db: mocks.db,
  usersTable: {
    id: 'users.id',
    privyUserId: 'users.privyUserId',
  },
}));

vi.mock('@namefi-astra/db/schemas/internal', () => ({
  privyUsersTableSchema: {
    email: 'privy.email',
    privyUserId: 'privy.privyUserId',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(() => 'eq'),
  ilike: vi.fn(() => 'ilike'),
}));

const {
  resolveApiCheckoutTracking,
  resolveWebCheckoutTracking,
  toGaEventTracking,
} = await import('./context');

function mockTeamMembers(userIds: string[]) {
  mocks.defaultKeyv.get.mockResolvedValue(null);
  mocks.db.select.mockReturnValue(mocks.queryBuilder);
  mocks.queryBuilder.from.mockReturnValue(mocks.queryBuilder);
  mocks.queryBuilder.leftJoin.mockReturnValue(mocks.queryBuilder);
  mocks.queryBuilder.where.mockResolvedValue(
    userIds.map((userId) => ({
      userId,
    })),
  );
}

describe('checkout tracking context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTeamMembers([]);
    mocks.getUserCookieConsentState.mockResolvedValue('granted');
  });

  it('disables tracking for internal users', async () => {
    mockTeamMembers(['user-1']);

    await expect(
      resolveWebCheckoutTracking({
        userId: 'user-1',
        gaIdentity: { clientId: '123.456', sessionId: 1716012345 },
        consentDomainName: 'namefi.io',
      }),
    ).resolves.toEqual({
      trackGaEvents: false,
      reason: 'INTERNAL',
    });

    expect(mocks.getUserCookieConsentState).not.toHaveBeenCalled();
  });

  it('skips web tracking without a browser GA client id', async () => {
    await expect(
      resolveWebCheckoutTracking({
        userId: 'user-1',
        gaIdentity: { sessionId: 1716012345 },
        consentDomainName: 'namefi.io',
      }),
    ).resolves.toEqual({
      trackGaEvents: false,
      reason: 'PRIVACY',
    });

    expect(mocks.getUserCookieConsentState).not.toHaveBeenCalled();
  });

  it('skips authenticated web tracking when c15t measurement consent is absent', async () => {
    mocks.getUserCookieConsentState.mockResolvedValue('denied');

    await expect(
      resolveWebCheckoutTracking({
        userId: 'user-1',
        gaIdentity: { clientId: '123.456', sessionId: 1716012345 },
        consentDomainName: 'namefi.io',
      }),
    ).resolves.toEqual({
      trackGaEvents: false,
      reason: 'PRIVACY',
    });
  });

  it('skips authenticated web tracking when the current request cookie denies measurement', async () => {
    mocks.getUserCookieConsentState.mockResolvedValue('granted');

    await expect(
      resolveWebCheckoutTracking({
        userId: 'user-1',
        gaIdentity: { clientId: '123.456', sessionId: 1716012345 },
        consentDomainName: 'namefi.io',
        requestMeasurementConsentState: 'denied',
      }),
    ).resolves.toEqual({
      trackGaEvents: false,
      reason: 'PRIVACY',
    });
    expect(mocks.getUserCookieConsentState).not.toHaveBeenCalled();
  });

  it('skips authenticated web tracking when consent is unknown and c15t does not auto-grant', async () => {
    const getMeasurementConsentAutoGranted = vi.fn().mockResolvedValue(false);
    mocks.getUserCookieConsentState.mockResolvedValue('unknown');

    await expect(
      resolveWebCheckoutTracking({
        userId: 'user-1',
        gaIdentity: { clientId: '123.456', sessionId: 1716012345 },
        consentDomainName: 'namefi.io',
        getMeasurementConsentAutoGranted,
      }),
    ).resolves.toEqual({
      trackGaEvents: false,
      reason: 'PRIVACY',
    });

    expect(getMeasurementConsentAutoGranted).toHaveBeenCalledTimes(1);
  });

  it('returns browser identity when consent is unknown and c15t auto-grants', async () => {
    const getMeasurementConsentAutoGranted = vi.fn().mockResolvedValue(true);
    mocks.getUserCookieConsentState.mockResolvedValue('unknown');

    await expect(
      resolveWebCheckoutTracking({
        userId: 'user-1',
        gaIdentity: { clientId: '123.456', sessionId: 1716012345 },
        consentDomainName: 'namefi.io',
        getMeasurementConsentAutoGranted,
      }),
    ).resolves.toEqual({
      trackGaEvents: true,
      identity: {
        clientId: '123.456',
        sessionId: 1716012345,
      },
    });
  });

  it('uses request cookie consent when authenticated c15t consent is unknown', async () => {
    const getMeasurementConsentAutoGranted = vi.fn();
    mocks.getUserCookieConsentState.mockResolvedValue('unknown');

    await expect(
      resolveWebCheckoutTracking({
        userId: 'user-1',
        gaIdentity: { clientId: '123.456', sessionId: 1716012345 },
        consentDomainName: 'namefi.io',
        requestMeasurementConsentState: 'granted',
        getMeasurementConsentAutoGranted,
      }),
    ).resolves.toEqual({
      trackGaEvents: true,
      identity: {
        clientId: '123.456',
        sessionId: 1716012345,
      },
    });
    expect(getMeasurementConsentAutoGranted).not.toHaveBeenCalled();
  });

  it('skips authenticated web tracking when c15t is unknown and request cookie denies measurement', async () => {
    const getMeasurementConsentAutoGranted = vi.fn();
    mocks.getUserCookieConsentState.mockResolvedValue('unknown');

    await expect(
      resolveWebCheckoutTracking({
        userId: 'user-1',
        gaIdentity: { clientId: '123.456', sessionId: 1716012345 },
        consentDomainName: 'namefi.io',
        requestMeasurementConsentState: 'denied',
        getMeasurementConsentAutoGranted,
      }),
    ).resolves.toEqual({
      trackGaEvents: false,
      reason: 'PRIVACY',
    });
    expect(getMeasurementConsentAutoGranted).not.toHaveBeenCalled();
  });

  it('uses request cookie consent for logged-out web tracking', async () => {
    await expect(
      resolveWebCheckoutTracking({
        gaIdentity: { clientId: '123.456', sessionId: 1716012345 },
        requestMeasurementConsentState: 'granted',
      }),
    ).resolves.toEqual({
      trackGaEvents: true,
      identity: {
        clientId: '123.456',
        sessionId: 1716012345,
      },
    });
    expect(mocks.getUserCookieConsentState).not.toHaveBeenCalled();
  });

  it('skips logged-out web tracking when request cookie denies measurement', async () => {
    const getMeasurementConsentAutoGranted = vi.fn();

    await expect(
      resolveWebCheckoutTracking({
        gaIdentity: { clientId: '123.456', sessionId: 1716012345 },
        requestMeasurementConsentState: 'denied',
        getMeasurementConsentAutoGranted,
      }),
    ).resolves.toEqual({
      trackGaEvents: false,
      reason: 'PRIVACY',
    });
    expect(getMeasurementConsentAutoGranted).not.toHaveBeenCalled();
    expect(mocks.getUserCookieConsentState).not.toHaveBeenCalled();
  });

  it('uses geo auto-grant for logged-out web tracking without a request cookie', async () => {
    const getMeasurementConsentAutoGranted = vi.fn().mockResolvedValue(true);

    await expect(
      resolveWebCheckoutTracking({
        gaIdentity: { clientId: '123.456', sessionId: 1716012345 },
        getMeasurementConsentAutoGranted,
      }),
    ).resolves.toEqual({
      trackGaEvents: true,
      identity: {
        clientId: '123.456',
        sessionId: 1716012345,
      },
    });
    expect(getMeasurementConsentAutoGranted).toHaveBeenCalledTimes(1);
    expect(mocks.getUserCookieConsentState).not.toHaveBeenCalled();
  });

  it('skips logged-out web tracking when request consent is unknown and geo does not auto-grant', async () => {
    const getMeasurementConsentAutoGranted = vi.fn().mockResolvedValue(false);

    await expect(
      resolveWebCheckoutTracking({
        gaIdentity: { clientId: '123.456', sessionId: 1716012345 },
        getMeasurementConsentAutoGranted,
      }),
    ).resolves.toEqual({
      trackGaEvents: false,
      reason: 'PRIVACY',
    });
    expect(getMeasurementConsentAutoGranted).toHaveBeenCalledTimes(1);
    expect(mocks.getUserCookieConsentState).not.toHaveBeenCalled();
  });

  it('returns browser identity for consented web tracking', async () => {
    const getMeasurementConsentAutoGranted = vi.fn();

    await expect(
      resolveWebCheckoutTracking({
        userId: 'user-1',
        gaIdentity: { clientId: '123.456', sessionId: 1716012345 },
        consentDomainName: 'namefi.io',
        getMeasurementConsentAutoGranted,
      }),
    ).resolves.toEqual({
      trackGaEvents: true,
      identity: {
        clientId: '123.456',
        sessionId: 1716012345,
      },
    });
    expect(getMeasurementConsentAutoGranted).not.toHaveBeenCalled();
  });

  it('marks API tracking with event_source api', async () => {
    const tracking = await resolveApiCheckoutTracking({ userId: 'user-1' });

    expect(tracking).toEqual({
      trackGaEvents: true,
      reason: 'API',
      identity: {
        eventSource: 'api',
      },
    });
    expect(toGaEventTracking(tracking)).toEqual({
      trackGaEvents: true,
      reason: 'API',
      clientId: undefined,
      sessionId: undefined,
      eventSource: 'api',
    });
  });

  it('preserves internal-user skip for API tracking', async () => {
    mockTeamMembers(['user-1']);

    await expect(
      resolveApiCheckoutTracking({ userId: 'user-1' }),
    ).resolves.toEqual({
      trackGaEvents: false,
      reason: 'INTERNAL',
      identity: {
        eventSource: 'api',
      },
    });
  });

  it('retries team-member lookup after a rejected single-flight query', async () => {
    mocks.defaultKeyv.get.mockResolvedValue(null);
    mocks.db.select.mockReturnValue(mocks.queryBuilder);
    mocks.queryBuilder.from.mockReturnValue(mocks.queryBuilder);
    mocks.queryBuilder.leftJoin.mockReturnValue(mocks.queryBuilder);
    mocks.queryBuilder.where
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockResolvedValueOnce([{ userId: 'user-1' }]);

    await expect(
      resolveApiCheckoutTracking({ userId: 'user-1' }),
    ).resolves.toEqual({
      trackGaEvents: true,
      reason: 'API',
      identity: {
        eventSource: 'api',
      },
    });

    await expect(
      resolveApiCheckoutTracking({ userId: 'user-1' }),
    ).resolves.toEqual({
      trackGaEvents: false,
      reason: 'INTERNAL',
      identity: {
        eventSource: 'api',
      },
    });
    expect(mocks.loggerWarn).toHaveBeenCalledTimes(1);
    expect(mocks.db.select).toHaveBeenCalledTimes(2);
  });
});
