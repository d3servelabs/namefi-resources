import { db, namefiNftTable, indexedDomainsTable } from '@namefi-astra/db';
import {
  NAMEFI_NFT_CONTRACT_ADDRESS,
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import {
  and,
  asc,
  desc,
  eq,
  isNull,
  or,
  type SQL,
  sql,
  type SQLWrapper,
} from 'drizzle-orm';
import { z } from 'zod';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import { ensureNftIsLockedAndBurnByNftName } from '#temporal/workflows/mint.workflow';
import { createTRPCRouter, protectedProcedure } from '../base';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import { filter, fromPairs, groupBy, pipe, prop, isNotNil } from 'ramda';
import pProps from 'p-props';
import { getViemPublicClient } from '#lib/crypto/viem-clients';
import { NftAbi } from '@namefi-astra/utils/abis/namefi-nft';
import { nftIdFromDomainName } from '#lib/nftHash';
import { differenceInDays, fromUnixTime } from 'date-fns';
import {
  getPrivyUserLinkedEthereumWalletAddresses,
  privyClient,
} from '../utils';
import { config } from '#lib/env';

const MAX_GRACE_PERIOD_DAYS = 45; /* 45 days is the max grace period for any registrar */

async function isUserAdmin(privyUserId: string): Promise<boolean> {
  const privyUser = await privyClient.getUserById(privyUserId);
  const user = getPrivyUserLinkedEthereumWalletAddresses({ privyUser });
  const adminWallets = new Set(config.ADMIN_WALLET_ADDRESSES);
  return user.some((wallet) => adminWallets.has(wallet));
}
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const isAdmin = await isUserAdmin(ctx.user.privyUserId);
  if (!isAdmin) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'user is not an admin',
    });
  }
  return next({ ctx });
});

