import {
  db,
  namefiNftOwnersView,
  namefiNftView,
  indexedDomainsTable,
  freeClaimsTable,
  usersTable,
  orderItemsTable,
  ordersTable,
  paymentsTable,
  namefiNftCte,
  namefiNftOwnersCte,
  domainExportTrackingTable,
  domainConfigTable,
  domainUserPreferencesTable,
} from '@namefi-astra/db';
import {
  buildWhereClause,
  buildSortClause,
  type FilterOptions,
  type SortOptions,
} from '@samyx/drizzler-filters-sorters';
import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
  checksumWalletAddressSchema,
  Permission,
} from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, isNull, or, lt, type SQL, sql } from 'drizzle-orm';
import { z } from 'zod';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import { ensureNftIsLockedAndBurnByNftName } from '#temporal/workflows/mint.workflow';
import { extendDomainRegistrationWorkflow } from '#temporal/workflows/domain-ownership/extend-registration.workflow';
import { fixNftExpirationWorkflow } from '#temporal/workflows/fix-nft-expiration.workflow';
import {
  bulkBurnExpiredDomainsWorkflow,
  bulkBurnApprovalSignal,
  bulkBurnCancelSignal,
  getBulkBurnWorkflowStateQuery,
  type BulkBurnWorkflowState,
} from '#temporal/workflows/bulk-burn-expired-domains.workflow';
import {
  getUserIdFromOwnerAddress,
  sendPendingExportEmail,
  sendExportCompleteEmail,
} from '#temporal/activities/domain/export-tracking.activities';
import {
  appendExportTrackingStatusHistory,
  canApproveExportTrackingStatus,
  canResolveExportTrackingStatus,
  getExportTrackingEmailType,
  type ExportTrackingStatusHistoryEntry,
} from '#temporal/activities/domain/export-tracking-state';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
  createTRPCRouter,
  protectedProcedure,
} from '../base';
import {
  getPoweredByNamefi3PDomains,
  sldRegistrar,
} from '#lib/namefi-registry';
import { updateDomainPreferencesAndConfig } from '#lib/domains/domain-preferences';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import {
  getPrivyUserLinkedEthereumWalletAddresses,
  privyClient,
} from '../utils';
import { config } from '#lib/env';
import { logger } from '#lib/logger';
import { getDomainChain } from '#temporal/activities/domain/index';
import { resolveEnsNameToAddress } from '#lib/crypto/ens';
import { schedulesRouter } from './admin/schedulesRouter';
import { poweredByNamefiRouter } from './admin/poweredByNamefiRouter';
import { permissionsRouter } from './admin/permissionsRouter';
import { nfscRouter } from './admin/nfscRouter';
import { eppTestingRouter } from './admin/eppTestingRouter';
import { emailCampaignsRouter } from './admin/emailCampaignsRouter';
import { ResourceType } from '#lib/auditor';
import {
  canUserAccessAdminPanel,
  getAllUsersThatCanAccessAdminPanel,
} from '../utils';
import {
  buildPrivySearchWhereClause,
  ensurePrivyTableFresh,
  privyUsersTableSchema,
  userNftsCTE,
} from './admin/privyUserCache';
import { triggerUpdatePrivyCache } from '../../temporal/schedules/update-privy-cache';
import { getPrivyCacheStatus } from '../../temporal/activities/indexers/privy-cache.activities';
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

const MAX_GRACE_PERIOD_DAYS = 90; /* 90 days is the max grace period for any registrar */
const DATE_MISMATCH_THRESHOLD_SECONDS = 86400;

