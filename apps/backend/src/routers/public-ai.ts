import { createHash } from 'node:crypto';
import { db, publicAiGenerationsTable } from '@namefi-astra/db';
import {
  DIGEST_ANIMATION_MODEL_IDS,
  DIGEST_ANIMATION_SHEET_MODEL_IDS,
  LOGO_TEXT_TREATMENT_INPUT_IDS,
  LOGO_TYPOGRAPHY_INPUT_IDS,
  LOGO_STYLE_INPUT_IDS,
  LOGO_TYPE_INPUT_IDS,
  runLogoWorkflow,
  type DigestAnimationUploadedSourceImage,
  uploadDigestAnimationSourceImage,
} from '@namefi-astra/ai';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { lazy } from '@namefi-astra/utils/lazy';
import {
  createS3Client,
  deleteFileFromS3,
  generateUrlFromStoragePath,
} from '@namefi-astra/storage';
import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { temporalClient } from '#temporal/client';
import { TEMPORAL_QUEUES } from '#temporal/shared';
import type { PublicDigestAnimationWorkflowInput } from '#temporal/shared/public-digest-animation';
import { generatePublicDigestAnimationWorkflow } from '#temporal/workflows/public-digest-animation.workflow';
import { validateApiKey } from '#lib/validate-api-key';
import { WorkflowNotFoundError } from '@temporalio/common';
import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

const logger = createLogger({ context: 'PUBLIC_AI_GENERATION' });
const publicAiRouter = new Hono<{ Variables: { requestId: string } }>();

const getS3Client = lazy(() =>
  createS3Client({
    AWS_ACCESS_KEY_ID: secrets.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: secrets.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: config.AWS_REGION,
  }),
);

const getLogoStorageConfig = lazy(() => ({
  bucketName: config.STORAGE_BUCKET,
  cloudfrontDomain: config.CLOUD_FRONT_DOMAIN,
  s3Client: getS3Client(),
  baseFolder: config.AI_BUCKET_FOLDERS.LOGOS,
}));

const getAnimationStorageConfig = lazy(() => ({
  bucketName: config.STORAGE_BUCKET,
  cloudfrontDomain: config.CLOUD_FRONT_DOMAIN,
  s3Client: getS3Client(),
  baseFolder: config.AI_BUCKET_FOLDERS.ANIMATIONS,
}));

const DIGEST_ANIMATION_IMAGE_DATA_URL_PATTERN =
  /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+$/;
const MAX_DIGEST_ANIMATION_IMAGE_DATA_URL_LENGTH = 15_000_000;
const DIGEST_ANIMATION_JOB_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

const generateLogoInputSchema = z.object({
  externalUserId: z.string().min(1, 'externalUserId is required'),
  domain: namefiNormalizedDomainSchema,
  description: z.string().optional(),
  type: z.enum(LOGO_TYPE_INPUT_IDS),
  style: z.enum(LOGO_STYLE_INPUT_IDS),
  textTreatment: z.enum(LOGO_TEXT_TREATMENT_INPUT_IDS),
  typography: z.enum(LOGO_TYPOGRAPHY_INPUT_IDS),
  model: z
    .enum([
      'gpt-image-1',
      'gpt-image-1.5',
      'gpt-image-2',
      'gemini-2.5-flash-image',
      'gemini-3-pro-image-preview',
    ])
    .default('gpt-image-2'),
});

const generateDigestAnimationInputSchema = z
  .object({
    externalUserId: z.string().min(1, 'externalUserId is required'),
    title: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .default('Daily Namefi Feed sales digest'),
    imageDataUrl: z
      .string()
      .trim()
      .min(1, 'imageDataUrl is required')
      .regex(DIGEST_ANIMATION_IMAGE_DATA_URL_PATTERN, {
        message: 'imageDataUrl must be a valid base64 image data URL',
      })
      .max(
        MAX_DIGEST_ANIMATION_IMAGE_DATA_URL_LENGTH,
        'imageDataUrl is too large',
      ),
    domains: z.array(namefiNormalizedDomainSchema).max(12).default([]),
    summary: z.string().trim().max(2000).optional(),
    model: z.enum(DIGEST_ANIMATION_MODEL_IDS).default('bytedance/seedance-2.0'),
    sheetModel: z.enum(DIGEST_ANIMATION_SHEET_MODEL_IDS).default('gpt-image-2'),
  })
  .strict();

