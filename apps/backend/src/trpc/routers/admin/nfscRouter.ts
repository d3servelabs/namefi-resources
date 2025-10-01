import { z } from 'zod';
import {
  auditedAdminProcedureWithPermissions,
  createTRPCRouter,
} from '../../base';
import { Permission, checksumWalletAddressSchema } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import { mintNfsc } from '#temporal/workflows/mint.workflow';
import * as chains from 'viem/chains';
import { logger } from '#lib/logger';

export const nfscRouter = createTRPCRouter({
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
    .input(
      z.object({
        users: z
          .array(
            z.object({
              walletAddress: checksumWalletAddressSchema,
              amount: z.number().min(1).max(10000),
              memo: z.string().optional(),
            }),
          )
          .min(1)
          .max(100),
        chainId: z.number().default(chains.base.id),
        reason: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { users, chainId, reason } = input;

      logger.info(
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
          const workflowId = `admin-mint-nfsc-[${user.walletAddress}]-[${chainId}]-[${Date.now()}]`;

          await temporalClient.workflow.start(mintNfsc, {
            workflowId,
            taskQueue: TEMPORAL_QUEUES.MINT,
            args: [chainId, user.walletAddress, user.amount],
            memo: {
              description: `Admin bulk mint - ${reason}`,
              adminId: ctx.user.id,
              adminEmail: ctx.user.primaryEmail || 'unknown',
              reason,
              customMemo: user.memo,
              walletAddress: user.walletAddress,
              amount: user.amount,
              timestamp: new Date().toISOString(),
            },
          });

          results.push({
            walletAddress: user.walletAddress,
            amount: user.amount,
            workflowId,
            status: 'started',
          });

          logger.info(
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

      logger.info(
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
