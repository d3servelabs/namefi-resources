import { z } from 'zod';

export type AiGenerationCreditType =
  | 'logo'
  | 'marketing'
  | 'animation'
  | 'leadgen'
  | 'leadgenOutreach';

export const aiGenerationCreditCostSchema = z.number().int().min(0).max(1_000);

export const aiTokenUsageEntrySchema = z.object({
  model: z.string(),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
});

export const aiTokenCreditRateSchema = z.object({
  inputCreditsPerMillionTokens: z.number().min(0),
  outputCreditsPerMillionTokens: z.number().min(0),
});

export const aiTokenCreditRatesSchema = z.object({
  default: aiTokenCreditRateSchema,
  models: z.record(z.string(), aiTokenCreditRateSchema).default({}),
});

const aiGenerationModeCreditCostsSchema = z.object({
  default: aiGenerationCreditCostSchema.optional(),
  models: z.record(z.string(), aiGenerationCreditCostSchema).default({}),
});

export const aiGenerationTypeCreditCostsSchema = z.object({
  default: aiGenerationCreditCostSchema.optional(),
  models: z.record(z.string(), aiGenerationCreditCostSchema).default({}),
  modes: z.record(z.string(), aiGenerationModeCreditCostsSchema).default({}),
});

export const aiAnimationCreditCostsSchema = aiGenerationTypeCreditCostsSchema;

const aiGenerationCreditCostsShapeSchema = z.object({
  default: aiGenerationCreditCostSchema,
  logo: aiGenerationTypeCreditCostsSchema,
  marketing: aiGenerationTypeCreditCostsSchema,
  animation: aiAnimationCreditCostsSchema,
  leadgen: aiGenerationTypeCreditCostsSchema,
  leadgenOutreach: aiGenerationTypeCreditCostsSchema,
});

