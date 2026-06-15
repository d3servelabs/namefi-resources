import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_BOOTSTRAP_MODE_COOKIE,
  AUTH_BOOTSTRAP_MODE_HEADER,
  PRIVY_ID_TOKEN_HEADER,
} from '@namefi-astra/common/auth-session';

const authMocks = {
  requireUserAuth: vi.fn(),
  resolveAuthIdentityDisplayProfile: vi.fn(),
};

const loginNotificationMocks = {
  triggerLoginNotification: vi.fn(),
};

const dbMocks = (() => {
  const where = vi.fn();
  const db = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where,
      })),
    })),
  };

  function reset() {
    where.mockReset().mockResolvedValue([]);
    db.select.mockClear();
  }

  return {
    db,
    reset,
    where,
  };
})();

const loggerMocks = {
  assign: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  trace: vi.fn(),
  warn: vi.fn(),
};

const cookieMocks = {
  getCookie: vi.fn(),
};

vi.mock('@namefi-astra/db', () => ({
  db: dbMocks.db,
  poweredbyNamefiDomainsTable: {},
  userPermissionsTable: {
    permission: 'permission',
    userId: 'user_id',
  },
  usersTable: {
    id: 'id',
  },
}));

vi.mock('#lib/auth', () => ({
  requireUserAuth: authMocks.requireUserAuth,
  resolveAuthIdentityDisplayProfile:
    authMocks.resolveAuthIdentityDisplayProfile,
}));

vi.mock('#lib/env', () => ({
  config: {
    ALLOW_ALL_ORIGINS: true,
    ALLOW_LOGIN_NOTIFICATIONS: true,
    ALLOWED_CHAINS: {
      DNS_SERVING_ALLOWED_NFT_CHAINS: [1],
      NFSC_BALANCE_ALLOWED_CHAINS: [1],
      NFT_ALLOWED_CHAINS: [1],
    },
    NAMEFI_FIRST_PARTY_HOSTNAMES: ['localhost'],
    SHOW_LOGIN_METHOD: false,
    X402_ENABLED: false,
    X402_SIGNER_ADDRESS: '',
  },
  secrets: {
    API_AUTH_KEY: 'test-api-key',
  },
}));

vi.mock('#lib/logger', () => ({
  createLogger: vi.fn(() => loggerMocks),
  logger: loggerMocks,
}));

vi.mock('#lib/execution-context/context', () => ({
  createUserContext: vi.fn((context) => context),
  extendCurrentExecutionContext: vi.fn(),
  setExecutionContext: vi.fn(),
}));

vi.mock('../temporal/activities/default', () => ({
  sendHttpAlert: vi.fn(),
}));

vi.mock('#lib/login-notification', () => ({
  triggerLoginNotification: loginNotificationMocks.triggerLoginNotification,
}));

vi.mock('#lib/namefi-registry', () => ({
  getPoweredByNamefi3PHostnames: vi.fn(async () => []),
  getPoweredByNamefiDomainFromHostname: vi.fn(async () => null),
}));

vi.mock('#lib/hostname-validation', () => ({
  isHostnameAllowed: vi.fn(() => true),
}));

vi.mock('#lib/validate-api-key', () => ({
  validateApiKey: vi.fn(() => true),
}));

vi.mock('#lib/auditor', () => ({
  audit: vi.fn(),
  createAuditRecord: vi.fn((record) => record),
  ResourceType: {},
}));

vi.mock('#lib/auth/ecdsa-payload-signature', () => ({
  NAMEFI_EIP712_DOMAIN: {},
  verifySignedPayload: vi.fn(),
}));

vi.mock('hono/cookie', () => ({
  getCookie: cookieMocks.getCookie,
}));

vi.mock('./utils', () => ({
  canUserAccessAdminPanel: vi.fn(async () => false),
  getPrivyUserLinkedEthereumChecksumWalletAddresses: vi.fn(() => []),
  privyClient: {},
}));

const {
  cookieAuthBootstrapProcedure,
  createContext,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} = await import('./base');

