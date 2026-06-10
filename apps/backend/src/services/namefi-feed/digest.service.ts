import { createHash } from 'node:crypto';
import {
  buildNamefiFeedSalesDigestAnimationSummary,
  buildNamefiFeedSalesDigestFormattedPicks,
  formatNamefiFeedSalesDigestInsight,
  generateNamefiFeedSalesDigestInsight,
  generateNamefiFeedSalesDigestWordCloudImage,
  NAMEFI_FEED_SALES_DIGEST_ANIMATION_EXTERNAL_USER_ID,
  NAMEFI_FEED_SALES_DIGEST_ANIMATION_MODEL,
  NAMEFI_FEED_SALES_DIGEST_ANIMATION_SHEET_MODEL,
  type NamefiFeedSalesDigestEntry,
  type NamefiFeedSalesDigestFormattedPick,
  uploadDigestAnimationSourceImage,
} from '@namefi-astra/ai';
import {
  db,
  namefiFeedListingsTable,
  salesDigestAnimationsTable,
  salesDigestRunsTable,
} from '@namefi-astra/db';
import { createS3Client } from '@namefi-astra/storage';
import { and, asc, eq, gte, lt } from 'drizzle-orm';
import type { Json } from 'drizzle-zod';
import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared';
import type {
  PublicDigestAnimationWorkflowInput,
  PublicDigestAnimationWorkflowResult,
} from '#temporal/shared/public-digest-animation';
import { generatePublicDigestAnimationWorkflow } from '#temporal/workflows/public-digest-animation.workflow';
import { getActiveNamefiFeedListingWhereClauses } from './listing-visibility';

const DIGEST_WINDOW_MS = 24 * 60 * 60 * 1000;
const DIGEST_RUN_SLOT_UTC_HOUR = 12;
const DIGEST_RUN_SLOT_UTC_MINUTE = 30;
const logger = createLogger({ module: 'namefi-feed-sales-digest' });
const SALES_DIGEST_ANIMATION_MODEL =
  NAMEFI_FEED_SALES_DIGEST_ANIMATION_MODEL as NonNullable<
    PublicDigestAnimationWorkflowInput['model']
  >;
const SALES_DIGEST_ANIMATION_SHEET_MODEL =
  NAMEFI_FEED_SALES_DIGEST_ANIMATION_SHEET_MODEL as NonNullable<
    PublicDigestAnimationWorkflowInput['sheetModel']
  >;

export interface NamefiFeedSalesDigestBounds {
  start: Date;
  end: Date;
}

export type NamefiFeedSalesDigestAnimationResult =
  PublicDigestAnimationWorkflowResult & {
    labsAnimationId?: string;
    astraGenerationId?: string;
  };

export interface NamefiFeedSalesDigestRenderResult {
  text: string;
  usedFallback: boolean;
  fallbackReason: string | null;
  imageDataUrl: string | null;
  animation: NamefiFeedSalesDigestAnimationResult | null;
  topPicks: NamefiFeedSalesDigestFormattedPick[];
}

export interface RunNamefiFeedSalesDigestInput {
  at?: Date;
  createdByUserId?: string | null;
  digestRunId?: string | null;
  trigger?: 'scheduled' | 'manual';
  workflowId?: string | null;
  includeAnimation?: boolean;
  includeImage?: boolean;
  enabledOnly?: boolean;
  targetIds?: string[];
  dryRun?: boolean;
}

export interface RunNamefiFeedSalesDigestResult {
  digestRunId: string;
  status: 'dry_run' | 'sent' | 'skipped';
  skipReason: string | null;
  bounds: {
    start: string;
    end: string;
  };
  entriesCount: number;
  render: {
    text: string;
    usedFallback: boolean;
    fallbackReason: string | null;
    imageGenerated: boolean;
    animationGenerated: boolean;
    topPicks: NamefiFeedSalesDigestFormattedPick[];
  } | null;
  deliverySummary: {
    sent: number;
    skipped: number;
    failed: number;
    targetCount: number;
  } | null;
}

export interface PendingNamefiFeedSalesDigestRun {
  digestRunId: string;
  generatedAt: string;
  bounds: {
    start: string;
    end: string;
  };
}

