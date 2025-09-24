import type { Model } from '../types';
import { imageGenerationSystemPrompt as marketingDefaultSystemPrompt } from '../../prompts/domain-marketing';
import { logoGenerationSystemPrompt as logoDefaultSystemPrompt } from '../../prompts/logo-generation';

export type ImageTask = 'logo' | 'marketing';

const DEFAULT_PROMPTS: Record<ImageTask, string> = {
  logo: logoDefaultSystemPrompt,
  marketing: marketingDefaultSystemPrompt,
};

const MODEL_SPECIFIC_PROMPTS: Partial<
  Record<Model, Partial<Record<ImageTask, string>>>
> = {
  'gpt-image-1': {
    logo: 'You are an OpenAI assistant that creates professional logos. Use the image_generation tool to produce a logo strictly following the prompt. Output tool calls only.',
    marketing:
      'You are an OpenAI assistant that creates marketing images. Use the image_generation tool to produce the image. Output tool calls only.',
  },
  'gemini-2.5-flash-image-preview': {
    logo: 'You are a Gemini assistant specializing in logo creation. Return only a single inline image. It must be a 1024x1024 PNG with a fully transparent background containing ONLY the logo (no mockups, scenes, products, or people).',
    marketing:
      'You are a Gemini assistant specializing in marketing visuals. Generate an inline image that matches the prompt precisely. Return only the image output.',
  },
};

export function resolveImageSystemPrompt(
  model: Model,
  task: ImageTask,
): string {
  const candidate = MODEL_SPECIFIC_PROMPTS[model]?.[task];
  if (candidate) return candidate;
  return DEFAULT_PROMPTS[task];
}
