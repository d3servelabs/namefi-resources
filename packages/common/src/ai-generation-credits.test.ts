import { describe, expect, it } from 'vitest';
import {
  getAiGenerationCreditCost,
  type AiGenerationCreditCosts,
} from './ai-generation-credits';

const creditCosts = {
  default: 1,
  logo: {
    default: 1,
    models: {
      'gpt-image-2': 2,
    },
  },
  marketing: {
    default: 1,
    models: {
      'gpt-image-2': 2,
    },
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
          },
        },
        type: 'logo',
      }),
    ).toBe(1);
  });
});
