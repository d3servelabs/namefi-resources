import { Context } from '@temporalio/activity';
import Bottleneck from 'bottleneck';
import { and, eq } from 'drizzle-orm';
import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { db, aiGenerationsTable } from '@namefi-astra/db';
import {
  generateUrlFromStoragePath,
  createS3Client,
} from '@namefi-astra/storage';
import {
  runLogoAnimationWorkflow,
  type LogoAnimationWorkflowInput,
  type LogoAnimationVideoGenerationContext,
} from '@namefi-astra/ai';

const logger = createLogger({ module: 'logo-animation-activities' });
const VERCEL_GATEWAY_VIDEO_QUOTA_WINDOW_MS = 65_000;
const VERCEL_GATEWAY_VIDEO_LIMITER_ID = 'ai-generation:vercel-gateway-video';
const VERCEL_GATEWAY_VIDEO_QUOTA_ERROR_FRAGMENT =
  'Video generation has a quota of 1 request per minute';
const VERCEL_GATEWAY_VIDEO_QUOTA_MAX_RETRIES = 15;

function isProcessLocalVercelGatewayVideoLimiterAllowed() {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.NODE_ENV === 'development' ||
    process.env.ENVIRONMENT === 'local' ||
    process.env.ENVIRONMENT === 'test'
  );
}

function createVercelGatewayVideoLimiterConnection() {
  if (secrets.LIMITER_REDIS_HOST) {
    return new Bottleneck.IORedisConnection({
      clientOptions: {
        host: secrets.LIMITER_REDIS_HOST,
        port: secrets.LIMITER_REDIS_PORT,
        username: secrets.LIMITER_REDIS_USER,
        password: secrets.LIMITER_REDIS_PASSWORD,
      },
    });
  }

  if (!isProcessLocalVercelGatewayVideoLimiterAllowed()) {
    throw new Error(
      'LIMITER_REDIS_HOST is required for Vercel AI Gateway video quota enforcement outside local and test environments',
    );
  }

  logger.warn(
    {
      environment: process.env.ENVIRONMENT,
      nodeEnv: process.env.NODE_ENV,
    },
    'Using process-local Vercel AI Gateway video limiter',
  );

  return undefined;
}

const vercelGatewayVideoLimiterConnection =
  createVercelGatewayVideoLimiterConnection();

const vercelGatewayVideoLimiter = new Bottleneck({
  id: VERCEL_GATEWAY_VIDEO_LIMITER_ID,
  maxConcurrent: 1,
  minTime: VERCEL_GATEWAY_VIDEO_QUOTA_WINDOW_MS,
  ...(vercelGatewayVideoLimiterConnection
    ? { connection: vercelGatewayVideoLimiterConnection }
    : {}),
});

vercelGatewayVideoLimiter.on('error', (error) => {
  logger.error({ error }, 'Vercel AI Gateway video limiter error');
});

vercelGatewayVideoLimiter.connection?.on('error', (error) => {
  logger.error({ error }, 'Vercel AI Gateway video limiter Redis error');
});

export interface GenerateLogoAnimationParams {
  generationId: string;
}

type AiGenerationRow = typeof aiGenerationsTable.$inferSelect;
type AnimationGenerationInput = Extract<
  AiGenerationRow['input'],
  { type: 'animation' }
>;
type AnimationGenerationRow = AiGenerationRow & {
  referenceGenerationId: string;
  input: AnimationGenerationInput;
  output: Extract<AiGenerationRow['output'], { type: 'animation' }>;
};

class AnimationGenerationPendingClaimLostError extends Error {
  readonly status: AiGenerationRow['status'];

  constructor(params: {
    generationId: string;
    status: AiGenerationRow['status'];
  }) {
    super(
      `Animation generation ${params.generationId} is no longer pending before video generation`,
    );
    this.name = 'AnimationGenerationPendingClaimLostError';
    this.status = params.status;
  }
}

function getStorage(baseFolder: string) {
  const s3Client = createS3Client({
    AWS_ACCESS_KEY_ID: secrets.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: secrets.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: config.AWS_REGION,
  });

  return {
    bucketName: config.STORAGE_BUCKET,
    cloudfrontDomain: config.CLOUD_FRONT_DOMAIN,
    s3Client,
    baseFolder,
  };
}

