import {
  db,
  namefiNftOwnersView,
  namefiNftView,
  indexedDomainsTable,
  usersTable,
  namefiNftCte,
  namefiNftOwnersCte,
  domainUserPreferencesTable,
} from '@namefi-astra/db';
import { namefiNormalizedDomainSchema, Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import { ensureNftIsLockedAndBurnByNftName } from '#temporal/workflows/mint.workflow';
import {
  bulkBurnApprovalSignal,
  bulkBurnCancelSignal,
  getBulkBurnWorkflowStateQuery,
  type BulkBurnWorkflowState,
} from '#temporal/workflows/bulk-burn-expired-domains.workflow';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
  createTRPCRouter,
} from '../../base';
import {
  getPoweredByNamefi3PDomains,
  sldRegistrar,
} from '#lib/namefi-registry';
import { logger } from '#lib/logger';
import { ResourceType } from '#lib/auditor';
import {
  ensurePrivyTableFresh,
  privyUsersTableSchema,
} from '../../../services/admin/privy-user-cache';
import {
  DATE_MISMATCH_THRESHOLD_SECONDS,
  MAX_GRACE_PERIOD_DAYS,
} from '../../../services/admin/common';

export const bulkBurnRouter = createTRPCRouter({
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

  enrichBulkBurnDomains: adminProcedureWithPermissions(Permission.WRITE_NFT)
    .input(
      z.object({
        domainNames: z.array(namefiNormalizedDomainSchema).max(5000),
      }),
    )
    .query(async ({ input }) => {
      const { domainNames } = input;
      if (domainNames.length === 0) return {};

      await ensurePrivyTableFresh();

      // Join chain: nftView → privyUsersCache (on wallet) → usersTable (on privyUserId)
      // Then use the resolved userId to look up domainUserPreferences for the current owner
      const rows = await db
        .with(namefiNftCte)
        .selectDistinctOn([namefiNftView.normalizedDomainName], {
          normalizedDomainName: namefiNftView.normalizedDomainName,
          autoRenewEnabled: domainUserPreferencesTable.autoRenewEnabled,
          userId: usersTable.id,
          privyUserId: usersTable.privyUserId,
          userEmail: sql<
            string | null
          >`COALESCE(${privyUsersTableSchema.email}, ${usersTable.primaryEmail})`.as(
            'user_email',
          ),
        })
        .from(namefiNftView)
        .leftJoin(
          privyUsersTableSchema,
          sql`LOWER(${namefiNftView.ownerAddress}) = ANY(array_lowercase(${privyUsersTableSchema.wallets}))`,
        )
        .leftJoin(
          usersTable,
          eq(usersTable.privyUserId, privyUsersTableSchema.privyUserId),
        )
        .leftJoin(
          domainUserPreferencesTable,
          and(
            eq(
              domainUserPreferencesTable.normalizedDomainName,
              namefiNftView.normalizedDomainName,
            ),
            sql`${domainUserPreferencesTable.userId}::text = ${usersTable.id}::text`,
          ),
        )
        .where(
          sql`${namefiNftView.normalizedDomainName} = ANY(ARRAY[${sql.join(
            domainNames.map((v) => sql`${v}`),
            sql.raw(', '),
          )}])`,
        )
        .orderBy(namefiNftView.normalizedDomainName);

      const result: Record<
        string,
        { autoRenewEnabled: boolean | null; userEmail: string | null }
      > = {};
      for (const row of rows) {
        result[row.normalizedDomainName] = {
          autoRenewEnabled: row.autoRenewEnabled ?? null,
          userEmail: row.userEmail ?? null,
        };
      }
      return result;
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
});
