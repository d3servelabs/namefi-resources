/**
 * x402 Protocol Activities
 *
 * Activities for handling x402 payment verification, settlement,
 * user creation, and order management.
 *
 * Note: Mint-related activities (USDC transfers) are in x402-signer.activities.ts
 */

import { db } from '@namefi-astra/db';
import type { X402PurchaseStatus } from '@namefi-astra/db/types';
import {
  x402PurchasesTable,
  ordersTable,
  orderItemsTable,
  usersTable,
  paymentsTable,
} from '@namefi-astra/db/schema';
import { eq } from 'drizzle-orm';
import { config } from '#lib/env';
import { createLogger } from '#lib/logger';
import { privyClient } from '../../trpc/utils';
import { validateDomainForInstantPurchase } from '../../lib/instant-buy';
import type {
  NamefiNormalizedDomain,
  ChecksumWalletAddress,
} from '@namefi-astra/utils';
import {
  x402ResourceServer as X402ResourceServer,
  type PaymentPayload,
} from '@x402/hono';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';
import {
  buildX402ExactPaymentOption,
  centsToUsdc,
  decryptX402PaymentPayloadSignature,
  encryptX402PaymentPayloadSignature,
  hasEncryptedX402PaymentPayloadSignature,
  parseChainIdFromNetwork,
  resolveX402PaymentPayloadEncryptionPrivateKey,
  facilitatorClient,
  x402ResourceServer,
} from '#lib/x402/helpers';

const logger = createLogger({ context: 'X402_ACTIVITIES' });

// Types for activity inputs/outputs

export interface UpdateX402PurchaseStatusInput {
  purchaseId: string;
  status: X402PurchaseStatus;
  errorMessage?: string;
  settlementTxHash?: string;
  orderId?: string;
  userId?: string;
  workflowId?: string;
}
/**
 * Update x402 purchase status in database
 */
export async function updateX402PurchaseStatus(
  input: UpdateX402PurchaseStatusInput,
): Promise<void> {
  logger.info(
    { purchaseId: input.purchaseId, status: input.status },
    'Updating x402 purchase status',
  );

  try {
    await db
      .update(x402PurchasesTable)
      .set({
        status: input.status,
        errorMessage: input.errorMessage,
        settlementTxHash: input.settlementTxHash,
        orderId: input.orderId,
        userId: input.userId,
        workflowId: input.workflowId,
        updatedAt: new Date(),
      })
      .where(eq(x402PurchasesTable.id, input.purchaseId));
  } catch (error) {
    logger.error(
      { purchaseId: input.purchaseId, error },
      'Failed to update x402 purchase status',
    );
    throw error;
  }
}

export interface VerifyX402PaymentInput {
  paymentPayload: PaymentPayload;
  expectedAmountInUsdCents: number;
  network: string;
}

export interface VerifyX402PaymentResult {
  valid: boolean;
  error?: string;
}
/**
 * Verify x402 payment with facilitator
 *
 * This activity calls the x402 facilitator to verify the payment signature
 * and ensure the payment is valid before processing.
 */
export async function verifyX402Payment(
  input: VerifyX402PaymentInput,
): Promise<VerifyX402PaymentResult> {
  logger.info(
    { network: input.network, expectedAmount: input.expectedAmountInUsdCents },
    'Verifying x402 payment',
  );
  try {
    const paymentPayload = resolvePaymentPayloadForFacilitator(
      input.paymentPayload,
    );

    const paymentRequirements =
      await x402ResourceServer.buildPaymentRequirementsFromOptions(
        [
          buildX402ExactPaymentOption(
            centsToUsdc(input.expectedAmountInUsdCents),
          ),
        ],
        {},
      );
    logger.info({ paymentRequirements }, 'Payment requirements built');
    const verifyRes = await x402ResourceServer.verifyPayment(
      paymentPayload,
      paymentRequirements[0],
    );
    logger.trace({ verifyRes }, 'Verified payment');

    if (!verifyRes || !verifyRes.isValid) {
      const errorText = verifyRes?.invalidReason;
      logger.error({ error: errorText }, 'Facilitator verification failed');
      return {
        valid: false,
        error: `Verification failed: ${errorText}`,
      };
    }

    logger.info('Payment verified successfully');
    return { valid: true };
  } catch (error) {
    logger.error({ error }, 'Error verifying x402 payment');
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification error',
    };
  }
}

