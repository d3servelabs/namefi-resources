import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import { createContract } from './create-contract';
import type { RouterContract } from './trpc-contract';

/**
 * Contract for the AI router.
 *
 * The router (`apps/backend/src/trpc/routers/aiRouter.ts`) is type-checked
 * against this contract via `createContractTRPCRouter<typeof aiContract>`.
 * Every procedure is `protectedProcedure` except
 * `getFeaturedAndRecentGenerations`, `getGenerationById`,
 * `getInternalGenerationsByDomain`, and `getInternalGenerationsByDomains`
 * which are `publicProcedure`. The contract doesn't care which base the
 * router picks.
 *
 * The AI generation row (returned by most queries / mutations) is a
 * large nested discriminated union with drizzle columns + computed URL
 * fields. Modeled via `z.custom<T>()` so we don't need to re-express the
 * shape in zod.
 */

// ---------------------------------------------------------------------------
// Enum mirrors (lifted from `@namefi-astra/ai` string-literal constants)
// ---------------------------------------------------------------------------

const logoTypeSchema = z.enum([
  'abstract-icon',
  'image-icon',
  'let-ai-choose',
  'letter-mark',
  'mascot',
  'wordmark',
]);

const logoStyleSchema = z.enum([
  'bold',
  'classic',
  'confidence',
  'fun-playful',
  'innovative',
  'joy',
  'let-ai-choose',
  'luxury',
  'peace',
  'purity',
  'retro',
  'trust',
  'warm-inviting',
]);

const logoTextTreatmentSchema = z.enum([
  'full-domain',
  'let-ai-choose',
  'stacked-domain',
  'tld-highlight',
  'tld-subtle',
]);

const logoTypographySchema = z.enum([
  'let-ai-choose',
  'monospace',
  'sans-serif',
  'script',
  'serif',
  'slab-serif',
]);

const imageModelSchema = z.enum([
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
  'gpt-image-1',
  'gpt-image-1.5',
]);

const marketingCollateralTypeSchema = z.enum([
  'apparel',
  'billboard',
  'let_ai_choose',
  'product',
  'vehicle',
]);

const animationSourceModeSchema = z.enum(['exact-frame', 'subject-reference']);

const cinematicMotionPresetSchema = z.enum([
  'atmospheric-rise',
  'dimensional-parallax',
  'energy-surge',
  'let-ai-choose',
  'orbital-reveal',
  'prismatic-bloom',
]);

const cinematicModelSchema = z.enum([
  'veo-3.1-fast-generate-preview',
  'veo-3.1-generate-preview',
]);

const loopedMotionPresetSchema = z.enum([
  'ambient-orbit',
  'breathe',
  'contour-trace',
  'glow-pulse',
  'gradient-drift',
  'let-ai-choose',
  'light-sweep',
  'micro-parallax',
  'shimmer',
]);

const animationMotionIntensitySchema = z.enum(['balanced', 'bold', 'subtle']);

const loopedModelSchema = z.enum([
  'bytedance/seedance-v1.0-pro',
  'bytedance/seedance-v1.5-pro',
]);

const generationTypeSchema = z.enum(['logo', 'marketing', 'animation']);

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

const generateLogoInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  description: z.string().optional(),
  type: logoTypeSchema,
  style: logoStyleSchema,
  textTreatment: logoTextTreatmentSchema,
  typography: logoTypographySchema,
  model: imageModelSchema.default('gpt-image-1.5'),
});

const generatePosterInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  description: z.string().optional(),
  referenceLogoGenerationId: z.string().optional(),
  collateralType: marketingCollateralTypeSchema.default('let_ai_choose'),
  model: imageModelSchema.default('gemini-3-pro-image-preview'),
});

const generateAnimationCommonInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  referenceLogoGenerationId: z.string(),
  description: z.string().optional(),
});

const generateCinematicAnimationInputSchema = generateAnimationCommonInputSchema
  .extend({
    mode: z.literal('cinematic'),
    sourceMode: animationSourceModeSchema.default('exact-frame'),
    motionPreset: cinematicMotionPresetSchema.default('let-ai-choose'),
    model: cinematicModelSchema.default('veo-3.1-generate-preview'),
  })
  .strict();

