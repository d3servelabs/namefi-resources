import {
  freeClaimsTable,
  db,
  orderItemsTable,
  ordersTable,
  paymentsTable,
} from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { and, eq, gte, isNull, or, sql } from 'drizzle-orm';
import { zeroAddress } from 'viem';
import { createLogger } from '#lib/logger';

const logger = createLogger({ context: 'free-claim-activities' });

export interface ValidateAndUseClaimInput {
  userId: string;
  normalizedDomainName: NamefiNormalizedDomain;
}

export type ValidateAndUseClaimOutput = { reason?: string } & (
  | {
      success: true;
      claimId: string;
    }
  | {
      success: false;
    }
);

/**
 * Atomically validates a free claim and marks it as used
 * This prevents replay attacks and concurrency issues
 */
export async function validateAndUseClaim(
  input: ValidateAndUseClaimInput,
): Promise<ValidateAndUseClaimOutput> {
  const { userId, normalizedDomainName } = input;

  logger.info(
    { userId, normalizedDomainName },
    'Validating and using free claim',
  );

  return await db.transaction(async (tx) => {
    // Find an eligible claim for this user and domain (any campaign/group)
    const eligibleClaims = await tx
      .select()
      .from(freeClaimsTable)
      .where(
        and(
          eq(freeClaimsTable.userId, userId),
          eq(freeClaimsTable.claimingStatus, 'IDLE'), // Only select IDLE claims
          or(
            gte(freeClaimsTable.expirationDate, new Date()),
            isNull(freeClaimsTable.expirationDate),
          ),
          or(
            // Exact domain match
            eq(freeClaimsTable.exactDomainName, normalizedDomainName),
            // Or it's a child of a parent domain
            and(
              isNull(freeClaimsTable.exactDomainName),
              sql`${normalizedDomainName} LIKE CONCAT('%.', ${freeClaimsTable.parentDomain})`,
            ),
          ),
        ),
      )
      .orderBy(
        sql`${freeClaimsTable.exactDomainName} NULLS LAST`,
        sql`${freeClaimsTable.expirationDate} ASC NULLS LAST`,
      ) // Prioritize exact domain matches, then earliest expiration
      .limit(1)
      .for('update'); // Lock the row for update

    if (eligibleClaims.length === 0) {
      return {
        success: false,
        reason: 'No eligible claim found for this user and domain',
      };
    }

    const claim = eligibleClaims[0];

    // Check if claim has expired
    if (claim.expirationDate && claim.expirationDate < new Date()) {
      return {
        success: false,
        reason: 'Claim has expired',
      };
    }

    // Mark the claim as CLAIMING and set the claimed domain
    await tx
      .update(freeClaimsTable)
      .set({
        claimingStatus: 'CLAIMING',
        claimedDomainName: normalizedDomainName,
        updatedAt: new Date(),
      })
      .where(eq(freeClaimsTable.id, claim.id));

    logger.info(
      {
        claimId: claim.id,
        userId,
        normalizedDomainName,
        groupOrCampaignKey: claim.groupOrCampaignKey,
      },
      'Free claim validated and marked as CLAIMING',
    );

    return {
      success: true,
      claimId: claim.id,
    };
  });
}

export interface CreateClaimOrderInput {
  userId: string;
  normalizedDomainName: NamefiNormalizedDomain;
  durationInYears: number;
  registrarKey: string;
  recipientWalletAddress: string;
  chainId: number;
  claimId: string;
}

export interface CreateClaimOrderOutput {
  orderId: string;
  orderItemId: string;
}

/**
 * Creates an order and order item for a free claim with $0 amount
 */