const getDigestAnimationJobParamsSchema = z.object({
  id: z.string().trim().min(1).max(160).regex(DIGEST_ANIMATION_JOB_ID_PATTERN),
});

const getDigestAnimationJobQuerySchema = z.object({
  externalUserId: z.string().min(1, 'externalUserId is required'),
});

/** Prefixes the public digest animation job ID for Temporal workflow IDs. */
function buildDigestAnimationWorkflowId(jobId: string) {
  return `public-digest-animation-${jobId}`;
}

/**
 * Defines the public job ID contract: preserve a trimmed request ID when it is
 * non-empty, <=120 chars, and URL/workflow-safe; otherwise use a stable
 * `req-...` SHA-256 base64url fallback derived from the original request ID.
 */
function resolveDigestAnimationJobId(requestId: string) {
  const trimmed = requestId.trim();
  if (
    trimmed.length > 0 &&
    trimmed.length <= 120 &&
    DIGEST_ANIMATION_JOB_ID_PATTERN.test(trimmed)
  ) {
    return trimmed;
  }

  return `req-${createHash('sha256').update(requestId).digest('base64url')}`;
}

function buildDigestAnimationStatusPath(jobId: string) {
  return `/v1/public/ai/generate-digest-animation/${jobId}`;
}

function formatUnknownError(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

function getDigestAnimationWorkflowHandle(workflowId: string) {
  return temporalClient.workflow.getHandle<
    typeof generatePublicDigestAnimationWorkflow
  >(workflowId);
}

async function describeDigestAnimationWorkflow(workflowId: string) {
  const handle = getDigestAnimationWorkflowHandle(workflowId);
  try {
    return await handle.describe();
  } catch (error) {
    if (error instanceof WorkflowNotFoundError) {
      return null;
    }

    throw error;
  }
}

function getWorkflowMemoString(
  description: { memo?: Record<string, unknown> },
  key: string,
) {
  const value = description.memo?.[key];
  return typeof value === 'string' ? value : undefined;
}

function getDigestAnimationWorkflowExternalUserId(description: {
  memo?: Record<string, unknown>;
}) {
  return getWorkflowMemoString(description, 'externalUserId');
}

function isDigestAnimationWorkflowActive(workflowStatus: string) {
  return workflowStatus === 'RUNNING';
}

function getDigestAnimationSourceImageFromMemo(description: {
  memo?: Record<string, unknown>;
}) {
  const storagePath = getWorkflowMemoString(
    description,
    'sourceImageStoragePath',
  );
  if (!storagePath) {
    return undefined;
  }

  return {
    storagePath,
    url: generateUrlFromStoragePath(storagePath, config.CLOUD_FRONT_DOMAIN),
    mimeType: getWorkflowMemoString(description, 'sourceImageMimeType'),
  };
}

function buildDigestAnimationProcessingResponse({
  jobId,
  workflowId,
  externalUserId,
  title,
  sourceImage,
  createdAt,
}: {
  jobId: string;
  workflowId: string;
  externalUserId: string;
  title: string;
  sourceImage?: {
    storagePath: string;
    url?: string;
    mimeType?: string;
  };
  createdAt?: Date;
}) {
  return {
    id: jobId,
    workflowId,
    status: 'processing',
    statusUrl: buildDigestAnimationStatusPath(jobId),
    retryAfterSeconds: 20,
    externalUserId,
    title,
    type: 'digest_animation',
    sourceImageUrl: sourceImage?.url,
    sourceImageStoragePath: sourceImage?.storagePath,
    sourceImageMimeType: sourceImage?.mimeType,
    createdAt,
  };
}

async function deleteOrphanedDigestAnimationSourceImage(
  sourceImage: DigestAnimationUploadedSourceImage,
) {
  try {
    await deleteFileFromS3({
      s3Client: getS3Client(),
      bucketName: config.STORAGE_BUCKET,
      key: sourceImage.storagePath,
    });
  } catch (error) {
    logger.warn(
      { error, sourceImageStoragePath: sourceImage.storagePath },
      'Failed to delete orphaned digest animation source image',
    );
  }
}

publicAiRouter.post('/generate-logo', async (c) => {
  const apiKey = c.req.header('x-api-key');
  if (!validateApiKey(apiKey, secrets.API_AUTH_KEY)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch (error) {
    logger.warn({ error }, 'Invalid JSON body for public logo generation');
    return c.json(
      { error: 'Bad Request', message: 'Invalid JSON payload' },
      400,
    );
  }

  const parsedBody = generateLogoInputSchema.safeParse(body);
  if (!parsedBody.success) {
    return c.json(
      {
        error: 'Bad Request',
        message: parsedBody.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', '),
      },
      400,
    );
  }

  const {
    domain,
    description,
    type,
    style,
    model,
    externalUserId,
    textTreatment,
    typography,
  } = parsedBody.data;

  try {
    const logoResult = await runLogoWorkflow({
      domain,
      description,
      preferredType: type,
      preferredStyle: style,
      textTreatment,
      typography,
      imageModel: model,
      storage: getLogoStorageConfig(),
    });

    const tokenUsage = [
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

    const resolvedConcept = logoResult.concept.logoConcept;
    const resolvedLogoType = resolvedConcept.type ?? type;
    const resolvedLogoStyle = resolvedConcept.style ?? style;
    const resolvedTextTreatment =
      resolvedConcept.textTreatment ?? textTreatment;
    const resolvedTypography = resolvedConcept.typography ?? typography;

    const [record] = await db
      .insert(publicAiGenerationsTable)
      .values({
        externalUserId,
        domain,
        type: 'logo',
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
        tokenUsage,
        metadata: {
          requestId: c.get('requestId'),
        },
      })
      .returning();

    return c.json({
      id: record.id,
      externalUserId,
      domain,
      type: record.type,
      logoType: resolvedLogoType,
      logoStyle: resolvedLogoStyle,
      textTreatment: resolvedTextTreatment,
      typography: resolvedTypography,
      model,
      url: logoResult.image.url,
      storagePath: logoResult.image.storagePath,
      tokenUsage,
      createdAt: record.createdAt,
    });
  } catch (error) {
    logger.error({ error }, 'Public logo generation failed');
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to generate logo',
      },
      500,
    );
  }
});

