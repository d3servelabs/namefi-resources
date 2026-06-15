import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockUser = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  id: 'user-1',
  lastAccessedSessionAt: null,
  lastSignInAt: null,
  preferences: {},
  primaryEmail: null,
  privyUserId: 'did:privy:user-1',
  stripeCustomerId: null,
  subscribeToEmails: true,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const dbMocks = (() => {
  const withCache = vi.fn();
  const limit = vi.fn(() => ({ $withCache: withCache }));
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const insertReturning = vi.fn();
  const onConflictDoNothing = vi.fn(() => ({ returning: insertReturning }));
  const values = vi.fn(() => ({ onConflictDoNothing }));
  const insert = vi.fn(() => ({ values }));

  return {
    db: {
      execute: vi.fn(),
      insert,
      select,
      update: vi.fn(),
    },
    from,
    insert,
    insertReturning,
    limit,
    onConflictDoNothing,
    reset() {
      select.mockClear();
      from.mockClear();
      where.mockClear();
      limit.mockClear();
      withCache.mockReset();
      insert.mockClear();
      values.mockClear();
      onConflictDoNothing.mockClear();
      insertReturning.mockReset();
    },
    values,
    where,
    withCache,
  };
})();

const loggerMocks = {
  debug: vi.fn(),
  error: vi.fn(),
  trace: vi.fn(),
  warn: vi.fn(),
};

const privyMocks = {
  getUser: vi.fn(),
  verifyAuthToken: vi.fn(),
};