export const adminRouter = createTRPCRouter({
  getNftsWithExpirationStatus: adminProcedureWithPermissions(
    Permission.READ_NFT,
  )
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
        .with(namefiNftOwnersCte, namefiNftCte)
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
        .with(namefiNftOwnersCte, namefiNftCte)
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

  burnNft: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NFT,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'domain',
      resourceId: input.normalizedDomainName,
      action: 'start_burn_nft_workflow',
      extraInput: input,
    }),
  )
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
        .with(namefiNftOwnersCte)
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

  getBurnWorkflowStatus: adminProcedureWithPermissions(Permission.READ_NFT)
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
    return await canUserAccessAdminPanel(ctx.user);
  }),

  getActiveBurnWorkflows: adminProcedureWithPermissions(
    Permission.READ_NFT,
  ).query(async () => {
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

  // Bulk Burn Workflow Management
  getAllBulkBurnWorkflows: adminProcedureWithPermissions(
    Permission.WRITE_NFT,
  ).query(async () => {
    try {
      await temporalClient.connection.ensureConnected();

      // Query for all bulk burn workflows (running and completed)
      const workflowList = await temporalClient.workflow.list({
        query: 'WorkflowType = "bulkBurnExpiredDomainsWorkflow"',
      });

      const workflows = [];
      for await (const workflowInfo of workflowList) {
        try {
          const workflowHandle = temporalClient.workflow.getHandle(
            workflowInfo.workflowId,
          );

          let state: BulkBurnWorkflowState | null = null;

          // Only query state if workflow is still running
          if (workflowInfo.status?.name === 'RUNNING') {
            try {
              state = await workflowHandle.query(getBulkBurnWorkflowStateQuery);
            } catch (error) {
              logger.warn(
                { workflowId: workflowInfo.workflowId, error },
                'Failed to query running workflow state',
              );
            }
          }

          workflows.push({
            workflowId: workflowInfo.workflowId,
            status: workflowInfo.status?.name || 'Unknown',
            startTime: workflowInfo.startTime,
            closeTime: workflowInfo.closeTime,
            runId: workflowInfo.runId,
            state: state || undefined,
          });
        } catch (error) {
          logger.error(
            { workflowId: workflowInfo.workflowId, error },
            'Failed to process bulk burn workflow',
          );
        }
      }

      // Sort by start time descending (most recent first)
      workflows.sort((a, b) => {
        const aTime = a.startTime ? new Date(a.startTime).getTime() : 0;
        const bTime = b.startTime ? new Date(b.startTime).getTime() : 0;
        return bTime - aTime;
      });

      return workflows;
    } catch (error) {
      logger.error(
        { context: 'getAllBulkBurnWorkflows', error },
        'Failed to fetch bulk burn workflows',
      );
      return [];
    }
  }),

  getBulkBurnWorkflowById: adminProcedureWithPermissions(Permission.WRITE_NFT)
    .input(
      z.object({
        workflowId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { workflowId } = input;

      try {
        await temporalClient.connection.ensureConnected();

        const workflowHandle = temporalClient.workflow.getHandle(workflowId);
        const workflowInfo = await workflowHandle.describe();

        let state: BulkBurnWorkflowState | null = null;

        // Try to query state
        try {
          state = await workflowHandle.query(getBulkBurnWorkflowStateQuery);
        } catch (error) {
          logger.warn(
            { workflowId, error },
            'Failed to query workflow state (may be completed)',
          );
        }

        return {
          exists: true,
          workflowId: workflowInfo.workflowId,
          status:
            state?.currentStatus || workflowInfo.status?.name || 'Unknown',
          startTime: workflowInfo.startTime,
          closeTime: workflowInfo.closeTime,
          runId: workflowInfo.runId,
          state: state
            ? {
                currentStatus: state.currentStatus,
                totalRequested: state.totalRequested,
                verifiedDomains: state.verifiedDomains,
                skippedDomains: state.skippedDomains,
                approvedDomains: state.approvedDomains,
                successfulBurns: state.successfulBurns,
                failedBurns: state.failedBurns,
                verificationTime: state.verificationTime,
                approvalTime: state.approvalTime,
                completionTime: state.completionTime,
              }
            : undefined,
        };
      } catch (error) {
        logger.error(
          { workflowId, error },
          'Failed to fetch bulk burn workflow by ID',
        );
        return {
          exists: false,
        };
      }
    }),

  getPendingBulkBurnWorkflow: adminProcedureWithPermissions(
    Permission.WRITE_NFT,
  ).query(async () => {
    try {
      await temporalClient.connection.ensureConnected();

      // Query for bulk burn workflows in RUNNING state
      const workflowList = await temporalClient.workflow.list({
        query:
          'WorkflowType = "bulkBurnExpiredDomainsWorkflow" AND ExecutionStatus = "Running"',
      });

      // Get the first (and should be only) running bulk burn workflow
      for await (const workflowInfo of workflowList) {
        try {
          const workflowHandle = temporalClient.workflow.getHandle(
            workflowInfo.workflowId,
          );

          // Query the workflow state
          const state: BulkBurnWorkflowState = await workflowHandle.query(
            getBulkBurnWorkflowStateQuery,
          );

          return {
            exists: true,
            workflowId: workflowInfo.workflowId,
            status: state.currentStatus,
            startTime: workflowInfo.startTime,
            runId: workflowInfo.runId,
            state: {
              currentStatus: state.currentStatus,
              totalRequested: state.totalRequested,
              verifiedDomains: state.verifiedDomains,
              skippedDomains: state.skippedDomains,
              approvedDomains: state.approvedDomains,
              successfulBurns: state.successfulBurns,
              failedBurns: state.failedBurns,
              verificationTime: state.verificationTime,
              approvalTime: state.approvalTime,
              completionTime: state.completionTime,
            },
          };
        } catch (error) {
          logger.error(
            { workflowId: workflowInfo.workflowId, error },
            'Failed to query bulk burn workflow state',
          );
        }
      }

      return {
        exists: false,
      };
    } catch (error) {
      logger.error(
        { context: 'getPendingBulkBurnWorkflow', error },
        'Failed to fetch pending bulk burn workflow',
      );
      return {
        error: 'Failed to fetch pending bulk burn workflow',
        errorCode: 'INTERNAL_SERVER_ERROR',
        exists: false,
      };
    }
  }),

  approveBulkBurn: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NFT,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.BULK_BURN,
      resourceId: input.workflowId,
      action: 'approve_bulk_burn',
      extraInput: input,
    }),
  )
    .input(
      z.object({
        workflowId: z.string(),
        domainNames: z.array(namefiNormalizedDomainSchema),
      }),
    )
    .mutation(async ({ input }) => {
      const { workflowId, domainNames } = input;
      if (domainNames.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'At least one domain must be selected for approval',
        });
      }

      try {
        await temporalClient.connection.ensureConnected();

        const workflowHandle = temporalClient.workflow.getHandle(workflowId);

        // Send approval signal with selected domains
        await workflowHandle.signal(bulkBurnApprovalSignal, domainNames);

        logger.debug(
          { workflowId, approvedCount: domainNames.length },
          'Bulk burn approval signal sent',
        );

        return {
          success: true,
          workflowId,
          approvedCount: domainNames.length,
        };
      } catch (error) {
        logger.error(
          { workflowId, error },
          'Failed to send bulk burn approval signal',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to approve bulk burn',
          cause: error,
        });
      }
    }),

  cancelBulkBurn: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NFT,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.BULK_BURN,
      resourceId: input.workflowId,
      action: 'cancel_bulk_burn',
      extraInput: input,
    }),
  )
    .input(
      z.object({
        workflowId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { workflowId } = input;

      try {
        await temporalClient.connection.ensureConnected();

        const workflowHandle = temporalClient.workflow.getHandle(workflowId);

        // Send cancellation signal
        await workflowHandle.signal(bulkBurnCancelSignal);

        logger.debug({ workflowId }, 'Bulk burn cancellation signal sent');

        return {
          success: true,
          workflowId,
        };
      } catch (error) {
        logger.error(
          { workflowId, error },
          'Failed to send bulk burn cancellation signal',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel bulk burn',
          cause: error,
        });
      }
    }),

  getActiveFixExpirationWorkflows: adminProcedureWithPermissions(
    Permission.READ_NFT,
  ).query(async () => {
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

  getActiveExtendRegistrationWorkflows: adminProcedureWithPermissions(
    Permission.READ_NFT,
  ).query(async () => {
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

  extendRegistration: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NFT,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'domain',
      resourceId: input.normalizedDomainName,
      action: 'start_extend_registration_workflow',
      extraInput: input,
    }),
  )
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
        .with(namefiNftOwnersCte)
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

  fixNftExpiration: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NFT,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'domain',
      resourceId: input.normalizedDomainName,
      action: 'start_fix_nft_expiration_workflow',
      extraInput: input,
    }),
  )
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
        .with(namefiNftOwnersCte)
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
        .with(namefiNftOwnersCte, namefiNftCte)
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

  getWorkflowHistory: adminProcedureWithPermissions(Permission.READ_NFT)
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

  // Free Claims Management
  getFreeClaimsWithPagination: adminProcedureWithPermissions(
    Permission.READ_FREE_CLAIMS,
  )
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        sortBy: z
          .enum([
            'groupOrCampaignKey',
            'reason',
            'exactDomainName',
            'parentDomain',
            'expirationDate',
            'createdAt',
          ])
          .default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        searchTerm: z.string().optional(),
        status: z.enum(['all', 'IDLE', 'CLAIMING', 'CLAIMED']).default('all'),
      }),
    )
    .query(async ({ input }) => {
      const { page, limit, sortBy, sortOrder, searchTerm, status } = input;
      const offset = (page - 1) * limit;

      // Build base query
      const baseQuery = db.select().from(freeClaimsTable);
      const baseCountQuery = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(freeClaimsTable);

      // Build filters
      const filters = [];

      if (searchTerm) {
        filters.push(
          or(
            sql`${freeClaimsTable.groupOrCampaignKey} ILIKE ${'%' + searchTerm + '%'}`,
            sql`${freeClaimsTable.reason} ILIKE ${'%' + searchTerm + '%'}`,
            sql`${freeClaimsTable.exactDomainName} ILIKE ${'%' + searchTerm + '%'}`,
            sql`${freeClaimsTable.parentDomain} ILIKE ${'%' + searchTerm + '%'}`,
          ),
        );
      }

      if (status !== 'all') {
        filters.push(eq(freeClaimsTable.claimingStatus, status));
      }

      const whereClause = filters.length > 0 ? and(...filters) : undefined;

      const query = whereClause ? baseQuery.where(whereClause) : baseQuery;
      const countQuery = whereClause
        ? baseCountQuery.where(whereClause)
        : baseCountQuery;

      // Apply sorting
      let orderByClause: SQL<unknown>;
      switch (sortBy) {
        case 'groupOrCampaignKey':
          orderByClause =
            sortOrder === 'asc'
              ? asc(freeClaimsTable.groupOrCampaignKey)
              : desc(freeClaimsTable.groupOrCampaignKey);
          break;
        case 'reason':
          orderByClause =
            sortOrder === 'asc'
              ? asc(freeClaimsTable.reason)
              : desc(freeClaimsTable.reason);
          break;
        case 'exactDomainName':
          orderByClause =
            sortOrder === 'asc'
              ? sql`${freeClaimsTable.exactDomainName} ASC NULLS LAST`
              : sql`${freeClaimsTable.exactDomainName} DESC NULLS LAST`;
          break;
        case 'parentDomain':
          orderByClause =
            sortOrder === 'asc'
              ? sql`${freeClaimsTable.parentDomain} ASC NULLS LAST`
              : sql`${freeClaimsTable.parentDomain} DESC NULLS LAST`;
          break;
        case 'expirationDate':
          orderByClause =
            sortOrder === 'asc'
              ? sql`${freeClaimsTable.expirationDate} ASC NULLS LAST`
              : sql`${freeClaimsTable.expirationDate} DESC NULLS LAST`;
          break;
        case 'createdAt':
        default:
          orderByClause =
            sortOrder === 'asc'
              ? asc(freeClaimsTable.createdAt)
              : desc(freeClaimsTable.createdAt);
          break;
      }

      // Execute queries
      const [results, countResult] = await Promise.all([
        query.orderBy(orderByClause).limit(limit).offset(offset),
        countQuery,
      ]);

      const totalCount = countResult[0]?.count ?? 0;

      return {
        data: results,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    }),

  createFreeClaim: auditedAdminProcedureWithPermissions(
    Permission.WRITE_FREE_CLAIMS,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'user',
      resourceId: input.userId,
      action: 'grant_free_claim',
      extraInput: input,
    }),
  )
    .input(
      z
        .object({
          userId: z.string().uuid(),
          groupOrCampaignKey: z.string().min(1),
          reason: z.string().min(1),
          exactDomainName: namefiNormalizedDomainSchema.optional(),
          parentDomain: namefiNormalizedDomainSchema.optional(),
          expirationDate: z.date().optional(),
        })
        .refine((data) => data.exactDomainName || data.parentDomain, {
          message: 'Either exactDomainName or parentDomain must be provided',
          path: ['exactDomainName', 'parentDomain'],
        })
        .refine((data) => !(data.exactDomainName && data.parentDomain), {
          message: 'Cannot specify both exactDomainName and parentDomain',
          path: ['exactDomainName', 'parentDomain'],
        }),
    )
    .mutation(async ({ input }) => {
      const {
        userId,
        groupOrCampaignKey,
        reason,
        exactDomainName,
        parentDomain,
        expirationDate,
      } = input;

      try {
        const newClaim = await db
          .insert(freeClaimsTable)
          .values({
            userId,
            groupOrCampaignKey,
            reason: reason || null,
            exactDomainName: exactDomainName || null,
            parentDomain: parentDomain || null,
            expirationDate: expirationDate || null,
            claimingStatus: 'IDLE',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        return {
          success: true,
          claim: newClaim[0],
        };
      } catch (error) {
        logger.error({ error, input }, 'Failed to create free claim');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create free claim',
        });
      }
    }),

  updateFreeClaim: auditedAdminProcedureWithPermissions(
    Permission.WRITE_FREE_CLAIMS,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.FREE_CLAIM,
      resourceId: input.id,
      action: 'update_free_claim',
      extraInput: input,
    }),
  )
    .input(
      z.object({
        id: z.string().uuid(),
        groupOrCampaignKey: z.string().min(1).optional(),
        reason: z.string().min(1).optional(),
        exactDomainName: namefiNormalizedDomainSchema.optional(),
        parentDomain: namefiNormalizedDomainSchema.optional(),
        expirationDate: z.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      try {
        const updatedClaim = await db.transaction(async (tx) => {
          // First, select and lock the claim to ensure it's IDLE
          const existingClaim = await tx
            .select()
            .from(freeClaimsTable)
            .where(eq(freeClaimsTable.id, id))
            .for('update')
            .limit(1);

          if (existingClaim.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Free claim not found',
            });
          }

          const claim = existingClaim[0];

          // Only allow updates if the claim is IDLE
          if (claim.claimingStatus !== 'IDLE') {
            throw new TRPCError({
              code: 'CONFLICT',
              message: `Cannot update claim: current status is ${claim.claimingStatus}. Only IDLE claims can be updated.`,
            });
          }

          // Perform the update
          const updated = await tx
            .update(freeClaimsTable)
            .set({
              ...updateData,
              updatedAt: new Date(),
            })
            .where(eq(freeClaimsTable.id, id))
            .returning();

          return updated[0];
        });

        return {
          success: true,
          claim: updatedClaim,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error({ error, input }, 'Failed to update free claim');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update free claim',
        });
      }
    }),

  deleteFreeClaim: auditedAdminProcedureWithPermissions(
    Permission.WRITE_FREE_CLAIMS,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.FREE_CLAIM,
      resourceId: input.id,
      action: 'revoke_free_claim',
      extraInput: input,
    }),
  )
    .input(
      z.object({
        id: z.string().uuid(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id } = input;

      try {
        const deletedClaim = await db.transaction(async (tx) => {
          // First, select and lock the claim to ensure it's IDLE
          const existingClaim = await tx
            .select()
            .from(freeClaimsTable)
            .where(eq(freeClaimsTable.id, id))
            .for('update')
            .limit(1);

          if (existingClaim.length === 0) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Free claim not found',
            });
          }

          const claim = existingClaim[0];

          // Only allow deletion if the claim is IDLE
          if (claim.claimingStatus !== 'IDLE') {
            throw new TRPCError({
              code: 'CONFLICT',
              message: `Cannot delete claim: current status is ${claim.claimingStatus}. Only IDLE claims can be deleted.`,
            });
          }

          // Perform the deletion
          const deleted = await tx
            .delete(freeClaimsTable)
            .where(eq(freeClaimsTable.id, id))
            .returning();

          return deleted[0];
        });

        return {
          success: true,
          claim: deletedClaim,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error({ error, input }, 'Failed to delete free claim');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete free claim',
        });
      }
    }),

  searchUsers: adminProcedureWithPermissions(Permission.READ_USERS)
    .input(
      z.object({
        searchTerm: z.string().min(1).max(100),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ input }) => {
      const { searchTerm, limit } = input;

      try {
        // Helper function to get user details from database
        const getUserFromDatabase = async (privyUserId: string) => {
          const user = await db.query.usersTable.findFirst({
            where: eq(usersTable.privyUserId, privyUserId),
            columns: {
              id: true,
              privyUserId: true,
              primaryEmail: true,
            },
          });
          return user;
        };

        // Helper function to format user response
        const formatUserResponse = async (privyUser: any, dbUser?: any) => {
          const walletAddresses = getPrivyUserLinkedEthereumWalletAddresses({
            privyUser,
          });

          return {
            id: dbUser?.id || null,
            privyUserId: privyUser.id,
            primaryEmail:
              dbUser?.primaryEmail || privyUser.email?.address || null,
            walletAddresses,
            displayName: privyUser.email?.address?.split('@')[0] || null,
          };
        };

        // Determine search type and resolve to privyUserId or userUuid
        const trimmedSearchTerm = searchTerm.trim();
        let privyUser = null;
        let searchResults: any[] = [];

        // Check if it's a UUID (our user ID format)
        const uuidValidation = z.string().uuid().safeParse(trimmedSearchTerm);
        if (uuidValidation.success) {
          // Search by user UUID in our database
          const dbUser = await db.query.usersTable.findFirst({
            where: eq(usersTable.id, trimmedSearchTerm),
            columns: {
              id: true,
              privyUserId: true,
              primaryEmail: true,
            },
          });

          if (dbUser) {
            try {
              privyUser = await privyClient.getUserById(dbUser.privyUserId);
              if (privyUser) {
                searchResults.push(await formatUserResponse(privyUser, dbUser));
              }
            } catch (error) {
              logger.warn(
                { userId: dbUser.id, privyUserId: dbUser.privyUserId, error },
                'Failed to fetch Privy user by ID',
              );
            }
          }
        }
        // Check if it's a Privy user ID (starts with 'did:privy:')
        else if (trimmedSearchTerm.startsWith('did:privy:')) {
          try {
            privyUser = await privyClient.getUserById(trimmedSearchTerm);
            if (privyUser) {
              const dbUser = await getUserFromDatabase(privyUser.id);
              searchResults.push(await formatUserResponse(privyUser, dbUser));
            }
          } catch (error) {
            logger.warn(
              { privyUserId: trimmedSearchTerm, error },
              'Failed to fetch Privy user by Privy ID',
            );
          }
        }
        // Check if it's a wallet address
        else {
          const walletValidation =
            checksumWalletAddressSchema.safeParse(trimmedSearchTerm);
          if (walletValidation.success) {
            try {
              privyUser = await privyClient.getUserByWalletAddress(
                walletValidation.data,
              );
              if (privyUser) {
                const dbUser = await getUserFromDatabase(privyUser.id);
                searchResults.push(await formatUserResponse(privyUser, dbUser));
              }
            } catch (error) {
              logger.warn(
                { walletAddress: trimmedSearchTerm, error },
                'Failed to fetch Privy user by wallet address',
              );
            }
          }
          // Check if it's an email address
          else {
            const emailValidation = z
              .string()
              .email()
              .safeParse(trimmedSearchTerm);
            if (emailValidation.success) {
              try {
                privyUser = await privyClient.getUserByEmail(trimmedSearchTerm);
                if (privyUser) {
                  const dbUser = await getUserFromDatabase(privyUser.id);
                  searchResults.push(
                    await formatUserResponse(privyUser, dbUser),
                  );
                }
              } catch (error) {
                logger.warn(
                  { email: trimmedSearchTerm, error },
                  'Failed to fetch Privy user by email',
                );
              }
            }
            // Check if it looks like a domain (potential ENS name)
            else if (
              trimmedSearchTerm.includes('.') &&
              !trimmedSearchTerm.includes('@')
            ) {
              try {
                const resolvedAddress =
                  await resolveENSToWallet(trimmedSearchTerm);
                if (resolvedAddress) {
                  privyUser =
                    await privyClient.getUserByWalletAddress(resolvedAddress);
                  if (privyUser) {
                    const dbUser = await getUserFromDatabase(privyUser.id);
                    searchResults.push(
                      await formatUserResponse(privyUser, dbUser),
                    );
                  }
                }
              } catch (error) {
                logger.warn(
                  { ensName: trimmedSearchTerm, error },
                  'Failed to resolve ENS and fetch user',
                );
              }
            }
            // If none of the above, search our database for partial email matches
            else {
              const dbUsers = await db
                .select({
                  id: usersTable.id,
                  privyUserId: usersTable.privyUserId,
                  primaryEmail: usersTable.primaryEmail,
                })
                .from(usersTable)
                .where(
                  usersTable.primaryEmail
                    ? sql`${usersTable.primaryEmail} ILIKE ${`%${trimmedSearchTerm}%`}`
                    : sql`false`,
                )
                .limit(limit);

              // Get Privy details for each found user
              const userDetails = await Promise.allSettled(
                dbUsers.map(async (dbUser) => {
                  try {
                    const privyUser = await privyClient.getUserById(
                      dbUser.privyUserId,
                    );
                    return await formatUserResponse(privyUser, dbUser);
                  } catch (error) {
                    logger.warn(
                      {
                        userId: dbUser.id,
                        privyUserId: dbUser.privyUserId,
                        error,
                      },
                      'Failed to fetch Privy user details for partial search',
                    );
                    return {
                      id: dbUser.id,
                      privyUserId: dbUser.privyUserId,
                      primaryEmail: dbUser.primaryEmail,
                      walletAddresses: [],
                      displayName: null,
                    };
                  }
                }),
              );

              searchResults = userDetails
                .filter(
                  (result): result is PromiseFulfilledResult<any> =>
                    result.status === 'fulfilled',
                )
                .map((result) => result.value);
            }
          }
        }

        // Filter out users without a database record (only show users in our system)
        const validResults = searchResults.filter((user) => user.id !== null);

        return validResults.slice(0, limit);
      } catch (error) {
        logger.error({ error, searchTerm }, 'Failed to search users');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search users',
        });
      }
    }),

  listUsers: adminProcedureWithPermissions(Permission.READ_USERS)
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(25),
        searchTerm: z.string().optional(),
        domainSearchTerm: z.string().optional(),
        ensSearchTerm: z.string().optional(),
        columnFilters: z
          .array(
            z.object({
              id: z.string(),
              value: z.object({
                operator: z.enum([
                  'like',
                  'eq',
                  'neq',
                  'gt',
                  'gte',
                  'lt',
                  'lte',
                ]),
                value: z.union([z.string(), z.number(), z.date()]),
              }),
            }),
          )
          .optional(),
        sorting: z
          .array(
            z.object({
              id: z.string(),
              desc: z.boolean(),
            }),
          )
          .optional(),
      }),
    )
    .query(async ({ input }) => {
      const {
        page,
        pageSize,
        searchTerm,
        domainSearchTerm,
        ensSearchTerm,
        columnFilters,
        sorting,
      } = input;
      const offset = (page - 1) * pageSize;

      // Fetch admin users once to avoid per-user checks
      const adminIdsSet = await getAllUsersThatCanAccessAdminPanel();

      // Trigger Privy cache refresh workflow (non-blocking, respects 15-min cache)
      // and get the current cache status concurrently
      const [cacheRefreshResult, cacheStatus] = await Promise.all([
        triggerUpdatePrivyCache(false).catch((error) => {
          logger.warn({ error }, 'Failed to trigger Privy cache refresh');
          return null;
        }),
        getPrivyCacheStatus().catch((error) => {
          logger.warn({ error }, 'Failed to get Privy cache status');
          return null;
        }),
      ]);

      // Build base query using the CTE
      const baseQuery = db
        .with(userNftsCTE)
        .select({
          id: usersTable.id,
          privyUserId: usersTable.privyUserId,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
          lastSignInAt: usersTable.lastSignInAt,
          twitterUsername: privyUsersTableSchema.twitterUsername,
          twitterDetails: privyUsersTableSchema.twitterDetails,
          primaryEmail: sql<
            string | null
          >`COALESCE(${usersTable.primaryEmail}, ${privyUsersTableSchema.email})`.as(
            'primary_email',
          ),
          displayName: privyUsersTableSchema.displayName,
          wallets: privyUsersTableSchema.wallets,
          nfts: userNftsCTE.nfts,
          nftCount: userNftsCTE.nftCount,
        })
        .from(usersTable)
        .leftJoin(
          privyUsersTableSchema,
          eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
        )
        .leftJoin(userNftsCTE, eq(userNftsCTE.userId, usersTable.id))
        .$dynamic();

      // Build WHERE clause based on search terms and column filters
      const whereClauses: SQL[] = [];

      // Add general search term filter (email, name, id only)
      const term = (searchTerm ?? '').trim().toLowerCase();

      // Build Privy user search clause (no wallet or domain search)
      const privySearchClause = buildPrivySearchWhereClause(
        term,
        privyUsersTableSchema,
      );
      if (privySearchClause) {
        whereClauses.push(privySearchClause);
      }

      // Add domain-specific search
      const domainTerm = (domainSearchTerm ?? '').trim().toLowerCase();
      if (domainTerm.length > 0) {
        const domainLikeTerm = `%${domainTerm}%`;
        const domainOnlySearchClause = sql`EXISTS (
          SELECT 1 FROM json_array_elements(
            COALESCE(${userNftsCTE.nfts}, '[]'::json)
          ) AS nft
          WHERE nft->>'normalizedDomainName' ILIKE ${domainLikeTerm}
        )`;
        whereClauses.push(domainOnlySearchClause);
      }

      // Add ENS-specific search
      const ensTerm = (ensSearchTerm ?? '').trim().toLowerCase();
      if (ensTerm.length > 0) {
        let ensResolvedWallet: string | null = null;
        // Try to resolve ENS name to wallet address
        if (ensTerm.includes('.')) {
          try {
            const addr = await resolveENSToWallet(ensTerm);
            if (addr) ensResolvedWallet = addr.toLowerCase();
          } catch {}
        }

        if (ensResolvedWallet) {
          // Search by resolved wallet address
          const ensWalletClause = sql`${privyUsersTableSchema.wallets} @> ARRAY[${ensResolvedWallet}]::text[]`;
          whereClauses.push(ensWalletClause);
        }
      }

      // Add column filters
      if (columnFilters && columnFilters.length > 0) {
        for (const filter of columnFilters) {
          const { id, value } = filter;
          const { operator, value: filterValue } = value;

          // Map column IDs to SQL columns
          let columnSql: SQL | undefined;
          switch (id) {
            case 'id':
              columnSql = sql`${usersTable.id}::text`;
              break;
            case 'displayName':
              columnSql = sql`${privyUsersTableSchema.displayName}`;
              break;
            case 'primaryEmail':
              columnSql = sql`COALESCE(${usersTable.primaryEmail}, ${privyUsersTableSchema.email})`;
              break;
            case 'privyUserId':
              columnSql = sql`${usersTable.privyUserId}`;
              break;
            case 'createdAt':
              columnSql = sql`${usersTable.createdAt}`;
              break;
            case 'updatedAt':
              columnSql = sql`${usersTable.updatedAt}`;
              break;
            case 'lastSignInAt':
              columnSql = sql`${usersTable.lastSignInAt}`;
              break;
            case 'twitterUsername':
              columnSql = sql`${privyUsersTableSchema.twitterUsername}`;
              break;
            case 'nftCount':
              columnSql = sql`${userNftsCTE.nftCount}`;
              break;
            case 'primaryWallet':
              // Primary wallet is the first element in the wallets array
              columnSql = sql`${privyUsersTableSchema.wallets}[1]`;
              break;
            case 'walletCount':
              columnSql = sql`COALESCE(array_length(${privyUsersTableSchema.wallets}, 1), 0)`;
              break;
            case 'allWallets':
              // For allWallets, we need to search within the array
              // This will be handled specially in the operator switch
              break;
          }
          const TextFilterableColumns = new Set([
            'id',
            'displayName',
            'primaryEmail',
            'privyUserId',
            'primaryWallet',
            'allWallets',
            'twitterUsername',
          ]);
          const NumberFilterableColumns = new Set(['nftCount', 'walletCount']);
          const DateFilterableColumns = new Set([
            'createdAt',
            'updatedAt',
            'lastSignInAt',
          ]);

          // Special handling for allWallets (array search)
          if (id === 'allWallets') {
            if (typeof filterValue !== 'string') {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'allWallets filter expects a string value',
              });
            }
            const lowerFilterValue = String(filterValue).trim().toLowerCase();
            switch (operator) {
              case 'like':
                // Search for wallet containing the value in any element of the array (case-insensitive)
                whereClauses.push(
                  sql`EXISTS (
                    SELECT 1
                    FROM unnest(array_lowercase(${privyUsersTableSchema.wallets})) AS w
                    WHERE w LIKE ${`%${lowerFilterValue}%`}
                  )`,
                );
                break;
              case 'eq':
                // Check if any wallet matches exactly (case-insensitive)
                whereClauses.push(
                  sql`${lowerFilterValue} = ANY(array_lowercase(${privyUsersTableSchema.wallets}))`,
                );
                break;
              case 'neq':
                // Check that no wallet matches (case-insensitive)
                whereClauses.push(
                  sql`NOT (${lowerFilterValue} = ANY(array_lowercase(${privyUsersTableSchema.wallets})))`,
                );
                break;
              default:
                throw new TRPCError({
                  code: 'BAD_REQUEST',
                  message: `Operator "${operator}" is not supported for allWallets column`,
                });
            }
          } else if (id === 'primaryWallet') {
            if (typeof filterValue !== 'string') {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'primaryWallet filter expects a string value',
              });
            }
            // Special handling for primaryWallet to ensure lowercase comparison
            const lowerFilterValue = String(filterValue).trim().toLowerCase();
            switch (operator) {
              case 'like':
                whereClauses.push(
                  sql`LOWER(${columnSql}) LIKE ${`%${lowerFilterValue}%`}`,
                );
                break;
              case 'eq':
                whereClauses.push(
                  sql`LOWER(${columnSql}) = ${lowerFilterValue}`,
                );
                break;
              case 'neq':
                whereClauses.push(
                  sql`LOWER(${columnSql}) != ${lowerFilterValue}`,
                );
                break;
              default:
                throw new TRPCError({
                  code: 'BAD_REQUEST',
                  message: `Operator "${operator}" is not supported for primaryWallet column`,
                });
            }
          } else if (columnSql) {
            switch (operator) {
              case 'like':
                if (!TextFilterableColumns.has(id)) {
                  throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Column "${id}" does not support LIKE filters`,
                  });
                }
                whereClauses.push(
                  sql`${columnSql} ILIKE ${`%${String(filterValue)}%`}`,
                );
                break;
              case 'eq':
                whereClauses.push(sql`${columnSql} = ${filterValue}`);
                break;
              case 'neq':
                whereClauses.push(sql`${columnSql} != ${filterValue}`);
                break;
              case 'gt':
                if (
                  !(
                    NumberFilterableColumns.has(id) ||
                    DateFilterableColumns.has(id)
                  )
                ) {
                  throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Column "${id}" does not support 'gt'`,
                  });
                }
                whereClauses.push(sql`${columnSql} > ${filterValue}`);
                break;
              case 'gte':
                if (
                  !(
                    NumberFilterableColumns.has(id) ||
                    DateFilterableColumns.has(id)
                  )
                ) {
                  throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Column "${id}" does not support 'gte'`,
                  });
                }
                whereClauses.push(sql`${columnSql} >= ${filterValue}`);
                break;
              case 'lt':
                if (
                  !(
                    NumberFilterableColumns.has(id) ||
                    DateFilterableColumns.has(id)
                  )
                ) {
                  throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Column "${id}" does not support 'lt'`,
                  });
                }
                whereClauses.push(sql`${columnSql} < ${filterValue}`);
                break;
              case 'lte':
                if (
                  !(
                    NumberFilterableColumns.has(id) ||
                    DateFilterableColumns.has(id)
                  )
                ) {
                  throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Column "${id}" does not support 'lte'`,
                  });
                }
                whereClauses.push(sql`${columnSql} <= ${filterValue}`);
                break;
            }
          }
        }
      }

      // Apply WHERE clauses
      let query = baseQuery;
      if (whereClauses.length > 0) {
        query = query.where(and(...whereClauses));
      }

      // Build ORDER BY clause
      const orderByClauses: SQL[] = [];
      if (sorting && sorting.length > 0) {
        for (const sort of sorting) {
          let columnSql: SQL | undefined;
          switch (sort.id) {
            case 'id':
              columnSql = sql`${usersTable.id}`;
              break;
            case 'displayName':
              columnSql = sql`${privyUsersTableSchema.displayName}`;
              break;
            case 'primaryEmail':
              columnSql = sql`COALESCE(${usersTable.primaryEmail}, ${privyUsersTableSchema.email})`;
              break;
            case 'privyUserId':
              columnSql = sql`${usersTable.privyUserId}`;
              break;
            case 'createdAt':
              columnSql = sql`${usersTable.createdAt}`;
              break;
            case 'updatedAt':
              columnSql = sql`${usersTable.updatedAt}`;
              break;
            case 'lastSignInAt':
              columnSql = sql`${usersTable.lastSignInAt}`;
              break;
            case 'twitterUsername':
              columnSql = sql`${privyUsersTableSchema.twitterUsername}`;
              break;
            case 'nftCount':
              columnSql = sql`${userNftsCTE.nftCount}`;
              break;
            case 'primaryWallet':
              columnSql = sql`${privyUsersTableSchema.wallets}[1]`;
              break;
            case 'walletCount':
              columnSql = sql`COALESCE(array_length(${privyUsersTableSchema.wallets}, 1), 0)`;
              break;
            case 'allWallets':
              // For allWallets, we can sort by the array as a whole (sorts by first element, then second, etc.)
              columnSql = sql`${privyUsersTableSchema.wallets}`;
              break;
          }

          if (columnSql) {
            orderByClauses.push(
              sort.desc
                ? sql`${columnSql} DESC NULLS LAST`
                : sql`${columnSql} ASC NULLS LAST`,
            );
          }
        }
      } else {
        // Default sort by createdAt DESC
        orderByClauses.push(sql`${usersTable.createdAt} DESC`);
      }

      try {
        // Build count query with same WHERE clause
        const countQuery = db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(query.as('sq'));

        // Execute queries in parallel
        const [rows, countRow] = await Promise.all([
          query
            .orderBy(...orderByClauses)
            .limit(pageSize)
            .offset(offset),
          countQuery,
        ]);

        const items = rows.map((r) => ({
          id: r.id,
          privyUserId: r.privyUserId,
          primaryEmail: r.primaryEmail,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          lastSignInAt: r.lastSignInAt ?? null,
          twitterUsername: r.twitterUsername ?? null,
          twitterDetails: r.twitterDetails ?? null,
          isAdmin: adminIdsSet.has(r.id),
          displayName: r.displayName ?? null,
          wallets: r.wallets ?? [],
          nfts: r.nfts ?? [],
          nftCount: r.nftCount ?? 0,
        }));

        const total = countRow[0]?.count ?? 0;
        return {
          items,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          cacheLastRefresh: cacheStatus?.lastRefresh || null,
          cacheExpiresAt: cacheStatus?.expiresAt || null,
        };
      } catch (error) {
        logger.error({ error }, 'Failed to list users');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list users',
        });
      }
    }),

  listUsersV2: adminProcedureWithPermissions(Permission.READ_USERS)
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(25),
        searchTerm: z.string().optional(),
        domainSearchTerm: z.string().optional(),
        ensSearchTerm: z.string().optional(),
        filters: z.any().optional(), // FilterOptions type from drizzler
        sorting: z.any().optional(), // SortOptions type from drizzler
      }),
    )
    .query(async ({ input }) => {
      const {
        page,
        pageSize,
        searchTerm,
        domainSearchTerm,
        ensSearchTerm,
        filters,
        sorting,
      } = input;
      const offset = (page - 1) * pageSize;

      // Fetch admin users once
      const adminIdsSet = await getAllUsersThatCanAccessAdminPanel();

      // Trigger cache refresh (non-blocking)
      const [cacheRefreshResult, cacheStatus] = await Promise.all([
        triggerUpdatePrivyCache(false).catch((error) => {
          logger.warn({ error }, 'Failed to trigger Privy cache refresh');
          return null;
        }),
        getPrivyCacheStatus().catch((error) => {
          logger.warn({ error }, 'Failed to get Privy cache status');
          return null;
        }),
      ]);

      // Define table structure for drizzler
      const tableStructure = {
        id: usersTable.id,
        privyUserId: usersTable.privyUserId,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
        lastSignInAt: usersTable.lastSignInAt,
        displayName: privyUsersTableSchema.displayName,
        primaryEmail: sql<
          string | null
        >`TRIM(LOWER(${privyUsersTableSchema.email}))`.as('primary_email'),
        twitterUsername: privyUsersTableSchema.twitterUsername,
        nftCount: userNftsCTE.nftCount,
        wallets: privyUsersTableSchema.wallets,
        walletCount:
          sql`COALESCE(array_length(${privyUsersTableSchema.wallets}, 1), 0)`.as(
            'wallet_count',
          ),
        primaryWallet: sql`${privyUsersTableSchema.wallets}[1]`.as(
          'primary_wallet',
        ),
      };

      // Build base query
      const baseQuery = db
        .with(userNftsCTE)
        .select({
          id: usersTable.id,
          privyUserId: usersTable.privyUserId,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
          lastSignInAt: usersTable.lastSignInAt,
          twitterUsername: privyUsersTableSchema.twitterUsername,
          twitterDetails: privyUsersTableSchema.twitterDetails,
          primaryEmail: sql<
            string | null
          >`TRIM(LOWER(${privyUsersTableSchema.email}))`.as('primary_email'),
          displayName: privyUsersTableSchema.displayName,
          wallets: privyUsersTableSchema.wallets,
          nfts: userNftsCTE.nfts,
          nftCount: userNftsCTE.nftCount,
        })
        .from(usersTable)
        .leftJoin(
          privyUsersTableSchema,
          eq(privyUsersTableSchema.privyUserId, usersTable.privyUserId),
        )
        .leftJoin(userNftsCTE, eq(userNftsCTE.userId, usersTable.id))
        .$dynamic();

      // Build WHERE clauses
      const whereClauses: SQL[] = [];

      // Add general search term filter (same as before)
      const term = (searchTerm ?? '').trim().toLowerCase();
      const privySearchClause = buildPrivySearchWhereClause(
        term,
        privyUsersTableSchema,
      );
      if (privySearchClause) {
        whereClauses.push(privySearchClause);
      }

      // Add domain-specific search (same as before)
      const domainTerm = (domainSearchTerm ?? '').trim().toLowerCase();
      if (domainTerm.length > 0) {
        const domainLikeTerm = `%${domainTerm}%`;
        whereClauses.push(sql`EXISTS (
          SELECT 1 FROM json_array_elements(
            COALESCE(${userNftsCTE.nfts}, '[]'::json)
          ) AS nft
          WHERE nft->>'normalizedDomainName' ILIKE ${domainLikeTerm}
        )`);
      }

      // Add ENS-specific search (same as before)
      const ensTerm = (ensSearchTerm ?? '').trim().toLowerCase();
      if (ensTerm.length > 0) {
        let ensResolvedWallet: string | null = null;
        if (ensTerm.includes('.')) {
          try {
            const addr = await resolveENSToWallet(ensTerm);
            if (addr) ensResolvedWallet = addr.toLowerCase();
          } catch {}
        }
        if (ensResolvedWallet) {
          whereClauses.push(
            sql`${privyUsersTableSchema.wallets} @> ARRAY[${ensResolvedWallet}]::text[]`,
          );
        }
      }

      // Add column filters using drizzler buildWhereClause
      if (filters) {
        const drizzlerWhere = buildWhereClause(
          tableStructure,
          filters as FilterOptions<any>,
        );

        if (drizzlerWhere) {
          whereClauses.push(drizzlerWhere);
        }
      }

      // Apply WHERE clauses
      let query = baseQuery;
      if (whereClauses.length > 0) {
        query = query.where(and(...whereClauses));
      }
      // Build ORDER BY using drizzler buildSortClause or default
      const orderByClauses = sorting
        ? buildSortClause(tableStructure, sorting as SortOptions<any>)
        : [sql`${usersTable.createdAt} DESC`];

      try {
        // Build count query
        const countQuery = db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(query.as('sq'));

        // Execute queries in parallel
        const [rows, countRow] = await Promise.all([
          query
            .orderBy(...orderByClauses)
            .limit(pageSize)
            .offset(offset),
          countQuery,
        ]);

        const items = rows.map((r) => ({
          id: r.id,
          privyUserId: r.privyUserId,
          primaryEmail: r.primaryEmail,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          lastSignInAt: r.lastSignInAt ?? null,
          twitterUsername: r.twitterUsername ?? null,
          twitterDetails: r.twitterDetails ?? null,
          isAdmin: adminIdsSet.has(r.id),
          displayName: r.displayName ?? null,
          wallets: r.wallets ?? [],
          nfts: r.nfts ?? [],
          nftCount: r.nftCount ?? 0,
        }));

        const total = countRow[0]?.count ?? 0;
        return {
          items,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          cacheLastRefresh: cacheStatus?.lastRefresh || null,
          cacheExpiresAt: cacheStatus?.expiresAt || null,
        };
      } catch (error) {
        logger.error({ error }, 'Failed to list users v2');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list users',
        });
      }
    }),

  forceRefreshPrivyCache: adminProcedureWithPermissions(
    Permission.READ_USERS,
  ).mutation(async () => {
    try {
      logger.debug('Force refreshing Privy cache');

      // Trigger the workflow with forceRefresh=true
      const result = await triggerUpdatePrivyCache(true);

      // Get the updated status
      const status = await getPrivyCacheStatus();

      return {
        success: true,
        lastRefresh: status?.lastRefresh || null,
        expiresAt: status?.expiresAt || null,
        recordCount: status?.recordCount || 0,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to force refresh Privy cache');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to force refresh Privy cache',
      });
    }
  }),

  listDomainPreferences: adminProcedureWithPermissions(
    Permission.READ_DOMAIN_PREFERENCES,
  )
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(25),
        filters: z.any().optional(),
        sorting: z.any().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, pageSize, filters, sorting } = input;
      const offset = (page - 1) * pageSize;

      await ensurePrivyTableFresh();

      const tableStructure = {
        userId: usersTable.id,
        normalizedDomainName: namefiNftView.normalizedDomainName,
        ownerAddress: namefiNftView.ownerAddress,
        chainId: namefiNftView.chainId,
        autoRenewEnabled: sql<
          string | null
        >`${domainUserPreferencesTable.autoRenewEnabled}::text`,
        autoEnsEnabled: sql<
          string | null
        >`${domainConfigTable.autoEnsEnabled}::text`,
        autoParkEnabled: sql<
          string | null
        >`${domainConfigTable.autoParkEnabled}::text`,
        forwardTo: domainConfigTable.forwardTo,
      };

      const baseQuery = db
        .with(namefiNftCte)
        .select({
          userId: usersTable.id,
          normalizedDomainName: namefiNftView.normalizedDomainName,
          chainId: namefiNftView.chainId,
          ownerAddress: namefiNftView.ownerAddress,
          autoRenewEnabled: domainUserPreferencesTable.autoRenewEnabled,
          autoEnsEnabled: domainConfigTable.autoEnsEnabled,
          autoParkEnabled: domainConfigTable.autoParkEnabled,
          forwardTo: domainConfigTable.forwardTo,
        })
        .from(privyUsersTableSchema)
        .leftJoin(
          usersTable,
          eq(usersTable.privyUserId, privyUsersTableSchema.privyUserId),
        )
        .innerJoin(
          namefiNftView,
          sql`LOWER(${namefiNftView.ownerAddress}) = ANY( array_lowercase(${privyUsersTableSchema.wallets}))`,
        )
        .leftJoin(
          domainConfigTable,
          eq(
            domainConfigTable.normalizedDomainName,
            namefiNftView.normalizedDomainName,
          ),
        )
        .leftJoin(
          domainUserPreferencesTable,
          and(
            eq(
              domainUserPreferencesTable.normalizedDomainName,
              namefiNftView.normalizedDomainName,
            ),
            eq(domainUserPreferencesTable.userId, usersTable.id),
          ),
        )
        .$dynamic();

      const whereClauses: SQL[] = [];

      if (filters) {
        const drizzlerWhere = buildWhereClause(
          tableStructure,
          filters as FilterOptions<any>,
        );
        if (drizzlerWhere) {
          whereClauses.push(drizzlerWhere);
        }
      }

      let query = baseQuery;
      if (whereClauses.length > 0) {
        query = query.where(and(...whereClauses));
      }

      const orderByClauses = sorting
        ? buildSortClause(tableStructure, sorting as SortOptions<any>)
        : [asc(namefiNftView.normalizedDomainName)];

      try {
        const countQuery = db
          .with(namefiNftCte)
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(privyUsersTableSchema)
          .leftJoin(
            usersTable,
            eq(usersTable.privyUserId, privyUsersTableSchema.privyUserId),
          )
          .innerJoin(
            namefiNftView,
            sql`LOWER(${namefiNftView.ownerAddress}) = ANY( array_lowercase(${privyUsersTableSchema.wallets}))`,
          )
          .leftJoin(
            domainConfigTable,
            eq(
              domainConfigTable.normalizedDomainName,
              namefiNftView.normalizedDomainName,
            ),
          )
          .leftJoin(
            domainUserPreferencesTable,
            and(
              eq(
                domainUserPreferencesTable.normalizedDomainName,
                namefiNftView.normalizedDomainName,
              ),
              eq(domainUserPreferencesTable.userId, usersTable.id),
            ),
          )
          .$dynamic();

        let countQueryWithWhere = countQuery;
        if (whereClauses.length > 0) {
          countQueryWithWhere = countQuery.where(and(...whereClauses));
        }

        const [rows, countRow] = await Promise.all([
          query
            .orderBy(...orderByClauses)
            .limit(pageSize)
            .offset(offset),
          countQueryWithWhere,
        ]);

        const total = countRow[0]?.count ?? 0;

        return {
          data: rows,
          pagination: {
            page,
            pageSize,
            totalCount: total,
            totalPages: Math.ceil(total / pageSize),
          },
        };
      } catch (error) {
        logger.error({ error }, 'Failed to list domain preferences');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list domain preferences',
        });
      }
    }),

  updateDomainPreferences: auditedAdminProcedureWithPermissions(
    Permission.WRITE_DOMAIN_PREFERENCES,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.DOMAIN,
      resourceId: input.domainName,
      action: 'update_domain_preferences',
      extraInput: input,
    }),
  )
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
        domainPreferencesAndConfig: z.object({
          forwardTo: z.string().optional(),
          autoEnsEnabled: z.boolean().optional(),
          autoParkEnabled: z.boolean().optional(),
          autoRenewEnabled: z.boolean().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ensurePrivyTableFresh();
      const { domainName, domainPreferencesAndConfig } = input;

      const ownerQuery = await db
        .with(namefiNftCte)
        .select({
          normalizedDomainName: namefiNftView.normalizedDomainName,
          userId: usersTable.id,
          privyUserId: usersTable.privyUserId,
        })
        .from(privyUsersTableSchema)
        .innerJoin(
          namefiNftView,
          sql`LOWER(${namefiNftView.ownerAddress}) = ANY( array_lowercase(${privyUsersTableSchema.wallets}))`,
        )
        .innerJoin(
          usersTable,
          eq(usersTable.privyUserId, privyUsersTableSchema.privyUserId),
        )
        .where(eq(namefiNftView.normalizedDomainName, domainName))
        .limit(1);
      const owner = ownerQuery[0];
      if (!owner || !owner.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `You cannot change the config and preferences for this domain. domain(${domainName}) owner account is not found`,
        });
      }

      await updateDomainPreferencesAndConfig(
        domainName,
        owner.userId,
        domainPreferencesAndConfig,
      );

      return { success: true };
    }),

  listOrderItems: adminProcedureWithPermissions(
    [Permission.READ_ORDERS, Permission.READ_USERS],
    { mode: 'every' },
  )
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(25),
        searchTerm: z.string().optional(),
        columnFilters: z
          .array(
            z.object({
              id: z.string(),
              value: z.object({
                operator: z.enum([
                  'like',
                  'eq',
                  'neq',
                  'gt',
                  'gte',
                  'lt',
                  'lte',
                ]),
                value: z.union([z.string(), z.number(), z.date()]),
              }),
            }),
          )
          .optional(),
        sorting: z
          .array(
            z.object({
              id: z.string(),
              desc: z.boolean(),
            }),
          )
          .optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, pageSize, searchTerm, columnFilters, sorting } = input;
      const offset = (page - 1) * pageSize;

      // Build base query with all necessary joins
      const baseQuery = db
        .select({
          // Order item fields
          id: orderItemsTable.id,
          normalizedDomainName: orderItemsTable.normalizedDomainName,
          amountInUsdCents: orderItemsTable.amountInUSDCents,
          durationInYears: orderItemsTable.durationInYears,
          type: orderItemsTable.type,
          registrar: orderItemsTable.registrar,
          status: orderItemsTable.status,
          createdAt: orderItemsTable.createdAt,
          updatedAt: orderItemsTable.updatedAt,
          // Order fields
          orderId: ordersTable.id,
          orderStatus: ordersTable.status,
          nftWalletAddress: ordersTable.nftWalletAddress,
          nftChainId: ordersTable.nftChainId,
          // User fields
          userId: usersTable.id,
          userEmail: usersTable.primaryEmail,
          userPrivyUserId: usersTable.privyUserId,
          // Payment fields from the latest payment for this order
          paymentProvider: sql<string | null>`(
            SELECT p.payment_provider
            FROM ${paymentsTable} p
            WHERE p.order_id = ${ordersTable.id}
            ORDER BY p.created_at DESC
            LIMIT 1
          )`.as('payment_provider'),
          paymentStatus: sql<string | null>`(
            SELECT p.status
            FROM ${paymentsTable} p
            WHERE p.order_id = ${ordersTable.id}
            ORDER BY p.created_at DESC
            LIMIT 1
          )`.as('payment_status'),
          paymentAmount: sql<number | null>`(
            SELECT p.amount_in_usd_cents
            FROM ${paymentsTable} p
            WHERE p.order_id = ${ordersTable.id}
            ORDER BY p.created_at DESC
            LIMIT 1
          )`.as('payment_amount'),
          nfscWalletAddress: sql<string | null>`(
            SELECT p.nfsc_payment_details->>'walletAddress'
            FROM ${paymentsTable} p
            WHERE p.order_id = ${ordersTable.id}
            ORDER BY p.created_at DESC
            LIMIT 1
          )`.as('nfsc_wallet_address'),
          // Free claim data
          freeClaimId: freeClaimsTable.id,
          freeClaimGroupOrCampaignKey: freeClaimsTable.groupOrCampaignKey,
          freeClaimReason: freeClaimsTable.reason,
        })
        .from(orderItemsTable)
        .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
        .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
        .leftJoin(
          freeClaimsTable,
          eq(freeClaimsTable.orderItemId, orderItemsTable.id),
        )
        .$dynamic();

      // Build WHERE clause based on search terms and column filters
      const whereClauses: SQL[] = [];

      // Add general search term filter
      if (searchTerm) {
        const term = searchTerm.trim().toLowerCase();
        const likeTerm = `%${term}%`;
        const searchCondition = or(
          sql`LOWER(${orderItemsTable.normalizedDomainName}) LIKE ${likeTerm}`,
          sql`LOWER(${usersTable.primaryEmail}) LIKE ${likeTerm}`,
          sql`LOWER(${ordersTable.nftWalletAddress}) LIKE ${likeTerm}`,
          sql`${ordersTable.id}::text LIKE ${likeTerm}`,
          sql`${orderItemsTable.id}::text LIKE ${likeTerm}`,
        );
        if (searchCondition) {
          whereClauses.push(searchCondition);
        }
      }

      // Add column filters
      if (columnFilters && columnFilters.length > 0) {
        for (const filter of columnFilters) {
          const { id, value } = filter;
          const { operator, value: filterValue } = value;

          let columnSql: SQL | undefined;
          switch (id) {
            case 'normalizedDomainName':
              columnSql = sql`${orderItemsTable.normalizedDomainName}`;
              break;
            case 'type':
              columnSql = sql`${orderItemsTable.type}`;
              break;
            case 'registrar':
              columnSql = sql`${orderItemsTable.registrar}`;
              break;
            case 'status':
              columnSql = sql`${orderItemsTable.status}`;
              break;
            case 'amountInUsdCents':
              columnSql = sql`${orderItemsTable.amountInUSDCents}`;
              break;
            case 'createdAt':
              columnSql = sql`${orderItemsTable.createdAt}`;
              break;
            case 'nftChainId':
              columnSql = sql`${ordersTable.nftChainId}`;
              break;
            case 'userEmail':
              columnSql = sql`${usersTable.primaryEmail}`;
              break;
            case 'nftWalletAddress':
              columnSql = sql`${ordersTable.nftWalletAddress}`;
              break;
            case 'userId':
              columnSql = sql`${usersTable.id}`;
              break;
          }

          if (columnSql) {
            switch (operator) {
              case 'like':
                whereClauses.push(
                  sql`${columnSql} ILIKE ${`%${String(filterValue)}%`}`,
                );
                break;
              case 'eq':
                whereClauses.push(sql`${columnSql} = ${filterValue}`);
                break;
              case 'neq':
                whereClauses.push(sql`${columnSql} != ${filterValue}`);
                break;
              case 'gt':
                whereClauses.push(sql`${columnSql} > ${filterValue}`);
                break;
              case 'gte':
                whereClauses.push(sql`${columnSql} >= ${filterValue}`);
                break;
              case 'lt':
                whereClauses.push(sql`${columnSql} < ${filterValue}`);
                break;
              case 'lte':
                whereClauses.push(sql`${columnSql} <= ${filterValue}`);
                break;
            }
          }
        }
      }

      // Apply WHERE clauses
      let query = baseQuery;
      if (whereClauses.length > 0) {
        query = query.where(and(...whereClauses));
      }

      // Build ORDER BY clause
      const orderByClauses: SQL[] = [];
      if (sorting && sorting.length > 0) {
        for (const sort of sorting) {
          let columnSql: SQL | undefined;
          switch (sort.id) {
            case 'createdAt':
              columnSql = sql`${orderItemsTable.createdAt}`;
              break;
            case 'normalizedDomainName':
              columnSql = sql`${orderItemsTable.normalizedDomainName}`;
              break;
            case 'amountInUsdCents':
              columnSql = sql`${orderItemsTable.amountInUSDCents}`;
              break;
            case 'status':
              columnSql = sql`${orderItemsTable.status}`;
              break;
            case 'type':
              columnSql = sql`${orderItemsTable.type}`;
              break;
            case 'nftChainId':
              columnSql = sql`${ordersTable.nftChainId}`;
              break;
          }
          if (columnSql) {
            orderByClauses.push(
              sort.desc
                ? sql`${columnSql} DESC NULLS LAST`
                : sql`${columnSql} ASC NULLS LAST`,
            );
          }
        }
      } else {
        // Default sort by createdAt DESC
        orderByClauses.push(sql`${orderItemsTable.createdAt} DESC`);
      }

      try {
        // Build count query with same WHERE clause
        const countQuery = db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(query.as('sq'));

        // Execute queries in parallel
        const [rows, countRow] = await Promise.all([
          query
            .orderBy(...orderByClauses)
            .limit(pageSize)
            .offset(offset),
          countQuery,
        ]);

        // Get user wallets for "Bought For" determination
        const userIds = [...new Set(rows.map((r) => r.userId))];
        const userWalletsMap = new Map<string, string[]>();

        // Fetch Privy user data for all users in the result set
        await Promise.all(
          userIds.map(async (userId) => {
            const user = await db
              .select({
                id: usersTable.id,
                privyUserId: usersTable.privyUserId,
              })
              .from(usersTable)
              .where(eq(usersTable.id, userId))
              .limit(1);

            if (user[0]?.privyUserId) {
              try {
                const privyUser = await privyClient.getUserById(
                  user[0].privyUserId,
                );
                const wallets = getPrivyUserLinkedEthereumWalletAddresses({
                  privyUser,
                });
                userWalletsMap.set(
                  userId,
                  wallets.map((w) => w.toLowerCase()),
                );
              } catch {
                userWalletsMap.set(userId, []);
              }
            } else {
              userWalletsMap.set(userId, []);
            }
          }),
        );

        const items = rows.map((r) => {
          const userWallets = userWalletsMap.get(r.userId) || [];
          const nftWallet = r.nftWalletAddress?.toLowerCase();
          const boughtForType = !nftWallet
            ? 'Unknown'
            : userWallets.includes(nftWallet)
              ? 'Own Wallet'
              : 'Other Wallet';

          return {
            id: r.id,
            normalizedDomainName: r.normalizedDomainName,
            amountInUsdCents: r.amountInUsdCents,
            durationInYears: r.durationInYears,
            type: r.type,
            registrar: r.registrar,
            status: r.status,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            orderId: r.orderId,
            orderStatus: r.orderStatus,
            nftWalletAddress: r.nftWalletAddress,
            nftChainId: r.nftChainId,
            userId: r.userId,
            userEmail: r.userEmail,
            userPrivyUserId: r.userPrivyUserId,
            paymentProvider: r.paymentProvider,
            paymentStatus: r.paymentStatus,
            paymentAmount: r.paymentAmount,
            nfscWalletAddress: r.nfscWalletAddress,
            boughtForType,
            userWallets,
            freeClaimId: r.freeClaimId,
            freeClaimGroupOrCampaignKey: r.freeClaimGroupOrCampaignKey,
            freeClaimReason: r.freeClaimReason,
          };
        });

        const total = countRow[0]?.count ?? 0;
        return {
          items,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        };
      } catch (error) {
        logger.error({ error }, 'Failed to list order items');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list order items',
        });
      }
    }),

  listOrders: adminProcedureWithPermissions(
    [Permission.READ_ORDERS, Permission.READ_USERS],
    { mode: 'every' },
  )
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(25),
        searchTerm: z.string().optional(),
        userId: z.string().optional(),
        columnFilters: z
          .array(
            z.object({
              id: z.string(),
              value: z.object({
                operator: z.enum([
                  'like',
                  'eq',
                  'neq',
                  'gt',
                  'gte',
                  'lt',
                  'lte',
                ]),
                value: z.union([z.string(), z.number(), z.date()]),
              }),
            }),
          )
          .optional(),
        sorting: z
          .array(
            z.object({
              id: z.string(),
              desc: z.boolean(),
            }),
          )
          .optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, pageSize, searchTerm, userId, columnFilters, sorting } =
        input;
      const offset = (page - 1) * pageSize;

      const baseQuery = db
        .select({
          id: ordersTable.id,
          status: ordersTable.status,
          amountInUsdCents: ordersTable.amountInUSDCents,
          nftWalletAddress: ordersTable.nftWalletAddress,
          nftChainId: ordersTable.nftChainId,
          createdAt: ordersTable.createdAt,
          updatedAt: ordersTable.updatedAt,
          userId: usersTable.id,
          userEmail: usersTable.primaryEmail,
          userPrivyUserId: usersTable.privyUserId,
        })
        .from(ordersTable)
        .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
        .$dynamic();

      const whereClauses: SQL[] = [];

      if (userId) {
        whereClauses.push(sql`${usersTable.id} = ${userId}`);
      }

      if (searchTerm) {
        const term = searchTerm.trim().toLowerCase();
        const likeTerm = `%${term}%`;
        const searchCondition = or(
          sql`LOWER(${usersTable.primaryEmail}) LIKE ${likeTerm}`,
          sql`LOWER(${ordersTable.nftWalletAddress}) LIKE ${likeTerm}`,
          sql`${ordersTable.id}::text LIKE ${likeTerm}`,
          sql`EXISTS (
            SELECT 1 FROM ${orderItemsTable}
            WHERE ${orderItemsTable.orderId} = ${ordersTable.id}
            AND LOWER(${orderItemsTable.normalizedDomainName}) LIKE ${likeTerm}
          )`,
        );
        if (searchCondition) {
          whereClauses.push(searchCondition);
        }
      }

      if (columnFilters && columnFilters.length > 0) {
        for (const filter of columnFilters) {
          const { id, value } = filter;
          const { operator, value: filterValue } = value;

          let columnSql: SQL | undefined;
          switch (id) {
            case 'status':
              columnSql = sql`${ordersTable.status}`;
              break;
            case 'amountInUsdCents':
              columnSql = sql`${ordersTable.amountInUSDCents}`;
              break;
            case 'createdAt':
              columnSql = sql`${ordersTable.createdAt}`;
              break;
            case 'nftChainId':
              columnSql = sql`${ordersTable.nftChainId}`;
              break;
            case 'userEmail':
              columnSql = sql`${usersTable.primaryEmail}`;
              break;
            case 'nftWalletAddress':
              columnSql = sql`${ordersTable.nftWalletAddress}`;
              break;
            case 'userId':
              if (!userId) {
                columnSql = sql`${usersTable.id}`;
              }
              break;
          }

          if (columnSql) {
            switch (operator) {
              case 'like':
                whereClauses.push(
                  sql`${columnSql} ILIKE ${`%${String(filterValue)}%`}`,
                );
                break;
              case 'eq':
                whereClauses.push(sql`${columnSql} = ${filterValue}`);
                break;
              case 'neq':
                whereClauses.push(sql`${columnSql} != ${filterValue}`);
                break;
              case 'gt':
                whereClauses.push(sql`${columnSql} > ${filterValue}`);
                break;
              case 'gte':
                whereClauses.push(sql`${columnSql} >= ${filterValue}`);
                break;
              case 'lt':
                whereClauses.push(sql`${columnSql} < ${filterValue}`);
                break;
              case 'lte':
                whereClauses.push(sql`${columnSql} <= ${filterValue}`);
                break;
            }
          }
        }
      }

      let query = baseQuery;
      if (whereClauses.length > 0) {
        query = query.where(and(...whereClauses));
      }

      const orderByClauses: SQL[] = [];
      if (sorting && sorting.length > 0) {
        for (const sort of sorting) {
          let columnSql: SQL | undefined;
          switch (sort.id) {
            case 'createdAt':
              columnSql = sql`${ordersTable.createdAt}`;
              break;
            case 'amountInUsdCents':
              columnSql = sql`${ordersTable.amountInUSDCents}`;
              break;
            case 'status':
              columnSql = sql`${ordersTable.status}`;
              break;
            case 'nftChainId':
              columnSql = sql`${ordersTable.nftChainId}`;
              break;
          }
          if (columnSql) {
            orderByClauses.push(
              sort.desc
                ? sql`${columnSql} DESC NULLS LAST`
                : sql`${columnSql} ASC NULLS LAST`,
            );
          }
        }
      }

      if (orderByClauses.length === 0) {
        orderByClauses.push(sql`${ordersTable.createdAt} DESC`);
      }

      try {
        const whereClause =
          whereClauses.length > 0 ? and(...whereClauses) : undefined;

        const countQuery = db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(ordersTable)
          .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id));

        const [rows, countRow] = await Promise.all([
          query
            .orderBy(...orderByClauses)
            .limit(pageSize)
            .offset(offset),
          whereClause ? countQuery.where(whereClause) : countQuery,
        ]);

        const items = rows.map((r) => ({
          id: r.id,
          status: r.status,
          amountInUsdCents: r.amountInUsdCents,
          nftWalletAddress: r.nftWalletAddress,
          nftChainId: r.nftChainId,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          userId: r.userId,
          userEmail: r.userEmail,
          userPrivyUserId: r.userPrivyUserId,
        }));

        const total = countRow[0]?.count ?? 0;
        return {
          items,
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        };
      } catch (error) {
        logger.error({ error }, 'Failed to list orders');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list orders',
        });
      }
    }),

  burnAllExpiredDomains: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NFT,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'domain',
      resourceId: '',
      action: 'start_burn_all_expired_domains_workflow',
      extraInput: input,
    }),
  )
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

      logger.debug(
        { dryRun, maxBurns },
        'Starting burn expired domains operation',
      );

      try {
        // Step 1: Get expired domains from registrars
        const expiredDomains = await sldRegistrar.listExpiredDomains();
        logger.debug(
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
          .with(namefiNftOwnersCte, namefiNftCte)
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
        logger.debug(
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

        logger.debug(
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

            logger.debug(
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

  // ============================================
  // Export Tracking Endpoints
  // ============================================

  /**
   * Get export tracking records with pagination and filtering
   */
  getExportTrackingRecords: adminProcedureWithPermissions(Permission.READ_NFT)
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(25),
        filters: z.any().optional(), // FilterOptions type from drizzler
        sorting: z.any().optional(), // SortOptions type from drizzler
      }),
    )
    .query(async ({ input }) => {
      const { page, pageSize, filters, sorting } = input;
      const offset = (page - 1) * pageSize;

      // Define table structure for drizzler
      const tableStructure = {
        id: domainExportTrackingTable.id,
        normalizedDomainName: domainExportTrackingTable.normalizedDomainName,
        chainId: domainExportTrackingTable.chainId,
        ownerAddress: domainExportTrackingTable.ownerAddress,
        status: domainExportTrackingTable.status,
        previousStatus: domainExportTrackingTable.previousStatus,
        registrarKey: domainExportTrackingTable.registrarKey,
        statusChangedAt: domainExportTrackingTable.statusChangedAt,
        firstDetectedAt: domainExportTrackingTable.firstDetectedAt,
        lastCheckedAt: domainExportTrackingTable.lastCheckedAt,
        transferCompletedAt: domainExportTrackingTable.transferCompletedAt,
        pendingNotifiedAt: domainExportTrackingTable.pendingNotifiedAt,
        notifiedAt: domainExportTrackingTable.notifiedAt,
        latestEvidence: domainExportTrackingTable.latestEvidence,
        userNotified: domainExportTrackingTable.userNotified,
        clientApprovedAt: domainExportTrackingTable.clientApprovedAt,
        adminVerifiedAt: domainExportTrackingTable.adminVerifiedAt,
        confirmedOutOfAccountAt:
          domainExportTrackingTable.confirmedOutOfAccountAt,
        nftBurnedAt: domainExportTrackingTable.nftBurnedAt,
        createdAt: domainExportTrackingTable.createdAt,
        updatedAt: domainExportTrackingTable.updatedAt,
      };

      // Build base query
      const baseQuery = db
        .select({
          id: domainExportTrackingTable.id,
          normalizedDomainName: domainExportTrackingTable.normalizedDomainName,
          chainId: domainExportTrackingTable.chainId,
          ownerAddress: domainExportTrackingTable.ownerAddress,
          status: domainExportTrackingTable.status,
          previousStatus: domainExportTrackingTable.previousStatus,
          statusHistory: domainExportTrackingTable.statusHistory,
          eppStatuses: domainExportTrackingTable.eppStatuses,
          registrarKey: domainExportTrackingTable.registrarKey,
          statusChangedAt: domainExportTrackingTable.statusChangedAt,
          firstDetectedAt: domainExportTrackingTable.firstDetectedAt,
          lastCheckedAt: domainExportTrackingTable.lastCheckedAt,
          transferCompletedAt: domainExportTrackingTable.transferCompletedAt,
          pendingNotifiedAt: domainExportTrackingTable.pendingNotifiedAt,
          userNotified: domainExportTrackingTable.userNotified,
          notifiedAt: domainExportTrackingTable.notifiedAt,
          latestEvidence: domainExportTrackingTable.latestEvidence,
          clientApprovedAt: domainExportTrackingTable.clientApprovedAt,
          verfyingAdminId: domainExportTrackingTable.verfyingAdminId,
          adminVerifiedAt: domainExportTrackingTable.adminVerifiedAt,
          confirmedOutOfAccountAt:
            domainExportTrackingTable.confirmedOutOfAccountAt,
          nftBurnedAt: domainExportTrackingTable.nftBurnedAt,
          nftBurnTxHash: domainExportTrackingTable.nftBurnTxHash,
          createdAt: domainExportTrackingTable.createdAt,
          updatedAt: domainExportTrackingTable.updatedAt,
        })
        .from(domainExportTrackingTable)
        .$dynamic();

      // Build WHERE clauses
      const whereClauses: SQL[] = [];

      // Add column filters using drizzler buildWhereClause
      if (filters) {
        const drizzlerWhere = buildWhereClause(
          tableStructure,
          filters as FilterOptions<any>,
        );
        if (drizzlerWhere) {
          whereClauses.push(drizzlerWhere);
        }
      }

      // Apply WHERE clauses
      let query = baseQuery;
      if (whereClauses.length > 0) {
        query = query.where(and(...whereClauses));
      }

      // Build ORDER BY using drizzler buildSortClause or default
      const orderByClauses = sorting
        ? buildSortClause(tableStructure, sorting as SortOptions<any>)
        : [sql`${domainExportTrackingTable.statusChangedAt} DESC`];

      try {
        // Build count query
        const countQuery = db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(domainExportTrackingTable)
          .$dynamic();

        // Apply same WHERE to count query
        let countQueryWithWhere = countQuery;
        if (whereClauses.length > 0) {
          countQueryWithWhere = countQuery.where(and(...whereClauses));
        }

        // Execute queries in parallel
        const [rows, countRow] = await Promise.all([
          query
            .orderBy(...orderByClauses)
            .limit(pageSize)
            .offset(offset),
          countQueryWithWhere,
        ]);

        const total = countRow[0]?.count ?? 0;

        return {
          data: rows,
          pagination: {
            page,
            pageSize,
            totalCount: total,
            totalPages: Math.ceil(total / pageSize),
          },
        };
      } catch (error) {
        logger.error({ error }, 'Failed to get export tracking records');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get export tracking records',
        });
      }
    }),

  /**
   * Admin verify an export tracking record
   * This sets the adminVerifiedAt timestamp and verfyingAdminId,
   * which makes the domain eligible for NFT burning
   */
  verifyExportTracking: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NFT,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin' as const,
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.DOMAIN_EXPORT,
      resourceId: input.id,
      action: 'verify_export',
      extraInput: input,
    }),
  )
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // First verify the record exists and is in TRANSFER_COMPLETED status
      const existingRecord = await db
        .select({
          id: domainExportTrackingTable.id,
          normalizedDomainName: domainExportTrackingTable.normalizedDomainName,
          chainId: domainExportTrackingTable.chainId,
          ownerAddress: domainExportTrackingTable.ownerAddress,
          status: domainExportTrackingTable.status,
          statusHistory: domainExportTrackingTable.statusHistory,
          userNotified: domainExportTrackingTable.userNotified,
          adminVerifiedAt: domainExportTrackingTable.adminVerifiedAt,
          nftBurnedAt: domainExportTrackingTable.nftBurnedAt,
        })
        .from(domainExportTrackingTable)
        .where(eq(domainExportTrackingTable.id, input.id))
        .limit(1);

      if (!existingRecord[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Export tracking record not found',
        });
      }

      const record = existingRecord[0];

      if (record.adminVerifiedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Export tracking record is already verified',
        });
      }

      if (record.nftBurnedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'NFT has already been burned for this export',
        });
      }

      if (!canApproveExportTrackingStatus(record.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot verify export with status: ${record.status}. Only NEEDS_ADMIN_REVIEW records (or legacy TRANSFER_COMPLETED records) can be verified.`,
        });
      }

      if (!record.userNotified) {
        const userId = await getUserIdFromOwnerAddress(record.ownerAddress);
        if (!userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot send export notification: no user is linked to owner wallet ${record.ownerAddress}`,
          });
        }

        const notifyResult = await sendExportCompleteEmail({
          userId,
          domain: record.normalizedDomainName,
          chainId: record.chainId,
        });

        if (!notifyResult.sent) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Cannot send export notification: user does not have a deliverable email address',
          });
        }
      }

      const now = new Date();
      const updatedHistory = appendExportTrackingStatusHistory(
        (record.statusHistory as ExportTrackingStatusHistoryEntry[] | null) ??
          [],
        'NOTIFIED',
        now,
      );

      // Update the record with admin verification
      await db
        .update(domainExportTrackingTable)
        .set({
          previousStatus: sql`${domainExportTrackingTable.status}`,
          status: 'NOTIFIED',
          statusHistory: updatedHistory,
          verfyingAdminId: ctx.user.id,
          adminVerifiedAt: now,
          userNotified: true,
          notifiedAt: now,
          statusChangedAt: now,
          updatedAt: now,
        })
        .where(eq(domainExportTrackingTable.id, input.id));

      logger.debug(
        {
          recordId: input.id,
          domain: record.normalizedDomainName,
          adminId: ctx.user.id,
        },
        'Admin verified export tracking record',
      );

      return {
        success: true,
        message: `Export for ${record.normalizedDomainName} has been verified and marked as notified`,
      };
    }),

  /**
   * Admin resolve an export tracking review without sending user notification
   */
  resolveExportTracking: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NFT,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin' as const,
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.DOMAIN_EXPORT,
      resourceId: input.id,
      action: 'resolve_export',
      extraInput: input,
    }),
  )
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingRecord = await db
        .select({
          id: domainExportTrackingTable.id,
          normalizedDomainName: domainExportTrackingTable.normalizedDomainName,
          status: domainExportTrackingTable.status,
          statusHistory: domainExportTrackingTable.statusHistory,
          nftBurnedAt: domainExportTrackingTable.nftBurnedAt,
        })
        .from(domainExportTrackingTable)
        .where(eq(domainExportTrackingTable.id, input.id))
        .limit(1);

      if (!existingRecord[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Export tracking record not found',
        });
      }

      const record = existingRecord[0];

      if (record.status === 'RESOLVED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Export tracking record is already resolved',
        });
      }

      if (record.nftBurnedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot resolve review: NFT has already been burned',
        });
      }

      if (!canResolveExportTrackingStatus(record.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot resolve export with status: ${record.status}.`,
        });
      }

      const now = new Date();
      const updatedHistory = appendExportTrackingStatusHistory(
        (record.statusHistory as ExportTrackingStatusHistoryEntry[] | null) ??
          [],
        'RESOLVED',
        now,
      );

      await db
        .update(domainExportTrackingTable)
        .set({
          previousStatus: sql`${domainExportTrackingTable.status}`,
          status: 'RESOLVED',
          statusHistory: updatedHistory,
          verfyingAdminId: ctx.user.id,
          adminVerifiedAt: sql`COALESCE(${domainExportTrackingTable.adminVerifiedAt}, NOW())`,
          statusChangedAt: now,
          updatedAt: now,
        })
        .where(eq(domainExportTrackingTable.id, input.id));

      logger.debug(
        {
          recordId: input.id,
          domain: record.normalizedDomainName,
          adminId: ctx.user.id,
        },
        'Admin resolved export tracking review',
      );

      return {
        success: true,
        message: `Export review for ${record.normalizedDomainName} has been resolved`,
      };
    }),

  /**
   * Send export notification email based on current export tracking status
   * - pending statuses => pending export email
   * - completed/review/resolved statuses => export complete email
   *
   * By default this is one-time per email type. Use forceResend to override.
   */
  sendExportTrackingEmail: auditedAdminProcedureWithPermissions(
    Permission.WRITE_NFT,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin' as const,
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: ResourceType.DOMAIN_EXPORT,
      resourceId: input.id,
      action: input.forceResend ? 'resend_export_email' : 'send_export_email',
      extraInput: input,
    }),
  )
    .input(
      z.object({
        id: z.string().uuid(),
        forceResend: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ input }) => {
      const existingRecord = await db
        .select({
          id: domainExportTrackingTable.id,
          normalizedDomainName: domainExportTrackingTable.normalizedDomainName,
          chainId: domainExportTrackingTable.chainId,
          ownerAddress: domainExportTrackingTable.ownerAddress,
          status: domainExportTrackingTable.status,
          registrarKey: domainExportTrackingTable.registrarKey,
          pendingNotifiedAt: domainExportTrackingTable.pendingNotifiedAt,
          userNotified: domainExportTrackingTable.userNotified,
          notifiedAt: domainExportTrackingTable.notifiedAt,
          nftBurnTxHash: domainExportTrackingTable.nftBurnTxHash,
        })
        .from(domainExportTrackingTable)
        .where(eq(domainExportTrackingTable.id, input.id))
        .limit(1);

      if (!existingRecord[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Export tracking record not found',
        });
      }

      const record = existingRecord[0];
      const emailType = getExportTrackingEmailType(record.status);

      if (!emailType) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `No export email template applies to status: ${record.status}.`,
        });
      }

      const alreadySent =
        emailType === 'pending'
          ? Boolean(record.pendingNotifiedAt)
          : Boolean(record.userNotified);

      if (alreadySent && !input.forceResend) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            emailType === 'pending'
              ? 'Pending export email was already sent. Set forceResend=true to resend.'
              : 'Export complete email was already sent. Set forceResend=true to resend.',
        });
      }

      const userId = await getUserIdFromOwnerAddress(record.ownerAddress);
      if (!userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot send export notification: no user is linked to owner wallet ${record.ownerAddress}`,
        });
      }

      if (emailType === 'pending') {
        const pendingResult = await sendPendingExportEmail({
          userId,
          domain: record.normalizedDomainName,
          registrarKey: record.registrarKey ?? 'unknown',
        });

        if (!pendingResult.sent) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Cannot send pending export notification: user does not have a deliverable email address',
          });
        }

        const now = new Date();
        await db
          .update(domainExportTrackingTable)
          .set({
            pendingNotifiedAt: now,
            updatedAt: now,
          })
          .where(eq(domainExportTrackingTable.id, input.id));

        return {
          success: true,
          emailType,
          message: input.forceResend
            ? `Pending export email resent for ${record.normalizedDomainName}`
            : `Pending export email sent for ${record.normalizedDomainName}`,
        };
      }

      const completeResult = await sendExportCompleteEmail({
        userId,
        domain: record.normalizedDomainName,
        chainId: record.chainId,
        nftBurnTxHash: record.nftBurnTxHash ?? undefined,
      });

      if (!completeResult.sent) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Cannot send export completion notification: user does not have a deliverable email address',
        });
      }

      const now = new Date();
      await db
        .update(domainExportTrackingTable)
        .set({
          userNotified: true,
          notifiedAt: now,
          updatedAt: now,
        })
        .where(eq(domainExportTrackingTable.id, input.id));

      return {
        success: true,
        emailType,
        message: input.forceResend
          ? `Export completion email resent for ${record.normalizedDomainName}`
          : `Export completion email sent for ${record.normalizedDomainName}`,
      };
    }),

  // Subrouters
  schedules: schedulesRouter,
  poweredByNamefi: poweredByNamefiRouter,
  permissions: permissionsRouter,
  nfsc: nfscRouter,
  eppTesting: eppTestingRouter,
  emailCampaigns: emailCampaignsRouter,
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

// Helper to resolve ENS name to wallet address
const resolveENSToWallet = resolveEnsNameToAddress;