export const defaultAiGenerationCreditCosts = {
  default: 1,
  logo: {
    default: 1,
    models: {
      'gpt-image-2': 2,
      'gemini-3-pro-image-preview': 2,
    },
    modes: {},
  },
  marketing: {
    default: 1,
    models: {
      'gpt-image-2': 2,
      'gemini-3-pro-image-preview': 2,
    },
    modes: {},
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
  leadgen: {
    default: 4,
    models: {
      'gpt-5.4-mini': 4,
      'gpt-5.5': 8,
    },
    modes: {
      'full:low': {
        default: 3,
        models: {
          'gpt-5.4-mini': 3,
          'gpt-5.5': 5,
        },
      },
      'full:medium': {
        default: 4,
        models: {
          'gpt-5.4-mini': 4,
          'gpt-5.5': 8,
        },
      },
      'full:high': {
        default: 12,
        models: {
          'gpt-5.4-mini': 6,
          'gpt-5.5': 12,
        },
      },
      'campaign_short:low': {
        default: 2,
        models: {
          'gpt-5.4-mini': 2,
          'gpt-5.5': 3,
        },
      },
      'campaign_short:medium': {
        default: 3,
        models: {
          'gpt-5.4-mini': 3,
          'gpt-5.5': 4,
        },
      },
      'campaign_short:high': {
        default: 6,
        models: {
          'gpt-5.4-mini': 4,
          'gpt-5.5': 6,
        },
      },
    },
  },
  leadgenOutreach: {
    default: 1,
    models: {
      'gpt-5.4-mini': 1,
      'gpt-5.5': 2,
    },
    modes: {
      low: {
        default: 1,
        models: {
          'gpt-5.4-mini': 1,
          'gpt-5.5': 1,
        },
      },
      medium: {
        default: 1,
        models: {
          'gpt-5.4-mini': 1,
          'gpt-5.5': 2,
        },
      },
      high: {
        default: 3,
        models: {
          'gpt-5.4-mini': 2,
          'gpt-5.5': 3,
        },
      },
    },
  },
} satisfies z.output<typeof aiGenerationCreditCostsShapeSchema>;

export const defaultAiTokenCreditRates = {
  default: {
    inputCreditsPerMillionTokens: 13,
    outputCreditsPerMillionTokens: 70,
  },
  models: {
    'gpt-4o': {
      inputCreditsPerMillionTokens: 13,
      outputCreditsPerMillionTokens: 50,
    },
    'gpt-5.2': {
      inputCreditsPerMillionTokens: 9,
      outputCreditsPerMillionTokens: 70,
    },
    'gpt-5.4-mini': {
      inputCreditsPerMillionTokens: 1.35,
      outputCreditsPerMillionTokens: 10.5,
    },
    'gpt-5.5': {
      inputCreditsPerMillionTokens: 9,
      outputCreditsPerMillionTokens: 70,
    },
  },
} satisfies z.output<typeof aiTokenCreditRatesSchema>;

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
  leadgen: aiGenerationTypeCreditCostsSchema.default(
    defaultAiGenerationCreditCosts.leadgen,
  ),
  leadgenOutreach: aiGenerationTypeCreditCostsSchema.default(
    defaultAiGenerationCreditCosts.leadgenOutreach,
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

export type AiTokenUsageEntry = z.infer<typeof aiTokenUsageEntrySchema>;

export type AiTokenCreditRates = z.infer<typeof aiTokenCreditRatesSchema>;

export function getAiGenerationCreditCost(params: {
  creditCosts: AiGenerationCreditCosts;
  mode?: string;
  model?: string;
  type: AiGenerationCreditType;
}) {
  const typeConfig = params.creditCosts[params.type];
  const modeConfig = params.mode ? typeConfig.modes[params.mode] : undefined;
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

export function getLeadgenRunCreditEstimate(params: {
  creditCosts: AiGenerationCreditCosts;
  reasoningEffort: 'low' | 'medium' | 'high';
  runProfile?: 'full' | 'campaign_short';
  model?: string;
}) {
  const runProfile = params.runProfile ?? 'full';
  const primaryModel =
    params.model ?? getDefaultLeadgenPrimaryModel(params.reasoningEffort);

  return getAiGenerationCreditCost({
    creditCosts: params.creditCosts,
    type: 'leadgen',
    mode: `${runProfile}:${params.reasoningEffort}`,
    model: primaryModel,
  });
}

export function getLeadgenOutreachCreditEstimate(params: {
  creditCosts: AiGenerationCreditCosts;
  reasoningEffort: 'low' | 'medium' | 'high';
  model?: string;
}) {
  return getAiGenerationCreditCost({
    creditCosts: params.creditCosts,
    type: 'leadgenOutreach',
    mode: params.reasoningEffort,
    model:
      params.model ?? getDefaultLeadgenOutreachModel(params.reasoningEffort),
  });
}

function getDefaultLeadgenPrimaryModel(
  reasoningEffort: 'low' | 'medium' | 'high',
) {
  return reasoningEffort === 'high' ? 'gpt-5.5' : 'gpt-5.4-mini';
}

function getDefaultLeadgenOutreachModel(
  reasoningEffort: 'low' | 'medium' | 'high',
) {
  return reasoningEffort === 'high' ? 'gpt-5.5' : 'gpt-5.4-mini';
}

export function getAiTokenUsageCreditCost(params: {
  tokenCreditRates: AiTokenCreditRates;
  tokenUsage: AiTokenUsageEntry[];
}) {
  const rawCredits = params.tokenUsage.reduce((totalCredits, usage) => {
    const rates =
      params.tokenCreditRates.models[usage.model] ??
      params.tokenCreditRates.default;

    return (
      totalCredits +
      (usage.inputTokens / 1_000_000) * rates.inputCreditsPerMillionTokens +
      (usage.outputTokens / 1_000_000) * rates.outputCreditsPerMillionTokens
    );
  }, 0);

  return Math.ceil(rawCredits);
}