interface SalesDigestAnimationPersistenceKey {
  digestTextHash: string;
  externalUserId: string;
  model: string;
  sheetModel: string;
  sourceImageDataUrlHash: string;
}

interface SalesDigestAnimationPersistenceContext {
  bounds: NamefiFeedSalesDigestBounds;
  digestText: string;
  domains: ReadonlyArray<string>;
  externalUserId: string;
  generatedAt: Date;
  imageDataUrl: string;
  model: NonNullable<PublicDigestAnimationWorkflowInput['model']>;
  sheetModel: NonNullable<PublicDigestAnimationWorkflowInput['sheetModel']>;
}

export class NamefiFeedSalesDigestDeliveryError extends Error {
  readonly deliverySummary: NonNullable<
    RunNamefiFeedSalesDigestResult['deliverySummary']
  >;

  constructor(
    deliverySummary: NonNullable<
      RunNamefiFeedSalesDigestResult['deliverySummary']
    >,
  ) {
    super(
      `Namefi Feed sales digest delivery failed for ${deliverySummary.failed} target${deliverySummary.failed === 1 ? '' : 's'}.`,
    );
    this.name = 'NamefiFeedSalesDigestDeliveryError';
    this.deliverySummary = deliverySummary;
  }
}

const s3Client = createS3Client({
  AWS_ACCESS_KEY_ID: secrets.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: secrets.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: config.AWS_REGION,
});

const animationStorageConfig = {
  bucketName: config.STORAGE_BUCKET,
  cloudfrontDomain: config.CLOUD_FRONT_DOMAIN,
  s3Client,
  baseFolder: config.AI_BUCKET_FOLDERS.ANIMATIONS,
};

export function getRollingNamefiFeedSalesDigestBounds(
  at: Date = new Date(),
): NamefiFeedSalesDigestBounds {
  const end = new Date(at.getTime());
  const start = new Date(end.getTime() - DIGEST_WINDOW_MS);

  return { start, end };
}

export function resolveNamefiFeedSalesDigestRunAt(at?: Date): Date {
  if (at) {
    return new Date(at.getTime());
  }

  const now = new Date();
  const todaySlot = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      DIGEST_RUN_SLOT_UTC_HOUR,
      DIGEST_RUN_SLOT_UTC_MINUTE,
      0,
      0,
    ),
  );

  if (now.getTime() >= todaySlot.getTime()) {
    return todaySlot;
  }

  return new Date(todaySlot.getTime() - DIGEST_WINDOW_MS);
}

export async function getNamefiFeedSalesDigestEntries(
  options: { at?: Date } = {},
): Promise<NamefiFeedSalesDigestEntry[]> {
  const { start, end } = getRollingNamefiFeedSalesDigestBounds(options.at);

  const rows = await db
    .select({
      domain: namefiFeedListingsTable.domain,
      askingPrice: namefiFeedListingsTable.askingPrice,
      askingCurrency: namefiFeedListingsTable.askingCurrency,
      purchaseUrl: namefiFeedListingsTable.purchaseUrl,
      logo: namefiFeedListingsTable.logo,
      postedAt: namefiFeedListingsTable.postedAt,
      messageText: namefiFeedListingsTable.messageText,
      sellerUsername: namefiFeedListingsTable.sellerUsername,
      sellerDisplayName: namefiFeedListingsTable.sellerDisplayName,
      sourceUrl: namefiFeedListingsTable.sourceUrl,
    })
    .from(namefiFeedListingsTable)
    .where(
      and(
        ...getActiveNamefiFeedListingWhereClauses(end),
        gte(namefiFeedListingsTable.postedAt, start),
        lt(namefiFeedListingsTable.postedAt, end),
      ),
    )
    .orderBy(
      asc(namefiFeedListingsTable.postedAt),
      asc(namefiFeedListingsTable.domain),
    );

  return rows
    .map((row) => ({
      domain: row.domain.trim().toLowerCase(),
      askingPrice: normalizeOptionalText(row.askingPrice),
      askingCurrency: normalizeOptionalText(row.askingCurrency),
      purchaseUrl: normalizeOptionalText(row.purchaseUrl),
      logoUrl: normalizeOptionalText(row.logo?.url),
      createdAt: row.postedAt,
      messageText: normalizeOptionalText(row.messageText),
      sellerUsername: normalizeOptionalText(row.sellerUsername),
      sellerDisplayName: normalizeOptionalText(row.sellerDisplayName),
      sourceTweetUrl: row.sourceUrl,
    }))
    .filter((row) => row.domain.length > 0);
}

