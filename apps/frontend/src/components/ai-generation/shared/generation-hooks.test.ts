import { describe, expect, it } from 'vitest';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';

import type { AnimationFormData } from '../animation-generator';
import type { PosterFormData } from '../poster-generator';
import {
  createAnimationGenerationPayload,
  createPosterGenerationPayload,
} from './generation-hooks';

const atlasDomain = namefiNormalizedDomainSchema.parse('atlas.com');

describe('createPosterGenerationPayload', () => {
  it('always includes the selected logo generation id', () => {
    const payload = createPosterGenerationPayload({
      domain: atlasDomain,
      description: 'Product launch',
      selectedLogoId: '55555555-5555-4555-8555-555555555555',
      collateralType: 'product',
      model: 'gpt-image-2',
    } satisfies PosterFormData);

    expect(payload).toEqual({
      domain: 'atlas.com',
      description: 'Product launch',
      referenceLogoGenerationId: '55555555-5555-4555-8555-555555555555',
      collateralType: 'product',
      model: 'gpt-image-2',
    });
  });
});

describe('createAnimationGenerationPayload', () => {
  it('returns a cinematic payload with cinematic-only fields', () => {
    const payload = createAnimationGenerationPayload({
      domain: atlasDomain,
      description: 'Hero reveal',
      selectedLogoId: '11111111-1111-4111-8111-111111111111',
      mode: 'cinematic',
      sourceMode: 'subject-reference',
      motionPreset: 'orbital-reveal',
      motionIntensity: 'balanced',
      model: 'veo-3.1-fast-generate-preview',
    } satisfies AnimationFormData);

    expect(payload).toEqual({
      domain: 'atlas.com',
      description: 'Hero reveal',
      referenceLogoGenerationId: '11111111-1111-4111-8111-111111111111',
      mode: 'cinematic',
      sourceMode: 'subject-reference',
      motionPreset: 'orbital-reveal',
      model: 'veo-3.1-fast-generate-preview',
    });
    expect('motionIntensity' in payload).toBe(false);
  });

  it('returns a looped payload with loop-specific fields', () => {
    const payload = createAnimationGenerationPayload({
      domain: atlasDomain,
      description: 'Subtle logo loop',
      selectedLogoId: '22222222-2222-4222-8222-222222222222',
      mode: 'looped',
      sourceMode: 'exact-frame',
      motionPreset: 'light-sweep',
      motionIntensity: 'subtle',
      model: 'bytedance/seedance-2.0',
    } satisfies AnimationFormData);

    expect(payload).toEqual({
      domain: 'atlas.com',
      description: 'Subtle logo loop',
      referenceLogoGenerationId: '22222222-2222-4222-8222-222222222222',
      mode: 'looped',
      motionPreset: 'light-sweep',
      motionIntensity: 'subtle',
      model: 'bytedance/seedance-2.0',
    });
    expect('sourceMode' in payload).toBe(false);
  });

  it('returns a sheet-guided payload with GPT Image 2 sheet generation', () => {
    const payload = createAnimationGenerationPayload({
      domain: atlasDomain,
      description: 'Analyze the logo first',
      selectedLogoId: '44444444-4444-4444-8444-444444444444',
      mode: 'sheet-guided',
      sourceMode: 'exact-frame',
      motionPreset: 'prismatic-bloom',
      motionIntensity: 'bold',
      model: 'bytedance/seedance-2.0',
    } satisfies AnimationFormData);

    expect(payload).toEqual({
      domain: 'atlas.com',
      description: 'Analyze the logo first',
      referenceLogoGenerationId: '44444444-4444-4444-8444-444444444444',
      mode: 'sheet-guided',
      model: 'bytedance/seedance-2.0',
      sheetModel: 'gpt-image-2',
    });
    expect('sourceMode' in payload).toBe(false);
    expect('motionIntensity' in payload).toBe(false);
  });

  it('keeps Gemini Omni for sheet-guided animation payloads', () => {
    const payload = createAnimationGenerationPayload({
      domain: atlasDomain,
      description: 'Use the sheet as motion guidance',
      selectedLogoId: '66666666-6666-4666-8666-666666666666',
      mode: 'sheet-guided',
      sourceMode: 'exact-frame',
      motionPreset: 'prismatic-bloom',
      motionIntensity: 'bold',
      model: 'gemini-omni-flash',
    } satisfies AnimationFormData);

    expect(payload).toEqual({
      domain: 'atlas.com',
      description: 'Use the sheet as motion guidance',
      referenceLogoGenerationId: '66666666-6666-4666-8666-666666666666',
      mode: 'sheet-guided',
      model: 'gemini-omni-flash',
      sheetModel: 'gpt-image-2',
    });
  });

  it('normalizes incompatible values to the selected mode family', () => {
    const payload = createAnimationGenerationPayload({
      domain: atlasDomain,
      description: '',
      selectedLogoId: '33333333-3333-4333-8333-333333333333',
      mode: 'looped',
      sourceMode: 'subject-reference',
      motionPreset: 'orbital-reveal',
      motionIntensity: undefined,
      model: 'veo-3.1-generate-preview',
    } as AnimationFormData);

    expect(payload).toMatchObject({
      mode: 'looped',
      motionPreset: 'let-ai-choose',
      motionIntensity: 'subtle',
      model: 'bytedance/seedance-2.0',
    });
    expect('sourceMode' in payload).toBe(false);
  });
});
