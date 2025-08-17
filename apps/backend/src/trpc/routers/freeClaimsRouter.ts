import {
  checksumWalletAddressSchema,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import { processFreeClaimWorkflow } from '../../temporal/workflows/free-claim.workflow';
import {
  checkAnyClaimEligibility,
  checkClaimEligibility,
} from '../../temporal/activities/free-claim.activities';
import { createTRPCRouter, protectedProcedure } from '../base';
import { createLogger } from '#lib/logger';

const logger = createLogger({ context: 'freeClaimsRouter' });

export const freeClaimsRouter = createTRPCRouter({
  /**
   * Check if a user is eligible for a free claim for a specific domain
   */
  checkEligibility: protectedProcedure
    .input(
      z.object({
        groupOrCampaignKey: z.string().min(1),
        normalizedDomainName: namefiNormalizedDomainSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { groupOrCampaignKey, normalizedDomainName } = input;

      logger.info(
        { userId: user.id, groupOrCampaignKey, normalizedDomainName },
        'Checking free claim eligibility',
      );

      try {
        const eligibilityResult = await checkClaimEligibility({
          userId: user.id,
          groupOrCampaignKey,
          normalizedDomainName,
        });

        return eligibilityResult;
      } catch (error) {
        logger.error(
          { error, userId: user.id, groupOrCampaignKey, normalizedDomainName },
          'Error checking free claim eligibility',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check claim eligibility',
        });
      }
    }),

  /**
   * Process a free claim for a domain
   */
  processClaim: protectedProcedure
    .input(
      z.object({
        normalizedDomainName: namefiNormalizedDomainSchema,
        recipientWalletAddress: checksumWalletAddressSchema,
        chainId: z.number().int().positive(),
        durationInYears: z.number().int().min(1).max(10),
        registrarKey: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const {
        normalizedDomainName,
        recipientWalletAddress,
        chainId,
        durationInYears,
        registrarKey,
      } = input;

      logger.info(
        {
          userId: user.id,
          normalizedDomainName,
          recipientWalletAddress,
          chainId,
          durationInYears,
          registrarKey,
        },
        'Processing free claim',
      );

      // First check if the user has any eligible claims for this domain
      try {
        const eligibilityResult = await checkAnyClaimEligibility({
          userId: user.id,
          normalizedDomainName,
        });

        if (!eligibilityResult.eligible) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message:
              eligibilityResult.reason ||
              'No eligible claims found for this domain',
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error(
          { error, userId: user.id, normalizedDomainName },
          'Error checking claim eligibility before processing',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify claim eligibility',
        });
      }

      // Start the free claim workflow
      try {
        const workflowInput = {
          userId: user.id,
          normalizedDomainName,
          recipientWalletAddress,
          chainId,
          durationInYears,
          registrarKey,
        };

        const handle = await temporalClient.workflow.start(
          processFreeClaimWorkflow,
          {
            args: [workflowInput],
            taskQueue: TEMPORAL_QUEUES.DOMAINS,
            workflowId: processFreeClaimWorkflow.generateId(workflowInput),
            workflowIdReusePolicy: 'ALLOW_DUPLICATE_FAILED_ONLY',
            workflowIdConflictPolicy: 'USE_EXISTING',
            searchAttributes: {
              userId: [user.id],
              domainName: [normalizedDomainName],
            },
          },
        );

        logger.info(
          {
            workflowId: handle.workflowId,
            userId: user.id,
            normalizedDomainName,
          },
          'Free claim workflow started',
        );

        return {
          workflowId: handle.workflowId,
          message: 'Free claim processing started',
        };
      } catch (error) {
        logger.error(
          { error, userId: user.id, normalizedDomainName },
          'Error starting free claim workflow',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to start claim processing',
        });
      }
    }),
});
