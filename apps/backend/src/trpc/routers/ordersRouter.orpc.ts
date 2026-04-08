import {
  type PaymentSelect,
  type PostProcessOrderItem,
  db,
  orderItemsTable,
  ordersTable,
  orderSelectSchema,
  orderItemSelectSchema,
  paymentSelectSchema,
  userSelectSchema,
} from '@namefi-astra/db';
import {
  checksumWalletAddressSchema,
  namefiNormalizedDomainSchema,
  parseDomainName,
} from '@namefi-astra/utils';
import { recordTypeEnum } from '@namefi-astra/zod-dns';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { isNil } from 'ramda';
import { z } from 'zod';
import {
  orderService,
  type CreateOrderItemInput,
  ensureOrderOwnership,
  getOrderItemsForUser,
  buildOrderPaymentMethodsDetails,
  createOrderWithWorkflow,
} from '../../services/orders/orders.service';
import { createPayment } from '../../temporal/activities/payment.activities';
import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import { resolve } from '../../utils/resolve';
import {
  createTRPCRouter,
  protectedProcedure,
  withAudit,
  authedOrPublicProcedure,
} from '../base';
import { validateDomainForInstantPurchaseOrThrow } from '../../lib/instant-buy';
import { itemTypeSchema } from '@namefi-astra/db/types';
import { x402PurchasesTable } from '@namefi-astra/db/schema';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '../utils';
import { secrets, config } from '../../lib/env';
import { logger } from '#lib/logger';
import { determinePayments, getUserChainBalances } from '../../lib/payments';
import { defaultEip712SchemaConverter } from '#lib/eip712/orpc-eip712-schema-converter';
import { orpcMetaWithEip712FromZodSchema } from '#lib/eip712/orpc-meta-from-zod-schemas';
import {
  getAllowedChainsForNft,
  getDefaultAllowedNftChainId,
} from '#lib/env/allowed-chains';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import {
  buildX402PaymentRequiredResponse,
  buildX402PaymentRequirements,
  decodeX402PaymentSignaturePayload,
  encodeX402PaymentRequiredResponse,
  encodeX402PaymentResponse,
  encryptX402PaymentPayloadSignature,
  extractBuyerWallet,
  extractX402PaymentNonce,
  getX402PaymentSignatureHeader,
  recoverX402SignerWallet,
  resolveX402PaymentPayloadEncryptionPrivateKey,
  settleX402Payment,
  verifyX402PaymentSignature,
  X402_PAYMENT_REQUIRED_HEADERS,
  X402_PAYMENT_RESPONSE_HEADERS,
  X402PaymentRequiredError,
} from '#lib/x402/helpers';
import { validateDomainForInstantPurchase } from '../../lib/instant-buy';
import {
  processX402PurchaseWorkflow,
  settlementSignal,
} from '../../temporal/workflows/x402/process-x402-purchase.workflow';
import {
  getMppPaymentRequiredError,
  getMppResourceMetadata,
  getRegisterDomainMppPaymentResult,
} from '#lib/mpp/helpers';
import { createMppInstantRegistration } from '#lib/mpp/register-domain';

// ============================================================================
// Output Schemas for OpenAPI
// ============================================================================

// Payment method details schemas
const paymentMethodDetailsOnChainSchema = z.object({
  paymentId: z.string(),
  isOnChainPayment: z.literal(true),
  txHash: z.string().nullable().optional(),
  chainId: z.number(),
  walletAddress: z.string(),
});

const paymentMethodDetailsOffChainSchema = z.object({
  paymentId: z.string(),
  isOnChainPayment: z.literal(false),
  brand: z.string().optional(),
  last4: z.string().optional(),
});

const paymentMethodDetailsX402Schema = z.object({
  paymentId: z.string(),
  isOnChainPayment: z.literal(true),
  isX402Payment: z.literal(true),
  network: z.string(),
  buyerWalletAddress: z.string(),
  receiverWalletAddress: z.string().optional(),
  settlementTxHash: z.string().nullable().optional(),
});

const paymentMethodDetailsMppSchema = z.object({
  paymentId: z.string(),
  isMppPayment: z.literal(true),
  method: z.enum(['stripe', 'tempo']),
  isOnChainPayment: z.boolean(),
  payerWalletAddress: z.string().optional(),
  reference: z.string().nullable().optional(),
  brand: z.string().optional(),
  last4: z.string().optional(),
});

