import { Context } from '@temporalio/activity';
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
  runLogoWorkflow,
  runMarketingWorkflow,
  type LogoWorkflowInput,
  type MarketingWorkflowInput,
} from '@namefi-astra/ai';
import {
  buildSlackErrorFields,
  sendJustaingSlackAlert,
} from '#lib/slack/justaing-alerts';
import { getTemporalWorkflowRunUrl } from './default/get-workflow-url';

const logger = createLogger({ module: 'studio-generation-activities' });

export interface GenerateStudioAnimationParams {
  generationId: string;
}

export interface GenerateStudioLogoParams {
  generationId: string;
}

export interface GenerateStudioPosterParams {
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

function buildStudioGenerationFailureMetadata(error: unknown, failedAt: Date) {
  const message =
    error instanceof Error ? error.message : 'AI generation failed';
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
    ...buildProviderFailureMetadata(providerFailure),
    ...buildErrorCauseMetadata(getErrorProperty(error, 'cause')),
  };
}

function getStudioGenerationLabel(
  generation: typeof aiGenerationsTable.$inferSelect,
) {
  if (generation.type === 'marketing') {
    return 'poster';
  }

  if (generation.type === 'animation') {
    return 'animation';
  }

  return 'logo';
}

function getStudioGenerationModel(
  generation: typeof aiGenerationsTable.$inferSelect,
) {
  if (generation.input.type === 'logo') {
    return generation.input.imageModel;
  }

  if (generation.input.type === 'marketing') {
    return generation.input.imageModel;
  }

  return generation.input.model;
}

function getStudioGenerationMode(
  generation: typeof aiGenerationsTable.$inferSelect,
) {
  if (generation.input.type === 'animation') {
    return generation.input.mode;
  }

  if (generation.input.type === 'marketing') {
    return generation.input.collateralType;
  }

  return generation.input.logoType;
}

async function getCurrentTemporalAction() {
  try {
    const info = Context.current().info;
    const workflowId = info.workflowExecution.workflowId;
    const runId = info.workflowExecution.runId;

    return {
      extraData: {
        workflowType: info.workflowType,
        workflowId,
        runId,
        taskQueue: info.taskQueue,
      },
      action: {
        text: 'Go To Workflow',
        url: await getTemporalWorkflowRunUrl(workflowId, runId),
      },
    };
  } catch {
    return { extraData: {}, action: undefined };
  }
}

async function sendStudioGenerationFailureAlert({
  generation,
  error,
  message,
}: {
  generation: typeof aiGenerationsTable.$inferSelect;
  error: unknown;
  message: string;
}) {
  const label = getStudioGenerationLabel(generation);
  const temporal = await getCurrentTemporalAction();

  await sendJustaingSlackAlert({
    title: `[Studio] ${label} generation failed for ${generation.domain}`,
    message,
    extraData: {
      generationId: generation.id,
      generationType: generation.type,
      userId: generation.userId,
      domain: generation.domain,
      model: getStudioGenerationModel(generation),
      mode: getStudioGenerationMode(generation),
      referenceGenerationId: generation.referenceGenerationId ?? 'none',
      ...temporal.extraData,
      ...buildSlackErrorFields(error, message),
    },
    action: temporal.action,
  });
}

type ImageGenerationWorkflowResult =
  | Awaited<ReturnType<typeof runLogoWorkflow>>
  | Awaited<ReturnType<typeof runMarketingWorkflow>>;

