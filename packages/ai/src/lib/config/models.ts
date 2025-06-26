import type { AnalysisConfig } from '../utils/analysis';
import type { ImageGenerationConfig } from '../utils/image-generation';

/**
 * Model configurations for different use cases
 */
export const MODEL_CONFIGS = {
  // Analysis models
  DOMAIN_ANALYSIS: {
    model: 'gpt-4o',
    temperature: 0.7,
  } satisfies AnalysisConfig,

  LOGO_ANALYSIS: {
    model: 'gpt-4o',
    temperature: 0.7,
  } satisfies AnalysisConfig,

  // Image generation models
  LOGO_GENERATION: {
    model: 'gpt-4.1',
    temperature: 0.7,
    toolConfig: {
      type: 'image_generation',
      model: 'gpt-image-1',
      quality: 'medium',
      size: '1024x1024',
      output_format: 'webp',
      output_compression: 100,
      background: 'transparent',
    },
  } satisfies ImageGenerationConfig,

  MARKETING_IMAGE_GENERATION: {
    model: 'gpt-4.1',
    temperature: 0.7,
    toolConfig: {
      type: 'image_generation',
      model: 'gpt-image-1',
      quality: 'medium',
      size: '1536x1024',
      output_format: 'jpeg',
      output_compression: 100,
      background: 'opaque',
    },
  } satisfies ImageGenerationConfig,
} as const;
