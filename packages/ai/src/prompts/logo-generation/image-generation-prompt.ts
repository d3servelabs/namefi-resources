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
  domain: _domain,
  logoType: _logoType,
  style: _style,
  model,
}: LogoImageParams) => `${basePrompt}

Ensure the design is professional, scalable, and works well in various contexts.

${
  model === 'gemini-2.5-flash-image-preview'
    ? `
REQUIREMENTS:
- Output a single square image at 1024x1024 resolution.
- File format must be PNG with a fully transparent background (alpha channel).
- Produce ONLY the logo. Do NOT include mockups, products, scenes, people, or environments.
- No backgrounds, canvases, drop-shadows on a background, watermarks, or additional decorative elements.
- Center the logo with balanced padding; leave empty transparent space around it.
- If the logo includes the brand name text, render it cleanly; otherwise, render only the mark.
- Return exactly one image as output.`
    : ''
}`;

export const logoGenerationSystemPrompt =
  'You are an AI assistant that generates professional logo designs. Use the image_generation tool to create a logo based on the given prompt.';