function buildImageGenerationTokenUsageEntries(
  result: ImageGenerationWorkflowResult,
) {
  return [
    {
      model: result.analysis.model,
      inputTokens: result.analysis.tokenUsage?.inputTokens ?? 0,
      outputTokens: result.analysis.tokenUsage?.outputTokens ?? 0,
    },
    {
      model: result.image.model,
      inputTokens: result.image.tokenUsage?.inputTokens ?? 0,
      outputTokens: result.image.tokenUsage?.outputTokens ?? 0,
    },
  ];
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

export async function generateStudioLogo({
  generationId,
}: GenerateStudioLogoParams) {
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
    generation.type !== 'logo' ||
    generation.input.type !== 'logo' ||
    generation.output.type !== 'logo'
  ) {
    throw new Error(`AI generation ${generationId} is not a logo job`);
  }

  if (generation.isDeleted) {
    logger.info({ generationId }, 'Skipping deleted logo generation');
    return {
      generationId,
      status: generation.status,
    };
  }

  if (generation.status !== 'PENDING') {
    logger.info(
      { generationId, status: generation.status },
      'Skipping logo generation in status %s',
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
      'Skipping logo generation because the pending claim no longer succeeded',
    );

    return {
      generationId,
      status: latestGeneration?.status ?? generation.status,
    };
  }

  try {
    const logoInput = generation.input;
    const logoResult = await heartbeatWhile(
      (abortSignal) =>
        runLogoWorkflow(
          {
            domain: generation.domain,
            description: logoInput.description,
            preferredType:
              logoInput.logoType as LogoWorkflowInput['preferredType'],
            preferredStyle:
              logoInput.logoStyle as LogoWorkflowInput['preferredStyle'],
            textTreatment:
              logoInput.textTreatment as LogoWorkflowInput['textTreatment'],
            typography: logoInput.typography as LogoWorkflowInput['typography'],
            imageModel: logoInput.imageModel as LogoWorkflowInput['imageModel'],
            storage: getStorage(config.AI_BUCKET_FOLDERS.LOGOS),
          },
          { abortSignal },
        ),
      {
        stage: 'logo-workflow',
        generationId,
      },
    );

    const resolvedConcept = logoResult.concept.logoConcept;
    const metadata = asMetadataRecord(generation.metadata);

    await db
      .update(aiGenerationsTable)
      .set({
        status: 'SUCCEEDED',
        finishedAt: new Date(),
        errorMessage: null,
        output: {
          type: 'logo',
          storagePath: logoResult.image.storagePath,
          logoType: resolvedConcept.type ?? logoInput.logoType,
          logoStyle: resolvedConcept.style ?? logoInput.logoStyle,
          textTreatment:
            resolvedConcept.textTreatment ?? logoInput.textTreatment,
          typography: resolvedConcept.typography ?? logoInput.typography,
          imageModel: logoResult.image.model,
        },
        metadata: {
          ...metadata,
          logoPromptVersion: 'logo-strategy-v2',
        },
        tokenUsage: buildImageGenerationTokenUsageEntries(logoResult),
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
    const failedAt = new Date();
    const message =
      error instanceof Error ? error.message : 'Logo generation failed';
    const metadata = asMetadataRecord(claimedGeneration.metadata);

    await db
      .update(aiGenerationsTable)
      .set({
        status: 'FAILED',
        finishedAt: failedAt,
        errorMessage: message,
        metadata: {
          ...metadata,
          logoFailure: buildStudioGenerationFailureMetadata(error, failedAt),
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

    await sendStudioGenerationFailureAlert({
      generation: claimedGeneration,
      error,
      message,
    });

    logger.error({ error, generationId }, 'Logo generation failed');
    throw error;
  }
}

export async function generateStudioPoster({
  generationId,
}: GenerateStudioPosterParams) {
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
    generation.type !== 'marketing' ||
    generation.input.type !== 'marketing' ||
    generation.output.type !== 'marketing'
  ) {
    throw new Error(`AI generation ${generationId} is not a poster job`);
  }

  if (!generation.referenceGenerationId) {
    throw new Error(
      `Poster generation ${generationId} is missing a reference logo`,
    );
  }

  if (generation.isDeleted) {
    logger.info({ generationId }, 'Skipping deleted poster generation');
    return {
      generationId,
      status: generation.status,
    };
  }

  if (generation.status !== 'PENDING') {
    logger.info(
      { generationId, status: generation.status },
      'Skipping poster generation in status %s',
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
      'Skipping poster generation because the pending claim no longer succeeded',
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
          eq(aiGenerationsTable.status, 'SUCCEEDED'),
          eq(aiGenerationsTable.isDeleted, false),
        ),
      )
      .then((rows) => rows[0]);

    if (
      !referenceLogo ||
      referenceLogo.output.type !== 'logo' ||
      !referenceLogo.output.storagePath
    ) {
      throw new Error(
        `Reference logo ${generation.referenceGenerationId} was not found`,
      );
    }

    const posterInput = generation.input;
    const referenceLogoUrl = generateUrlFromStoragePath(
      referenceLogo.output.storagePath,
      config.CLOUD_FRONT_DOMAIN,
    );

    const marketingResult = await heartbeatWhile(
      (abortSignal) =>
        runMarketingWorkflow(
          {
            domain: generation.domain,
            description: posterInput.description,
            collateralType: posterInput.collateralType,
            imageModel:
              posterInput.imageModel as MarketingWorkflowInput['imageModel'],
            storage: getStorage(config.AI_BUCKET_FOLDERS.SOCIAL),
            referenceLogoUrl,
          },
          { abortSignal },
        ),
      {
        stage: 'poster-workflow',
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
          type: 'marketing',
          storagePath: marketingResult.image.storagePath,
          collateralType: marketingResult.analysis.resolvedCollateralType,
          imageModel: marketingResult.image.model,
        },
        metadata,
        tokenUsage: buildImageGenerationTokenUsageEntries(marketingResult),
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
    const failedAt = new Date();
    const message =
      error instanceof Error ? error.message : 'Poster generation failed';
    const metadata = asMetadataRecord(claimedGeneration.metadata);

    await db
      .update(aiGenerationsTable)
      .set({
        status: 'FAILED',
        finishedAt: failedAt,
        errorMessage: message,
        metadata: {
          ...metadata,
          posterFailure: buildStudioGenerationFailureMetadata(error, failedAt),
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

    await sendStudioGenerationFailureAlert({
      generation: claimedGeneration,
      error,
      message,
    });

    logger.error({ error, generationId }, 'Poster generation failed');
    throw error;
  }
}

export async function generateStudioAnimation({
  generationId,
}: GenerateStudioAnimationParams) {
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
          eq(aiGenerationsTable.status, 'SUCCEEDED'),
          eq(aiGenerationsTable.isDeleted, false),
        ),
      )
      .then((rows) => rows[0]);

    if (
      !referenceLogo ||
      referenceLogo.output.type !== 'logo' ||
      !referenceLogo.output.storagePath
    ) {
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

    const workflowInput =
      animationInput.mode === 'cinematic'
        ? {
            mode: 'cinematic' as const,
            domain: generation.domain,
            description: animationInput.description,
            sourceMode: animationInput.sourceMode,
            motionPreset: animationInput.motionPreset,
            model: animationInput.model,
            referenceLogoUrl,
            storage,
          }
        : animationInput.mode === 'sheet-guided'
          ? {
              mode: 'sheet-guided' as const,
              domain: generation.domain,
              description: animationInput.description,
              model: animationInput.model,
              sheetModel: animationInput.sheetModel ?? 'gpt-image-2',
              referenceLogoUrl,
              storage,
            }
          : {
              mode: 'looped' as const,
              domain: generation.domain,
              description: animationInput.description,
              motionPreset: animationInput.motionPreset,
              motionIntensity: animationInput.motionIntensity,
              model: animationInput.model,
              referenceLogoUrl,
              storage,
            };

    const animationResult = await heartbeatWhile(
      (abortSignal) => runLogoAnimationWorkflow(workflowInput, { abortSignal }),
      {
        stage: 'animation-workflow',
        generationId,
      },
    );

    const metadata = asMetadataRecord(generation.metadata);
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
    const failedAt = new Date();
    const message =
      error instanceof Error
        ? error.message
        : 'Logo animation generation failed';
    const metadata = asMetadataRecord(claimedGeneration.metadata);

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

    await sendStudioGenerationFailureAlert({
      generation: claimedGeneration,
      error,
      message,
    });

    logger.error({ error, generationId }, 'Logo animation generation failed');
    throw error;
  }
}

export const generateLogoAnimation = generateStudioAnimation;