const generateLoopedAnimationInputSchema = generateAnimationCommonInputSchema
  .extend({
    mode: z.literal('looped'),
    motionPreset: loopedMotionPresetSchema.default('let-ai-choose'),
    motionIntensity: animationMotionIntensitySchema.default('subtle'),
    model: loopedModelSchema.default('bytedance/seedance-v1.5-pro'),
  })
  .strict();

const generateAnimationInputSchema = z.discriminatedUnion('mode', [
  generateCinematicAnimationInputSchema,
  generateLoopedAnimationInputSchema,
]);

const getGenerationsByDomainInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
});

const getUserGenerationsFilteredInputSchema = z.object({
  types: z
    .array(generationTypeSchema)
    .min(1)
    .default(['logo', 'marketing', 'animation']),
  domains: z.array(namefiNormalizedDomainSchema).optional(),
  limit: z.number().int().min(1).max(200).default(100),
});

const getGenerationsByTypeInputSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  type: generationTypeSchema,
});

const idInputSchema = z.object({ id: z.string() });

const getInternalGenerationsByDomainsInputSchema = z.object({
  domains: z.array(namefiNormalizedDomainSchema).min(1).max(200),
});

// ---------------------------------------------------------------------------
// Outputs — backend drizzle-row aggregates modeled via z.custom<T>()
// ---------------------------------------------------------------------------

/**
 * `mapAiGenerationRecord`'s return shape: the `aiGenerationsTable` row
 * (with branded `domain`, discriminated `input`/`output` union, etc.)
 * PLUS `{ url, thumbnailUrl, mimeType }` computed fields.
 *
 * Declared as a real `z.object(...)` so tRPC's caller-side type helpers
 * propagate the shape through `queryOptions(...)` cleanly — top-level
 * `z.custom<T>` / `z.any()` outputs collapse to `() => never` at the
 * `TRPCOptionsProxy` layer.
 */
const aiLogoInputSchema = z.object({
  type: z.literal('logo'),
  logoType: z.string(),
  logoStyle: z.string(),
  description: z.string().optional(),
  textTreatment: z.string().optional(),
  typography: z.string().optional(),
});

const aiMarketingInputSchema = z.object({
  type: z.literal('marketing'),
  description: z.string().optional(),
  collateralType: marketingCollateralTypeSchema,
});

const aiCinematicAnimationInputRowSchema = z.object({
  type: z.literal('animation'),
  mode: z.literal('cinematic'),
  description: z.string().optional(),
  sourceMode: animationSourceModeSchema.optional(),
  motionPreset: cinematicMotionPresetSchema,
  model: cinematicModelSchema,
});

const aiLoopedAnimationInputRowSchema = z.object({
  type: z.literal('animation'),
  mode: z.literal('looped'),
  description: z.string().optional(),
  motionPreset: loopedMotionPresetSchema,
  motionIntensity: animationMotionIntensitySchema,
  model: loopedModelSchema,
});

const aiGenerationInputUnionSchema = z.union([
  aiLogoInputSchema,
  aiMarketingInputSchema,
  aiCinematicAnimationInputRowSchema,
  aiLoopedAnimationInputRowSchema,
]);

const aiLogoOutputSchema = z.object({
  type: z.literal('logo'),
  storagePath: z.string(),
  logoType: z.string().optional(),
  logoStyle: z.string().optional(),
  textTreatment: z.string().optional(),
  typography: z.string().optional(),
});

const aiMarketingOutputSchema = z.object({
  type: z.literal('marketing'),
  storagePath: z.string(),
  collateralType: marketingCollateralTypeSchema,
});

const aiAnimationOutputSchema = z.object({
  type: z.literal('animation'),
  storagePath: z.string().optional(),
  thumbnailStoragePath: z.string(),
  mimeType: z.literal('video/mp4'),
  model: z.union([cinematicModelSchema, loopedModelSchema]),
});

const aiGenerationOutputUnionSchema = z.union([
  aiLogoOutputSchema,
  aiMarketingOutputSchema,
  aiAnimationOutputSchema,
]);

const aiTokenUsageSchema = z.object({
  model: z.string(),
  inputTokens: z.number(),
  outputTokens: z.number(),
});

const aiGenerationStatusSchema = z.enum([
  'FAILED',
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
]);