export async function heartbeatWhile<T>(
  operation: (abortSignal: AbortSignal) => Promise<T>,
  details: Record<string, unknown>,
  intervalMs = 10_000,
  ctx: Pick<Context, 'cancellationSignal' | 'heartbeat'> = Context.current(),
): Promise<T> {
  const abortController = new AbortController();

  if (ctx.cancellationSignal.aborted) {
    abortController.abort(ctx.cancellationSignal.reason);
    throw new Error('activity-cancelled');
  }

  return await new Promise<T>((resolve, reject) => {
    let settled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    const cleanup = () => {
      if (interval) {
        clearInterval(interval);
      }
      ctx.cancellationSignal.removeEventListener('abort', cancelOperation);
    };

    const resolveOnce = (value: T) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(value);
    };

    const rejectOnce = (error: unknown) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(error);
    };

    const cancelOperation = () => {
      abortController.abort(ctx.cancellationSignal.reason);
      rejectOnce(new Error('activity-cancelled'));
    };

    ctx.cancellationSignal.addEventListener('abort', cancelOperation, {
      once: true,
    });

    const sendHeartbeat = () => {
      try {
        ctx.heartbeat(details);
      } catch (error) {
        logger.debug(
          { error, details },
          'Animation activity heartbeat failed; aborting in-flight work',
        );
        abortController.abort(error);
        rejectOnce(
          error instanceof Error
            ? error
            : new Error('animation-activity-heartbeat-failed'),
        );
      }
    };

    sendHeartbeat();

    if (settled) {
      return;
    }

    interval = setInterval(sendHeartbeat, intervalMs);

    void operation(abortController.signal).then(resolveOnce).catch(rejectOnce);
  });
}

function asMetadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function sleep(ms: number, abortSignal?: AbortSignal) {
  if (!abortSignal) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  if (abortSignal.aborted) {
    return Promise.reject(new Error('activity-cancelled'));
  }

  return new Promise((resolve, reject) => {
    let timeout: ReturnType<typeof setTimeout>;

    const abortSleep = () => {
      clearTimeout(timeout);
      reject(new Error('activity-cancelled'));
    };

    timeout = setTimeout(() => {
      abortSignal.removeEventListener('abort', abortSleep);
      resolve(undefined);
    }, ms);

    abortSignal.addEventListener('abort', abortSleep, { once: true });
  });
}

function isActivityCancelledError(error: unknown) {
  return error instanceof Error && error.message === 'activity-cancelled';
}

async function getLatestGenerationMetadata(generationId: string) {
  const row = await db
    .select({ metadata: aiGenerationsTable.metadata })
    .from(aiGenerationsTable)
    .where(eq(aiGenerationsTable.id, generationId))
    .then((rows) => rows[0]);

  return asMetadataRecord(row?.metadata);
}

function assertAnimationGeneration(
  generation: AiGenerationRow | undefined,
  generationId: string,
): asserts generation is AnimationGenerationRow {
  if (!generation) {
    throw new Error(`AI generation ${generationId} not found`);
  }

  if (
    generation.type !== 'animation' ||
    generation.input.type !== 'animation' ||
    generation.output.type !== 'animation'
  ) {
    throw new Error(`AI generation ${generationId} is not an animation job`);
  }

  if (!generation.referenceGenerationId) {
    throw new Error(
      `Animation generation ${generationId} is missing a reference logo`,
    );
  }
}

function getErrorProperty(error: unknown, key: string) {
  return error && typeof error === 'object' && key in error
    ? (error as Record<string, unknown>)[key]
    : undefined;
}

function getStringErrorProperty(error: unknown, key: string) {
  const value = getErrorProperty(error, key);
  return typeof value === 'string' ? value : undefined;
}

function getNumberErrorProperty(error: unknown, key: string) {
  const value = getErrorProperty(error, key);
  return typeof value === 'number' ? value : undefined;
}

function getErrorSearchText(error: unknown) {
  const parts = [
    getErrorMessage(error),
    getStringErrorProperty(error, 'responseBody'),
    getStringErrorProperty(error, 'body'),
  ];
  const cause = getErrorProperty(error, 'cause');

  if (cause) {
    parts.push(getErrorMessage(cause));
    parts.push(getStringErrorProperty(cause, 'responseBody'));
    parts.push(getStringErrorProperty(cause, 'body'));
  }

  return parts.filter(Boolean).join('\n');
}

