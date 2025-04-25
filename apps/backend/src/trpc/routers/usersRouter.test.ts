import { config } from 'dotenv';

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
