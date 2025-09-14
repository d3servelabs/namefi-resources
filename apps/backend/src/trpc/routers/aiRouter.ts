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
import { and, count, desc, eq, max, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../base';
const { analyzeLogoRequirements, generateLogo, generateMarketingImage } =
  await import('@namefi-astra/ai');

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
  model: z
    .enum(['gpt-image-1', 'gemini-2.5-flash-image-preview'])
    .default('gpt-image-1'),
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
        console.error('Logo generation error:', error);
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

        const { domain, description, referenceLogoGenerationId, model } = input;

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

        // Step 4: Generate single image
        const generatedImage = await generateMarketingImage({
          domain,
          storage: {
            ...storageConfig,
            baseFolder: config.AI_BUCKET_FOLDERS.SOCIAL,
          },
          basedOnLogoCallId: referenceLogoGenerationExternalId,
          basedOnLogoPublicUrl: referenceLogoPublicUrl,
          model,
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

        // Step 5: Create generation record only after successful generation
        const [generationRecord] = await db
          .insert(aiGenerationsTable)
          .values({
            userId: ctx.user.id,
            domain,
            type: 'marketing',
            input: {
              type: 'marketing',
              description,
            },
            output: {
              type: 'marketing',
              storagePath: generatedImage.storagePath,
              externalId: generatedImage.generationCallId,
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
        console.error('Poster generation error:', error);
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

    return domains;
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
