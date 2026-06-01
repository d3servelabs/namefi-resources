import { z } from 'zod';

import { createContract } from '../create-contract';

const nullableIsoDateSchema = z.string().nullable();

export const adminNamefiFeedSettingsSchema = z.object({
  autoScanEnabled: z.boolean(),
  searchQueries: z.array(z.string()),
  maxQueries: z.number().int().positive(),
  maxPagesPerQuery: z.number().int().positive(),
  maxTweetsPerQuery: z.number().int().positive(),
  maxTweetAgeMinutes: z.number().int().positive(),
  overlapMinutes: z.number().int().nonnegative(),
  lastAutoScanCursorAt: nullableIsoDateSchema,
  lastRunAt: nullableIsoDateSchema,
  updatedAt: z.string(),
});

export const adminNamefiFeedRunSchema = z.object({
  id: z.string().uuid(),
  workflowId: z.string().nullable(),
  trigger: z.enum(['scheduled', 'manual']),
  status: z.enum(['running', 'completed', 'failed', 'skipped']),
  startedAt: z.string(),
  finishedAt: nullableIsoDateSchema,
  scannedPostCount: z.number().int().nonnegative(),
  queuedPostCount: z.number().int().nonnegative(),
  processedPostCount: z.number().int().nonnegative(),
  listingUpsertedCount: z.number().int().nonnegative(),
  skippedPostCount: z.number().int().nonnegative(),
  failedPostCount: z.number().int().nonnegative(),
  errorMessage: z.string().nullable(),
});

export const adminNamefiFeedPostSchema = z.object({
  id: z.string().uuid(),
  externalPostId: z.string(),
  authorUsername: z.string().nullable(),
  authorDisplayName: z.string().nullable(),
  status: z.enum(['pending', 'processing', 'processed', 'skipped', 'failed']),
  source: z.enum(['auto_scan', 'manual']),
  postedAt: z.string(),
  createdAt: z.string(),
  processedAt: nullableIsoDateSchema,
  failureReason: z.string().nullable(),
  skipReason: z.string().nullable(),
  sourceUrl: z.string(),
});

export const adminNamefiFeedListingSchema = z.object({
  id: z.string().uuid(),
  domain: z.string(),
  askingPrice: z.string().nullable(),
  askingCurrency: z.string().nullable(),
  purchaseUrl: z.string().nullable(),
  sellerUsername: z.string().nullable(),
  sourceUrl: z.string(),
  postedAt: z.string(),
  listedAt: z.string(),
  suppressed: z.boolean(),
});

export const adminNamefiFeedReportSchema = z.object({
  id: z.string().uuid(),
  listingId: z.string().uuid(),
  domain: z.string(),
  reason: z.enum([
    'already_sold',
    'inaccurate_price',
    'not_for_sale',
    'duplicate_listing',
    'other',
  ]),
  details: z.string().nullable(),
  status: z.enum(['active', 'resolved']),
  createdAt: z.string(),
  sourceUrl: z.string(),
});

export const adminNamefiFeedOverviewSchema = z.object({
  settings: adminNamefiFeedSettingsSchema,
  xBearerTokenConfigured: z.boolean(),
  stats: z.object({
    totalPosts: z.number().int().nonnegative(),
    pendingPosts: z.number().int().nonnegative(),
    failedPosts: z.number().int().nonnegative(),
    activeListings: z.number().int().nonnegative(),
    suppressedListings: z.number().int().nonnegative(),
    activeReports: z.number().int().nonnegative(),
    runningRuns: z.number().int().nonnegative(),
  }),
  recentRuns: z.array(adminNamefiFeedRunSchema),
  recentPosts: z.array(adminNamefiFeedPostSchema),
  recentListings: z.array(adminNamefiFeedListingSchema),
  recentReports: z.array(adminNamefiFeedReportSchema),
});

const updateSettingsInputSchema = z.object({
  autoScanEnabled: z.boolean().optional(),
  searchQueries: z.array(z.string().trim().min(1)).max(12).optional(),
  maxQueries: z.number().int().min(1).max(12).optional(),
  maxPagesPerQuery: z.number().int().min(1).max(10).optional(),
  maxTweetsPerQuery: z.number().int().min(10).max(100).optional(),
  maxTweetAgeMinutes: z
    .number()
    .int()
    .min(15)
    .max(60 * 24 * 7)
    .optional(),
  overlapMinutes: z
    .number()
    .int()
    .min(0)
    .max(60 * 24)
    .optional(),
});

const startIngestionInputSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('scan'),
  }),
  z.object({
    mode: z.literal('manual'),
    tweets: z.array(z.string().trim().min(1)).min(1).max(50),
    includeReplies: z.boolean().optional().default(false),
  }),
]);

export const adminNamefiFeedContract = createContract(
  { softOutput: true },
  {
    getOverview: {
      type: 'query',
      input: z.void(),
      output: adminNamefiFeedOverviewSchema,
    },
    updateSettings: {
      type: 'mutation',
      input: updateSettingsInputSchema,
      output: adminNamefiFeedSettingsSchema,
    },
    startIngestion: {
      type: 'mutation',
      input: startIngestionInputSchema,
      output: z.object({
        workflowId: z.string(),
      }),
    },
    setListingSuppressed: {
      type: 'mutation',
      input: z.object({
        listingId: z.string().uuid(),
        suppressed: z.boolean(),
      }),
      output: z.object({
        id: z.string().uuid(),
        suppressed: z.boolean(),
      }),
    },
    resolveReport: {
      type: 'mutation',
      input: z.object({
        reportId: z.string().uuid(),
        resolution: z.enum(['suppressed_listing', 'dismissed']),
      }),
      output: z.object({
        id: z.string().uuid(),
        status: z.enum(['active', 'resolved']),
        resolution: z.enum(['suppressed_listing', 'dismissed']).nullable(),
      }),
    },
  },
);

export type AdminNamefiFeedContract = typeof adminNamefiFeedContract;
