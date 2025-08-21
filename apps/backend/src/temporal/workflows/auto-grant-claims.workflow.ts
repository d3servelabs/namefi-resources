import { log } from '@temporalio/workflow';
import { TEMPORAL_ENUMS } from '../shared/enums';
import type {
  CampaignKey,
  Candidate,
} from '../activities/default/campaign-candidate-collection.activities';
import type {
  GrantClaimAtomicInput,
  UserNotificationBatch,
} from '../activities/default/campaign-grant-claims.activities';
import { typedProxyActivities } from '../shared/workflow-helpers';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

export type GrantClaimsWorkflowInput = {
  campaignKey: CampaignKey;
  candidates: Candidate[];
  notifyUsers?: boolean;
};

export type GrantClaimsWorkflowResult = {
  granted: number;
  skipped: number;
  errors: Array<{ userId: string; reason: string }>;
};

// Proxy activities with appropriate timeouts
const {
  grantClaimAtomic,
  sendNotifications,
  getAllNewUpvoteCandidates,
  getAllNewTweetShareCandidates,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: {
    startToCloseTimeout: '5 minutes',
    retry: {
      initialInterval: '1s',
      maximumInterval: '30s',
      backoffCoefficient: 2.0,
      maximumAttempts: 5,
    },
  },
});

export type AutoGrantClaimsWorkflowInput = {
  campaignKey: CampaignKey;
  sources: ('UPVOTE' | 'SHARE')[];
  parentDomain: NamefiNormalizedDomain;
  votingTargetDomain?: NamefiNormalizedDomain;
  sharingTargetDomain?: NamefiNormalizedDomain;
  notifyUsers?: boolean;
  expirationDate?: Date;
};

/**
 * Automatically collect candidates and grant claims for campaign
 */
export async function autoGrantClaimsWorkflow(
  input: AutoGrantClaimsWorkflowInput,
): Promise<GrantClaimsWorkflowResult> {
  const {
    campaignKey,
    sources,
    parentDomain,
    votingTargetDomain,
    sharingTargetDomain,
    notifyUsers = true,
    expirationDate,
  } = input;

  log.info('Starting auto grant claims workflow', {
    campaignKey,
    sources,
    votingTargetDomain,
    sharingTargetDomain,
    notifyUsers,
  });

  const allCandidates: Candidate[] = [];

  // Collect candidates for each requested source
  for (const source of sources) {
    try {
      let candidates: Candidate[] = [];

      if (source === 'UPVOTE') {
        candidates = await getAllNewUpvoteCandidates(
          campaignKey,
          parentDomain,
          votingTargetDomain,
        );
        log.info(`Collected ${candidates.length} new upvote candidates`);
      } else if (source === 'SHARE') {
        candidates = await getAllNewTweetShareCandidates(
          campaignKey,
          parentDomain,
          sharingTargetDomain,
        );
        log.info(`Collected ${candidates.length} new tweet share candidates`);
      }

      allCandidates.push(...candidates);
    } catch (error) {
      log.warn('Failed to collect candidates for source', {
        source,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  log.info('Total candidates collected', {
    totalCandidates: allCandidates.length,
    bySource: sources.reduce(
      (acc, source) => {
        acc[source] = allCandidates.filter((c) => c.source === source).length;
        return acc;
      },
      {} as Record<string, number>,
    ),
  });

  if (allCandidates.length === 0) {
    log.info('No new candidates found, ending workflow');
    return {
      granted: 0,
      skipped: 0,
      errors: [],
    };
  }

  // Process candidates
  let granted = 0;
  let skipped = 0;
  const errors: Array<{ userId: string; reason: string }> = [];
  const userGrantCounts: Record<string, number> = {};
  const userGrantedClaimIds: Record<string, string[]> = {};

  // Process each candidate
  for (const candidate of allCandidates) {
    try {
      const grantInput: GrantClaimAtomicInput = {
        campaignKey,
        userId: candidate.userId,
        source: candidate.source,
        sourceId: candidate.sourceId,
        extras: {
          domainName: candidate.domainName,
          postUrl: candidate.postUrl,
          sharedUrl: candidate.sharedUrl,
        },
        parentDomain,
        expirationDate,
      };

      const result = await grantClaimAtomic(grantInput);

      if (result.granted && result.claimId) {
        granted++;
        userGrantCounts[candidate.userId] =
          (userGrantCounts[candidate.userId] || 0) + 1;

        // Track the granted claim ID for this user
        if (!userGrantedClaimIds[candidate.userId]) {
          userGrantedClaimIds[candidate.userId] = [];
        }
        userGrantedClaimIds[candidate.userId].push(result.claimId);

        log.info('Claim granted successfully', {
          userId: candidate.userId,
          source: candidate.source,
          sourceId: candidate.sourceId,
          claimId: result.claimId,
        });
      } else {
        skipped++;

        log.info('Claim skipped', {
          userId: candidate.userId,
          source: candidate.source,
          sourceId: candidate.sourceId,
          reason: result.reason,
        });
      }
    } catch (error) {
      skipped++;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      errors.push({
        userId: candidate.userId,
        reason: errorMessage,
      });

      log.warn('Error processing candidate', {
        userId: candidate.userId,
        source: candidate.source,
        sourceId: candidate.sourceId,
        error: errorMessage,
      });
    }
  }

  // Send notifications if requested and there are grants to notify about
  if (notifyUsers && granted > 0) {
    try {
      const userBatches: UserNotificationBatch[] = Object.entries(
        userGrantCounts,
      ).map(([userId, grantedCount]) => ({
        userId,
        grantedCount,
        campaignKey,
        parentDomain,
        grantedClaimIds: userGrantedClaimIds[userId] || [],
      }));

      await sendNotifications(userBatches);

      log.info('Notifications sent', {
        notifiedUsers: userBatches.length,
        totalGrants: granted,
      });
    } catch (notificationError) {
      log.warn('Failed to send notifications, but continuing', {
        error:
          notificationError instanceof Error
            ? notificationError.message
            : 'Unknown notification error',
        affectedUsers: Object.keys(userGrantCounts).length,
      });
    }
  }

  const result: GrantClaimsWorkflowResult = {
    granted,
    skipped,
    errors,
  };

  log.info('Auto grant claims workflow completed', result);

  return result;
}

// Generate unique workflow ID based on input
autoGrantClaimsWorkflow.generateId = (
  input: AutoGrantClaimsWorkflowInput,
): string => {
  const sourcesStr = input.sources.join('-');
  return `auto-grant-claims-${input.campaignKey}-${sourcesStr}`;
};
