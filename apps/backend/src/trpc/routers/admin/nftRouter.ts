import {
  db,
  namefiNftOwnersView,
  namefiNftView,
  indexedDomainsTable,
  namefiNftCte,
  namefiNftOwnersCte,
} from '@namefi-astra/db';
import { type NamefiNormalizedDomain, Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import { ensureNftIsLockedAndBurnByNftName } from '#temporal/workflows/mint.workflow';
import { extendDomainRegistrationWorkflow } from '#temporal/workflows/domain-ownership/extend-registration.workflow';
import { fixNftExpirationWorkflow } from '#temporal/workflows/fix-nft-expiration.workflow';
import {
  adminProcedureWithPermissions,
  auditedAdminProcedureWithPermissions,
} from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminNftContract } from '@namefi-astra/common/contract/admin/admin-nft-contract';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import { config } from '#lib/env';
import { logger } from '#lib/logger';
import { getDomainChain } from '#temporal/activities/domain/index';
import { getNftsWithExpirationStatus } from '../../../services/admin/domains-nfts';

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

export const nftRouter = createContractTRPCRouter<typeof adminNftContract>({
  getNftsWithExpirationStatus: adminProcedureWithPermissions(
    Permission.READ_NFT,
  )
    .input(adminNftContract.getNftsWithExpirationStatus.input)
    .output(adminNftContract.getNftsWithExpirationStatus.output)
    .query(async ({ input }) => getNftsWithExpirationStatus(input)),

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
    .input(adminNftContract.burnNft.input)
    .output(adminNftContract.burnNft.output)
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
    .input(adminNftContract.getBurnWorkflowStatus.input)
    .output(adminNftContract.getBurnWorkflowStatus.output)
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

  getActiveBurnWorkflows: adminProcedureWithPermissions(Permission.READ_NFT)
    .input(adminNftContract.getActiveBurnWorkflows.input)
    .output(adminNftContract.getActiveBurnWorkflows.output)
    .query(async () => {
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

  getActiveFixExpirationWorkflows: adminProcedureWithPermissions(
    Permission.READ_NFT,
  )
    .input(adminNftContract.getActiveFixExpirationWorkflows.input)
    .output(adminNftContract.getActiveFixExpirationWorkflows.output)
    .query(async () => {
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
        logger.trace(
          { context: 'getActiveFixExpirationWorkflows', error },
          'Failed to fetch active fix expiration workflows',
        );
        return [];
      }
    }),

  getActiveExtendRegistrationWorkflows: adminProcedureWithPermissions(
    Permission.READ_NFT,
  )
    .input(adminNftContract.getActiveExtendRegistrationWorkflows.input)
    .output(adminNftContract.getActiveExtendRegistrationWorkflows.output)
    .query(async () => {
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
    .input(adminNftContract.extendRegistration.input)
    .output(adminNftContract.extendRegistration.output)
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
    .input(adminNftContract.fixNftExpiration.input)
    .output(adminNftContract.fixNftExpiration.output)
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
    .input(adminNftContract.getWorkflowHistory.input)
    .output(adminNftContract.getWorkflowHistory.output)
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
});