export async function createClaimOrder(
  input: CreateClaimOrderInput,
): Promise<CreateClaimOrderOutput> {
  const {
    userId,
    normalizedDomainName,
    durationInYears,
    registrarKey,
    recipientWalletAddress,
    chainId,
    claimId,
  } = input;

  logger.info(
    { userId, normalizedDomainName, claimId },
    'Creating free claim order',
  );

  return await db.transaction(async (tx) => {
    // First, get the claim to get the groupOrCampaignKey
    const [claim] = await tx
      .select({ groupOrCampaignKey: freeClaimsTable.groupOrCampaignKey })
      .from(freeClaimsTable)
      .where(eq(freeClaimsTable.id, claimId));

    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    const { groupOrCampaignKey } = claim;

    // Create a zero-amount payment for the claim
    const [payment] = await tx
      .insert(paymentsTable)
      .values({
        amountInUSDCents: 0,
        status: 'SUCCEEDED', // Mark as succeeded since it's free
        paymentProvider: 'NFSC_BASE',
        nfscPaymentDetails: {
          chainId,
          walletAddress: zeroAddress,
        },
      })
      .returning();

    // Create the order
    const [order] = await tx
      .insert(ordersTable)
      .values({
        userId,
        paymentId: payment.id,
        amountInUSDCents: 0,
        totalAmountInUSDCents: 0,
        nftWalletAddress: recipientWalletAddress,
        nftChainId: chainId,
        status: 'PROCESSING',
        metadata: {
          freeClaim: true,
          groupOrCampaignKey,
          claimId,
        },
      })
      .returning();

    // Create the order item
    const [orderItem] = await tx
      .insert(orderItemsTable)
      .values({
        orderId: order.id,
        normalizedDomainName,
        amountInUSDCents: 0,
        durationInYears,
        type: 'REGISTER',
        registrar: registrarKey,
        status: 'PROCESSING',
        metadata: {
          freeClaim: true,
          groupOrCampaignKey,
          claimId,
        },
      })
      .returning();

    logger.info(
      {
        orderId: order.id,
        orderItemId: orderItem.id,
        claimId,
        userId,
        normalizedDomainName,
      },
      'Free claim order created',
    );

    return {
      orderId: order.id,
      orderItemId: orderItem.id,
    };
  });
}

export interface RevertClaimInput {
  claimId: string;
}

/**
 * Reverts a free claim by marking it as unused
 * This is used when the claim processing fails and needs to be rolled back
 */
export async function revertClaim(input: RevertClaimInput): Promise<void> {
  const { claimId } = input;

  logger.info({ claimId }, 'Reverting free claim');

  await db.transaction(async (tx) => {
    // Lock the claim row to prevent concurrent state changes
    const [claim] = await tx
      .select({
        id: freeClaimsTable.id,
        claimingStatus: freeClaimsTable.claimingStatus,
      })
      .from(freeClaimsTable)
      .where(eq(freeClaimsTable.id, claimId))
      .limit(1)
      .for('update');

    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    // Only revert claims that are currently in CLAIMING state.
    if (claim.claimingStatus !== 'CLAIMING') {
      logger.warn(
        { claimId, currentStatus: claim.claimingStatus },
        'Skip revert: claim not in CLAIMING state',
      );
      return;
    }

    const now = new Date();
    const updated = await tx
      .update(freeClaimsTable)
      .set({
        orderItemId: null,
        claimingStatus: 'IDLE',
        claimedDomainName: null,
        claimedAt: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(freeClaimsTable.id, claimId),
          eq(freeClaimsTable.claimingStatus, 'CLAIMING'),
        ),
      )
      .returning({ id: freeClaimsTable.id });

    if (updated.length === 0) {
      logger.warn(
        { claimId },
        'Revert no-op: concurrent state change detected',
      );
      return;
    }

    logger.info({ claimId }, 'Free claim reverted');
  });
}

export interface UpdateClaimRecordInput {
  claimId: string;
  orderItemId: string;
}

/**
 * Updates a free claim record with the order item ID
 * This is used to link the claim to the order item after order creation
 */
