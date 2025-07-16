import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

export interface LogoImageParams {
  basePrompt: string;
  domain: NamefiNormalizedDomain;
  logoType: string;
  style: string;
}

export const enhanceLogoPrompt = ({
  basePrompt,
  domain,
  logoType,
  style,
}: LogoImageParams) => `${basePrompt}

Ensure the design is professional, scalable, and works well in various contexts.`;

export const logoGenerationSystemPrompt =
  'You are an AI assistant that generates professional logo designs. Use the image_generation tool to create a logo based on the given prompt.';
