import { z } from 'zod';

import type { RouterContract } from './trpc-contract';

/**
 * Contract for the newsletter router.
 *
 * The router (`apps/backend/src/trpc/routers/newsletterRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof newsletterContract>`. The Altcha check
 * stays in the handler body — the contract just declares the field so it
 * flows through on the wire.
 */

const subscribeInputSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().optional(),
  /**
   * Source/origin of the subscription (e.g., `'namefi-home'`,
   * `'namefi-park'`, `'newsletter-page'`).
   */
  from: z.string().min(1, 'Source is required'),
  /**
   * Additional custom attributes to store with the subscriber.
   */
  attributes: z.record(z.string(), z.unknown()).optional(),
  altcha: z.string().optional().nullable(),
});

const subscribeOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const newsletterContract = {
  subscribe: {
    type: 'mutation',
    input: subscribeInputSchema,
    output: subscribeOutputSchema,
  },
} as const satisfies RouterContract;

export type NewsletterContract = typeof newsletterContract;
