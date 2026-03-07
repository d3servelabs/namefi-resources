/**
 * x402 Protocol Router
 *
 * Implements HTTP 402 Payment Required flow for domain purchases.
 * Uses the x402 protocol (https://x402.org) for stablecoin payments.
 *
 * Flow:
 * 1. GET /x402/domain/:domain - Returns 402 with payment requirements
 * 2. Client sends payment via x402 header
 * 3. Server verifies payment with facilitator
 * 4. Server starts domain registration workflow
 * 5. On completion, server settles payment with facilitator
 */

import { Hono, type Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { config } from '#lib/env';
import { createLogger } from '#lib/logger';
import { validateDomainForInstantPurchase } from '../lib/instant-buy';
import { db } from '@namefi-astra/db';
import { x402PurchasesTable } from '@namefi-astra/db/schema';
import { eq } from 'drizzle-orm';
import {
  checksumWalletAddressSchema,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { z } from 'zod';
import {
  paymentMiddleware,
  x402ResourceServer as X402ResourceServer,
  type PaymentPayload,
  type PaymentRequirements,
} from '@x402/hono';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import {
  HTTPFacilitatorClient,
  type ResourceInfo,
  type RouteConfig,
} from '@x402/core/server';
import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  type PaymentOption,
} from '@x402/core/http';
import { createPaywall } from '@x402/paywall';
import { evmPaywall } from '@x402/paywall/evm';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared/enums';
import {
  processX402PurchaseWorkflow,
  getX402PurchaseStateQuery,
  settlementSignal,
} from '../temporal/workflows/x402/process-x402-purchase.workflow';
import { getOrderProgressQuery } from '../temporal/workflows/processOrder.workflow';
import { centsToUsdc } from '../temporal/activities/x402.activities';
import { setTimeout } from 'timers/promises';
import type { SettleResponse } from '@x402/core/types';

const paywall = createPaywall()
  .withNetwork(evmPaywall)
  .withConfig({
    appName: 'Namefi',
    testnet: true,
    appLogo: 'https://namefi.io/logotype.svg',
  })
  .build();

const facilitatorClient = new HTTPFacilitatorClient({
  url: config.X402_FACILITATOR_URL,
});

const x402ResourceServer = new X402ResourceServer(facilitatorClient).register(
  config.X402_NETWORK,
  new ExactEvmScheme(),
);
x402ResourceServer.initialize();
// Type alias for the context
type X402Context = Context;

const logger = createLogger({ context: 'X402_ROUTER' });

// x402 headers
const PAYMENT_REQUIRED_HEADERS = ['PAYMENT', 'X-PAYMENT'];
const PAYMENT_SIGNATURE_HEADERS = ['PAYMENT-SIGNATURE', 'X-PAYMENT-SIGNATURE'];
const PAYMENT_RESPONSE_HEADERS = ['PAYMENT-RESPONSE', 'X-PAYMENT-RESPONSE'];

// Schema for domain path parameter
const domainParamSchema = z.object({
  domain: namefiNormalizedDomainSchema,
});

// Schema for optional query parameters
const domainQuerySchema = z.object({
  years: z.coerce.number().int().min(1).max(10).default(1),
});

export const x402Router = new Hono();

/**
 * Middleware to check if x402 is enabled
 */
x402Router.use('/*', async (c, next) => {
  if (!config.X402_ENABLED) {
    throw new HTTPException(503, {
      message: 'x402 payment protocol is not allowed',
    });
  }

  if (!config.X402_SIGNER_ADDRESS) {
    logger.error('X402_SIGNER_ADDRESS not configured');
    throw new HTTPException(503, {
      message: 'x402 payment not configured',
    });
  }

  return next();
});

/**
 * GET /x402/domain/:domain
 *
 * Returns domain availability and payment requirements.
 * If the request includes a valid x402 payment header, processes the purchase.
 */
x402Router.get('/domain/:domain', async (c) => {
  // Parse and validate domain
  const domainParam = domainParamSchema.safeParse({
    domain: c.req.param('domain'),
  });
  if (!domainParam.success) {
    throw new HTTPException(400, {
      message: `Invalid domain format: ${domainParam.error.message}`,
    });
  }
  const normalizedDomainName = domainParam.data.domain;

  // Parse query parameters
  const queryResult = domainQuerySchema.safeParse({
    years: c.req.query('years'),
  });
  const durationInYears = queryResult.success ? queryResult.data.years : 1;

  logger.info({ normalizedDomainName, durationInYears }, 'x402 domain request');

  // Check for x402 payment header
  const paymentSignature = getSingleHeaderWithDifferentKeys(
    c,
    PAYMENT_SIGNATURE_HEADERS,
  );

  if (paymentSignature) {
    logger.info('Payment signature found');
    // Process payment - this is a paid request
    return handlePaidRequest(
      c,
      normalizedDomainName,
      durationInYears,
      paymentSignature,
    );
  }
  logger.info('No payment signature found');

  // No payment header - return 402 with payment requirements
  return handlePaymentRequired(c, normalizedDomainName, durationInYears);
});

/**
 * Returns 402 Payment Required with x402 payment options
 */
async function handlePaymentRequired(
  c: X402Context,
  normalizedDomainName: string,
  durationInYears: number,
) {
  // Validate domain and get pricing (no user context for x402)
  const validation = await validateDomainForInstantPurchase({
    normalizedDomainName: normalizedDomainName as any,
    durationInYears,
    user: undefined,
  });

  if (!validation.isValid) {
    throw new HTTPException(400, {
      message: validation.error || 'Domain not available for purchase',
    });
  }

  // Convert cents to dollars for x402 (uses USDC which is 6 decimals)
  const priceInUsdc = centsToUsdc(validation.priceInUsdCents);
  const paymentOption = buildExactPaymentOption(priceInUsdc);
  const resourceInfo = {
    description: `Register ${normalizedDomainName} for ${durationInYears} year(s)`,
    mimeType: '*',
    resource: `/x402/domain/${normalizedDomainName}`,
    url: `/x402/domain/${normalizedDomainName}`,
  };
  // Build x402 payment requirements
  const baseRequirements = {
    accepts: [paymentOption],
    ...resourceInfo,
  };
  const routeConfig = {
    ...baseRequirements,
    unpaidResponseBody: () => {
      return {
        contentType: 'application/json',
        body: {
          ...baseRequirements,
          // Include metadata for client
          metadata: {
            domain: normalizedDomainName,
            durationInYears,
            priceInUsdCents: validation.priceInUsdCents,
          },
        },
      };
    },
  } satisfies RouteConfig;

  // A promise to get around middleware requiring next()
  const nextPromise = Promise.withResolvers<Response>();

  return Promise.race([
    nextPromise.promise,
    paymentMiddleware(
      {
        [`/x402/domain/${normalizedDomainName}`]: routeConfig,
      },
      x402ResourceServer,
      {
        appLogo: 'https://namefi.io/logotype.svg',
        appName: 'Namefi',
        testnet: true,
      },
      paywall,
    )(c, async () => {
      // Set 402 Payment Required response
      c.status(402);
      const paymentRequirements =
        await x402ResourceServer.buildPaymentRequirementsFromOptions(
          [paymentOption],
          c,
        );
      const paymentRequiredResponse =
        await x402ResourceServer.createPaymentRequiredResponse(
          paymentRequirements,
          resourceInfo,
          'Payment Required',
        );
      const paymentRequiredHeader = encodePaymentRequiredHeader(
        paymentRequiredResponse,
      );
      c.header(PAYMENT_REQUIRED_HEADERS[0], paymentRequiredHeader);
      c.header('Content-Type', 'application/json');

      nextPromise.resolve(
        c.json({
          status: 402,
          message: 'Payment Required',
          domain: normalizedDomainName,
          priceInUsdCents: validation.priceInUsdCents,
          priceInUsdc,
          durationInYears,
          paymentOptions: [paymentOption],
        }),
      );
    }),
  ]);
}

/**
 * Handles a request with x402 payment signature
 */
async function handlePaidRequest(
  c: X402Context,
  normalizedDomainName: string,
  durationInYears: number,
  paymentSignature: string,
) {
  logger.info(
    { normalizedDomainName, durationInYears },
    'Processing x402 paid request',
  );

  // Validate domain and get pricing
  const validation = await validateDomainForInstantPurchase({
    normalizedDomainName: normalizedDomainName as any,
    durationInYears,
    user: undefined,
  });
  if (!validation.isValid) {
    throw new HTTPException(400, {
      message: validation.error || 'Domain not available for purchase',
    });
  }
  // Convert cents to dollars for x402 (uses USDC which is 6 decimals)
  const priceInUsdc = centsToUsdc(validation.priceInUsdCents);

  // Parse payment payload
  let paymentPayload: PaymentPayload;
  let paymentRequirement: PaymentRequirements;
  try {
    paymentPayload = decodePaymentSignatureHeader(paymentSignature);
    const paymentRequirements =
      await x402ResourceServer.buildPaymentRequirementsFromOptions(
        [buildExactPaymentOption(priceInUsdc)],
        c,
      );
    paymentRequirement = paymentRequirements[0];
    const verifyRes = await x402ResourceServer.verifyPayment(
      paymentPayload,
      paymentRequirement,
    );
    logger.trace({ verifyRes }, 'Verified payment');
    if (!verifyRes || !verifyRes.isValid) {
      throw new HTTPException(400, {
        message: 'Invalid payment signature format',
      });
    }
  } catch (req) {
    logger.trace({ error: req }, 'Invalid payment signature format');
    throw new HTTPException(400, {
      message: 'Invalid payment signature format',
    });
  }

  // Extract buyer wallet from payment payload
  // The payload structure depends on the x402 scheme (exact/evm uses EIP-3009)
  const buyerWallet = extractBuyerWallet(paymentPayload);
  if (!buyerWallet) {
    throw new HTTPException(400, {
      message: 'Could not determine buyer wallet from payment',
    });
  }

  if (!validation.isValid) {
    throw new HTTPException(400, {
      message: validation.error || 'Domain not available for purchase',
    });
  }

  // Check for existing pending purchase
  const existingPurchase = await db.query.x402PurchasesTable.findFirst({
    where: eq(
      x402PurchasesTable.normalizedDomainName,
      normalizedDomainName as any,
    ),
  });

  if (
    existingPurchase &&
    ['PENDING_VERIFICATION', 'VERIFIED', 'PROCESSING', 'SETTLING'].includes(
      existingPurchase.status,
    )
  ) {
    throw new HTTPException(409, {
      message: 'A purchase is already in progress for this domain',
    });
  }

  const nonce = (paymentPayload?.payload?.authorization as any)?.nonce;
  if (!nonce) {
    throw new HTTPException(400, {
      message: 'Payment nonce is missing',
    });
  }

  // Create x402 purchase record
  const [purchase] = await db
    .insert(x402PurchasesTable)
    .values({
      normalizedDomainName: normalizedDomainName as any,
      amountInUSDCents: validation.priceInUsdCents,
      buyerWalletAddress: buyerWallet,
      network: config.X402_NETWORK,
      durationInYears,
      status: 'PENDING_VERIFICATION',
      paymentPayload,
      paymentNonce: nonce,
    })
    .returning();

  // The receiver wallet address is the signer address that received the USDC payment
  const receiverWalletAddress = config.X402_SIGNER_ADDRESS;
  if (!receiverWalletAddress) {
    throw new HTTPException(500, {
      message: 'X402_SIGNER_ADDRESS not configured',
    });
  }

  const workflow = await temporalClient.workflow.start(
    processX402PurchaseWorkflow,
    {
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
      workflowId: `x402-purchase-[${purchase.id}]`,
      args: [
        {
          purchaseId: purchase.id,
          amountInUsdCents: purchase.amountInUSDCents,
          paymentPayload: purchase.paymentPayload!,
          buyerWalletAddress: checksumWalletAddressSchema.parse(
            purchase.buyerWalletAddress,
          ),
          receiverWalletAddress,
          durationInYears: purchase.durationInYears,
          network: purchase.network,
          normalizedDomainName: purchase.normalizedDomainName,
        },
      ],
    },
  );

  let settledPayment: SettleResponse;
  try {
    settledPayment = await x402ResourceServer.settlePayment(
      paymentPayload,
      paymentRequirement,
    );
    logger.trace(
      { settledPayment },
      `Settled payment for ${normalizedDomainName}`,
    );
    if (!settledPayment || !settledPayment.success) {
      throw new HTTPException(400, {
        message: settledPayment?.errorReason,
      });
    }
    await workflow.signal(settlementSignal, {
      settledAt: new Date().toISOString(),
      settlementTxHash: settledPayment.transaction,
    });
  } catch (req) {
    logger.trace({ error: req }, 'Invalid payment signature format');
    throw new HTTPException(400, {
      message: 'Invalid payment signature format',
    });
  }

  logger.info(
    { purchaseId: purchase.id, normalizedDomainName },
    'Created x402 purchase record',
  );

  c.header(
    PAYMENT_RESPONSE_HEADERS[0],
    Buffer.from(JSON.stringify(settledPayment)).toString('base64'),
  );

  return c.json({
    status: 'accepted',
    message: 'Payment accepted, processing domain registration',
    purchaseId: purchase.id,
    domain: normalizedDomainName,
    buyerWallet,
    estimatedCompletionSeconds: 60,
  });
}

/**
 * GET /x402/purchase/:id
 *
 * Check status of an x402 purchase
 */
x402Router.get('/purchase/:id', async (c) => {
  const purchaseId = c.req.param('id');

  const purchase = await db.query.x402PurchasesTable.findFirst({
    where: eq(x402PurchasesTable.id, purchaseId),
  });

  if (!purchase) {
    throw new HTTPException(404, {
      message: 'Purchase not found',
    });
  }

  return c.json({
    id: purchase.id,
    domain: purchase.normalizedDomainName,
    status: purchase.status,
    buyerWallet: purchase.buyerWalletAddress,
    amountInUsdCents: purchase.amountInUSDCents,
    network: purchase.network,
    settlementTxHash: purchase.settlementTxHash,
    orderId: purchase.orderId,
    errorMessage: purchase.errorMessage,
    createdAt: purchase.createdAt,
    updatedAt: purchase.updatedAt,
  });
});

/**
 * Extract buyer wallet address from x402 payment payload
 * For EVM/EIP-3009, the "from" address is the buyer
 */
function extractBuyerWallet(paymentPayload: PaymentPayload): string | null {
  try {
    const payload = paymentPayload.payload;

    // EIP-3009 transferWithAuthorization has "from" field
    if (payload && typeof payload === 'object') {
      if ('from' in payload && typeof payload.from === 'string') {
        return payload.from;
      }
      // Some implementations nest the data
      if (
        'authorization' in payload &&
        typeof payload.authorization === 'object'
      ) {
        const auth = payload.authorization as Record<string, unknown>;
        if ('from' in auth && typeof auth.from === 'string') {
          return auth.from;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function safeVerifyPayment(
  paymentPayload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
): Promise<void> {
  try {
    const verifyRes = await x402ResourceServer.verifyPayment(
      paymentPayload,
      paymentRequirements,
    );
    logger.trace({ verifyRes }, 'Verified payment');
  } catch (req) {
    logger.trace({ error: req }, 'Invalid payment signature format');
  }
}

async function safeSettlePayment(
  paymentPayload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
): Promise<void> {
  try {
    const settleRes = await x402ResourceServer.settlePayment(
      paymentPayload,
      paymentRequirements,
    );
    logger.trace({ settleRes }, 'Settled payment');
  } catch (req) {
    logger.trace({ error: req }, 'Failed to settle payment');
  }
}

function getSingleHeaderWithDifferentKeys(c: Context, headers: string[]) {
  for (const headerKey of headers) {
    const val = c.req.header(headerKey);
    if (val) return val;
  }

  return null;
}

function b64JsonStringify(json: any) {
  return Buffer.from(json, 'utf-8').toString('base64');
}

function buildExactPaymentOption(priceInUsdc: ReturnType<typeof centsToUsdc>) {
  return {
    scheme: 'exact',
    network: config.X402_NETWORK,
    price: priceInUsdc,
    payTo: config.X402_SIGNER_ADDRESS ?? 'namefidao.eth',
    maxTimeoutSeconds: 3 * 60 * 60,
  } satisfies PaymentOption;
}
