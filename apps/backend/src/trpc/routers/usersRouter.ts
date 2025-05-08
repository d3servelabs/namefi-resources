import { db, userUpdateSchema, usersTable } from '@namefi-astra/db';
import {
  type NamefiNormalizedDomain,
  getSubDomainAndParentDomainFromNormalizedDomainName,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { eq, sql } from 'drizzle-orm';
import { isEmpty, isNil, isNotEmpty, isNotNil } from 'ramda';
import { http, createPublicClient } from 'viem';
import * as chains from 'viem/chains';
import { z } from 'zod';
import { config, secrets } from '#lib/env';
import { resolve } from '../../utils/resolve';
import {
  authedOrPublicProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '../base';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '../utils';

if (!secrets.ALCHEMY_API_KEY) {
  throw new Error('Cannot create Ethereum public client');
}

export const viemEthereumPublicClient = createPublicClient({
  chain: chains.mainnet,
  transport: http(
    `https://eth-mainnet.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
  ),
});

export const usersRouter = createTRPCRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.user.id),
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return user;
  }),

  updateUser: protectedProcedure
    .input(
      z.object({
        data: userUpdateSchema.pick({ primaryEmail: true }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [updatedUser] = await db
        .update(usersTable)
        .set({
          ...input.data,
        })
        .where(eq(usersTable.id, ctx.user.id))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return updatedUser;
    }),

  getUserQualifiesForDomainNamePromo: protectedProcedure
    .input(z.object({ normalizedDomainName: namefiNormalizedDomainSchema }))
    .query(async ({ input, ctx }) => {
      const { user } = ctx;

      return await userQualifiesForDomainNamePromo({
        normalizedDomainName: input.normalizedDomainName,
        user,
      });
    }),

  // TODO: add tests for this procedure
  getCurrentUserDomains: protectedProcedure.query(async ({ ctx }) => {
    const { user, thirdPartyOriginHostname } = ctx;
    const [error, privyUser] = await resolve(
      privyClient.getUserById(user.privyUserId),
    );

    if (error || isNil(privyUser)) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'could not find user details',
      });
    }

    const privyUserLinkedEthereumChecksumWalletAddresses =
      getPrivyUserLinkedEthereumChecksumWalletAddresses({
        privyUser,
      });

    if (isEmpty(privyUserLinkedEthereumChecksumWalletAddresses)) {
      return [];
    }

    const nfts = await db.query.namefiNftTable.findMany({
      where: (table, { inArray, and, ilike, gte }) =>
        and(
          inArray(
            table.ownerAddress,
            privyUserLinkedEthereumChecksumWalletAddresses,
          ),
          thirdPartyOriginHostname
            ? ilike(table.normalizedDomainName, `%.${thirdPartyOriginHostname}`)
            : undefined,
          gte(
            sql`array_length(string_to_array(${table.normalizedDomainName}, '.'), 1)`,
            3,
          ),
        ),
    });

    return nfts;
  }),

  getManagerPageEntrypointViewable: authedOrPublicProcedure.query(
    async ({ ctx }) => {
      const { user, thirdPartyOriginHostname } = ctx;

      if (!user) {
        return { viewable: false };
      }

      const [error, privyUser] = await resolve(
        privyClient.getUserById(user.privyUserId),
      );

      if (error || isNil(privyUser) || isNil(privyUser.email?.address)) {
        return { viewable: false };
      }

      const userOwnedParentDomains =
        config.EMAIL_ADDRESS_TO_OWNED_HOSTNAMES_MAP[
          privyUser.email.address
        ]?.filter(
          (domain) =>
            isNil(thirdPartyOriginHostname) ||
            domain === thirdPartyOriginHostname,
        ) ?? [];

      return { viewable: isNotEmpty(userOwnedParentDomains) };
    },
  ),

  getRegisteredSubdomainsForParentDomainOwner: protectedProcedure.query(
    async ({ ctx }) => {
      const { user, thirdPartyOriginHostname } = ctx;
      const [error, privyUser] = await resolve(
        privyClient.getUserById(user.privyUserId),
      );

      if (error || isNil(privyUser)) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'could not find user details',
        });
      }

      if (isNil(privyUser.email?.address)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'missing email',
        });
      }

      // #region get all issued subdomains for parent domains owned by user
      const userOwnedParentDomains =
        config.EMAIL_ADDRESS_TO_OWNED_HOSTNAMES_MAP[privyUser.email.address] ??
        [];

      const parentDomains = thirdPartyOriginHostname
        ? userOwnedParentDomains.filter(
            (domain) => domain === thirdPartyOriginHostname,
          )
        : userOwnedParentDomains;

      if (isEmpty(parentDomains)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
        });
      }

      const issuedSubdomainNfts = await db.query.namefiNftTable.findMany({
        where: (table, { and, ilike, gte, or }) =>
          and(
            or(
              ...parentDomains.map((thirdPartyOrigin) =>
                ilike(table.normalizedDomainName, `%.${thirdPartyOrigin}`),
              ),
            ),
            gte(
              sql`array_length(string_to_array(${table.normalizedDomainName}, '.'), 1)`,
              3,
            ),
          ),
      });

      const subdomainNftsMap: Record<
        string,
        (typeof issuedSubdomainNfts)[number]
      > = {};
      const subdomainNftDomainNames: string[] = [];

      for (const nft of issuedSubdomainNfts) {
        subdomainNftDomainNames.push(nft.normalizedDomainName);
        subdomainNftsMap[nft.normalizedDomainName] = nft;
      }
      // #endregion get all parent domains and subdomains

      // #region get successfully processed orderItems for issued subdomains
      const successfulOrderItems = await db.query.orderItemsTable.findMany({
        where: (table, { inArray, and }) =>
          and(
            inArray(table.normalizedDomainName, subdomainNftDomainNames),
            eq(table.status, 'SUCCEEDED'),
          ),
        columns: {
          normalizedDomainName: true,
          amountInUSDCents: true,
          updatedAt: true,
        },
      });
      // #endregion get successfully processed orderItems for issued subdomains

      const res = successfulOrderItems.map((orderItem) => {
        return {
          normalizedDomainName: orderItem.normalizedDomainName,
          ownerAddress:
            subdomainNftsMap[orderItem.normalizedDomainName]?.ownerAddress,
          updatedAt: orderItem.updatedAt,
          priceInUsdCents: orderItem.amountInUSDCents,
        };
      });

      return res;
    },
  ),
});

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
