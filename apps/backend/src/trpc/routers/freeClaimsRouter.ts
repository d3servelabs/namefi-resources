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
import type { FreeClaimWorkflowMemo } from '../../temporal/workflows/free-claim.workflow';

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
  /**
   * Get the status of a free claim workflow
   */
  getDomainClaimStatus: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema,
        claimId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { domainName, claimId } = input;

      try {
        const workflows = await temporalClient.workflow.list({
          query: `domainName='${domainName}' AND userId='${user.id}' AND workflowType='processFreeClaimWorkflow'`,
        });
        let workflowId = null;
        for await (const workflow of workflows) {
          const memo = workflow.memo as FreeClaimWorkflowMemo | undefined;
          if (claimId && memo?.freeClaim?.claimId === claimId) {
            workflowId = workflow.workflowId;
            break;
          }
          if (!claimId) {
            workflowId = workflow.workflowId;
            break;
          }
        }

        if (!workflowId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Workflow not found',
          });
        }

        const handle = temporalClient.workflow.getHandle(workflowId);
        const description = await handle.describe();
        let result = null;
        let workflowState = null;

        if (description.status.name === 'COMPLETED') {
          result = await handle.result();
        }

        // Query the workflow for detailed state information
        if (
          description.status.name === 'RUNNING' ||
          description.status.name === 'COMPLETED'
        ) {
          try {
            workflowState = await handle.query('getWorkflowState');
          } catch (queryError) {
            // If query fails, just log it and continue
            logger.warn(
              { queryError, workflowId },
              'Failed to query workflow state',
            );
          }
        }

        return {
          status: description.status.name,
          result,
          workflowState,
          startTime: description.startTime,
          closeTime: description.closeTime,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error(
          { error, userId: user.id, domainName, claimId },
          'Error getting free claim workflow status',
        );
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workflow not found or inaccessible',
        });
      }
    }),

  /**
   * Search for free claim workflows by user ID or domain name
   */
  searchWorkflows: protectedProcedure
    .input(
      z.object({
        domainName: namefiNormalizedDomainSchema.optional(),
        groupOrCampaignKey: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { domainName, groupOrCampaignKey, limit } = input;

      try {
        // Build search query
        const searchQuery = [
          `workflowType='processFreeClaimWorkflow'`,
          `userId='${user.id}'`,
        ];

        if (domainName) {
          searchQuery.push(`domainName='${domainName}'`);
        }

        const workflows = temporalClient.workflow.list({
          query: searchQuery.join(' AND '),
        });

        const workflowSummaries = [];
        let count = 0;
        for await (const workflow of workflows) {
          if (count >= limit) break;

          workflowSummaries.push({
            workflowId: workflow.workflowId,
            workflowType: workflow.type,
            status: workflow.status.name,
            startTime: workflow.startTime,
            closeTime: workflow.closeTime,
            searchAttributes: workflow.searchAttributes,
          });
          count++;
        }

        return workflowSummaries;
      } catch (error) {
        logger.error(
          { error, userId: user.id, domainName, groupOrCampaignKey },
          'Error searching free claim workflows',
        );
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search workflows',
        });
      }
    }),
});
