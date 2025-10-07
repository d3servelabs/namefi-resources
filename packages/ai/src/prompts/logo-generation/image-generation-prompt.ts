import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { ImageModel } from '../../types/generation';
import type { LogoStyle, LogoType } from '../../types/logo-options';

export interface LogoImageParams {
  basePrompt: string;
  domain: NamefiNormalizedDomain;
  logoType: LogoType;
  style: LogoStyle;
  model: ImageModel;
}

export const enhanceLogoPrompt = ({
  basePrompt,
  domain: _domain,
  logoType: _logoType,
  style: _style,
  model,
}: LogoImageParams) => `${basePrompt}

Ensure the design is professional, scalable, and works well in various contexts.

Background styling:
- Use a subtle, non-distracting background that complements the primary logo colors
- Prefer soft, low-contrast gradients with complementary or analogous hues; otherwise use a clean solid fill matching the palette
- Avoid busy textures or patterns; keep contrast and readability high
- The background should enhance the logo and never overpower it

${
  model === 'gemini-2.5-flash-image'
    ? `
REQUIREMENTS:
- Output a single square image at 1024x1024 resolution.
- Produce ONLY the logo (no mockups, products, scenes, people, or environments).
- Background: subtle gradient or clean solid fill that is visually complementary and non-distracting.
- No watermarks or additional decorative elements beyond the simple background.
- Center the logo with balanced padding; leave adequate breathing room around it.
- If the logo includes the brand name text, render it cleanly; otherwise, render only the mark.
- Return exactly one image as output.`
    : ''
}`;

export const logoGenerationSystemPrompt =
  'You are an AI assistant that generates professional logo designs. Create a logo based on the given prompt.';
