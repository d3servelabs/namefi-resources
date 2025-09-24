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
  analyzeLogoRequirements,
  generateLogo,
  generateMarketingImage,
  analyzeCollateralRequirements,
} from '@namefi-astra/ai';
import type { MarketingCollateralType } from '@namefi-astra/ai';

const s3Client = createS3Client({
  AWS_ACCESS_KEY_ID: secrets.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: secrets.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: config.AWS_REGION,
});

const storageConfig = {
  bucketName: config.STORAGE_BUCKET,
  cloudfrontDomain: config.CLOUD_FRONT_DOMAIN,
  s3Client,
};

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
  type: z.string().min(1, 'Logo type is required'),
  style: z.string().min(1, 'Logo style is required'),
  model: z
    .enum(['gpt-image-1', 'gemini-2.5-flash-image-preview'])
    .default('gpt-image-1'),
});

const generateMarketingImageInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  description: z.string().optional(),
  referenceLogoGenerationId: z.string().optional(),
  collateralType: z
    .union([
      z.enum(['billboard', 'apparel', 'vehicle', 'product']),
      z.literal('let_ai_choose'),
    ])
    .default('let_ai_choose'),
  model: z
    .enum(['gpt-image-1', 'gemini-2.5-flash-image-preview'])
    .default('gemini-2.5-flash-image-preview'),
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

        const { domain, description, type, style, model } = input;

        // Step 1: Analyze brand and generate logo concept
        const {
          data: logoConcept,
          tokenUsage: logoConceptTokenUsage,
          model: logoConceptModel,
        } = await analyzeLogoRequirements(domain, description, type, style);

        // Step 2: Generate logo image
        const generatedLogo = await generateLogo({
          domain,
          logoConcept: logoConcept.logoConcept,
          storage: {
            ...storageConfig,
            baseFolder: config.AI_BUCKET_FOLDERS.LOGOS,
          },
          model,
        });

        if (!generatedLogo) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate logo',
          });
        }

        const aggregateTokenUsage = [
          {
            model: logoConceptModel,
            inputTokens: logoConceptTokenUsage?.input_tokens ?? 0,
            outputTokens: logoConceptTokenUsage?.output_tokens ?? 0,
          },
          {
            model: generatedLogo.model,
            inputTokens: generatedLogo.tokenUsage?.input_tokens ?? 0,
            outputTokens: generatedLogo.tokenUsage?.output_tokens ?? 0,
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
            },
            output: {
              type: 'logo',
              storagePath: generatedLogo.storagePath,
              externalId: generatedLogo.generationCallId,
              logoType: logoConcept.logoConcept.type,
              logoStyle: logoConcept.logoConcept.style,
            },
            tokenUsage: aggregateTokenUsage,
          })
          .returning();

        const publicUrl = generateUrlFromStoragePath(
          generatedLogo.storagePath,
          config.CLOUD_FRONT_DOMAIN,
        );

        return {
          ...generationRecord,
          url: publicUrl,
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
        let referenceLogoGenerationExternalId: string | undefined;
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
              ),
            )
            .then((results) => results[0]);

          if (referenceLogoGeneration) {
            referenceLogoGenerationExternalId =
              referenceLogoGeneration.output.externalId;
            referenceLogoPublicUrl = generateUrlFromStoragePath(
              referenceLogoGeneration.output.storagePath,
              config.CLOUD_FRONT_DOMAIN,
            );
          }
        }

        // Step 4: Choose collateral via AI if requested, else use provided type
        let resolvedCollateralType: MarketingCollateralType;

        let rewrittenPrompt: string | undefined;

        if (collateralType === 'let_ai_choose') {
          const analysis = await analyzeCollateralRequirements(
            domain,
            description,
            1,
          );
          const pick = analysis.data.picks[0];
          resolvedCollateralType = pick.collateralType;
          // Include user's description context if provided
          rewrittenPrompt = description
            ? `${pick.prompt}\n\nBrand details: ${description}`
            : pick.prompt;
        } else {
          resolvedCollateralType = collateralType;
          // Even when user picks a specific type, generate a rewritten prompt via analysis
          const analysis = await analyzeCollateralRequirements(
            domain,
            description,
            1,
            [resolvedCollateralType],
          );
          const pick = analysis.data.picks[0];
          rewrittenPrompt = description
            ? `${pick.prompt}\n\nBrand details: ${description}`
            : pick.prompt;
        }

        // Step 5: Generate single image
        const generatedImage = await generateMarketingImage({
          domain,
          storage: {
            ...storageConfig,
            baseFolder: config.AI_BUCKET_FOLDERS.SOCIAL,
          },
          basedOnLogoCallId: referenceLogoGenerationExternalId,
          basedOnLogoPublicUrl: referenceLogoPublicUrl,
          model,
          collateralType: resolvedCollateralType,
          rewrittenPrompt,
        });

        if (!generatedImage) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate marketing image',
          });
        }

        const aggregateTokenUsage = [
          {
            model: generatedImage.model,
            inputTokens: generatedImage.tokenUsage?.input_tokens ?? 0,
            outputTokens: generatedImage.tokenUsage?.output_tokens ?? 0,
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
              storagePath: generatedImage.storagePath,
              externalId: generatedImage.generationCallId,
              collateralType: resolvedCollateralType,
            },
            tokenUsage: aggregateTokenUsage,
            referenceGenerationId: referenceLogoGenerationId,
          })
          .returning();

        const publicUrl = generateUrlFromStoragePath(
          generatedImage.storagePath,
          config.CLOUD_FRONT_DOMAIN,
        );

        return {
          ...generationRecord,
          url: publicUrl,
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
      .where(eq(aiGenerationsTable.userId, ctx.user.id))
      .groupBy(aiGenerationsTable.domain)
      .orderBy(desc(latestGenerationAlias));

    // Single additional query for previews using a window function, then group in memory
    const previewRows = await db.execute(
      sql`SELECT id, domain, type, created_at, output
            FROM (
              SELECT
                id,
                domain,
                type,
                created_at,
                output,
                ROW_NUMBER() OVER (PARTITION BY domain ORDER BY created_at DESC) AS rn
              FROM ai_generations
              WHERE user_id = ${ctx.user.id}
            ) ranked
            WHERE rn <= 3;`,
    );

    const previewRowSchema = z.object({
      id: z.string().uuid(),
      domain: namefiNormalizedDomainSchema,
      type: z.enum(['logo', 'marketing']),
      created_at: z.coerce.date(),
      output: z.object({ storagePath: z.string() }),
    });
    const parsedPreviewRows = previewRowSchema.array().parse(previewRows.rows);

    type PreviewGeneration = {
      id: string;
      type: 'logo' | 'marketing';
      createdAt: Date;
      url: string;
    };
    const previewsByDomain = new Map<string, PreviewGeneration[]>();
    for (const r of parsedPreviewRows) {
      const list = previewsByDomain.get(r.domain) ?? [];
      list.push({
        id: r.id,
        type: r.type,
        createdAt: r.created_at,
        url: generateUrlFromStoragePath(
          r.output.storagePath,
          config.CLOUD_FRONT_DOMAIN,
        ),
      });
      previewsByDomain.set(r.domain, list);
    }

    return domains.map((d) => ({
      ...d,
      previewGenerations: previewsByDomain.get(d.domain) ?? [],
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

  getGenerationById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [generation] = await db
        .select()
        .from(aiGenerationsTable)
        .where(eq(aiGenerationsTable.id, input.id));

      return {
        ...generation,
        url: generateUrlFromStoragePath(
          generation.output.storagePath,
          config.CLOUD_FRONT_DOMAIN,
        ),
      };
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
        domains: z.array(namefiNormalizedDomainSchema).min(1),
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
