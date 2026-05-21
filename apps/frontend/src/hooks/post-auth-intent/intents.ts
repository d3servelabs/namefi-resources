import {
  ANIMATION_MODE_IDS,
  ANIMATION_MODEL_IDS,
  CINEMATIC_ANIMATION_MOTION_PRESET_IDS,
  LOOPED_ANIMATION_MOTION_PRESET_IDS,
  ANIMATION_MOTION_INTENSITY_IDS,
  ANIMATION_SOURCE_MODE_IDS,
  LOGO_STYLE_INPUT_IDS,
  LOGO_TEXT_TREATMENT_INPUT_IDS,
  LOGO_TYPE_INPUT_IDS,
  LOGO_TYPOGRAPHY_INPUT_IDS,
  MARKETING_COLLATERAL_TYPE_INPUT_IDS,
} from '@namefi-astra/ai/types';
import { z } from 'zod';

const imageModelIds = [
  'gpt-image-1',
  'gpt-image-1.5',
  'gpt-image-2',
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
] as const;

const returnPathSchema = z
  .string()
  .min(1)
  .refine((value) => value.startsWith('/') && !value.startsWith('//'), {
    message: 'returnPath must be an app-relative path',
  });

const logoPayloadSchema = z
  .object({
    domain: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(LOGO_TYPE_INPUT_IDS),
    style: z.enum(LOGO_STYLE_INPUT_IDS),
    model: z.enum(imageModelIds),
    textTreatment: z.enum(LOGO_TEXT_TREATMENT_INPUT_IDS),
    typography: z.enum(LOGO_TYPOGRAPHY_INPUT_IDS),
    requestedMode: z.enum(['poster', 'animation']).optional(),
  })
  .passthrough();

const posterPayloadSchema = z
  .object({
    domain: z.string().min(1),
    description: z.string().optional(),
    referenceLogoGenerationId: z.string().min(1),
    model: z.enum(imageModelIds),
    collateralType: z.enum(MARKETING_COLLATERAL_TYPE_INPUT_IDS),
  })
  .passthrough();

const animationPayloadSchema = z
  .object({
    domain: z.string().min(1),
    description: z.string().optional(),
    referenceLogoGenerationId: z.string().min(1),
    mode: z.enum(ANIMATION_MODE_IDS),
    model: z.enum(ANIMATION_MODEL_IDS).optional(),
    sourceMode: z.enum(ANIMATION_SOURCE_MODE_IDS).optional(),
    motionPreset: z
      .union([
        z.enum(CINEMATIC_ANIMATION_MOTION_PRESET_IDS),
        z.enum(LOOPED_ANIMATION_MOTION_PRESET_IDS),
      ])
      .optional(),
    motionIntensity: z.enum(ANIMATION_MOTION_INTENSITY_IDS).optional(),
    sheetModel: z.literal('gpt-image-2').optional(),
  })
  .passthrough();

const leadgenRunPayloadSchema = z.object({
  domain: z.string().min(1),
  reasoningEffort: z.enum(['low', 'medium', 'high']),
});

export const postAuthIntentSchema = z.discriminatedUnion('kind', [
  z.object({
    version: z.literal(1),
    kind: z.literal('ai.logo.generate'),
    returnPath: returnPathSchema,
    payload: logoPayloadSchema,
  }),
  z.object({
    version: z.literal(1),
    kind: z.literal('ai.poster.generate'),
    returnPath: returnPathSchema,
    payload: posterPayloadSchema,
  }),
  z.object({
    version: z.literal(1),
    kind: z.literal('ai.animation.generate'),
    returnPath: returnPathSchema,
    payload: animationPayloadSchema,
  }),
  z.object({
    version: z.literal(1),
    kind: z.literal('leadgen.run.start'),
    returnPath: returnPathSchema,
    payload: leadgenRunPayloadSchema,
  }),
]);

export type PostAuthIntent = z.infer<typeof postAuthIntentSchema>;
export type PostAuthIntentKind = PostAuthIntent['kind'];
export type PostAuthIntentFor<TKind extends PostAuthIntentKind> = Extract<
  PostAuthIntent,
  { kind: TKind }
>;
export type StagePostAuthIntentInput = Omit<PostAuthIntent, 'version'>;
