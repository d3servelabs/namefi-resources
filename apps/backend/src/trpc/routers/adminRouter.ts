import {
  db,
  namefiNftOwnersView,
  namefiNftView,
  indexedDomainsTable,
} from '@namefi-astra/db';
import {
  CHAINS,
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
import {
  getPoweredByNamefi3PDomains,
  sldRegistrar,
} from '#lib/namefi-registry';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import {
  getPrivyUserLinkedEthereumWalletAddresses,
  privyClient,
} from '../utils';
import { config } from '#lib/env';
import { logger } from '#lib/logger';

/**
 * Convert protobuf WorkflowExecutionStatus enum to readable string
 */
function getWorkflowStatusString(status: any): string {
  if (typeof status === 'string') return status;

  // Handle protobuf enum values
  switch (status) {
    case 0:
    case 'WORKFLOW_EXECUTION_STATUS_UNSPECIFIED':
      return 'UNSPECIFIED';
    case 1:
    case 'WORKFLOW_EXECUTION_STATUS_RUNNING':
      return 'RUNNING';
    case 2:
    case 'WORKFLOW_EXECUTION_STATUS_COMPLETED':
      return 'COMPLETED';
    case 3:
    case 'WORKFLOW_EXECUTION_STATUS_FAILED':
      return 'FAILED';
    case 4:
    case 'WORKFLOW_EXECUTION_STATUS_CANCELED':
      return 'CANCELLED';
    case 5:
    case 'WORKFLOW_EXECUTION_STATUS_TERMINATED':
      return 'TERMINATED';
    case 6:
    case 'WORKFLOW_EXECUTION_STATUS_CONTINUED_AS_NEW':
      return 'CONTINUED_AS_NEW';
    case 7:
    case 'WORKFLOW_EXECUTION_STATUS_TIMED_OUT':
      return 'TIMED_OUT';
    default:
      return status?.toString() || 'Unknown';
  }
}
import { getDomainChain } from '#temporal/activities/domain/index';
import { pluck, values } from 'ramda';

const MAX_GRACE_PERIOD_DAYS = 90; /* 90 days is the max grace period for any registrar */
const DATE_MISMATCH_THRESHOLD_SECONDS = 86400;

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
              WHEN ${indexedDomainsTable.expirationTime} IS NULL OR ${namefiNftView.expirationTime} IS NULL
              THEN true
              WHEN ABS(EXTRACT(EPOCH FROM (${namefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) > ${DATE_MISMATCH_THRESHOLD_SECONDS}
              THEN false
              ELSE (
                ( NOW() - coalesce(${indexedDomainsTable.expirationTime}, ${namefiNftView.expirationTime}) ) > interval '${sql.raw(MAX_GRACE_PERIOD_DAYS.toString())} days'
              )
            END
          `.as('can_burn'),
          hasDateMismatch: sql<boolean>`
            CASE 
              WHEN ${isPoweredByNamefiCondition}
              THEN false
              WHEN ${namefiNftView.expirationTime} IS NULL OR ${indexedDomainsTable.expirationTime} IS NULL
              THEN false
              ELSE ABS(EXTRACT(EPOCH FROM (${namefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) > ${DATE_MISMATCH_THRESHOLD_SECONDS}
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
      const lastPart = parts[parts.length - 1] as NamefiNormalizedDomain;
      if (!!lastPart && lastPart.startsWith('test')) {
        parsedDomainName = {
          valid: true,
          immediateParentDomain: lastPart as NamefiNormalizedDomain,
          labels: parts,
          level: parts.length,
          registryType: 'subdomain',
          nearestTraditionalParentDomain: lastPart as NamefiNormalizedDomain,
          domain: normalizedDomainName,
          publicSuffix: lastPart as NamefiNormalizedDomain,
          publicSuffixPlusOne: parts
            .slice(-2)
            .join('.') as NamefiNormalizedDomain,
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
          const parsedId = ensureNftIsLockedAndBurnByNftName.attemptParseId(
            workflow.workflowId,
          );
          if (!parsedId) {
            continue;
          }
          const { normalizedDomainName, chainId } = parsedId;

          activeWorkflows.push({
            workflowId: workflow.workflowId,
            domainName: normalizedDomainName,
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
          const parsedId = fixNftExpirationWorkflow.attemptParseId(
            workflow.workflowId,
          );
          if (!parsedId) {
            continue;
          }
          const { normalizedDomainName, chainId } = parsedId;

          activeWorkflows.push({
            workflowId: workflow.workflowId,
            domainName: normalizedDomainName,
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
          const parsedId = extendDomainRegistrationWorkflow.attemptParseId(
            workflow.workflowId,
          );
          if (!parsedId) {
            continue;
          }
          const { normalizedDomainName } = parsedId;

          activeWorkflows.push({
            workflowId: workflow.workflowId,
            domainName: normalizedDomainName,
            chainId: await getDomainChain(normalizedDomainName as any),
            startTime: workflow.startTime,
            runId: workflow.runId,
            status: workflow.status?.name || 'Running',
          });
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
      const workflowId = extendDomainRegistrationWorkflow.generateId({
        normalizedDomainName,
        ownerAddress: ownerAddress as any,
        durationInYears,
        userId,
        updateDomainIndex: true,
      });

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
      const workflowId = fixNftExpirationWorkflow.generateId({
        normalizedDomainName,
        chainId,
      });

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

  getWorkflowHistory: adminProcedure
    .input(
      z.object({
        days: z.enum(['1', '3', '7']).default('7'),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        workflowType: z.enum(['all', 'burn', 'fix', 'extend']).default('all'),
        nextPageToken: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { days, page, limit, workflowType, nextPageToken } = input;

      try {
        await temporalClient.connection.ensureConnected();

        // Calculate the date range
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - Number.parseInt(days));

        // Build workflow type filter query
        const workflowTypeFilters = [];
        if (workflowType === 'all' || workflowType === 'burn') {
          workflowTypeFilters.push(
            'WorkflowType = "ensureNftIsLockedAndBurnByNftName"',
          );
        }
        if (workflowType === 'all' || workflowType === 'fix') {
          workflowTypeFilters.push('WorkflowType = "fixNftExpirationWorkflow"');
        }
        if (workflowType === 'all' || workflowType === 'extend') {
          workflowTypeFilters.push(
            'WorkflowType = "extendDomainRegistrationWorkflow"',
          );
        }

        const workflowTypeQuery =
          workflowTypeFilters.length > 1
            ? `(${workflowTypeFilters.join(' OR ')})`
            : workflowTypeFilters[0];

        // Query for workflows started in the last N days
        const query = `${workflowTypeQuery} AND StartTime > "${startTime.toISOString()}"`;

        // Use Temporal's WorkflowService for proper pagination with nextPageToken support
        // This provides efficient server-side pagination without manual iteration
        const listRequest: any = {
          namespace: config.TEMPORAL_NAMESPACE,
          pageSize: limit,
          query: query,
        };

        // Convert nextPageToken string to Uint8Array if provided
        if (nextPageToken) {
          listRequest.nextPageToken = new TextEncoder().encode(nextPageToken);
        }

        const workflowListResponse =
          await temporalClient.workflowService.listWorkflowExecutions(
            listRequest,
          );

        const workflows = [];

        // Process workflows from the response
        for (const workflowExecution of workflowListResponse.executions || []) {
          try {
            const execution = workflowExecution.execution;
            const workflowType = workflowExecution.type;
            const status = workflowExecution.status;
            const startTime = workflowExecution.startTime;
            const closeTime = workflowExecution.closeTime;
            // Convert protobuf status enum to string
            const statusString = getWorkflowStatusString(status);

            const workflowData = {
              workflowId: execution?.workflowId || 'Unknown',
              workflowType: workflowType?.name || 'Unknown',
              status: statusString,
              startTime: startTime?.seconds
                ? new Date(Number(startTime.seconds) * 1000)
                : null,
              closeTime: closeTime?.seconds
                ? new Date(Number(closeTime.seconds) * 1000)
                : null,
              runId: execution?.runId || 'Unknown',
              executionTime:
                closeTime?.seconds && startTime?.seconds
                  ? (Number(closeTime.seconds) - Number(startTime.seconds)) *
                    1000
                  : null,
              domainName: null as string | null,
              chainId: null as number | null,
              error: null as string | null,
            };
            const workflowsByType = {
              ensureNftIsLockedAndBurnByNftName,
              fixNftExpirationWorkflow,
              extendDomainRegistrationWorkflow,
            };

            // Extract domain information from workflow ID based on type
            const workflowTypeName =
              workflowType?.name as keyof typeof workflowsByType;
            if (workflowTypeName && workflowsByType[workflowTypeName]) {
              const parsedWorkflowId = workflowsByType[
                workflowTypeName
              ].attemptParseId(workflowData.workflowId);
              if (parsedWorkflowId) {
                workflowData.domainName = parsedWorkflowId.normalizedDomainName;
                workflowData.chainId = (parsedWorkflowId as any).chainId;
              }
            }

            // If workflow failed, try to get error details
            if (
              workflowData.status === 'FAILED' ||
              workflowData.status === 'TERMINATED'
            ) {
              try {
                const handle = await temporalClient.workflow.getHandle(
                  workflowData.workflowId,
                  workflowData.runId,
                );
                try {
                  await handle.result();
                } catch (workflowError) {
                  workflowData.error =
                    workflowError instanceof Error
                      ? workflowError.message
                      : 'Unknown error';
                }
              } catch {
                // Ignore errors when trying to get workflow result
              }
            }

            workflows.push(workflowData);
          } catch (error) {
            // Log error but continue processing other workflows
            logger.error(
              { workflowId: workflowExecution.execution?.workflowId, error },
              'Failed to process workflow',
            );
          }
        }

        // Extract nextPageToken from response for proper cursor-based pagination
        // Convert Uint8Array back to string for client use
        const rawNextPageToken = (workflowListResponse as any).nextPageToken;
        let responseNextPageToken: string | undefined;

        if (rawNextPageToken && rawNextPageToken.length > 0) {
          try {
            // Ensure we have a valid buffer before decoding
            const buffer =
              rawNextPageToken instanceof Uint8Array
                ? rawNextPageToken
                : new Uint8Array(rawNextPageToken);
            responseNextPageToken = new TextDecoder().decode(buffer);
          } catch (error) {
            logger.warn('Failed to decode nextPageToken', {
              error,
              rawToken: rawNextPageToken,
            });
            responseNextPageToken = undefined;
          }
        }

        // Get accurate total count using Temporal's countWorkflowExecutions API
        let totalCount: number | undefined;
        try {
          const countResponse =
            await temporalClient.workflowService.countWorkflowExecutions({
              namespace: config.TEMPORAL_NAMESPACE,
              query: query,
            });
          totalCount = Number(countResponse.count) || 0;
        } catch (countError) {
          logger.error('Failed to get workflow count from Temporal', {
            countError,
          });
          totalCount = undefined; // Let UI handle the unknown count case
        }

        return {
          data: workflows,
          pagination: {
            page: nextPageToken ? undefined : page, // Page numbers are less meaningful with cursor pagination
            limit,
            totalCount,
            totalPages: totalCount ? Math.ceil(totalCount / limit) : undefined,
            nextPageToken: responseNextPageToken, // Include token for subsequent requests
            hasNextPage: Boolean(responseNextPageToken), // Convenience flag
          },
          temporal: {
            apiUrl: config.TEMPORAL_API_URL,
            namespace: config.TEMPORAL_NAMESPACE,
          },
        };
      } catch (error) {
        logger.error({ error }, 'Failed to fetch workflow history');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch workflow history',
          cause: error,
        });
      }
    }),

  burnAllExpiredDomains: adminProcedure
    .input(
      z.object({
        safeToBurnOnly: z
          .literal(true)
          .describe(
            'This a confirmation flag to only burn domains that are safe to burn, you cannot burn domains that are not safe to burn',
          ),
        dryRun: z.boolean().default(true),
        maxBurns: z.number().min(1).max(100).default(10),
      }),
    )
    .mutation(async ({ input }) => {
      const { dryRun, maxBurns } = input;

      logger.info(
        { dryRun, maxBurns },
        'Starting burn expired domains operation',
      );

      try {
        // Step 1: Get expired domains from registrars
        const expiredDomains = await sldRegistrar.listExpiredDomains();
        logger.info(
          { count: expiredDomains.length },
          'Found expired domains from registrars',
        );

        if (expiredDomains.length === 0) {
          return {
            success: true,
            message: 'No expired domains found from registrars',
            domainsProcessed: 0,
            burnedDomains: [],
            skippedDomains: [],
          };
        }

        // Step 2: Get powered by namefi domains to exclude them
        const poweredByNamefiDomains = [
          ...(await getPoweredByNamefi3PDomains()),
          'withharris.club',
          'withtrump.club',
          'defi.build',
        ];

        // Step 3: Get NFT data for expired domains to determine burn eligibility
        const expiredDomainNames = expiredDomains.map((d) => d.domainName);
        const isPoweredByNamefiCondition = sql<boolean>`array_to_string((string_to_array(${namefiNftOwnersView.normalizedDomainName}, '.'))[2:], '.') = ANY(${sql.raw(`ARRAY[${poweredByNamefiDomains.map((d) => `'${d}'`).join(',')}]`)})`;

        // Build filters to exclude sepolia and test domains (same as reporting)
        const isSepoliaCondition = sql<boolean>`${namefiNftOwnersView.chainId} = 11155111`;
        const isTestDomainCondition = sql<boolean>`split_part(${namefiNftOwnersView.normalizedDomainName}, '.', -1) LIKE 'test%'`;

        const nftDataQuery = db
          .select({
            normalizedDomainName: namefiNftOwnersView.normalizedDomainName,
            chainId: namefiNftOwnersView.chainId,
            ownerAddress: namefiNftOwnersView.ownerAddress,
            nftExpirationTime: namefiNftView.expirationTime,
            domainExpirationTime: indexedDomainsTable.expirationTime,
            registrarKey: indexedDomainsTable.registrarKey,
            // Computed fields
            isPoweredByNamefiDomain: isPoweredByNamefiCondition.as(
              'is_powered_by_namefi_domain',
            ),
            canBurn: sql<boolean>`
              CASE 
                WHEN ${isPoweredByNamefiCondition}
                THEN false
                WHEN ${indexedDomainsTable.expirationTime} IS NULL OR ${namefiNftView.expirationTime} IS NULL
                THEN true
                WHEN ABS(EXTRACT(EPOCH FROM (${namefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) > ${DATE_MISMATCH_THRESHOLD_SECONDS}
                THEN false
                ELSE (
                  ( NOW() - coalesce(${indexedDomainsTable.expirationTime}, ${namefiNftView.expirationTime}) ) > interval '${sql.raw(MAX_GRACE_PERIOD_DAYS.toString())} days'
                )
              END
            `.as('can_burn'),
            hasDateMismatch: sql<boolean>`
              CASE 
                WHEN ${isPoweredByNamefiCondition}
                THEN false
                WHEN ${namefiNftView.expirationTime} IS NULL OR ${indexedDomainsTable.expirationTime} IS NULL
                THEN false
                ELSE ABS(EXTRACT(EPOCH FROM (${namefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) > ${DATE_MISMATCH_THRESHOLD_SECONDS}
              END
            `.as('has_date_mismatch'),
            hasMissingData: sql<boolean>`
              CASE 
                WHEN ${isPoweredByNamefiCondition}
                THEN ${namefiNftView.expirationTime} IS NULL
                ELSE (${namefiNftView.expirationTime} IS NULL OR ${indexedDomainsTable.expirationTime} IS NULL)
              END
            `.as('has_missing_data'),
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
              sql`${namefiNftOwnersView.normalizedDomainName} = ANY(${sql.raw(`ARRAY[${expiredDomainNames.map((d) => `'${d}'`).join(',')}]`)})`,
              sql`NOT ${isSepoliaCondition}`,
              sql`NOT ${isTestDomainCondition}`,
            ),
          );

        const nftData = await nftDataQuery;
        logger.info(
          { count: nftData.length },
          'Found NFT data for expired domains',
        );

        // Step 4: Filter domains that are safe to burn
        // Safe to burn: (canBurn OR hasMissingData) AND NOT isPoweredByNamefiDomain
        const safeToBurnDomains = nftData
          .filter(
            (domain) =>
              !domain.isPoweredByNamefiDomain &&
              (domain.canBurn || domain.hasMissingData),
          )
          .slice(0, maxBurns); // Limit to maxBurns

        const skippedDomains = nftData.filter(
          (domain) =>
            domain.isPoweredByNamefiDomain ||
            (!domain.canBurn && !domain.hasMissingData),
        );

        logger.info(
          {
            safeToBurn: safeToBurnDomains.length,
            skipped: skippedDomains.length,
            dryRun,
          },
          'Identified domains for burning',
        );

        if (dryRun) {
          return {
            success: true,
            message: `DRY RUN: Would burn ${safeToBurnDomains.length} domains`,
            domainsProcessed: nftData.length,
            burnedDomains: safeToBurnDomains.map((d) => ({
              normalizedDomainName: d.normalizedDomainName,
              chainId: d.chainId,
              reason: d.canBurn
                ? 'Can burn (beyond grace period)'
                : 'Missing data',
              nftExpirationTime: d.nftExpirationTime,
              domainExpirationTime: d.domainExpirationTime,
              dryRun: true,
            })),
            skippedDomains: skippedDomains.map((d) => ({
              normalizedDomainName: d.normalizedDomainName,
              chainId: d.chainId,
              reason: d.isPoweredByNamefiDomain
                ? 'Powered by Namefi domain (cannot burn)'
                : 'Not eligible for burning',
              nftExpirationTime: d.nftExpirationTime,
              domainExpirationTime: d.domainExpirationTime,
            })),
          };
        }

        // Step 5: Execute burn operations (if not dry run)
        const burnResults = [];
        const burnErrors = [];

        for (const domain of safeToBurnDomains) {
          try {
            const workflowId = ensureNftIsLockedAndBurnByNftName.generateId({
              domainName: domain.normalizedDomainName,
              chainId: domain.chainId,
            });

            // Check if there's already an active burn workflow for this domain
            try {
              const existingWorkflow =
                await temporalClient.workflow.getHandle(workflowId);
              const description = await existingWorkflow.describe();

              if (description.status.name === 'RUNNING') {
                burnErrors.push({
                  normalizedDomainName: domain.normalizedDomainName,
                  chainId: domain.chainId,
                  error: 'Burn workflow already in progress',
                  nftExpirationTime: domain.nftExpirationTime,
                  domainExpirationTime: domain.domainExpirationTime,
                });
                continue;
              }
            } catch (error) {
              // Workflow not found, which is fine - we can proceed
              if (
                error instanceof Error &&
                !error.message.includes('not found')
              ) {
                throw error;
              }
            }

            // Start the burn workflow
            await temporalClient.workflow.start(
              ensureNftIsLockedAndBurnByNftName,
              {
                args: [
                  {
                    domainName: domain.normalizedDomainName,
                    chainId: domain.chainId,
                  },
                ],
                workflowId,
                taskQueue: TEMPORAL_QUEUES.MINT,
                workflowIdConflictPolicy: 'USE_EXISTING',
                workflowIdReusePolicy: 'ALLOW_DUPLICATE',
              },
            );

            burnResults.push({
              normalizedDomainName: domain.normalizedDomainName,
              chainId: domain.chainId,
              workflowId,
              reason: domain.canBurn
                ? 'Can burn (beyond grace period)'
                : 'Missing data',
              nftExpirationTime: domain.nftExpirationTime,
              domainExpirationTime: domain.domainExpirationTime,
              status: 'Started',
            });

            logger.info(
              {
                domain: domain.normalizedDomainName,
                chainId: domain.chainId,
                workflowId,
              },
              'Started burn workflow for expired domain',
            );
          } catch (error) {
            logger.error(
              {
                domain: domain.normalizedDomainName,
                chainId: domain.chainId,
                error,
              },
              'Failed to start burn workflow',
            );

            burnErrors.push({
              normalizedDomainName: domain.normalizedDomainName,
              chainId: domain.chainId,
              error: error instanceof Error ? error.message : 'Unknown error',
              nftExpirationTime: domain.nftExpirationTime,
              domainExpirationTime: domain.domainExpirationTime,
            });
          }
        }

        return {
          success: true,
          message: `Successfully started burn workflows for ${burnResults.length} domains`,
          domainsProcessed: nftData.length,
          burnedDomains: burnResults,
          skippedDomains: skippedDomains.map((d) => ({
            normalizedDomainName: d.normalizedDomainName,
            chainId: d.chainId,
            reason: d.isPoweredByNamefiDomain
              ? 'Powered by Namefi domain (cannot burn)'
              : 'Not eligible for burning',
          })),
          errors: burnErrors,
        };
      } catch (error) {
        logger.error({ error }, 'Failed to burn expired domains');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to burn expired domains',
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
    // Exclude powered-by-namefi domains from expired count (consistent with reporting logic)
    const isPoweredByNamefiCondition = sql`array_to_string((string_to_array(${namefiNftOwnersView.normalizedDomainName}, '.'))[2:], '.') = ANY(${sql.raw(`ARRAY[${poweredByNamefiDomains.map((d) => `'${d}'`).join(',')}]`)})`;

    filters.push(
      and(
        // Not a powered by namefi domain
        sql`NOT (${isPoweredByNamefiCondition})`,
        // Expired condition
        or(
          // Domain expired
          sql`${indexedDomainsTable.expirationTime} < NOW()`,
          isNull(indexedDomainsTable.expirationTime),
          // NFT expired
          sql`${namefiNftView.expirationTime} < NOW()`,
        ),
      ),
    );
  } else if (filterBy === 'canBurn') {
    // For canBurn, we need to check:
    // 1. Missing data OR (no date mismatch AND beyond grace period)
    // 2. NOT a powered by namefi domain (they can't be burned)
    const isPoweredByNamefiCondition = sql`array_to_string((string_to_array(${namefiNftOwnersView.normalizedDomainName}, '.'))[2:], '.') = ANY(${sql.raw(`ARRAY[${poweredByNamefiDomains.map((d) => `'${d}'`).join(',')}]`)})`;

    filters.push(
      and(
        // Not a powered by namefi domain
        sql`NOT (${isPoweredByNamefiCondition})`,
        // Can burn logic: missing data OR (no date mismatch AND beyond grace period)
        or(
          // Missing data - can burn
          and(
            or(
              isNull(indexedDomainsTable.expirationTime),
              isNull(namefiNftView.expirationTime),
            ),
          ),
          // No date mismatch AND beyond grace period
          and(
            // No significant date mismatch (< 1 day difference)
            sql`ABS(EXTRACT(EPOCH FROM (${namefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) <= ${DATE_MISMATCH_THRESHOLD_SECONDS}`,
            // Beyond grace period
            sql`( NOW() - coalesce(${indexedDomainsTable.expirationTime}, ${namefiNftView.expirationTime}) ) > interval '${sql.raw(MAX_GRACE_PERIOD_DAYS.toString())} days'`,
          ),
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
            sql`ABS(EXTRACT(EPOCH FROM (${namefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) > ${DATE_MISMATCH_THRESHOLD_SECONDS}`,
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