vi.mock('@namefi-astra/db', () => ({
  db: dbMocks.db,
  poweredbyNamefiDomainsTable: {
    hostname: 'hostname',
  },
  userPermissionsTable: {
    permission: 'permission',
    userId: 'user_id',
  },
  usersTable: {
    id: 'id',
    privyUserId: 'privyUserId',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((left, right) => ({ left, right })),
  sql: Object.assign(vi.fn(), { join: vi.fn() }),
}));

vi.mock('#lib/env', () => ({
  config: {
    DEV_NFSC_ENABLED: false,
    DEV_NFSC_SIGNUP_MINT_AMOUNT: 0,
    PRIVY_APP_ID: 'test-privy-app-id',
  },
  secrets: {
    PRIVY_SIGNATURE_VERIFICATION_KEY:
      '-----BEGIN PUBLIC KEY-----\ntest-key\n-----END PUBLIC KEY-----',
  },
}));

vi.mock('#lib/logger', () => ({
  createLogger: vi.fn(() => loggerMocks),
  logger: loggerMocks,
}));

vi.mock('#temporal/client', () => ({
  temporalClient: {
    workflow: {
      start: vi.fn(),
    },
  },
}));

vi.mock('#temporal/shared/enums', () => ({
  TEMPORAL_QUEUES: {
    DEFAULT: 'default',
  },
}));

vi.mock('#temporal/workflows/mint-dev-signup-nfsc.workflow', () => ({
  mintDevSignupNfscWorkflow: {
    generateId: vi.fn(() => 'workflow-id'),
  },
}));

vi.mock('../trpc/utils', () => ({
  canUserAccessAdminPanel: vi.fn(async () => false),
  getAllUsersThatCanAccessAdminPanel: vi.fn(async () => new Set()),
  getPrivyUserLinkedEthereumChecksumWalletAddresses: vi.fn(() => []),
  getPrivyUserLinkedEthereumWalletAddresses: vi.fn(() => []),
  privyClient: privyMocks,
}));

const { requireUserAuth, resolveAuthIdentityDisplayProfile } = await import(
  './auth'
);

describe('Privy auth display profile boundary', () => {
  beforeEach(() => {
    dbMocks.reset();
    vi.clearAllMocks();
    dbMocks.withCache.mockResolvedValue([mockUser]);
    privyMocks.verifyAuthToken.mockResolvedValue({
      issuedAt: 1_780_000_000,
      sessionId: 'session-1',
      userId: mockUser.privyUserId,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps requireUserAuth on the access-token auth path only', async () => {
    const result = await requireUserAuth('Bearer access-token', null);

    expect(privyMocks.verifyAuthToken).toHaveBeenCalledWith(
      'access-token',
      '-----BEGIN PUBLIC KEY-----\ntest-key\n-----END PUBLIC KEY-----',
    );
    expect(privyMocks.getUser).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      isNewUser: false,
      sessionId: 'session-1',
      user: mockUser,
    });
  });

  it('creates missing users with a conflict-safe Privy id insert', async () => {
    dbMocks.withCache.mockResolvedValueOnce([]);
    dbMocks.insertReturning.mockResolvedValueOnce([mockUser]);

    const result = await requireUserAuth('Bearer access-token', null);

    expect(dbMocks.insert).toHaveBeenCalled();
    expect(dbMocks.values).toHaveBeenCalledWith({
      privyUserId: mockUser.privyUserId,
      lastSignInAt: new Date(1_780_000_000 * 1000),
      lastAccessedSessionAt: expect.any(Date),
    });
    expect(dbMocks.onConflictDoNothing).toHaveBeenCalledWith({
      target: 'privyUserId',
    });
    expect(result).toMatchObject({
      isNewUser: true,
      user: mockUser,
    });
  });

  it('returns the existing user when another request wins the first-login insert race', async () => {
    dbMocks.withCache.mockResolvedValueOnce([]);
    dbMocks.insertReturning.mockResolvedValueOnce([]);
    dbMocks.limit
      .mockReturnValueOnce({ $withCache: dbMocks.withCache })
      .mockReturnValueOnce(Promise.resolve([mockUser]) as never);

    const result = await requireUserAuth('Bearer access-token', null);

    expect(dbMocks.onConflictDoNothing).toHaveBeenCalledWith({
      target: 'privyUserId',
    });
    expect(result).toMatchObject({
      isNewUser: false,
      user: mockUser,
    });
  });

  it('uses a matching identity token only through the explicit display resolver', async () => {
    privyMocks.getUser.mockResolvedValue({
      id: mockUser.privyUserId,
      customMetadata: {
        fullName: 'Fresh User',
      },
      linkedAccounts: [
        {
          type: 'email',
          address: 'fresh@example.com',
          latestVerifiedAt: new Date('2026-06-01T00:00:00.000Z'),
        },
        {
          type: 'wallet',
          address: '0xfresh',
          chainType: 'ethereum',
          latestVerifiedAt: new Date('2026-06-01T00:00:00.000Z'),
        },
      ],
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      isGuest: false,
    });

    const result = await resolveAuthIdentityDisplayProfile({
      identityToken: 'identity-token',
      privyUserId: mockUser.privyUserId,
    });

    expect(privyMocks.verifyAuthToken).not.toHaveBeenCalled();
    expect(privyMocks.getUser).toHaveBeenCalledWith({
      idToken: 'identity-token',
    });
    expect(result).toEqual({
      displayName: 'Fresh User',
      email: 'fresh@example.com',
      walletAddress: '0xfresh',
    });
  });

  it('ignores an identity token for a different Privy user', async () => {
    privyMocks.getUser.mockResolvedValue({
      id: 'did:privy:other-user',
      customMetadata: {
        fullName: 'Other User',
      },
      linkedAccounts: [
        {
          type: 'email',
          address: 'other@example.com',
          latestVerifiedAt: new Date('2026-06-01T00:00:00.000Z'),
        },
      ],
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      isGuest: false,
    });

    const result = await resolveAuthIdentityDisplayProfile({
      identityToken: 'identity-token',
      privyUserId: mockUser.privyUserId,
    });

    expect(result).toBeNull();
    expect(loggerMocks.warn).toHaveBeenCalledWith(
      {
        privyUserId: mockUser.privyUserId,
        identityTokenPrivyUserId: 'did:privy:other-user',
      },
      'Ignoring Privy identity token for a different user',
    );
  });

  it('does not authenticate with an identity token alone', async () => {
    await expect(requireUserAuth(undefined, null)).rejects.toThrow(
      'Authorization header missing or invalid',
    );
    expect(privyMocks.getUser).not.toHaveBeenCalled();
  });
});
