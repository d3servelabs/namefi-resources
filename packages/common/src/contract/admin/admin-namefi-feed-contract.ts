import { z } from 'zod';

import { createContract } from '../create-contract';

const nullableIsoDateSchema = z.string().nullable();

export const adminNamefiFeedSourceIdSchema = z.enum([
  'x',
  'namepros',
  'dnforum',
]);

export const adminNamefiFeedSourceSchema = z.object({
  id: adminNamefiFeedSourceIdSchema,
  label: z.string(),
  kind: z.enum(['social', 'external']),
  enabled: z.boolean(),
});

const adminNamefiFeedXSourceSettingsSchema = z.object({
  maxQueries: z.number().int().positive(),
  maxPagesPerQuery: z.number().int().positive(),
  maxTweetsPerQuery: z.number().int().positive(),
  maxTweetAgeMinutes: z.number().int().positive(),
  overlapMinutes: z.number().int().nonnegative(),
});

const adminNamefiFeedMarketplaceSourceSettingsSchema = z.object({
  maxPostAgeMinutes: z.number().int().positive(),
});

const adminNamefiFeedSourceSettingsSchema = z.object({
  x: adminNamefiFeedXSourceSettingsSchema,
  namepros: adminNamefiFeedMarketplaceSourceSettingsSchema,
  dnforum: adminNamefiFeedMarketplaceSourceSettingsSchema,
});

export const adminNamefiFeedRunSourceResultSchema = z.object({
  source: adminNamefiFeedSourceIdSchema,
  feedId: z.string().nullable(),
  feedUrl: z.string().nullable(),
  skipped: z.boolean(),
  reason: z.string().nullable(),
  scannedPostCount: z.number().int().nonnegative(),
  queuedPostCount: z.number().int().nonnegative(),
  alreadyExistingCount: z.number().int().nonnegative(),
  skippedPostCount: z.number().int().nonnegative(),
  latestCursorAt: nullableIsoDateSchema,
  errorMessage: z.string().nullable(),
});

export const adminNamefiFeedSettingsSchema = z.object({
  autoScanEnabled: z.boolean(),
  enabledSources: z.array(adminNamefiFeedSourceIdSchema),
  sources: z.array(adminNamefiFeedSourceSchema),
  searchQueries: z.array(z.string()),
  maxQueries: z.number().int().positive(),
  maxPagesPerQuery: z.number().int().positive(),
  maxTweetsPerQuery: z.number().int().positive(),
  maxTweetAgeMinutes: z.number().int().positive(),
  maxPostsProcessedPerRun: z.number().int().positive(),
  overlapMinutes: z.number().int().nonnegative(),
  sourceSettings: adminNamefiFeedSourceSettingsSchema,
  lastAutoScanCursorAt: nullableIsoDateSchema,
  lastRunAt: nullableIsoDateSchema,
  updatedAt: z.string(),
});

export const adminNamefiFeedRunSchema = z.object({
  id: z.string().uuid(),
  workflowId: z.string().nullable(),
  temporalRunId: z.string().nullable(),
  temporalUiUrl: z.string().url().nullable(),
  trigger: z.enum(['scheduled', 'manual']),
  status: z.enum(['running', 'completed', 'failed', 'skipped']),
  startedAt: z.string(),
  finishedAt: nullableIsoDateSchema,
  scannedPostCount: z.number().int().nonnegative(),
  queuedPostCount: z.number().int().nonnegative(),
  alreadyExistingPostCount: z.number().int().nonnegative(),
  scanSkippedPostCount: z.number().int().nonnegative(),
  processedPostCount: z.number().int().nonnegative(),
  aiAnalysisAttemptedPostCount: z.number().int().nonnegative(),
  maxPostsProcessedPerRun: z.number().int().positive().nullable(),
  remainingPostCount: z.number().int().nonnegative().nullable(),
  stopReason: z.string().nullable(),
  listingUpsertedCount: z.number().int().nonnegative(),
  skippedPostCount: z.number().int().nonnegative(),
  failedPostCount: z.number().int().nonnegative(),
  skipReason: z.string().nullable(),
  errorMessage: z.string().nullable(),
  sourceResults: z.array(adminNamefiFeedRunSourceResultSchema),
});

