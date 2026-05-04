import { db, publicAiGenerationsTable } from '@namefi-astra/db';
import {
  DIGEST_ANIMATION_MODEL_IDS,
  DIGEST_ANIMATION_SHEET_MODEL_IDS,
  LOGO_TEXT_TREATMENT_INPUT_IDS,
  LOGO_TYPOGRAPHY_INPUT_IDS,
  LOGO_STYLE_INPUT_IDS,
  LOGO_TYPE_INPUT_IDS,
  runDigestAnimationWorkflow,
  runLogoWorkflow,
} from '@namefi-astra/ai';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import {
  createS3Client,
  generateUrlFromStoragePath,
} from '@namefi-astra/storage';
import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { validateApiKey } from '#lib/validate-api-key';
import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

const logger = createLogger({ context: 'PUBLIC_AI_GENERATION' });
const publicAiRouter = new Hono<{ Variables: { requestId: string } }>();

const s3Client = createS3Client({
  AWS_ACCESS_KEY_ID: secrets.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: secrets.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: config.AWS_REGION,
});

const logoStorageConfig = {
  bucketName: config.STORAGE_BUCKET,
  cloudfrontDomain: config.CLOUD_FRONT_DOMAIN,
  s3Client,
  baseFolder: config.AI_BUCKET_FOLDERS.LOGOS,
};

const animationStorageConfig = {
  bucketName: config.STORAGE_BUCKET,
  cloudfrontDomain: config.CLOUD_FRONT_DOMAIN,
  s3Client,
  baseFolder: config.AI_BUCKET_FOLDERS.ANIMATIONS,
};

const DIGEST_ANIMATION_IMAGE_DATA_URL_PATTERN =
  /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+$/;
const MAX_DIGEST_ANIMATION_IMAGE_DATA_URL_LENGTH = 15_000_000;

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
      storage: logoStorageConfig,
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
    const animationResult = await runDigestAnimationWorkflow({
      title,
      imageDataUrl,
      domains,
      summary,
      model,
      sheetModel,
      storage: animationStorageConfig,
    });
    const tokenUsage = animationResult.animationSheet.tokenUsage
      ? [
          {
            model: animationResult.animationSheet.model,
            inputTokens:
              animationResult.animationSheet.tokenUsage.inputTokens ?? 0,
            outputTokens:
              animationResult.animationSheet.tokenUsage.outputTokens ?? 0,
            totalTokens: animationResult.animationSheet.tokenUsage.totalTokens,
          },
        ]
      : [];

    // Digest animation persistence is owned by Labs; Astra only returns assets.
    return c.json({
      id: c.get('requestId'),
      externalUserId,
      title,
      type: 'digest_animation',
      model: animationResult.video.model,
      sheetModel: animationResult.animationSheet.model,
      url: animationResult.video.url,
      storagePath: animationResult.video.storagePath,
      mimeType: animationResult.video.mimeType,
      sourceImageUrl: animationResult.sourceImage.url,
      sourceImageStoragePath: animationResult.sourceImage.storagePath,
      sourceImageMimeType: animationResult.sourceImage.mimeType,
      sheetUrl: animationResult.animationSheet.url,
      sheetStoragePath: animationResult.animationSheet.storagePath,
      sheetPrompt: animationResult.animationSheet.prompt,
      videoPrompt: animationResult.prompt,
      warnings: animationResult.warnings,
      providerMetadata: animationResult.providerMetadata,
      tokenUsage,
      createdAt: new Date(),
    });
  } catch (error) {
    logger.error({ error }, 'Public digest animation generation failed');
    return c.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to generate digest animation',
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