export async function updateClaimRecord(
  input: UpdateClaimRecordInput,
): Promise<void> {
  const { claimId, orderItemId } = input;

  logger.info({ claimId, orderItemId }, 'Updating free claim record');

  await db.transaction(async (tx) => {
    // Lock the claim row to ensure consistent update
    const [claim] = await tx
      .select({
        id: freeClaimsTable.id,
        claimingStatus: freeClaimsTable.claimingStatus,
        existingOrderItemId: freeClaimsTable.orderItemId,
      })
      .from(freeClaimsTable)
      .where(eq(freeClaimsTable.id, claimId))
      .limit(1)
      .for('update');

    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    // Only allow attaching order item while claim is in CLAIMING state
    if (claim.claimingStatus !== 'CLAIMING') {
      logger.warn(
        { claimId, currentStatus: claim.claimingStatus },
        'Skip update: claim not in CLAIMING state',
      );
      return;
    }

    // If already linked to the same order item, treat as idempotent success
    if (
      claim.existingOrderItemId &&
      claim.existingOrderItemId === orderItemId
    ) {
      logger.info(
        { claimId, orderItemId },
        'Free claim record already linked to order item',
      );
      return;
    }

    // Prevent overwriting an existing different order item link
    if (
      claim.existingOrderItemId &&
      claim.existingOrderItemId !== orderItemId
    ) {
      throw new Error(
        `Claim ${claimId} is already linked to a different order item: ${claim.existingOrderItemId}`,
      );
    }

    const now = new Date();
    const updated = await tx
      .update(freeClaimsTable)
      .set({
        orderItemId,
        updatedAt: now,
      })
      .where(
        and(
          eq(freeClaimsTable.id, claimId),
          eq(freeClaimsTable.claimingStatus, 'CLAIMING'),
          isNull(freeClaimsTable.orderItemId),
        ),
      )
      .returning({ id: freeClaimsTable.id });

    if (updated.length === 0) {
      logger.warn(
        { claimId, orderItemId },
        'Update no-op: concurrent state change detected',
      );
      return;
    }

    logger.info({ claimId, orderItemId }, 'Free claim record updated');
  });
}

export interface MarkClaimAsCompletedInput {
  claimId: string;
}

/**
 * Marks a free claim as successfully completed (CLAIMED status)
 * This is used when the domain acquisition workflow completes successfully
 */
export async function markClaimAsCompleted(
  input: MarkClaimAsCompletedInput,
): Promise<void> {
  const { claimId } = input;

  logger.info({ claimId }, 'Marking free claim as completed');

  await db.transaction(async (tx) => {
    // Lock row for update
    const [claim] = await tx
      .select({
        id: freeClaimsTable.id,
        claimingStatus: freeClaimsTable.claimingStatus,
        orderItemId: freeClaimsTable.orderItemId,
      })
      .from(freeClaimsTable)
      .where(eq(freeClaimsTable.id, claimId))
      .limit(1)
      .for('update');

    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    // Only transition CLAIMING -> CLAIMED
    if (claim.claimingStatus !== 'CLAIMING') {
      logger.warn(
        { claimId, currentStatus: claim.claimingStatus },
        'Skip complete: claim not in CLAIMING state',
      );
      return;
    }

    // Ensure we have an order item linked before marking as completed
    if (!claim.orderItemId) {
      throw new Error(
        `Cannot mark claim ${claimId} as completed without an order item`,
      );
    }

    const now = new Date();
    const updated = await tx
      .update(freeClaimsTable)
      .set({
        claimingStatus: 'CLAIMED',
        claimedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(freeClaimsTable.id, claimId),
          eq(freeClaimsTable.claimingStatus, 'CLAIMING'),
        ),
      )
      .returning({ id: freeClaimsTable.id });

    if (updated.length === 0) {
      logger.warn(
        { claimId },
        'Complete no-op: concurrent state change detected',
      );
      return;
    }

    logger.info({ claimId }, 'Free claim marked as completed');
  });
}

export interface CheckClaimEligibilityInput {
  userId: string;
  groupOrCampaignKey: string;
  normalizedDomainName: NamefiNormalizedDomain;
}

export interface CheckClaimEligibilityOutput {
  eligible: boolean;
  reason?: string;
  claimsAvailable?: number;
}

