import {
  type NamefiNormalizedDomain,
  getSubDomainAndParentDomainFromNormalizedDomainName,
} from '@namefi-astra/utils';
import { db, ordersTable, orderItemsTable, usersTable } from '@namefi-astra/db';
import type { LinkedAccountWithMetadata } from '@privy-io/server-auth';
import { and, eq, ilike, notInArray, sql } from 'drizzle-orm';
import { isNil, isNotNil } from 'ramda';
import { http, createPublicClient } from 'viem';
import { CHAINS as chains } from '@namefi-astra/utils/chains';
import { secrets } from '#lib/env';
import {
  canUserAccessAdminPanel,
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '../trpc/utils';
import { resolve } from '../utils/resolve';

if (!secrets.ALCHEMY_API_KEY) {
  throw new Error('Cannot create Ethereum public client');
}

export const viemBasePublicClient = createPublicClient({
  chain: chains.base,
  transport: http(
    `https://base-mainnet.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
  ),
});

export const viemEthereumPublicClient = createPublicClient({
  chain: chains.mainnet,
  transport: http(
    `https://eth-mainnet.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
  ),
});

// ============================================================================
// test.namefi.dev Promo
// ============================================================================

const TEST_NAMEFI_DEV_MAX_SUBDOMAINS = 15;

/**
 * Checks if user qualifies for free test.namefi.dev subdomain.
 * - Admins always qualify
 * - Non-admins can have up to 15 subdomains
 *
 * @warning This check is not safe for race conditions. Multiple concurrent
 * requests could exceed the limit before the count is updated.
 */
async function userQualifiesForTestNamefiDevPromo({
  user,
}: {
  user: { privyUserId: string };
}): Promise<boolean> {
  // 1. Get user from database
  const dbUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.privyUserId, user.privyUserId),
    columns: { id: true, privyUserId: true },
  });

  if (!dbUser) {
    return false;
  }

  // 2. Check if user is admin - admins always qualify
  const isAdmin = await canUserAccessAdminPanel(dbUser);
  if (isAdmin) {
    return true;
  }

  // 3. Count user's existing test.namefi.dev subdomains
  // WARNING: Not safe for race conditions
  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(
      and(
        eq(ordersTable.userId, dbUser.id),
        ilike(orderItemsTable.normalizedDomainName, '%.test.namefi.dev'),
        notInArray(orderItemsTable.status, ['FAILED', 'CANCELLED']),
      ),
    );

  return (count ?? 0) < TEST_NAMEFI_DEV_MAX_SUBDOMAINS;
}

// ============================================================================
// 0x.city Promo
// ============================================================================
const PARENT_DOMAINS_WITH_TRIAL_REGISTRATION = ['0x.city'];

export async function userQualifiesForDomainNameTrialRegistration({
  normalizedDomainName,
  user,
  duration,
}: {
  normalizedDomainName: NamefiNormalizedDomain;
  user: { privyUserId: string };
  duration: { value: number; unit: 'year' | 'day' };
}): Promise<boolean> {
  const { subdomain, parentDomain } =
    getSubDomainAndParentDomainFromNormalizedDomainName(normalizedDomainName);

  if (PARENT_DOMAINS_WITH_TRIAL_REGISTRATION.includes(parentDomain)) {
    switch (duration.unit) {
      case 'year':
        return duration.value === 0;
      case 'day':
        return duration.value <= 30;
    }
  }

  return false;
}
/*
 * Function that checks if the the User qualifies for a promo for the provided normalizedDomainName.
 * The current implementation checks if normalizedDomainName has the "0x.city" parent domain, the
 * User has a Privy LinkedAccount username that starts with "0x", and the rest of the LinkedAccount
 * username must match the normalizedDomainName's subdomain exactly.
 * Ex: PrivyUser { email: {address: "0xnetizen1@gmail.com"}}, normalizedDomainName: "netizen1.0x.city" -> true
 * Ex: PrivyUser { twitter: {username: "0xnetizen1"}}, normalizedDomainName: "netizen1.0x.city" -> true
 */
