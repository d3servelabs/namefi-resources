import {
  analyzeDomain,
  analyzeLogoRequirements,
  createRunId,
  generateLogo,
  generateMarketingImage,
  researchDomain,
} from '@namefi-astra/ai';
import { db } from '@namefi-astra/db';
import { aiGenerationsTable } from '@namefi-astra/db/schema';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../base';

const generateLogoInputSchema = z.object({
  brandName: namefiNormalizedDomainSchema,
  description: z.string().optional(),
  type: z.string().min(1, 'Logo type is required'),
  style: z.string().min(1, 'Logo style is required'),
});

const generateMarketingImageInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  description: z.string().optional(),
  referenceLogoGenerationId: z.string().optional(),
});

export const aiRouter = createTRPCRouter({
  generateLogo: protectedProcedure
    .input(generateLogoInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { brandName, description, type, style } = input;

        // Step 1: Analyze brand and generate logo concept
        const logoConcept = await analyzeLogoRequirements(
          brandName,
          description,
          type,
          style,
        );

        // Step 2: Generate logo image
        const runId = createRunId(brandName);
        const generatedLogo = await generateLogo(
          brandName,
          logoConcept.logoConcept,
          runId,
        );

        if (!generatedLogo) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate logo',
          });
        }

        // Step 3: Create generation record only after successful generation
        const [generationRecord] = await db
          .insert(aiGenerationsTable)
          .values({
            userId: ctx.user.id,
            domain: brandName,
            type: 'logo',
            input: {
              type: 'logo',
              logoType: type,
              logoStyle: style,
              description,
            },
            output: {
              type: 'logo',
              url: generatedLogo.url,
              externalId: generatedLogo.generationCallId,
            },
          })
          .returning();

        return generationRecord;
      } catch (error) {
        console.error('Logo generation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to generate logo',
        });
      }
    }),

  generateMarketingImage: protectedProcedure
    .input(generateMarketingImageInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { domain, description, referenceLogoGenerationId } = input;

        // Step 1: Find reference generation if basedOnLogoCallId provided
        let referenceLogoGenerationExternalId: string | undefined;
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
          }
        }

        // Step 2: Research the domain
        const searchResults = await researchDomain(domain, description);

        // Step 3: Analyze domain and generate single marketing concept
        const research = await analyzeDomain(
          domain,
          description,
          searchResults,
        );

        // Step 4: Generate single image
        const runId = createRunId(domain);
        const generatedImage = await generateMarketingImage(
          domain,
          research.marketingConcept,
          runId,
          referenceLogoGenerationExternalId,
        );

        if (!generatedImage) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate marketing image',
          });
        }

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
              url: generatedImage.url,
              externalId: generatedImage.generationCallId,
            },
            referenceGenerationId: referenceLogoGenerationId,
          })
          .returning();

        return generationRecord;
      } catch (error) {
        console.error('Marketing image generation error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to generate marketing images',
        });
      }
    }),

  getGenerationsByDomain: protectedProcedure
    .input(
      z.object({
        domain: namefiNormalizedDomainSchema,
      }),
    )
    .query(({ input, ctx }) => {
      return db
        .select()
        .from(aiGenerationsTable)
        .where(
          and(
            eq(aiGenerationsTable.userId, ctx.user.id),
            eq(aiGenerationsTable.domain, input.domain),
          ),
        )
        .orderBy(desc(aiGenerationsTable.createdAt));
    }),

  getUserDomains: protectedProcedure.query(async ({ ctx }) => {
    const domains = await db
      .selectDistinct({
        domain: aiGenerationsTable.domain,
        latestGeneration: aiGenerationsTable.createdAt,
      })
      .from(aiGenerationsTable)
      .where(eq(aiGenerationsTable.userId, ctx.user.id))
      .orderBy(desc(aiGenerationsTable.createdAt));

    return domains;
  }),

  getGenerationsByType: protectedProcedure
    .input(
      z.object({
        domain: namefiNormalizedDomainSchema,
        type: z.enum(['logo', 'marketing']),
      }),
    )
    .query(({ input, ctx }) => {
      return db
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
    }),
});