const paymentMethodDetailsSchema = z.union([
  paymentMethodDetailsX402Schema,
  paymentMethodDetailsMppSchema,
  paymentMethodDetailsOnChainSchema,
  paymentMethodDetailsOffChainSchema,
]);

export const instantBuyDefaultWalletInputSchema = z
  .object({
    normalizedDomainName: namefiNormalizedDomainSchema,
    durationInYears: z.number().int().min(0).max(10).default(1),
  })
  .meta({
    name: 'InstantRegisterDomainDefaultWallet',
    eip712: { structName: 'InstantRegisterDomainDefaultWallet' },
  });
defaultEip712SchemaConverter.register(instantBuyDefaultWalletInputSchema);

export const instantBuyInputSchema = z
  .object({
    ...instantBuyDefaultWalletInputSchema.shape,
    nftReceivingWallet: z
      .object({
        walletAddress: checksumWalletAddressSchema,
        chainId: z.number(),
      })
      .optional()
      .describe(
        'Wallet address and chain ID of the wallet that will receive the NFT, defaults to the buyer\'s wallet and "Base Chain"',
      ),
  })
  .meta({
    name: 'InstantRegisterDomain',
    eip712: { structName: 'InstantRegisterDomain' },
  });

export const registerTrialDomainInputSchema = z
  .object({
    normalizedDomainName: namefiNormalizedDomainSchema,
  })
  .meta({
    name: 'RegisterTrialDomain',
    eip712: { structName: 'RegisterTrialDomain' },
  });

const postProcessRecordSchema = z.object({
  name: z.string(),
  type: recordTypeEnum,
  rdata: z.string(),
  ttl: z.number().int().min(0).max(2147483647).optional().default(30),
});

const postProcessOrderItemSchema = z.object({
  actions: z
    .array(
      z.object({
        scope: z.literal('dns-records'),
        action: z.enum(['add', 'set']),
        records: z.array(postProcessRecordSchema).min(1),
      }),
    )
    .min(1),
});

const registerWithRecordsInputSchema = z.object({
  ...instantBuyInputSchema.shape,
  records: z.array(postProcessRecordSchema).optional().default([]),
});

type RegisterDomainInput = z.infer<typeof instantBuyInputSchema>;

type RegisterDomainWithRecordsInput = {
  ctx: { user: { id: string; privyUserId: string } };
  input: RegisterDomainInput;
  postProcessOrderItem?: PostProcessOrderItem;
  gaEventTracking?: {
    trackGaEvents: boolean;
    reason?: string;
  };
};

const buildPostProcessOrderItem = (
  payload: z.infer<typeof postProcessOrderItemSchema>,
): PostProcessOrderItem => {
  return postProcessOrderItemSchema.parse(payload) as PostProcessOrderItem;
};

