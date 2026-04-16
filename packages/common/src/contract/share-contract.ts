import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import type { RouterContract } from './trpc-contract';

/**
 * Contract for the share router.
 *
 * The router (`apps/backend/src/trpc/routers/shareRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof shareContract>`. The contract knows
 * nothing about authentication or audit middleware — `submitShare` is
 * wrapped in `withAudit(protectedProcedure, ...)` at the call site,
 * `submitShareAnonymous` is `publicProcedure`, and `hasUserShared` is
 * `protectedProcedure`. All of those decisions stay in the router file.
 */

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export const submitShareInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  postUrl: z.string().url('Invalid post URL'),
  sharedUrl: z.string().url('Invalid shared URL'),
  campaignKey: z.string().optional(),
});

export const hasUserSharedInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
});

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

const submitShareOutputSchema = z.object({
  id: z.string(),
  sharedUrl: z.string(),
  success: z.literal(true),
});

const hasUserSharedOutputSchema = z.object({
  hasShared: z.boolean(),
  shareDate: z.date().nullable(),
  sharedUrl: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// The contract
// ---------------------------------------------------------------------------

export const shareContract = {
  submitShare: {
    type: 'mutation',
    input: submitShareInputSchema,
    output: submitShareOutputSchema,
  },

  submitShareAnonymous: {
    type: 'mutation',
    input: submitShareInputSchema,
    output: submitShareOutputSchema,
  },

  hasUserShared: {
    type: 'query',
    input: hasUserSharedInputSchema,
    output: hasUserSharedOutputSchema,
  },
} as const satisfies RouterContract;

export type ShareContract = typeof shareContract;
