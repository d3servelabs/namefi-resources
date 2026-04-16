import {
  auditedAdminProcedureWithPermissions,
  adminProcedureWithPermissions,
} from '../../base';
import { createContractTRPCRouter } from '../../contract';
import { adminNfscContract } from '@namefi-astra/common/contract/admin/admin-nfsc-contract';
import { Permission } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import { mintNfsc } from '#temporal/workflows/mint.workflow';
import { logger } from '#lib/logger';
import { config } from '#lib/env';
import {
  buildListWorkflowExecutionsQuery,
  convertWorkflowStatusToString,
  decodeNextPageToken,
  parseMemo,
  parseSearchAttributes,
} from '#temporal/utils/query';

export const nfscRouter = createContractTRPCRouter<typeof adminNfscContract>({
  listRecentMintWorkflows: adminProcedureWithPermissions(Permission.MINT_NFSC)
    .input(adminNfscContract.listRecentMintWorkflows.input)
    .output(adminNfscContract.listRecentMintWorkflows.output)
    .query(async ({ input }) => {
      const { days, limit, pageToken } = input;

      try {
        await temporalClient.connection.ensureConnected();

        // Calculate the date range
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - days);

        // Query for NFSC mint workflows
        const workflowListResponse =
          await temporalClient.workflowService.listWorkflowExecutions(
            buildListWorkflowExecutionsQuery({
              namespace: config.TEMPORAL_NAMESPACE,
              pageSize: limit,
              query: `StartTime > "${startTime.toISOString()}" AND ( (WorkflowType = "mintNfsc" AND callerType = "admin") OR WorkflowId STARTS_WITH "admin-mint-nfsc-" )`,
              nextPageToken: pageToken,
            }),
          );

        // Extract nextPageToken
        const responseNextPageToken = decodeNextPageToken(
          workflowListResponse.nextPageToken,
        );

        const workflows = [];

        for (const workflowExecution of workflowListResponse.executions || []) {
          try {
            const execution = workflowExecution.execution;
            const workflowType = workflowExecution.type;
            const status = workflowExecution.status;
            const startTime = workflowExecution.startTime;
            const closeTime = workflowExecution.closeTime;

            // Parse memo fields
            const memoData = parseMemo(workflowExecution.memo);
            // Parse search attributes
            const searchAttributesData = parseSearchAttributes(
              workflowExecution.searchAttributes,
            );

            // Parse workflow ID as fallback for memo data
            // Format: admin-mint-nfsc-[walletAddress]-[chainId]-[timestamp]
            const parsedFromId = getMintNfscWorkflowDataFromId(
              execution?.workflowId || '',
            );

            // Merge memo data with parsed ID data (memo takes precedence)
            const enrichedMemo = {
              ...parsedFromId,
              ...memoData,
            };

            workflows.push({
              workflowId: execution?.workflowId || 'Unknown',
              workflowType: workflowType?.name || 'Unknown',
              status: convertWorkflowStatusToString(status),
              startTime: startTime?.seconds
                ? new Date(Number(startTime.seconds) * 1000)
                : null,
              closeTime: closeTime?.seconds
                ? new Date(Number(closeTime.seconds) * 1000)
                : null,
              runId: execution?.runId || 'Unknown',
              memo: enrichedMemo,
              searchAttributes: searchAttributesData,
            });
          } catch (error) {
            logger.error(
              { workflowId: workflowExecution.execution?.workflowId, error },
              'Failed to process workflow',
            );
          }
        }

        return {
          workflows,
          nextPageToken: responseNextPageToken,
          hasNextPage: Boolean(responseNextPageToken),
        };
      } catch (error) {
        logger.error({ error }, 'Failed to fetch NFSC mint workflows');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch workflows',
          cause: error,
        });
      }
    }),

  mintBulk: auditedAdminProcedureWithPermissions(
    Permission.MINT_NFSC,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'admin',
      actorId: ctx.user.id,
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'nfsc',
      resourceId: '',
      action: 'bulk_mint_nfsc',
      extraInput: {
        ...input,
        userCount: input.users.length,
        totalAmount: input.users.reduce(
          (sum: number, u: any) => sum + u.amount,
          0,
        ),
      },
    }),
  )
    .input(adminNfscContract.mintBulk.input)
    .output(adminNfscContract.mintBulk.output)
    .mutation(async ({ input, ctx }) => {
      const { users, chainId, reason } = input;

      logger.debug(
        {
          adminId: ctx.user.id,
          userCount: users.length,
          chainId,
          reason,
        },
        'Starting bulk NFSC mint operation',
      );

      const results: Array<{
        walletAddress: string;
        amount: number;
        workflowId: string;
        status: 'started' | 'error';
        error?: string;
      }> = [];

      const errors: Array<{
        walletAddress: string;
        amount: number;
        error: string;
      }> = [];

      for (const user of users) {
        try {
          const input = {
            chainId,
            account: user.walletAddress,
            amountInUsd: user.amount,
          };
          const workflowId = mintNfsc.generateId(input);
          await temporalClient.workflow.start(mintNfsc, {
            workflowId,
            taskQueue: TEMPORAL_QUEUES.MINT,
            args: [input],
            searchAttributes: {
              callerType: ['admin'],
              caller: [ctx.user.id],
              userId: [user.walletAddress], //todo
              affectedResources: ['nfsc', `nfsc:${user.walletAddress}`],
            },
            memo: {
              description: `Admin bulk mint - ${reason}`,
              adminId: ctx.user.id,
              adminEmail: ctx.user.primaryEmail || 'unknown',
              reason,
              customMemo: user.memo,
              recipientWallet: user.walletAddress,
              amount: user.amount,
              chainId,
              timestamp: new Date().toISOString(),
              operation: 'bulk_mint_nfsc',
            },
          });

          results.push({
            walletAddress: user.walletAddress,
            amount: user.amount,
            workflowId,
            status: 'started',
          });

          logger.debug(
            {
              walletAddress: user.walletAddress,
              amount: user.amount,
              workflowId,
            },
            'Started NFSC mint workflow',
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';

          errors.push({
            walletAddress: user.walletAddress,
            amount: user.amount,
            error: errorMessage,
          });

          results.push({
            walletAddress: user.walletAddress,
            amount: user.amount,
            workflowId: '',
            status: 'error',
            error: errorMessage,
          });

          logger.error(
            {
              walletAddress: user.walletAddress,
              amount: user.amount,
              error,
            },
            'Failed to start NFSC mint workflow',
          );
        }
      }

      const successCount = results.filter((r) => r.status === 'started').length;
      const errorCount = errors.length;

      logger.debug(
        {
          adminId: ctx.user.id,
          totalUsers: users.length,
          successCount,
          errorCount,
        },
        'Completed bulk NFSC mint operation',
      );

      if (errorCount === users.length) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'All NFSC mint workflows failed to start',
        });
      }
      return {
        success: true,
        message: `Successfully started ${successCount} NFSC mint workflows`,
        results,
        errors,
        summary: {
          total: users.length,
          successful: successCount,
          failed: errorCount,
        },
      };
    }),
});

const mintNfscWorkflowIdRegex =
  /(admin-)?mint-nfsc-\[(0x[a-fA-F0-9]{40})\]-\[(\d+)\]-\[(\d+)\]/;
function getMintNfscWorkflowDataFromId(workflowId: string) {
  let parsedFromId: {
    recipientWallet?: string;
    chainId?: number;
    timestamp?: string;
  } = {};

  try {
    const idMatch = workflowId.match(mintNfscWorkflowIdRegex);
    if (idMatch) {
      parsedFromId = {
        recipientWallet: idMatch[2],
        chainId: Number.parseInt(idMatch[3], 10),
        timestamp: new Date(Number.parseInt(idMatch[4], 10)).toISOString(),
      };
    }
  } catch (e) {
    logger.warn({ workflowId, error: e }, 'Failed to parse workflow ID');
  }
  return parsedFromId;
}
