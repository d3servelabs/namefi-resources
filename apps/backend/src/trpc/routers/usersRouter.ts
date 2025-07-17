import { db, usersTable } from '@namefi-astra/db';
import {
  NAMEFI_NFT_CONTRACT_ADDRESS,
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import type { LinkedAccountWithMetadata } from '@privy-io/server-auth';
import { TRPCError } from '@trpc/server';
import { eq, sql } from 'drizzle-orm';
import { groupBy, isEmpty, isNil, isNotEmpty, isNotNil, pluck } from 'ramda';
import { http, createPublicClient } from 'viem';
import * as chains from 'viem/chains';
import { z } from 'zod';
import { config, secrets } from '#lib/env';
import {
  getQualifyingPromoDomainNamesFromPrivyLinkedAccount,
  userQualifiesForDomainNamePromo,
} from '#lib/userPromo';
import { NftAbi } from '@namefi-astra/utils/abis/namefi-nft';
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
import {
  privyCustomMetadataSchema,
  privyCustomMetadataToPrivyStorage,
  privyStorageToPrivyCustomMetadata,
} from '../types';
import { RDAP } from '@namefi-astra/registrars/lib/rdap-whois/rdap_client';
import { WhoisClient as WHOIS } from '@namefi-astra/registrars/lib/rdap-whois/whois_client';
import { sldRegistrar } from '#lib/namefi-registry';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { getDomainLevels } from '#lib/get-domain-levels';
import { nftIdFromDomainName } from '#lib/nftHash';
import pMap from 'p-map';
import { logger } from '#lib/logger';
import { fromUnixTime, isBefore, subHours } from 'date-fns';

if (!secrets.ALCHEMY_API_KEY) {
  throw new Error('Cannot create Ethereum public client');
}

const ONLY_SHOW_SUBDOMAINS_FOR_CURRENT_USER = false;

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

  updatePrivyCustomMetadata: protectedProcedure
    .input(privyCustomMetadataSchema)
    .mutation(async ({ input, ctx }) => {
      const serializedMetadata = privyCustomMetadataToPrivyStorage.parse(input);

      const updatedPrivyUser = await privyClient.setCustomMetadata(
        ctx.user.privyUserId,
        serializedMetadata,
      );

      return privyStorageToPrivyCustomMetadata.parse(
        updatedPrivyUser.customMetadata,
      );
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

    const nfts = (
      await db.query.namefiNftTable.findMany({
        where: (table, { inArray, and, ilike, gte }) =>
          and(
            inArray(
              table.ownerAddress,
              privyUserLinkedEthereumChecksumWalletAddresses,
            ),
            thirdPartyOriginHostname
              ? ilike(
                  table.normalizedDomainName,
                  `%.${thirdPartyOriginHostname}`,
                )
              : undefined,
            ONLY_SHOW_SUBDOMAINS_FOR_CURRENT_USER
              ? gte(
                  sql`array_length(string_to_array(${table.normalizedDomainName}, '.'), 1)`,
                  3,
                )
              : undefined,
          ),
      })
    ).map((nft) => ({
      ...nft,
      tokenId: nftIdFromDomainName(nft.normalizedDomainName),
      expirationDate: null,
    }));

    try {
      const expirationDates = await getDomainsExpirationDates(
        pluck('normalizedDomainName', nfts),
      );

      return nfts.map((nft) => ({
        ...nft,
        expirationDate: expirationDates[nft.normalizedDomainName],
      }));
    } catch (error) {
      logger.error(
        { context: 'getCurrentUserDomains', error },
        'Failed to fetch expiration dates',
      );
      return nfts;
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
        NamefiNormalizedDomain,
        (typeof issuedSubdomainNfts)[number]
      > = {};
      const subdomainNftDomainNames: NamefiNormalizedDomain[] = [];

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
        //promo is only available for 0x.city
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

async function getDomainsExpirationDates(
  normalizedDomainNames: NamefiNormalizedDomain[],
): Promise<Record<string, Date | null>> {
  const groupedDomainNames = groupBy((normalizedDomainName) => {
    const domainLevels = getDomainLevels(normalizedDomainName);
    if (domainLevels.levels.length === 2) {
      return 'sld';
    }
    if (domainLevels.levels.length === 3) {
      return '3ld';
    }
    return 'unknown'; // this should never happen but to satisfy typescript
  }, normalizedDomainNames);

  const sldDomainNames = groupedDomainNames.sld ?? [];
  const _3ldDomainNames = groupedDomainNames['3ld'] ?? [];

  const unknownDomainNames = groupedDomainNames.unknown ?? [];
  if (isNotEmpty(unknownDomainNames)) {
    logger.fatal(
      { context: 'getDomainsExpirationDates', unknownDomainNames },
      'Unknown domain levels',
    );
  }

  const latestBlock = await viemBasePublicClient.getBlockNumber();

  const [sldExpirationDates, _3ldNftsExpirationDates] = await Promise.all([
    getSldExpirationDateForDomainList(sldDomainNames),
    get3ldExpirationDateForDomainList(_3ldDomainNames, latestBlock),
  ]);
  return Object.fromEntries([
    ...sldDomainNames.map((domainName, i) => [
      domainName,
      sldExpirationDates[i] ?? null,
    ]),
    ..._3ldDomainNames.map((domainName, i) => [
      domainName,
      _3ldNftsExpirationDates[i]?.expirationDate,
    ]),
    ...unknownDomainNames.map((domainName) => [domainName, null]),
  ]);
}

async function get3ldExpirationDateForDomainList(
  normalizedDomainNames: NamefiNormalizedDomain[],
  latestBlock: bigint,
) {
  const tokenIds = normalizedDomainNames.map(nftIdFromDomainName);
  const expirationDates = await viemBasePublicClient.multicall({
    contracts: tokenIds.map((tokenId) => ({
      address: NAMEFI_NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: NftAbi,
      functionName: 'getExpiration' as const,
      args: [BigInt(tokenId)],
      blockNumber: latestBlock,
    })),
  });

  return expirationDates.map((result, i) => {
    if (result.status === 'failure') {
      return {
        normalizedDomainName: normalizedDomainNames[i],
        expirationDate: null,
        tokenId: tokenIds[i].toString(),
      };
    }

    return {
      normalizedDomainName: normalizedDomainNames[i],
      expirationDate: fromUnixTime(Number(result.result)),
      tokenId: tokenIds[i].toString(),
    };
  });
}

async function getSldExpirationDateForDomainList(
  normalizedDomainNames: NamefiNormalizedDomain[],
) {
  const indexedExpirationDates = await db.query.indexedDomainsTable.findMany({
    where: (table, { inArray }) =>
      inArray(table.normalizedDomainName, normalizedDomainNames),
    columns: {
      normalizedDomainName: true,
      expirationTime: true,
      lastIndexedAt: true,
    },
  });

  const indexedExpirationDatesMap = new Map<
    NamefiNormalizedDomain,
    Date | null
  >(
    indexedExpirationDates
      .filter(
        (domain) => !isBefore(domain.lastIndexedAt, subHours(new Date(), 3)),
      )
      .map((domain) => [
        domain.normalizedDomainName,
        domain.expirationTime ? new Date(domain.expirationTime) : null,
      ]),
  );

  const expirationDates = await pMap(
    normalizedDomainNames,
    async (normalizedDomainName) => {
      const indexedExpirationDate =
        indexedExpirationDatesMap.get(normalizedDomainName);
      if (indexedExpirationDate) {
        return indexedExpirationDate;
      }
      try {
        const liveExpirationDate =
          await getLiveSldExpirationDate(normalizedDomainName);
        if (isNil(liveExpirationDate)) {
          return null;
        }
        return liveExpirationDate;
      } catch (error) {
        logger.error(
          { context: 'getSldExpirationDateForDomainList', error },
          'Failed to get live expiration date',
        );
        return null;
      }
    },
  );
  return expirationDates;
}

async function getLiveSldExpirationDate(normalizedDomainName: string) {
  let expirationDate: Date | null = null;

  const rdapResponse = await resolve(RDAP.queryDomain(normalizedDomainName));
  if (!rdapResponse.failed) {
    expirationDate = RDAP.getExpiryDateFromRdapResponse(rdapResponse.result);
  }

  if (isNil(expirationDate)) {
    const domainDetails = await sldRegistrar.getDomainDetails(
      toPunycodeDomainName(normalizedDomainName),
    );
    expirationDate = domainDetails.expirationTime;
  }
  return expirationDate;
}