publicAiRouter.post('/generate-digest-animation', async (c) => {
  const apiKey = c.req.header('x-api-key');
  if (!validateApiKey(apiKey, secrets.API_AUTH_KEY)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch (error) {
    logger.warn({ error }, 'Invalid JSON body for public digest animation');
    return c.json(
      { error: 'Bad Request', message: 'Invalid JSON payload' },
      400,
    );
  }

  const parsedBody = generateDigestAnimationInputSchema.safeParse(body);
  if (!parsedBody.success) {
    return c.json(
      {
        error: 'Bad Request',
        message: parsedBody.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', '),
      },
      400,
    );
  }

  const {
    externalUserId,
    title,
    imageDataUrl,
    domains,
    summary,
    model,
    sheetModel,
  } = parsedBody.data;

  try {
    const jobId = resolveDigestAnimationJobId(c.get('requestId'));
    const workflowId = buildDigestAnimationWorkflowId(jobId);
    const existingDescription =
      await describeDigestAnimationWorkflow(workflowId);
    if (existingDescription) {
      const workflowStatus = existingDescription.status.name;
      if (
        getDigestAnimationWorkflowExternalUserId(existingDescription) !==
        externalUserId
      ) {
        return c.json({ error: 'Not Found' }, 404);
      }

      if (isDigestAnimationWorkflowActive(workflowStatus)) {
        return c.json(
          buildDigestAnimationProcessingResponse({
            jobId,
            workflowId,
            externalUserId,
            title,
            sourceImage:
              getDigestAnimationSourceImageFromMemo(existingDescription),
          }),
          202,
        );
      }

      if (workflowStatus === 'COMPLETED') {
        const result =
          await getDigestAnimationWorkflowHandle(workflowId).result();
        if (result.externalUserId !== externalUserId) {
          return c.json({ error: 'Not Found' }, 404);
        }

        return c.json({
          status: 'succeeded',
          workflowStatus,
          ...result,
        });
      }
    }

    const sourceImage = await uploadDigestAnimationSourceImage({
      imageDataUrl,
      storage: getAnimationStorageConfig(),
    });
    const workflowInput: PublicDigestAnimationWorkflowInput = {
      jobId,
      externalUserId,
      title,
      domains,
      summary,
      model,
      sheetModel,
      sourceImage,
    };

    try {
      await temporalClient.workflow.start(
        generatePublicDigestAnimationWorkflow,
        {
          args: [workflowInput],
          taskQueue: TEMPORAL_QUEUES.DEFAULT,
          workflowId,
          workflowIdReusePolicy: 'ALLOW_DUPLICATE_FAILED_ONLY',
          workflowIdConflictPolicy: 'FAIL',
          memo: {
            jobId,
            externalUserId,
            title,
            sourceImageMimeType: sourceImage.mimeType,
            sourceImageStoragePath: sourceImage.storagePath,
          },
        },
      );
    } catch (error) {
      const conflictingDescription =
        await describeDigestAnimationWorkflow(workflowId);
      const conflictingSourceImage = conflictingDescription
        ? getDigestAnimationSourceImageFromMemo(conflictingDescription)
        : undefined;

      if (
        !conflictingSourceImage ||
        conflictingSourceImage.storagePath !== sourceImage.storagePath
      ) {
        await deleteOrphanedDigestAnimationSourceImage(sourceImage);
      }

      if (!conflictingDescription) {
        throw error;
      }

      logger.info(
        { jobId, workflowId },
        'Digest animation workflow already exists; returning existing job',
      );

      const workflowStatus = conflictingDescription.status.name;
      if (
        getDigestAnimationWorkflowExternalUserId(conflictingDescription) !==
        externalUserId
      ) {
        return c.json({ error: 'Not Found' }, 404);
      }

      if (isDigestAnimationWorkflowActive(workflowStatus)) {
        return c.json(
          buildDigestAnimationProcessingResponse({
            jobId,
            workflowId,
            externalUserId,
            title,
            sourceImage: conflictingSourceImage,
          }),
          202,
        );
      }

      if (workflowStatus === 'COMPLETED') {
        const result =
          await getDigestAnimationWorkflowHandle(workflowId).result();
        if (result.externalUserId !== externalUserId) {
          return c.json({ error: 'Not Found' }, 404);
        }

        return c.json({
          status: 'succeeded',
          workflowStatus,
          ...result,
        });
      }

      throw error;
    }

    return c.json(
      buildDigestAnimationProcessingResponse({
        jobId,
        workflowId,
        externalUserId,
        title,
        sourceImage,
        createdAt: new Date(),
      }),
      202,
    );
  } catch (error) {
    logger.error({ error }, 'Public digest animation workflow start failed');
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to start digest animation',
      },
      500,
    );
  }
});

