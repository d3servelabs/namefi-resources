import { config, secrets } from '#lib/env';

import { db } from '@namefi-astra/db';
import {
  aiGenerationsTable,
  internalAiGenerationsTable,
} from '@namefi-astra/db/schema';
import {
  createS3Client,
  generateUrlFromStoragePath,
} from '@namefi-astra/storage';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, inArray, max, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../base';
import { createLogger } from '#lib/logger';
const logger = createLogger({ module: 'ai-router' });
import {
  LOGO_TEXT_TREATMENT_INPUT_IDS,
  LOGO_TYPOGRAPHY_INPUT_IDS,
  LOGO_STYLE_INPUT_IDS,
  LOGO_TYPE_INPUT_IDS,
  MARKETING_COLLATERAL_TYPE_INPUT_IDS,
  runLogoWorkflow,
  runMarketingWorkflow,
} from '@namefi-astra/ai';

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

function createStorageConfig(baseFolder: string) {
  return {
    ...storageBaseConfig,
    baseFolder,
  };
}

/**
 * Check if user has reached the maximum number of AI generations for the current month
 * @param userId - The user ID to check
 * @returns Promise<boolean> - true if user has reached the monthly limit, false otherwise
 */
async function checkUserGenerationLimit(userId: string): Promise<boolean> {
  const result = await db
    .select({ count: count() })
    .from(aiGenerationsTable)
    .where(
      and(
        eq(aiGenerationsTable.userId, userId),
        sql`${aiGenerationsTable.createdAt} >= date_trunc('month', now())`,
      ),
    );

  const currentCount = result[0]?.count || 0;
  return currentCount >= config.MAX_AI_GENERATIONS_PER_USER_PER_MONTH;
}

const generateLogoInputSchema = z.object({
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

const generateMarketingImageInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  description: z.string().optional(),
  referenceLogoGenerationId: z.string().optional(),
  collateralType: z
    .enum(MARKETING_COLLATERAL_TYPE_INPUT_IDS)
    .default('let_ai_choose'),
  model: z
    .enum([
      'gpt-image-1',
      'gpt-image-1.5',
      'gemini-2.5-flash-image',
      'gemini-3-pro-image-preview',
    ])
    .default('gemini-3-pro-image-preview'),
});