const registerDomainWithRecords = async ({
  ctx,
  input,
  postProcessOrderItem,
  gaEventTracking: gaEventTrackingInput,
}: RegisterDomainWithRecordsInput) => {
  const gaEventTracking =
    gaEventTrackingInput ??
    (await orderService.shouldTrackOrderCheckoutFlowForUser(ctx.user.id));
  const { normalizedDomainName, durationInYears } = input;
  const parsedDomainResult = parseDomainName(normalizedDomainName);
  if (!parsedDomainResult.valid) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid Domain Name',
    });
  }

  // 1. Get user details from Privy
  const [error, privyUser] = await resolve(
    privyClient.getUserById(ctx.user.privyUserId),
  );
  if (error || isNil(privyUser)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Could not find user details',
    });
  }

  // 2. Validate domain availability and get pricing
  const validation = await validateDomainForInstantPurchaseOrThrow({
    normalizedDomainName,
    durationInYears,
    user: { id: ctx.user.id, privyUserId: ctx.user.privyUserId },
  });

  // 3. Get user's linked wallet addresses and chain balances
  const userWalletAddresses = getPrivyUserLinkedEthereumChecksumWalletAddresses(
    { privyUser },
  );

  if (userWalletAddresses.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'No linked wallet addresses found for user',
    });
  }

  const poweredByNamefiDomain = (await getPoweredByNamefi3PDomains()).find(
    (parent) => parsedDomainResult.immediateParentDomain === parent,
  );
  const allowedNftChainIds = getAllowedChainsForNft(poweredByNamefiDomain);
  if (
    input.nftReceivingWallet &&
    !allowedNftChainIds.includes(input.nftReceivingWallet.chainId)
  ) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `NFT chain ID ${input.nftReceivingWallet.chainId} is not allowed for ${normalizedDomainName}`,
    });
  }

  const nftReceivingWallet = input.nftReceivingWallet || {
    walletAddress: userWalletAddresses[0],
    chainId: getDefaultAllowedNftChainId(poweredByNamefiDomain),
  };

  // 4. Get chain balances for user's wallets
  const chainBalances = await getUserChainBalances(
    userWalletAddresses,
    poweredByNamefiDomain,
  );

  // 5. Determine payments from NFSC balances
  const paymentResult = determinePayments({
    totalAmountInUsdCents: validation.priceInUsdCents,
    chainBalances,
    allowedMethods: ['NFSC'], // Only NFSC for API, no Stripe
    allowZeroPayments: true,
    defaultWalletAddress: userWalletAddresses[0],
  });

  if (paymentResult.status === 'INSUFFICIENT_FUNDS') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        paymentResult.errorMessage ??
        'Insufficient NFSC balance to complete purchase',
    });
  }

  const payments = paymentResult.payments;

  // 6. Create order via shared service
  const order = await createOrderWithWorkflow({
    userId: ctx.user.id,
    amountInUSDCents: validation.priceInUsdCents,
    nftWalletAddress: nftReceivingWallet.walletAddress,
    nftChainId: nftReceivingWallet.chainId,
    payments,
    items: [
      {
        normalizedDomainName,
        amountInUSDCents: validation.priceInUsdCents,
        durationInYears,
        type: itemTypeSchema.enum.REGISTER,
        registrar: validation.registrar,
        metadata: postProcessOrderItem ? { postProcessOrderItem } : undefined,
      } satisfies CreateOrderItemInput,
    ],
    cartCleanup: {
      type: 'domain',
      userId: ctx.user.id,
      normalizedDomainName,
    },
    gaEventTracking,
    orderSource: 'instant_buy',
  });

  logger.debug(
    {
      orderId: order.id,
      domain: normalizedDomainName,
      userId: ctx.user.id,
      priceInUsdCents: validation.priceInUsdCents,
    },
    'Instant buy order created successfully',
  );

  return order;
};

// Order details schema (for getOrder)
// We need to handle nullable metadata fields properly since DB returns null but schemas may expect undefined
const orderDetailsOutputSchema = z.object({
  order: orderSelectSchema.extend({
    metadata: orderSelectSchema.shape.metadata.nullable(),
  }),
  items: z.array(
    orderItemSelectSchema.extend({
      metadata: orderItemSelectSchema.shape.metadata.nullable(),
    }),
  ),
  payments: z.array(paymentSelectSchema),
  user: userSelectSchema,
});

// Order item output schema (matches getTableColumns output)
// Handle nullable metadata from DB
const orderItemOutputSchema = orderItemSelectSchema.extend({
  metadata: orderItemSelectSchema.shape.metadata.nullable(),
});

// Order output schema for instantBuy
const orderOutputSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amountInUSDCents: z.number(),
  nftWalletAddress: z.string().nullable(),
  nftChainId: z.number().nullable(),
  items: z.array(orderItemSelectSchema),
});

const registerDomainX402InputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  durationInYears: instantBuyInputSchema.shape.durationInYears,
  nftReceivingWalletAddress: checksumWalletAddressSchema.optional(),
});

const x402PurchaseResponseSchema = z.object({
  status: z.literal('accepted'),
  message: z.string(),
  purchaseId: z.string(),
  domain: namefiNormalizedDomainSchema,
  buyerWallet: checksumWalletAddressSchema,
  nftReceivingWalletAddress: checksumWalletAddressSchema,
  estimatedCompletionSeconds: z.number().int().positive(),
});

const registerDomainMppInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  durationInYears: instantBuyInputSchema.shape.durationInYears,
  nftReceivingWalletAddress: checksumWalletAddressSchema,
});

const mppPurchaseResponseSchema = z.object({
  status: z.literal('accepted'),
  message: z.string(),
  orderId: z.string(),
  paymentId: z.string(),
  domain: namefiNormalizedDomainSchema,
  paymentMethod: z.enum(['tempo', 'stripe']),
  payerDid: z.string().optional(),
  payerWalletAddress: checksumWalletAddressSchema.optional(),
  nftReceivingWalletAddress: checksumWalletAddressSchema,
  estimatedCompletionSeconds: z.number().int().positive(),
});