export const adminRouter = createTRPCRouter({
  getNftsWithExpirationStatus: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        sortBy: z
          .enum(['domainName', 'nftExpiration', 'domainExpiration', 'chainId'])
          .default('domainName'),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
        filterBy: z.enum(['all', 'expired', 'canBurn']).default('all'),
        searchTerm: z.string().optional(),
        excludePoweredByNamefiDomains: z.boolean().default(false),
      }),
    )
    .query(async ({ input }) => {
      const {
        page,
        limit,
        sortBy,
        sortOrder,
        filterBy,
        searchTerm,
        excludePoweredByNamefiDomains,
      } = input;
      const offset = (page - 1) * limit;

      const poweredByNamefiDomains = [
        ...(await getPoweredByNamefi3PDomains()),
        'withharris.club',
        'withtrump.club',
      ];
      // Build base query
      const baseQuery = db
        .select({
          normalizedDomainName: namefiNftTable.normalizedDomainName,
          chainId: namefiNftTable.chainId,
          asOfBlockNumber: namefiNftTable.asOfBlockNumber,
          ownerAddress: namefiNftTable.ownerAddress,
          nftExpirationTime: sql<Date | null>`null`.as('nft_expiration_time'),
          domainExpirationTime: indexedDomainsTable.expirationTime,
          registrarKey: indexedDomainsTable.registrarKey,
          lastIndexedAt: indexedDomainsTable.lastIndexedAt,
        })
        .from(namefiNftTable)
        .leftJoin(
          indexedDomainsTable,
          eq(
            namefiNftTable.normalizedDomainName,
            indexedDomainsTable.normalizedDomainName,
          ),
        );

      // Build count query
      const countQuery = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(namefiNftTable)
        .leftJoin(
          indexedDomainsTable,
          eq(
            namefiNftTable.normalizedDomainName,
            indexedDomainsTable.normalizedDomainName,
          ),
        );

      const filters = _buildQueryFilters(
        searchTerm,
        filterBy,
        poweredByNamefiDomains,
      );
      if (excludePoweredByNamefiDomains) {
        filters.push(excludeSubdomainsOfParentDomains(poweredByNamefiDomains));
      }
      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      // Apply sorting
      const orderByClause = _buildOrderByClause(sortBy, sortOrder);

      // Execute queries with or without filters
      const [results, countResult] = await Promise.all([
        baseQuery
          .where(whereClause)
          .orderBy(orderByClause)
          .limit(limit)
          .offset(offset),
        countQuery.where(whereClause),
      ]);

      const totalCount = countResult[0]?.count ?? 0;
      const resultByChainId = groupBy((result) => {
        if (result.chainId) {
          return result.chainId.toString();
        }
        return 'unknown';
      }, results);
      const processedResultsByChainId = await pProps(
        resultByChainId,
        async (results, chainId) => {
          if (chainId === 'unknown') {
            return {};
          }
          if (!results) {
            return {};
          }
          const client = getViemPublicClient(Number(chainId));
          const latestBlock = await client.getBlockNumber();
          const tokenIds = results.map((result) =>
            nftIdFromDomainName(result.normalizedDomainName),
          );
          const expirationResults = await client.multicall({
            contracts: tokenIds.map((tokenId) => ({
              address: NAMEFI_NFT_CONTRACT_ADDRESS as `0x${string}`,
              abi: NftAbi,
              functionName: 'getExpiration' as const,
              args: [tokenId],
              blockNumber: latestBlock,
            })),
          });

          return fromPairs(
            expirationResults.map((result, index) => [
              results[index].normalizedDomainName,
              result.status === 'success'
                ? fromUnixTime(Number(result.result))
                : null,
            ]),
          );
        },
      );
      // Process results to add canBurn flag
      const processedResults = filter(
        isNotNil,
        results.map((result) => {
          const parsedDomainName = parseDomainName(result.normalizedDomainName);
          if (!parsedDomainName.valid) {
            console.error(
              `Invalid domain name: ${result.normalizedDomainName}`,
            );
            return null;
          }

          const isPoweredByNamefiDomain = poweredByNamefiDomains.includes(
            parsedDomainName.immediateParentDomain as NamefiNormalizedDomain,
          );

          const nftExpirationTime =
            processedResultsByChainId[result.chainId?.toString()]?.[
              result.normalizedDomainName
            ] ?? null;
          const domainExpirationTime = isPoweredByNamefiDomain
            ? nftExpirationTime
            : result.domainExpirationTime;

          const registrarKey = isPoweredByNamefiDomain
            ? 'Powered by Namefi'
            : result.registrarKey;

          const isRegistrarDateBeyondGracePeriod =
            domainExpirationTime &&
            differenceInDays(new Date(), domainExpirationTime) >
              MAX_GRACE_PERIOD_DAYS;
          const isNftDateBeyondGracePeriod =
            nftExpirationTime &&
            differenceInDays(new Date(), nftExpirationTime) >
              MAX_GRACE_PERIOD_DAYS;

          const canBurn =
            !isPoweredByNamefiDomain &&
            (isRegistrarDateBeyondGracePeriod || isNftDateBeyondGracePeriod);

          return {
            ...result,
            isPoweredByNamefiDomain,
            nftExpirationTime,
            domainExpirationTime,
            registrarKey,
            canBurn,
          };
        }),
      );

      return {
        data: processedResults,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    }),

  burnNft: adminProcedure
    .input(
      z.object({
        normalizedDomainName: namefiNormalizedDomainSchema,
        chainId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { normalizedDomainName, chainId } = input;
      const parsedDomainName = parseDomainName(normalizedDomainName);
      if (!parsedDomainName.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid domain name',
        });
      }

      // Verify the NFT exists
      const nft = await db.query.namefiNftTable.findFirst({
        where: and(
          eq(namefiNftTable.normalizedDomainName, normalizedDomainName),
          eq(namefiNftTable.chainId, chainId),
        ),
      });

      if (!nft) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'NFT not found',
        });
      }

      // Check if domain is expired or not found
      const domainInfo = await db.query.indexedDomainsTable.findFirst({
        where: eq(
          indexedDomainsTable.normalizedDomainName,
          normalizedDomainName,
        ),
      });

      const isDomainExpired = domainInfo
        ? domainInfo.expirationTime < new Date()
        : true;

      if (!isDomainExpired) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot burn NFT: domain is not expired',
        });
      }

      const poweredByNamefiDomains = await getPoweredByNamefi3PDomains();

      // Check if it's a poweredByNamefi domain
      const isPoweredByNamefiDomain = poweredByNamefiDomains.includes(
        parsedDomainName.immediateParentDomain as NamefiNormalizedDomain,
      );

      if (isPoweredByNamefiDomain) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot burn NFT: poweredByNamefi domains cannot be burned',
        });
      }

      // Execute the burn workflow
      try {
        const workflowId = ensureNftIsLockedAndBurnByNftName.generateId({
          domainName: normalizedDomainName,
          chainId,
        });

        await temporalClient.workflow.start(ensureNftIsLockedAndBurnByNftName, {
          args: [{ domainName: normalizedDomainName, chainId }],
          workflowId,
          taskQueue: TEMPORAL_QUEUES.MINT,
          workflowIdConflictPolicy: 'USE_EXISTING',
          workflowIdReusePolicy: 'ALLOW_DUPLICATE',
        });

        return {
          success: true,
          workflowId,
          message: 'NFT burn workflow started successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to start burn workflow',
          cause: error,
        });
      }
    }),

  getBurnWorkflowStatus: adminProcedure
    .input(
      z.object({
        normalizedDomainName: namefiNormalizedDomainSchema,
        chainId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const { normalizedDomainName, chainId } = input;

      try {
        const workflowId = ensureNftIsLockedAndBurnByNftName.generateId({
          domainName: normalizedDomainName,
          chainId,
        });

        const workflow = await temporalClient.workflow.getHandle(workflowId);
        const description = await workflow.describe();

        return {
          workflowId,
          status: description.status.name,
          startTime: description.startTime,
          closeTime: description.closeTime,
          historyLength: description.historyLength,
        };
      } catch (error) {
        // Workflow not found
        return {
          workflowId: null,
          status: 'NOT_FOUND',
          startTime: null,
          closeTime: null,
          historyLength: 0,
        };
      }
    }),

  isUserAdmin: protectedProcedure.query(async ({ ctx }) => {
    const privyUser = await privyClient.getUser(ctx.user.privyUserId);
    const user = await getPrivyUserLinkedEthereumWalletAddresses({
      privyUser,
    });
    const adminWallets = new Set(config.ADMIN_WALLET_ADDRESSES);
    const isAdmin = user.some((wallet) => adminWallets.has(wallet));
    return isAdmin;
  }),
});