const authPolicyRouter = createTRPCRouter({
  protectedMutation: protectedProcedure.mutation(({ ctx }) => ({
    authSource: ctx.authSource,
    userId: ctx.user.id,
  })),
  protectedProbe: protectedProcedure.query(({ ctx }) => ({
    authSource: ctx.authSource,
    userId: ctx.user.id,
  })),
  publicProbe: publicProcedure.query(({ ctx }) => ({
    authSource: ctx.authSource ?? null,
    userId: ctx.user?.id ?? null,
  })),
  snapshotProbe: cookieAuthBootstrapProcedure.query(({ ctx }) => ({
    authSource: ctx.authSource,
    userId: ctx.user.id,
  })),
});

function createAuthPolicyContext({
  authorization,
  bootstrapMode,
  cookieToken,
}: {
  authorization?: string;
  bootstrapMode?: string;
  cookieToken?: string;
}) {
  cookieMocks.getCookie.mockImplementation(async (_ctx, name) =>
    name === 'privy-token' ? cookieToken : undefined,
  );

  return {
    db: dbMocks.db,
    honoCtx: cookieToken ? ({} as never) : undefined,
    honoVars: {
      connInfo: { remote: { address: '127.0.0.1' } },
      requestId: 'request-1',
      requestInfo: {
        browserFingerprint: 'fingerprint-1',
        geo: {
          city: null,
          lat: null,
          lng: null,
          regionCode: null,
          subdivision: null,
        },
        ipAddress: '127.0.0.1',
        isGoogleLB: false,
        protocol: null,
        source: 'conn-info',
        userAgentFamily: null,
        deviceType: null,
      },
    },
    poweredByNamefiDomain: null,
    req: {
      header: (name?: string) => {
        if (!name) return {};
        if (name === 'Authorization') return authorization;
        if (name === AUTH_BOOTSTRAP_MODE_HEADER) return bootstrapMode;
        if (name === 'User-Agent') return 'Vitest';
        return undefined;
      },
    },
    res: {},
    testUser: null,
  };
}

function mockResolvedAuthUser() {
  const user = {
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    id: 'user-1',
    lastAccessedSessionAt: null,
    lastSignInAt: null,
    preferences: { defaultAutoEns: true, defaultAutoRenew: true },
    primaryEmail: null,
    privyUserId: 'did:privy:user-1',
    stripeCustomerId: null,
    subscribeToEmails: true,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  authMocks.requireUserAuth.mockResolvedValue({
    isNewUser: false,
    sessionId: 'session-1',
    tokenIssuedAt: new Date(),
    user,
  });
}

describe('request identity display resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.reset();
    cookieMocks.getCookie.mockReset().mockResolvedValue(undefined);
    authMocks.resolveAuthIdentityDisplayProfile.mockResolvedValue({
      displayName: 'Fresh User',
      email: 'fresh@example.com',
      walletAddress: '0xfresh',
    });
  });

  it('memoizes identity-token display hydration per request and subject', async () => {
    const context = await createContext(
      { info: { calls: [] } } as never,
      {
        req: {
          header: (name?: string) =>
            name?.toLowerCase() === PRIVY_ID_TOKEN_HEADER.toLowerCase()
              ? 'identity-header-token'
              : undefined,
          raw: {
            headers: new Headers(),
          },
        },
        res: {},
        var: {
          connInfo: { remote: { address: '127.0.0.1' } },
          requestId: 'request-1',
          requestInfo: { ipAddress: '127.0.0.1' },
        },
      } as never,
    );

    await expect(
      context.getIdentityDisplayProfile?.('did:privy:user-1'),
    ).resolves.toEqual({
      displayName: 'Fresh User',
      email: 'fresh@example.com',
      walletAddress: '0xfresh',
    });
    await expect(
      context.getIdentityDisplayProfile?.('did:privy:user-1'),
    ).resolves.toEqual({
      displayName: 'Fresh User',
      email: 'fresh@example.com',
      walletAddress: '0xfresh',
    });

    expect(authMocks.resolveAuthIdentityDisplayProfile).toHaveBeenCalledOnce();
    expect(authMocks.resolveAuthIdentityDisplayProfile).toHaveBeenCalledWith({
      identityToken: 'identity-header-token',
      privyUserId: 'did:privy:user-1',
    });
  });
});

