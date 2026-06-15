import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

process.env.DATABASE_URL ??= 'postgres://postgres:postgres@localhost:5432/test';

const mockAuth = vi.hoisted(() => ({
  requireUserAuth: vi.fn(),
}));

const mockLoginNotification = vi.hoisted(() => ({
  triggerLoginNotification: vi.fn(),
}));

const mockCookie = vi.hoisted(() => ({
  deleteCookie: vi.fn(),
  getCookie: vi.fn(),
  setCookie: vi.fn(),
}));

const { mockAllowedChains } = vi.hoisted(() => ({
  mockAllowedChains: {
    NFT_ALLOWED_CHAINS: [1, 11_155_111],
    DNS_SERVING_ALLOWED_NFT_CHAINS: [1, 11_155_111],
    NFSC_BALANCE_ALLOWED_CHAINS: [1, 11_155_111],
  },
}));

const mockDb = vi.hoisted(() => {
  const db = {
    query: {
      orderItemsTable: {
        findMany: vi.fn(),
      },
      usersTable: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(),
    $with: vi.fn().mockReturnValue({ as: vi.fn() }),
    update: vi.fn(),
  };

  function reset() {
    db.query.orderItemsTable.findMany.mockReset().mockResolvedValue([]);
    db.query.usersTable.findFirst.mockReset().mockResolvedValue(null);
    db.select.mockReset().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    db.update.mockReset().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
  }

  reset();

  return {
    db,
    reset,
  };
});

vi.mock('@namefi-astra/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@namefi-astra/db')>();
  return {
    ...actual,
    db: mockDb.db,
  };
});

vi.mock('#lib/auth', () => ({
  requireUserAuth: mockAuth.requireUserAuth,
}));

vi.mock('#lib/login-notification', () => ({
  triggerLoginNotification: mockLoginNotification.triggerLoginNotification,
}));

vi.mock('hono/cookie', () => ({
  deleteCookie: mockCookie.deleteCookie,
  getCookie: mockCookie.getCookie,
  setCookie: mockCookie.setCookie,
}));

vi.mock('../../../temporal/activities/default', () => ({
  sendHttpAlert: vi.fn(),
}));

vi.mock('#lib/env', () => ({
  config: {
    ALLOW_LOGIN_NOTIFICATIONS: true,
    ALLOWED_CHAINS: mockAllowedChains,
    EMAIL_ADDRESS_TO_OWNED_HOSTNAMES_MAP: {},
  },
  secrets: {
    ALCHEMY_API_KEY: 'test-alchemy-key',
    STRIPE_SECRET_KEY: 'sk_test',
  },
}));

import type { HonoRequest } from 'hono';
import type { RequestHeader } from 'hono/utils/headers';
import { type Address, type BlockTag, zeroAddress } from 'viem';
import {
  AUTH_BOOTSTRAP_MODE_COOKIE,
  AUTH_BOOTSTRAP_MODE_HEADER,
} from '@namefi-astra/common/auth-session';
import { Permission } from '@namefi-astra/utils';
import testEnvConfig from '../../../lib/env/configs/test'; // Import the test config file directly
import {
  getQualifyingDomainNameFromUserIdentifier,
  viemEthereumPublicClient,
} from '../../../lib/user-promo';
import type { TrpcContext } from '../../base';
import { privyClient } from '../../utils';
import * as ensModule from '#lib/crypto/ens';

const { config: actualAppConfig } = await import('#lib/env');
const { usersRouter } = await import('../usersRouter');

type LocalTrpcContextWithReq = Omit<
  TrpcContext,
  'db' | 'res' | 'sessionId' | 'honoVars'
>;

type LocalTrpcContext = Omit<LocalTrpcContextWithReq, 'req'>;

beforeEach(() => {
  mockDb.reset();
  mockCookie.deleteCookie.mockReset();
  mockCookie.getCookie.mockReset().mockResolvedValue(undefined);
  mockCookie.setCookie.mockReset();
});