const excludeSubdomainsOfParentDomains = (parentDomains: string[]) => {
  const delimitedParentDomains = sql.join(
    parentDomains.map((domain) => sql.raw(`'${domain}'`)),
    sql.raw(','),
  );
  const splitDomain = sql`string_to_array(${namefiNftTable.normalizedDomainName}, '.')::text[]`;
  const subdomain = sql`array_to_string((${splitDomain})[2:], '.')`;

  return sql`${subdomain} NOT IN (${delimitedParentDomains})`;
};

function _buildQueryFilters(
  searchTerm: string | undefined,
  filterBy: string,
  poweredByNamefiDomains: string[],
) {
  // Build filters
  const filters = [];

  if (searchTerm) {
    filters.push(
      or(
        sql`${namefiNftTable.normalizedDomainName} ILIKE ${'%' + searchTerm + '%'}`,
        sql`${namefiNftTable.ownerAddress} ILIKE ${'%' + searchTerm + '%'}`,
      ),
    );
  }

  if (filterBy === 'expired') {
    filters.push(
      and(
        or(
          sql`${indexedDomainsTable.expirationTime} < NOW()`,
          isNull(indexedDomainsTable.expirationTime),
        ),
        excludeSubdomainsOfParentDomains(poweredByNamefiDomains),
      ),
    );
  } else if (filterBy === 'canBurn') {
    filters.push(
      and(
        or(
          sql`( ( NOW() - coalesce(${indexedDomainsTable.expirationTime}, NOW()) ) > interval '${sql.raw(MAX_GRACE_PERIOD_DAYS.toString())} days')`,
          isNull(indexedDomainsTable.expirationTime),
        ),
        excludeSubdomainsOfParentDomains(poweredByNamefiDomains),
      ),
    );
  }

  return filters;
}

function _buildOrderByClause(sortBy: string, sortOrder: string) {
  let orderByClause: SQL<unknown>;
  switch (sortBy) {
    case 'domainName':
      orderByClause =
        sortOrder === 'asc'
          ? asc(namefiNftTable.normalizedDomainName)
          : desc(namefiNftTable.normalizedDomainName);
      break;
    case 'domainExpiration':
      orderByClause =
        sortOrder === 'asc'
          ? asc(indexedDomainsTable.expirationTime)
          : desc(indexedDomainsTable.expirationTime);
      break;
    case 'chainId':
      orderByClause =
        sortOrder === 'asc'
          ? asc(namefiNftTable.chainId)
          : desc(namefiNftTable.chainId);
      break;
    default:
      orderByClause =
        sortOrder === 'asc'
          ? asc(namefiNftTable.normalizedDomainName)
          : desc(namefiNftTable.normalizedDomainName);
  }
  return orderByClause;
}
