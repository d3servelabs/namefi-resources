import { freeClaimsTable, $withTransaction } from '@namefi-astra/db';
import { sql } from 'drizzle-orm';
import { createLogger } from '#lib/logger';
import type {
  CampaignKey,
  CandidateSource,
} from './campaign-candidate-collection.activities';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

const logger = createLogger({ name: 'ox-city-grant-claims-activities' });

export type GrantClaimAtomicInput = {
  campaignKey: CampaignKey;
  userId: string;
  source: CandidateSource;
  sourceId: string;
  extras?: {
    domainName?: string;
    postUrl?: string;
    sharedUrl?: string;
  };
  parentDomain: NamefiNormalizedDomain;
  reason?: string;
  expirationDate?: Date;
};

export type GrantClaimAtomicResult = {
  granted: boolean;
  reason?: string;
};

export type UserNotificationBatch = {
  userId: string;
  grantedCount: number;
  campaignKey: CampaignKey;
};

/**
 * Atomically grant a free claim for a user with advisory locking for concurrency control
 */
export async function grantClaimAtomic(
  input: GrantClaimAtomicInput,
): Promise<GrantClaimAtomicResult> {
  const {
    campaignKey,
    userId,
    source,
    sourceId,
    extras,
    parentDomain,
    expirationDate,
  } = input;

  logger.info(
    { campaignKey, userId, source, sourceId },
    'Starting atomic claim grant',
  );

  try {
    const result = await $withTransaction(
      async (tx) => {
        // 1. Acquire advisory lock for this user+campaign combination
        const lockString = `${campaignKey}:${userId}`;

        await tx.execute(
          sql.raw(`SELECT pg_advisory_xact_lock(hashtext('${lockString}'))`),
        );

        logger.debug(
          { lockString, campaignKey, userId },
          'Advisory lock acquired',
        );

        // 2. The database trigger will handle all validation and limits

        // 3. Generate reason text based on source
        // Note: Database trigger will enforce limits, so we don't need app-level counting
        const reasonMap = {
          UPVOTE: `Upvoted domain in Hunt (${campaignKey} promo)`,
          SHARE: `Shared tweet about ${parentDomain} (${campaignKey} promo)`,
        };

        const reason = input.reason ?? reasonMap[source];

        // 4. Insert the new claim (database trigger will enforce limits)
        const [insertedClaim] = await tx
          .insert(freeClaimsTable)
          .values({
            userId,
            groupOrCampaignKey: campaignKey,
            parentDomain,
            claimingStatus: 'IDLE',
            reason,
            expirationDate,
            metadata: {
              source,
              sourceId,
              domainName: extras?.domainName,
              postUrl: extras?.postUrl,
              sharedUrl: extras?.sharedUrl,
            },
          })
          .returning();

        logger.info(
          {
            claimId: insertedClaim.id,
            userId,
            campaignKey,
            source,
            sourceId,
          },
          'Free claim granted successfully',
        );

        return { granted: true, claimId: insertedClaim.id };
      },
      {
        isolationLevel: 'serializable',
        deferrable: false,
      },
    );

    return result;
  } catch (error) {
    // Handle database constraint violations from the trigger
    if (error instanceof Error) {
      const dbError = error as Error & { code?: string };

      // Check for limit exceeded constraint violation
      if (
        dbError.code === '23514' || // check_violation
        dbError.code === 'check_violation' ||
        error.message.includes('has reached the limit')
      ) {
        logger.info(
          { campaignKey, userId, source, sourceId },
          'User has reached claim limit for campaign (DB constraint)',
        );
        return { granted: false, reason: 'limit_reached' };
      }

      // Check for unique constraint violations (e.g., duplicate idempotency)
      if (dbError.code === '23505' || error.message.includes('duplicate')) {
        logger.info(
          { campaignKey, userId, source, sourceId },
          'Duplicate claim attempt (DB constraint)',
        );
        return { granted: false, reason: 'already_exists' };
      }
    }

    logger.error(
      {
        error,
        campaignKey,
        userId,
        source,
        sourceId,
      },
      'Failed to grant claim atomically',
    );

    // Return failure instead of throwing to allow workflow to continue
    return {
      granted: false,
      reason: error instanceof Error ? error.message : 'unknown_error',
    };
  }
}

/**
 * Send email notifications to users about their granted claims
 */
export async function sendNotifications(
  userBatches: UserNotificationBatch[],
): Promise<void> {
  logger.info(
    { userCount: userBatches.length },
    'Starting notification sending for claim grants',
  );

  // TODO: Implement actual email notification logic
  // This would integrate with your existing email system

  for (const batch of userBatches) {
    try {
      logger.info(
        {
          userId: batch.userId,
          grantedCount: batch.grantedCount,
          campaignKey: batch.campaignKey,
        },
        'Would send notification email to user',
      );

      // TODO Placeholder for actual email sending logic:
    } catch (error) {
      logger.warn(
        {
          error,
          userId: batch.userId,
          campaignKey: batch.campaignKey,
        },
        'Failed to send notification to user',
      );
      // Continue with other notifications even if one fails
    }
  }

  logger.info(
    { userCount: userBatches.length },
    'Notification sending completed',
  );
}