function isVercelGatewayVideoQuotaError(error: unknown) {
  return getErrorSearchText(error).includes(
    VERCEL_GATEWAY_VIDEO_QUOTA_ERROR_FRAGMENT,
  );
}

function parseProviderFailurePayload(message: string) {
  const jsonStart = message.indexOf('{');
  if (jsonStart < 0) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(message.slice(jsonStart)) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function buildProviderFailureMetadata(
  providerFailure?: Record<string, unknown>,
) {
  if (!providerFailure) {
    return {};
  }

  return {
    providerFailure,
    providerJobId:
      typeof providerFailure.id === 'string' ? providerFailure.id : undefined,
    providerModel:
      typeof providerFailure.model === 'string'
        ? providerFailure.model
        : undefined,
    providerStatus:
      typeof providerFailure.status === 'string'
        ? providerFailure.status
        : undefined,
  };
}

function buildErrorCauseMetadata(cause: unknown) {
  if (!(cause instanceof Error)) {
    return {};
  }

  return {
    cause: {
      name: cause.name,
      message: cause.message,
      ...(getNumberErrorProperty(cause, 'statusCode') != null
        ? { statusCode: getNumberErrorProperty(cause, 'statusCode') }
        : {}),
      ...(getStringErrorProperty(cause, 'responseBody')
        ? { responseBody: getStringErrorProperty(cause, 'responseBody') }
        : {}),
    },
  };
}

function buildAnimationFailureMetadata(error: unknown, failedAt: Date) {
  const message =
    error instanceof Error ? error.message : 'Logo animation generation failed';
  const providerFailure = parseProviderFailurePayload(message);

  return {
    failedAt: failedAt.toISOString(),
    message,
    ...(error instanceof Error
      ? {
          name: error.name,
          stack: error.stack,
        }
      : {}),
    ...(getStringErrorProperty(error, 'type')
      ? { type: getStringErrorProperty(error, 'type') }
      : {}),
    ...(getNumberErrorProperty(error, 'statusCode') != null
      ? { statusCode: getNumberErrorProperty(error, 'statusCode') }
      : {}),
    ...(getStringErrorProperty(error, 'generationId')
      ? { gatewayGenerationId: getStringErrorProperty(error, 'generationId') }
      : {}),
    ...buildProviderFailureMetadata(providerFailure),
    ...buildErrorCauseMetadata(getErrorProperty(error, 'cause')),
  };
}

async function markGenerationProcessingForGatewayVideo(params: {
  generationId: string;
  context: LogoAnimationVideoGenerationContext;
  quotaRetryCount: number;
}) {
  const startedAt = new Date();
  const metadata = await getLatestGenerationMetadata(params.generationId);
  const previousQuotaMetadata = asMetadataRecord(
    metadata.vercelGatewayVideoQuota,
  );
  const [claimedGeneration] = await db
    .update(aiGenerationsTable)
    .set({
      status: 'PROCESSING',
      errorMessage: null,
      metadata: {
        ...metadata,
        vercelGatewayVideoQuota: {
          ...previousQuotaMetadata,
          provider: params.context.provider,
          state: 'processing',
          mode: params.context.mode,
          model: params.context.model,
          startedAt: startedAt.toISOString(),
          completedAt: null,
          errorMessage: null,
          nextRetryAt: null,
          windowMs: VERCEL_GATEWAY_VIDEO_QUOTA_WINDOW_MS,
          quotaRetryCount: params.quotaRetryCount,
          maxQuotaRetries: VERCEL_GATEWAY_VIDEO_QUOTA_MAX_RETRIES,
          limiter: 'bottleneck',
          limiterId: VERCEL_GATEWAY_VIDEO_LIMITER_ID,
        },
      },
      updatedAt: startedAt,
    })
    .where(
      and(
        eq(aiGenerationsTable.id, params.generationId),
        eq(aiGenerationsTable.status, 'PROCESSING'),
        eq(aiGenerationsTable.isDeleted, false),
      ),
    )
    .returning();

  if (!claimedGeneration) {
    const latestGeneration = await db
      .select({
        status: aiGenerationsTable.status,
        isDeleted: aiGenerationsTable.isDeleted,
      })
      .from(aiGenerationsTable)
      .where(eq(aiGenerationsTable.id, params.generationId))
      .then((rows) => rows[0]);

    logger.warn(
      {
        generationId: params.generationId,
        status: latestGeneration?.status,
        isDeleted: latestGeneration?.isDeleted,
      },
      'Skipping Vercel AI Gateway video generation because the pending claim no longer succeeded',
    );

    return {
      claimed: false as const,
      status: latestGeneration?.status ?? 'PENDING',
    };
  }

  logger.info(
    {
      generationId: params.generationId,
      mode: params.context.mode,
      model: params.context.model,
      startedAt: startedAt.toISOString(),
    },
    'Vercel AI Gateway video quota slot acquired',
  );

  return { claimed: true as const, startedAt };
}

async function markVercelGatewayVideoQuotaCompleted(params: {
  generationId: string;
  status: 'succeeded' | 'failed';
  error?: unknown;
}) {
  const completedAt = new Date();
  const metadata = await getLatestGenerationMetadata(params.generationId);
  const quotaMetadata = asMetadataRecord(metadata.vercelGatewayVideoQuota);

  await db
    .update(aiGenerationsTable)
    .set({
      metadata: {
        ...metadata,
        vercelGatewayVideoQuota: {
          ...quotaMetadata,
          state: params.status,
          completedAt: completedAt.toISOString(),
          ...(params.error
            ? { errorMessage: getErrorMessage(params.error) }
            : {}),
        },
      },
      updatedAt: completedAt,
    })
    .where(eq(aiGenerationsTable.id, params.generationId));
}

async function markVercelGatewayVideoQuotaWaiting(params: {
  generationId: string;
  context: LogoAnimationVideoGenerationContext;
  error: unknown;
  nextRetryAt: Date;
  quotaRetryCount: number;
}) {
  const rateLimitedAt = new Date();
  const metadata = await getLatestGenerationMetadata(params.generationId);
  const quotaMetadata = asMetadataRecord(metadata.vercelGatewayVideoQuota);

  await db
    .update(aiGenerationsTable)
    .set({
      errorMessage: null,
      metadata: {
        ...metadata,
        vercelGatewayVideoQuota: {
          ...quotaMetadata,
          provider: params.context.provider,
          state: 'waiting',
          mode: params.context.mode,
          model: params.context.model,
          windowMs: VERCEL_GATEWAY_VIDEO_QUOTA_WINDOW_MS,
          nextRetryAt: params.nextRetryAt.toISOString(),
          quotaRetryCount: params.quotaRetryCount,
          maxQuotaRetries: VERCEL_GATEWAY_VIDEO_QUOTA_MAX_RETRIES,
          limiter: 'bottleneck',
          limiterId: VERCEL_GATEWAY_VIDEO_LIMITER_ID,
          lastRateLimitedAt: rateLimitedAt.toISOString(),
          errorMessage: getErrorMessage(params.error),
        },
      },
      updatedAt: rateLimitedAt,
    })
    .where(
      and(
        eq(aiGenerationsTable.id, params.generationId),
        eq(aiGenerationsTable.status, 'PROCESSING'),
        eq(aiGenerationsTable.isDeleted, false),
      ),
    );
}

function buildVercelGatewayVideoQuotaRetriesExhaustedError(params: {
  error: unknown;
  quotaRetryCount: number;
}) {
  return new Error(
    `Vercel AI Gateway video quota remained unavailable after ${params.quotaRetryCount} retries: ${getErrorMessage(params.error)}`,
  );
}

async function markVercelGatewayVideoQuotaCompletedSafely(params: {
  generationId: string;
  status: 'succeeded' | 'failed';
  error?: unknown;
}) {
  try {
    await markVercelGatewayVideoQuotaCompleted(params);
  } catch (releaseError) {
    logger.warn(
      { error: releaseError, generationId: params.generationId },
      'Failed to mark Vercel AI Gateway video quota slot complete',
    );
  }
}

async function runVercelGatewayVideoQuotaAttempt<T>(params: {
  generationId: string;
  context: LogoAnimationVideoGenerationContext;
  operation: () => Promise<T>;
  quotaRetryCount: number;
  abortSignal?: AbortSignal;
}) {
  const { abortSignal, context, generationId, operation, quotaRetryCount } =
    params;
  const claimResult = await markGenerationProcessingForGatewayVideo({
    context,
    generationId,
    quotaRetryCount,
  });
  if (!claimResult.claimed) {
    return {
      completed: true as const,
      skipped: true as const,
      status: claimResult.status,
    };
  }

  try {
    const result = await operation();
    await markVercelGatewayVideoQuotaCompletedSafely({
      generationId,
      status: 'succeeded',
    });

    return { completed: true as const, skipped: false as const, result };
  } catch (error) {
    if (isVercelGatewayVideoQuotaError(error)) {
      if (quotaRetryCount >= VERCEL_GATEWAY_VIDEO_QUOTA_MAX_RETRIES) {
        const retryLimitError =
          buildVercelGatewayVideoQuotaRetriesExhaustedError({
            error,
            quotaRetryCount,
          });
        await markVercelGatewayVideoQuotaCompletedSafely({
          generationId,
          status: 'failed',
          error: retryLimitError,
        });
        throw retryLimitError;
      }

      const nextRetryAt = new Date(
        Date.now() + VERCEL_GATEWAY_VIDEO_QUOTA_WINDOW_MS,
      );
      await markVercelGatewayVideoQuotaWaiting({
        generationId,
        context,
        error,
        nextRetryAt,
        quotaRetryCount: quotaRetryCount + 1,
      });
      logger.warn(
        {
          error,
          generationId,
          mode: context.mode,
          model: context.model,
          nextRetryAt: nextRetryAt.toISOString(),
          quotaRetryCount: quotaRetryCount + 1,
          maxQuotaRetries: VERCEL_GATEWAY_VIDEO_QUOTA_MAX_RETRIES,
          waitMs: VERCEL_GATEWAY_VIDEO_QUOTA_WINDOW_MS,
        },
        'Vercel AI Gateway video quota rejected request; waiting before retry',
      );
      await sleep(VERCEL_GATEWAY_VIDEO_QUOTA_WINDOW_MS, abortSignal);
      return { completed: false as const };
    }

    await markVercelGatewayVideoQuotaCompletedSafely({
      generationId,
      status: 'failed',
      error,
    });
    throw error;
  }
}

async function runWithVercelGatewayVideoQuota<T>(
  generationId: string,
  context: LogoAnimationVideoGenerationContext,
  operation: () => Promise<T>,
  abortSignal?: AbortSignal,
): Promise<T> {
  logger.info(
    { generationId, mode: context.mode, model: context.model },
    'Queueing Vercel AI Gateway video generation behind limiter',
  );

  return await vercelGatewayVideoLimiter.schedule(async () => {
    let quotaRetryCount = 0;

    while (true) {
      const attempt = await runVercelGatewayVideoQuotaAttempt({
        context,
        generationId,
        operation,
        quotaRetryCount,
        abortSignal,
      });

      if (attempt.completed) {
        if (attempt.skipped) {
          throw new AnimationGenerationPendingClaimLostError({
            generationId,
            status: attempt.status,
          });
        }

        return attempt.result;
      }

      quotaRetryCount += 1;
    }
  });
}

function buildAnimationTokenUsageEntries(
  result: Awaited<ReturnType<typeof runLogoAnimationWorkflow>>,
) {
  const entries: Array<{
    model: string;
    inputTokens: number;
    outputTokens: number;
  }> = [];

  const strategistUsage = result.analysis.tokenUsage;
  const hasStrategistUsage =
    strategistUsage?.inputTokens != null ||
    strategistUsage?.outputTokens != null ||
    strategistUsage?.totalTokens != null;

  if (hasStrategistUsage) {
    entries.push({
      model: result.analysis.model,
      inputTokens: strategistUsage?.inputTokens ?? 0,
      outputTokens: strategistUsage?.outputTokens ?? 0,
    });
  }

  const sheetUsage = result.animationSheet?.tokenUsage;
  const hasSheetUsage =
    sheetUsage?.inputTokens != null ||
    sheetUsage?.outputTokens != null ||
    sheetUsage?.totalTokens != null;

  if (result.animationSheet && hasSheetUsage) {
    entries.push({
      model: result.animationSheet.model,
      inputTokens: sheetUsage?.inputTokens ?? 0,
      outputTokens: sheetUsage?.outputTokens ?? 0,
    });
  }

  return entries;
}

async function markAnimationProcessing(generation: AiGenerationRow) {
  const processingStartedAt = new Date();
  const [claimedGeneration] = await db
    .update(aiGenerationsTable)
    .set({
      status: 'PROCESSING',
      startedAt: generation.startedAt ?? processingStartedAt,
      errorMessage: null,
      updatedAt: processingStartedAt,
    })
    .where(
      and(
        eq(aiGenerationsTable.id, generation.id),
        eq(aiGenerationsTable.status, 'PENDING'),
        eq(aiGenerationsTable.isDeleted, false),
      ),
    )
    .returning();

  if (claimedGeneration) {
    return { claimed: true as const };
  }

  const latestGeneration = await db
    .select({
      status: aiGenerationsTable.status,
      isDeleted: aiGenerationsTable.isDeleted,
    })
    .from(aiGenerationsTable)
    .where(eq(aiGenerationsTable.id, generation.id))
    .then((rows) => rows[0]);

  logger.warn(
    {
      generationId: generation.id,
      status: latestGeneration?.status,
      isDeleted: latestGeneration?.isDeleted,
    },
    'Skipping animation generation because the pending claim no longer succeeded',
  );

  return {
    claimed: false as const,
    status: latestGeneration?.status ?? generation.status,
  };
}

function buildLogoAnimationWorkflowInput(params: {
  animationInput: AnimationGenerationInput;
  domain: AiGenerationRow['domain'];
  referenceLogoUrl: string;
  storage: ReturnType<typeof getStorage>;
}): LogoAnimationWorkflowInput {
  const { animationInput, domain, referenceLogoUrl, storage } = params;

  if (animationInput.mode === 'cinematic') {
    return {
      mode: 'cinematic',
      domain,
      description: animationInput.description,
      sourceMode: animationInput.sourceMode,
      motionPreset: animationInput.motionPreset,
      model: animationInput.model,
      referenceLogoUrl,
      storage,
    };
  }

  if (animationInput.mode === 'sheet-guided') {
    return {
      mode: 'sheet-guided',
      domain,
      description: animationInput.description,
      model: animationInput.model,
      sheetModel: animationInput.sheetModel ?? 'gpt-image-2',
      referenceLogoUrl,
      storage,
    };
  }

  return {
    mode: 'looped',
    domain,
    description: animationInput.description,
    motionPreset: animationInput.motionPreset,
    motionIntensity: animationInput.motionIntensity,
    model: animationInput.model,
    referenceLogoUrl,
    storage,
  };
}

export async function generateLogoAnimation({
  generationId,
}: GenerateLogoAnimationParams) {
  const generation = await db
    .select()
    .from(aiGenerationsTable)
    .where(eq(aiGenerationsTable.id, generationId))
    .then((rows) => rows[0]);

  assertAnimationGeneration(generation, generationId);

  const animationInput = generation.input;

  if (generation.isDeleted) {
    logger.info(
      { generationId },
      'Skipping deleted animation generation before processing',
    );
    return {
      generationId,
      status: generation.status,
    };
  }

  if (generation.status !== 'PENDING') {
    logger.info(
      { generationId, status: generation.status },
      'Skipping animation generation in status %s',
      generation.status,
    );
    return {
      generationId,
      status: generation.status,
    };
  }

  const claimResult = await markAnimationProcessing(generation);
  if (!claimResult.claimed) {
    return {
      generationId,
      status: claimResult.status,
    };
  }

  try {
    const referenceLogo = await db
      .select()
      .from(aiGenerationsTable)
      .where(
        and(
          eq(aiGenerationsTable.id, generation.referenceGenerationId),
          eq(aiGenerationsTable.type, 'logo'),
          eq(aiGenerationsTable.isDeleted, false),
        ),
      )
      .then((rows) => rows[0]);

    if (!referenceLogo || referenceLogo.output.type !== 'logo') {
      throw new Error(
        `Reference logo ${generation.referenceGenerationId} was not found`,
      );
    }

    const referenceLogoOutput = referenceLogo.output;
    const referenceLogoUrl = generateUrlFromStoragePath(
      referenceLogoOutput.storagePath,
      config.CLOUD_FRONT_DOMAIN,
    );
    const storage = getStorage(config.AI_BUCKET_FOLDERS.ANIMATIONS);

    const workflowInput = buildLogoAnimationWorkflowInput({
      animationInput,
      domain: generation.domain,
      referenceLogoUrl,
      storage,
    });

    const animationResult = await heartbeatWhile(
      (abortSignal) =>
        runLogoAnimationWorkflow(workflowInput, {
          abortSignal,
          runVercelGatewayVideoGeneration: (context, operation) =>
            runWithVercelGatewayVideoQuota(
              generationId,
              context,
              operation,
              abortSignal,
            ),
        }),
      {
        stage: 'animation-workflow',
        generationId,
      },
    );

    const metadata = await getLatestGenerationMetadata(generationId);
    const sheetGuidedMetadata =
      animationResult.analysis.mode === 'sheet-guided'
        ? {
            logoVisualSummary: animationResult.analysis.logoVisualSummary,
            animationConcept: animationResult.analysis.animationConcept,
            shapeNotes: animationResult.analysis.shapeNotes,
            stagePlan: animationResult.analysis.stagePlan,
            sheetModel: animationResult.animationSheet?.model,
            animationSheetStoragePath:
              animationResult.animationSheet?.storagePath,
            animationSheetUrl: animationResult.animationSheet?.url,
            animationSheetPrompt: animationResult.animationSheet?.prompt,
            videoPrompt: animationResult.analysis.videoPrompt,
          }
        : {};
    const motionPresetMetadata =
      animationResult.analysis.mode === 'sheet-guided'
        ? {}
        : {
            resolvedMotionPreset: animationResult.analysis.resolvedMotionPreset,
          };

    await db
      .update(aiGenerationsTable)
      .set({
        status: 'SUCCEEDED',
        finishedAt: new Date(),
        errorMessage: null,
        output: {
          type: 'animation',
          storagePath: animationResult.video.storagePath,
          thumbnailStoragePath: animationResult.video.thumbnailStoragePath,
          mimeType: animationResult.video.mimeType,
          model: animationResult.video.model,
        },
        metadata: {
          ...metadata,
          animationMode: animationResult.analysis.mode,
          brandAttributes: animationResult.analysis.brandAttributes,
          targetAudience: animationResult.analysis.targetAudience,
          motionDirection: animationResult.analysis.direction,
          motionRationale: animationResult.analysis.rationale,
          prompt: animationResult.prompt,
          ...motionPresetMetadata,
          strategistModel: animationResult.analysis.model,
          ...sheetGuidedMetadata,
          warnings: animationResult.warnings,
          providerMetadata: animationResult.providerMetadata,
        },
        tokenUsage: buildAnimationTokenUsageEntries(animationResult),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiGenerationsTable.id, generationId),
          eq(aiGenerationsTable.status, 'PROCESSING'),
          eq(aiGenerationsTable.isDeleted, false),
        ),
      );

    return {
      generationId,
      status: 'SUCCEEDED' as const,
    };
  } catch (error) {
    if (isActivityCancelledError(error)) {
      logger.warn({ generationId }, 'Logo animation generation cancelled');
      throw error;
    }

    if (error instanceof AnimationGenerationPendingClaimLostError) {
      logger.warn(
        { generationId, status: error.status },
        'Skipping animation generation after losing the pending claim',
      );
      return {
        generationId,
        status: error.status,
      };
    }

    const failedAt = new Date();
    const message =
      error instanceof Error
        ? error.message
        : 'Logo animation generation failed';
    const metadata = await getLatestGenerationMetadata(generationId);

    await db
      .update(aiGenerationsTable)
      .set({
        status: 'FAILED',
        finishedAt: failedAt,
        errorMessage: message,
        metadata: {
          ...metadata,
          animationFailure: buildAnimationFailureMetadata(error, failedAt),
        },
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiGenerationsTable.id, generationId),
          eq(aiGenerationsTable.status, 'PROCESSING'),
          eq(aiGenerationsTable.isDeleted, false),
        ),
      );

    logger.error({ error, generationId }, 'Logo animation generation failed');
    throw error;
  }
}