export async function renderNamefiFeedSalesDigest({
  bounds,
  entries,
  includeAnimation = false,
  includeImage = false,
}: {
  bounds: NamefiFeedSalesDigestBounds;
  entries: ReadonlyArray<NamefiFeedSalesDigestEntry>;
  includeAnimation?: boolean;
  includeImage?: boolean;
}): Promise<NamefiFeedSalesDigestRenderResult> {
  if (entries.length === 0) {
    throw new Error('Cannot render Namefi Feed sales digest without entries.');
  }

  const { insight, context } = await generateNamefiFeedSalesDigestInsight({
    entries,
    windowStart: bounds.start,
    windowEnd: bounds.end,
  });
  const topPicks = attachLogoUrlsToTopPicks(
    buildNamefiFeedSalesDigestFormattedPicks(insight, context),
    entries,
  );
  const text = formatNamefiFeedSalesDigestInsight(insight, context);
  const imagePicks = topPicks.map((pick) => ({
    domain: pick.domain,
    thesis: pick.thesis,
    logoUrl: pick.logoUrl,
  }));
  const sourceImageDataUrl = await maybeGenerateDigestWordCloud({
    includeImage: includeAnimation || includeImage,
    picks: imagePicks,
  });
  const animation = await maybeGenerateDigestAnimation({
    bounds,
    generatedAt: bounds.end,
    imageDataUrl: sourceImageDataUrl,
    includeAnimation,
    picks: imagePicks,
    text,
  });
  const imageDataUrl = includeImage ? sourceImageDataUrl : null;

  assertRequestedDigestMediaAvailable({
    animation,
    imageDataUrl,
    includeAnimation,
    includeImage,
  });

  return {
    text,
    usedFallback: false,
    fallbackReason: null,
    imageDataUrl,
    animation,
    topPicks,
  };
}

