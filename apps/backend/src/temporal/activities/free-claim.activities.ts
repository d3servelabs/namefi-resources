import {
  freeClaimsTable,
  db,
  orderItemsTable,
  ordersTable,
  paymentsTable,
  type FreeClaimSelect,
} from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { and, eq, gte, isNull, or, sql } from 'drizzle-orm';
import { zeroAddress } from 'viem';
import { createLogger } from '#lib/logger';
import { $withTransaction } from '@namefi-astra/db';

const logger = createLogger({ context: 'free-claim-activities' });

export interface ValidateAndUseClaimInput {
  userId: string;
  normalizedDomainName: NamefiNormalizedDomain;
  tx?: typeof db;
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

export interface ValidateClaimAndOrderInput {
  claimId: string;
  normalizedDomainName: NamefiNormalizedDomain;
  orderId?: string;
  orderItemId?: string;
}

export type ValidateClaimAndOrderOutput = { reason?: string } & (
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
  const { userId, normalizedDomainName, tx: existingTx } = input;

  logger.info(
    { userId, normalizedDomainName },
    'Validating and using free claim',
  );

  return await $withTransaction(
    async (tx) => {
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
    },
    undefined,
    existingTx,
  );
}

/**
 * Private helper to validate claim details and basic state
 */
async function validateClaimDetails(
  claimId: string,
  normalizedDomainName: NamefiNormalizedDomain,
  orderItemId?: string,
) {
  // Get the claim and verify it exists and is in CLAIMING status
  const [claim] = await db
    .select()
    .from(freeClaimsTable)
    .where(eq(freeClaimsTable.id, claimId));

  if (!claim) {
    return {
      success: false as const,
      reason: 'Claim not found',
    };
  }

  // The following checks are not needed if we just want to validate the claim existence with correct status
  // and domain name but these are useful for debugging and error messages

  // Check if claim is in CLAIMING status
  if (claim.claimingStatus !== 'CLAIMING') {
    return {
      success: false as const,
      reason: `Claim is in ${claim.claimingStatus} status, expected CLAIMING`,
    };
  }

  // Check if the claimed domain matches
  if (claim.claimedDomainName !== normalizedDomainName) {
    return {
      success: false as const,
      reason: `Claim is for domain ${claim.claimedDomainName}, but expected ${normalizedDomainName}`,
    };
  }

  // Check if claim has expired
  if (claim.expirationDate && claim.expirationDate < new Date()) {
    return {
      success: false as const,
      reason: 'Claim has expired',
    };
  }

  // If orderItemId is provided, validate that the claim is linked to it
  if (orderItemId && claim.orderItemId !== orderItemId) {
    return {
      success: false as const,
      reason: `Claim is linked to order item ${claim.orderItemId}, but expected ${orderItemId}`,
    };
  }

  return {
    success: true as const,
    claim,
  };
}

/**
 * Private helper to validate order and order-item relationships
 */
async function validateClaimOrder(
  claim: FreeClaimSelect,
  normalizedDomainName: NamefiNormalizedDomain,
  orderId?: string,
  orderItemId?: string,
) {
  // If orderId is provided, validate the order exists and matches
  if (orderId) {
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId));

    if (!order) {
      return {
        success: false as const,
        reason: 'Order not found',
      };
    }

    // Verify the order belongs to the same user
    if (order.userId !== claim.userId) {
      return {
        success: false as const,
        reason: 'Order belongs to different user than claim',
      };
    }
  }

  // If both orderId and orderItemId are provided, validate that the orderItem belongs to the order
  if (orderId && orderItemId) {
    const [orderItem] = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.id, orderItemId));

    if (!orderItem) {
      return {
        success: false as const,
        reason: 'Order item not found',
      };
    }

    // Verify the order item belongs to the specified order
    if (orderItem.orderId !== orderId) {
      return {
        success: false as const,
        reason: `Order item belongs to order ${orderItem.orderId}, but expected ${orderId}`,
      };
    }

    // Verify the order item is for the expected domain
    if (orderItem.normalizedDomainName !== normalizedDomainName) {
      return {
        success: false as const,
        reason: `Order item is for domain ${orderItem.normalizedDomainName}, but expected ${normalizedDomainName}`,
      };
    }
  }

  return {
    success: true as const,
  };
}