export interface SettleX402PaymentInput {
  paymentPayload: PaymentPayload;
  network: string;
  chargeAmountInUsdCents: number;
}

export interface SettleX402PaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

function resolvePaymentPayloadForFacilitator(
  paymentPayload: PaymentPayload,
): PaymentPayload {
  if (!hasEncryptedX402PaymentPayloadSignature(paymentPayload)) {
    return paymentPayload;
  }

  const privateKey = resolveX402PaymentPayloadEncryptionPrivateKey();
  return decryptX402PaymentPayloadSignature({
    paymentPayload,
    privateKey,
  });
}

/**
 * Settle x402 payment with facilitator
 *
 * After domain registration is complete, this settles the payment
 * by having the facilitator submit the transaction on-chain.
 */
export async function settleX402Payment(
  input: SettleX402PaymentInput,
): Promise<SettleX402PaymentResult> {
  logger.info({ network: input.network }, 'Settling x402 payment');

  try {
    const paymentPayload = resolvePaymentPayloadForFacilitator(
      input.paymentPayload,
    );
    const paymentRequirements =
      await x402ResourceServer.buildPaymentRequirementsFromOptions(
        [
          buildX402ExactPaymentOption(
            centsToUsdc(input.chargeAmountInUsdCents),
          ),
        ],
        {},
      );

    const verifyRes = await x402ResourceServer.verifyPayment(
      paymentPayload,
      paymentRequirements[0],
    );

    if (!verifyRes || !verifyRes.isValid) {
      return {
        success: false,
        error: verifyRes?.invalidReason || 'Payment verification failed',
      };
    }

    const result = await x402ResourceServer.settlePayment(
      paymentPayload,
      paymentRequirements[0],
    );

    if (!result.success && !result.transaction) {
      return {
        success: false,
        error: result.errorReason || 'Settlement failed',
      };
    }

    logger.info({ txHash: result.transaction }, 'Payment settled successfully');
    return {
      success: true,
      txHash: result.transaction,
    };
  } catch (error) {
    logger.error({ error }, 'Error settling x402 payment');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Settlement error',
    };
  }
}

export interface VerifyPresettledX402PaymentInput {
  settlementTxHash: string;
  settledAt: string;
  expectedAmountInUsdCents: number;
  network: string;
  /** Maximum age in seconds for a pre-settled payment to be considered valid (default: 1 hour) */
  maxAgeSeconds?: number;
}

export interface VerifyPresettledX402PaymentResult {
  valid: boolean;
  error?: string;
}
/**
 * Verify a pre-settled x402 payment
 *
 * For payments that were settled upfront (before the workflow), this verifies:
 * 1. The settlement transaction hash exists
 * 2. The settlement is recent (within maxAgeSeconds)
 * 3. Prevents duplicate processing by checking the txHash
 *
 * This simplifies the flow by allowing settlement to happen at the API layer
 * and having the workflow just verify it was done correctly.
 */
