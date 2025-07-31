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
import { extendDomainRegistrationWorkflow } from '#temporal/workflows/domain-ownership/extend-registration.workflow';
import { fixNftExpirationWorkflow } from '#temporal/workflows/fix-nft-expiration.workflow';
import { createTRPCRouter, protectedProcedure } from '../base';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import {
  getPrivyUserLinkedEthereumWalletAddresses,
  privyClient,
} from '../utils';
import { config } from '#lib/env';
import { logger } from '#lib/logger';

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
        filterBy: z
          .enum(['all', 'expired', 'canBurn', 'dateMismatch', 'missingData'])
          .default('all'),
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

      // Build filters to exclude sepolia and test domains (same as reporting)
      const isSepoliaCondition = sql<boolean>`${namefiNftOwnersView.chainId} = 11155111`;
      const isTestDomainCondition = sql<boolean>`split_part(${namefiNftOwnersView.normalizedDomainName}, '.', -1) LIKE 'test%'`;

      // Build base query with joins and computed fields, excluding sepolia and test domains
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
          hasDateMismatch: sql<boolean>`
            CASE 
              WHEN ${isPoweredByNamefiCondition}
              THEN false
              WHEN ${namefiNftView.expirationTime} IS NULL OR ${indexedDomainsTable.expirationTime} IS NULL
              THEN false
              ELSE ABS(EXTRACT(EPOCH FROM (${namefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) > 86400
            END
          `.as('has_date_mismatch'),
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

      // Build count query with same joins and filters
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

      // Combine base exclusion filters with additional filters
      const allFilters = [
        sql`NOT ${isSepoliaCondition}`,
        sql`NOT ${isTestDomainCondition}`,
        ...filters,
      ];
      const whereClause = and(...allFilters);

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
        hasDateMismatch: result.hasDateMismatch,
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
      let parsedDomainName = parseDomainName(normalizedDomainName);

      // If the domain name is a test domain, parse it as a subdomain
      const parts = normalizedDomainName.split('.');
      const lastPart = parts.pop();
      if (!!lastPart && lastPart.startsWith('test')) {
        parsedDomainName = {
          valid: true,
          immediateParentDomain: lastPart as NamefiNormalizedDomain,
          labels: parts,
          level: parts.length,
          registryType: 'subdomain',
          nearestTraditionalParentDomain: lastPart as NamefiNormalizedDomain,
          domain: normalizedDomainName,
        };
      }

      if (!parsedDomainName.valid) {
        // IF it's not valid and not a test domain, throw an error
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

      // Check if there's already an active burn workflow for this domain
      const workflowId = ensureNftIsLockedAndBurnByNftName.generateId({
        domainName: normalizedDomainName,
        chainId,
      });

      try {
        const existingWorkflow =
          await temporalClient.workflow.getHandle(workflowId);
        const description = await existingWorkflow.describe();

        if (description.status.name === 'RUNNING') {
          throw new TRPCError({
            code: 'CONFLICT',
            message:
              'Cannot burn NFT: A burn workflow is already in progress for this domain',
          });
        }
      } catch (error) {
        // Workflow not found, which is fine - we can proceed
        if (error instanceof Error && !error.message.includes('not found')) {
          throw error;
        }
      }

      // Execute the burn workflow
      try {
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
        await temporalClient.connection.ensureConnected();
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

  getActiveBurnWorkflows: adminProcedure.query(async () => {
    try {
      await temporalClient.connection.ensureConnected();
      // Get all active burn workflows from Temporal
      const workflowList = await temporalClient.workflow.list({
        query: `WorkflowType = "ensureNftIsLockedAndBurnByNftName" AND ExecutionStatus = "Running"`,
      });

      const activeWorkflows = [];
      for await (const workflow of workflowList) {
        try {
          // Extract domain name and chain ID from workflow ID
          const workflowIdParts = workflow.workflowId.split('-');
          const domainName = workflowIdParts.slice(0, -1).join('-');
          const chainId = Number.parseInt(
            workflowIdParts[workflowIdParts.length - 1],
          );

          activeWorkflows.push({
            workflowId: workflow.workflowId,
            domainName,
            chainId,
            startTime: workflow.startTime,
            runId: workflow.runId,
            status: workflow.status?.name || 'Running',
          });
        } catch (error) {}
      }

      return activeWorkflows;
    } catch (error) {
      logger.error(
        { context: 'getActiveBurnWorkflows', error },
        'Failed to fetch active burn workflows',
      );
      return [];
    }
  }),

  getActiveFixExpirationWorkflows: adminProcedure.query(async () => {
    try {
      await temporalClient.connection.ensureConnected();
      // Get all active fix NFT expiration workflows from Temporal
      const workflowList = await temporalClient.workflow.list({
        query: `WorkflowType = "fixNftExpirationWorkflow" AND ExecutionStatus = "Running"`,
      });

      const activeWorkflows = [];
      for await (const workflow of workflowList) {
        try {
          // Extract domain name and chain ID from workflow ID
          // Format: admin-fix-nft-expiration-{domainName}-{chainId}-{timestamp}
          const workflowIdParts = workflow.workflowId.split('-');
          if (workflowIdParts.length >= 6) {
            // Skip 'admin', 'fix', 'nft', 'expiration' and take domain name parts
            const domainEndIndex = workflowIdParts.length - 2; // Exclude chainId and timestamp
            const domainName = workflowIdParts
              .slice(4, domainEndIndex)
              .join('-');
            const chainId = Number.parseInt(
              workflowIdParts[workflowIdParts.length - 2],
            );

            activeWorkflows.push({
              workflowId: workflow.workflowId,
              domainName,
              chainId,
              startTime: workflow.startTime,
              runId: workflow.runId,
              status: workflow.status?.name || 'Running',
            });
          }
        } catch (error) {}
      }

      return activeWorkflows;
    } catch (error) {
      logger.error(
        { context: 'getActiveFixExpirationWorkflows', error },
        'Failed to fetch active fix expiration workflows',
      );
      return [];
    }
  }),

  getActiveExtendRegistrationWorkflows: adminProcedure.query(async () => {
    try {
      await temporalClient.connection.ensureConnected();
      // Get all active extend registration workflows from Temporal
      const workflowList = await temporalClient.workflow.list({
        query: `WorkflowType = "extendDomainRegistrationWorkflow" AND ExecutionStatus = "Running"`,
      });

      const activeWorkflows = [];
      for await (const workflow of workflowList) {
        try {
          // Extract domain name and chain ID from workflow ID
          // Format: admin-extend-registration-{domainName}-{chainId}-{timestamp}
          const workflowIdParts = workflow.workflowId.split('-');
          if (workflowIdParts.length >= 5) {
            // Skip 'admin', 'extend', 'registration' and take domain name parts
            const domainEndIndex = workflowIdParts.length - 2; // Exclude chainId and timestamp
            const domainName = workflowIdParts
              .slice(3, domainEndIndex)
              .join('-');
            const chainId = Number.parseInt(
              workflowIdParts[workflowIdParts.length - 2],
            );

            activeWorkflows.push({
              workflowId: workflow.workflowId,
              domainName,
              chainId,
              startTime: workflow.startTime,
              runId: workflow.runId,
              status: workflow.status?.name || 'Running',
            });
          }
        } catch (error) {}
      }

      return activeWorkflows;
    } catch (error) {
      logger.error(
        { context: 'getActiveExtendRegistrationWorkflows', error },
        'Failed to fetch active extend registration workflows',
      );
      return [];
    }
  }),

  extendRegistration: adminProcedure
    .input(
      z.object({
        normalizedDomainName: namefiNormalizedDomainSchema,
        chainId: z.number(),
        durationInYears: z.number().min(1).max(10),
        ownerAddress: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const {
        normalizedDomainName,
        chainId,
        durationInYears,
        ownerAddress,
        userId,
      } = input;

      // Validate domain name
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

      // Generate unique workflow ID
      const workflowId = `admin-extend-registration-${normalizedDomainName}-${chainId}-${Date.now()}`;

      try {
        // Start the extension workflow
        await temporalClient.workflow.start(extendDomainRegistrationWorkflow, {
          args: [
            {
              normalizedDomainName,
              ownerAddress: ownerAddress as any,
              durationInYears,
              userId,
              updateDomainIndex: true,
            },
          ],
          workflowId,
          taskQueue: TEMPORAL_QUEUES.DEFAULT,
          workflowIdConflictPolicy: 'USE_EXISTING',
          workflowIdReusePolicy: 'ALLOW_DUPLICATE',
        });

        return {
          success: true,
          workflowId,
          message: 'Domain extension workflow started successfully',
        };
      } catch (error) {
        logger.error(
          { normalizedDomainName, chainId, durationInYears, error },
          'Failed to start domain extension workflow',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to start domain extension workflow',
          cause: error,
        });
      }
    }),

  fixNftExpiration: adminProcedure
    .input(
      z.object({
        normalizedDomainName: namefiNormalizedDomainSchema,
        chainId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const { normalizedDomainName, chainId } = input;

      // Validate domain name
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

      // Check if there's actually a date mismatch by querying the computed field
      const nftWithMismatchInfo = await db
        .select({
          hasDateMismatch: sql<boolean>`
            CASE 
              WHEN ${namefiNftView.expirationTime} IS NULL OR ${indexedDomainsTable.expirationTime} IS NULL
              THEN false
              ELSE ABS(EXTRACT(EPOCH FROM (${namefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) > 86400
            END
          `.as('has_date_mismatch'),
          nftExpirationTime: namefiNftView.expirationTime,
          domainExpirationTime: indexedDomainsTable.expirationTime,
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
        )
        .where(
          and(
            eq(namefiNftOwnersView.normalizedDomainName, normalizedDomainName),
            eq(namefiNftOwnersView.chainId, chainId),
          ),
        )
        .limit(1);

      if (!nftWithMismatchInfo[0]?.hasDateMismatch) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'No date mismatch found. NFT expiration already matches domain expiration.',
        });
      }

      // Check if either date is missing - these mismatches cannot be fixed
      const { nftExpirationTime, domainExpirationTime } =
        nftWithMismatchInfo[0];
      if (!nftExpirationTime || !domainExpirationTime) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Cannot fix date mismatch: Either NFT or domain expiration date is missing. This type of mismatch cannot be automatically fixed.',
        });
      }

      // Generate unique workflow ID
      const workflowId = `admin-fix-nft-expiration-${normalizedDomainName}-${chainId}-${Date.now()}`;

      try {
        // Start the fix NFT expiration workflow
        await temporalClient.workflow.start(fixNftExpirationWorkflow, {
          args: [
            {
              normalizedDomainName,
              chainId,
            },
          ],
          workflowId,
          taskQueue: TEMPORAL_QUEUES.MINT,
          workflowIdConflictPolicy: 'USE_EXISTING',
          workflowIdReusePolicy: 'ALLOW_DUPLICATE',
        });

        return {
          success: true,
          workflowId,
          message: 'NFT expiration fix workflow started successfully',
        };
      } catch (error) {
        logger.error(
          { normalizedDomainName, chainId, error },
          'Failed to start NFT expiration fix workflow',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to start NFT expiration fix workflow',
          cause: error,
        });
      }
    }),
});