export async function runNamefiFeedSalesDigest(
  input: RunNamefiFeedSalesDigestInput = {},
): Promise<RunNamefiFeedSalesDigestResult> {
  const {
    countNamefiFeedSalesDigestDeliveryTargets,
    publishNamefiFeedSalesDigestToTargets,
  } = await import('./digest-targets.service');
  const runAt = resolveNamefiFeedSalesDigestRunAt(input.at);
  const bounds = getRollingNamefiFeedSalesDigestBounds(runAt);
  const includeImage = input.includeImage ?? true;
  const includeAnimation = input.includeAnimation ?? true;
  const enabledOnly = input.enabledOnly ?? true;
  const dryRun = input.dryRun ?? false;
  const digestRunId =
    input.digestRunId ??
    (await createNamefiFeedSalesDigestRun({
      bounds,
      createdByUserId: input.createdByUserId ?? null,
      dryRun,
      enabledOnly,
      generatedAt: runAt,
      includeAnimation,
      includeImage,
      targetIds: input.targetIds,
      trigger: input.trigger ?? 'manual',
      workflowId: input.workflowId ?? null,
    }));
  let runCompleted = false;

  try {
    const entries = await getNamefiFeedSalesDigestEntries({ at: runAt });
    const targetCount = await countNamefiFeedSalesDigestDeliveryTargets({
      enabledOnly,
      targetIds: input.targetIds,
    });

    if (entries.length === 0) {
      const deliverySummary = {
        sent: 0,
        skipped: targetCount,
        failed: 0,
        targetCount,
      };
      await completeNamefiFeedSalesDigestRun({
        digestRunId,
        deliverySummary,
        entriesCount: 0,
        render: null,
        skipReason: 'no_entries',
        status: 'skipped',
      });
      runCompleted = true;
      return buildSalesDigestRunResult({
        bounds,
        deliverySummary,
        digestRunId,
        entriesCount: 0,
        render: null,
        skipReason: 'no_entries',
        status: 'skipped',
      });
    }

    if (!dryRun && targetCount === 0) {
      const deliverySummary = {
        sent: 0,
        skipped: 0,
        failed: 0,
        targetCount: 0,
      };
      await completeNamefiFeedSalesDigestRun({
        digestRunId,
        deliverySummary,
        entriesCount: entries.length,
        render: null,
        skipReason: 'no_targets',
        status: 'skipped',
      });
      runCompleted = true;
      return buildSalesDigestRunResult({
        bounds,
        deliverySummary,
        digestRunId,
        entriesCount: entries.length,
        render: null,
        skipReason: 'no_targets',
        status: 'skipped',
      });
    }

    const render = await renderNamefiFeedSalesDigest({
      bounds,
      entries,
      includeAnimation,
      includeImage,
    });

    const deliverySummary = dryRun
      ? { sent: 0, skipped: 0, failed: 0, targetCount }
      : await publishNamefiFeedSalesDigestToTargets({
          at: runAt,
          bounds,
          createdByUserId: input.createdByUserId ?? null,
          digestRender: render,
          digestRunId,
          enabledOnly,
          entriesCount: entries.length,
          targetIds: input.targetIds,
        });

    if (deliverySummary.failed > 0) {
      const failedStatus = deliverySummary.sent > 0 ? 'partial' : 'failed';
      await completeNamefiFeedSalesDigestRun({
        digestRunId,
        deliverySummary: {
          sent: deliverySummary.sent,
          skipped: deliverySummary.skipped,
          failed: deliverySummary.failed,
          targetCount: deliverySummary.targetCount,
        },
        entriesCount: entries.length,
        errorMessage: `Delivery failed for ${deliverySummary.failed} target${deliverySummary.failed === 1 ? '' : 's'}.`,
        render,
        skipReason: null,
        status: failedStatus,
      });
      runCompleted = true;
      throw new NamefiFeedSalesDigestDeliveryError({
        sent: deliverySummary.sent,
        skipped: deliverySummary.skipped,
        failed: deliverySummary.failed,
        targetCount: deliverySummary.targetCount,
      });
    }

    const status = dryRun
      ? 'dry_run'
      : deliverySummary.sent > 0
        ? 'sent'
        : 'skipped';
    await completeNamefiFeedSalesDigestRun({
      digestRunId,
      deliverySummary: {
        sent: deliverySummary.sent,
        skipped: deliverySummary.skipped,
        failed: deliverySummary.failed,
        targetCount: deliverySummary.targetCount,
      },
      entriesCount: entries.length,
      render,
      skipReason: null,
      status,
    });
    runCompleted = true;

    return buildSalesDigestRunResult({
      bounds,
      deliverySummary: {
        sent: deliverySummary.sent,
        skipped: deliverySummary.skipped,
        failed: deliverySummary.failed,
        targetCount: deliverySummary.targetCount,
      },
      digestRunId,
      entriesCount: entries.length,
      render,
      skipReason: null,
      status,
    });
  } catch (error) {
    if (!runCompleted) {
      await failNamefiFeedSalesDigestRun({
        digestRunId,
        errorMessage: describeError(error, 'Namefi Feed sales digest failed.'),
      });
    }
    throw error;
  }
}

function buildSalesDigestRunResult({
  bounds,
  deliverySummary,
  digestRunId,
  entriesCount,
  render,
  skipReason,
  status,
}: {
  bounds: NamefiFeedSalesDigestBounds;
  deliverySummary: RunNamefiFeedSalesDigestResult['deliverySummary'];
  digestRunId: string;
  entriesCount: number;
  render: NamefiFeedSalesDigestRenderResult | null;
  skipReason: RunNamefiFeedSalesDigestResult['skipReason'];
  status: RunNamefiFeedSalesDigestResult['status'];
}): RunNamefiFeedSalesDigestResult {
  return {
    digestRunId,
    status,
    skipReason,
    bounds: {
      start: bounds.start.toISOString(),
      end: bounds.end.toISOString(),
    },
    entriesCount,
    render: render
      ? {
          text: render.text,
          usedFallback: render.usedFallback,
          fallbackReason: render.fallbackReason,
          imageGenerated: Boolean(render.imageDataUrl),
          animationGenerated: Boolean(render.animation),
          topPicks: render.topPicks,
        }
      : null,
    deliverySummary,
  };
}

