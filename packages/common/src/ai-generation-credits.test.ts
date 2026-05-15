import { describe, expect, it } from 'vitest';
import {
  getAiTokenUsageCreditCost,
  getAiGenerationCreditCost,
  getLeadgenOutreachCreditEstimate,
  getLeadgenRunCreditEstimate,
  type AiTokenCreditRates,
  type AiGenerationCreditCosts,
} from './ai-generation-credits';

const creditCosts = {
  default: 1,
  logo: {
    default: 1,
    models: {
      'gpt-image-2': 2,
    },
    modes: {},
  },
  marketing: {
    default: 1,
    models: {
      'gpt-image-2': 2,
    },
    modes: {},
  },
  animation: {
    default: 3,
    models: {
      'veo-3.1-generate-preview': 8,
      'bytedance/seedance-2.0': 3,
      'bytedance/seedance-2.0-fast': 2,
    },
    modes: {
      'sheet-guided': {
        default: 7,
        models: {
          'bytedance/seedance-2.0': 7,
          'bytedance/seedance-2.0-fast': 6,
        },
      },
    },
  },
  leadgen: {
    default: 8,
    models: {
      'gpt-4o': 5,
      'gpt-5.2': 8,
    },
    modes: {
      'full:low': {
        default: 5,
        models: {
          'gpt-4o': 5,
        },
      },
      'full:medium': {
        default: 8,
        models: {
          'gpt-5.2': 8,
        },
      },
      'campaign_short:medium': {
        default: 4,
        models: {
          'gpt-5.2': 4,
        },
      },
    },
  },
  leadgenOutreach: {
    default: 2,
    models: {
      'gpt-5.2': 2,
    },
    modes: {
      medium: {
        default: 2,
        models: {
          'gpt-5.2': 2,
        },
      },
      high: {
        default: 3,
        models: {
          'gpt-5.2': 3,
        },
      },
    },
  },
} satisfies AiGenerationCreditCosts;

describe('getAiGenerationCreditCost', () => {
  it('uses model-specific costs before type defaults', () => {
    expect(
      getAiGenerationCreditCost({
        creditCosts,
        type: 'logo',
        model: 'gpt-image-2',
      }),
    ).toBe(2);
    expect(
      getAiGenerationCreditCost({
        creditCosts,
        type: 'animation',
        model: 'veo-3.1-generate-preview',
      }),
    ).toBe(8);
  });

  it('uses mode-specific animation costs before animation model defaults', () => {
    expect(
      getAiGenerationCreditCost({
        creditCosts,
        type: 'animation',
        mode: 'sheet-guided',
        model: 'bytedance/seedance-2.0-fast',
      }),
    ).toBe(6);
    expect(
      getAiGenerationCreditCost({
        creditCosts,
        type: 'animation',
        mode: 'sheet-guided',
        model: 'bytedance/seedance-2.0',
      }),
    ).toBe(7);
  });

  it('falls back to type default and then global default', () => {
    expect(
      getAiGenerationCreditCost({
        creditCosts,
        type: 'marketing',
        model: 'legacy-model',
      }),
    ).toBe(1);
    expect(
      getAiGenerationCreditCost({
        creditCosts: {
          ...creditCosts,
          logo: {
            models: {},
            modes: {},
          },
        },
        type: 'logo',
      }),
    ).toBe(1);
  });

  it('supports leadgen estimates by run profile and reasoning effort', () => {
    expect(
      getLeadgenRunCreditEstimate({
        creditCosts,
        reasoningEffort: 'medium',
      }),
    ).toBe(8);
    expect(
      getLeadgenRunCreditEstimate({
        creditCosts,
        reasoningEffort: 'medium',
        runProfile: 'campaign_short',
      }),
    ).toBe(4);
    expect(
      getLeadgenRunCreditEstimate({
        creditCosts,
        reasoningEffort: 'medium',
        model: 'gpt-4o',
      }),
    ).toBe(5);
    expect(
      getLeadgenOutreachCreditEstimate({
        creditCosts,
        reasoningEffort: 'high',
      }),
    ).toBe(3);
  });
});

describe('getAiTokenUsageCreditCost', () => {
  const tokenCreditRates = {
    default: {
      inputCreditsPerMillionTokens: 10,
      outputCreditsPerMillionTokens: 20,
    },
    models: {
      'premium-model': {
        inputCreditsPerMillionTokens: 20,
        outputCreditsPerMillionTokens: 80,
      },
    },
  } satisfies AiTokenCreditRates;

  it('back-calculates credits from model-specific token rates', () => {
    expect(
      getAiTokenUsageCreditCost({
        tokenCreditRates,
        tokenUsage: [
          {
            model: 'premium-model',
            inputTokens: 50_000,
            outputTokens: 25_000,
          },
        ],
      }),
    ).toBe(3);
  });

  it('uses default token rates for unknown models', () => {
    expect(
      getAiTokenUsageCreditCost({
        tokenCreditRates,
        tokenUsage: [
          {
            model: 'unknown-model',
            inputTokens: 100_000,
            outputTokens: 50_000,
          },
        ],
      }),
    ).toBe(2);
  });
});