function _buildQueryFilters(
  searchTerm: string | undefined,
  filterBy: string,
  poweredByNamefiDomains: string[],
  excludePoweredByNamefiDomains: boolean,
) {
  // Build filters (base filters for sepolia and test domains are already applied in WHERE clause)
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
  } else if (filterBy === 'dateMismatch') {
    // Filter for domains where NFT and domain expiration dates don't match
    // This includes both cases where dates differ AND where either date is missing
    const isPoweredByNamefiCondition = sql`array_to_string((string_to_array(${namefiNftOwnersView.normalizedDomainName}, '.'))[2:], '.') = ANY(${sql.raw(`ARRAY[${poweredByNamefiDomains.map((d) => `'${d}'`).join(',')}]`)})`;

    filters.push(
      and(
        // Not a powered by namefi domain (they use NFT expiration)
        sql`NOT (${isPoweredByNamefiCondition})`,
        // Either dates are missing OR dates differ by more than 1 day
        or(
          // Either date is missing
          sql`${namefiNftView.expirationTime} IS NULL`,
          sql`${indexedDomainsTable.expirationTime} IS NULL`,
          // Or both dates exist but differ by more than 1 day
          and(
            sql`${namefiNftView.expirationTime} IS NOT NULL`,
            sql`${indexedDomainsTable.expirationTime} IS NOT NULL`,
            sql`ABS(EXTRACT(EPOCH FROM (${namefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) > 86400`,
          ),
        ),
      ),
    );
  } else if (filterBy === 'missingData') {
    // Filter for domains where either NFT or domain expiration data is missing
    const isPoweredByNamefiCondition = sql`array_to_string((string_to_array(${namefiNftOwnersView.normalizedDomainName}, '.'))[2:], '.') = ANY(${sql.raw(`ARRAY[${poweredByNamefiDomains.map((d) => `'${d}'`).join(',')}]`)})`;

    filters.push(
      and(
        // Not a powered by namefi domain (they use NFT expiration)
        sql`NOT (${isPoweredByNamefiCondition})`,
        // Either date is missing
        or(
          sql`${namefiNftView.expirationTime} IS NULL`,
          sql`${indexedDomainsTable.expirationTime} IS NULL`,
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
