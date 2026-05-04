import { z } from 'zod';

export type AiGenerationCreditType = 'logo' | 'marketing' | 'animation';

export const aiGenerationCreditCostSchema = z.number().int().min(0).max(1_000);

export const aiGenerationTypeCreditCostsSchema = z.object({
  default: aiGenerationCreditCostSchema.optional(),
  models: z.record(z.string(), aiGenerationCreditCostSchema).default({}),
});

export const aiAnimationCreditCostsSchema =
  aiGenerationTypeCreditCostsSchema.extend({
    modes: z.record(z.string(), aiGenerationTypeCreditCostsSchema).default({}),
  });

const aiGenerationCreditCostsShapeSchema = z.object({
  default: aiGenerationCreditCostSchema,
  logo: aiGenerationTypeCreditCostsSchema,
  marketing: aiGenerationTypeCreditCostsSchema,
  animation: aiAnimationCreditCostsSchema,
});

export const defaultAiGenerationCreditCosts = {
  default: 1,
  logo: {
    default: 1,
    models: {
      'gpt-image-2': 2,
      'gemini-3-pro-image-preview': 2,
    },
  },
  marketing: {
    default: 1,
    models: {
      'gpt-image-2': 2,
      'gemini-3-pro-image-preview': 2,
    },
  },
  animation: {
    default: 3,
    models: {
      'veo-3.1-generate-preview': 8,
      'veo-3.1-fast-generate-preview': 4,
      'bytedance/seedance-2.0': 3,
      'bytedance/seedance-2.0-fast': 2,
      'bytedance/seedance-v1.0-pro': 3,
      'bytedance/seedance-v1.5-pro': 3,
    },
    modes: {
      'sheet-guided': {
        default: 7,
        models: {
          'bytedance/seedance-2.0': 7,
          'bytedance/seedance-2.0-fast': 6,
          'bytedance/seedance-v1.0-pro': 6,
          'bytedance/seedance-v1.5-pro': 6,
        },
      },
    },
  },
} satisfies z.output<typeof aiGenerationCreditCostsShapeSchema>;

export const aiGenerationCreditCostsSchema = z.object({
  default: aiGenerationCreditCostSchema.default(
    defaultAiGenerationCreditCosts.default,
  ),
  logo: aiGenerationTypeCreditCostsSchema.default(
    defaultAiGenerationCreditCosts.logo,
  ),
  marketing: aiGenerationTypeCreditCostsSchema.default(
    defaultAiGenerationCreditCosts.marketing,
  ),
  animation: aiAnimationCreditCostsSchema.default(
    defaultAiGenerationCreditCosts.animation,
  ),
});

export type AiGenerationTypeCreditCosts = z.infer<
  typeof aiGenerationTypeCreditCostsSchema
>;

export type AiAnimationCreditCosts = z.infer<
  typeof aiAnimationCreditCostsSchema
>;

export type AiGenerationCreditCosts = z.infer<
  typeof aiGenerationCreditCostsSchema
>;

export function getAiGenerationCreditCost(params: {
  creditCosts: AiGenerationCreditCosts;
  mode?: string;
  model?: string;
  type: AiGenerationCreditType;
}) {
  const typeConfig = params.creditCosts[params.type];
  const modeConfig =
    params.type === 'animation' && params.mode
      ? params.creditCosts.animation.modes[params.mode]
      : undefined;
  const modelCost = params.model
    ? (modeConfig?.models[params.model] ?? typeConfig.models[params.model])
    : undefined;

  return (
    modelCost ??
    modeConfig?.default ??
    typeConfig.default ??
    params.creditCosts.default
  );
}
