import {
  analyzeDomain,
  analyzeLogoRequirements,
  createRunId,
  generateLogo,
  generateMarketingImage,
  researchDomain,
} from '@namefi-astra/ai';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../base';

const generateLogoInputSchema = z.object({
  brandName: z.string().min(1, 'Brand name is required'),
  description: z.string().optional(),
  type: z.string().optional(),
  style: z.string().optional(),
});

const generateMarketingImageInputSchema = z.object({
  domain: z.string().min(1, 'Domain name is required'),
  description: z.string().optional(),
  basedOnLogoCallId: z.string().optional(),
});

export const aiRouter = createTRPCRouter({
  generateLogo: protectedProcedure
    .input(generateLogoInputSchema)
    .mutation(async ({ input }) => {
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

        return {
          success: true,
          runId,
          logo: generatedLogo,
          brandAnalysis: {
            brandAttributes: logoConcept.brandAttributes,
            targetAudience: logoConcept.targetAudience,
            visualIdentity: logoConcept.visualIdentity,
            colorPalette: logoConcept.colorPalette,
          },
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

  generateMarketingImage: protectedProcedure
    .input(generateMarketingImageInputSchema)
    .mutation(async ({ input }) => {
      try {
        const { domain, description, basedOnLogoCallId } = input;

        // Step 1: Research the domain
        const searchResults = await researchDomain(domain, description);

        // Step 2: Analyze domain and generate single marketing concept
        const research = await analyzeDomain(
          domain,
          description,
          searchResults,
        );

        // Step 3: Generate single image
        const runId = createRunId(domain);
        const generatedImage = await generateMarketingImage(
          domain,
          research.marketingConcept,
          runId,
          basedOnLogoCallId, // Pass the logo call ID for multi-turn
        );

        if (!generatedImage) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate marketing image',
          });
        }

        return {
          success: true,
          runId,
          image: generatedImage, // Single image instead of array
          domainResearch: {
            potentialUses: research.potentialUses,
            targetAudience: research.targetAudience,
            valueProposition: research.valueProposition,
            investmentHighlights: research.investmentHighlights,
          },
        };
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
});