describe('Privy cookie auth policy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.reset();
    cookieMocks.getCookie.mockReset().mockResolvedValue(undefined);
    mockResolvedAuthUser();
  });

  it('accepts cookie-only auth on protected read queries and keeps login notification work', async () => {
    const caller = authPolicyRouter.createCaller(
      createAuthPolicyContext({
        cookieToken: 'cookie-token',
      }) as never,
      {},
    );

    await expect(caller.protectedProbe()).resolves.toEqual({
      authSource: 'privy-cookie',
      userId: 'user-1',
    });
    expect(authMocks.requireUserAuth).toHaveBeenCalledWith(
      'Bearer cookie-token',
      null,
    );
    expect(
      loginNotificationMocks.triggerLoginNotification,
    ).toHaveBeenCalledOnce();
  });

  it('rejects cookie-only auth on protected mutations', async () => {
    const caller = authPolicyRouter.createCaller(
      createAuthPolicyContext({
        cookieToken: 'cookie-token',
      }) as never,
      {},
    );

    await expect(caller.protectedMutation()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(authMocks.requireUserAuth).not.toHaveBeenCalled();
    expect(
      loginNotificationMocks.triggerLoginNotification,
    ).not.toHaveBeenCalled();
  });

  it('rejects invalid cookie auth on protected read queries', async () => {
    authMocks.requireUserAuth.mockRejectedValueOnce(
      new Error('signature verification failed'),
    );
    const caller = authPolicyRouter.createCaller(
      createAuthPolicyContext({
        cookieToken: 'expired-cookie-token',
      }) as never,
      {},
    );

    await expect(caller.protectedProbe()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(authMocks.requireUserAuth).toHaveBeenCalledWith(
      'Bearer expired-cookie-token',
      null,
    );
    expect(
      loginNotificationMocks.triggerLoginNotification,
    ).not.toHaveBeenCalled();
  });

  it('accepts cookie-only auth only on the cookie bootstrap procedure and suppresses login notification work', async () => {
    const caller = authPolicyRouter.createCaller(
      createAuthPolicyContext({
        cookieToken: 'cookie-token',
      }) as never,
      {},
    );

    await expect(caller.snapshotProbe()).resolves.toEqual({
      authSource: 'privy-cookie',
      userId: 'user-1',
    });
    expect(authMocks.requireUserAuth).toHaveBeenCalledWith(
      'Bearer cookie-token',
      null,
    );
    expect(
      loginNotificationMocks.triggerLoginNotification,
    ).not.toHaveBeenCalled();
  });

  it('does not let the bootstrap header suppress login notification work for bearer auth', async () => {
    const caller = authPolicyRouter.createCaller(
      createAuthPolicyContext({
        authorization: 'Bearer auth-token',
        bootstrapMode: AUTH_BOOTSTRAP_MODE_COOKIE,
        cookieToken: 'cookie-token',
      }) as never,
      {},
    );

    await expect(caller.snapshotProbe()).resolves.toEqual({
      authSource: 'authorization-header',
      userId: 'user-1',
    });
    expect(authMocks.requireUserAuth).toHaveBeenCalledWith(
      'Bearer auth-token',
      null,
    );
    expect(
      loginNotificationMocks.triggerLoginNotification,
    ).toHaveBeenCalledOnce();
  });

  it('treats invalid optional cookie auth as anonymous public auth', async () => {
    authMocks.requireUserAuth.mockRejectedValueOnce(
      new Error('signature verification failed'),
    );
    const caller = authPolicyRouter.createCaller(
      createAuthPolicyContext({
        cookieToken: 'expired-cookie-token',
      }) as never,
      {},
    );

    await expect(caller.publicProbe()).resolves.toEqual({
      authSource: null,
      userId: null,
    });
    expect(authMocks.requireUserAuth).toHaveBeenCalledWith(
      'Bearer expired-cookie-token',
      null,
    );
    expect(
      loginNotificationMocks.triggerLoginNotification,
    ).not.toHaveBeenCalled();
  });

  it('treats invalid optional bearer auth as anonymous public auth', async () => {
    authMocks.requireUserAuth.mockRejectedValueOnce(
      new Error('invalid auth token'),
    );
    const caller = authPolicyRouter.createCaller(
      createAuthPolicyContext({
        authorization: 'Bearer invalid-auth-token',
        cookieToken: 'cookie-token',
      }) as never,
      {},
    );

    await expect(caller.publicProbe()).resolves.toEqual({
      authSource: null,
      userId: null,
    });
    expect(authMocks.requireUserAuth).toHaveBeenCalledWith(
      'Bearer invalid-auth-token',
      null,
    );
    expect(
      loginNotificationMocks.triggerLoginNotification,
    ).not.toHaveBeenCalled();
  });
});
