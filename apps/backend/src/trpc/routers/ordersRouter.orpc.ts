import {
  type PaymentSelect,
  type PostProcessOrderItem,
  db,
  isNfscPayment,
  orderItemsTable,
  ordersTable,
  orderSelectSchema,
  orderItemSelectSchema,
  paymentSelectSchema,
  userSelectSchema,
  cartItemsTable,
} from '@namefi-astra/db';
import {
  checksumWalletAddressSchema,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { recordTypeEnum } from '@namefi-astra/zod-dns';
import { TRPCError } from '@trpc/server';
import { and, desc, eq, getTableColumns, ilike } from 'drizzle-orm';
import { isNil, isNotNil, pluck, sum } from 'ramda';
import Stripe from 'stripe';
import { z } from 'zod';
import pMap from 'p-map';
import {
  orderService,
  type CreateOrderItemInput,
} from '../../services/orders/orders.service';
import {
  createPayment,
  determineAvailablePaymentMethods,
} from '../../temporal/activities/payment.activities';
import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import { processOrderWorkflow } from '../../temporal/workflows/processOrder.workflow';
import type { ChargeUserWorkflowInput } from '../../temporal/workflows/chargeUser.workflow';
import { resolve } from '../../utils/resolve';
import { createTRPCRouter, protectedProcedure, withAudit } from '../base';
import { validateDomainForInstantPurchaseOrThrow } from '../../lib/instant-buy';
import { itemTypeSchema } from '@namefi-astra/db/types';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '../utils';
import { secrets } from '../../lib/env';
import { logger } from '#lib/logger';
import { config } from '#lib/env';
import { determinePayments, getUserChainBalances } from '../../lib/payments';
import { getChain, CHAINS as chains } from '@namefi-astra/utils';
import { gaEventOrderPlaced } from '#lib/tracking/checkout/events';
import { defaultEip712SchemaConverter } from '#lib/eip712/orpc-eip712-schema-converter';
import { getEip712MetaFromZodSchema } from '#lib/eip712/orpc-meta-from-zod-schemas';

const stripe = new Stripe(secrets.STRIPE_SECRET_KEY);

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

const paymentMethodDetailsSchema = z.union([
  paymentMethodDetailsOnChainSchema,
  paymentMethodDetailsOffChainSchema,
]);

type PaymentMethodDetails = z.infer<typeof paymentMethodDetailsSchema>;

export const instantBuyInputSchema = z
  .object({
    normalizedDomainName: namefiNormalizedDomainSchema,
    durationInYears: z.number().int().min(1).max(10).default(1),
    nftReceivinggWallet: z
      .object({
        walletAddress: checksumWalletAddressSchema,
        chainId: z.number().refine(
          (chainId) => {
            const allowedChains = config.ALLOWED_CHAINS;
            return allowedChains.includes(chainId);
          },
          {
            message: 'Chain ID provided is not allowed',
            path: ['nftReceivinggWallet', 'chainId'],
          },
        ),
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

export const instantBuyDefaultWalletInputSchema = z
  .object({
    normalizedDomainName: namefiNormalizedDomainSchema,
    durationInYears: z.number().int().min(1).max(10).default(1),
  })
  .meta({
    name: 'InstantRegisterDomainDefaultWallet',
    eip712: { structName: 'InstantRegisterDomainDefaultWallet' },
  });
defaultEip712SchemaConverter.register(instantBuyDefaultWalletInputSchema);

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
  normalizedDomainName: namefiNormalizedDomainSchema,
  durationInYears: z.number().int().min(1).max(10).default(1),
  records: z.array(postProcessRecordSchema).optional().default([]),
  nftReceivinggWallet: instantBuyInputSchema.shape.nftReceivinggWallet,
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
  gaEventTracking,
}: RegisterDomainWithRecordsInput) => {
  const { normalizedDomainName, durationInYears } = input;

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
  const nftReceivinggWallet = input.nftReceivinggWallet || {
    walletAddress: userWalletAddresses[0],
    chainId: config.ALLOWED_CHAINS.includes(chains.base.id)
      ? chains.base.id
      : config.ALLOWED_CHAINS[0],
  };

  // 4. Get chain balances for user's wallets
  const chainBalances = await getUserChainBalances(userWalletAddresses);

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

  // 6. Create order in transaction
  const order = await db.transaction(async (tx) => {
    // Create payments
    const createdPayments: PaymentSelect[] = [];
    for (const p of payments) {
      const created = await createPayment(
        {
          amountInUsdCents: p.amountInUsdCents,
          paymentProviderDetails: p.paymentProviderDetails,
        },
        { tx },
      );
      createdPayments.push(created);
    }

    // Create order with single item
    const order = await orderService.createOrderWithExistingMultiplePayments(
      {
        amountInUSDCents: validation.priceInUsdCents,
        userId: ctx.user.id,
        paymentIds: createdPayments.map((p) => p.id),
        nftWalletAddress: nftReceivinggWallet.walletAddress,
        nftChainId: nftReceivinggWallet.chainId,
        items: [
          {
            normalizedDomainName,
            amountInUSDCents: validation.priceInUsdCents,
            durationInYears,
            type: itemTypeSchema.enum.REGISTER,
            registrar: validation.registrar,
            metadata: postProcessOrderItem
              ? { postProcessOrderItem }
              : undefined,
          } satisfies CreateOrderItemInput,
        ],
      },
      { tx },
    );

    // Remove from cart if exists (cleanup)
    await tx
      .delete(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.userId, ctx.user.id),
          eq(cartItemsTable.normalizedDomainName, normalizedDomainName),
        ),
      );

    // Build per-payment metadata map (empty for NFSC payments) and start workflow
    const paymentsMetadata: {
      [paymentId: string]: ChargeUserWorkflowInput['metadata'] | undefined;
    } = {};

    try {
      await temporalClient.workflow.start(processOrderWorkflow, {
        args: [
          {
            orderId: order.id,
            paymentsMetadata,
            gaEventTracking,
          },
        ],
        taskQueue: TEMPORAL_QUEUES.DOMAINS,
        workflowId: `process-order-${order.id}`,
      });
    } catch (workflowError) {
      logger.error(
        { error: workflowError },
        'Could not start process order workflow for instant buy',
      );
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Could not initiate the order, please contact support if the issue persists',
      });
    }

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
  });
  if (gaEventTracking?.trackGaEvents) {
    void gaEventOrderPlaced({
      userId: ctx.user.id,
      orderId: order.id,
      amountUsdCents: order.amountInUSDCents,
      itemCount: order.items.length,
      paymentCount: payments.length,
      orderSource: 'instant_buy',
    });
  } else {
    logger.info(
      {
        orderId: order.id,
        userId: ctx.user.id,
        gaEventTracking,
      },
      'Skipping GA order_placed event because tracking is disabled',
    );
  }
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
      const items = await db
        .select({
          ...getTableColumns(orderItemsTable),
        })
        .from(orderItemsTable)
        .leftJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
        .where(
          and(
            eq(ordersTable.userId, user.id),
            isNotNil(poweredByNamefiDomain)
              ? ilike(
                  orderItemsTable.normalizedDomainName,
                  `%.${poweredByNamefiDomain}`,
                )
              : undefined,
          ),
        )
        .orderBy(desc(ordersTable.createdAt));

      return items;
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
    .meta({
      ...getEip712MetaFromZodSchema([
        instantBuyInputSchema,
        instantBuyDefaultWalletInputSchema,
      ]),
      route: {
        path: '/orders/register-domain',
        method: 'POST',
        tags: ['orders', 'EIP712'],
        operationId: 'registerDomain',
        summary: 'Instant Register domain',
        description:
          'Purchase a single domain instantly without adding to cart. Validates domain availability, creates payments and order, then starts the order processing workflow.',
      },
    })
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
          nftReceivinggWallet: input.nftReceivinggWallet,
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
    .query(async ({ ctx, input }): Promise<PaymentMethodDetails[]> => {
      const { user } = ctx;
      const { orderId } = input;

      const { order, payments } =
        await orderService.getOrderDetailsOrThrow(orderId);

      if (order.userId !== user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to access this order',
        });
      }
      if (!payments.length) {
        return [];
      }
      const res = await pMap(
        payments,
        async (payment): Promise<PaymentMethodDetails> => {
          if (isNfscPayment(payment)) {
            return {
              paymentId: payment.id,
              isOnChainPayment: true,
              txHash: payment.paymentProviderReferenceId,
              chainId: payment.nfscPaymentDetails.chainId,
              walletAddress: payment.nfscPaymentDetails.walletAddress,
            };
          }

          if (isNil(payment.paymentProviderReferenceId)) {
            return {
              paymentId: payment.id,
              isOnChainPayment: false,
              brand: undefined,
              last4: undefined,
            };
          }

          const stripePaymentIntent = await stripe.paymentIntents.retrieve(
            payment.paymentProviderReferenceId,
            { expand: ['payment_method'] },
          );

          if (isNil(stripePaymentIntent.payment_method)) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message:
                'payment information missing, Namefi Payment ID: ' +
                payment.id +
                ' Stripe Payment Intent ID: ' +
                payment.paymentProviderReferenceId,
            });
          }

          const paymentMethod =
            stripePaymentIntent.payment_method as Stripe.PaymentMethod;

          return {
            paymentId: payment.id,
            isOnChainPayment: false,
            brand: paymentMethod.card?.brand,
            last4: paymentMethod.card?.last4,
          };
        },
      );

      return res;
    }),
});
