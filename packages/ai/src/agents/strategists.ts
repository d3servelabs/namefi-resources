import { ToolLoopAgent, Output } from 'ai';
import type { LanguageModelUsage } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import {
  ANIMATION_MOTION_PRESETS,
  ANIMATION_MOTION_PRESET_RESOLVED_IDS,
  type AnimationMotionPresetInput,
  type MarketingCollateralTypeInput,
} from '../types/generation';
import {
  LOGO_STYLES,
  LOGO_TYPES,
  LOGO_TEXT_TREATMENTS,
  LOGO_TYPOGRAPHY,
  type LogoStyleInput,
  type LogoTextTreatmentInput,
  type LogoTypographyInput,
  type LogoTypeInput,
} from '../types/logo-options';
import { collateralAnalysisSchema } from '../types/marketing-schemas';
import { z } from 'zod';
import {
  logoConceptSchema,
  type LogoConceptSchema,
} from '../types/logo-schemas';
import {
  logoAnalysisUserPrompt,
  logoGenerationSystemPrompt,
} from '../prompts/logo-generation';

const logoTypeInstructions = Object.values(LOGO_TYPES)
  .filter((type) => type.id !== 'let-ai-choose')
  .map((type) => `- ${type.id} → ${type.name}: ${type.description}`)
  .join('\n');

const logoStyleInstructions = Object.values(LOGO_STYLES)
  .filter((style) => style.id !== 'let-ai-choose')
  .map((style) => `- ${style.id} → ${style.name}: ${style.description}`)
  .join('\n');

const logoTextTreatmentInstructions = Object.values(LOGO_TEXT_TREATMENTS)
  .filter((treatment) => treatment.id !== 'let-ai-choose')
  .map(
    (treatment) =>
      `- ${treatment.id} → ${treatment.name}: ${treatment.description}`,
  )
  .join('\n');

const logoTypographyInstructions = Object.values(LOGO_TYPOGRAPHY)
  .filter((option) => option.id !== 'let-ai-choose')
  .map((option) => `- ${option.id} → ${option.name}: ${option.description}`)
  .join('\n');

const animationMotionResolvedEnum = z.enum(
  ANIMATION_MOTION_PRESET_RESOLVED_IDS,
);
const animationMotionInstructions = Object.values(ANIMATION_MOTION_PRESETS)
  .filter(
    (preset) =>
      preset.id !== 'let-ai-choose' &&
      !('legacy' in preset && preset.legacy === true),
  )
  .map((preset) => `- ${preset.id} → ${preset.name}: ${preset.description}`)
  .join('\n');

const logoStrategistAgent = new ToolLoopAgent({
  model: openai('gpt-5.2'),
  instructions: `${logoGenerationSystemPrompt}

STRICT JSON OUTPUT RULES:
- Return only JSON matching the supplied schema.
- Use the exact ID values (lowercase, hyphenated) listed below for logoConcept.type, logoConcept.style, logoConcept.textTreatment, and logoConcept.typography.

AVAILABLE LOGO TYPES (use the id on the left):
${logoTypeInstructions}

AVAILABLE LOGO STYLES (use the id on the left):
${logoStyleInstructions}

AVAILABLE TEXT TREATMENTS (use the id on the left):
${logoTextTreatmentInstructions}

AVAILABLE TYPOGRAPHY STYLES (use the id on the left):
${logoTypographyInstructions}`,
  output: Output.object({ schema: logoConceptSchema }),
});

function createCollateralSystemPrompt(available: string) {
  return `You are a marketing creative director. Choose the most effective marketing collateral type(s) for showcasing a brand's logo.

CONSIDER:
- Audience, context of use (indoor/outdoor, lifestyle/studio), realism vs studio polish
- Material textures (fabric, metal, cardboard), scale, motion, lighting
- Where the brand will most likely benefit (street presence, apparel, merchandise, awards, events)

AVAILABLE COLLATERAL TYPES:
${available}

RULES:
- Return exactly the number of unique picks requested (default 1), unless fewer make sense based on explicit constraints
- Do not repeat collateral types
- Craft a generation-ready prompt per pick that explicitly references the chosen collateral type and key scene details
- If collateral is vehicle, compose scenes involving cars or commercial vehicles (sedan, SUV, van) with photorealistic logo placement on the vehicle body (door, hood, side panel) and, where appropriate, include the domain name as livery or decal. Consider reflections, paint texture, curves, and perspective.
- If collateral is apparel, compose scenes involving a physical product (e.g., t-shirt, hoodie, cap etc.) with photorealistic logo placement on the product. Consider reflections, paint texture, and perspective.
- If collateral is product, compose scenes involving a physical product (e.g., coffee mug, television, pizza box, sports equipment etc.) with photorealistic logo placement on the product. Consider reflections, paint texture, and perspective.
`;
}