export async function verifyPresettledX402Payment(
  input: VerifyPresettledX402PaymentInput,
): Promise<VerifyPresettledX402PaymentResult> {
  const maxAgeSeconds = input.maxAgeSeconds ?? 3600; // Default 1 hour

  logger.info(
    {
      settlementTxHash: input.settlementTxHash,
      settledAt: input.settledAt,
      maxAgeSeconds,
    },
    'Verifying pre-settled x402 payment',
  );

  // Verify settlement txHash exists
  if (!input.settlementTxHash) {
    return {
      valid: false,
      error: 'Missing settlement transaction hash for pre-settled payment',
    };
  }

  // Verify settledAt timestamp exists and is recent
  if (!input.settledAt) {
    return {
      valid: false,
      error: 'Missing settlement timestamp for pre-settled payment',
    };
  }

  const settledAtDate = new Date(input.settledAt);
  const now = new Date();
  const ageSeconds = (now.getTime() - settledAtDate.getTime()) / 1000;

  if (ageSeconds > maxAgeSeconds) {
    return {
      valid: false,
      error: `Pre-settled payment is too old (${Math.round(ageSeconds)}s > ${maxAgeSeconds}s)`,
    };
  }

  if (ageSeconds < 0) {
    return {
      valid: false,
      error: 'Pre-settled payment has future timestamp',
    };
  }

  // Check for duplicate transaction hash in existing payments
  const existingPayment = await db.query.paymentsTable.findFirst({
    where: eq(paymentsTable.paymentProviderReferenceId, input.settlementTxHash),
  });

  if (existingPayment) {
    return {
      valid: false,
      error: `Settlement transaction ${input.settlementTxHash} already used for payment ${existingPayment.id}`,
    };
  }

  logger.info(
    { settlementTxHash: input.settlementTxHash, ageSeconds },
    'Pre-settled payment verified successfully',
  );

  return { valid: true };
}

export interface CheckX402PurchaseByNonceInput {
  paymentNonce: string;
}

export interface CheckX402PurchaseByNonceResult {
  exists: boolean;
  purchaseId?: string;
  status?: string;
}
/**
 * Check if an x402 purchase already exists by payment nonce
 *
 * Used for deduplication - prevents processing the same payment twice.
 * The nonce is extracted from paymentPayload.payload.nonce
 */
export async function checkX402PurchaseByNonce(
  input: CheckX402PurchaseByNonceInput,
): Promise<CheckX402PurchaseByNonceResult> {
  logger.info(
    { paymentNonce: input.paymentNonce },
    'Checking for existing x402 purchase by nonce',
  );

  const existingPurchase = await db.query.x402PurchasesTable.findFirst({
    where: eq(x402PurchasesTable.paymentNonce, input.paymentNonce),
  });

  if (existingPurchase) {
    logger.info(
      {
        paymentNonce: input.paymentNonce,
        purchaseId: existingPurchase.id,
        status: existingPurchase.status,
      },
      'Found existing x402 purchase with same nonce',
    );
    return {
      exists: true,
      purchaseId: existingPurchase.id,
      status: existingPurchase.status,
    };
  }

  logger.info(
    { paymentNonce: input.paymentNonce },
    'No existing x402 purchase found',
  );
  return { exists: false };
}

export interface FindOrCreateUserFromWalletInput {
  walletAddress: ChecksumWalletAddress;
}

export interface FindOrCreateUserFromWalletResult {
  userId: string;
  isNewUser: boolean;
  privyUserId: string;
}
/**
 * Find or create a user from a wallet address
 *
 * Uses Privy's importUser API to create users from wallet addresses
 * that don't have existing accounts.
 */
export async function findOrCreateUserFromWallet(
  input: FindOrCreateUserFromWalletInput,
): Promise<FindOrCreateUserFromWalletResult> {
  logger.info(
    { walletAddress: input.walletAddress },
    'Finding or creating user from wallet',
  );

  // Query Privy for user with this wallet
  try {
    // Try to get user by wallet address from Privy
    const privyUsers = await privyClient.getUserByWalletAddress(
      input.walletAddress,
    );

    if (privyUsers) {
      // User exists in Privy, check if they exist in our DB
      const dbUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.privyUserId, privyUsers.id),
      });

      if (dbUser) {
        logger.info(
          { userId: dbUser.id, privyUserId: privyUsers.id },
          'Found existing user',
        );
        return {
          userId: dbUser.id,
          isNewUser: false,
          privyUserId: privyUsers.id,
        };
      }

      // User in Privy but not in our DB - create DB record
      const [newUser] = await db
        .insert(usersTable)
        .values({
          privyUserId: privyUsers.id,
        })
        .returning();

      logger.info(
        { userId: newUser.id, privyUserId: privyUsers.id },
        'Created DB user for existing Privy user',
      );
      return {
        userId: newUser.id,
        isNewUser: true,
        privyUserId: privyUsers.id,
      };
    }
  } catch (error) {
    // User not found in Privy, will create new one
    logger.info(
      { walletAddress: input.walletAddress },
      'User not found in Privy, creating new user',
    );
  }

  // Create new user in Privy using importUser
  try {
    const newPrivyUser = await privyClient.importUser({
      linkedAccounts: [
        {
          type: 'wallet',
          address: input.walletAddress,
          chainType: 'ethereum',
        },
      ],
      createEthereumWallet: false,
    });

    // Create user in our database
    const [newUser] = await db
      .insert(usersTable)
      .values({
        privyUserId: newPrivyUser.id,
      })
      .returning();

    logger.info(
      { userId: newUser.id, privyUserId: newPrivyUser.id },
      'Created new user from wallet',
    );
    return {
      userId: newUser.id,
      isNewUser: true,
      privyUserId: newPrivyUser.id,
    };
  } catch (error) {
    logger.error(
      { error, walletAddress: input.walletAddress },
      'Failed to create user from wallet',
    );
    throw error;
  }
}

