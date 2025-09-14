import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { Model } from '../../lib/types';

export interface LogoImageParams {
  basePrompt: string;
  domain: NamefiNormalizedDomain;
  logoType: string;
  style: string;
  model: Model;
}

export const enhanceLogoPrompt = ({
  basePrompt,
  domain,
  logoType,
  style,
  model,
}: LogoImageParams) => `${basePrompt}

Ensure the design is professional, scalable, and works well in various contexts.`;

export const logoGenerationSystemPrompt =
  'You are an AI assistant that generates professional logo designs. Use the image_generation tool to create a logo based on the given prompt.';
