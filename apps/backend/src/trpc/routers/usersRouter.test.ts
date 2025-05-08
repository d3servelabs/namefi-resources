import { config } from 'dotenv';

import type { HonoRequest } from 'hono';
import type { RequestHeader } from 'hono/utils/headers';
import { type Address, type BlockTag, zeroAddress } from 'viem';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrpcContext } from '../base';
import { privyClient } from '../utils';
import { usersRouter, viemEthereumPublicClient } from './usersRouter';

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
  };
  const testNormalizedDomainName = 'netizen1.0x.city';

  it('should return true for testUserWithQualifyingEmail', async () => {
    // Create a caller for the router with testUserWithQualifyingEmail
    const callerWithUserWithQualifyingEmail1 = usersRouter.createCaller(
      {
        thirdPartyOriginHostname: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingEmail',
          privyUserId: 'testUserWithQualifyingEmail',
        },
      } satisfies Omit<
        TrpcContext,
        'user' | 'db' | 'req' | 'res'
      > as TrpcContext,
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
        thirdPartyOriginHostname: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingTwitterHandle',
          privyUserId: 'testUserWithQualifyingTwitterHandle',
        },
      } satisfies Omit<
        TrpcContext,
        'user' | 'db' | 'req' | 'res'
      > as TrpcContext,
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
        thirdPartyOriginHostname: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingTwitterName',
          privyUserId: 'testUserWithQualifyingTwitterName',
        },
      } satisfies Omit<
        TrpcContext,
        'user' | 'db' | 'req' | 'res'
      > as TrpcContext,
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

  it('should return true for testUserWithQualifyingEns', async () => {
    // Create a caller for the router with testUserWithQualifyingEns
    const callerWithUserWithQualifyingEns = usersRouter.createCaller(
      {
        thirdPartyOriginHostname: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithQualifyingEns',
          privyUserId: 'testUserWithQualifyingEns',
        },
      } satisfies Omit<
        TrpcContext,
        'user' | 'db' | 'req' | 'res'
      > as TrpcContext,
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
        thirdPartyOriginHostname: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithoutQualifyingAccount',
          privyUserId: 'testUserWithoutQualifyingAccount',
        },
      } satisfies Omit<
        TrpcContext,
        'user' | 'db' | 'req' | 'res'
      > as TrpcContext,
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
        thirdPartyOriginHostname: null,
        testUser: {
          ...baseTestUser,
          id: 'testUserWithNoLinkedAccounts',
          privyUserId: 'testUserWithNoLinkedAccounts',
        },
      } satisfies Omit<
        TrpcContext,
        'user' | 'db' | 'req' | 'res'
      > as TrpcContext,
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
