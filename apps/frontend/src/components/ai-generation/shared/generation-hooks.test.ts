import { describe, expect, it } from 'vitest';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';

import type { AnimationFormData } from '../animation-generator';
import { createAnimationGenerationPayload } from './generation-hooks';

const atlasDomain = namefiNormalizedDomainSchema.parse('atlas.com');

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
      model: 'bytedance/seedance-v1.5-pro',
    } satisfies AnimationFormData);

    expect(payload).toEqual({
      domain: 'atlas.com',
      description: 'Subtle logo loop',
      referenceLogoGenerationId: '22222222-2222-4222-8222-222222222222',
      mode: 'looped',
      motionPreset: 'light-sweep',
      motionIntensity: 'subtle',
      model: 'bytedance/seedance-v1.5-pro',
    });
    expect('sourceMode' in payload).toBe(false);
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
      model: 'bytedance/seedance-v1.5-pro',
    });
    expect('sourceMode' in payload).toBe(false);
  });
});
