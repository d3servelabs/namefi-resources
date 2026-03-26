import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared';
import { generateLogoAnimationWorkflow } from '#temporal/workflows/logo-animation.workflow';
import { db } from '@namefi-astra/db';
import {
  aiGenerationsTable,
  internalAiGenerationsTable,
} from '@namefi-astra/db/schema';
import {
  ANIMATION_MODEL_IDS,
  ANIMATION_MOTION_PRESET_IDS,
  LOGO_STYLE_INPUT_IDS,
  LOGO_TEXT_TREATMENT_INPUT_IDS,
  LOGO_TYPE_INPUT_IDS,
  LOGO_TYPOGRAPHY_INPUT_IDS,
  MARKETING_COLLATERAL_TYPE_INPUT_IDS,
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
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../base';

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
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
] as const;

type AiGenerationRow = typeof aiGenerationsTable.$inferSelect;
type InternalAiGenerationRow = typeof internalAiGenerationsTable.$inferSelect;
type AssetOutput =
  | AiGenerationRow['output']
  | InternalAiGenerationRow['output'];
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

function createLimitReachedError() {
  return new TRPCError({
    code: 'FORBIDDEN',
    message: `You have reached the maximum limit of ${config.MAX_AI_GENERATIONS_PER_USER_PER_MONTH} AI generations for this month. Please try again next month or contact support for more information.`,
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

function getGenerationThumbnailUrl(output: AssetOutput) {
  if (output.type === 'animation') {
    return generateUrlFromStoragePath(
      output.thumbnailStoragePath,
      config.CLOUD_FRONT_DOMAIN,
    );
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
    thumbnailUrl: getGenerationThumbnailUrl(generation.output),
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

async function checkUserGenerationLimit(userId: string): Promise<boolean> {
  const currentCount = await getCurrentMonthlyGenerationCount(userId);
  return currentCount >= config.MAX_AI_GENERATIONS_PER_USER_PER_MONTH;
}

export async function getCurrentMonthlyGenerationCount(
  userId: string,
): Promise<number> {
  await reconcileUnconfirmedAnimationGenerationsForUser(userId);

  const result = await db
    .select({ count: count() })
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
    );

  return result[0]?.count || 0;
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

async function findOwnedLogoGeneration(params: {
  generationId: string;
  userId: string;
}) {
  return await db
    .select()
    .from(aiGenerationsTable)
    .where(
      and(
        eq(aiGenerationsTable.userId, params.userId),
        eq(aiGenerationsTable.id, params.generationId),
        eq(aiGenerationsTable.type, 'logo'),
        eq(aiGenerationsTable.isDeleted, false),
      ),
    )
    .then((rows) => rows[0]);
}

const generateLogoInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  description: z.string().optional(),
  type: z.enum(LOGO_TYPE_INPUT_IDS),
  style: z.enum(LOGO_STYLE_INPUT_IDS),
  textTreatment: z.enum(LOGO_TEXT_TREATMENT_INPUT_IDS),
  typography: z.enum(LOGO_TYPOGRAPHY_INPUT_IDS),
  model: z.enum(imageModelIds).default('gpt-image-1.5'),
});

const generateMarketingImageInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  description: z.string().optional(),
  referenceLogoGenerationId: z.string().optional(),
  collateralType: z
    .enum(MARKETING_COLLATERAL_TYPE_INPUT_IDS)
    .default('let_ai_choose'),
  model: z.enum(imageModelIds).default('gemini-3-pro-image-preview'),
});

const generateAnimationInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  referenceLogoGenerationId: z.string(),
  description: z.string().optional(),
  motionPreset: z.enum(ANIMATION_MOTION_PRESET_IDS).default('let-ai-choose'),
  model: z.enum(ANIMATION_MODEL_IDS).default('veo-3.1-generate-preview'),
});