export async function createPendingNamefiFeedSalesDigestRun(input: {
  at?: Date;
  createdByUserId?: string | null;
  trigger?: 'scheduled' | 'manual';
  workflowId?: string | null;
  includeAnimation?: boolean;
  includeImage?: boolean;
  enabledOnly?: boolean;
  targetIds?: string[];
  dryRun?: boolean;
}): Promise<PendingNamefiFeedSalesDigestRun> {
  const generatedAt = resolveNamefiFeedSalesDigestRunAt(input.at);
  const bounds = getRollingNamefiFeedSalesDigestBounds(generatedAt);
  const digestRunId = await createNamefiFeedSalesDigestRun({
    bounds,
    createdByUserId: input.createdByUserId ?? null,
    dryRun: input.dryRun ?? false,
    enabledOnly: input.enabledOnly ?? true,
    generatedAt,
    includeAnimation: input.includeAnimation ?? true,
    includeImage: input.includeImage ?? true,
    targetIds: input.targetIds,
    trigger: input.trigger ?? 'manual',
    workflowId: input.workflowId ?? null,
  });

  return {
    digestRunId,
    generatedAt: generatedAt.toISOString(),
    bounds: {
      start: bounds.start.toISOString(),
      end: bounds.end.toISOString(),
    },
  };
}

async function createNamefiFeedSalesDigestRun({
  bounds,
  createdByUserId,
  dryRun,
  enabledOnly,
  generatedAt,
  includeAnimation,
  includeImage,
  targetIds,
  trigger,
  workflowId,
}: {
  bounds: NamefiFeedSalesDigestBounds;
  createdByUserId: string | null;
  dryRun: boolean;
  enabledOnly: boolean;
  generatedAt: Date;
  includeAnimation: boolean;
  includeImage: boolean;
  targetIds?: string[];
  trigger: 'scheduled' | 'manual';
  workflowId: string | null;
}): Promise<string> {
  const [run] = await db
    .insert(salesDigestRunsTable)
    .values({
      createdByUserId,
      dryRun,
      enabledOnly,
      generatedAt,
      includeAnimation,
      includeImage,
      metadata: {},
      status: 'running',
      targetIds: targetIds ?? null,
      trigger,
      windowEnd: bounds.end,
      windowStart: bounds.start,
      workflowId,
    })
    .returning({ id: salesDigestRunsTable.id });

  if (!run) {
    throw new Error('Failed to create Namefi Feed sales digest run.');
  }

  return run.id;
}

async function completeNamefiFeedSalesDigestRun({
  deliverySummary,
  digestRunId,
  entriesCount,
  errorMessage,
  render,
  skipReason,
  status,
}: {
  deliverySummary: RunNamefiFeedSalesDigestResult['deliverySummary'];
  digestRunId: string;
  entriesCount: number;
  errorMessage?: string | null;
  render: NamefiFeedSalesDigestRenderResult | null;
  skipReason: RunNamefiFeedSalesDigestResult['skipReason'];
  status: 'dry_run' | 'sent' | 'skipped' | 'failed' | 'partial';
}) {
  await db
    .update(salesDigestRunsTable)
    .set({
      animationGenerated: Boolean(render?.animation),
      digestTextHash: render?.text
        ? hashDigestAnimationValue(render.text)
        : null,
      entriesCount,
      errorMessage: errorMessage ?? null,
      failedCount: deliverySummary?.failed ?? 0,
      fallbackReason: render?.fallbackReason ?? null,
      finishedAt: new Date(),
      imageGenerated: Boolean(render?.imageDataUrl),
      metadata: {
        deliverySummary: deliverySummary ?? null,
        topPicks: render?.topPicks ?? [],
      },
      sentCount: deliverySummary?.sent ?? 0,
      skippedCount: deliverySummary?.skipped ?? 0,
      skipReason,
      status,
      targetCount: deliverySummary?.targetCount ?? 0,
      updatedAt: new Date(),
      usedFallback: Boolean(render?.usedFallback),
    })
    .where(eq(salesDigestRunsTable.id, digestRunId));
}