/**
 * Checks if a user is eligible for a free claim without marking it as used
 */
export async function checkClaimEligibility(
  input: CheckClaimEligibilityInput,
): Promise<CheckClaimEligibilityOutput> {
  const { userId, normalizedDomainName, groupOrCampaignKey } = input;

  logger.info(
    { userId, groupOrCampaignKey, normalizedDomainName },
    'Checking free claim eligibility',
  );

  const eligibleClaims = await db
    .select({
      id: freeClaimsTable.id,
      exactDomainName: freeClaimsTable.exactDomainName,
      parentDomain: freeClaimsTable.parentDomain,
    })
    .from(freeClaimsTable)
    .where(
      and(
        eq(freeClaimsTable.userId, userId),
        eq(freeClaimsTable.groupOrCampaignKey, groupOrCampaignKey),
        eq(freeClaimsTable.claimingStatus, 'IDLE'), // Only check IDLE claims
        or(
          gte(freeClaimsTable.expirationDate, new Date()),
          isNull(freeClaimsTable.expirationDate),
        ),
        or(
          // Exact domain match
          eq(freeClaimsTable.exactDomainName, normalizedDomainName),
          // Or it's a child of a parent domain
          and(
            isNull(freeClaimsTable.exactDomainName),
            sql`${normalizedDomainName} LIKE CONCAT('%.', ${freeClaimsTable.parentDomain})`,
          ),
        ),
      ),
    )
    .orderBy(sql`${freeClaimsTable.exactDomainName} NULLS LAST`); // Prioritize exact domain matches

  if (eligibleClaims.length === 0) {
    return {
      eligible: false,
      reason: 'No eligible claims found for this domain',
      claimsAvailable: 0,
    };
  }

  logger.info(
    {
      userId,
      normalizedDomainName,
      groupOrCampaignKey,
      claimsCount: eligibleClaims.length,
    },
    'User is eligible for free claim',
  );

  return {
    eligible: true,
    claimsAvailable: eligibleClaims.length,
  };
}

/**
 * Checks if a user has any eligible free claims for a domain (without specifying groupOrCampaignKey)
 */
export async function checkAnyClaimEligibility(input: {
  userId: string;
  normalizedDomainName: NamefiNormalizedDomain;
}): Promise<CheckClaimEligibilityOutput> {
  const { userId, normalizedDomainName } = input;

  logger.info(
    { userId, normalizedDomainName },
    'Checking any free claim eligibility for domain',
  );

  const eligibleClaims = await db
    .select({
      id: freeClaimsTable.id,
      exactDomainName: freeClaimsTable.exactDomainName,
      parentDomain: freeClaimsTable.parentDomain,
    })
    .from(freeClaimsTable)
    .where(
      and(
        eq(freeClaimsTable.userId, userId),
        eq(freeClaimsTable.claimingStatus, 'IDLE'), // Only check IDLE claims
        or(
          gte(freeClaimsTable.expirationDate, new Date()),
          isNull(freeClaimsTable.expirationDate),
        ),
        or(
          // Exact domain match
          eq(freeClaimsTable.exactDomainName, normalizedDomainName),
          // Or it's a child of a parent domain
          and(
            isNull(freeClaimsTable.exactDomainName),
            sql`${normalizedDomainName} LIKE CONCAT('%.', ${freeClaimsTable.parentDomain})`,
          ),
        ),
      ),
    )
    .orderBy(sql`${freeClaimsTable.exactDomainName} NULLS LAST`); // Prioritize exact domain matches

  if (eligibleClaims.length === 0) {
    return {
      eligible: false,
      reason: 'No eligible claims found for this domain',
      claimsAvailable: 0,
    };
  }

  logger.info(
    {
      userId,
      normalizedDomainName,
      claimsCount: eligibleClaims.length,
    },
    'User has eligible claims for domain',
  );

  return {
    eligible: true,
    claimsAvailable: eligibleClaims.length,
  };
}
