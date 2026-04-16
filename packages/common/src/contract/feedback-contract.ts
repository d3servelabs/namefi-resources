import { z } from 'zod';

import type { RouterContract } from './trpc-contract';

/**
 * Contract for the feedback router.
 *
 * The router (`apps/backend/src/trpc/routers/feedbackRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof feedbackContract>`. Note that `submit`
 * is `publicProcedure` (anonymous users can leave feedback) while
 * `claimAnonymous` is `protectedProcedure` — those middleware choices
 * stay at the router file, the contract only pins IO shapes.
 */

// ---------------------------------------------------------------------------
// submit
// ---------------------------------------------------------------------------

const submitInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(1).max(2000).optional(),
  feedbackId: z.string().uuid().optional(),
  path: z.string().optional(),
});

// The backend returns the subset of `feedbackResponsesTable` columns below
// (see `submit` handler in the router). Modeled inline so the contract
// does not need a drizzle import just for this tiny shape.
const feedbackResponseOutputSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  rating: z.number(),
  message: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// claimAnonymous
// ---------------------------------------------------------------------------

const claimAnonymousInputSchema = z.object({
  feedbackIds: z.array(z.string().uuid()).min(1),
});

const claimAnonymousOutputSchema = z.object({
  updated: z.array(feedbackResponseOutputSchema),
  ipAddress: z.string(),
});

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const feedbackContract = {
  submit: {
    type: 'mutation',
    input: submitInputSchema,
    output: feedbackResponseOutputSchema,
  },
  claimAnonymous: {
    type: 'mutation',
    input: claimAnonymousInputSchema,
    output: claimAnonymousOutputSchema,
  },
} as const satisfies RouterContract;

export type FeedbackContract = typeof feedbackContract;
