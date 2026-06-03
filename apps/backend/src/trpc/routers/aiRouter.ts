import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared';
import { generateLogoAnimationWorkflow } from '#temporal/workflows/logo-animation.workflow';
import { db } from '@namefi-astra/db';
import {
  getAiTokenUsageCreditCost,
  getAiGenerationCreditCost as resolveAiGenerationCreditCost,
  getLeadgenRunCreditEstimate,
  type AiGenerationCreditType,
} from '@namefi-astra/common/ai-generation-credits';
import {
  aiCreditAwardsTable,
  aiGenerationsTable,
  internalAiGenerationsTable,
  leadgenEventsTable,
  leadgenRunsTable,
} from '@namefi-astra/db/schema';
import {
  ANIMATION_MOTION_INTENSITY_IDS,
  ANIMATION_SOURCE_MODE_IDS,
  CINEMATIC_ANIMATION_MODEL_IDS,
  CINEMATIC_ANIMATION_MOTION_PRESET_IDS,
  LOGO_STYLE_INPUT_IDS,
  LOGO_TEXT_TREATMENT_INPUT_IDS,
  LOGO_TYPE_INPUT_IDS,
  LOGO_TYPOGRAPHY_INPUT_IDS,
  LOOPED_ANIMATION_MODEL_IDS,
  LOOPED_ANIMATION_MOTION_PRESET_IDS,
  getLeadgenPrimaryResearchModel,
  runLogoWorkflow,
  runMarketingWorkflow,
} from '@namefi-astra/ai';
import {
  createS3Client,
  generateUrlFromStoragePath,
} from '@namefi-astra/storage';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { WorkflowNotFoundError } from '@temporalio/common';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, inArray, max, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { aiContract } from '@namefi-astra/common/contract/ai-contract';
import { protectedProcedure, publicProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';
import { resolveOwnedLogoReference } from './ai-generation-references';

const logger = createLogger({ module: 'ai-router' });

const s3Client = createS3Client({
  AWS_ACCESS_KEY_ID: secrets.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: secrets.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: config.AWS_REGION,
});

const storageBaseConfig = {
  bucketName: config.STORAGE_BUCKET,
  cloudfrontDomain: config.CLOUD_FRONT_DOMAIN,
  s3Client,
};

const imageModelIds = [
  'gpt-image-1',
  'gpt-image-1.5',
  'gpt-image-2',
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
] as const;

type AiGenerationRow = typeof aiGenerationsTable.$inferSelect;
type InternalAiGenerationRow = typeof internalAiGenerationsTable.$inferSelect;
type AssetOutput =
  | AiGenerationRow['output']
  | InternalAiGenerationRow['output'];
type AiGenerationCreditRow = Pick<AiGenerationRow, 'input' | 'output' | 'type'>;
type LeadgenRunCreditRow = Pick<
  typeof leadgenRunsTable.$inferSelect,
  'id' | 'input' | 'metadata' | 'reasoningEffort' | 'tokenUsage'
>;
type AnimationWorkflowStartResult =
  | { state: 'started' }
  | { state: 'not-found' | 'unknown'; error: unknown };

const ANIMATION_WORKFLOW_START_STATE_UNCONFIRMED = 'UNCONFIRMED';
const ANIMATION_WORKFLOW_START_STATE_CONFIRMED = 'CONFIRMED';
const ANIMATION_WORKFLOW_START_RECONCILIATION_INTERVAL_MS = 30_000;
const ANIMATION_WORKFLOW_START_ERROR_MESSAGE =
  'Failed to start logo animation workflow';

function createStorageConfig(baseFolder: string) {
  return {
    ...storageBaseConfig,
    baseFolder,
  };
}

function createInsufficientGenerationCreditsError(params: {
  maxCredits: number;
  remainingCredits: number;
  requestedCredits: number;
}) {
  const requestedLabel = params.requestedCredits === 1 ? 'credit' : 'credits';
  const remainingLabel = params.remainingCredits === 1 ? 'credit' : 'credits';

  return new TRPCError({
    code: 'FORBIDDEN',
    message: `This generation needs ${params.requestedCredits} AI ${requestedLabel}, but you have ${params.remainingCredits} ${remainingLabel} left this month. Your monthly limit is ${params.maxCredits} AI credits.`,
  });
}

function normalizeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function asMetadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function buildLogoAnimationWorkflowId(generationId: string) {
  return `logo-animation-${generationId}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getAnimationWorkflowStartState(metadata: unknown) {
  const record = asMetadataRecord(metadata);
  return typeof record.workflowStartState === 'string'
    ? record.workflowStartState
    : undefined;
}

function getAnimationWorkflowStartCheckedAt(metadata: unknown) {
  const record = asMetadataRecord(metadata);
  if (typeof record.workflowStartCheckedAt !== 'string') {
    return undefined;
  }

  const checkedAt = new Date(record.workflowStartCheckedAt);
  return Number.isNaN(checkedAt.getTime()) ? undefined : checkedAt;
}

function isPendingUnconfirmedAnimationGeneration(generation: AiGenerationRow) {
  return (
    generation.type === 'animation' &&
    generation.status === 'PENDING' &&
    !generation.isDeleted &&
    getAnimationWorkflowStartState(generation.metadata) ===
      ANIMATION_WORKFLOW_START_STATE_UNCONFIRMED
  );
}

function shouldReconcileUnconfirmedAnimationStart(
  generation: AiGenerationRow,
  now = new Date(),
) {
  if (!isPendingUnconfirmedAnimationGeneration(generation)) {
    return false;
  }

  const lastCheckedAt =
    getAnimationWorkflowStartCheckedAt(generation.metadata) ??
    generation.updatedAt ??
    generation.createdAt;

  return (
    now.getTime() - lastCheckedAt.getTime() >=
    ANIMATION_WORKFLOW_START_RECONCILIATION_INTERVAL_MS
  );
}

export async function startLogoAnimationWorkflowWithRecovery(params: {
  generationId: string;
  workflowId: string;
}): Promise<AnimationWorkflowStartResult> {
  const startWorkflow = async (
    workflowIdConflictPolicy: 'FAIL' | 'USE_EXISTING',
  ) =>
    await temporalClient.workflow.start(generateLogoAnimationWorkflow, {
      args: [{ generationId: params.generationId }],
      taskQueue: TEMPORAL_QUEUES.DEFAULT,
      workflowId: params.workflowId,
      workflowIdReusePolicy: 'ALLOW_DUPLICATE_FAILED_ONLY',
      workflowIdConflictPolicy,
    });

  try {
    await startWorkflow('FAIL');
    return { state: 'started' };
  } catch (error) {
    logger.warn(
      {
        error,
        generationId: params.generationId,
        workflowId: params.workflowId,
      },
      'Animation workflow start failed; retrying with workflow reconciliation',
    );

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await startWorkflow('USE_EXISTING');
        return { state: 'started' };
      } catch (retryError) {
        const startState = await getAnimationStartStateAfterError(
          params.workflowId,
        );

        if (startState === 'started') {
          return { state: 'started' };
        }

        if (startState === 'not-found' && attempt === 0) {
          await sleep(250);
          continue;
        }

        if (startState !== 'unknown') {
          return { state: startState, error: retryError };
        }

        await sleep(250);
      }
    }

    return { state: 'unknown', error };
  }
}

async function markAnimationWorkflowStartUnconfirmed(
  generation: AiGenerationRow,
  errorMessage: string,
) {
  const metadata = asMetadataRecord(generation.metadata);
  const now = new Date();

  const [updatedRow] = await db
    .update(aiGenerationsTable)
    .set({
      metadata: {
        ...metadata,
        workflowStartErrorMessage: errorMessage,
        workflowStartCheckedAt: now.toISOString(),
        workflowStartState: ANIMATION_WORKFLOW_START_STATE_UNCONFIRMED,
      },
      updatedAt: now,
    })
    .where(
      and(
        eq(aiGenerationsTable.id, generation.id),
        eq(aiGenerationsTable.status, 'PENDING'),
        eq(aiGenerationsTable.isDeleted, false),
      ),
    )
    .returning();

  return updatedRow ?? generation;
}

async function reconcileUnconfirmedAnimationGeneration(
  generation: AiGenerationRow,
) {
  if (!shouldReconcileUnconfirmedAnimationStart(generation)) {
    return generation;
  }

  const now = new Date();
  const metadata = asMetadataRecord(generation.metadata);
  const workflowId = buildLogoAnimationWorkflowId(generation.id);
  const startState = await getAnimationStartStateAfterError(workflowId);

  if (startState === 'started') {
    const [updatedRow] = await db
      .update(aiGenerationsTable)
      .set({
        metadata: {
          ...metadata,
          workflowStartCheckedAt: now.toISOString(),
          workflowStartState: ANIMATION_WORKFLOW_START_STATE_CONFIRMED,
        },
        updatedAt: now,
      })
      .where(
        and(
          eq(aiGenerationsTable.id, generation.id),
          eq(aiGenerationsTable.status, 'PENDING'),
          eq(aiGenerationsTable.isDeleted, false),
        ),
      )
      .returning();

    return updatedRow ?? generation;
  }

  if (startState === 'not-found') {
    const [updatedRow] = await db
      .update(aiGenerationsTable)
      .set({
        status: 'FAILED',
        finishedAt: now,
        errorMessage: ANIMATION_WORKFLOW_START_ERROR_MESSAGE,
        metadata: {
          ...metadata,
          workflowStartCheckedAt: now.toISOString(),
          workflowStartState: 'FAILED',
        },
        updatedAt: now,
      })
      .where(
        and(
          eq(aiGenerationsTable.id, generation.id),
          eq(aiGenerationsTable.status, 'PENDING'),
          eq(aiGenerationsTable.isDeleted, false),
        ),
      )
      .returning();

    return updatedRow ?? generation;
  }

  const [updatedRow] = await db
    .update(aiGenerationsTable)
    .set({
      metadata: {
        ...metadata,
        workflowStartCheckedAt: now.toISOString(),
      },
      updatedAt: now,
    })
    .where(
      and(
        eq(aiGenerationsTable.id, generation.id),
        eq(aiGenerationsTable.status, 'PENDING'),
        eq(aiGenerationsTable.isDeleted, false),
      ),
    )
    .returning();

  return updatedRow ?? generation;
}

async function reconcileUnconfirmedAnimationGenerationsForUser(userId: string) {
  const pendingAnimations = await db
    .select()
    .from(aiGenerationsTable)
    .where(
      and(
        eq(aiGenerationsTable.userId, userId),
        eq(aiGenerationsTable.type, 'animation'),
        eq(aiGenerationsTable.status, 'PENDING'),
        eq(aiGenerationsTable.isDeleted, false),
      ),
    );

  const staleRows = pendingAnimations.filter((generation) =>
    shouldReconcileUnconfirmedAnimationStart(generation),
  );

  if (staleRows.length === 0) {
    return;
  }

  const results = await Promise.allSettled(
    staleRows.map(async (generation) => {
      await reconcileUnconfirmedAnimationGeneration(generation);
    }),
  );

  for (const [index, result] of results.entries()) {
    if (result.status === 'rejected') {
      logger.warn(
        { error: result.reason, generationId: staleRows[index]?.id },
        'Failed to reconcile unconfirmed animation workflow start',
      );
    }
  }
}

function getGenerationUrl(output: AssetOutput) {
  if (output.type === 'animation') {
    return output.storagePath
      ? generateUrlFromStoragePath(
          output.storagePath,
          config.CLOUD_FRONT_DOMAIN,
        )
      : null;
  }

  return generateUrlFromStoragePath(
    output.storagePath,
    config.CLOUD_FRONT_DOMAIN,
  );
}

function getGenerationThumbnailUrl(output: AssetOutput, metadata?: unknown) {
  if (output.type === 'animation') {
    const metadataRecord = asMetadataRecord(metadata);
    const thumbnailUrl = generateUrlFromStoragePath(
      output.thumbnailStoragePath,
      config.CLOUD_FRONT_DOMAIN,
    );

    if (
      metadataRecord.animationSheetStoragePath ===
        output.thumbnailStoragePath ||
      metadataRecord.animationSheetUrl === thumbnailUrl
    ) {
      return null;
    }

    return thumbnailUrl;
  }

  return getGenerationUrl(output);
}

function getGenerationMimeType(output: AssetOutput) {
  return output.type === 'animation' ? output.mimeType : 'image/png';
}

function mapAiGenerationRecord<T extends AiGenerationRow>(generation: T) {
  return {
    ...generation,
    url: getGenerationUrl(generation.output),
    thumbnailUrl: getGenerationThumbnailUrl(
      generation.output,
      generation.metadata,
    ),
    mimeType: getGenerationMimeType(generation.output),
  };
}

function mapInternalGenerationRecord<
  T extends { output: AssetOutput } & Record<string, unknown>,
>(generation: T) {
  return {
    ...generation,
    url: getGenerationUrl(generation.output),
  };
}

export function getAiGenerationCreditCost(params: {
  mode?: string;
  model?: string;
  type: AiGenerationCreditType;
}) {
  return resolveAiGenerationCreditCost({
    creditCosts: config.AI_GENERATION_CREDIT_COSTS,
    ...params,
  });
}

function getAiGenerationPrimaryModel(generation: AiGenerationCreditRow) {
  if (generation.output.type === 'animation') {
    return generation.output.model;
  }

  if (generation.output.type === 'logo') {
    return (
      generation.output.imageModel ??
      (generation.input.type === 'logo'
        ? generation.input.imageModel
        : undefined)
    );
  }

  if (generation.output.type === 'marketing') {
    return (
      generation.output.imageModel ??
      (generation.input.type === 'marketing'
        ? generation.input.imageModel
        : undefined)
    );
  }

  return undefined;
}

function getAiGenerationMode(generation: AiGenerationCreditRow) {
  return generation.input.type === 'animation'
    ? generation.input.mode
    : undefined;
}

export function getAiGenerationCreditCostForRow(
  generation: AiGenerationCreditRow,
) {
  return getAiGenerationCreditCost({
    mode: getAiGenerationMode(generation),
    type: generation.type,
    model: getAiGenerationPrimaryModel(generation),
  });
}

export async function getCurrentMonthlyGenerationCreditUsage(
  userId: string,
): Promise<number> {
  await reconcileUnconfirmedAnimationGenerationsForUser(userId);

  const [generations, leadgenCredits] = await Promise.all([
    db
      .select({
        input: aiGenerationsTable.input,
        output: aiGenerationsTable.output,
        type: aiGenerationsTable.type,
      })
      .from(aiGenerationsTable)
      .where(
        and(
          eq(aiGenerationsTable.userId, userId),
          sql`${aiGenerationsTable.createdAt} >= date_trunc('month', now())`,
          ne(aiGenerationsTable.status, 'FAILED'),
          sql`NOT (
          ${aiGenerationsTable.type} = 'animation'
          AND ${aiGenerationsTable.status} = 'PENDING'
          AND COALESCE(${aiGenerationsTable.metadata}->>'workflowStartState', '') = ${ANIMATION_WORKFLOW_START_STATE_UNCONFIRMED}
        )`,
        ),
      ),
    getCurrentMonthlyLeadgenCreditUsage(userId),
  ]);

  const generationCredits = generations.reduce(
    (totalCredits, generation) =>
      totalCredits + getAiGenerationCreditCostForRow(generation),
    0,
  );

  return generationCredits + leadgenCredits;
}

async function getCurrentMonthlyLeadgenCreditUsage(userId: string) {
  const runs = await db
    .select({
      id: leadgenRunsTable.id,
      input: leadgenRunsTable.input,
      metadata: leadgenRunsTable.metadata,
      reasoningEffort: leadgenRunsTable.reasoningEffort,
      tokenUsage: leadgenRunsTable.tokenUsage,
    })
    .from(leadgenRunsTable)
    .where(
      and(
        eq(leadgenRunsTable.userId, userId),
        sql`${leadgenRunsTable.createdAt} >= date_trunc('month', now())`,
        ne(leadgenRunsTable.status, 'FAILED'),
        ne(leadgenRunsTable.status, 'CANCELED'),
        sql`COALESCE(${leadgenRunsTable.metadata}->>'source', ${leadgenRunsTable.input}->>'source', 'leadgen') = 'leadgen'`,
      ),
    );

  const creditEvents = await db
    .select({
      runId: leadgenEventsTable.runId,
      payload: leadgenEventsTable.payload,
    })
    .from(leadgenEventsTable)
    .innerJoin(
      leadgenRunsTable,
      eq(leadgenEventsTable.runId, leadgenRunsTable.id),
    )
    .where(
      and(
        eq(leadgenRunsTable.userId, userId),
        eq(leadgenEventsTable.eventType, 'credit-estimate'),
        sql`${leadgenEventsTable.createdAt} >= date_trunc('month', now())`,
        sql`COALESCE(${leadgenRunsTable.metadata}->>'source', ${leadgenRunsTable.input}->>'source', 'leadgen') = 'leadgen'`,
      ),
    );

  const currentMonthRunIds = new Set(runs.map((run) => run.id));
  const additionalCreditsByRunId = new Map<string, number>();
  let outreachCreditsForPriorMonthRuns = 0;

  for (const event of creditEvents) {
    const estimatedCredits = getEstimatedCreditsFromEventPayload(event.payload);
    if (estimatedCredits <= 0) continue;

    if (!currentMonthRunIds.has(event.runId)) {
      outreachCreditsForPriorMonthRuns += estimatedCredits;
      continue;
    }

    additionalCreditsByRunId.set(
      event.runId,
      (additionalCreditsByRunId.get(event.runId) ?? 0) + estimatedCredits,
    );
  }

  return runs.reduce(
    (totalCredits, run) =>
      totalCredits +
      getLeadgenCreditCostForRun({
        run,
        additionalEstimatedCredits: additionalCreditsByRunId.get(run.id) ?? 0,
      }),
    outreachCreditsForPriorMonthRuns,
  );
}

function getLeadgenCreditCostForRun(params: {
  run: LeadgenRunCreditRow;
  additionalEstimatedCredits: number;
}) {
  const runProfile =
    params.run.input.runProfile === 'campaign_short'
      ? 'campaign_short'
      : 'full';
  const estimatedCredits =
    getLeadgenRunCreditEstimate({
      creditCosts: config.AI_GENERATION_CREDIT_COSTS,
      reasoningEffort: params.run.reasoningEffort,
      runProfile,
      model: getLeadgenPrimaryResearchModel(params.run.reasoningEffort),
    }) + params.additionalEstimatedCredits;
  const actualCredits = getAiTokenUsageCreditCost({
    tokenCreditRates: config.AI_TOKEN_CREDIT_RATES,
    tokenUsage: params.run.tokenUsage,
  });

  return Math.max(estimatedCredits, actualCredits);
}

export async function getActiveAiCreditAwardCredits(
  userId: string,
): Promise<number> {
  const [row] = await db
    .select({
      credits: sql<number>`COALESCE(SUM(${aiCreditAwardsTable.amountCredits}), 0)::int`,
    })
    .from(aiCreditAwardsTable)
    .where(
      and(
        eq(aiCreditAwardsTable.userId, userId),
        sql`${aiCreditAwardsTable.expiresAt} > now()`,
      ),
    );

  return Number(row?.credits ?? 0);
}

function getEstimatedCreditsFromEventPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 0;
  }

  const value = (payload as { estimatedCredits?: unknown }).estimatedCredits;
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : 0;
}

export async function getUserGenerationCreditUsage(userId: string) {
  const [currentCredits, awardedCredits] = await Promise.all([
    getCurrentMonthlyGenerationCreditUsage(userId),
    getActiveAiCreditAwardCredits(userId),
  ]);
  const baseMaxCredits = config.MAX_AI_GENERATIONS_PER_USER_PER_MONTH;
  const maxCredits = baseMaxCredits + awardedCredits;
  const remainingCredits = Math.max(0, maxCredits - currentCredits);
  const now = new Date();

  return {
    awardedCredits,
    baseMaxCredits,
    creditsRefreshAt: new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    ),
    currentCredits,
    hasReachedLimit: remainingCredits <= 0,
    maxCredits,
    remainingCredits,
  };
}

export async function assertUserCanSpendGenerationCredits(params: {
  requestedCredits: number;
  userId: string;
}) {
  const usage = await getUserGenerationCreditUsage(params.userId);

  if (usage.currentCredits + params.requestedCredits > usage.maxCredits) {
    throw createInsufficientGenerationCreditsError({
      maxCredits: usage.maxCredits,
      remainingCredits: usage.remainingCredits,
      requestedCredits: params.requestedCredits,
    });
  }
}

export async function getAnimationStartStateAfterError(
  workflowId: string,
): Promise<'started' | 'not-found' | 'unknown'> {
  const handle = temporalClient.workflow.getHandle(workflowId);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await handle.describe();
      return 'started';
    } catch (error) {
      if (error instanceof WorkflowNotFoundError) {
        if (attempt === 0) {
          await sleep(250);
          continue;
        }

        return 'not-found';
      }

      logger.warn(
        { error, workflowId, attempt: attempt + 1 },
        'Unable to verify animation workflow existence after start failure',
      );
      return 'unknown';
    }
  }

  return 'unknown';
}

const generateLogoInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  description: z.string().optional(),
  type: z.enum(LOGO_TYPE_INPUT_IDS),
  style: z.enum(LOGO_STYLE_INPUT_IDS),
  textTreatment: z.enum(LOGO_TEXT_TREATMENT_INPUT_IDS),
  typography: z.enum(LOGO_TYPOGRAPHY_INPUT_IDS),
  model: z.enum(imageModelIds).default('gpt-image-2'),
});

const generateAnimationCommonInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  referenceLogoGenerationId: z.string().min(1),
  description: z.string().optional(),
});

const generateCinematicAnimationInputSchema = generateAnimationCommonInputSchema
  .extend({
    mode: z.literal('cinematic'),
    sourceMode: z.enum(ANIMATION_SOURCE_MODE_IDS).default('exact-frame'),
    motionPreset: z
      .enum(CINEMATIC_ANIMATION_MOTION_PRESET_IDS)
      .default('let-ai-choose'),
    model: z
      .enum(CINEMATIC_ANIMATION_MODEL_IDS)
      .default('veo-3.1-generate-preview'),
  })
  .strict();

const generateLoopedAnimationInputSchema = generateAnimationCommonInputSchema
  .extend({
    mode: z.literal('looped'),
    motionPreset: z
      .enum(LOOPED_ANIMATION_MOTION_PRESET_IDS)
      .default('let-ai-choose'),
    motionIntensity: z.enum(ANIMATION_MOTION_INTENSITY_IDS).default('subtle'),
    model: z.enum(LOOPED_ANIMATION_MODEL_IDS).default('bytedance/seedance-2.0'),
  })
  .strict();

const generateSheetGuidedAnimationInputSchema =
  generateAnimationCommonInputSchema
    .extend({
      mode: z.literal('sheet-guided'),
      model: z
        .enum(LOOPED_ANIMATION_MODEL_IDS)
        .default('bytedance/seedance-2.0'),
      sheetModel: z.enum(['gpt-image-2']).default('gpt-image-2'),
    })
    .strict();

export const generateAnimationInputSchema = z.discriminatedUnion('mode', [
  generateCinematicAnimationInputSchema,
  generateLoopedAnimationInputSchema,
  generateSheetGuidedAnimationInputSchema,
]);

export const aiRouter = createContractTRPCRouter<typeof aiContract>({
  generateLogo: protectedProcedure
    .input(aiContract.generateLogo.input)
    .output(aiContract.generateLogo.output)
    .mutation(async ({ input, ctx }) => {
      try {
        await assertUserCanSpendGenerationCredits({
          requestedCredits: getAiGenerationCreditCost({
            type: 'logo',
            model: input.model,
          }),
          userId: ctx.user.id,
        });

        const now = new Date();
        const {
          domain,
          description,
          type,
          style,
          model,
          textTreatment,
          typography,
        } = input;

        const logoResult = await runLogoWorkflow({
          domain,
          description,
          preferredType: type,
          preferredStyle: style,
          textTreatment,
          typography,
          imageModel: model,
          storage: createStorageConfig(config.AI_BUCKET_FOLDERS.LOGOS),
        });

        const resolvedConcept = logoResult.concept.logoConcept;
        const resolvedLogoType = resolvedConcept.type ?? type;
        const resolvedLogoStyle = resolvedConcept.style ?? style;
        const resolvedTextTreatment =
          resolvedConcept.textTreatment ?? textTreatment;
        const resolvedTypography = resolvedConcept.typography ?? typography;

        const aggregateTokenUsage = [
          {
            model: logoResult.analysis.model,
            inputTokens: logoResult.analysis.tokenUsage?.inputTokens ?? 0,
            outputTokens: logoResult.analysis.tokenUsage?.outputTokens ?? 0,
          },
          {
            model: logoResult.image.model,
            inputTokens: logoResult.image.tokenUsage?.inputTokens ?? 0,
            outputTokens: logoResult.image.tokenUsage?.outputTokens ?? 0,
          },
        ];

        const [generationRecord] = await db
          .insert(aiGenerationsTable)
          .values({
            userId: ctx.user.id,
            domain,
            type: 'logo',
            status: 'SUCCEEDED',
            startedAt: now,
            finishedAt: now,
            input: {
              type: 'logo',
              logoType: type,
              logoStyle: style,
              description,
              imageModel: model,
              textTreatment,
              typography,
            },
            output: {
              type: 'logo',
              storagePath: logoResult.image.storagePath,
              logoType: resolvedLogoType,
              logoStyle: resolvedLogoStyle,
              textTreatment: resolvedTextTreatment,
              typography: resolvedTypography,
              imageModel: logoResult.image.model,
            },
            tokenUsage: aggregateTokenUsage,
          })
          .returning();

        return mapAiGenerationRecord(generationRecord);
      } catch (error) {
        logger.error({ error }, 'Logo generation error');

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: normalizeErrorMessage(error, 'Failed to generate logo'),
        });
      }
    }),

  generatePoster: protectedProcedure
    .input(aiContract.generatePoster.input)
    .output(aiContract.generatePoster.output)
    .mutation(async ({ input, ctx }) => {
      try {
        const now = new Date();
        const {
          domain,
          description,
          referenceLogoGenerationId,
          model,
          collateralType,
        } = input;

        const {
          referenceLogoGeneration: verifiedReferenceLogoGeneration,
          referenceLogoPublicUrl,
        } = await resolveOwnedLogoReference({
          domain,
          generationId: referenceLogoGenerationId,
          userId: ctx.user.id,
        });

        await assertUserCanSpendGenerationCredits({
          requestedCredits: getAiGenerationCreditCost({
            type: 'marketing',
            model,
          }),
          userId: ctx.user.id,
        });

        const marketingResult = await runMarketingWorkflow({
          domain,
          description,
          collateralType,
          imageModel: model,
          storage: createStorageConfig(config.AI_BUCKET_FOLDERS.SOCIAL),
          referenceLogoUrl: referenceLogoPublicUrl,
        });

        const aggregateTokenUsage = [
          {
            model: marketingResult.analysis.model,
            inputTokens: marketingResult.analysis.tokenUsage?.inputTokens ?? 0,
            outputTokens:
              marketingResult.analysis.tokenUsage?.outputTokens ?? 0,
          },
          {
            model: marketingResult.image.model,
            inputTokens: marketingResult.image.tokenUsage?.inputTokens ?? 0,
            outputTokens: marketingResult.image.tokenUsage?.outputTokens ?? 0,
          },
        ];

        const [generationRecord] = await db
          .insert(aiGenerationsTable)
          .values({
            userId: ctx.user.id,
            domain,
            type: 'marketing',
            status: 'SUCCEEDED',
            startedAt: now,
            finishedAt: now,
            input: {
              type: 'marketing',
              description,
              collateralType,
              imageModel: model,
            },
            output: {
              type: 'marketing',
              storagePath: marketingResult.image.storagePath,
              collateralType: marketingResult.analysis.resolvedCollateralType,
              imageModel: marketingResult.image.model,
            },
            tokenUsage: aggregateTokenUsage,
            referenceGenerationId: verifiedReferenceLogoGeneration.id,
          })
          .returning();

        return mapAiGenerationRecord(generationRecord);
      } catch (error) {
        logger.error({ error }, 'Poster generation error');

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: normalizeErrorMessage(error, 'Failed to generate posters'),
        });
      }
    }),

  generateAnimation: protectedProcedure
    .input(aiContract.generateAnimation.input)
    .output(aiContract.generateAnimation.output)
    .mutation(async ({ input, ctx }) => {
      const { referenceLogoGeneration } = await resolveOwnedLogoReference({
        domain: input.domain,
        generationId: input.referenceLogoGenerationId,
        userId: ctx.user.id,
      });

      await assertUserCanSpendGenerationCredits({
        requestedCredits: getAiGenerationCreditCost({
          type: 'animation',
          mode: input.mode,
          model: input.model,
        }),
        userId: ctx.user.id,
      });

      const animationGenerationInput =
        input.mode === 'cinematic'
          ? {
              type: 'animation' as const,
              mode: 'cinematic' as const,
              description: input.description,
              sourceMode: input.sourceMode,
              motionPreset: input.motionPreset,
              model: input.model,
            }
          : input.mode === 'sheet-guided'
            ? {
                type: 'animation' as const,
                mode: 'sheet-guided' as const,
                description: input.description,
                model: input.model,
                sheetModel: input.sheetModel,
              }
            : {
                type: 'animation' as const,
                mode: 'looped' as const,
                description: input.description,
                motionPreset: input.motionPreset,
                motionIntensity: input.motionIntensity,
                model: input.model,
              };

      const [generationRecord] = await db
        .insert(aiGenerationsTable)
        .values({
          userId: ctx.user.id,
          domain: input.domain,
          type: 'animation',
          status: 'PENDING',
          referenceGenerationId: referenceLogoGeneration.id,
          input: animationGenerationInput,
          output: {
            type: 'animation',
            thumbnailStoragePath: referenceLogoGeneration.output.storagePath,
            mimeType: 'video/mp4',
            model: input.model,
          },
          tokenUsage: [],
        })
        .returning();

      const workflowId = buildLogoAnimationWorkflowId(generationRecord.id);
      const startResult = await startLogoAnimationWorkflowWithRecovery({
        generationId: generationRecord.id,
        workflowId,
      });

      if (startResult.state === 'started') {
        return mapAiGenerationRecord(generationRecord);
      }

      const failedMessage = normalizeErrorMessage(
        startResult.error,
        ANIMATION_WORKFLOW_START_ERROR_MESSAGE,
      );

      if (startResult.state === 'unknown') {
        logger.warn(
          {
            error: startResult.error,
            generationId: generationRecord.id,
            workflowId,
          },
          'Leaving animation generation pending because workflow existence could not be confirmed',
        );

        const latestRow = await markAnimationWorkflowStartUnconfirmed(
          generationRecord,
          failedMessage,
        );

        return mapAiGenerationRecord(latestRow);
      }

      logger.error(
        {
          error: startResult.error,
          generationId: generationRecord.id,
          workflowId,
        },
        'Failed to start logo animation workflow',
      );

      const [failedRow] = await db
        .update(aiGenerationsTable)
        .set({
          status: 'FAILED',
          finishedAt: new Date(),
          errorMessage: failedMessage,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(aiGenerationsTable.id, generationRecord.id),
            eq(aiGenerationsTable.status, 'PENDING'),
          ),
        )
        .returning();

      return mapAiGenerationRecord(failedRow ?? generationRecord);
    }),

  getGenerationsByDomain: protectedProcedure
    .input(aiContract.getGenerationsByDomain.input)
    .output(aiContract.getGenerationsByDomain.output)
    .query(async ({ input, ctx }) => {
      await reconcileUnconfirmedAnimationGenerationsForUser(ctx.user.id);

      const generations = await db
        .select()
        .from(aiGenerationsTable)
        .where(
          and(
            eq(aiGenerationsTable.userId, ctx.user.id),
            eq(aiGenerationsTable.domain, input.domain),
            eq(aiGenerationsTable.isDeleted, false),
          ),
        )
        .orderBy(desc(aiGenerationsTable.createdAt));

      return generations.map(mapAiGenerationRecord);
    }),

  getUserDomains: protectedProcedure
    .input(aiContract.getUserDomains.input)
    .output(aiContract.getUserDomains.output)
    .query(async ({ ctx }) => {
      const latestGenerationAlias = max(aiGenerationsTable.createdAt).as(
        'latestGeneration',
      );

      return await db
        .select({
          domain: aiGenerationsTable.domain,
          latestGeneration: latestGenerationAlias,
          logoCount: count(
            sql`CASE WHEN ${aiGenerationsTable.type} = 'logo' THEN 1 END`,
          ).as('logoCount'),
          marketingCount: count(
            sql`CASE WHEN ${aiGenerationsTable.type} = 'marketing' THEN 1 END`,
          ).as('marketingCount'),
          animationCount: count(
            sql`CASE WHEN ${aiGenerationsTable.type} = 'animation' THEN 1 END`,
          ).as('animationCount'),
        })
        .from(aiGenerationsTable)
        .where(
          and(
            eq(aiGenerationsTable.userId, ctx.user.id),
            eq(aiGenerationsTable.isDeleted, false),
          ),
        )
        .groupBy(aiGenerationsTable.domain)
        .orderBy(desc(latestGenerationAlias));
    }),

  getUserGenerationsFiltered: protectedProcedure
    .input(aiContract.getUserGenerationsFiltered.input)
    .output(aiContract.getUserGenerationsFiltered.output)
    .query(async ({ ctx, input }) => {
      await reconcileUnconfirmedAnimationGenerationsForUser(ctx.user.id);

      const whereConds = [
        eq(aiGenerationsTable.userId, ctx.user.id),
        eq(aiGenerationsTable.isDeleted, false),
      ];

      if (input.types.length > 0) {
        whereConds.push(inArray(aiGenerationsTable.type, input.types));
      }

      if (input.domains && input.domains.length > 0) {
        whereConds.push(inArray(aiGenerationsTable.domain, input.domains));
      }

      const rows = await db
        .select()
        .from(aiGenerationsTable)
        .where(and(...whereConds))
        .orderBy(desc(aiGenerationsTable.createdAt))
        .limit(input.limit);

      return rows.map(mapAiGenerationRecord);
    }),

  getGenerationsByType: protectedProcedure
    .input(aiContract.getGenerationsByType.input)
    .output(aiContract.getGenerationsByType.output)
    .query(async ({ input, ctx }) => {
      await reconcileUnconfirmedAnimationGenerationsForUser(ctx.user.id);

      const generations = await db
        .select()
        .from(aiGenerationsTable)
        .where(
          and(
            eq(aiGenerationsTable.userId, ctx.user.id),
            eq(aiGenerationsTable.domain, input.domain),
            eq(aiGenerationsTable.type, input.type),
            eq(aiGenerationsTable.isDeleted, false),
          ),
        )
        .orderBy(desc(aiGenerationsTable.createdAt));

      return generations.map(mapAiGenerationRecord);
    }),

  getFeaturedAndRecentGenerations: publicProcedure
    .input(aiContract.getFeaturedAndRecentGenerations.input)
    .output(aiContract.getFeaturedAndRecentGenerations.output)
    .query(async () => {
      const selectFields = {
        id: aiGenerationsTable.id,
        domain: aiGenerationsTable.domain,
        type: aiGenerationsTable.type,
        status: aiGenerationsTable.status,
        errorMessage: aiGenerationsTable.errorMessage,
        createdAt: aiGenerationsTable.createdAt,
        metadata: aiGenerationsTable.metadata,
        output: aiGenerationsTable.output,
      };

      const [featuredRows, recentRows] = await Promise.all([
        db
          .select(selectFields)
          .from(aiGenerationsTable)
          .where(
            and(
              eq(aiGenerationsTable.featured, true),
              eq(aiGenerationsTable.status, 'SUCCEEDED'),
              eq(aiGenerationsTable.isDeleted, false),
            ),
          )
          .orderBy(desc(aiGenerationsTable.createdAt)),
        db
          .select(selectFields)
          .from(aiGenerationsTable)
          .where(
            and(
              eq(aiGenerationsTable.status, 'SUCCEEDED'),
              eq(aiGenerationsTable.isDeleted, false),
            ),
          )
          .orderBy(desc(aiGenerationsTable.createdAt))
          .limit(50),
      ]);

      const mapRows = (rows: typeof featuredRows) =>
        rows.map((row) => ({
          id: row.id,
          domain: row.domain,
          type: row.type,
          status: row.status,
          errorMessage: row.errorMessage,
          createdAt: row.createdAt,
          url: getGenerationUrl(row.output),
          thumbnailUrl: getGenerationThumbnailUrl(row.output, row.metadata),
          mimeType: getGenerationMimeType(row.output),
        }));

      return {
        featured: mapRows(featuredRows),
        recent: mapRows(recentRows),
      };
    }),

  getGenerationById: publicProcedure
    .input(aiContract.getGenerationById.input)
    .output(aiContract.getGenerationById.output)
    .query(async ({ input }) => {
      const [generation] = await db
        .select()
        .from(aiGenerationsTable)
        .where(
          and(
            eq(aiGenerationsTable.id, input.id),
            eq(aiGenerationsTable.isDeleted, false),
          ),
        );

      if (!generation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Generation not found',
        });
      }

      const reconciledGeneration =
        await reconcileUnconfirmedAnimationGeneration(generation);

      return mapAiGenerationRecord(reconciledGeneration);
    }),

  deleteGeneration: protectedProcedure
    .input(aiContract.deleteGeneration.input)
    .output(aiContract.deleteGeneration.output)
    .mutation(async ({ input, ctx }) => {
      const [generation] = await db
        .update(aiGenerationsTable)
        .set({ isDeleted: true })
        .where(
          and(
            eq(aiGenerationsTable.id, input.id),
            eq(aiGenerationsTable.userId, ctx.user.id),
          ),
        )
        .returning();

      if (!generation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Generation not found',
        });
      }

      return mapAiGenerationRecord(generation);
    }),

  getInternalGenerationsByDomain: publicProcedure
    .input(aiContract.getInternalGenerationsByDomain.input)
    .output(aiContract.getInternalGenerationsByDomain.output)
    .query(async ({ input }) => {
      const rows = await db
        .select({
          id: internalAiGenerationsTable.id,
          domain: internalAiGenerationsTable.domain,
          type: internalAiGenerationsTable.type,
          createdAt: internalAiGenerationsTable.createdAt,
          output: internalAiGenerationsTable.output,
        })
        .from(internalAiGenerationsTable)
        .where(eq(internalAiGenerationsTable.domain, input.domain))
        .orderBy(desc(internalAiGenerationsTable.createdAt));

      return rows.map(mapInternalGenerationRecord);
    }),

  getInternalGenerationsByDomains: publicProcedure
    .input(aiContract.getInternalGenerationsByDomains.input)
    .output(aiContract.getInternalGenerationsByDomains.output)
    .query(async ({ input }) => {
      const rows = await db
        .select({
          id: internalAiGenerationsTable.id,
          domain: internalAiGenerationsTable.domain,
          type: internalAiGenerationsTable.type,
          createdAt: internalAiGenerationsTable.createdAt,
          output: internalAiGenerationsTable.output,
        })
        .from(internalAiGenerationsTable)
        .where(inArray(internalAiGenerationsTable.domain, input.domains))
        .orderBy(desc(internalAiGenerationsTable.createdAt));

      const domainToRows: Record<
        string,
        Array<{ id: string; type: string; createdAt: Date; url: string | null }>
      > = {};

      for (const row of rows) {
        const mappedRow = mapInternalGenerationRecord(row);
        if (!domainToRows[row.domain]) {
          domainToRows[row.domain] = [];
        }

        domainToRows[row.domain]?.push({
          id: mappedRow.id,
          type: mappedRow.type,
          createdAt: mappedRow.createdAt,
          url: mappedRow.url,
        });
      }

      return domainToRows;
    }),

  getUserGenerationUsage: protectedProcedure
    .input(aiContract.getUserGenerationUsage.input)
    .output(aiContract.getUserGenerationUsage.output)
    .query(async ({ ctx }) => {
      const usage = await getUserGenerationCreditUsage(ctx.user.id);

      return {
        awardedCredits: usage.awardedCredits,
        baseMaxCredits: usage.baseMaxCredits,
        currentCredits: usage.currentCredits,
        maxCredits: usage.maxCredits,
        remainingCredits: usage.remainingCredits,
        creditsRefreshAt: usage.creditsRefreshAt,
        currentCount: usage.currentCredits,
        maxGenerations: usage.maxCredits,
        remainingGenerations: usage.remainingCredits,
        hasReachedLimit: usage.hasReachedLimit,
        creditCosts: config.AI_GENERATION_CREDIT_COSTS,
      };
    }),
});
