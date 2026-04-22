import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import { createContract } from './create-contract';
import {
  poweredByNamefiDomainSchema,
  type PoweredByNamefiDomainSelect,
} from './entity-schemas';
import type { RouterContract } from './trpc-contract';

/**
 * Contract for the powered-by-namefi-owner router.
 *
 * The router (`apps/backend/src/trpc/routers/poweredByNamefiOwnerRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof poweredByNamefiOwnerContract>`. Most
 * procedures are `poweredByNamefiOwnerProcedure`; `isUserAPoweredByNamefiOwner`
 * and `isUserOwnerOf` are `protectedProcedure`. Middleware is decided at
 * the router file — the contract only pins IO shapes.
 */

// ---------------------------------------------------------------------------
// GA date tokens (mirror of `analyticsRouter`'s `gaDateToken`). Duplicated
// rather than reimported so common stays decoupled from other contracts'
// internals.
// ---------------------------------------------------------------------------

const gaDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const gaRelativeDayRegex = /^(today|yesterday|\d+daysAgo)$/;

const gaDateToken = z
  .string()
  .refine((v) => gaDateRegex.test(v) || gaRelativeDayRegex.test(v), {
    message: 'Use YYYY-MM-DD, today, yesterday, or NdaysAgo',
  });

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const isUserOwnerOfInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
});

const getAnalyticsDashboardOverviewInputSchema = z.object({
  startDate: gaDateToken,
  endDate: gaDateToken,
  publicSuffix: z.string().optional(),
  publicSuffixPlusOne: namefiNormalizedDomainSchema,
});

const updateDomainInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  additionalAllowedHostnames: z.array(z.string()).optional(),
  additionalReservedNames: z.array(z.string()).optional(),
  durationConstraints: z
    .object({
      minDurationInYears: z.number().min(1),
      maxDurationInYears: z.number().min(1),
    })
    .optional(),
  costPerYearInUsdCents: z.number().int().nonnegative().optional(),
  enabled: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const orderItemsHistoryInputSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  normalizedDomainName: namefiNormalizedDomainSchema.optional(),
});

const revenueInputSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
  normalizedDomainName: namefiNormalizedDomainSchema.optional(),
  interval: z.enum(['day', 'week', 'month']).default('day'),
});

const revenueByDomainInputSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
});

const reservedWordsDomainInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
});

const reservedWordsMutateInputSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  words: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

/**
 * GA4 `IRunReportResponse` mirror — same reasoning as in
 * `analytics-contract.ts`: bare `z.object({ rows })` lets the proto's
 * nominal shape assign freely while still giving tRPC a real object.
 */
const ga4ReportSchema = z.object({
  rows: z.any().optional(),
});

const analyticsReportBundleSchema = z.object({
  topDomains: ga4ReportSchema,
  queriesByResponseCode: z.any(),
  queriesByType: ga4ReportSchema,
  cacheHitRatio: ga4ReportSchema,
  topClientIps: ga4ReportSchema,
  dnssecStats: z.any(),
  hourlyVolume: ga4ReportSchema,
  dailyVolume: ga4ReportSchema,
  publicSuffix: ga4ReportSchema,
  publicSuffixPlusOne: ga4ReportSchema,
});

/**
 * Paginated order-items history row — large join-flattened shape with
 * drizzle SQL<T> aggregates that widen to `{}` in this workspace. Typed
 * with `z.any()` for rows so the contract stays tractable; the wrapper
 * gives tRPC a real `z.object(...)` to infer through.
 */
const orderItemsHistoryOutputSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.any(),
    totalPages: z.number(),
  }),
});

/**
 * Revenue timeseries output. `totalInUsdCents` comes from a drizzle SUM
 * that widens to `{}` and `points[].amountInUsdCents` is similarly loose;
 * `z.any()` keeps the contract tractable.
 */
const revenueOutputSchema = z.object({
  totalInUsdCents: z.any(),
  points: z.array(z.any()),
});

const revenueByDomainOutputSchema = z.object({
  totalInUsdCents: z.any(),
  byDomain: z.array(z.any()),
});

const getReservedWordsOutputSchema = z.object({
  fixedReservedWords: z.array(z.string()),
  editableReservedWords: z.array(z.string()).nullable(),
});

const validateReservedWordsOutputSchema = z.object({
  validationResults: z.array(
    z.object({
      word: z.string(),
      isValid: z.boolean(),
      reason: z.string().nullable(),
    }),
  ),
});

const addReservedWordsOutputSchema = z.object({
  success: z.boolean(),
  addedWords: z.array(z.string()),
});

const removeReservedWordsOutputSchema = z.object({
  success: z.boolean(),
  removedWords: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const poweredByNamefiOwnerContract = createContract(
  { softOutput: true },
  {
    isUserAPoweredByNamefiOwner: {
      type: 'query',
      input: z.void(),
      output: z.object({ isOwner: z.boolean() }),
    },
    isUserOwnerOf: {
      type: 'query',
      input: isUserOwnerOfInputSchema,
      output: z.object({ isOwner: z.boolean() }),
    },
    getAnalyticsDashboardOverview: {
      type: 'query',
      input: getAnalyticsDashboardOverviewInputSchema,
      output: analyticsReportBundleSchema,
    },
    listOwnedDomains: {
      type: 'query',
      input: z.void(),
      output: z.array(poweredByNamefiDomainSchema),
    },
    updateDomain: {
      type: 'mutation',
      input: updateDomainInputSchema,
      output: poweredByNamefiDomainSchema.nullable(),
    },
    orderItemsHistory: {
      type: 'query',
      input: orderItemsHistoryInputSchema,
      output: orderItemsHistoryOutputSchema,
    },
    revenue: {
      type: 'query',
      input: revenueInputSchema,
      output: revenueOutputSchema,
    },
    revenueByDomain: {
      type: 'query',
      input: revenueByDomainInputSchema,
      output: revenueByDomainOutputSchema,
    },
    getReservedWords: {
      type: 'query',
      input: reservedWordsDomainInputSchema,
      output: getReservedWordsOutputSchema,
    },
    validateReservedWords: {
      type: 'query',
      input: reservedWordsMutateInputSchema,
      output: validateReservedWordsOutputSchema,
    },
    addReservedWords: {
      type: 'mutation',
      input: reservedWordsMutateInputSchema,
      output: addReservedWordsOutputSchema,
    },
    removeReservedWords: {
      type: 'mutation',
      input: reservedWordsMutateInputSchema,
      output: removeReservedWordsOutputSchema,
    },
  },
);

export type PoweredByNamefiOwnerContract = typeof poweredByNamefiOwnerContract;
export type { PoweredByNamefiDomainSelect };