export const aiRouter = createTRPCRouter({
  generateLogo: protectedProcedure
    .input(generateLogoInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const hasReachedLimit = await checkUserGenerationLimit(ctx.user.id);
        if (hasReachedLimit) {
          throw createLimitReachedError();
        }

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
    .input(generateMarketingImageInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const hasReachedLimit = await checkUserGenerationLimit(ctx.user.id);
        if (hasReachedLimit) {
          throw createLimitReachedError();
        }

        const now = new Date();
        const {
          domain,
          description,
          referenceLogoGenerationId,
          model,
          collateralType,
        } = input;

        let referenceLogoPublicUrl: string | undefined;
        if (referenceLogoGenerationId) {
          const referenceLogoGeneration = await findOwnedLogoGeneration({
            generationId: referenceLogoGenerationId,
            userId: ctx.user.id,
          });

          if (referenceLogoGeneration?.output.type === 'logo') {
            referenceLogoPublicUrl = generateUrlFromStoragePath(
              referenceLogoGeneration.output.storagePath,
              config.CLOUD_FRONT_DOMAIN,
            );
          }
        }

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
            },
            output: {
              type: 'marketing',
              storagePath: marketingResult.image.storagePath,
              collateralType: marketingResult.analysis.resolvedCollateralType,
            },
            tokenUsage: aggregateTokenUsage,
            referenceGenerationId: referenceLogoGenerationId,
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
    .input(generateAnimationInputSchema)
    .mutation(async ({ input, ctx }) => {
      const hasReachedLimit = await checkUserGenerationLimit(ctx.user.id);
      if (hasReachedLimit) {
        throw createLimitReachedError();
      }

      const referenceLogoGeneration = await findOwnedLogoGeneration({
        generationId: input.referenceLogoGenerationId,
        userId: ctx.user.id,
      });

      if (
        !referenceLogoGeneration ||
        referenceLogoGeneration.output.type !== 'logo'
      ) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reference logo generation not found',
        });
      }

      if (referenceLogoGeneration.domain !== input.domain) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Reference logo must match the requested domain',
        });
      }

      const [generationRecord] = await db
        .insert(aiGenerationsTable)
        .values({
          userId: ctx.user.id,
          domain: input.domain,
          type: 'animation',
          status: 'PENDING',
          referenceGenerationId: referenceLogoGeneration.id,
          input: {
            type: 'animation',
            description: input.description,
            motionPreset: input.motionPreset,
            model: input.model,
          },
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
    .input(
      z.object({
        domain: namefiNormalizedDomainSchema,
      }),
    )
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

  getUserDomains: protectedProcedure.query(async ({ ctx }) => {
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
    .input(
      z.object({
        types: z
          .array(z.enum(['logo', 'marketing', 'animation']))
          .min(1)
          .default(['logo', 'marketing', 'animation']),
        domains: z.array(namefiNormalizedDomainSchema).optional(),
        limit: z.number().int().min(1).max(200).default(100),
      }),
    )
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
    .input(
      z.object({
        domain: namefiNormalizedDomainSchema,
        type: z.enum(['logo', 'marketing', 'animation']),
      }),
    )
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

  getFeaturedAndRecentGenerations: publicProcedure.query(async () => {
    const selectFields = {
      id: aiGenerationsTable.id,
      domain: aiGenerationsTable.domain,
      type: aiGenerationsTable.type,
      status: aiGenerationsTable.status,
      errorMessage: aiGenerationsTable.errorMessage,
      createdAt: aiGenerationsTable.createdAt,
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
        thumbnailUrl: getGenerationThumbnailUrl(row.output),
        mimeType: getGenerationMimeType(row.output),
      }));

    return {
      featured: mapRows(featuredRows),
      recent: mapRows(recentRows),
    };
  }),

  getGenerationById: publicProcedure
    .input(z.object({ id: z.string() }))
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
    .input(z.object({ id: z.string() }))
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

      return generation;
    }),

  getInternalGenerationsByDomain: publicProcedure
    .input(
      z.object({
        domain: namefiNormalizedDomainSchema,
      }),
    )
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
    .input(
      z.object({
        domains: z.array(namefiNormalizedDomainSchema).min(1).max(200),
      }),
    )
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

  getUserGenerationUsage: protectedProcedure.query(async ({ ctx }) => {
    const currentCount = await getCurrentMonthlyGenerationCount(ctx.user.id);
    const remainingGenerations = Math.max(
      0,
      config.MAX_AI_GENERATIONS_PER_USER_PER_MONTH - currentCount,
    );
    const hasReachedLimit =
      currentCount >= config.MAX_AI_GENERATIONS_PER_USER_PER_MONTH;

    return {
      currentCount,
      maxGenerations: config.MAX_AI_GENERATIONS_PER_USER_PER_MONTH,
      remainingGenerations,
      hasReachedLimit,
    };
  }),
});
