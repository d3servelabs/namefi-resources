import { z } from 'zod';

import {
  createOrderInputSchema as baseCreateOrderInputSchema,
  paymentMetadataSchema,
} from '../order-input';
import { paymentProviderDetailsSchema } from '../payment-provider';
import type {
  CreatedNfscOrder,
  CreatedOrder,
  NfscOrderItemForUser,
  OrderItemsForUser,
  OrderProgressPayload,
  OrderWithPayments,
  PaymentMethodDetails,
  PaymentRefundEntry,
  ReflectCartChangesSummary,
} from '../orders-shared-types';
import { orderStatusSchema } from '../shared-schemas';
import { createContract } from './create-contract';
import type { RouterContract } from './trpc-contract';

/**
 * Contract for the orders router.
 *
 * Every procedure has a `type` of `'query'` or `'mutation'` and explicit
 * input/output zod schemas. The router implementation (in
 * `apps/backend/src/trpc/routers/ordersRouter.ts`) is type-checked against
 * this contract via `createContractTRPCRouter<typeof ordersContract>`.
 *
 * The contract deliberately knows nothing about authentication, audit
 * logging or any other middleware — those are decided at the
 * procedure-definition site in the router file.
 *
 * Output schemas use `z.custom<T>()` for the complex aggregated shapes
 * (orders, payment methods, refunds, etc.). The `T` types live in
 * `./orders-shared-types.ts` so the contract still flows full type
 * information through to the frontend even though the schemas themselves
 * don't validate the structure at runtime. Each `z.custom` site is marked
 * with `TODO(contract)` so the follow-up scope (replacing them with full
 * structural schemas) is greppable.
 *
 * The schemas defined inside this file (`createOrderInputSchema`,
 * `createOrderV2InputSchema`, `instantBuyInputSchema`) used to live in
 * `apps/backend/src/trpc/types.ts`. They moved here so frontend consumers
 * can reuse the exact same input schemas instead of duplicating them.
 */

// ---------------------------------------------------------------------------
// Cross-shared input building blocks (lifted from
// `apps/backend/src/trpc/types.ts` so the contract can own them)
// ---------------------------------------------------------------------------