/**
 * Validates an existing free claim and order by ID and checks if they match the domain
 * Used when a claim and order have already been created in a transaction
 */
export async function validateClaimAndOrder(
  input: ValidateClaimAndOrderInput,
): Promise<ValidateClaimAndOrderOutput> {
  const { claimId, normalizedDomainName, orderId, orderItemId } = input;

  logger.info(
    { claimId, normalizedDomainName, orderId, orderItemId },
    'Validating existing free claim and order',
  );

  // Step 1: Validate claim details and basic state
  const claimResult = await validateClaimDetails(
    claimId,
    normalizedDomainName,
    orderItemId,
  );

  if (!claimResult.success) {
    return claimResult;
  }

  const { claim } = claimResult;

  // Step 2: Validate order and order-item relationships
  const orderResult = await validateClaimOrder(
    claim,
    normalizedDomainName,
    orderId,
    orderItemId,
  );

  if (!orderResult.success) {
    return orderResult;
  }

  logger.info(
    {
      claimId,
      normalizedDomainName,
      orderId,
      orderItemId,
      groupOrCampaignKey: claim.groupOrCampaignKey,
    },
    'Free claim and order validated successfully',
  );

  return {
    success: true,
    claimId,
  };
}

export interface CreateClaimOrderInput {
  userId: string;
  normalizedDomainName: NamefiNormalizedDomain;
  durationInYears: number;
  registrarKey: string;
  recipientWalletAddress: string;
  chainId: number;
  claimId: string;
  tx?: typeof db;
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
    tx: existingTx,
  } = input;

  logger.info(
    { userId, normalizedDomainName, claimId },
    'Creating free claim order',
  );

  return $withTransaction(
    async (tx) => {
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
    },
    undefined,
    existingTx,
  );
}

/**
 * Compose smaller activities to validate and create claim order in a single transaction
 * This uses existing smaller activities with the withTransaction helper
 */
export async function validateAndCreateClaimOrder(input: {
  userId: string;
  normalizedDomainName: NamefiNormalizedDomain;
  durationInYears: number;
  registrarKey: string;
  recipientWalletAddress: string;
  chainId: number;
  tx?: typeof db;
}): Promise<{
  orderId: string;
  orderItemId: string;
  claimId: string;
}> {
  const {
    userId,
    normalizedDomainName,
    durationInYears,
    registrarKey,
    recipientWalletAddress,
    chainId,
    tx: existingTx,
  } = input;

  logger.info(
    { userId, normalizedDomainName },
    'Validating and creating claim order using composed activities',
  );

  return $withTransaction(
    async (tx) => {
      // Step 1: Validate and use the claim
      const claimResult = await validateAndUseClaim({
        userId,
        normalizedDomainName,
        tx,
      });

      if (!claimResult.success) {
        throw new Error(
          claimResult.reason || 'Failed to validate and use claim',
        );
      }

      const { claimId } = claimResult;

      // Step 2: Create the order
      const orderResult = await createClaimOrder({
        userId,
        normalizedDomainName,
        durationInYears,
        registrarKey,
        recipientWalletAddress,
        chainId,
        claimId,
        tx,
      });

      const { orderId, orderItemId } = orderResult;

      // Step 3: Update the claim record with order item ID
      await updateClaimRecord({
        claimId,
        orderItemId,
        tx,
      });

      logger.info(
        {
          claimId,
          orderId,
          orderItemId,
          userId,
          normalizedDomainName,
        },
        'Successfully composed activities in transaction',
      );

      return {
        orderId,
        orderItemId,
        claimId,
      };
    },
    undefined,
    existingTx,
  );
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
  tx?: typeof db;
}

