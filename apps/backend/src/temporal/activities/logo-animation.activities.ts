import { Context } from '@temporalio/activity';
import { and, eq } from 'drizzle-orm';
import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { db, aiGenerationsTable } from '@namefi-astra/db';
import {
  generateUrlFromStoragePath,
  createS3Client,
} from '@namefi-astra/storage';
import { runLogoAnimationWorkflow } from '@namefi-astra/ai';

const logger = createLogger({ module: 'logo-animation-activities' });

export interface GenerateLogoAnimationParams {
  generationId: string;
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

function buildAnimationTokenUsageEntries(
  result: Awaited<ReturnType<typeof runLogoAnimationWorkflow>>,
) {
  const tokenUsage = result.analysis.tokenUsage;
  const hasUsage =
    tokenUsage?.inputTokens != null ||
    tokenUsage?.outputTokens != null ||
    tokenUsage?.totalTokens != null;

  if (!hasUsage) {
    return [];
  }

  return [
    {
      model: result.analysis.model,
      inputTokens: tokenUsage?.inputTokens ?? 0,
      outputTokens: tokenUsage?.outputTokens ?? 0,
    },
  ];
}

export async function generateLogoAnimation({
  generationId,
}: GenerateLogoAnimationParams) {
  const now = new Date();
  const generation = await db
    .select()
    .from(aiGenerationsTable)
    .where(eq(aiGenerationsTable.id, generationId))
    .then((rows) => rows[0]);

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

  const [claimedGeneration] = await db
    .update(aiGenerationsTable)
    .set({
      status: 'PROCESSING',
      startedAt: generation.startedAt ?? now,
      errorMessage: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(aiGenerationsTable.id, generationId),
        eq(aiGenerationsTable.status, 'PENDING'),
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
      .where(eq(aiGenerationsTable.id, generationId))
      .then((rows) => rows[0]);

    logger.warn(
      {
        generationId,
        status: latestGeneration?.status,
        isDeleted: latestGeneration?.isDeleted,
      },
      'Skipping animation generation because the pending claim no longer succeeded',
    );

    return {
      generationId,
      status: latestGeneration?.status ?? generation.status,
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
    const workflowInput =
      animationInput.mode === 'cinematic'
        ? {
            mode: 'cinematic' as const,
            domain: generation.domain,
            description: animationInput.description,
            sourceMode: animationInput.sourceMode,
            motionPreset: animationInput.motionPreset,
            model: animationInput.model,
            referenceLogoUrl: generateUrlFromStoragePath(
              referenceLogoOutput.storagePath,
              config.CLOUD_FRONT_DOMAIN,
            ),
            storage: getStorage(config.AI_BUCKET_FOLDERS.ANIMATIONS),
          }
        : {
            mode: 'looped' as const,
            domain: generation.domain,
            description: animationInput.description,
            motionPreset: animationInput.motionPreset,
            motionIntensity: animationInput.motionIntensity,
            model: animationInput.model,
            referenceLogoUrl: generateUrlFromStoragePath(
              referenceLogoOutput.storagePath,
              config.CLOUD_FRONT_DOMAIN,
            ),
            storage: getStorage(config.AI_BUCKET_FOLDERS.ANIMATIONS),
          };

    const animationResult = await heartbeatWhile(
      (abortSignal) => runLogoAnimationWorkflow(workflowInput, { abortSignal }),
      {
        stage: 'animation-workflow',
        generationId,
      },
    );

    const metadata = asMetadataRecord(generation.metadata);

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
          resolvedMotionPreset: animationResult.analysis.resolvedMotionPreset,
          strategistModel: animationResult.analysis.model,
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
    const message =
      error instanceof Error
        ? error.message
        : 'Logo animation generation failed';

    await db
      .update(aiGenerationsTable)
      .set({
        status: 'FAILED',
        finishedAt: new Date(),
        errorMessage: message,
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
