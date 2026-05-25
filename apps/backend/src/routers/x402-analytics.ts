/**
 * x402 Analytics Router
 *
 * Provides paid access to DNS analytics reports via x402 protocol.
 * Fixed price: 0.25 USD cents (0.0025 USD) per request.
 *
 * Features:
 * - x402 payment with manual verification/settlement (to capture txHash)
 * - JWT access tokens for re-accessing paid resources
 * - Handles sub-cent pricing
 *
 * Flow:
 * 1. Check for valid access token - if valid, skip payment
 * 2. Check for payment signature header - if present, verify and settle
 * 3. If no payment, return 402 with paywall via middleware
 */

import { Hono, type Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { config } from '#lib/env';
import { createLogger } from '#lib/logger';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';
import { paymentMiddleware, type PaymentPayload } from '@x402/hono';
import type { RouteConfig } from '@x402/core/server';
import { decodePaymentSignatureHeader } from '@x402/core/http';
import type { SettleResponse } from '@x402/core/types';
import { createPaywall } from '@x402/paywall';
import {
  genericEvmPaywall,
  PAYWALL_REDIRECT_OPTIONS_HEADER,
  type RedirectOptions,
} from '../lib/x402';
import {
  getFullReportByRecordName,
  getFullReportByRecordNameInputSchema,
} from '../trpc/routers/analyticsRouter';
import { parseDnsAnalyticsReportData } from '#lib/analytics-parser';
import { audit, createAuditRecord, ResourceType } from '#lib/auditor';
import {
  generateAccessToken,
  verifyAccessToken,
  tokenMatchesResource,
  type X402AccessTokenPayload,
} from '../lib/x402/jwt-access';
import { centsToUsdc, getX402ResourceServer } from '#lib/x402/helpers';

const logger = createLogger({ context: 'X402_ANALYTICS_ROUTER' });

// Fixed price for analytics reports: 0.25 USD cents = 0.0025 USD
const ANALYTICS_PRICE_CENTS = 0.25;

// Resource type for JWT tokens
const ANALYTICS_RESOURCE_TYPE = 'analytics';

// x402 payment headers
const PAYMENT_SIGNATURE_HEADERS = ['PAYMENT-SIGNATURE', 'X-PAYMENT-SIGNATURE'];

// GA4 date token validation (reuse from analyticsRouter)
const gaDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const gaRelativeDayRegex = /^(today|yesterday|\d+daysAgo)$/;
const gaDateToken = z
  .string()
  .refine((v) => gaDateRegex.test(v) || gaRelativeDayRegex.test(v), {
    message: 'Use YYYY-MM-DD, today, yesterday, or NdaysAgo',
  });

// Schema for domain path parameter
const domainParamSchema = z.object({
  domainName: namefiNormalizedDomainSchema,
});

// Schema for query parameters
const analyticsQuerySchema = z.object({
  startDate: gaDateToken.default('7daysAgo'),
  endDate: gaDateToken.default('today'),
  // Optional access token to skip payment
  accessToken: z.string().optional(),
  // Report format: 'raw' (GA4 format) or 'parsed' (frontend-friendly format)
  // Note: This is a request-time option and is NOT included in JWT token
  format: z.enum(['raw', 'parsed']).default('raw'),
});

// Setup x402 paywall with generic handler
const paywall = createPaywall()
  .withNetwork(genericEvmPaywall)
  .withConfig({
    appName: 'Namefi',
    testnet: config.X402_NETWORK === 'eip155:84532',
  })
  .build();
const x402ResourceServer = await getX402ResourceServer();

/**
 * Build x402 payment option for exact scheme
 */
function buildExactPaymentOption() {
  const priceInUsdc = centsToUsdc(ANALYTICS_PRICE_CENTS);
  if (!config.X402_SIGNER_ADDRESS) {
    // Enforced by the router middleware; this guard keeps `payTo` well-typed.
    throw new Error('X402_SIGNER_ADDRESS is not configured');
  }
  return {
    scheme: 'exact' as const,
    network: config.X402_NETWORK,
    price: priceInUsdc,
    payTo: config.X402_SIGNER_ADDRESS,
    maxTimeoutSeconds: 5 * 60, // 5 minutes for analytics
  };
}

/**
 * Build route config for x402 payment middleware
 */
const analyticsRouteConfig = (domainName: string): RouteConfig => ({
  accepts: [buildExactPaymentOption()],
  description: `DNS Analytics Report for ${domainName}`,
  mimeType: 'application/json',
  resource: `/x402/analytics/report/${domainName}`,
});

/**
 * Get first matching header value from a list of possible header keys
 */
function getPaymentSignatureHeader(c: Context): string | null {
  for (const headerKey of PAYMENT_SIGNATURE_HEADERS) {
    const val = c.req.header(headerKey);
    if (val) return val;
  }
  return null;
}

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

// Regex for parsing chain ID from network string
const CHAIN_ID_REGEX = /eip155:(\d+)/;

/**
 * Parse the chain ID from a network string (e.g. "eip155:84532" -> 84532).
 * Returns `undefined` when the network string cannot be parsed — 0 is not a
 * valid EVM chain ID and would silently mask the failure downstream.
 */
function parseChainIdFromNetwork(network: string): number | undefined {
  const match = network.match(CHAIN_ID_REGEX);
  return match ? Number.parseInt(match[1], 10) : undefined;
}

// Hono Variables type for context
type AnalyticsHonoVariables = {
  accessTokenPayload?: X402AccessTokenPayload;
  bypassPayment?: boolean;
};

export const x402AnalyticsRouter = new Hono<{
  Variables: AnalyticsHonoVariables;
}>();

/**
 * Middleware to check if x402 is enabled
 */
x402AnalyticsRouter.use('/*', async (_c, next) => {
  if (!config.X402_ENABLED) {
    throw new HTTPException(503, {
      message: 'x402 payment protocol is not enabled',
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
 * Middleware to check for valid access token and bypass payment if valid
 */
x402AnalyticsRouter.use('/report/:domain', async (c, next) => {
  // Check for access token in query params or Authorization header
  const accessToken =
    c.req.query('accessToken') ||
    c.req.header('Authorization')?.replace(/^Bearer /, '');

  if (!accessToken) {
    return next();
  }

  // Verify the token
  const result = await verifyAccessToken(accessToken);

  if (!result.valid) {
    logger.info(
      { error: result.error },
      'Invalid access token, requiring payment',
    );
    return next();
  }

  // Parse request parameters to check if token matches.
  // Normalize the domain the same way the GET handler does so token matching
  // is consistent regardless of the casing/format used in the request URL.
  const domainParam = domainParamSchema.safeParse({
    domainName: c.req.param('domain'),
  });
  if (!domainParam.success) {
    return next();
  }
  const domainName = domainParam.data.domainName;
  const startDate = c.req.query('startDate') || '7daysAgo';
  const endDate = c.req.query('endDate') || 'today';

  // Check if token matches this resource
  const matches = tokenMatchesResource(
    result.payload,
    ANALYTICS_RESOURCE_TYPE,
    domainName,
    { startDate, endDate },
  );

  if (!matches) {
    logger.info(
      {
        tokenResource: result.payload.resourceId,
        requestedResource: domainName,
      },
      'Access token does not match requested resource',
    );
    return next();
  }

  // Token is valid and matches - bypass payment
  logger.info(
    {
      domainName,
      buyerWallet: result.payload.buyerWallet,
      paidAt: result.payload.paidAt,
    },
    'Valid access token, bypassing payment',
  );

  c.set('accessTokenPayload', result.payload);
  c.set('bypassPayment', true);

  return next();
});

/**
 * GET /x402/analytics/report/:domainName
 *
 * Returns DNS analytics report for a domain.
 * Requires x402 payment of 0.0025 USD OR a valid access token.
 *
 * Query params:
 * - startDate: GA4 date token (default: '7daysAgo')
 * - endDate: GA4 date token (default: 'today')
 * - accessToken: JWT access token to skip payment (optional)
 *
 * Headers:
 * - Authorization: Bearer <accessToken> (alternative to query param)
 * - X-PAYMENT-SIGNATURE or PAYMENT-SIGNATURE: x402 payment payload
 */
x402AnalyticsRouter.get('/report/:domainName', async (c) => {
  // Parse and validate domain
  const domainParam = domainParamSchema.safeParse({
    domainName: c.req.param('domainName'),
  });
  if (!domainParam.success) {
    throw new HTTPException(400, {
      message: `Invalid domain format: ${domainParam.error.message}`,
    });
  }
  const domainName = domainParam.data.domainName;

  // Parse query parameters
  const queryResult = analyticsQuerySchema.safeParse({
    startDate: c.req.query('startDate'),
    endDate: c.req.query('endDate'),
    format: c.req.query('format'),
  });
  const { startDate, endDate, format } = queryResult.success
    ? queryResult.data
    : { startDate: '7daysAgo', endDate: 'today', format: 'raw' as const };

  // Check if bypassing payment via access token
  const accessTokenPayload = c.get('accessTokenPayload');
  if (accessTokenPayload) {
    return handleAccessTokenRequest(
      c,
      domainName,
      startDate,
      endDate,
      accessTokenPayload,
      format,
    );
  }

  // Check for payment signature header
  const paymentSignature = getPaymentSignatureHeader(c);
  if (paymentSignature) {
    return handlePaidRequest(
      c,
      domainName,
      startDate,
      endDate,
      paymentSignature,
      format,
    );
  }

  // No payment - return 402 via middleware
  return handlePaymentRequired(c, domainName, startDate, endDate);
});

/**
 * Handle request with valid access token (no payment needed)
 */
async function handleAccessTokenRequest(
  c: Context,
  domainName: string,
  startDate: string,
  endDate: string,
  tokenPayload: X402AccessTokenPayload,
  format: 'raw' | 'parsed',
) {
  logger.info(
    {
      domainName,
      startDate,
      endDate,
      buyerWallet: tokenPayload.buyerWallet,
      format,
    },
    'Processing analytics request via access token',
  );

  // Fetch analytics report (parsed or raw based on format)
  const report = await fetchAnalyticsReport(
    domainName,
    startDate,
    endDate,
    format,
  );

  return c.json({
    buyerWallet: tokenPayload.buyerWallet,
    domainName,
    dateRange: { startDate, endDate },
    accessedVia: 'token',
    // Include original payment info from token if available
    ...(tokenPayload.txHash && { txHash: tokenPayload.txHash }),
    ...(tokenPayload.chainId !== undefined && {
      chainId: tokenPayload.chainId,
    }),
    report,
  });
}

/**
 * Handle request with x402 payment signature
 */
async function handlePaidRequest(
  c: Context,
  domainName: string,
  startDate: string,
  endDate: string,
  paymentSignature: string,
  format: 'raw' | 'parsed',
) {
  logger.info(
    { domainName, startDate, endDate },
    'Processing x402 paid request',
  );

  // Decode payment payload
  let paymentPayload: PaymentPayload;
  try {
    paymentPayload = decodePaymentSignatureHeader(paymentSignature);
  } catch (error) {
    logger.error({ error }, 'Failed to decode payment signature');
    throw new HTTPException(400, {
      message: 'Invalid payment signature format',
    });
  }

  // Build payment requirements
  const paymentOption = buildExactPaymentOption();
  const paymentRequirements =
    await x402ResourceServer.buildPaymentRequirementsFromOptions(
      [paymentOption],
      c,
    );
  const paymentRequirement = paymentRequirements[0];

  // Verify payment
  logger.info({ paymentRequirements, paymentPayload }, 'Verifying payment');
  const verifyRes = await x402ResourceServer.verifyPayment(
    paymentPayload,
    paymentRequirement,
  );

  if (!verifyRes || !verifyRes.isValid) {
    logger.error({ verifyRes }, 'Payment verification failed');
    throw new HTTPException(400, {
      message: verifyRes?.invalidReason || 'Invalid payment signature',
    });
  }

  // Settle payment
  let settleRes: SettleResponse;
  try {
    settleRes = await x402ResourceServer.settlePayment(
      paymentPayload,
      paymentRequirement,
    );
    logger.info({ settleRes }, 'Payment settled');

    if (!settleRes || !settleRes.success) {
      throw new HTTPException(400, {
        message: settleRes?.errorReason || 'Payment settlement failed',
      });
    }
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    logger.error({ error }, 'Payment settlement failed');
    throw new HTTPException(400, {
      message: 'Payment settlement failed',
    });
  }

  // Extract buyer wallet
  const buyerWallet = extractBuyerWallet(paymentPayload) || 'unknown';

  // Extract transaction details from settlement
  const txHash = settleRes.transaction;
  const network = settleRes.network || config.X402_NETWORK;
  const chainId = parseChainIdFromNetwork(network);

  logger.info(
    { domainName, buyerWallet, txHash, chainId },
    'Payment successful',
  );

  // Audit log the successful payment
  audit(
    createAuditRecord({
      actorType: 'user',
      actorId: buyerWallet,
      resourceType: ResourceType.OTHER,
      resourceId: domainName,
      action: 'x402_analytics_payment',
      extraInput: {
        domainName,
        buyerWallet,
        amountCents: ANALYTICS_PRICE_CENTS,
        network,
        chainId,
        txHash,
        dateRange: { startDate, endDate },
      },
    }),
  );

  // Generate the access token BEFORE fetching the report. The payment is
  // already settled (irreversible), so the buyer must receive a token even if
  // the report fetch fails — otherwise they lose the payment with no way to
  // re-access the resource.
  let accessToken: string | undefined;
  try {
    accessToken = await generateAccessToken({
      resourceType: ANALYTICS_RESOURCE_TYPE,
      resourceId: domainName,
      query: { startDate, endDate },
      paidAt: new Date().toISOString(),
      buyerWallet,
      txHash,
      chainId,
    });
    if (accessToken) {
      c.header(
        PAYWALL_REDIRECT_OPTIONS_HEADER,
        b64JsonStringify({
          // startDate/endDate are part of the token's query and must be
          // present on re-access, otherwise tokenMatchesResource rejects it.
          successRedirectUrl: `http${config.APP_URL.includes('localhost') ? '' : 's'}://${config.APP_URL}/x402/analytics/report/${domainName}?accessToken=${accessToken}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
          successRedirectBtnLabel: 'View Report',
          autoSuccessRedirect: false,
        } satisfies RedirectOptions),
      );
    }
  } catch (error) {
    logger.error({ error }, 'Failed to generate access token');
    // Continue without token - not critical
  }

  // Fetch analytics report (parsed or raw based on format). The payment is
  // already settled, so if the fetch fails return the access token alongside
  // the error: the buyer can re-access the report later without paying again.
  let report: Awaited<ReturnType<typeof fetchAnalyticsReport>>;
  try {
    report = await fetchAnalyticsReport(domainName, startDate, endDate, format);
  } catch (error) {
    logger.error(
      { error, domainName, buyerWallet, txHash },
      'Report fetch failed after payment was settled',
    );
    return c.json(
      {
        buyerWallet,
        domainName,
        dateRange: { startDate, endDate },
        accessedVia: 'payment',
        txHash,
        chainId,
        network,
        ...(accessToken && { accessToken }),
        error:
          'Payment succeeded but the report is temporarily unavailable. Retry later using your access token.',
      },
      502,
    );
  }

  return c.json({
    buyerWallet,
    domainName,
    dateRange: { startDate, endDate },
    accessedVia: 'payment',
    txHash,
    chainId,
    network,
    ...(accessToken && { accessToken }),
    report,
  });
}

/**
 * Handle request without payment - return 402 via middleware
 */
async function handlePaymentRequired(
  c: Context,
  domainName: string,
  startDate: string,
  endDate: string,
) {
  logger.info({ domainName, startDate, endDate }, 'No payment, returning 402');

  // Use middleware to generate 402 response with paywall
  const nextPromise = Promise.withResolvers<Response>();

  return Promise.race([
    nextPromise.promise,
    paymentMiddleware(
      {
        [`/x402/analytics/report/${domainName}`]:
          analyticsRouteConfig(domainName),
      },
      x402ResourceServer,
      // Cast to any because our PaywallHandlerConfig extends PaywallConfig with custom redirect options
      // These are passed through to our custom paywall handler (genericEvmPaywall)
      {
        appName: 'Namefi',
        testnet: config.X402_NETWORK === 'eip155:84532',
      },
      paywall,
    )(c, async () => {
      // This shouldn't be called since there's no payment header
      // But if it is, just resolve with a 402
      c.status(402);
      nextPromise.resolve(
        c.json({
          status: 402,
          message: 'Payment Required',
          domainName,
          priceInUsdCents: ANALYTICS_PRICE_CENTS,
          dateRange: { startDate, endDate },
        }),
      );
    }),
  ]);
}

/**
 * Fetch analytics report in specified format
 * @param format - 'raw' for GA4 format, 'parsed' for frontend-friendly DnsAnalyticsParsed format
 */
async function fetchAnalyticsReport(
  domainName: string,
  startDate: string,
  endDate: string,
  format: 'raw' | 'parsed',
) {
  try {
    const reportInput = getFullReportByRecordNameInputSchema.parse({
      startDate,
      endDate,
      domainName,
    });

    const rawReport = await getFullReportByRecordName(reportInput);

    if (format === 'parsed') {
      // Return parsed, frontend-friendly format
      return parseDnsAnalyticsReportData(rawReport, {
        includeIpDetails: false,
      });
    }

    // Return raw GA4 format for backward compatibility
    return rawReport;
  } catch (error) {
    logger.error({ error, domainName }, 'Failed to fetch analytics report');
    throw new HTTPException(500, {
      message: 'Failed to fetch analytics report',
    });
  }
}

function b64JsonStringify(obj: any) {
  return Buffer.from(JSON.stringify(obj), 'utf8').toString('base64');
}
