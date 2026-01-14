import {
  type NfscPaymentProviderDetails,
  type PaymentSelect,
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
import { createPayment } from '../../temporal/activities/payment.activities';
import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import { processOrderWorkflow } from '../../temporal/workflows/processOrder.workflow';
import type { ChargeUserWorkflowInput } from '../../temporal/workflows/chargeUser.workflow';
import { resolve } from '../../utils/resolve';
import { createTRPCRouter, protectedProcedure, withAudit } from '../base';
import { instantBuyInputSchema } from '../types';
import { validateDomainForInstantPurchaseOrThrow } from '../../lib/instant-buy';
import { itemTypeSchema } from '@namefi-astra/db/types';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '../utils';
import { secrets } from '../../lib/env';
import { logger } from '#lib/logger';
import { config } from '#lib/env';

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
  instantBuy: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo, result }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'order',
      resourceId: result.id || '',
      action: 'instant_buy',
      extraInput: input,
    }),
  )
    .meta({
      route: {
        path: '/orders/instant-buy',
        method: 'POST',
        tags: ['orders'],
        operationId: 'instantBuy',
        summary: 'Instant buy domain',
        description:
          'Purchase a single domain instantly without adding to cart. Validates domain availability, creates payments and order, then starts the order processing workflow.',
      },
    })
    .input(
      instantBuyInputSchema.superRefine((input, ctx) => {
        if (!input.nftMetadata.nftChainId) {
          ctx.addIssue({
            code: 'custom',
            message: 'NFT chain ID is required',
          });
        }
        if (!config.ALLOWED_CHAINS.includes(input.nftMetadata.nftChainId)) {
          ctx.addIssue({
            code: 'custom',
            message: `NFT chain ID ${input.nftMetadata.nftChainId} is not allowed`,
          });
        }
      }),
    )
    .output(orderOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { normalizedDomainName, durationInYears, payments, nftMetadata } =
        input;

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

      // 3. Validate payments total matches price
      const inputPaymentsTotal = sum(pluck('amountInUsdCents', payments));
      if (inputPaymentsTotal !== validation.priceInUsdCents) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Payments total (${inputPaymentsTotal}) does not match domain price (${validation.priceInUsdCents})`,
        });
      }

      // 4. Validate NFSC wallet addresses are linked to user
      const userWallets = new Set(
        getPrivyUserLinkedEthereumChecksumWalletAddresses({ privyUser }),
      );
      const nfscPayments = payments
        .map((p) => p.paymentProviderDetails)
        .filter((p) => isNfscPayment(p)) as NfscPaymentProviderDetails[];

      for (const p of nfscPayments) {
        const validWalletAddress = checksumWalletAddressSchema.safeParse(
          p.nfscPaymentDetails.walletAddress,
        );
        if (!validWalletAddress.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'NFSC payment walletAddress is not a valid Ethereum wallet address',
          });
        }
        if (!userWallets.has(validWalletAddress.data)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'NFSC payment walletAddress is not linked to the user',
          });
        }
      }

      // 5. Create order in transaction
      return await db.transaction(async (tx) => {
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
        const order =
          await orderService.createOrderWithExistingMultiplePayments(
            {
              amountInUSDCents: validation.priceInUsdCents,
              userId: ctx.user.id,
              paymentIds: createdPayments.map((p) => p.id),
              nftWalletAddress: nftMetadata.nftWalletAddress,
              nftChainId: nftMetadata.nftChainId,
              items: [
                {
                  normalizedDomainName,
                  amountInUSDCents: validation.priceInUsdCents,
                  durationInYears,
                  type: itemTypeSchema.enum.REGISTER,
                  registrar: validation.registrar,
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

        // Build per-payment metadata map and start workflow
        const paymentsMetadata = createdPayments.reduce<{
          [paymentId: string]: ChargeUserWorkflowInput['metadata'] | undefined;
        }>((acc, p, i) => {
          acc[p.id] = payments[i]?.paymentMetadata as
            | ChargeUserWorkflowInput['metadata']
            | undefined;
          return acc;
        }, {});

        try {
          await temporalClient.workflow.start(processOrderWorkflow, {
            args: [
              {
                orderId: order.id,
                paymentsMetadata,
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

        logger.info(
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
