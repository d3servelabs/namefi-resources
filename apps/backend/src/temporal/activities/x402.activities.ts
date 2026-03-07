/**
 * x402 Protocol Activities
 *
 * Activities for handling x402 payment verification, settlement,
 * user creation, and order management.
 *
 * Note: Mint-related activities (USDC transfers) are in x402-signer.activities.ts
 */

import { db } from '@namefi-astra/db';
import { paymentsTable } from '@namefi-astra/db/schema';
import { eq } from 'drizzle-orm';
import { config } from '#lib/env';
import { createLogger } from '#lib/logger';
import {
  x402ResourceServer as X402ResourceServer,
  type PaymentPayload,
} from '@x402/hono';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';

const facilitatorClient = new HTTPFacilitatorClient({
  url: 'https://x402.org/facilitator',
});

const x402ResourceServer = new X402ResourceServer(facilitatorClient).register(
  'eip155:84532',
  new ExactEvmScheme(),
);
x402ResourceServer.initialize();

const logger = createLogger({ context: 'X402_ACTIVITIES' });

export interface VerifyX402PaymentInput {
  paymentPayload: PaymentPayload;
  expectedAmountInUsdCents: number;
  network: string;
}

export interface VerifyX402PaymentResult {
  valid: boolean;
  error?: string;
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
    const paymentRequirements =
      await x402ResourceServer.buildPaymentRequirementsFromOptions(
        [
          {
            scheme: 'exact',
            network: config.X402_NETWORK,
            price: centsToUsdc(input.expectedAmountInUsdCents),
            payTo: config.X402_SIGNER_ADDRESS ?? 'namefidao.eth',
            maxTimeoutSeconds: 3 * 60 * 60,
          },
        ],
        {},
      );
    logger.info({ paymentRequirements }, 'Payment requirements built');
    const verifyRes = await x402ResourceServer.verifyPayment(
      input.paymentPayload,
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
    const paymentRequirements =
      await x402ResourceServer.buildPaymentRequirementsFromOptions(
        [
          {
            scheme: 'exact',
            network: config.X402_NETWORK,
            price: centsToUsdc(input.chargeAmountInUsdCents),
            payTo: config.X402_SIGNER_ADDRESS ?? 'namefidao.eth',
            maxTimeoutSeconds: 3 * 60 * 60,
          },
        ],
        {},
      );
    const result = await x402ResourceServer.settlePayment(
      input.paymentPayload,
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

export function centsToUsdc(
  cents: number,
  overrideContract = '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
) {
  return {
    asset: overrideContract,
    amount: (cents * 10_000).toFixed(0), // usdc is deciaml6
    extra: {
      name: 'USDC',
      version: '2',
    },
  };
}