import {
  checksumWalletAddressSchema,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';

export const createOrderInputSchema = baseCreateOrderInputSchema.extend({
  paymentProviderDetails: paymentProviderDetailsSchema,
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

const nftMetadataSchema = z.object({
  nftWalletAddress: checksumWalletAddressSchema,
  nftChainId: z.number().refine(
    (chainId) => {
      // The runtime allow-list is enforced server-side via
      // `getAllowedChainsForNft(...)`; we keep this static fallback here so
      // accidentally-zero values get caught at parse time.
      const allowedChains = [1, 11155111, 8453, 46630];
      return allowedChains.includes(chainId);
    },
    {
      message: 'Chain ID provided is not allowed',
      path: ['nftChainId'],
    },
  ),
});

export const createOrderV2InputSchema = z.object({
  cartItemIds: z.array(z.string()).min(1, 'At least one cart item is required'),
  payments: z
    .array(
      z.object({
        amountInUsdCents: z.union([
          z.number().int().positive('Payment amount must be positive'),
          z.literal(0),
        ]),
        paymentProviderDetails: paymentProviderDetailsSchema,
        paymentMetadata: paymentMetadataSchema.optional(),
      }),
    )
    .min(1)
    .transform((payments) => payments.filter((p) => p.amountInUsdCents > 0))
    .superRefine((payments, ctx) => {
      for (const [idx, p] of payments.entries()) {
        const provider = (p.paymentProviderDetails as any)?.paymentProvider;
        // Enforce Stripe minimum $1.00
        if (typeof provider === 'string' && provider === 'STRIPE') {
          if (p.amountInUsdCents < 100) {
            ctx.addIssue({
              code: 'too_small',
              origin: 'number',
              minimum: 100,
              type: 'number',
              inclusive: true,
              path: [idx, 'amountInUsdCents'],
              message: 'Stripe charge must be at least 100 cents',
            });
          }
        }
      }
    }),
  nftMetadata: nftMetadataSchema,
});

export type CreateOrderV2Input = z.infer<typeof createOrderV2InputSchema>;

const paymentsArraySchema = z
  .array(
    z.object({
      amountInUsdCents: z
        .number()
        .int()
        .nonnegative('Payment amount must be non-negative'),
      paymentProviderDetails: paymentProviderDetailsSchema,
      paymentMetadata: paymentMetadataSchema.optional(),
    }),
  )
  .min(1)
  .superRefine((payments, ctx) => {
    for (const [idx, p] of payments.entries()) {
      const provider = (p.paymentProviderDetails as any)?.paymentProvider;
      // Enforce Stripe minimum $1.00 (only if amount > 0)
      if (typeof provider === 'string' && provider === 'STRIPE') {
        if (p.amountInUsdCents > 0 && p.amountInUsdCents < 100) {
          ctx.addIssue({
            code: 'too_small',
            origin: 'number',
            minimum: 100,
            type: 'number',
            inclusive: true,
            path: [idx, 'amountInUsdCents'],
            message: 'Stripe charge must be at least 100 cents',
          });
        }
      }
    }
  });

export const instantBuyInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  durationInYears: z.number().int().min(1).max(10).default(1),
  payments: paymentsArraySchema,
  nftMetadata: nftMetadataSchema,
});

export type InstantBuyInput = z.infer<typeof instantBuyInputSchema>;

/**
 * Input for `buyNfsc` — an immediate, single-item NFSC top-up order paid with
 * a non-NFSC method. Rate is fixed at 1 USD = 1 NFSC, so `amountInUsdCents`
 * is both the amount charged and (÷100) the NFSC amount credited.
 */
export const buyNfscInputSchema = z.object({
  amountInUsdCents: z.number().int().positive(),
  payments: paymentsArraySchema,
  recipient: z.object({
    recipientWalletAddress: checksumWalletAddressSchema,
    nfscChainId: z.number().refine(
      (chainId) => {
        // Runtime allow-list is enforced server-side; this static fallback
        // catches obviously-invalid values at parse time.
        const allowedChains = [1, 11155111, 8453];
        return allowedChains.includes(chainId);
      },
      {
        message: 'Chain ID provided is not allowed for NFSC top-up',
        path: ['nfscChainId'],
      },
    ),
  }),
});

export type BuyNfscInput = z.infer<typeof buyNfscInputSchema>;

// ---------------------------------------------------------------------------
// Per-procedure input schemas
// ---------------------------------------------------------------------------

const orderIdInputSchema = z.object({ orderId: z.string() });

const orderItemActionInputSchema = z.object({
  orderId: z.string().min(1),
  orderItemId: z.string().min(1),
});

const updateImportAuthCodeInputSchema = orderItemActionInputSchema.extend({
  eppAuthorizationCode: z.string().min(1),
});

const orderProgressInputSchema = z.object({
  orderId: z.string().min(1),
});

/**
 * Input for `getMyNfscOrders` — all filters are optional and AND-combined.
 * The result is always scoped to `ctx.user.id` server-side.
 */
const getMyNfscOrdersInputSchema = z.object({
  recipientWalletAddress: z.string().optional(),
  chainId: z.number().int().optional(),
  statuses: z.array(orderStatusSchema).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

const paymentIdInputSchema = z.object({ paymentId: z.string() });

const refreshCartItemsInputSchema = z.object({
  cartItemIds: z.array(z.string()).optional(),
});

// `createOrderV2` and `instantBuy` add a `superRefine` that asserts the chain
// ID is present. Keeping the refine in the contract makes the contract the
// authoritative input definition.
const createOrderV2ContractInputSchema = createOrderV2InputSchema.superRefine(
  (input, ctx) => {
    if (!input.nftMetadata.nftChainId) {
      ctx.addIssue({ code: 'custom', message: 'NFT chain ID is required' });
    }
  },
);

const instantBuyContractInputSchema = instantBuyInputSchema.superRefine(
  (input, ctx) => {
    if (!input.nftMetadata.nftChainId) {
      ctx.addIssue({ code: 'custom', message: 'NFT chain ID is required' });
    }
    // Note: the chain-vs-domain allow-list check stays in the router handler
    // because it depends on `getAllowedChainsForNftByDomainNames`, which is
    // a server-only runtime call. Refining here would force the contract to
    // depend on backend code.
  },
);

// `buyNfsc` additionally rejects NFSC payment providers — an NFSC top-up
// cannot be paid for with NFSC. The service layer re-checks this.
const buyNfscContractInputSchema = buyNfscInputSchema.superRefine(
  (input, ctx) => {
    for (const [idx, p] of input.payments.entries()) {
      const provider = (
        p.paymentProviderDetails as { paymentProvider?: string }
      )?.paymentProvider;
      if (typeof provider === 'string' && provider.startsWith('NFSC_')) {
        ctx.addIssue({
          code: 'custom',
          path: ['payments', idx, 'paymentProviderDetails', 'paymentProvider'],
          message: 'NFSC top-up cannot be paid with NFSC',
        });
      }
    }
  },
);

// `getOrderItems` is the only procedure that takes no input — model that as
// `z.void()` so the contract type stays uniform and the wire shape stays
// `undefined`.
const noInputSchema = z.void();

// ---------------------------------------------------------------------------
// Output schemas
// ---------------------------------------------------------------------------

const successAckSchema = z.object({ success: z.literal(true) });

// TODO(contract): replace with structural schema derived from drizzle-zod
const createdOrderSchema = z.custom<CreatedOrder>(() => true);

// TODO(contract): replace with structural schema derived from drizzle-zod
const createdNfscOrderSchema = z.custom<CreatedNfscOrder>(() => true);

// TODO(contract): replace with structural schema for OrderWithPayments
const orderDetailsSchema = z.custom<OrderWithPayments>(() => true);

// TODO(contract): replace with structural schema for getOrderItemsForUser rows
const orderItemsForUserSchema = z.custom<OrderItemsForUser>(() => true);

// TODO(contract): replace with structural schema for getNfscOrderItemsForUser rows
const nfscOrderItemsForUserSchema = z.custom<NfscOrderItemForUser[]>(
  () => true,
);

// TODO(contract): replace with structural schema for OrderProgressPayload
const orderProgressPayloadSchema = z.custom<OrderProgressPayload>(() => true);

// TODO(contract): replace with structural schema for PaymentMethodDetails
const paymentMethodDetailsSchema = z.custom<PaymentMethodDetails>(() => true);

const paymentMethodDetailsArraySchema = z.array(paymentMethodDetailsSchema);

// TODO(contract): replace with structural schema for refund rows
const paymentRefundsArraySchema = z.array(
  z.custom<PaymentRefundEntry>(() => true),
);

// TODO(contract): replace with structural schema for cart-change summary
const reflectCartChangesSummarySchema = z.custom<ReflectCartChangesSummary>(
  () => true,
);

// ---------------------------------------------------------------------------
// The contract
// ---------------------------------------------------------------------------

export const ordersContract = createContract(
  { softOutput: true },
  {
    createOrder: {
      type: 'mutation',
      input: createOrderInputSchema,
      output: createdOrderSchema,
    },

    getOrder: {
      type: 'query',
      input: orderIdInputSchema,
      output: orderDetailsSchema,
    },

    updateImportAuthCode: {
      type: 'mutation',
      input: updateImportAuthCodeInputSchema,
      output: successAckSchema,
    },

    cancelRequiredActionOrderItem: {
      type: 'mutation',
      input: orderItemActionInputSchema,
      output: successAckSchema,
    },

    confirmDomainUnlocked: {
      type: 'mutation',
      input: orderItemActionInputSchema,
      output: successAckSchema,
    },

    getOrderItems: {
      type: 'query',
      input: noInputSchema,
      output: orderItemsForUserSchema,
    },

    getOrderProgress: {
      type: 'query',
      input: orderProgressInputSchema,
      output: orderProgressPayloadSchema,
    },

    createOrderV2: {
      type: 'mutation',
      input: createOrderV2ContractInputSchema,
      output: createdOrderSchema,
    },

    instantBuy: {
      type: 'mutation',
      input: instantBuyContractInputSchema,
      output: createdOrderSchema,
    },

    buyNfsc: {
      type: 'mutation',
      input: buyNfscContractInputSchema,
      output: createdNfscOrderSchema,
    },

    getMyNfscOrders: {
      type: 'query',
      input: getMyNfscOrdersInputSchema,
      output: nfscOrderItemsForUserSchema,
    },

    getOrderPaymentMethodsDetails: {
      type: 'query',
      input: orderIdInputSchema,
      output: paymentMethodDetailsArraySchema,
    },

    getPaymentMethodDetails: {
      type: 'query',
      input: paymentIdInputSchema,
      output: paymentMethodDetailsSchema,
    },

    getPaymentRefunds: {
      type: 'query',
      input: paymentIdInputSchema,
      output: paymentRefundsArraySchema,
    },

    reflectChangesInCartItemsIfAnyAndReturnSummary: {
      type: 'mutation',
      input: refreshCartItemsInputSchema,
      output: reflectCartChangesSummarySchema,
    },
  },
);

export type OrdersContract = typeof ordersContract;
