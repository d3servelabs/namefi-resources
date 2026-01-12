import type { ImageModel } from '../types/generation';
import { posterGenerationSystemPrompt } from './domain-marketing';
import { logoGenerationSystemPrompt } from './logo-generation';

export type ImageTask = 'logo' | 'marketing';

const DEFAULT_PROMPTS: Record<ImageTask, string> = {
  logo: logoGenerationSystemPrompt,
  marketing: posterGenerationSystemPrompt,
};

const MODEL_SPECIFIC_PROMPTS: Partial<
  Record<ImageModel, Partial<Record<ImageTask, string>>>
> = {
  'gpt-image-1': {
    logo: 'You are an OpenAI assistant that creates professional logos. Use the image_generation tool to produce a logo strictly following the prompt. Output tool calls only.',
    marketing:
      'You are an OpenAI assistant that creates marketing images. Use the image_generation tool to produce the image. Output tool calls only.',
  },
  'gpt-image-1.5': {
    logo: 'You are an OpenAI assistant that creates professional logos. Use the image_generation tool to produce a logo strictly following the prompt. Output tool calls only.',
    marketing:
      'You are an OpenAI assistant that creates marketing images. Use the image_generation tool to produce the image. Output tool calls only.',
  },
  'gemini-2.5-flash-image': {
    logo: 'You are a Gemini assistant specializing in logo creation. Return only a single inline image at 1024x1024. Generate ONLY the logo (no mockups, scenes, products, or people). Use a subtle, visually complementary gradient or clean solid background that does not distract from the logo.',
    marketing:
      'You are a Gemini assistant specializing in marketing visuals. Generate an inline image that matches the prompt precisely. Return only the image output.',
  },
  'gemini-3-pro-image-preview': {
    logo: 'You are a Gemini assistant specializing in logo creation. Return only a single inline image at 1024x1024. Generate ONLY the logo (no mockups, scenes, products, or people). Use a subtle, visually complementary gradient or clean solid background that does not distract from the logo.',
    marketing:
      'You are a Gemini assistant specializing in marketing visuals. Generate an inline image that matches the prompt precisely. Return only the image output.',
  },
};

export function resolveImageSystemPrompt(
  model: ImageModel,
  task: ImageTask,
): string {
  const candidate = MODEL_SPECIFIC_PROMPTS[model]?.[task];
  if (candidate) {
    return candidate;
  }
  return DEFAULT_PROMPTS[task];
}
