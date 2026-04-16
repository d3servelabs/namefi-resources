import { z } from 'zod';

import type { RouterContract } from './trpc-contract';

/**
 * Contract for the payments router (Stripe customer / setup intent /
 * payment method management).
 *
 * The router (`apps/backend/src/trpc/routers/paymentsRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof paymentsContract>`. `deletePaymentMethod`
 * is wrapped in `withAudit(protectedProcedure, ...)` at the router file —
 * the contract doesn't need to know.
 */

const createCustomerSessionOutputSchema = z.object({
  customerSessionClientSecret: z.string(),
});

const createSetupIntentOutputSchema = z.object({
  setupIntentClientSecret: z.string().nullable(),
  customerSessionClientSecret: z.string(),
});

const deletePaymentMethodInputSchema = z.object({
  paymentMethodId: z.string(),
});

const deletePaymentMethodOutputSchema = z.object({
  isSuccess: z.boolean(),
});

/**
 * Card details surfaced by `getPaymentMethods`. Modeled inline because the
 * shape is a narrow subset of Stripe's `PaymentMethod` and we don't want
 * to pull `stripe` types into common.
 */
const paymentMethodCardSchema = z.object({
  id: z.string(),
  brand: z.string().optional(),
  last4: z.string().optional(),
  exp_month: z.number().optional(),
  exp_year: z.number().optional(),
  fingerprint: z.string().nullable().optional(),
});

const getPaymentMethodsOutputSchema = z.array(paymentMethodCardSchema);

export const paymentsContract = {
  createCustomerSession: {
    type: 'mutation',
    input: z.void(),
    output: createCustomerSessionOutputSchema,
  },
  createSetupIntent: {
    type: 'mutation',
    input: z.void(),
    output: createSetupIntentOutputSchema,
  },
  deletePaymentMethod: {
    type: 'mutation',
    input: deletePaymentMethodInputSchema,
    output: deletePaymentMethodOutputSchema,
  },
  getPaymentMethods: {
    type: 'query',
    input: z.void(),
    output: getPaymentMethodsOutputSchema,
  },
} as const satisfies RouterContract;

export type PaymentsContract = typeof paymentsContract;
