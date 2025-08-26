import { log } from '@temporalio/workflow';
import { TEMPORAL_ENUMS } from '../shared/enums';
import { typedProxyActivities } from '../shared/workflow-helpers';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

export type FreeClaimsCorrectionWorkflowInput = {
  campaignKey: string;
  incorrectParentDomain: NamefiNormalizedDomain;
  correctParentDomain: NamefiNormalizedDomain;
  campaignName: string;
  alreadyCorrectedInDb: boolean;
};

export type FreeClaimsCorrectionWorkflowResult = {
  totalClaimsFound: number;
  usersNotified: number;
  errors: Array<{ userId: string; reason: string }>;
};

// Proxy activities with appropriate timeouts
const { getClaimsForCampaign, sendFreeClaimsCorrectionEmail } =
  typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DEFAULT,
    options: {
      startToCloseTimeout: '10 minutes',
      retry: {
        initialInterval: '1s',
        maximumInterval: '30s',
        backoffCoefficient: 2.0,
        maximumAttempts: 3,
      },
    },
  });

/**
 * Workflow to send correction emails for free claims that were granted
 * with the incorrect parent domain
 */
export async function freeClaimsCorrectionWorkflow(
  input: FreeClaimsCorrectionWorkflowInput,
): Promise<FreeClaimsCorrectionWorkflowResult> {
  const {
    campaignKey,
    incorrectParentDomain,
    correctParentDomain,
    campaignName,
  } = input;

  log.info('Starting free claims correction workflow', {
    campaignKey,
    incorrectParentDomain,
    correctParentDomain,
    campaignName,
  });

  // Get all claims for this campaign with the incorrect parent domain
  const claims = await getClaimsForCampaign({
    campaignKey,
    parentDomain: input.alreadyCorrectedInDb
      ? correctParentDomain
      : incorrectParentDomain,
  });

  log.info('Claims found for correction', {
    totalClaims: claims.length,
    campaignKey,
    incorrectParentDomain,
  });

  if (claims.length === 0) {
    log.info('No claims found for correction, ending workflow');
    return {
      totalClaimsFound: 0,
      usersNotified: 0,
      errors: [],
    };
  }

  // Group claims by user
  const claimsByUser = claims.reduce(
    (acc: Record<string, typeof claims>, claim) => {
      if (!acc[claim.userId]) {
        acc[claim.userId] = [];
      }
      acc[claim.userId].push(claim);
      return acc;
    },
    {} as Record<string, typeof claims>,
  );

  const usersNotified = new Set<string>();
  const errors: Array<{ userId: string; reason: string }> = [];

  // Send correction emails to each user
  for (const [userId, userClaims] of Object.entries(claimsByUser)) {
    try {
      await sendFreeClaimsCorrectionEmail({
        userId,
        campaignKey,
        campaignName,
        incorrectParentDomain,
        correctParentDomain,
        claimsGranted: userClaims.map((claim) => ({
          source: ((claim.metadata?.source as 'UPVOTE' | 'SHARE') ??
            'UNKNOWN') as 'UPVOTE' | 'SHARE' | 'UNKNOWN',
          sourceId: (claim.metadata?.sourceId as string) ?? claim.id,
          domainName: claim.exactDomainName ?? undefined,
          reason: claim.reason ?? 'Free claim granted',
          expirationDate: claim.expirationDate
            ? new Date(claim.expirationDate).toISOString()
            : undefined,
        })),
        totalClaimsGranted: userClaims.length,
      });

      usersNotified.add(userId);
      log.info('Correction email sent successfully', { userId });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push({
        userId,
        reason: errorMessage,
      });
      log.warn('Failed to send correction email', {
        userId,
        error: errorMessage,
      });
    }
  }

  const result: FreeClaimsCorrectionWorkflowResult = {
    totalClaimsFound: claims.length,
    usersNotified: usersNotified.size,
    errors,
  };

  log.info('Free claims correction workflow completed', result);

  return result;
}

// Generate unique workflow ID based on input
freeClaimsCorrectionWorkflow.generateId = (
  input: FreeClaimsCorrectionWorkflowInput,
): string => {
  return `free-claims-correction-${input.campaignKey}-${input.incorrectParentDomain}`;
};