export async function failNamefiFeedSalesDigestRun({
  digestRunId,
  errorMessage,
  failedCount = 1,
}: {
  digestRunId: string;
  errorMessage: string;
  failedCount?: number;
}) {
  await db
    .update(salesDigestRunsTable)
    .set({
      errorMessage,
      failedCount,
      finishedAt: new Date(),
      status: 'failed',
      updatedAt: new Date(),
    })
    .where(eq(salesDigestRunsTable.id, digestRunId));
}

function attachLogoUrlsToTopPicks(
  topPicks: ReadonlyArray<NamefiFeedSalesDigestFormattedPick>,
  entries: ReadonlyArray<NamefiFeedSalesDigestEntry>,
): NamefiFeedSalesDigestFormattedPick[] {
  const logoUrlByDomain = buildLogoUrlByDomain(entries);

  return topPicks.map((pick) => ({
    ...pick,
    logoUrl: logoUrlByDomain.get(normalizeDigestDomain(pick.domain)) ?? null,
  }));
}

function buildLogoUrlByDomain(
  entries: ReadonlyArray<NamefiFeedSalesDigestEntry>,
): Map<string, string> {
  const logoUrlByDomain = new Map<string, string>();

  for (const entry of entries) {
    const domain = normalizeDigestDomain(entry.domain);
    if (logoUrlByDomain.has(domain)) {
      continue;
    }

    const logoUrl = normalizeOptionalText(entry.logoUrl);
    if (!logoUrl) {
      continue;
    }

    logoUrlByDomain.set(domain, logoUrl);
  }

  return logoUrlByDomain;
}

async function maybeGenerateDigestWordCloud({
  includeImage,
  picks,
}: {
  includeImage: boolean;
  picks: ReadonlyArray<{
    domain: string;
    thesis?: string | null;
    logoUrl?: string | null;
  }>;
}): Promise<string | null> {
  if (!includeImage || picks.length === 0) {
    return null;
  }

  try {
    const generated = await generateNamefiFeedSalesDigestWordCloudImage(picks);
    return generated?.imageDataUrl ?? null;
  } catch (error) {
    logger.error(
      { error: serializeLogError(error) },
      'Failed to generate sales digest word cloud image',
    );
    return null;
  }
}

function assertRequestedDigestMediaAvailable({
  animation,
  imageDataUrl,
  includeAnimation,
  includeImage,
}: {
  animation: NamefiFeedSalesDigestAnimationResult | null;
  imageDataUrl: string | null;
  includeAnimation: boolean;
  includeImage: boolean;
}) {
  if (!includeAnimation && !includeImage) {
    return;
  }

  if (includeAnimation && animation) {
    return;
  }

  if (includeImage && imageDataUrl) {
    return;
  }

  const requestedMedia =
    includeAnimation && includeImage
      ? 'animation or fallback image'
      : includeAnimation
        ? 'animation'
        : 'image';
  throw new Error(
    `Namefi Feed sales digest media generation failed: required ${requestedMedia} was not generated.`,
  );
}