/**
 * Updates a free claim record with the order item ID
 * This is used to link the claim to the order item after order creation
 */
export async function updateClaimRecord(
  input: UpdateClaimRecordInput,
): Promise<void> {
  const { claimId, orderItemId, tx: existingTx } = input;

  logger.info({ claimId, orderItemId }, 'Updating free claim record');

  return $withTransaction(
    async (tx) => {
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
    },
    undefined,
    existingTx,
  );
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

/**
 * Get all available (IDLE) claims for a user
 */
export async function getUserUnusedClaims(userId: string) {
  const availableClaims = await db.query.freeClaimsTable.findMany({
    where: and(
      eq(freeClaimsTable.userId, userId),
      eq(freeClaimsTable.claimingStatus, 'IDLE'), // Only include IDLE claims
      or(
        gte(freeClaimsTable.expirationDate, new Date()),
        isNull(freeClaimsTable.expirationDate),
      ),
    ),
  });

  return availableClaims as FreeClaimSelect[];
}

type CheckItemClaimEligibilityOutput = {
  /**
   * The group or campaign key that the claim belongs to
   */
  groupOrCampaignKey: string;
  claimsAvailable: number;
  /**
   * Claims that match the exact domain name
   */
  exactMatchClaims: FreeClaimSelect[];
  /**
   * Claims that match the parent domain name
   */
  parentMatchClaims: FreeClaimSelect[];
};

/**
 * Check if a specific cart item is eligible for any of the user's unused claims
 * Exact domain claims take precedence over parent domain claims
 */
export function checkItemClaimEligibility(
  normalizedDomainName: NamefiNormalizedDomain,
  unusedClaims: FreeClaimSelect[],
): CheckItemClaimEligibilityOutput[] {
  // Separate exact and parent domain matches
  const exactMatches: typeof unusedClaims = [];
  const parentMatches: typeof unusedClaims = [];

  for (const claim of unusedClaims) {
    // Check for exact domain match
    if (claim.exactDomainName === normalizedDomainName) {
      exactMatches.push(claim);
    }
    // Check for parent domain match (only if no exact match for this claim)
    else if (
      claim.parentDomain &&
      claim.exactDomainName === null &&
      normalizedDomainName.endsWith(`.${claim.parentDomain}`)
    ) {
      parentMatches.push(claim);
    }
  }

  // Group claims by key, prioritizing exact matches
  const claimsMap = new Map<
    string,
    { exactMatches: FreeClaimSelect[]; parentMatches: FreeClaimSelect[] }
  >();

  // Process exact matches first
  for (const claim of exactMatches) {
    const existing = claimsMap.get(claim.groupOrCampaignKey) || {
      exactMatches: [],
      parentMatches: [],
    };
    existing.exactMatches.push(claim);
    claimsMap.set(claim.groupOrCampaignKey, existing);
  }

  // Process parent matches only if no exact match exists for that key
  for (const claim of parentMatches) {
    const existing = claimsMap.get(claim.groupOrCampaignKey) || {
      exactMatches: [],
      parentMatches: [],
    };
    // Only count parent matches if there are no exact matches for this key
    if (existing.exactMatches.length === 0) {
      existing.parentMatches.push(claim);
      claimsMap.set(claim.groupOrCampaignKey, existing);
    }
  }

  // Convert to the expected format
  const eligibleClaims = [];
  for (const [groupOrCampaignKey, counts] of claimsMap.entries()) {
    const totalAvailable =
      counts.exactMatches.length + counts.parentMatches.length;
    if (totalAvailable > 0) {
      eligibleClaims.push({
        groupOrCampaignKey,
        claimsAvailable: totalAvailable,
        exactMatchClaims: counts.exactMatches,
        parentMatchClaims: counts.parentMatches,
      });
    }
  }

  return eligibleClaims;
}