const resolveX402ErrorMessage = (errorReason?: string) =>
  errorReason || 'Error Validating Payment Signature';

const ensureX402ConfiguredOrThrow = () => {
  if (!config.X402_ENABLED) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'x402 payment protocol is not allowed',
    });
  }

  if (!config.X402_SIGNER_ADDRESS) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'x402 payment not configured',
    });
  }
};

const getX402ResourceInfo = (
  normalizedDomainName: string,
  durationInYears: number,
) => ({
  description: `Register ${normalizedDomainName} for ${durationInYears} year(s)`,
  mimeType: '*',
  resource: `/v-next/x402/domain/${normalizedDomainName}`,
  url: `/v-next/x402/domain/${normalizedDomainName}`,
});

const throwX402PaymentRequired = async ({
  ctx,
  normalizedDomainName,
  durationInYears,
  priceInUsdCents,
  nftReceivingWalletAddress,
}: {
  ctx: {
    req: { header: (headerName: string) => string | undefined };
    honoCtx?: { header: (name: string, value: string) => void };
  };
  normalizedDomainName: string;
  durationInYears: number;
  priceInUsdCents: number;
  nftReceivingWalletAddress?: string;
}): Promise<never> => {
  const { priceInUsdc, paymentOption, paymentRequirements } =
    await buildX402PaymentRequirements({
      amountInUsdCents: priceInUsdCents,
      context: ctx.req,
    });
  const paymentRequiredResponse = await buildX402PaymentRequiredResponse({
    paymentRequirements,
    resourceInfo: getX402ResourceInfo(normalizedDomainName, durationInYears),
  });
  const paymentRequiredHeader = encodeX402PaymentRequiredResponse(
    paymentRequiredResponse,
  );
  X402_PAYMENT_REQUIRED_HEADERS.forEach((header) => {
    ctx.honoCtx?.header(header, paymentRequiredHeader);
  });

  throw new TRPCError({
    code: 'PAYMENT_REQUIRED',
    message: 'Payment Required',
    cause: new X402PaymentRequiredError({
      headers: Object.fromEntries(
        X402_PAYMENT_REQUIRED_HEADERS.map((header) => [
          header,
          paymentRequiredHeader,
        ]),
      ),
      paymentRequiredResponse,
      metadata: {
        domain: normalizedDomainName,
        durationInYears,
        priceInUsdCents,
        priceInUsdc,
        paymentOptions: [paymentOption],
        nftReceivingWalletAddress,
      },
    }),
  });
};

// ============================================================================
// Router Definition
// ============================================================================

