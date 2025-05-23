import { db, userUpdateSchema, usersTable } from '@namefi-astra/db';
import {
  NAMEFI_NFT_CONTRACT_ADDRESS,
  type NamefiNormalizedDomain,
  getSubDomainAndParentDomainFromNormalizedDomainName,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import type { LinkedAccountWithMetadata } from '@privy-io/server-auth';
import { TRPCError } from '@trpc/server';
import { eq, sql } from 'drizzle-orm';
import { isEmpty, isNil, isNotEmpty, isNotNil } from 'ramda';
import { http, createPublicClient } from 'viem';
import * as chains from 'viem/chains';
import { z } from 'zod';
import { config, secrets } from '#lib/env';
import { NftAbi } from '../../temporal/activities/helpers/contracts';
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

    try {
      const latestBlock = await viemBasePublicClient.getBlockNumber();
      const tokenIdResults = await viemBasePublicClient.multicall({
        contracts: nfts.map((nft) => ({
          address: NAMEFI_NFT_CONTRACT_ADDRESS as `0x${string}`,
          abi: NftAbi,
          functionName: 'normalizedDomainNameToId',
          args: [nft.normalizedDomainName],
          blockNumber: BigInt(latestBlock),
        })),
      });

      const nftsWithTokenIds = nfts.map((nft, i) => {
        const result = tokenIdResults[i];
        const tokenId =
          result.status === 'success' ? (result.result as string) : undefined;
        return { ...nft, tokenId };
      });

      return nftsWithTokenIds;
    } catch (error) {
      console.log('Failed to fetch tokenIds for getCurrentUserDomains:', error);
      // Return NFTs without tokenIds if multicall fails
      return nfts.map((nft) => ({ ...nft, tokenId: undefined }));
    }
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

  getUserQualifyingDomainNamesForPromo: protectedProcedure.query(
    async ({ ctx }) => {
      const { user, thirdPartyOriginHostname } = ctx;

      if (thirdPartyOriginHostname !== '0x.city') {
        return [];
      }

      // Check privyUser exists
      const [error, privyUser] = await resolve(
        privyClient.getUserById(user.privyUserId),
      );

      if (error || isNil(privyUser)) {
        return [];
      }

      type QualifyingDomainNameForPromoWithLinkedAccountType = {
        qualifyingDomainName: string;
        linkedAccountType:
          | 'email'
          | 'github_oauth'
          | 'twitter_oauth'
          | 'wallet';
      };

      const results: QualifyingDomainNameForPromoWithLinkedAccountType[] = [];
      const qualifyingDomainNamesSet = new Set<string>();
      const maybeAddToResults = ({
        qualifyingDomainName,
        linkedAccountType,
      }: QualifyingDomainNameForPromoWithLinkedAccountType) => {
        if (!qualifyingDomainNamesSet.has(qualifyingDomainName)) {
          results.push({ qualifyingDomainName, linkedAccountType });
        }
        qualifyingDomainNamesSet.add(qualifyingDomainName);
      };

      // check email address
      const qualifyingDomainNamesFromEmail = isNotNil(privyUser.email)
        ? await getQualifyingPromoDomainNamesFromPrivyLinkedAccount({
            privyLinkedAccount: {
              ...privyUser.email,
              type: 'email',
            } as LinkedAccountWithMetadata,
          })
        : [];

      for (const domainName of qualifyingDomainNamesFromEmail) {
        maybeAddToResults({
          qualifyingDomainName: domainName,
          linkedAccountType: 'email',
        });
      }

      // check github
      const qualifyingDomainNamesFromGitHub = isNotNil(privyUser.github)
        ? await getQualifyingPromoDomainNamesFromPrivyLinkedAccount({
            privyLinkedAccount: {
              ...privyUser.github,
              type: 'github_oauth',
            } as LinkedAccountWithMetadata,
          })
        : [];

      for (const domainName of qualifyingDomainNamesFromGitHub) {
        maybeAddToResults({
          qualifyingDomainName: domainName,
          linkedAccountType: 'github_oauth',
        });
      }

      // check twitter
      const qualifyingDomainNamesFromTwitter = isNotNil(privyUser.twitter)
        ? await getQualifyingPromoDomainNamesFromPrivyLinkedAccount({
            privyLinkedAccount: {
              ...privyUser.twitter,
              type: 'twitter_oauth',
            } as LinkedAccountWithMetadata,
          })
        : [];

      for (const domainName of qualifyingDomainNamesFromTwitter) {
        maybeAddToResults({
          qualifyingDomainName: domainName,
          linkedAccountType: 'twitter_oauth',
        });
      }

      // check ENS for all user wallets
      const walletDomainPromises = await Promise.allSettled(
        privyUser.linkedAccounts
          .filter((linkedAccount) => linkedAccount.type === 'wallet')
          .map((linkedWallet) =>
            getQualifyingPromoDomainNamesFromPrivyLinkedAccount({
              privyLinkedAccount: linkedWallet as LinkedAccountWithMetadata,
            }),
          ),
      );

      for (const result of walletDomainPromises) {
        if (result.status === 'rejected') {
          continue;
        }

        const [domainName] = result.value;
        if (isNil(domainName)) {
          continue;
        }

        maybeAddToResults({
          qualifyingDomainName: domainName,
          linkedAccountType: 'wallet',
        });
      }

      return results;
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
}: { privyLinkedAccount: LinkedAccountWithMetadata }) {
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
