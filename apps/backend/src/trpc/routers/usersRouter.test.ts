import { config } from 'dotenv';

import type { HonoRequest } from 'hono';
import type { RequestHeader } from 'hono/utils/headers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrpcContext } from '../base';
import { privyClient } from '../utils';
import { usersRouter } from './usersRouter';

// TODO: consider use vitest setup to do it globally after NamefiRegistry
config({ path: '.env.test' });

describe('Users Router', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Provide a default mock implementation for privyClient.getUserById
    // It should return a PrivyUser with different linked accounts
    vi.spyOn(privyClient, 'getUserById').mockImplementation(
      async (privyUserId: string) => {
        switch (privyUserId) {
          case 'testUserWithQualifyingEmail':
            return await Promise.resolve({
              id: privyUserId,
              isGuest: false,
              createdAt: new Date(),
              linkedAccounts: [],
              email: {
                address: '0xnetizen1@d3serve.xyz',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
              customMetadata: {},
            });

          case 'testUserWithQualifyingTwitter':
            return await Promise.resolve({
              id: privyUserId,
              isGuest: false,
              createdAt: new Date(),
              linkedAccounts: [],
              twitter: {
                name: 'testUserWithQualifyingTwitter',
                username: '0xnetizen1',
                subject: 'subject',
                firstVerifiedAt: new Date(),
                verifiedAt: new Date(),
                latestVerifiedAt: new Date(),
              },
              customMetadata: {},
            });

          case 'testUserWithoutQualifyingAccount':
            return await Promise.resolve({
              id: privyUserId,
              isGuest: false,
              createdAt: new Date(),
              linkedAccounts: [],
              email: {
                address: '0xnetizen.1@d3serve.xyz',
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
              customMetadata: {},
            });

          case 'testUserWithNoLinkedAccounts': // fallthrough
          default:
            return await Promise.resolve({
              id: 'testUserWithNoLinkedAccounts',
              isGuest: false,
              createdAt: new Date(),
              linkedAccounts: [],
              customMetadata: {},
            });
        }
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Create a caller for the router with testUserWithQualifyingEmail
  const callerWithUserWithQualifyingEmail1 = usersRouter.createCaller(
    {
      thirdPartyOriginHostname: null,
      testUser: {
        id: 'testUserWithQualifyingEmail',
        primaryEmail: null,
        stripeCustomerId: null,
        privyUserId: 'testUserWithQualifyingEmail',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } satisfies Omit<TrpcContext, 'user' | 'db' | 'req' | 'res'> as TrpcContext,
    {},
  );

  // Create a caller for the router with testUserWithQualifyingTwitter
  const callerWithUserWithQualifyingTwitter = usersRouter.createCaller(
    {
      thirdPartyOriginHostname: null,
      testUser: {
        id: 'testUserWithQualifyingTwitter',
        primaryEmail: null,
        stripeCustomerId: null,
        privyUserId: 'testUserWithQualifyingTwitter',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } satisfies Omit<TrpcContext, 'user' | 'db' | 'req' | 'res'> as TrpcContext,
    {},
  );

  // Create a caller for the router with testUserWithQualifyingTwitter
  const callerWithUserWithoutQualifyingAccount = usersRouter.createCaller(
    {
      thirdPartyOriginHostname: null,
      testUser: {
        id: 'testUserWithoutQualifyingAccount',
        primaryEmail: null,
        stripeCustomerId: null,
        privyUserId: 'testUserWithoutQualifyingAccount',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } satisfies Omit<TrpcContext, 'user' | 'db' | 'req' | 'res'> as TrpcContext,
    {},
  );

  // Create a caller for the router with testUserWithQualifyingTwitter
  const callerWithUserWithNoLinkedAccounts = usersRouter.createCaller(
    {
      thirdPartyOriginHostname: null,
      testUser: {
        id: 'testUserWithNoLinkedAccounts',
        primaryEmail: null,
        stripeCustomerId: null,
        privyUserId: 'testUserWithNoLinkedAccounts',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } satisfies Omit<TrpcContext, 'user' | 'db' | 'req' | 'res'> as TrpcContext,
    {},
  );

  const testNormalizedDomainName = 'netizen1.0x.city';

  it('should return true for testUserWithQualifyingEmail', async () => {
    const result =
      await callerWithUserWithQualifyingEmail1.getUserQualifiesForDomainNamePromo(
        {
          normalizedDomainName: testNormalizedDomainName,
        },
      );

    // Assert: Check the structure of the response
    expect(result).toBe(true);
  });

  it('should return true for testUserWithQualifyingTwitter', async () => {
    const result =
      await callerWithUserWithQualifyingTwitter.getUserQualifiesForDomainNamePromo(
        {
          normalizedDomainName: testNormalizedDomainName,
        },
      );

    // Assert: Check the structure of the response
    expect(result).toBe(true);
  });

  it('should return false for testUserWithoutQualifyingAccount', async () => {
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
  };

  it('should return false for null user', async () => {
    const callerWithNullUser = usersRouter.createCaller(
      {
        thirdPartyOriginHostname: null,
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
      } satisfies Omit<
        TrpcContext,
        'user' | 'db' | 'res'
      > as unknown as TrpcContext,
      {},
    );

    const result = await callerWithNullUser.getManagerPageEntrypointViewable();

    // Assert: Check the structure of the response
    expect(result.viewable).toBe(false);
  });

  it('should return false for user with no email address', async () => {
    const callerWithNoEmailAddress = usersRouter.createCaller(
      {
        thirdPartyOriginHostname: null,
        testUser: {
          id: 'testUserNoEmailAddress',
          primaryEmail: null,
          stripeCustomerId: null,
          privyUserId: 'testUserNonParentDomainOwner',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } satisfies Omit<
        TrpcContext,
        'user' | 'db' | 'req' | 'res'
      > as TrpcContext,
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
        thirdPartyOriginHostname: null,
        testUser: {
          id: 'testUserGetPrivyUserThrowsError',
          primaryEmail: null,
          stripeCustomerId: null,
          privyUserId: 'testUserGetPrivyUserThrowsError',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } satisfies Omit<
        TrpcContext,
        'user' | 'db' | 'req' | 'res'
      > as TrpcContext,
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
        thirdPartyOriginHostname: null,
        testUser: {
          id: 'testUserNonParentDomainOwner',
          primaryEmail: 'testUser@d3serve.xyz',
          stripeCustomerId: null,
          privyUserId: 'testUserNonParentDomainOwner',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } satisfies Omit<
        TrpcContext,
        'user' | 'db' | 'req' | 'res'
      > as TrpcContext,
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
          thirdPartyOriginHostname: 'defi.build',
          testUser: testUser0xCityOwner,
        } satisfies Omit<
          TrpcContext,
          'user' | 'db' | 'req' | 'res'
        > as TrpcContext,
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
        thirdPartyOriginHostname: '0x.city',
        testUser: testUser0xCityOwner,
      } satisfies Omit<
        TrpcContext,
        'user' | 'db' | 'req' | 'res'
      > as TrpcContext,
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
          thirdPartyOriginHostname: null,
          testUser: testUser0xCityOwner,
        } satisfies Omit<
          TrpcContext,
          'user' | 'db' | 'req' | 'res'
        > as TrpcContext,
        {},
      );

    const result =
      await callerWith0xCityOwnerUserNoThirdPartyOrigin.getManagerPageEntrypointViewable();

    // Assert: Check the structure of the response
    expect(result.viewable).toBe(true);
  });
});