export const ordersRouterOrpc = createTRPCRouter({
  /**
   * Get order details by ID
   */
  getOrder: protectedProcedure
    .meta({
      route: {
        path: '/orders/{orderId}',
        method: 'GET',
        tags: ['orders'],
        operationId: 'getOrder',
        summary: 'Get order details',
        description:
          'Retrieve detailed information about an order including items, payments, and user details. User must own the order.',
      },
    })
    .input(z.object({ orderId: z.string() }))
    .output(orderDetailsOutputSchema)
    .query(async ({ ctx, input }) => {
      const { orderId } = input;
      const data = await orderService.getOrderDetailsOrThrow(orderId);
      if (data.order.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this order',
        });
      }
      return data;
    }),

  /**
   * Get user's order items
   */
  getOrderItems: protectedProcedure
    .meta({
      route: {
        path: '/orders/items',
        method: 'GET',
        tags: ['orders'],
        operationId: 'getOrderItems',
        summary: 'Get user order items',
        description:
          'Retrieve all order items for the current user, sorted by creation date in descending order.',
      },
    })
    .output(z.array(orderItemOutputSchema))
    .query(async ({ ctx: { user, poweredByNamefiDomain } }) => {
      return getOrderItemsForUser(user.id, poweredByNamefiDomain);
    }),

  /**
   * Instant buy - single domain purchase without cart
   */
  registerDomainForTrial: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo, result }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'order',
      resourceId: result.id || '',
      action: 'register_domain_for_trial',
      extraInput: input,
    }),
  )
    .meta(
      orpcMetaWithEip712FromZodSchema([registerTrialDomainInputSchema], {
        route: {
          path: '/orders/register-domain-trial',
          method: 'POST',
          tags: ['orders', 'EIP712'],
          operationId: 'registerDomainForTrial',
          summary: 'Instant Register domain for trial',
          description:
            'Purchase a single domain instantly for trial. Validates domain availability and creates the order, the domain is only registered for a couple of days before it expires or renewed if you please ',
        },
      }),
    )
    .input(registerTrialDomainInputSchema)
    .output(orderOutputSchema)
    .mutation(async ({ ctx, input }) => {
      return registerDomainWithRecords({
        ctx,
        input: {
          ...input,
          durationInYears: 0,
        },
      });
    }),

  /**
   * Instant buy - single domain purchase without cart
   */
  registerDomain: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo, result }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'order',
      resourceId: result.id || '',
      action: 'register_domain',
      extraInput: input,
    }),
  )
    .meta(
      orpcMetaWithEip712FromZodSchema(
        [instantBuyInputSchema, instantBuyDefaultWalletInputSchema],
        {
          route: {
            path: '/orders/register-domain',
            method: 'POST',
            tags: ['orders', 'EIP712'],
            operationId: 'registerDomain',
            summary: 'Instant Register domain',
            description:
              'Purchase a single domain instantly without adding to cart. Validates domain availability, creates payments and order, then starts the order processing workflow.',
          },
        },
      ),
    )
    .input(instantBuyInputSchema)
    .output(orderOutputSchema)
    .mutation(async ({ ctx, input }) => {
      return registerDomainWithRecords({
        ctx,
        input,
      });
    }),

  registerWithRecords: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo, result }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'order',
      resourceId: result.id || '',
      action: 'register_domain_with_records',
      extraInput: input,
    }),
  )
    .meta({
      route: {
        path: '/orders/register-domain/records',
        method: 'POST',
        tags: ['orders'],
        operationId: 'registerWithRecords',
        summary: 'Instant register domain with records',
        description:
          'Purchase a single domain instantly and apply DNS records after processing.',
      },
    })
    .input(
      registerWithRecordsInputSchema.describe(
        `Example payload:
\`\`\`
  {
    "normalizedDomainName": "example.com",
    "durationInYears": 1,
    "records": [{ "name": "@", "type": "A", "rdata": "203.0.113.10", "ttl": 30 }, { "name": "www", "type": "CNAME", "rdata": "app.example.net." }] }],
    "nftReceivingWallet": { "walletAddress": "0x1111111111111111111111111111111111111111", "chainId": 8453 }
  }
\`\`\`
        `,
      ),
    )
    .output(orderOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const postProcessOrderItem =
        input.records?.length > 0
          ? buildPostProcessOrderItem({
              actions: [
                {
                  scope: 'dns-records',
                  action: 'add',
                  records: input.records,
                },
              ],
            })
          : undefined;
      const gaEventTracking =
        await orderService.shouldTrackOrderCheckoutFlowForUser(ctx.user.id);

      return registerDomainWithRecords({
        ctx,
        input: {
          normalizedDomainName: input.normalizedDomainName,
          durationInYears: input.durationInYears,
          nftReceivingWallet: input.nftReceivingWallet,
        },
        postProcessOrderItem,
        gaEventTracking,
      });
    }),

  /**
   * Get payment method details for an order
   */
  getOrderPaymentMethodsDetails: protectedProcedure
    .meta({
      route: {
        path: '/orders/{orderId}/payment-methods',
        method: 'GET',
        tags: ['orders'],
        operationId: 'getOrderPaymentMethodsDetails',
        summary: 'Get order payment methods',
        description:
          'Retrieve payment method details for an order, including card info for Stripe payments and wallet addresses for on-chain payments.',
      },
    })
    .input(z.object({ orderId: z.string() }))
    .output(z.array(paymentMethodDetailsSchema))
    .query(async ({ ctx, input }) => {
      const { order, payments } = await orderService.getOrderDetailsOrThrow(
        input.orderId,
      );

      if (order.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this order',
        });
      }
      if (!payments.length) {
        return [];
      }
      return buildOrderPaymentMethodsDetails(payments) as any;
    }),

  /**
   * Instant buy - single domain purchase without cart
   */
  registerDomainX402: authedOrPublicProcedure
    .meta({
      route: {
        path: '/x402/domain/{normalizedDomainName}',
        method: 'GET',
        tags: ['orders', 'base-route'],
        operationId: 'registerDomainX402',
        summary: 'Instant Register domain With X402',
        description:
          'Purchase a single domain instantly without adding to cart. Validates domain availability, creates payments and order, then starts the order processing workflow.',
      },
    })
    .input(registerDomainX402InputSchema)
    .output(x402PurchaseResponseSchema)
    .query(async ({ ctx, input }) => {
      ensureX402ConfiguredOrThrow();

      const validation = await validateDomainForInstantPurchase({
        normalizedDomainName: input.normalizedDomainName,
        durationInYears: input.durationInYears,
        user: ctx.user
          ? { id: ctx.user.id, privyUserId: ctx.user.privyUserId }
          : undefined,
      });

      if (!validation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: validation.error || 'Domain not available for purchase',
        });
      }

      const paymentSignature = getX402PaymentSignatureHeader(
        ctx.req.header.bind(ctx.req),
      );

      if (!paymentSignature) {
        return await throwX402PaymentRequired({
          ctx,
          normalizedDomainName: input.normalizedDomainName,
          durationInYears: input.durationInYears,
          priceInUsdCents: validation.priceInUsdCents,
          nftReceivingWalletAddress: input.nftReceivingWalletAddress,
        });
      }

      const receiverWalletAddress = config.X402_SIGNER_ADDRESS;
      if (!receiverWalletAddress) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'x402 payment not configured',
        });
      }

      let paymentPayload: ReturnType<typeof decodeX402PaymentSignaturePayload>;
      let paymentRequirement: Awaited<
        ReturnType<typeof buildX402PaymentRequirements>
      >['paymentRequirement'];
      try {
        paymentPayload = decodeX402PaymentSignaturePayload(paymentSignature);
        ({ paymentRequirement } = await buildX402PaymentRequirements({
          amountInUsdCents: validation.priceInUsdCents,
          context: ctx.req,
        }));
        const verifyRes = await verifyX402PaymentSignature({
          paymentPayload,
          paymentRequirement,
        });

        if (!verifyRes?.isValid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: resolveX402ErrorMessage(verifyRes?.invalidReason),
            cause: {
              name: 'VerifyX402Error',
              data: verifyRes,
            },
          });
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid payment signature format',
          cause: error,
        });
      }

      const buyerWallet = extractBuyerWallet(paymentPayload);
      if (!buyerWallet) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Could not determine buyer wallet from payment',
        });
      }

      // Recover the actual signer address from the EIP-3009 payment signature
      const signerWallet = await recoverX402SignerWallet(paymentPayload);

      const existingPurchase = await db.query.x402PurchasesTable.findFirst({
        where: eq(
          x402PurchasesTable.normalizedDomainName,
          input.normalizedDomainName,
        ),
      });

      if (
        existingPurchase &&
        ['PENDING_VERIFICATION', 'VERIFIED', 'PROCESSING', 'SETTLING'].includes(
          existingPurchase.status,
        )
      ) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A purchase is already in progress for this domain',
        });
      }

      let paymentNonce: string;
      try {
        paymentNonce = extractX402PaymentNonce(paymentPayload);
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payment nonce is missing',
          cause: error,
        });
      }

      const { paymentPayload: encryptedSignaturePaymentPayload } =
        encryptX402PaymentPayloadSignature({
          paymentPayload,
          privateKey: resolveX402PaymentPayloadEncryptionPrivateKey(),
        });

      const [purchase] = await db
        .insert(x402PurchasesTable)
        .values({
          normalizedDomainName: input.normalizedDomainName,
          amountInUSDCents: validation.priceInUsdCents,
          buyerWalletAddress: buyerWallet,
          signerWalletAddress: signerWallet,
          nftReceivingWalletAddress: input.nftReceivingWalletAddress,
          network: config.X402_NETWORK,
          durationInYears: input.durationInYears,
          status: 'PENDING_VERIFICATION',
          paymentPayload: encryptedSignaturePaymentPayload,
          paymentNonce,
        })
        .returning();

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
              signerWalletAddress: purchase.signerWalletAddress ?? undefined,
              nftReceivingWalletAddress: purchase.nftReceivingWalletAddress
                ? checksumWalletAddressSchema.parse(
                    purchase.nftReceivingWalletAddress,
                  )
                : undefined,
              receiverWalletAddress,
              durationInYears: purchase.durationInYears,
              network: purchase.network,
              normalizedDomainName: purchase.normalizedDomainName,
            },
          ],
        },
      );

      let settledPayment: Awaited<ReturnType<typeof settleX402Payment>>;
      try {
        settledPayment = await settleX402Payment({
          paymentPayload,
          paymentRequirement,
        });

        if (!settledPayment?.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: resolveX402ErrorMessage(settledPayment?.errorReason),
          });
        }

        await workflow.signal(settlementSignal, {
          settledAt: new Date().toISOString(),
          settlementTxHash: settledPayment.transaction,
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid payment signature format',
          cause: error,
        });
      }

      X402_PAYMENT_RESPONSE_HEADERS.forEach((header) => {
        ctx.honoCtx?.header(header, encodeX402PaymentResponse(settledPayment));
      });

      return {
        status: 'accepted' as const,
        message: 'Payment accepted, processing domain registration',
        purchaseId: purchase.id,
        domain: input.normalizedDomainName,
        buyerWallet: checksumWalletAddressSchema.parse(buyerWallet),
        nftReceivingWalletAddress:
          input.nftReceivingWalletAddress ??
          checksumWalletAddressSchema.parse(buyerWallet),
        estimatedCompletionSeconds: 60,
      };
    }),

  registerDomainMPP: authedOrPublicProcedure
    .meta({
      route: {
        path: '/mpp/domain/{normalizedDomainName}',
        method: 'GET',
        tags: ['orders', 'base-route'],
        operationId: 'registerDomainMPP',
        summary: 'Instant Register domain With MPP',
        description:
          'Purchase a single domain instantly with MPP using Tempo or Stripe.',
      },
    })
    .input(registerDomainMppInputSchema)
    .output(mppPurchaseResponseSchema)
    .query(async ({ ctx, input }) => {
      try {
        const paymentResult = await getRegisterDomainMppPaymentResult({
          durationInYears: input.durationInYears,
          nftReceivingWalletAddress: input.nftReceivingWalletAddress,
          normalizedDomainName: input.normalizedDomainName,
          request: (ctx.req as any).raw ?? ctx.req,
        });

        if (paymentResult.status === 'payment_required') {
          for (const [
            header,
            value,
          ] of paymentResult.challenge.headers.entries()) {
            ctx.honoCtx?.header(header, value);
          }

          throw new TRPCError({
            code: 'PAYMENT_REQUIRED',
            message: 'Payment Required',
            cause: getMppPaymentRequiredError({
              challenge: paymentResult.challenge,
              metadata: getMppResourceMetadata({
                durationInYears: input.durationInYears,
                normalizedDomainName: input.normalizedDomainName,
                nftReceivingWalletAddress: input.nftReceivingWalletAddress,
                priceInUsdCents: paymentResult.priceInUsdCents,
              }),
            }),
          });
        }

        return createMppInstantRegistration({
          credential: paymentResult.credential,
          durationInYears: input.durationInYears,
          nftReceivingWalletAddress: input.nftReceivingWalletAddress,
          normalizedDomainName: input.normalizedDomainName,
          receipt: paymentResult.receipt,
          user: ctx.user
            ? { id: ctx.user.id, privyUserId: ctx.user.privyUserId }
            : undefined,
          validation: paymentResult.validation,
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        if (
          error instanceof Error &&
          error.message === 'A purchase is already in progress for this domain'
        ) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          });
        }

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            error instanceof Error
              ? error.message
              : 'MPP payment verification failed',
          cause: error,
        });
      }
    }),

  /**
   * Get order details by ID
   */
  getDomainsAvailableForTrial: authedOrPublicProcedure
    .meta({
      route: {
        path: '/trial/domains/available',
        method: 'GET',
        tags: ['orders'],
        operationId: 'getDomainsAvailableForTrial',
        summary: 'Get Domains Available for Trial',
        description:
          'Retrieve a list of domains or parent domains(ie; their subdomains are available for trial)',
      },
    })
    .input(z.any())
    .output(
      z.array(
        z.object({
          normalizedDomainName: z.string(),
          type: z.enum(['PARENT_DOMAIN', 'EXACT_DOMAIN']),
          trialDuration: z.number(),
          trialDurationUnit: z.enum(['days', 'years']),
        }),
      ),
    )
    .query(() => {
      return [
        {
          normalizedDomainName: '0x.city',
          type: 'PARENT_DOMAIN',
          trialDuration: config.ZERO_PAYMENT_REGISTRATION_TRIAL_DAYS,
          trialDurationUnit: 'days',
        },
      ];
    }),
});