export interface CreateX402OrderInput {
  purchaseId: string;
  userId: string;
  normalizedDomainName: NamefiNormalizedDomain;
  amountInUsdCents: number;
  durationInYears: number;
  buyerWalletAddress: ChecksumWalletAddress;
  /** Wallet address recovered from the EIP-3009 payment signature */
  signerWalletAddress?: string;
  nftReceivingWalletAddress?: ChecksumWalletAddress;
  /**
   * The wallet address that received the x402 payment (USDC)
   * This is tracked to support multiple/different signers for refunds
   */
  receiverWalletAddress: string;
  network: string;
  paymentPayload: PaymentPayload;
  /** Whether the payment was pre-settled */
  presettled?: boolean;
  /** Transaction hash from the pre-settlement */
  settlementTxHash?: string;
  /** ISO timestamp when settlement was completed */
  settledAt?: string;
}
export interface CreateX402OrderResult {
  orderId: string;
  orderItemId: string;
  paymentId: string;
  registrar: string;
}

/**
 * Create order for x402 purchase
 *
 * Creates the order, order item, and payment records for the x402 purchase.
 */
export async function createX402Order(
  input: CreateX402OrderInput,
): Promise<CreateX402OrderResult> {
  logger.info(
    { purchaseId: input.purchaseId, domain: input.normalizedDomainName },
    'Creating x402 order',
  );

  // Validate domain to get registrar info
  const validation = await validateDomainForInstantPurchase({
    normalizedDomainName: input.normalizedDomainName,
    durationInYears: input.durationInYears,
    user: undefined,
  });

  if (!validation.isValid) {
    throw new Error(validation.error || 'Domain validation failed');
  }

  const privateKey = resolveX402PaymentPayloadEncryptionPrivateKey();
  const {
    paymentPayload: encryptedSignaturePaymentPayload,
    paymentPayloadEncryptionVersion,
  } = encryptX402PaymentPayloadSignature({
    paymentPayload: input.paymentPayload,
    privateKey,
  });

  // Create order, order item, and payment in a transaction
  const result = await db.transaction(async (tx) => {
    // Create order
    const [order] = await tx
      .insert(ordersTable)
      .values({
        userId: input.userId,
        status: 'PROCESSING',
        amountInUSDCents: input.amountInUsdCents,
        nftWalletAddress:
          input.nftReceivingWalletAddress ?? input.buyerWalletAddress,
        nftChainId: getChainIdFromNetwork(input.network),
        metadata: {
          x402PurchaseId: input.purchaseId,
        },
      })
      .returning();

    // Create order item
    const [orderItem] = await tx
      .insert(orderItemsTable)
      .values({
        orderId: order.id,
        normalizedDomainName: input.normalizedDomainName,
        amountInUSDCents: input.amountInUsdCents,
        durationInYears: input.durationInYears,
        type: 'REGISTER',
        registrar: validation.registrar,
        status: 'PROCESSING',
      })
      .returning();

    // Create payment record with X402 provider and x402PaymentDetails
    const [payment] = await tx
      .insert(paymentsTable)
      .values({
        orderId: order.id,
        amountInUSDCents: input.amountInUsdCents,
        status: 'CREATED', // Will be verified/charged via chargeUserWorkflow
        paymentProvider: 'X402',
        x402PaymentDetails: {
          buyerWalletAddress: input.buyerWalletAddress,
          receiverWalletAddress: input.receiverWalletAddress,
          network: input.network,
          paymentPayload: encryptedSignaturePaymentPayload,
          paymentPayloadEncryptionVersion,
          // Pre-settlement info (if provided)
          presettled: input.presettled,
          settlementTxHash: input.settlementTxHash,
          settledAt: input.settledAt,
        },
      })
      .returning();

    // Update x402 purchase with order reference
    await tx
      .update(x402PurchasesTable)
      .set({
        orderId: order.id,
        userId: input.userId,
      })
      .where(eq(x402PurchasesTable.id, input.purchaseId));

    return {
      orderId: order.id,
      orderItemId: orderItem.id,
      paymentId: payment.id,
      registrar: validation.registrar,
    };
  });

  logger.info(
    { orderId: result.orderId, orderItemId: result.orderItemId },
    'Created x402 order',
  );

  return result;
}