describe('getUser', () => {
  const authenticatedUser = {
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    id: 'test-user-id',
    primaryEmail: null,
    stripeCustomerId: null,
    privyUserId: 'did:privy:test-user',
    subscribeToEmails: true,
    lastSignInAt: null,
    lastAccessedSessionAt: null,
    preferences: { defaultAutoEns: true, defaultAutoRenew: true },
  };

  function authUserResponse(
    user: Pick<
      typeof authenticatedUser,
      | 'createdAt'
      | 'updatedAt'
      | 'id'
      | 'stripeCustomerId'
      | 'privyUserId'
      | 'subscribeToEmails'
      | 'lastSignInAt'
      | 'lastAccessedSessionAt'
      | 'preferences'
    >,
  ) {
    return {
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      id: user.id,
      stripeCustomerId: user.stripeCustomerId,
      privyUserId: user.privyUserId,
      subscribeToEmails: user.subscribeToEmails,
      lastSignInAt: user.lastSignInAt,
      lastAccessedSessionAt: user.lastAccessedSessionAt,
      preferences: user.preferences,
    };
  }

  function createAuthenticatedRequestContext(
    options:
      | string
      | {
          bootstrapMode?: string;
          includeAuthorization?: boolean;
          cookieToken?: string;
          impersonateUserId?: string;
        } = {},
  ) {
    const {
      bootstrapMode,
      includeAuthorization = true,
      cookieToken,
      impersonateUserId,
    } = typeof options === 'string' ? { bootstrapMode: options } : options;
    if (cookieToken || impersonateUserId) {
      mockCookie.getCookie.mockImplementation(async (_ctx, name) =>
        name === 'privy-token'
          ? cookieToken
          : name === 'impersonate-user-id'
            ? impersonateUserId
            : undefined,
      );
    }
    const header = vi.fn((name?: RequestHeader | string) => {
      if (!name) return {};
      if (name === 'Authorization' && includeAuthorization) {
        return 'Bearer test-token';
      }
      if (name === AUTH_BOOTSTRAP_MODE_HEADER) return bootstrapMode;
      return undefined;
    }) as unknown as HonoRequest['header'];

    return {
      poweredByNamefiDomain: null,
      req: {
        header,
      },
      honoCtx: cookieToken || impersonateUserId ? ({} as never) : undefined,
      testUser: null,
    } as unknown as TrpcContext;
  }

  function mockSelectRows({
    permissions = [],
    adminPanelPermissionCount = 0,
  }: {
    permissions?: Permission[];
    adminPanelPermissionCount?: number;
  }) {
    mockDb.db.select.mockImplementation((fields?: Record<string, unknown>) => {
      const isPermissionsQuery = fields && 'permission' in fields;
      const isCountQuery = fields && 'count' in fields;
      const where = vi
        .fn()
        .mockResolvedValue(
          isPermissionsQuery
            ? permissions.map((permission) => ({ permission }))
            : isCountQuery
              ? [{ count: adminPanelPermissionCount }]
              : [],
        );
      const from = vi.fn().mockReturnValue({ where });
      return { from };
    });
  }

  beforeEach(() => {
    mockAuth.requireUserAuth.mockResolvedValue({
      user: authenticatedUser,
      sessionId: 'test-session-id',
      isNewUser: false,
      tokenIssuedAt: new Date(),
    });
    vi.spyOn(privyClient, 'getUserById').mockResolvedValue({
      id: authenticatedUser.privyUserId,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      isGuest: false,
      customMetadata: {},
      linkedAccounts: [],
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the already resolved authenticated context user without a duplicate DB lookup', async () => {
    const caller = usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: authenticatedUser,
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result = await caller.getUser();

    expect(result).toEqual(authUserResponse(authenticatedUser));
    expect(mockDb.db.query.usersTable.findFirst).not.toHaveBeenCalled();
  });

  it('does not fetch live Privy profile data for normal getUser requests', async () => {
    const userMissingPrimaryEmail = {
      ...authenticatedUser,
      primaryEmail: null,
    };
    mockAuth.requireUserAuth.mockResolvedValue({
      user: userMissingPrimaryEmail,
      sessionId: 'test-session-id',
      isNewUser: false,
      tokenIssuedAt: new Date(),
    });
    const privyUserSpy = vi.spyOn(privyClient, 'getUserById');

    const caller = usersRouter.createCaller(
      createAuthenticatedRequestContext(),
      {},
    );

    const result = await caller.getUser();

    expect(result).toEqual(authUserResponse(userMissingPrimaryEmail));
    expect(privyUserSpy).not.toHaveBeenCalled();
    expect(mockDb.db.update).not.toHaveBeenCalled();
  });

  it('does not attach display profile or write deprecated email without identity-token display data', async () => {
    const userMissingPrimaryEmail = {
      ...authenticatedUser,
      primaryEmail: null,
    };
    mockAuth.requireUserAuth.mockResolvedValue({
      user: userMissingPrimaryEmail,
      sessionId: 'test-session-id',
      isNewUser: false,
      tokenIssuedAt: new Date(),
    });
    const privyUserSpy = vi
      .spyOn(privyClient, 'getUserById')
      .mockResolvedValue({} as never);

    const caller = usersRouter.createCaller(
      createAuthenticatedRequestContext(),
      {},
    );

    const result = await caller.getUser();

    expect(result).toEqual(authUserResponse(userMissingPrimaryEmail));
    expect(privyUserSpy).not.toHaveBeenCalled();
    expect(mockDb.db.select).toHaveBeenCalled();
    expect(mockDb.db.update).not.toHaveBeenCalled();
  });

  it('attaches opt-in identity-token display data without fetching Privy by id', async () => {
    const userMissingPrimaryEmail = {
      ...authenticatedUser,
      primaryEmail: null,
    };
    mockAuth.requireUserAuth.mockResolvedValue({
      user: userMissingPrimaryEmail,
      sessionId: 'test-session-id',
      isNewUser: false,
      tokenIssuedAt: new Date(),
    });
    const getIdentityDisplayProfile = vi.fn(async () => ({
      displayName: 'Fresh User',
      email: 'fresh@example.com',
      walletAddress: '0xfresh',
    }));
    const privyUserSpy = vi
      .spyOn(privyClient, 'getUserById')
      .mockResolvedValue({} as never);

    const caller = usersRouter.createCaller(
      {
        ...createAuthenticatedRequestContext(),
        getIdentityDisplayProfile,
      },
      {},
    );

    const result = await caller.getUser();

    expect(result).toEqual({
      ...authUserResponse(userMissingPrimaryEmail),
      displayProfile: {
        displayName: 'Fresh User',
        email: 'fresh@example.com',
        walletAddress: '0xfresh',
      },
    });
    expect(getIdentityDisplayProfile).toHaveBeenCalledWith(
      userMissingPrimaryEmail.privyUserId,
    );
    expect(privyUserSpy).not.toHaveBeenCalled();
    expect(mockDb.db.update).not.toHaveBeenCalled();
  });

  it('does not let a bootstrap header suppress login-history signals for bearer-authenticated requests', async () => {
    const caller = usersRouter.createCaller(
      createAuthenticatedRequestContext(AUTH_BOOTSTRAP_MODE_COOKIE),
      {},
    );

    await caller.getUser();

    expect(mockAuth.requireUserAuth).toHaveBeenCalledOnce();
    expect(
      mockLoginNotification.triggerLoginNotification,
    ).toHaveBeenCalledOnce();
  });

  it('keeps login-history signal recording for enriched authenticated requests', async () => {
    const caller = usersRouter.createCaller(
      createAuthenticatedRequestContext(),
      {},
    );

    await caller.getUser();

    expect(mockAuth.requireUserAuth).toHaveBeenCalledOnce();
    expect(
      mockLoginNotification.triggerLoginNotification,
    ).toHaveBeenCalledOnce();
  });

  it('returns a cookie-bootstrap session snapshot with permissions without fetching Privy', async () => {
    const userWithoutPrimaryEmail = {
      ...authenticatedUser,
      primaryEmail: null,
    };
    mockAuth.requireUserAuth.mockResolvedValue({
      user: userWithoutPrimaryEmail,
      sessionId: 'test-session-id',
      isNewUser: false,
      tokenIssuedAt: new Date(),
    });
    mockSelectRows({
      permissions: [Permission.READ_USERS],
    });
    const privyUserSpy = vi
      .spyOn(privyClient, 'getUserById')
      .mockResolvedValue({} as never);

    const caller = usersRouter.createCaller(
      createAuthenticatedRequestContext({
        includeAuthorization: false,
        cookieToken: 'cookie-token',
      }),
      {},
    );

    const result = await caller.getSessionSnapshot();

    expect(result).toEqual({
      user: authUserResponse(userWithoutPrimaryEmail),
      permissions: [Permission.READ_USERS],
      impersonationStatus: {
        impersonating: false,
        actorUserId: userWithoutPrimaryEmail.id,
        targetUserId: null,
        actor: null,
        target: null,
        targetPrivyUser: null,
        effectiveUser: authUserResponse(userWithoutPrimaryEmail),
      },
    });
    expect(mockAuth.requireUserAuth).toHaveBeenCalledWith(
      'Bearer cookie-token',
      null,
    );
    expect(privyUserSpy).not.toHaveBeenCalled();
    expect(mockDb.db.update).not.toHaveBeenCalled();
    expect(
      mockLoginNotification.triggerLoginNotification,
    ).not.toHaveBeenCalled();
  });

  it('returns a bearer-authenticated session snapshot with login-history signals', async () => {
    mockSelectRows({
      permissions: [Permission.READ_USERS],
    });

    const caller = usersRouter.createCaller(
      createAuthenticatedRequestContext(),
      {},
    );

    const result = await caller.getSessionSnapshot();

    expect(result).toEqual({
      user: authUserResponse(authenticatedUser),
      permissions: [Permission.READ_USERS],
      impersonationStatus: {
        impersonating: false,
        actorUserId: authenticatedUser.id,
        targetUserId: null,
        actor: null,
        target: null,
        targetPrivyUser: null,
        effectiveUser: authUserResponse(authenticatedUser),
      },
    });
    expect(mockAuth.requireUserAuth).toHaveBeenCalledWith(
      'Bearer test-token',
      null,
    );
    expect(
      mockLoginNotification.triggerLoginNotification,
    ).toHaveBeenCalledOnce();
  });

  it('returns impersonation details in the session snapshot', async () => {
    const targetUser = {
      ...authenticatedUser,
      id: 'target-user-id',
      privyUserId: 'did:privy:target-user',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };
    mockSelectRows({
      permissions: [Permission.IMPERSONATE_USERS, Permission.READ_USERS],
      adminPanelPermissionCount: 0,
    });
    mockDb.db.query.usersTable.findFirst
      .mockResolvedValueOnce(targetUser)
      .mockResolvedValueOnce(targetUser)
      .mockResolvedValueOnce(authenticatedUser)
      .mockResolvedValueOnce(targetUser);
    vi.spyOn(privyClient, 'getUserById').mockImplementation(
      async (privyUserId: string) => {
        const email =
          privyUserId === targetUser.privyUserId
            ? 'target@example.com'
            : 'actor@example.com';
        return {
          id: privyUserId,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          isGuest: false,
          customMetadata: {},
          linkedAccounts: [
            {
              type: 'email',
              address: email,
              latestVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
            },
          ],
        } as never;
      },
    );

    const caller = usersRouter.createCaller(
      createAuthenticatedRequestContext({
        cookieToken: 'cookie-token',
        includeAuthorization: false,
        impersonateUserId: targetUser.id,
      }),
      {},
    );

    const result = await caller.getSessionSnapshot();

    expect(result.user).toEqual(authUserResponse(targetUser));
    expect(result.permissions).toEqual([
      Permission.IMPERSONATE_USERS,
      Permission.READ_USERS,
    ]);
    expect(result.impersonationStatus).toMatchObject({
      impersonating: true,
      actorUserId: authenticatedUser.id,
      targetUserId: targetUser.id,
      actor: {
        id: authenticatedUser.id,
        privyUserId: authenticatedUser.privyUserId,
        email: 'actor@example.com',
      },
      target: {
        id: targetUser.id,
        privyUserId: targetUser.privyUserId,
        email: 'target@example.com',
      },
      targetPrivyUser: {
        id: targetUser.privyUserId,
      },
      effectiveUser: authUserResponse(targetUser),
    });
  });

  it('keeps login-history signal recording for cookie-authenticated protected reads', async () => {
    const caller = usersRouter.createCaller(
      createAuthenticatedRequestContext({
        includeAuthorization: false,
        cookieToken: 'cookie-token',
      }),
      {},
    );

    await expect(caller.getUser()).resolves.toEqual(
      authUserResponse(authenticatedUser),
    );
    expect(mockAuth.requireUserAuth).toHaveBeenCalledWith(
      'Bearer cookie-token',
      null,
    );
    expect(
      mockLoginNotification.triggerLoginNotification,
    ).toHaveBeenCalledOnce();
  });
});

describe('getUserQualifiesForDomainNamePromo', () => {
  // TODO(Luis): consider refactoring mocking

  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Provide a default mock implementation for privyClient.getUserById
    // It should return a PrivyUser with different linked accounts
    vi.spyOn(privyClient, 'getUserById').mockImplementation(
      async (privyUserId: string) => {
        const basePrivyUser = {
          isGuest: false,
          createdAt: new Date(),
          linkedAccounts: [],
          customMetadata: {},
        };

        switch (privyUserId) {
          case 'testUserWithQualifyingEmail':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              email: {
                address: '0xnetizen1@d3serve.xyz',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
            });

          case 'testUserWithQualifyingTwitterHandle':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              twitter: {
                name: 'testUserWithQualifyingTwitterHandle',
                username: '0xnetizen1',
                subject: 'subject',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
            });

          case 'testUserWithQualifyingTwitterName':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              twitter: {
                name: '0xnetizen1',
                username: 'testUserWithQualifyingTwitterName',
                subject: 'subject',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
            });

          case 'testUserWithQualifyingGithubEmail':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              github: {
                email: '0xnetizen1@d3serve.xyz',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
            });

          case 'testUserWithQualifyingGithubUsername':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              github: {
                name: 'testUserWithQualifyingGithubUsername',
                username: '0xnetizen1',
                subject: 'subject',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
            });

          case 'testUserWithQualifyingGithubName':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              github: {
                name: '0xnetizen1',
                username: 'testUserWithQualifyingGithubName',
                subject: 'subject',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
            });

          case 'testUserWithQualifyingEns':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              linkedAccounts: [
                {
                  type: 'wallet',
                  address: zeroAddress,
                  chainType: 'ethereum',
                  firstVerifiedAt: new Date(),
                  verifiedAt: new Date(),
                  latestVerifiedAt: new Date(),
                },
              ],
            });

          case 'testUserWithoutQualifyingAccount':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              email: {
                address: '0xnetizen.1@d3serve.xyz',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
              github: {
                name: 'testUserWithoutQualifyingAccount',
                username: 'testUserWithQualifyingGithubName',
                email: 'testUserWithoutQualifyingAccount@d3serve.xyz',
                subject: 'subject',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
              twitter: {
                name: 'testUserWithoutQualifyingAccount',
                username: 'netizen1',
                subject: 'subject',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
              linkedAccounts: [
                {
                  type: 'wallet',
                  address: '0x0000000000000000000000000000000000000001',
                  chainType: 'ethereum',
                  firstVerifiedAt: new Date(),
                  verifiedAt: new Date(),
                  latestVerifiedAt: new Date(),
                },
                {
                  type: 'wallet',
                  address: '0x0000000000000000000000000000000000000002',
                  chainType: 'ethereum',
                  firstVerifiedAt: new Date(),
                  verifiedAt: new Date(),
                  latestVerifiedAt: new Date(),
                },
                {
                  type: 'wallet',
                  address: '0x0000000000000000000000000000000000000003',
                  chainType: 'ethereum',
                  firstVerifiedAt: new Date(),
                  verifiedAt: new Date(),
                  latestVerifiedAt: new Date(),
                },
                {
                  type: 'wallet',
                  address: '0x0000000000000000000000000000000000000004',
                  chainType: 'ethereum',
                  firstVerifiedAt: new Date(),
                  verifiedAt: new Date(),
                  latestVerifiedAt: new Date(),
                },
              ],
            });

          case 'testUserWithNoLinkedAccounts': // fallthrough
          default:
            return await Promise.resolve({
              ...basePrivyUser,
              id: 'testUserWithNoLinkedAccounts',
            });
        }
      },
    );

    vi.spyOn(viemEthereumPublicClient, 'getEnsName').mockImplementation(
      async (args: {
        blockNumber?: bigint | undefined | undefined;
        blockTag?: BlockTag | undefined;
        address: Address;
        gatewayUrls?: string[] | undefined | undefined;
        strict?: boolean | undefined | undefined;
        universalResolverAddress?: `0x${string}` | undefined;
      }) => {
        switch (args.address) {
          // qualifies
          case zeroAddress:
            return await Promise.resolve('0xnetizen1.eth');
          // doesn't qualify (doesn't start with 0x)
          case '0x0000000000000000000000000000000000000001':
            return await Promise.resolve('netizen1.eth');
          // doesn't qualify (doesn't match subdomain)
          case '0x0000000000000000000000000000000000000002':
            return await Promise.resolve('0xnetizen2.eth');
          // doesn't resolve ens lookup
          case '0x0000000000000000000000000000000000000003':
            return await Promise.reject();
          default:
            return await Promise.resolve(null);
        }
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseTestUser = {
    primaryEmail: null,
    stripeCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    subscribeToEmails: true,
    lastSignInAt: null,
    lastAccessedSessionAt: null,
    preferences: { defaultAutoEns: true, defaultAutoRenew: true },
  };
  const testNormalizedDomainName = 'netizen1.0x.city';

  it('should return true for testUserWithQualifyingEmail', async () => {
    // Create a caller for the router with testUserWithQualifyingEmail
    const callerWithUserWithQualifyingEmail1 = usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingEmail',
          privyUserId: 'testUserWithQualifyingEmail',
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithQualifyingEmail1.getUserQualifiesForDomainNamePromo(
        {
          normalizedDomainName: testNormalizedDomainName,
        },
      );

    // Assert: Check the structure of the response
    expect(result).toBe(true);
  });

  it('should return true for testUserWithQualifyingTwitterHandle', async () => {
    // Create a caller for the router with testUserWithQualifyingTwitterHandle
    const callerWithUserWithQualifyingTwitterHandle = usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingTwitterHandle',
          privyUserId: 'testUserWithQualifyingTwitterHandle',
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithQualifyingTwitterHandle.getUserQualifiesForDomainNamePromo(
        {
          normalizedDomainName: testNormalizedDomainName,
        },
      );

    // Assert: Check the structure of the response
    expect(result).toBe(true);
  });

  it('should return true for testUserWithQualifyingTwitterName', async () => {
    // Create a caller for the router with testUserWithQualifyingTwitterName
    const callerWithUserWithQualifyingTwitterName = usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingTwitterName',
          privyUserId: 'testUserWithQualifyingTwitterName',
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithQualifyingTwitterName.getUserQualifiesForDomainNamePromo(
        {
          normalizedDomainName: testNormalizedDomainName,
        },
      );

    // Assert: Check the structure of the response
    expect(result).toBe(true);
  });

  it('should return true for testUserWithQualifyingGithubEmail', async () => {
    // Create a caller for the router with testUserWithQualifyingGithubEmail
    const callerWithUserWithQualifyingGithubEmail = usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingGithubEmail',
          privyUserId: 'testUserWithQualifyingGithubEmail',
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithQualifyingGithubEmail.getUserQualifiesForDomainNamePromo(
        {
          normalizedDomainName: testNormalizedDomainName,
        },
      );

    // Assert: Check the structure of the response
    expect(result).toBe(true);
  });

  it('should return true for testUserWithQualifyingGithubUsername', async () => {
    // Create a caller for the router with testUserWithQualifyingGithubUsername
    const callerWithUserWithQualifyingGithubUsername = usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingGithubUsername',
          privyUserId: 'testUserWithQualifyingGithubUsername',
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithQualifyingGithubUsername.getUserQualifiesForDomainNamePromo(
        {
          normalizedDomainName: testNormalizedDomainName,
        },
      );

    // Assert: Check the structure of the response
    expect(result).toBe(true);
  });

  it('should return true for testUserWithQualifyingGithubName', async () => {
    // Create a caller for the router with testUserWithQualifyingGithubName
    const callerWithUserWithQualifyingGithubName = usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingGithubName',
          privyUserId: 'testUserWithQualifyingGithubName',
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithQualifyingGithubName.getUserQualifiesForDomainNamePromo(
        {
          normalizedDomainName: testNormalizedDomainName,
        },
      );

    // Assert: Check the structure of the response
    expect(result).toBe(true);
  });

  it('should return true for testUserWithQualifyingEns', async () => {
    // Create a caller for the router with testUserWithQualifyingEns
    const callerWithUserWithQualifyingEns = usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingEns',
          privyUserId: 'testUserWithQualifyingEns',
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithQualifyingEns.getUserQualifiesForDomainNamePromo({
        normalizedDomainName: testNormalizedDomainName,
      });

    // Assert: Check the structure of the response
    expect(result).toBe(true);
  });

  it('should return false for testUserWithoutQualifyingAccount', async () => {
    // Create a caller for the router with testUserWithoutQualifyingAccount
    const callerWithUserWithoutQualifyingAccount = usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithoutQualifyingAccount',
          privyUserId: 'testUserWithoutQualifyingAccount',
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithoutQualifyingAccount.getUserQualifiesForDomainNamePromo(
        {
          normalizedDomainName: testNormalizedDomainName,
        },
      );

    // Assert: Check the structure of the response
    expect(result).toBe(false);
  });

  it('should return false for testUserWithNoLinkedAccounts', async () => {
    // Create a caller for the router with testUserWithNoLinkedAccounts
    const callerWithUserWithNoLinkedAccounts = usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithNoLinkedAccounts',
          privyUserId: 'testUserWithNoLinkedAccounts',
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithNoLinkedAccounts.getUserQualifiesForDomainNamePromo(
        {
          normalizedDomainName: testNormalizedDomainName,
        },
      );

    // Assert: Check the structure of the response
    expect(result).toBe(false);
  });
});