publicAiRouter.get('/generate-digest-animation/:id', async (c) => {
  const apiKey = c.req.header('x-api-key');
  if (!validateApiKey(apiKey, secrets.API_AUTH_KEY)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const params = getDigestAnimationJobParamsSchema.safeParse(c.req.param());
  const query = getDigestAnimationJobQuerySchema.safeParse(c.req.query());

  if (!params.success || !query.success) {
    const issues = [
      ...(params.success ? [] : params.error.issues),
      ...(query.success ? [] : query.error.issues),
    ];
    return c.json(
      {
        error: 'Bad Request',
        message: issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', '),
      },
      400,
    );
  }

  const jobId = params.data.id;
  const workflowId = buildDigestAnimationWorkflowId(jobId);
  const handle = getDigestAnimationWorkflowHandle(workflowId);

  try {
    const description = await handle.describe();
    const workflowStatus = description.status.name;
    if (
      getDigestAnimationWorkflowExternalUserId(description) !==
      query.data.externalUserId
    ) {
      return c.json({ error: 'Not Found' }, 404);
    }

    if (workflowStatus === 'COMPLETED') {
      const result = await handle.result();
      if (result.externalUserId !== query.data.externalUserId) {
        return c.json({ error: 'Not Found' }, 404);
      }

      return c.json({
        status: 'succeeded',
        workflowStatus,
        ...result,
      });
    }

    if (workflowStatus === 'RUNNING') {
      return c.json(
        {
          id: jobId,
          workflowId,
          status: 'processing',
          workflowStatus,
          retryAfterSeconds: 20,
          externalUserId: query.data.externalUserId,
          type: 'digest_animation',
        },
        202,
      );
    }

    let message = `Digest animation workflow ended with status ${workflowStatus}`;
    try {
      await handle.result();
    } catch (error) {
      message = formatUnknownError(error);
    }

    return c.json({
      id: jobId,
      workflowId,
      externalUserId: query.data.externalUserId,
      type: 'digest_animation',
      status: 'failed',
      workflowStatus,
      error: message,
    });
  } catch (error) {
    if (error instanceof WorkflowNotFoundError) {
      return c.json({ error: 'Not Found' }, 404);
    }

    logger.error({ error, jobId, workflowId }, 'Failed to fetch digest job');
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch digest animation job',
      },
      500,
    );
  }
});