async function maybeGenerateDigestAnimation({
  bounds,
  generatedAt,
  imageDataUrl,
  includeAnimation,
  picks,
  text,
}: {
  bounds: NamefiFeedSalesDigestBounds;
  generatedAt: Date;
  imageDataUrl: string | null;
  includeAnimation: boolean;
  picks: ReadonlyArray<{
    domain: string;
    thesis?: string | null;
  }>;
  text: string;
}): Promise<NamefiFeedSalesDigestAnimationResult | null> {
  if (!includeAnimation || !imageDataUrl || picks.length === 0) {
    return null;
  }

  const domains = picks.map((pick) => pick.domain);
  const persistenceContext = {
    bounds,
    digestText: text,
    domains,
    externalUserId: NAMEFI_FEED_SALES_DIGEST_ANIMATION_EXTERNAL_USER_ID,
    generatedAt,
    imageDataUrl,
    model: SALES_DIGEST_ANIMATION_MODEL,
    sheetModel: SALES_DIGEST_ANIMATION_SHEET_MODEL,
  };

  try {
    const persisted =
      await findPersistedSalesDigestAnimation(persistenceContext);
    if (persisted) {
      return persisted;
    }
  } catch (error) {
    logger.warn(
      { error: serializeLogError(error) },
      'Failed to read persisted sales digest animation',
    );
  }

  try {
    const requestId = buildDigestAnimationRequestId(persistenceContext);
    const sourceImage = await uploadDigestAnimationSourceImage({
      imageDataUrl,
      storage: animationStorageConfig,
    });
    const workflowInput: PublicDigestAnimationWorkflowInput = {
      jobId: requestId,
      externalUserId: persistenceContext.externalUserId,
      title: 'Daily Namefi Feed sales digest',
      domains: domains.slice(0, 12),
      summary: buildNamefiFeedSalesDigestAnimationSummary({ picks, text }),
      model: persistenceContext.model,
      sheetModel: persistenceContext.sheetModel,
      sourceImage,
    };
    const workflowId = `namefi-feed-sales-digest-animation-${requestId}`;

    const handle = await temporalClient.workflow.start(
      generatePublicDigestAnimationWorkflow,
      {
        args: [workflowInput],
        taskQueue: TEMPORAL_QUEUES.DEFAULT,
        workflowId,
        workflowIdReusePolicy: 'ALLOW_DUPLICATE',
        workflowIdConflictPolicy: 'USE_EXISTING',
        memo: {
          jobId: requestId,
          externalUserId: workflowInput.externalUserId,
          title: workflowInput.title,
          sourceImageMimeType: sourceImage.mimeType,
          sourceImageStoragePath: sourceImage.storagePath,
        },
      },
    );
    const animation = await handle.result();

    try {
      return await persistSalesDigestAnimation({
        ...persistenceContext,
        animation,
      });
    } catch (error) {
      logger.error(
        { error: serializeLogError(error) },
        'Failed to persist sales digest animation',
      );
      return animation;
    }
  } catch (error) {
    logger.error(
      { error: serializeLogError(error) },
      'Failed to generate sales digest animation',
    );
    return null;
  }
}

function buildSalesDigestAnimationPersistenceKey({
  digestText,
  externalUserId,
  imageDataUrl,
  model,
  sheetModel,
}: {
  digestText: string;
  externalUserId: string;
  imageDataUrl: string;
  model: NonNullable<PublicDigestAnimationWorkflowInput['model']>;
  sheetModel: NonNullable<PublicDigestAnimationWorkflowInput['sheetModel']>;
}): SalesDigestAnimationPersistenceKey {
  return {
    digestTextHash: hashDigestAnimationValue(digestText),
    externalUserId,
    model,
    sheetModel,
    sourceImageDataUrlHash: hashDigestAnimationValue(imageDataUrl),
  };
}

async function findPersistedSalesDigestAnimation(
  context: SalesDigestAnimationPersistenceContext,
): Promise<NamefiFeedSalesDigestAnimationResult | null> {
  const key = buildSalesDigestAnimationPersistenceKey(context);
  const rows = await db
    .select()
    .from(salesDigestAnimationsTable)
    .where(
      and(
        eq(salesDigestAnimationsTable.windowStart, context.bounds.start),
        eq(salesDigestAnimationsTable.digestTextHash, key.digestTextHash),
        eq(salesDigestAnimationsTable.externalUserId, key.externalUserId),
        eq(salesDigestAnimationsTable.model, key.model),
        eq(salesDigestAnimationsTable.sheetModel, key.sheetModel),
        eq(
          salesDigestAnimationsTable.sourceImageDataUrlHash,
          key.sourceImageDataUrlHash,
        ),
      ),
    )
    .limit(1);

  return rows[0] ? serializeSalesDigestAnimation(rows[0]) : null;
}