export const animationMotionPlanSchema = z.object({
  brandAttributes: z
    .array(z.string())
    .describe('Key brand attributes, values, and personality traits'),
  targetAudience: z
    .string()
    .describe('Primary target audience and market positioning'),
  rationale: z
    .string()
    .describe(
      'Why this motion direction is the strongest fit for the brand and its logo.',
    ),
  motionPreset: animationMotionResolvedEnum.describe(
    'The single best motion preset for this brand and request.',
  ),
  direction: z
    .string()
    .describe(
      'A prompt-ready cinematic direction describing camera work, action, context, and ambiance for the logo animation.',
    ),
});

function createAnimationSystemPrompt(available: string) {
  return `You are a motion creative director designing high-end 8-second brand logo animations for Veo.

GOAL:
- Pick the single strongest motion direction for this brand.
- Favor bold, cinematic, high-impact motion over subtle surface decoration.
- Keep the logo premium, recognizable, and legible throughout.

AVAILABLE MOTION PRESETS:
${available}

RULES:
- Return only JSON matching the schema.
- Choose exactly one motionPreset from the allowed IDs above.
- If the user prompt constrains the allowed motion presets, you must choose only from that constrained set.
- Use camera movement, atmosphere, optical effects, particles, and energy only when they support a coherent hero animation.
- Avoid generic "small effect" answers unless the brand description strongly calls for restraint.
- Do not invent new brand marks, extra text, mascots, or scene changes.
- The direction must remain image-to-video safe for a single source logo frame.
- Make the result feel ambitious, polished, and ad-ready rather than minimal or decorative.`;
}

type StructuredGenerationResult<T> = {
  object: T;
  totalUsage: LanguageModelUsage;
  modelId?: string;
};

export interface LogoStrategyInput {
  domain: NamefiNormalizedDomain;
  description?: string;
  preferredType?: LogoTypeInput;
  preferredStyle?: LogoStyleInput;
  preferredTextTreatment?: LogoTextTreatmentInput;
  preferredTypography?: LogoTypographyInput;
}

export async function generateLogoStrategy(
  input: LogoStrategyInput,
): Promise<StructuredGenerationResult<LogoConceptSchema>> {
  const result = await logoStrategistAgent.generate({
    prompt: logoAnalysisUserPrompt({
      brandName: input.domain,
      description: input.description,
      logoType: input.preferredType,
      logoStyle: input.preferredStyle,
      textTreatment: input.preferredTextTreatment,
      typography: input.preferredTypography,
    }),
  });

  return {
    object: result.output,
    totalUsage: result.totalUsage,
    modelId: result.response?.modelId,
  };
}

export interface PosterStrategyInput {
  domain: string;
  description?: string;
  collateralType?: MarketingCollateralTypeInput;
}

type CollateralAnalysis = z.infer<typeof collateralAnalysisSchema>;

export async function generatePosterStrategy(
  input: PosterStrategyInput,
): Promise<StructuredGenerationResult<CollateralAnalysis>> {
  const allowedCollateralTypes =
    input.collateralType && input.collateralType !== 'let_ai_choose'
      ? input.collateralType
      : 'billboard, apparel, vehicle, product';

  const posterStrategistAgent = new ToolLoopAgent({
    model: openai('gpt-5.2'),
    instructions: createCollateralSystemPrompt(allowedCollateralTypes),
    output: Output.object({ schema: collateralAnalysisSchema }),
  });

  const result = await posterStrategistAgent.generate({
    prompt: `Brand: ${input.domain}
Description: ${input.description || 'N/A'}
Requested number of collateral types: 1
Allowed types (if constrained): ${allowedCollateralTypes}
`,
  });

  return {
    object: result.output,
    totalUsage: result.totalUsage,
    modelId: result.response?.modelId,
  };
}

type AnimationMotionPlan = z.infer<typeof animationMotionPlanSchema>;

export interface AnimationStrategyInput {
  domain: NamefiNormalizedDomain;
  description?: string;
  motionPreset?: AnimationMotionPresetInput;
}

export async function generateAnimationStrategy(
  input: AnimationStrategyInput,
): Promise<StructuredGenerationResult<AnimationMotionPlan>> {
  const allowedMotionPresets =
    input.motionPreset && input.motionPreset !== 'let-ai-choose'
      ? input.motionPreset
      : 'orbital-reveal, energy-surge, atmospheric-rise, dimensional-parallax, prismatic-bloom';

  const animationStrategistAgent = new ToolLoopAgent({
    model: openai('gpt-5.2'),
    instructions: createAnimationSystemPrompt(animationMotionInstructions),
    output: Output.object({ schema: animationMotionPlanSchema }),
  });

  const result = await animationStrategistAgent.generate({
    prompt: `Brand: ${input.domain}
Description: ${input.description || 'N/A'}
Requested number of motion directions: 1
Allowed motion presets (if constrained): ${allowedMotionPresets}
`,
  });

  return {
    object: result.output,
    totalUsage: result.totalUsage,
    modelId: result.response?.modelId,
  };
}