describe('getManagerPageEntrypointViewable', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Directly set the problematic config part for these tests
    // This ensures the test config is used, bypassing potential loading issues.
    actualAppConfig.EMAIL_ADDRESS_TO_OWNED_HOSTNAMES_MAP =
      testEnvConfig.EMAIL_ADDRESS_TO_OWNED_HOSTNAMES_MAP ?? {};

    // Provide a default mock implementation for privyClient.getUserById
    // It should return a PrivyUser with different linked accounts
    vi.spyOn(privyClient, 'getUserById').mockImplementation(
      async (privyUserId: string) => {
        switch (privyUserId) {
          case 'testUser0xCityOwner':
            return await Promise.resolve({
              id: privyUserId,
              isGuest: false,
              createdAt: new Date(),
              linkedAccounts: [],
              email: {
                address: 'test-0x-city-owner@d3serve.xyz',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
              customMetadata: {},
            });

          case 'testUserNonParentDomainOwner':
            return await Promise.resolve({
              id: 'testUserNonParentDomainOwner',
              isGuest: false,
              createdAt: new Date(),
              linkedAccounts: [],
              email: {
                address: 'testUser@d3serve.xyz',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
              customMetadata: {},
            });

          case 'testUserNoEmailAddress':
            return await Promise.resolve({
              id: 'testUserNonParentDomainOwner',
              isGuest: false,
              createdAt: new Date(),
              linkedAccounts: [],
              email: undefined,
              customMetadata: {},
            });

          default:
            throw new Error('Could not find privyUser');
        }
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const testUser0xCityOwner = {
    id: 'testUser0xCityOwner',
    primaryEmail: 'test-0x-city-owner@d3serve.xyz',
    stripeCustomerId: null,
    privyUserId: 'testUser0xCityOwner',
    createdAt: new Date(),
    updatedAt: new Date(),
    subscribeToEmails: true,
    lastSignInAt: null,
    lastAccessedSessionAt: null,
    preferences: { defaultAutoEns: true, defaultAutoRenew: true },
  };

  it('should return false for null user', async () => {
    const callerWithNullUser = usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: null,
        // Mock empty request headers to get a null user in the ctx
        req: {
          header: ((name?: RequestHeader | string) => {
            if (typeof name === 'undefined') {
              return {};
            }
            return null;
          }) as {
            (name: RequestHeader): string | undefined;
            (name: string): string | undefined;
            (): Record<string, string>;
          },
        } satisfies Pick<HonoRequest, 'header'> as unknown as HonoRequest,
      } satisfies LocalTrpcContextWithReq as TrpcContext,
      {},
    );

    const result = await callerWithNullUser.getManagerPageEntrypointViewable();

    // Assert: Check the structure of the response
    expect(result.viewable).toBe(false);
  });

  it('should return false for user with no email address', async () => {
    const callerWithNoEmailAddress = usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: {
          id: 'testUserNoEmailAddress',
          primaryEmail: null,
          stripeCustomerId: null,
          privyUserId: 'testUserNonParentDomainOwner',
          createdAt: new Date(),
          updatedAt: new Date(),
          subscribeToEmails: true,
          lastSignInAt: null,
          lastAccessedSessionAt: null,
          preferences: { defaultAutoEns: true, defaultAutoRenew: true },
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithNoEmailAddress.getManagerPageEntrypointViewable();

    // Assert: Check the structure of the response
    expect(result.viewable).toBe(false);
  });

  it('should return false when getting Privy user throws error', async () => {
    const callerWithGetPrivyUserError = usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: {
          id: 'testUserGetPrivyUserThrowsError',
          primaryEmail: null,
          stripeCustomerId: null,
          privyUserId: 'testUserGetPrivyUserThrowsError',
          createdAt: new Date(),
          updatedAt: new Date(),
          subscribeToEmails: true,
          lastSignInAt: null,
          lastAccessedSessionAt: null,
          preferences: { defaultAutoEns: true, defaultAutoRenew: true },
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithGetPrivyUserError.getManagerPageEntrypointViewable();

    // Assert: Check the structure of the response
    expect(result.viewable).toBe(false);
  });

  it('should return false for non-parent-domain-owner', async () => {
    const callerWithNonParentDomainOwner = usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: {
          id: 'testUserNonParentDomainOwner',
          primaryEmail: 'testUser@d3serve.xyz',
          stripeCustomerId: null,
          privyUserId: 'testUserNonParentDomainOwner',
          createdAt: new Date(),
          updatedAt: new Date(),
          subscribeToEmails: true,
          lastSignInAt: null,
          lastAccessedSessionAt: null,
          preferences: { defaultAutoEns: true, defaultAutoRenew: true },
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithNonParentDomainOwner.getManagerPageEntrypointViewable();

    // Assert: Check the structure of the response
    expect(result.viewable).toBe(false);
  });

  it('should return false for 0x.city owner from defi.build origin', async () => {
    const callerWith0xCityOwnerUserFromDefiBuildOrigin =
      usersRouter.createCaller(
        {
          poweredByNamefiDomain: 'defi.build',
          testUser: testUser0xCityOwner,
        } satisfies LocalTrpcContext as TrpcContext,
        {},
      );

    const result =
      await callerWith0xCityOwnerUserFromDefiBuildOrigin.getManagerPageEntrypointViewable();

    // Assert: Check the structure of the response
    expect(result.viewable).toBe(false);
  });

  it('should return true for 0x.city owner from 0x.city origin', async () => {
    const callerWith0xCityOwnerUserFrom0xCityOrigin = usersRouter.createCaller(
      {
        poweredByNamefiDomain: '0x.city',
        testUser: testUser0xCityOwner,
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWith0xCityOwnerUserFrom0xCityOrigin.getManagerPageEntrypointViewable();

    // Assert: Check the structure of the response
    expect(result.viewable).toBe(true);
  });

  it('should return true for 0x.city owner with no third party origin', async () => {
    const callerWith0xCityOwnerUserNoThirdPartyOrigin =
      usersRouter.createCaller(
        {
          poweredByNamefiDomain: null,
          testUser: testUser0xCityOwner,
        } satisfies LocalTrpcContext as TrpcContext,
        {},
      );

    const result =
      await callerWith0xCityOwnerUserNoThirdPartyOrigin.getManagerPageEntrypointViewable();

    // Assert: Check the structure of the response
    expect(result.viewable).toBe(true);
  });
});

describe('getQualifyingDomainNameFromUserIdentifier', () => {
  it('should return null for null identifier', async () => {
    const result = await getQualifyingDomainNameFromUserIdentifier(null);
    expect(result).toBe(null);
  });

  it('should return null for undefined identifier', async () => {
    const result = await getQualifyingDomainNameFromUserIdentifier(undefined);
    expect(result).toBe(null);
  });

  it('should return null for identifier that does not start with 0x', async () => {
    const result =
      await getQualifyingDomainNameFromUserIdentifier('1xidentifier');
    expect(result).toBe(null);
  });

  it('should return a qualifying domain name for identifier that starts with 0x', async () => {
    const result =
      await getQualifyingDomainNameFromUserIdentifier('0xidentifier');
    expect(result).toBe('identifier.0x.city');
  });
});

describe('getUserQualifyingDomainNamesForPromo', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Provide a default mock implementation for privyClient.getUserById
    // It should return a PrivyUser with different linked accounts
    vi.spyOn(privyClient, 'getUserById').mockImplementation(
      async (privyUserId: string) => {
        const basePrivyUser = {
          isGuest: false,
          createdAt: new Date(),
          linkedAccounts: [],
          customMetadata: {},
        };

        switch (privyUserId) {
          case 'testUserWithQualifyingEmail':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              email: {
                address: '0xnetizen1@d3serve.xyz',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
            });

          case 'testUserWithQualifyingTwitterHandle':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              twitter: {
                name: 'testUserWithQualifyingTwitterHandle',
                username: '0xnetizen1',
                subject: 'subject',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
            });

          case 'testUserWithQualifyingTwitterName':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              twitter: {
                name: '0xnetizen1',
                username: 'testUserWithQualifyingTwitterName',
                subject: 'subject',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
            });

          case 'testUserWithQualifyingGithubEmail':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              github: {
                email: '0xnetizen1@d3serve.xyz',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
            });

          case 'testUserWithQualifyingGithubUsername':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              github: {
                name: 'testUserWithQualifyingGithubUsername',
                username: '0xnetizen1',
                subject: 'subject',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
            });

          case 'testUserWithQualifyingGithubName':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              github: {
                name: '0xnetizen1',
                username: 'testUserWithQualifyingGithubName',
                subject: 'subject',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
            });

          case 'testUserWithQualifyingEns':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              linkedAccounts: [
                {
                  type: 'wallet',
                  address: zeroAddress,
                  chainType: 'ethereum',
                  firstVerifiedAt: new Date(),
                  verifiedAt: new Date(),
                  latestVerifiedAt: new Date(),
                },
              ],
            });

          case 'testUserWithSolanaWalletOnly':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              linkedAccounts: [
                {
                  type: 'wallet',
                  address: zeroAddress,
                  chainType: 'solana',
                  firstVerifiedAt: new Date(),
                  verifiedAt: new Date(),
                  latestVerifiedAt: new Date(),
                },
              ],
            });

          case 'testUserWithMultipleQualifyingAccounts':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              email: {
                address: '0xnetizen1@d3serve.xyz',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
              twitter: {
                name: 'testUserWithMultipleQualifyingAccounts',
                username: '0xnetizen2',
                subject: 'subject',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
              github: {
                name: '0xnetizen1',
                email: '0xnetizen1@d3serve.xyz',
                username: 'testUserWithQualifyingGithubName',
                subject: 'subject',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
              linkedAccounts: [
                {
                  type: 'wallet',
                  address: zeroAddress,
                  chainType: 'ethereum',
                  firstVerifiedAt: new Date(),
                  verifiedAt: new Date(),
                  latestVerifiedAt: new Date(),
                },
              ],
            });

          case 'testUserWithoutQualifyingAccount':
            return await Promise.resolve({
              ...basePrivyUser,
              id: privyUserId,
              email: {
                address: '1xnetizen.1@d3serve.xyz',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
              github: {
                name: 'testUserWithoutQualifyingAccount',
                username: 'testUserWithQualifyingGithubName',
                email: 'testUserWithoutQualifyingAccount@d3serve.xyz',
                subject: 'subject',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
              twitter: {
                name: 'testUserWithoutQualifyingAccount',
                username: 'netizen1',
                subject: 'subject',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
              linkedAccounts: [
                {
                  type: 'wallet',
                  address: '0x0000000000000000000000000000000000000001',
                  chainType: 'ethereum',
                  firstVerifiedAt: new Date(),
                  verifiedAt: new Date(),
                  latestVerifiedAt: new Date(),
                },
                {
                  type: 'wallet',
                  address: '0x0000000000000000000000000000000000000002',
                  chainType: 'ethereum',
                  firstVerifiedAt: new Date(),
                  verifiedAt: new Date(),
                  latestVerifiedAt: new Date(),
                },
                {
                  type: 'wallet',
                  address: '0x0000000000000000000000000000000000000003',
                  chainType: 'ethereum',
                  firstVerifiedAt: new Date(),
                  verifiedAt: new Date(),
                  latestVerifiedAt: new Date(),
                },
                {
                  type: 'wallet',
                  address: '0x0000000000000000000000000000000000000004',
                  chainType: 'ethereum',
                  firstVerifiedAt: new Date(),
                  verifiedAt: new Date(),
                  latestVerifiedAt: new Date(),
                },
              ],
            });

          case 'testUserWithNoLinkedAccounts': // fallthrough
          default:
            return await Promise.resolve({
              ...basePrivyUser,
              id: 'testUserWithNoLinkedAccounts',
            });
        }
      },
    );

    vi.spyOn(viemEthereumPublicClient, 'getEnsName').mockImplementation(
      async (args: {
        blockNumber?: bigint | undefined | undefined;
        blockTag?: BlockTag | undefined;
        address: Address;
        gatewayUrls?: string[] | undefined | undefined;
        strict?: boolean | undefined | undefined;
        universalResolverAddress?: `0x${string}` | undefined;
      }) => {
        switch (args.address) {
          // qualifies
          case zeroAddress:
            return await Promise.resolve('0xnetizen1.eth');
          // doesn't qualify (doesn't start with 0x)
          case '0x0000000000000000000000000000000000000001':
            return await Promise.resolve('netizen1.eth');
          // doesn't qualify (doesn't start with 0x)
          case '0x0000000000000000000000000000000000000002':
            return await Promise.resolve('1xnetizen2.eth');
          // doesn't resolve ens lookup
          case '0x0000000000000000000000000000000000000003':
            return await Promise.reject();
          default:
            return await Promise.resolve(null);
        }
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseTestUser = {
    primaryEmail: null,
    stripeCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignInAt: null,
    lastAccessedSessionAt: null,
    preferences: { defaultAutoEns: true, defaultAutoRenew: true },
  };

  it('should return qualifying domain name for testUserWithQualifyingEmail', async () => {
    // Create a caller for the router with testUserWithQualifyingEmail
    const callerWithUserWithQualifyingEmail1 = usersRouter.createCaller(
      {
        poweredByNamefiDomain: '0x.city',
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingEmail',
          privyUserId: 'testUserWithQualifyingEmail',
          subscribeToEmails: true,
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithQualifyingEmail1.getUserQualifyingDomainNamesForPromo();
    const expected = [
      { qualifyingDomainName: 'netizen1.0x.city', linkedAccountType: 'email' },
    ];

    // Assert: Check the structure of the response
    expect(result).toEqual(expected);
  });

  it('should return qualifying domain name for testUserWithQualifyingTwitterHandle', async () => {
    // Create a caller for the router with testUserWithQualifyingTwitterHandle
    const callerWithUserWithQualifyingTwitterHandle = usersRouter.createCaller(
      {
        poweredByNamefiDomain: '0x.city',
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingTwitterHandle',
          privyUserId: 'testUserWithQualifyingTwitterHandle',
          subscribeToEmails: true,
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithQualifyingTwitterHandle.getUserQualifyingDomainNamesForPromo();
    const expected = [
      {
        qualifyingDomainName: 'netizen1.0x.city',
        linkedAccountType: 'twitter_oauth',
      },
    ];

    // Assert: Check the structure of the response
    expect(result).toEqual(expected);
  });

  it('should return qualifying domain name for testUserWithQualifyingTwitterName', async () => {
    // Create a caller for the router with testUserWithQualifyingTwitterName
    const callerWithUserWithQualifyingTwitterName = usersRouter.createCaller(
      {
        poweredByNamefiDomain: '0x.city',
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingTwitterName',
          privyUserId: 'testUserWithQualifyingTwitterName',
          subscribeToEmails: true,
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithQualifyingTwitterName.getUserQualifyingDomainNamesForPromo();
    const expected = [
      {
        qualifyingDomainName: 'netizen1.0x.city',
        linkedAccountType: 'twitter_oauth',
      },
    ];

    // Assert: Check the structure of the response
    expect(result).toEqual(expected);
  });

  it('should return qualifying domain name for testUserWithQualifyingGithubEmail', async () => {
    // Create a caller for the router with testUserWithQualifyingGithubEmail
    const callerWithUserWithQualifyingGithubEmail = usersRouter.createCaller(
      {
        poweredByNamefiDomain: '0x.city',
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingGithubEmail',
          privyUserId: 'testUserWithQualifyingGithubEmail',
          subscribeToEmails: true,
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithQualifyingGithubEmail.getUserQualifyingDomainNamesForPromo();
    const expected = [
      {
        qualifyingDomainName: 'netizen1.0x.city',
        linkedAccountType: 'github_oauth',
      },
    ];

    // Assert: Check the structure of the response
    expect(result).toEqual(expected);
  });

  it('should return qualifying domain name for testUserWithQualifyingGithubUsername', async () => {
    // Create a caller for the router with testUserWithQualifyingGithubUsername
    const callerWithUserWithQualifyingGithubUsername = usersRouter.createCaller(
      {
        poweredByNamefiDomain: '0x.city',
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingGithubUsername',
          privyUserId: 'testUserWithQualifyingGithubUsername',
          subscribeToEmails: true,
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithQualifyingGithubUsername.getUserQualifyingDomainNamesForPromo();
    const expected = [
      {
        qualifyingDomainName: 'netizen1.0x.city',
        linkedAccountType: 'github_oauth',
      },
    ];

    // Assert: Check the structure of the response
    expect(result).toEqual(expected);
  });

  it('should return qualifying domain name for testUserWithQualifyingGithubName', async () => {
    // Create a caller for the router with testUserWithQualifyingGithubName
    const callerWithUserWithQualifyingGithubName = usersRouter.createCaller(
      {
        poweredByNamefiDomain: '0x.city',
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingGithubName',
          privyUserId: 'testUserWithQualifyingGithubName',
          subscribeToEmails: true,
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithQualifyingGithubName.getUserQualifyingDomainNamesForPromo();
    const expected = [
      {
        qualifyingDomainName: 'netizen1.0x.city',
        linkedAccountType: 'github_oauth',
      },
    ];

    // Assert: Check the structure of the response
    expect(result).toEqual(expected);
  });

  it('should return qualifying domain name for testUserWithQualifyingEns', async () => {
    // Create a caller for the router with testUserWithQualifyingEns
    const callerWithUserWithQualifyingEns = usersRouter.createCaller(
      {
        poweredByNamefiDomain: '0x.city',
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingEns',
          privyUserId: 'testUserWithQualifyingEns',
          subscribeToEmails: true,
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithQualifyingEns.getUserQualifyingDomainNamesForPromo();
    const expected = [
      {
        qualifyingDomainName: 'netizen1.0x.city',
        linkedAccountType: 'wallet',
      },
    ];

    // Assert: Check the structure of the response
    expect(result).toEqual(expected);
  });

  it('should return multiple qualifying domain names for testUserWithMultipleQualifyingAccounts', async () => {
    // Create a caller for the router with testUserWithQualifyingEns
    const callerWithUserWithMultipleQualifyingAccounts =
      usersRouter.createCaller(
        {
          poweredByNamefiDomain: '0x.city',
          testUser: {
            ...baseTestUser,
            id: 'testUserWithMultipleQualifyingAccounts',
            privyUserId: 'testUserWithMultipleQualifyingAccounts',
            subscribeToEmails: true,
          },
        } satisfies LocalTrpcContext as TrpcContext,
        {},
      );

    const result =
      await callerWithUserWithMultipleQualifyingAccounts.getUserQualifyingDomainNamesForPromo();

    // Assert: Check the structure of the response
    expect(result.length).toBe(2);
    expect(result).toContainEqual({
      qualifyingDomainName: 'netizen1.0x.city',
      linkedAccountType: 'email',
    });
    expect(result).toContainEqual({
      qualifyingDomainName: 'netizen2.0x.city',
      linkedAccountType: 'twitter_oauth',
    });
  });

  it('should return empty list for testUserWithoutQualifyingAccount', async () => {
    // Create a caller for the router with testUserWithoutQualifyingAccount
    const callerWithUserWithoutQualifyingAccount = usersRouter.createCaller(
      {
        poweredByNamefiDomain: '0x.city',
        testUser: {
          ...baseTestUser,
          id: 'testUserWithoutQualifyingAccount',
          privyUserId: 'testUserWithoutQualifyingAccount',
          subscribeToEmails: true,
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithoutQualifyingAccount.getUserQualifyingDomainNamesForPromo();

    // Assert: Check the structure of the response
    expect(result).toEqual([]);
  });

  it('should return empty list for testUserWithNoLinkedAccounts', async () => {
    // Create a caller for the router with testUserWithNoLinkedAccounts
    const callerWithUserWithNoLinkedAccounts = usersRouter.createCaller(
      {
        poweredByNamefiDomain: '0x.city',
        testUser: {
          ...baseTestUser,
          id: 'testUserWithNoLinkedAccounts',
          privyUserId: 'testUserWithNoLinkedAccounts',
          subscribeToEmails: true,
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithNoLinkedAccounts.getUserQualifyingDomainNamesForPromo();

    // Assert: Check the structure of the response
    expect(result).toEqual([]);
  });

  it('should return empty list for testUserWithSolanaWalletOnly', async () => {
    const callerWithUserWithSolanaWalletOnly = usersRouter.createCaller(
      {
        poweredByNamefiDomain: '0x.city',
        testUser: {
          id: 'testUserWithSolanaWalletOnly',
          primaryEmail: null,
          stripeCustomerId: null,
          privyUserId: 'testUserWithSolanaWalletOnly',
          createdAt: new Date(),
          updatedAt: new Date(),
          subscribeToEmails: true,
          lastSignInAt: null,
          lastAccessedSessionAt: null,
          preferences: { defaultAutoEns: true, defaultAutoRenew: true },
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithUserWithSolanaWalletOnly.getUserQualifyingDomainNamesForPromo();

    // Assert: Check the structure of the response
    expect(result).toEqual([]);
  });

  it('should return empty list when getting Privy user throws error', async () => {
    const callerWithGetPrivyUserError = usersRouter.createCaller(
      {
        poweredByNamefiDomain: '0x.city',
        testUser: {
          id: 'testUserGetPrivyUserThrowsError',
          primaryEmail: null,
          stripeCustomerId: null,
          privyUserId: 'testUserGetPrivyUserThrowsError',
          createdAt: new Date(),
          updatedAt: new Date(),
          subscribeToEmails: true,
          lastSignInAt: null,
          lastAccessedSessionAt: null,
          preferences: { defaultAutoEns: true, defaultAutoRenew: true },
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithGetPrivyUserError.getUserQualifyingDomainNamesForPromo();

    // Assert: Check the structure of the response
    expect(result).toEqual([]);
  });

  it('should return empty list when poweredByNamefiDomain is not 0x.city', async () => {
    const callerWithDifferentHostname = usersRouter.createCaller(
      {
        poweredByNamefiDomain: 'different.domain',
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingEmail',
          privyUserId: 'testUserWithQualifyingEmail',
          subscribeToEmails: true,
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithDifferentHostname.getUserQualifyingDomainNamesForPromo();

    // Assert: Check the structure of the response
    expect(result).toEqual([]);
  });

  it('should return empty list when poweredByNamefiDomain is null', async () => {
    const callerWithDifferentHostname = usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingEmail',
          privyUserId: 'testUserWithQualifyingEmail',
          subscribeToEmails: true,
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

    const result =
      await callerWithDifferentHostname.getUserQualifyingDomainNamesForPromo();

    // Assert: Check the structure of the response
    expect(result).toEqual([]);
  });
});

describe('resolveEnsName', () => {
  const baseTestUser = {
    primaryEmail: null,
    stripeCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    subscribeToEmails: true,
    lastSignInAt: null,
    lastAccessedSessionAt: null,
    preferences: { defaultAutoEns: true, defaultAutoRenew: true },
  };

  const createCaller = () =>
    usersRouter.createCaller(
      {
        poweredByNamefiDomain: null,
        testUser: {
          ...baseTestUser,
          id: 'test-user',
          privyUserId: 'privy-user',
        },
      } satisfies LocalTrpcContext as TrpcContext,
      {},
    );

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the resolved address when ENS name resolves successfully', async () => {
    const resolveSpy = vi
      .spyOn(ensModule, 'resolveEnsNameToAddress')
      .mockResolvedValue('0x1234567890abcdef1234567890abcdef12345678');

    const caller = createCaller();

    const result = await caller.resolveEnsName({ ensName: 'Example.eth' });

    expect(resolveSpy).toHaveBeenCalledWith('example.eth');
    expect(result).toEqual({
      ensName: 'Example.eth',
      normalizedEnsName: 'example.eth',
      address: '0x1234567890abcdef1234567890abcdef12345678',
    });
  });

  it('returns null address when ENS name cannot be resolved', async () => {
    const resolveSpy = vi
      .spyOn(ensModule, 'resolveEnsNameToAddress')
      .mockResolvedValue(null);

    const caller = createCaller();

    const result = await caller.resolveEnsName({ ensName: 'missing.eth' });

    expect(resolveSpy).toHaveBeenCalledWith('missing.eth');
    expect(result).toEqual({
      ensName: 'missing.eth',
      normalizedEnsName: 'missing.eth',
      address: null,
    });
  });
});
