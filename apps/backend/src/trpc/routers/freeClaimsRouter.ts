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
import { processReservationsForUser } from '../../temporal/activities/pbn-issuance-reservations.activities';
import { validateAndCreateClaimOrder } from '../../temporal/activities/free-claim.activities';
import { createTRPCRouter, protectedProcedure } from '../base';
import { createLogger } from '#lib/logger';
import { privyClient } from '../utils';
import type { FreeClaimWorkflowMemo } from '../../temporal/workflows/free-claim.workflow';
import { $withTransaction, db, freeClaimsTable } from '@namefi-astra/db';
import { eq, ilike, or, type SQL } from 'drizzle-orm';
import { isAfter } from 'date-fns';
import { groupBy, isNotNil } from 'ramda';
import type { FreeClaimSelect } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

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
        durationInYears: z.number().int().min(1).max(1),
        registrarKey: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const {
        normalizedDomainName,
        recipientWalletAddress,
        durationInYears,
        registrarKey,
      } = input;

      const chainId = 8453; // Base chain ID

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

      // Start the free claim workflow and wait for completion
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
            workflowIdConflictPolicy: 'FAIL',
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
          'Free claim workflow started, waiting for completion',
        );

        // Wait for the workflow to complete
        const workflowResult = await handle.result();

        if (workflowResult.success) {
          logger.info(
            {
              workflowId: handle.workflowId,
              userId: user.id,
              normalizedDomainName,
              orderId: workflowResult.orderId,
              orderItemId: workflowResult.orderItemId,
            },
            'Free claim processed successfully',
          );

          return {
            success: true,
            workflowId: handle.workflowId,
            orderId: workflowResult.orderId,
            orderItemId: workflowResult.orderItemId,
            message: 'Domain claimed successfully',
          };
        }
        // This shouldn't happen as the workflow throws on failure,
        // but handle it just in case
        logger.error(
          {
            workflowId: handle.workflowId,
            userId: user.id,
            normalizedDomainName,
          },
          'Free claim workflow completed but reported failure',
        );

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Free claim processing failed',
        });
      } catch (error) {
        // Check if this is a workflow execution error
        if (error && typeof error === 'object' && 'message' in error) {
          const errorMessage = String(error.message);

          // Extract meaningful error messages from workflow failures
          if (errorMessage.includes('Process Free Claim Failed:')) {
            const actualError = errorMessage.replace(
              'Process Free Claim Failed: ',
              '',
            );

            // Map common error scenarios to user-friendly messages
            if (actualError.includes('No eligible claims found')) {
              throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'No eligible claims found for this domain',
              });
            }
            if (actualError.includes('Claim validation failed')) {
              throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Unable to validate your claim for this domain',
              });
            }
            if (actualError.includes('domain not available')) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Domain is no longer available for registration',
              });
            }
            // Generic workflow execution error
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Free claim processing failed: ${actualError}`,
            });
          }
        }

        // Unknown error type
        logger.error(
          { error, userId: user.id, normalizedDomainName },
          'Unknown error processing free claim',
        );

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process free claim',
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

  /**
   * Process a free claim with transaction - validates claim and creates order in a single transaction,
   * then starts workflow with the claimId and orderIds
   */
  processClaimWithTransaction: protectedProcedure
    .input(
      z.object({
        normalizedDomainName: namefiNormalizedDomainSchema,
        recipientWalletAddress: checksumWalletAddressSchema,
        registrarKey: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { normalizedDomainName, recipientWalletAddress, registrarKey } =
        input;

      // TODO: [HIGH-IMPACT LIMITATION] Hardcoded chainId restricts multi-chain support.
      // The chainId is hardcoded to 8453 (Base), but the platform supports multiple chains
      // (config.ALLOWED_CHAINS). This means:
      // 1. Free claims can only mint NFTs on Base, even if user prefers another chain
      // 2. If Base network has issues, free claims will fail entirely
      // 3. Inconsistent with paid orders which allow chain selection via nftMetadata.nftChainId
      // Impact: High - Limits user flexibility and creates inconsistent behavior between
      // free claims and paid orders. Users expecting multi-chain support will be confused.
      // Fix: Accept chainId as input parameter (with validation against ALLOWED_CHAINS)
      // or derive from user preferences/wallet network.
      // Note: This same issue exists in the processClaim mutation above.
      const chainId = 8453; // Base chain ID

      const durationInYears = 1;
      logger.info(
        {
          userId: user.id,
          normalizedDomainName,
          recipientWalletAddress,
          chainId,
          durationInYears,
          registrarKey,
        },
        'Processing free claim with transaction',
      );

      try {
        const result = await $withTransaction(
          async (tx) => {
            // Step 1: Validate and create claim order using composed activities
            const transactionResult = await validateAndCreateClaimOrder({
              userId: user.id,
              normalizedDomainName,
              durationInYears,
              registrarKey,
              recipientWalletAddress,
              chainId,
              tx,
            });

            const { orderId, orderItemId, claimId } = transactionResult;

            logger.info(
              {
                claimId,
                orderId,
                orderItemId,
                userId: user.id,
                normalizedDomainName,
              },
              'Claim validation and order creation completed, starting workflow',
            );

            // Step 2: Start the workflow with the pre-created claim and order IDs
            const workflowInput = {
              userId: user.id,
              normalizedDomainName,
              recipientWalletAddress,
              chainId,
              durationInYears,
              registrarKey,
              claimId,
              orderId,
              orderItemId,
            };

            const handle = await temporalClient.workflow.start(
              processFreeClaimWorkflow,
              {
                args: [workflowInput],
                taskQueue: TEMPORAL_QUEUES.DOMAINS,
                workflowId: processFreeClaimWorkflow.generateId(workflowInput),
                workflowIdReusePolicy: 'ALLOW_DUPLICATE_FAILED_ONLY',
                workflowIdConflictPolicy: 'FAIL',
                searchAttributes: {
                  userId: [user.id],
                  domainName: [normalizedDomainName],
                },
              },
            );
            // Return immediately with the IDs - don't wait for workflow completion
            return {
              success: true,
              workflowId: handle.workflowId,
              claimId,
              orderId,
              orderItemId,
              message: 'Free claim processing started',
            };
          },
          {
            isolationLevel: 'serializable',
            deferrable: false,
          },
        );

        logger.info(
          result,
          'Free claim workflow started with pre-created claim and order',
        );

        return result;
      } catch (error) {
        logger.error(
          { error, userId: user.id, normalizedDomainName },
          'Error processing free claim with transaction',
        );

        // Map common errors to user-friendly messages
        if (error instanceof Error) {
          if (error.message.includes('No eligible claim found')) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'No eligible claims found for this domain',
            });
          }
          if (error.message.includes('Claim has expired')) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Your claim for this domain has expired',
            });
          }
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process free claim',
        });
      }
    }),

  getUserClaims: protectedProcedure.query(async ({ ctx }) => {
    const { user, poweredByNamefiDomain } = ctx;

    // Handle pending gifts for this user before fetching claims
    try {
      const privyUser = await privyClient.getUser(user.privyUserId);
      const userEmail = privyUser?.linkedAccounts?.find(
        (account) => account.type === 'email',
      )?.address;

      if (userEmail) {
        const giftResult = await processReservationsForUser({
          userId: user.id,
          userEmail,
        });

        if (giftResult.freeClaimsCreated > 0) {
          logger.info(
            {
              userId: user.id,
              freeClaimsCreated: giftResult.freeClaimsCreated,
            },
            'Created free claims from pending reservations',
          );
        }
      }
    } catch (error) {
      logger.error(
        { error, userId: user.id },
        'Failed to handle pending reservations',
      );
      // Don't throw - gift processing failure shouldn't prevent free claims fetch
    }

    const where: SQL[] = [eq(freeClaimsTable.userId, user.id)];

    if (poweredByNamefiDomain) {
      const condition = or(
        eq(
          freeClaimsTable.parentDomain,
          poweredByNamefiDomain as NamefiNormalizedDomain,
        ),
        ilike(freeClaimsTable.parentDomain, `%.${poweredByNamefiDomain}`),
      );
      if (!condition) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: "Server Can't Query Data",
        });
      }
      where.push(condition);
    }

    const claims: FreeClaimSelect[] = await db.query.freeClaimsTable.findMany({
      where: (_, { and }) => and(...where),
    });

    const now = new Date();

    const claimsWithStatus: (FreeClaimSelect & { isExpired: boolean })[] =
      claims.map((claim) => ({
        ...claim,
        isExpired:
          isNotNil(claim.expirationDate) && isAfter(now, claim.expirationDate),
      }));

    const getGroupKey = (claim: (typeof claimsWithStatus)[0]) =>
      claim.parentDomain
        ? `${claim.groupOrCampaignKey}_${claim.parentDomain}`
        : claim.id;

    const grouped = groupBy(getGroupKey, claimsWithStatus);

    return Object.values(grouped).map((claims) => {
      if (!claims || !claims[0]) {
        return null;
      }
      const parentDomain = claims[0].parentDomain;
      const reason = claims[0].reason;
      const groupOrCampaignKey = claims[0].groupOrCampaignKey;

      const availableClaims = claims.filter(
        (claim) => !claim.isExpired && claim.claimingStatus === 'IDLE',
      );
      const expiredClaims = claims.filter(
        (claim) => claim.isExpired && claim.claimingStatus === 'IDLE',
      );
      const unclaimedClaims = claims.filter(
        (claim) => !claim.isExpired && claim.claimingStatus !== 'IDLE',
      );
      if (parentDomain) {
        return {
          type: 'campaignParentDomain' as const,
          groupOrCampaignKey,
          parentDomain,
          reason,
          counts: {
            total: claims.length,
            available: availableClaims.length,
            expired: expiredClaims.length,
            unclaimed: unclaimedClaims.length,
          },
          claims,
        } satisfies GetUserClaimsResponse;
      }
      return {
        type: 'singleExactDomain' as const,
        claim: claims[0],
      } satisfies GetUserClaimsResponse;
    });
  }),
});

type GetUserClaimsResponse =
  | {
      type: 'campaignParentDomain';
      groupOrCampaignKey: string;
      parentDomain: NamefiNormalizedDomain;
      reason: string | null;
      counts: {
        total: number;
        available: number;
        expired: number;
        unclaimed: number;
      };
      claims: (FreeClaimSelect & { isExpired: boolean })[];
    }
  | {
      type: 'singleExactDomain';
      claim: FreeClaimSelect & { isExpired: boolean };
    };
