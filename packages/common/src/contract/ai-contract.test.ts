import { describe, expect, it } from 'vitest';

import { aiContract } from './ai-contract';

describe('aiContract.generatePoster', () => {
  it('requires a reference logo generation id', () => {
    expect(() =>
      aiContract.generatePoster.input.parse({
        domain: 'example.com',
        collateralType: 'let_ai_choose',
        model: 'gpt-image-2',
      }),
    ).toThrow();
  });

  it('rejects an empty reference logo generation id', () => {
    expect(() =>
      aiContract.generatePoster.input.parse({
        domain: 'example.com',
        referenceLogoGenerationId: '',
        collateralType: 'let_ai_choose',
        model: 'gpt-image-2',
      }),
    ).toThrow();
  });

  it('accepts poster inputs with a reference logo generation id', () => {
    expect(
      aiContract.generatePoster.input.parse({
        domain: 'example.com',
        referenceLogoGenerationId: 'logo-generation-id',
        collateralType: 'let_ai_choose',
        model: 'gpt-image-2',
      }),
    ).toEqual({
      domain: 'example.com',
      referenceLogoGenerationId: 'logo-generation-id',
      collateralType: 'let_ai_choose',
      model: 'gpt-image-2',
    });
  });
});

describe('aiContract.generateAnimation', () => {
  it('requires a non-empty reference logo generation id', () => {
    expect(() =>
      aiContract.generateAnimation.input.parse({
        mode: 'looped',
        domain: 'example.com',
        referenceLogoGenerationId: '',
        model: 'bytedance/seedance-2.0',
      }),
    ).toThrow();
  });
});
