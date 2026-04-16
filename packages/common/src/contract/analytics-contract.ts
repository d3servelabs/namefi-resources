import { z } from 'zod';

import { createContract } from './create-contract';
import type { RouterContract } from './trpc-contract';

/**
 * Contract for the analytics router.
 *
 * The router (`apps/backend/src/trpc/routers/analyticsRouter.ts`) is
 * type-checked against this contract via
 * `createContractTRPCRouter<typeof analyticsContract>`. Every procedure is
 * wrapped in `adminProcedureWithPermissions(Permission.READ_ANALYTICS)`
 * (or `withRequiredPermissions(publicProcedure, [...])` for
 * `getParsedReportByRecordName`) at the router file — the contract does
 * not know or care.
 */

// ---------------------------------------------------------------------------
// Shared date tokens (mirror of `gaDateToken` / `dateRangeSchema` in the
// router file).
// ---------------------------------------------------------------------------

const gaDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const gaRelativeDayRegex = /^(today|yesterday|\d+daysAgo)$/;

const gaDateToken = z
  .string()
  .refine((v) => gaDateRegex.test(v) || gaRelativeDayRegex.test(v), {
    message: 'Use YYYY-MM-DD, today, yesterday, or NdaysAgo',
  });

const dateRangeSchema = z.object({
  startDate: gaDateToken.default('7daysAgo'),
  endDate: gaDateToken.default('today'),
});

// ---------------------------------------------------------------------------
// Per-procedure input schemas
// ---------------------------------------------------------------------------

const getCheckoutFlowOverviewInputSchema = z.object({
  ...dateRangeSchema.shape,
});

const getDashboardOverviewInputSchema = z.object({
  startDate: gaDateToken,
  endDate: gaDateToken,
  publicSuffix: z.string().optional(),
  publicSuffixPlusOne: z.string().optional(),
});

const getByPublicSuffixInputSchema = z.object({
  limit: z.number().min(1).max(1000).default(50),
  ...dateRangeSchema.shape,
});

const getByPublicSuffixPlusOneInputSchema = z.object({
  limit: z.number().min(1).max(1000).default(50),
  ...dateRangeSchema.shape,
});

const getFullReportByRecordNameInputSchema = z.object({
  startDate: gaDateToken,
  endDate: gaDateToken,
  domainName: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Outputs — all backend-only (GA4 IRunReportResponse + parsed analytics
// types). Modeled as `z.custom<unknown>` escape hatches; the TODO marker
// keeps follow-up scope visible.
// ---------------------------------------------------------------------------

/**
 * Structural mirror of GA4 `IRunReportResponse` from
 * `@google-analytics/data/build/protos/protos.d.ts`. We don't import the
 * full type because it pulls in the GA4 proto deps (grpc/protobuf.js) —
 * heavy to ship in common.
 *
 * Declared as a bare `z.object({...})` (no `.passthrough()`) because
 * `IRunReportResponse` is a nominal interface without an index signature,
 * and `passthrough()` adds `[x: string]: unknown` which would reject the
 * assignment. The bare object's width-subtype rule lets
 * `IRunReportResponse` flow in freely — we just lose visibility on the
 * extra fields beyond `rows`, which is the only field frontend code
 * actually reads.
 *
 * It's still a real `z.object(...)` (not `z.custom<T>()`) because tRPC's
 * caller-side type helpers collapse top-level `z.custom<T>` outputs to
 * `() => never` at the `queryOptions(...)` boundary.
 */
const ga4ReportSchema = z.object({
  rows: z.any().optional(),
});

/**
 * Mirror of the `getDashboardOverview` / `getFullReportByRecordName` return
 * shape (multiple GA4 report objects aggregated into one payload).
 */
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
 * Structural mirror of `CheckoutFlowAnalyticsParsed` from
 * `apps/backend/src/lib/tracking/checkout/analytics-types.ts`. Declared
 * as a real `z.object(...)` so tRPC's caller-side type helpers propagate
 * the shape through `queryOptions(...)` cleanly (top-level `z.custom<T>`
 * outputs collapse to `() => never` at the `TRPCOptionsProxy` layer).
 */
const checkoutSankeyNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  count: z.number(),
  eventName: z.string(),
  outcome: z.string().optional(),
});

const checkoutSankeyLinkSchema = z.object({
  source: z.string(),
  target: z.string(),
  value: z.number(),
});

const checkoutSankeyGraphSchema = z.object({
  nodes: z.array(checkoutSankeyNodeSchema),
  links: z.array(checkoutSankeyLinkSchema),
});

const checkoutEventBreakdownSchema = z.object({
  status: z.array(z.object({ status: z.string(), count: z.number() })),
  orderStatus: z.array(
    z.object({ orderStatus: z.string(), count: z.number() }),
  ),
  outcome: z.array(z.object({ outcome: z.string(), count: z.number() })),
});

const checkoutEventParsedSchema = z.object({
  count: z.number(),
  breakdown: checkoutEventBreakdownSchema,
});

const checkoutFlowAnalyticsParsedSchema = z.object({
  summary: z.object({
    beginSearchCount: z.number(),
    orderPlacedCount: z.number(),
    domainAcquisitionFinishedSuccessCount: z.number(),
    refundedCount: z.number(),
    conversionRatePercent: z.number().nullable(),
    completionRatePercent: z.number().nullable(),
  }),
  steps: z.array(
    z.object({
      eventName: z.string(),
      label: z.string(),
      count: z.number(),
      conversionFromPreviousPercent: z.number().nullable(),
      dropoffFromPreviousCount: z.number().nullable(),
    }),
  ),
  funnel: z.array(
    z.object({
      eventName: z.string(),
      label: z.string(),
      value: z.number(),
    }),
  ),
  sankey: checkoutSankeyGraphSchema,
  sankeyDomainAcquisition: checkoutSankeyGraphSchema,
  sankeyCheckout: checkoutSankeyGraphSchema,
  // `eventCountsByName` and `events` are typed nominally on the backend
  // as `Record<CheckoutFlowEventName, ...>` which uses a literal-union
  // key and has no index signature, so `z.record(z.string(), ...)` would
  // reject them. `z.any()` keeps the shape opaque at this level and
  // consumers still see the structural nested types elsewhere.
  eventCountsByName: z.any(),
  events: z.any(),
});

// TODO(contract): replace with a structural schema for DnsAnalyticsParsed.
const dnsAnalyticsParsedSchema = z.custom<unknown>(() => true);

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const analyticsContract = createContract(
  { softOutput: true },
  {
    getDashboardOverview: {
      type: 'query',
      input: getDashboardOverviewInputSchema,
      output: analyticsReportBundleSchema,
    },
    getCheckoutFlowOverview: {
      type: 'query',
      input: getCheckoutFlowOverviewInputSchema,
      output: checkoutFlowAnalyticsParsedSchema,
    },
    getByPublicSuffix: {
      type: 'query',
      input: getByPublicSuffixInputSchema,
      output: ga4ReportSchema,
    },
    getByPublicSuffixPlusOne: {
      type: 'query',
      input: getByPublicSuffixPlusOneInputSchema,
      output: ga4ReportSchema,
    },
    getFullReportByRecordName: {
      type: 'query',
      input: getFullReportByRecordNameInputSchema,
      output: analyticsReportBundleSchema,
    },
    getParsedReportByRecordName: {
      type: 'query',
      input: getFullReportByRecordNameInputSchema,
      output: dnsAnalyticsParsedSchema,
    },
  },
);

export type AnalyticsContract = typeof analyticsContract;