export async function userQualifiesForDomainNamePromo({
  normalizedDomainName,
  user,
}: {
  normalizedDomainName: NamefiNormalizedDomain;
  user: { privyUserId: string };
}) {
  const { subdomain, parentDomain } =
    getSubDomainAndParentDomainFromNormalizedDomainName(normalizedDomainName);

  // Handle test.namefi.dev subdomains (zero-price domains)
  if (parentDomain === 'test.namefi.dev' && subdomain) {
    return userQualifiesForTestNamefiDevPromo({ user });
  }

  // Handle 0x.city promo
  if (!subdomain || parentDomain !== '0x.city') {
    return false;
  }

  // Check privyUser exists
  const [error, privyUser] = await resolve(
    privyClient.getUserById(user.privyUserId),
  );

  if (error || isNil(privyUser)) {
    return false;
  }

  const accountNamesToCheck: (string | null | undefined)[] = [];

  // check email address
  const privyEmailAddress = privyUser.email?.address;
  if (isNotNil(privyEmailAddress)) {
    const [name] = privyEmailAddress.split('@');
    accountNamesToCheck.push(name);
  }

  // check twitter
  accountNamesToCheck.push(privyUser.twitter?.name);
  accountNamesToCheck.push(privyUser.twitter?.username);

  // #region check github
  const githubEmailAddress = privyUser.github?.email;
  if (isNotNil(githubEmailAddress)) {
    const [name] = githubEmailAddress.split('@');
    accountNamesToCheck.push(name);
  }

  accountNamesToCheck.push(privyUser.github?.name);
  accountNamesToCheck.push(privyUser.github?.username);
  // #endregion check github

  // check ENS for all user wallets
  const privyUserLinkedEthereumChecksumWalletAddresses =
    getPrivyUserLinkedEthereumChecksumWalletAddresses({
      privyUser,
    });
  const ensLookups = await Promise.allSettled(
    privyUserLinkedEthereumChecksumWalletAddresses.map((address) =>
      viemEthereumPublicClient.getEnsName({ address }),
    ),
  );

  for (const result of ensLookups) {
    if (result.status === 'rejected' || result.value == null) {
      continue;
    }
    const ensName = result.value;
    if (isNotNil(ensName)) {
      const ensNamePrefix = ensName.split('.')[0];
      accountNamesToCheck.push(ensNamePrefix);
    }
  }
  // #endregion check ENS for all user wallets

  return accountNamesToCheck.some(
    (accountName) =>
      isNotNil(accountName) &&
      accountName.startsWith('0x') &&
      accountName.slice(2).toLowerCase() === subdomain.toLowerCase(),
  );
}

export function getQualifyingDomainNameFromUserIdentifier(
  identifier: string | null | undefined,
): string | null {
  if (isNil(identifier) || !identifier.startsWith('0x')) {
    return null;
  }
  return `${identifier.slice(2).toLowerCase()}.0x.city`;
}

/**
 * Function that retrieves domain names that qualify for the 0x.city promotion based on the
 * input Privy LinkedAccount.
 */
export async function getQualifyingPromoDomainNamesFromPrivyLinkedAccount({
  privyLinkedAccount,
}: {
  privyLinkedAccount: LinkedAccountWithMetadata;
}) {
  const qualifyingDomainNames = new Set<string>();

  switch (privyLinkedAccount.type) {
    case 'email': {
      const domainName = getQualifyingDomainNameFromUserIdentifier(
        privyLinkedAccount.address?.split('@')[0],
      );
      if (domainName) {
        qualifyingDomainNames.add(domainName);
      }
      break;
    }

    case 'github_oauth': {
      const identifiers = [
        privyLinkedAccount.email?.split('@')[0],
        privyLinkedAccount.name,
        privyLinkedAccount.username,
      ];
      for (const identifier of identifiers) {
        const domainName =
          getQualifyingDomainNameFromUserIdentifier(identifier);
        if (domainName) {
          qualifyingDomainNames.add(domainName);
        }
      }
      break;
    }

    case 'twitter_oauth': {
      const identifiers = [
        privyLinkedAccount.name,
        privyLinkedAccount.username,
      ];
      for (const identifier of identifiers) {
        const domainName =
          getQualifyingDomainNameFromUserIdentifier(identifier);
        if (domainName) {
          qualifyingDomainNames.add(domainName);
        }
      }
      break;
    }

    case 'wallet': {
      if (privyLinkedAccount.chainType !== 'ethereum') {
        break;
      }

      const [error, ensName] = await resolve(
        viemEthereumPublicClient.getEnsName({
          address: privyLinkedAccount.address as `0x${string}`,
        }),
      );

      if (!error && isNotNil(ensName)) {
        const domainName = getQualifyingDomainNameFromUserIdentifier(
          ensName.split('.')[0],
        );
        if (domainName) {
          qualifyingDomainNames.add(domainName);
        }
      }
      break;
    }

    default:
      return [];
  }

  return Array.from(qualifyingDomainNames);
}