export const adminNamefiFeedPostSchema = z.object({
  id: z.string().uuid(),
  ingestionRunId: z.string().uuid().nullable(),
  ingestionWorkflowId: z.string().nullable(),
  temporalRunId: z.string().nullable(),
  temporalUiUrl: z.string().url().nullable(),
  externalPostId: z.string(),
  authorUsername: z.string().nullable(),
  authorDisplayName: z.string().nullable(),
  status: z.enum(['pending', 'processing', 'processed', 'skipped', 'failed']),
  source: z.enum(['auto_scan', 'manual', 'system']),
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
  sellerDisplayName: z.string().nullable(),
  sourceUrl: z.string(),
  postedAt: z.string(),
  listedAt: z.string(),
  endedAt: nullableIsoDateSchema,
  endReason: z.string().nullable(),
  expiresAt: nullableIsoDateSchema,
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

export const adminNamefiFeedDigestTargetTypeSchema = z.enum([
  'slack',
  'telegram_group',
  'discord_channel',
]);

export const adminNamefiFeedSlackDigestTargetConfigSchema = z
  .object({
    channelId: z.string().trim().min(1).max(128),
  })
  .strict();

export const adminNamefiFeedTelegramDigestTargetConfigSchema = z
  .object({
    chatId: z.string().trim().min(1).max(128),
    messageThreadId: z.number().int().positive().nullable().optional(),
  })
  .strict();

export const adminNamefiFeedDiscordDigestTargetConfigSchema = z
  .object({
    channelId: z.string().trim().min(1).max(128),
    guildId: z.string().trim().min(1).max(128).nullable().optional(),
  })
  .strict();

export const adminNamefiFeedDigestTargetConfigSchema = z.union([
  adminNamefiFeedSlackDigestTargetConfigSchema,
  adminNamefiFeedTelegramDigestTargetConfigSchema,
  adminNamefiFeedDiscordDigestTargetConfigSchema,
]);

const adminNamefiFeedDigestTargetBaseSchema = z.object({
  id: z.string().uuid(),
  targetKey: z.string(),
  label: z.string(),
  enabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const adminNamefiFeedDigestTargetSchema = z.discriminatedUnion(
  'targetType',
  [
    adminNamefiFeedDigestTargetBaseSchema.extend({
      targetType: z.literal('slack'),
      config: adminNamefiFeedSlackDigestTargetConfigSchema,
    }),
    adminNamefiFeedDigestTargetBaseSchema.extend({
      targetType: z.literal('telegram_group'),
      config: adminNamefiFeedTelegramDigestTargetConfigSchema,
    }),
    adminNamefiFeedDigestTargetBaseSchema.extend({
      targetType: z.literal('discord_channel'),
      config: adminNamefiFeedDiscordDigestTargetConfigSchema,
    }),
  ],
);

export const adminNamefiFeedDigestDeliverySchema = z.object({
  id: z.string().uuid(),
  targetId: z.string().uuid().nullable(),
  targetKey: z.string(),
  targetLabel: z.string().nullable(),
  targetType: adminNamefiFeedDigestTargetTypeSchema.nullable(),
  status: z.enum(['pending', 'sent', 'failed', 'skipped', 'partial']),
  windowStart: z.string(),
  windowEnd: z.string(),
  generatedAt: z.string(),
  externalMessageId: z.string().nullable(),
  externalMessageUrl: z.string().nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
});

export const adminNamefiFeedDigestRunSchema = z.object({
  id: z.string(),
  workflowId: z.string().nullable(),
  temporalRunId: z.string().nullable(),
  temporalUiUrl: z.string().url().nullable(),
  trigger: z.enum(['scheduled', 'manual']),
  status: z.enum([
    'running',
    'dry_run',
    'sent',
    'skipped',
    'failed',
    'partial',
  ]),
  createdByUserId: z.string().uuid().nullable(),
  windowStart: z.string(),
  windowEnd: z.string(),
  generatedAt: z.string(),
  finishedAt: nullableIsoDateSchema,
  entriesCount: z.number().int().nonnegative(),
  targetCount: z.number().int().nonnegative(),
  sentCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  includeImage: z.boolean(),
  includeAnimation: z.boolean(),
  enabledOnly: z.boolean(),
  dryRun: z.boolean(),
  usedFallback: z.boolean(),
  fallbackReason: z.string().nullable(),
  skipReason: z.string().nullable(),
  errorMessage: z.string().nullable(),
  digestTextHash: z.string().nullable(),
  imageGenerated: z.boolean(),
  animationGenerated: z.boolean(),
  createdAt: z.string(),
});

export const adminNamefiFeedOverviewSchema = z.object({
  settings: adminNamefiFeedSettingsSchema,
  xBearerTokenConfigured: z.boolean(),
  digestPublisherConfigured: z.object({
    slack: z.boolean(),
    telegram: z.boolean(),
    discord: z.boolean(),
  }),
  stats: z.object({
    totalPosts: z.number().int().nonnegative(),
    pendingPosts: z.number().int().nonnegative(),
    failedPosts: z.number().int().nonnegative(),
    activeListings: z.number().int().nonnegative(),
    suppressedListings: z.number().int().nonnegative(),
    activeReports: z.number().int().nonnegative(),
    runningRuns: z.number().int().nonnegative(),
    digestTargets: z.number().int().nonnegative(),
    enabledDigestTargets: z.number().int().nonnegative(),
  }),
  recentRuns: z.array(adminNamefiFeedRunSchema),
  recentPosts: z.array(adminNamefiFeedPostSchema),
  recentListings: z.array(adminNamefiFeedListingSchema),
  recentReports: z.array(adminNamefiFeedReportSchema),
  digestTargets: z.array(adminNamefiFeedDigestTargetSchema),
  recentDigestRuns: z.array(adminNamefiFeedDigestRunSchema),
  recentDigestDeliveries: z.array(adminNamefiFeedDigestDeliverySchema),
});

const updateSettingsInputSchema = z.object({
  autoScanEnabled: z.boolean().optional(),
  enabledSources: z.array(adminNamefiFeedSourceIdSchema).max(3).optional(),
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
  maxPostsProcessedPerRun: z.number().int().min(1).max(2_000).optional(),
  overlapMinutes: z
    .number()
    .int()
    .min(0)
    .max(60 * 24)
    .optional(),
  sourceSettings: z
    .object({
      x: adminNamefiFeedXSourceSettingsSchema
        .extend({
          maxQueries: z.number().int().min(1).max(12),
          maxPagesPerQuery: z.number().int().min(1).max(10),
          maxTweetsPerQuery: z.number().int().min(10).max(100),
          maxTweetAgeMinutes: z
            .number()
            .int()
            .min(15)
            .max(60 * 24),
          overlapMinutes: z
            .number()
            .int()
            .min(0)
            .max(60 * 24),
        })
        .partial()
        .optional(),
      namepros: adminNamefiFeedMarketplaceSourceSettingsSchema
        .extend({
          maxPostAgeMinutes: z
            .number()
            .int()
            .min(15)
            .max(60 * 24),
        })
        .partial()
        .optional(),
      dnforum: adminNamefiFeedMarketplaceSourceSettingsSchema
        .extend({
          maxPostAgeMinutes: z
            .number()
            .int()
            .min(15)
            .max(60 * 24),
        })
        .partial()
        .optional(),
    })
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

const runDigestInputSchema = z.object({
  includeImage: z.boolean().optional().default(true),
  includeAnimation: z.boolean().optional().default(true),
  enabledOnly: z.boolean().optional().default(true),
  dryRun: z.boolean().optional().default(false),
  targetIds: z.array(z.string().uuid()).max(25).optional(),
});

const adminNamefiFeedSortingSchema = z
  .array(
    z.object({
      id: z.string(),
      desc: z.boolean(),
    }),
  )
  .max(3);

const adminNamefiFeedColumnFilterSchema = z.object({
  id: z.string(),
  value: z.any(),
});

const adminNamefiFeedTableInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  searchTerm: z.string().trim().max(200).optional(),
  sorting: adminNamefiFeedSortingSchema.optional(),
  columnFilters: z.array(adminNamefiFeedColumnFilterSchema).max(20).optional(),
});

function paginatedNamefiFeedTableSchema<T extends z.ZodTypeAny>(row: T) {
  return z.object({
    rows: z.array(row),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    totalCount: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  });
}

const createDigestTargetInputSchema = z.discriminatedUnion('targetType', [
  z.object({
    targetType: z.literal('slack'),
    label: z.string().trim().min(1).max(120).optional(),
    enabled: z.boolean().optional().default(true),
    config: adminNamefiFeedSlackDigestTargetConfigSchema,
  }),
  z.object({
    targetType: z.literal('telegram_group'),
    label: z.string().trim().min(1).max(120).optional(),
    enabled: z.boolean().optional().default(true),
    config: adminNamefiFeedTelegramDigestTargetConfigSchema,
  }),
  z.object({
    targetType: z.literal('discord_channel'),
    label: z.string().trim().min(1).max(120).optional(),
    enabled: z.boolean().optional().default(true),
    config: adminNamefiFeedDiscordDigestTargetConfigSchema,
  }),
]);

const updateDigestTargetInputSchema = z.discriminatedUnion('targetType', [
  z.object({
    id: z.string().uuid(),
    targetType: z.literal('slack'),
    label: z.string().trim().min(1).max(120).optional(),
    enabled: z.boolean().optional(),
    config: adminNamefiFeedSlackDigestTargetConfigSchema.optional(),
  }),
  z.object({
    id: z.string().uuid(),
    targetType: z.literal('telegram_group'),
    label: z.string().trim().min(1).max(120).optional(),
    enabled: z.boolean().optional(),
    config: adminNamefiFeedTelegramDigestTargetConfigSchema.optional(),
  }),
  z.object({
    id: z.string().uuid(),
    targetType: z.literal('discord_channel'),
    label: z.string().trim().min(1).max(120).optional(),
    enabled: z.boolean().optional(),
    config: adminNamefiFeedDiscordDigestTargetConfigSchema.optional(),
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
    listRuns: {
      type: 'query',
      input: adminNamefiFeedTableInputSchema,
      output: paginatedNamefiFeedTableSchema(adminNamefiFeedRunSchema),
    },
    listPosts: {
      type: 'query',
      input: adminNamefiFeedTableInputSchema,
      output: paginatedNamefiFeedTableSchema(adminNamefiFeedPostSchema),
    },
    listListings: {
      type: 'query',
      input: adminNamefiFeedTableInputSchema,
      output: paginatedNamefiFeedTableSchema(adminNamefiFeedListingSchema),
    },
    listReports: {
      type: 'query',
      input: adminNamefiFeedTableInputSchema,
      output: paginatedNamefiFeedTableSchema(adminNamefiFeedReportSchema),
    },
    listDigestDeliveries: {
      type: 'query',
      input: adminNamefiFeedTableInputSchema,
      output: paginatedNamefiFeedTableSchema(
        adminNamefiFeedDigestDeliverySchema,
      ),
    },
    listDigestRuns: {
      type: 'query',
      input: adminNamefiFeedTableInputSchema,
      output: paginatedNamefiFeedTableSchema(adminNamefiFeedDigestRunSchema),
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
    runDigest: {
      type: 'mutation',
      input: runDigestInputSchema,
      output: z.object({
        workflowId: z.string(),
      }),
    },
    createDigestTarget: {
      type: 'mutation',
      input: createDigestTargetInputSchema,
      output: adminNamefiFeedDigestTargetSchema,
    },
    updateDigestTarget: {
      type: 'mutation',
      input: updateDigestTargetInputSchema,
      output: adminNamefiFeedDigestTargetSchema,
    },
    deleteDigestTarget: {
      type: 'mutation',
      input: z.object({
        targetId: z.string().uuid(),
      }),
      output: z.object({
        id: z.string().uuid(),
        deleted: z.boolean(),
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