export const aiRouter = createTRPCRouter({
  generateLogo: protectedProcedure
    .input(generateLogoInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check user generation limit before proceeding
        const hasReachedLimit = await checkUserGenerationLimit(ctx.user.id);
        if (hasReachedLimit) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `You have reached the maximum limit of ${config.MAX_AI_GENERATIONS_PER_USER_PER_MONTH} AI generations for this month. Please try again next month or contact support for more information.`,
          });
        }

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

        // Step 3: Create generation record only after successful generation
        const [generationRecord] = await db
          .insert(aiGenerationsTable)
          .values({
            userId: ctx.user.id,
            domain,
            type: 'logo',
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

        return {
          ...generationRecord,
          url: logoResult.image.url,
        };
      } catch (error) {
        logger.error({ error }, 'Logo generation error');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to generate logo',
        });
      }
    }),

  generatePoster: protectedProcedure
    .input(generateMarketingImageInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check user generation limit before proceeding
        const hasReachedLimit = await checkUserGenerationLimit(ctx.user.id);
        if (hasReachedLimit) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `You have reached the maximum limit of ${config.MAX_AI_GENERATIONS_PER_USER_PER_MONTH} AI generations for this month. Please try again next month or contact support for more information.`,
          });
        }

        const {
          domain,
          description,
          referenceLogoGenerationId,
          model,
          collateralType,
        } = input;

        // Step 1: Find reference generation if basedOnLogoCallId provided
        let referenceLogoPublicUrl: string | undefined;
        if (referenceLogoGenerationId) {
          const referenceLogoGeneration = await db
            .select()
            .from(aiGenerationsTable)
            .where(
              and(
                eq(aiGenerationsTable.userId, ctx.user.id),
                eq(aiGenerationsTable.id, referenceLogoGenerationId),
                eq(aiGenerationsTable.type, 'logo'),
                eq(aiGenerationsTable.isDeleted, false),
              ),
            )
            .then((results) => results[0]);

          if (referenceLogoGeneration) {
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

        // Step 6: Create generation record only after successful generation
        const [generationRecord] = await db
          .insert(aiGenerationsTable)
          .values({
            userId: ctx.user.id,
            domain,
            type: 'marketing',
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

        return {
          ...generationRecord,
          url: marketingResult.image.url,
        };
      } catch (error) {
        logger.error({ error }, 'Poster generation error');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to generate posters',
        });
      }
    }),

  getGenerationsByDomain: protectedProcedure
    .input(
      z.object({
        domain: namefiNormalizedDomainSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
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

      return generations.map((generation) => ({
        ...generation,
        url: generateUrlFromStoragePath(
          generation.output.storagePath,
          config.CLOUD_FRONT_DOMAIN,
        ),
      }));
    }),

  getUserDomains: protectedProcedure.query(async ({ ctx }) => {
    const latestGenerationAlias = max(aiGenerationsTable.createdAt).as(
      'latestGeneration',
    );

    const domains = await db
      .select({
        domain: aiGenerationsTable.domain,
        latestGeneration: latestGenerationAlias,
        logoCount: count(
          sql`CASE WHEN ${aiGenerationsTable.type} = 'logo' THEN 1 END`,
        ).as('logoCount'),
        marketingCount: count(
          sql`CASE WHEN ${aiGenerationsTable.type} = 'marketing' THEN 1 END`,
        ).as('marketingCount'),
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

    return domains;
  }),

  getUserGenerationsFiltered: protectedProcedure
    .input(
      z.object({
        types: z
          .array(z.enum(['logo', 'marketing']))
          .min(1)
          .default(['logo', 'marketing']),
        domains: z.array(namefiNormalizedDomainSchema).optional(),
        limit: z.number().int().min(1).max(200).default(100),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereConds = [
        eq(aiGenerationsTable.userId, ctx.user.id),
        eq(aiGenerationsTable.isDeleted, false),
      ];

      if (input.types && input.types.length > 0) {
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

      return rows.map((generation) => ({
        ...generation,
        url: generateUrlFromStoragePath(
          generation.output.storagePath,
          config.CLOUD_FRONT_DOMAIN,
        ),
      }));
    }),

  getGenerationsByType: protectedProcedure
    .input(
      z.object({
        domain: namefiNormalizedDomainSchema,
        type: z.enum(['logo', 'marketing']),
      }),
    )
    .query(async ({ input, ctx }) => {
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

      return generations.map((generation) => ({
        ...generation,
        url: generateUrlFromStoragePath(
          generation.output.storagePath,
          config.CLOUD_FRONT_DOMAIN,
        ),
      }));
    }),

  getFeaturedAndRecentGenerations: publicProcedure.query(async () => {
    const selectFields = {
      id: aiGenerationsTable.id,
      domain: aiGenerationsTable.domain,
      type: aiGenerationsTable.type,
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
            eq(aiGenerationsTable.isDeleted, false),
          ),
        )
        .orderBy(desc(aiGenerationsTable.createdAt)),
      db
        .select(selectFields)
        .from(aiGenerationsTable)
        .where(eq(aiGenerationsTable.isDeleted, false))
        .orderBy(desc(aiGenerationsTable.createdAt))
        .limit(50),
    ]);

    const mapRows = (rows: typeof featuredRows) =>
      rows.map((row) => ({
        id: row.id,
        domain: row.domain,
        type: row.type,
        createdAt: row.createdAt,
        url: generateUrlFromStoragePath(
          row.output.storagePath,
          config.CLOUD_FRONT_DOMAIN,
        ),
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

      return {
        ...generation,
        url: generateUrlFromStoragePath(
          generation.output.storagePath,
          config.CLOUD_FRONT_DOMAIN,
        ),
      };
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

      return rows.map((row) => ({
        id: row.id,
        domain: row.domain,
        type: row.type,
        createdAt: row.createdAt,
        url: generateUrlFromStoragePath(
          row.output.storagePath,
          config.CLOUD_FRONT_DOMAIN,
        ),
      }));
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
        Array<{ id: string; type: string; createdAt: Date; url: string }>
      > = {};
      for (const row of rows) {
        const url = generateUrlFromStoragePath(
          row.output.storagePath,
          config.CLOUD_FRONT_DOMAIN,
        );
        if (!domainToRows[row.domain]) domainToRows[row.domain] = [];
        domainToRows[row.domain].push({
          id: row.id,
          type: row.type,
          createdAt: row.createdAt,
          url,
        });
      }

      return domainToRows;
    }),

  getUserGenerationUsage: protectedProcedure.query(async ({ ctx }) => {
    const result = await db
      .select({ count: count() })
      .from(aiGenerationsTable)
      .where(
        and(
          eq(aiGenerationsTable.userId, ctx.user.id),
          sql`${aiGenerationsTable.createdAt} >= date_trunc('month', now())`,
        ),
      );

    const currentCount = result[0]?.count || 0;
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
