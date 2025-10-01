import type { AnalysisConfig } from '../utils/analysis';
import type {
  GeminiImageGenerationConfig,
  OpenAIImageGenerationConfig,
} from '../utils/image-generation';

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
} as const;

export const OPENAI_LOGO_IMAGE_CONFIG = {
  type: 'openai',
  model: 'gpt-4.1',
  temperature: 0.7,
  toolConfig: {
    type: 'image_generation',
    model: 'gpt-image-1',
    quality: 'medium',
    size: '1024x1024',
    output_format: 'png',
    output_compression: 100,
    background: 'opaque',
  },
} satisfies OpenAIImageGenerationConfig;

export const OPENAI_MARKETING_IMAGE_CONFIG = {
  type: 'openai',
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
} satisfies OpenAIImageGenerationConfig;

export const GEMINI_IMAGE_CONFIG = {
  type: 'gemini',
  model: 'gemini-2.5-flash-image-preview',
  temperature: 0.7,
} satisfies GeminiImageGenerationConfig;