async function persistSalesDigestAnimation(
  context: SalesDigestAnimationPersistenceContext & {
    animation: PublicDigestAnimationWorkflowResult;
  },
): Promise<NamefiFeedSalesDigestAnimationResult> {
  const key = buildSalesDigestAnimationPersistenceKey(context);
  const domains = normalizeDomains(context.domains);
  const now = new Date();
  const values = {
    animationCreatedAt: new Date(context.animation.createdAt),
    astraGenerationId: context.animation.id,
    digestTextHash: key.digestTextHash,
    domains,
    externalUserId: context.animation.externalUserId,
    generatedAt: context.generatedAt,
    mimeType: context.animation.mimeType,
    model: context.animation.model,
    providerMetadata:
      (context.animation.providerMetadata as Record<string, Json>) ?? null,
    sheetModel: context.animation.sheetModel,
    sheetPrompt: context.animation.sheetPrompt,
    sheetStoragePath: context.animation.sheetStoragePath,
    sheetUrl: context.animation.sheetUrl,
    sourceImageDataUrlHash: key.sourceImageDataUrlHash,
    sourceImageMimeType: context.animation.sourceImageMimeType,
    sourceImageStoragePath: context.animation.sourceImageStoragePath,
    sourceImageUrl: context.animation.sourceImageUrl,
    storagePath: context.animation.storagePath,
    title: context.animation.title,
    tokenUsage: context.animation.tokenUsage as Array<Record<string, Json>>,
    url: context.animation.url,
    videoPrompt: context.animation.videoPrompt,
    warnings: context.animation.warnings as Json[],
    windowEnd: context.bounds.end,
    windowStart: context.bounds.start,
  };

  const rows = await db
    .insert(salesDigestAnimationsTable)
    .values(values)
    .onConflictDoUpdate({
      target: [
        salesDigestAnimationsTable.windowStart,
        salesDigestAnimationsTable.digestTextHash,
        salesDigestAnimationsTable.externalUserId,
        salesDigestAnimationsTable.model,
        salesDigestAnimationsTable.sheetModel,
        salesDigestAnimationsTable.sourceImageDataUrlHash,
      ],
      set: {
        ...values,
        updatedAt: now,
      },
    })
    .returning();

  return rows[0]
    ? serializeSalesDigestAnimation(rows[0])
    : {
        ...context.animation,
        astraGenerationId: context.animation.id,
      };
}

function serializeSalesDigestAnimation(
  row: typeof salesDigestAnimationsTable.$inferSelect,
): NamefiFeedSalesDigestAnimationResult {
  return {
    astraGenerationId: row.astraGenerationId,
    createdAt: row.animationCreatedAt.toISOString(),
    externalUserId: row.externalUserId,
    id: row.astraGenerationId,
    labsAnimationId: row.id,
    mimeType: 'video/mp4',
    model: row.model,
    providerMetadata: row.providerMetadata ?? undefined,
    sheetModel: row.sheetModel,
    sheetPrompt: row.sheetPrompt,
    sheetStoragePath: row.sheetStoragePath,
    sheetUrl: row.sheetUrl,
    sourceImageMimeType: row.sourceImageMimeType,
    sourceImageStoragePath: row.sourceImageStoragePath,
    sourceImageUrl: row.sourceImageUrl,
    storagePath: row.storagePath,
    title: row.title,
    tokenUsage:
      row.tokenUsage as PublicDigestAnimationWorkflowResult['tokenUsage'],
    type: 'digest_animation',
    url: row.url,
    videoPrompt: row.videoPrompt,
    warnings: row.warnings,
  };
}

function buildDigestAnimationRequestId(
  context: SalesDigestAnimationPersistenceContext,
) {
  const key = buildSalesDigestAnimationPersistenceKey(context);
  return [
    'sales-digest',
    context.bounds.start.getTime().toString(36),
    hashDigestAnimationValue(context.model).slice(0, 8),
    hashDigestAnimationValue(context.sheetModel).slice(0, 8),
    key.digestTextHash.slice(0, 16),
    key.sourceImageDataUrlHash.slice(0, 16),
  ].join('-');
}

function hashDigestAnimationValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeDomains(domains: ReadonlyArray<string>): string[] {
  return Array.from(
    new Set(
      domains.map((domain) => domain.trim().toLowerCase()).filter(Boolean),
    ),
  );
}

function normalizeDigestDomain(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function serializeLogError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return error;
}

function describeError(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : fallback;
}