/**
 * Get the NFT chain ID for x402 purchases
 *
 * Uses X402_DEFAULT_NFT_CHAINID if configured, otherwise maps:
 * - Base Sepolia (84532) payment -> Sepolia (11155111) NFT
 * - Base Mainnet (8453) payment -> Base (8453) NFT
 */
function getChainIdFromNetwork(network: string): number {
  // Use explicit config if set
  if (config.X402_DEFAULT_NFT_CHAINID) {
    return config.X402_DEFAULT_NFT_CHAINID;
  }

  try {
    const paymentChainId = parseChainIdFromNetwork(network);

    // Map payment chain to NFT chain
    // Base Sepolia payment -> Sepolia NFT
    // Base Mainnet payment -> Base NFT
    if (paymentChainId === 84532) {
      return 11155111; // Sepolia
    }
    if (paymentChainId === 8453) {
      return 8453; // Base
    }

    // Fallback to payment chain ID
    return paymentChainId;
  } catch {
    // Default to Sepolia for invalid network
    return 11155111;
  }
}

export interface GetX402PurchaseSettlementInput {
  purchaseId: string;
}

export interface GetX402PurchaseSettlementResult {
  settled: boolean;
  settlementTxHash?: string;
  settledAt?: string;
}
/**
 * Get settlement status for an x402 purchase
 *
 * Polls the x402_purchases table to check if the payment has been settled.
 * This is used by the workflow to wait for pre-settlement.
 */
export async function getX402PurchaseSettlement(
  input: GetX402PurchaseSettlementInput,
): Promise<GetX402PurchaseSettlementResult> {
  logger.info(
    { purchaseId: input.purchaseId },
    'Checking x402 purchase settlement',
  );

  const purchase = await db.query.x402PurchasesTable.findFirst({
    where: eq(x402PurchasesTable.id, input.purchaseId),
  });

  if (!purchase) {
    logger.warn({ purchaseId: input.purchaseId }, 'X402 purchase not found');
    return { settled: false };
  }

  // Check if settlement info exists
  if (purchase.settlementTxHash && purchase.settledAt) {
    logger.info(
      {
        purchaseId: input.purchaseId,
        settlementTxHash: purchase.settlementTxHash,
      },
      'X402 purchase is settled',
    );
    return {
      settled: true,
      settlementTxHash: purchase.settlementTxHash,
      settledAt: purchase.settledAt.toISOString(),
    };
  }

  logger.info(
    { purchaseId: input.purchaseId },
    'X402 purchase not yet settled',
  );
  return { settled: false };
}

/**
 * Extract payment nonce from x402 payment payload
 *
 * The nonce is used for deduplication of purchases.
 * It's typically found in paymentPayload.payload.nonce
 */
export function extractPaymentNonce(paymentPayload: PaymentPayload): string {
  const nonce = paymentPayload?.payload?.nonce;
  if (typeof nonce === 'string') {
    return nonce;
  }
  if (typeof nonce === 'number') {
    return String(nonce);
  }
  throw new Error('Payment payload missing nonce field');
}
