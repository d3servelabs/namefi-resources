import { db, publicAiGenerationsTable } from '@namefi-astra/db';
import {
  LOGO_TEXT_TREATMENT_INPUT_IDS,
  LOGO_TYPOGRAPHY_INPUT_IDS,
  LOGO_STYLE_INPUT_IDS,
  LOGO_TYPE_INPUT_IDS,
  runLogoWorkflow,
} from '@namefi-astra/ai';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import {
  createS3Client,
  generateUrlFromStoragePath,
} from '@namefi-astra/storage';
import { config, secrets } from '#lib/env';
import { createLogger } from '#lib/logger';
import { timingSafeEqual } from 'node:crypto';
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
      'gemini-2.5-flash-image',
      'gemini-3-pro-image-preview',
    ])
    .default('gpt-image-1.5'),
});

publicAiRouter.post('/generate-logo', async (c) => {
  const apiKey = c.req.header('x-api-key');
  const authKey = secrets.API_AUTH_KEY;

  if (
    !apiKey ||
    apiKey.length !== authKey.length ||
    !timingSafeEqual(Buffer.from(apiKey), Buffer.from(authKey))
  ) {
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

const getGenerationParamsSchema = z.object({
  id: z.string().uuid(),
});

const getGenerationQuerySchema = z.object({
  externalUserId: z.string().min(1, 'externalUserId is required'),
});

publicAiRouter.get('/generations/:id', async (c) => {
  const apiKey = c.req.header('x-api-key');
  const authKey = secrets.API_AUTH_KEY;

  if (
    !apiKey ||
    apiKey.length !== authKey.length ||
    !timingSafeEqual(Buffer.from(apiKey), Buffer.from(authKey))
  ) {
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
    const url = generateUrlFromStoragePath(
      output.storagePath,
      config.CLOUD_FRONT_DOMAIN,
    );

    return c.json({
      id: record.id,
      externalUserId: record.externalUserId,
      domain: record.domain,
      type: record.type,
      logoType: output.type === 'logo' ? output.logoType : undefined,
      logoStyle: output.type === 'logo' ? output.logoStyle : undefined,
      collateralType:
        output.type === 'marketing' ? output.collateralType : undefined,
      model: output.imageModel,
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