const getGenerationParamsSchema = z.object({
  id: z.string().uuid(),
});

const getGenerationQuerySchema = z.object({
  externalUserId: z.string().min(1, 'externalUserId is required'),
});

publicAiRouter.get('/generations/:id', async (c) => {
  const apiKey = c.req.header('x-api-key');
  if (!validateApiKey(apiKey, secrets.API_AUTH_KEY)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const params = getGenerationParamsSchema.safeParse(c.req.param());
  const query = getGenerationQuerySchema.safeParse(c.req.query());

  if (!params.success || !query.success) {
    const issues = [
      ...(params.success ? [] : params.error.issues),
      ...(query.success ? [] : query.error.issues),
    ];
    return c.json(
      {
        error: 'Bad Request',
        message: issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', '),
      },
      400,
    );
  }

  try {
    const [record] = await db
      .select()
      .from(publicAiGenerationsTable)
      .where(
        and(
          eq(publicAiGenerationsTable.id, params.data.id),
          eq(
            publicAiGenerationsTable.externalUserId,
            query.data.externalUserId,
          ),
        ),
      )
      .limit(1);

    if (!record) {
      return c.json({ error: 'Not Found' }, 404);
    }

    const output = record.output;
    const url = output.storagePath
      ? generateUrlFromStoragePath(
          output.storagePath,
          config.CLOUD_FRONT_DOMAIN,
        )
      : null;
    const model =
      output.type === 'animation' ? output.model : output.imageModel;

    return c.json({
      id: record.id,
      externalUserId: record.externalUserId,
      domain: record.domain,
      type: record.type,
      logoType: output.type === 'logo' ? output.logoType : undefined,
      logoStyle: output.type === 'logo' ? output.logoStyle : undefined,
      collateralType:
        output.type === 'marketing' ? output.collateralType : undefined,
      model,
      url,
      storagePath: output.storagePath,
      tokenUsage: record.tokenUsage,
      createdAt: record.createdAt,
      metadata: record.metadata,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch public AI generation');
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch generation',
      },
      500,
    );
  }
});

export { publicAiRouter };
