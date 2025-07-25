import {
  db,
  namefiNftOwnersView,
  namefiNftView,
  indexedDomainsTable,
} from '@namefi-astra/db';
import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, isNull, or, lt, type SQL, sql } from 'drizzle-orm';
import { z } from 'zod';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import { ensureNftIsLockedAndBurnByNftName } from '#temporal/workflows/mint.workflow';
import { createTRPCRouter, protectedProcedure } from '../base';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
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
        'defi.build',
      ];

      // Extract the powered-by-namefi condition to avoid repetition
      const isPoweredByNamefiCondition = sql<boolean>`array_to_string((string_to_array(${namefiNftOwnersView.normalizedDomainName}, '.'))[2:], '.') = ANY(${sql.raw(`ARRAY[${poweredByNamefiDomains.map((d) => `'${d}'`).join(',')}]`)})`;

      // Build base query with joins and computed fields
      const baseQuery = db
        .select({
          normalizedDomainName: namefiNftOwnersView.normalizedDomainName,
          chainId: namefiNftOwnersView.chainId,
          asOfBlockNumber: namefiNftOwnersView.asOfBlockNumber,
          ownerAddress: namefiNftOwnersView.ownerAddress,
          nftExpirationTime: namefiNftView.expirationTime,
          domainExpirationTime: indexedDomainsTable.expirationTime,
          registrarKey: indexedDomainsTable.registrarKey,
          lastIndexedAt: indexedDomainsTable.lastIndexedAt,
          // Computed fields using the extracted condition
          isPoweredByNamefiDomain: isPoweredByNamefiCondition.as(
            'is_powered_by_namefi_domain',
          ),
          effectiveDomainExpirationTime: sql<Date | null>`
            CASE 
              WHEN ${isPoweredByNamefiCondition}
              THEN ${namefiNftView.expirationTime}
              ELSE ${indexedDomainsTable.expirationTime}
            END
          `.as('effective_domain_expiration_time'),
          effectiveRegistrarKey: sql<string | null>`
            CASE 
              WHEN ${isPoweredByNamefiCondition}
              THEN 'Powered by Namefi'
              ELSE ${indexedDomainsTable.registrarKey}
            END
          `.as('effective_registrar_key'),
          canBurn: sql<boolean>`
            CASE 
              WHEN ${isPoweredByNamefiCondition}
              THEN false
              ELSE (
                ( ( NOW() - coalesce(${indexedDomainsTable.expirationTime}, NOW()) ) > interval '${sql.raw(MAX_GRACE_PERIOD_DAYS.toString())} days' )
                OR 
                ( ( NOW() - ${namefiNftView.expirationTime}) > interval '${sql.raw(MAX_GRACE_PERIOD_DAYS.toString())} days' )
                OR
                ${indexedDomainsTable.expirationTime} IS NULL
              )
            END
          `.as('can_burn'),
        })
        .from(namefiNftOwnersView)
        .leftJoin(
          namefiNftView,
          and(
            eq(
              namefiNftOwnersView.normalizedDomainName,
              namefiNftView.normalizedDomainName,
            ),
            eq(namefiNftOwnersView.chainId, namefiNftView.chainId),
          ),
        )
        .leftJoin(
          indexedDomainsTable,
          eq(
            namefiNftOwnersView.normalizedDomainName,
            indexedDomainsTable.normalizedDomainName,
          ),
        );

      // Build count query with same joins
      const countQuery = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(namefiNftOwnersView)
        .leftJoin(
          namefiNftView,
          and(
            eq(
              namefiNftOwnersView.normalizedDomainName,
              namefiNftView.normalizedDomainName,
            ),
            eq(namefiNftOwnersView.chainId, namefiNftView.chainId),
          ),
        )
        .leftJoin(
          indexedDomainsTable,
          eq(
            namefiNftOwnersView.normalizedDomainName,
            indexedDomainsTable.normalizedDomainName,
          ),
        );

      const filters = _buildQueryFilters(
        searchTerm,
        filterBy,
        poweredByNamefiDomains,
        excludePoweredByNamefiDomains,
      );
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

      // Map results to include computed fields (already calculated in DB)
      const processedResults = results.map((result) => ({
        normalizedDomainName: result.normalizedDomainName,
        chainId: result.chainId,
        asOfBlockNumber: result.asOfBlockNumber,
        ownerAddress: result.ownerAddress,
        nftExpirationTime: result.nftExpirationTime,
        domainExpirationTime: result.effectiveDomainExpirationTime,
        registrarKey: result.effectiveRegistrarKey,
        lastIndexedAt: result.lastIndexedAt,
        isPoweredByNamefiDomain: result.isPoweredByNamefiDomain,
        canBurn: result.canBurn,
      }));

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
      const nft = await db
        .select()
        .from(namefiNftOwnersView)
        .where(
          and(
            eq(namefiNftOwnersView.normalizedDomainName, normalizedDomainName),
            eq(namefiNftOwnersView.chainId, chainId),
          ),
        )
        .limit(1);

      if (!nft[0]) {
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

function _buildQueryFilters(
  searchTerm: string | undefined,
  filterBy: string,
  poweredByNamefiDomains: string[],
  excludePoweredByNamefiDomains: boolean,
) {
  // Build filters
  const filters = [];

  if (searchTerm) {
    filters.push(
      or(
        sql`${namefiNftOwnersView.normalizedDomainName} ILIKE ${'%' + searchTerm + '%'}`,
        sql`${namefiNftOwnersView.ownerAddress} ILIKE ${'%' + searchTerm + '%'}`,
      ),
    );
  }

  // Add powered by namefi exclusion filter
  if (excludePoweredByNamefiDomains) {
    const isPoweredByNamefiCondition = sql`array_to_string((string_to_array(${namefiNftOwnersView.normalizedDomainName}, '.'))[2:], '.') = ANY(${sql.raw(`ARRAY[${poweredByNamefiDomains.map((d) => `'${d}'`).join(',')}]`)})`;
    filters.push(sql`NOT (${isPoweredByNamefiCondition})`);
  }

  if (filterBy === 'expired') {
    filters.push(
      or(
        // Domain expired
        sql`${indexedDomainsTable.expirationTime} < NOW()`,
        isNull(indexedDomainsTable.expirationTime),
        // NFT expired
        sql`${namefiNftView.expirationTime} < NOW()`,
      ),
    );
  } else if (filterBy === 'canBurn') {
    // For canBurn, we need to check:
    // 1. Either domain OR NFT is beyond grace period
    // 2. NOT a powered by namefi domain (they can't be burned)
    const isPoweredByNamefiCondition = sql`array_to_string((string_to_array(${namefiNftOwnersView.normalizedDomainName}, '.'))[2:], '.') = ANY(${sql.raw(`ARRAY[${poweredByNamefiDomains.map((d) => `'${d}'`).join(',')}]`)})`;

    filters.push(
      and(
        // Not a powered by namefi domain
        sql`NOT (${isPoweredByNamefiCondition})`,
        // Either domain or NFT beyond grace period
        or(
          // Domain beyond grace period
          sql`( ( NOW() - coalesce(${indexedDomainsTable.expirationTime}, NOW()) ) > interval '${sql.raw(MAX_GRACE_PERIOD_DAYS.toString())} days')`,
          isNull(indexedDomainsTable.expirationTime),
          // NFT beyond grace period
          sql`( ( NOW() - ${namefiNftView.expirationTime}) > interval '${sql.raw(MAX_GRACE_PERIOD_DAYS.toString())} days')`,
        ),
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
          ? asc(namefiNftOwnersView.normalizedDomainName)
          : desc(namefiNftOwnersView.normalizedDomainName);
      break;
    case 'nftExpiration':
      orderByClause =
        sortOrder === 'asc'
          ? sql`${namefiNftView.expirationTime} ASC NULLS LAST`
          : sql`${namefiNftView.expirationTime} DESC NULLS LAST`;
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
          ? asc(namefiNftOwnersView.chainId)
          : desc(namefiNftOwnersView.chainId);
      break;
    default:
      orderByClause =
        sortOrder === 'asc'
          ? asc(namefiNftOwnersView.normalizedDomainName)
          : desc(namefiNftOwnersView.normalizedDomainName);
  }
  return orderByClause;
}