const aiGenerationRecordSchema = z.object({
  createdAt: z.date(),
  domain: namefiNormalizedDomainSchema,
  errorMessage: z.string().nullable(),
  featured: z.boolean(),
  finishedAt: z.date().nullable(),
  id: z.string(),
  input: aiGenerationInputUnionSchema,
  isDeleted: z.boolean(),
  metadata: z.unknown(),
  output: aiGenerationOutputUnionSchema,
  referenceGenerationId: z.string().nullable(),
  startedAt: z.date().nullable(),
  status: aiGenerationStatusSchema,
  tokenUsage: z.array(aiTokenUsageSchema),
  type: generationTypeSchema,
  updatedAt: z.date(),
  userId: z.string(),
  // Computed fields added by `mapAiGenerationRecord`
  url: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  mimeType: z.string(),
});

/**
 * Featured / recent carousel entry. Mirrors the shape produced by
 * `mapRows(...)` in `getFeaturedAndRecentGenerations` (a subset of the
 * drizzle row plus the three URL-derived fields).
 */
const aiGenerationPreviewSchema = z.object({
  id: z.string(),
  domain: namefiNormalizedDomainSchema,
  type: generationTypeSchema,
  status: aiGenerationStatusSchema,
  errorMessage: z.string().nullable(),
  createdAt: z.date(),
  url: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  mimeType: z.string(),
});

/** Internal admin view row returned by `getInternalGenerationsByDomain`. */
const internalAiGenerationRecordSchema = z.object({
  id: z.string(),
  type: z.string(),
  createdAt: z.date(),
  url: z.string().nullable(),
});

const getUserDomainsOutputSchema = z.array(
  z.object({
    domain: namefiNormalizedDomainSchema,
    latestGeneration: z.date().nullable(),
    logoCount: z.number(),
    marketingCount: z.number(),
    animationCount: z.number(),
  }),
);

const getFeaturedAndRecentOutputSchema = z.object({
  featured: z.array(aiGenerationPreviewSchema),
  recent: z.array(aiGenerationPreviewSchema),
});

const getInternalGenerationsByDomainsOutputSchema = z.record(
  z.string(),
  z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      createdAt: z.date(),
      url: z.string().nullable(),
    }),
  ),
);

const getUserGenerationUsageOutputSchema = z.object({
  currentCount: z.number(),
  maxGenerations: z.number(),
  remainingGenerations: z.number(),
  hasReachedLimit: z.boolean(),
});

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const aiContract = createContract(
  { softOutput: true },
  {
    generateLogo: {
      type: 'mutation',
      input: generateLogoInputSchema,
      output: aiGenerationRecordSchema,
    },
    generatePoster: {
      type: 'mutation',
      input: generatePosterInputSchema,
      output: aiGenerationRecordSchema,
    },
    generateAnimation: {
      type: 'mutation',
      input: generateAnimationInputSchema,
      output: aiGenerationRecordSchema,
    },
    getGenerationsByDomain: {
      type: 'query',
      input: getGenerationsByDomainInputSchema,
      output: z.array(aiGenerationRecordSchema),
    },
    getUserDomains: {
      type: 'query',
      input: z.void(),
      output: getUserDomainsOutputSchema,
    },
    getUserGenerationsFiltered: {
      type: 'query',
      input: getUserGenerationsFilteredInputSchema,
      output: z.array(aiGenerationRecordSchema),
    },
    getGenerationsByType: {
      type: 'query',
      input: getGenerationsByTypeInputSchema,
      output: z.array(aiGenerationRecordSchema),
    },
    getFeaturedAndRecentGenerations: {
      type: 'query',
      input: z.void(),
      output: getFeaturedAndRecentOutputSchema,
    },
    getGenerationById: {
      type: 'query',
      input: idInputSchema,
      output: aiGenerationRecordSchema,
    },
    deleteGeneration: {
      type: 'mutation',
      input: idInputSchema,
      output: aiGenerationRecordSchema,
    },
    getInternalGenerationsByDomain: {
      type: 'query',
      input: getGenerationsByDomainInputSchema,
      output: z.array(internalAiGenerationRecordSchema),
    },
    getInternalGenerationsByDomains: {
      type: 'query',
      input: getInternalGenerationsByDomainsInputSchema,
      output: getInternalGenerationsByDomainsOutputSchema,
    },
    getUserGenerationUsage: {
      type: 'query',
      input: z.void(),
      output: getUserGenerationUsageOutputSchema,
    },
  },
);

export type AiContract = typeof aiContract;
