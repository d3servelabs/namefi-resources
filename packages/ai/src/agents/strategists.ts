import { Experimental_Agent as Agent, Output } from 'ai';
import type { LanguageModelUsage } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { MarketingCollateralTypeInput } from '../types/generation';
import {
  LOGO_STYLES,
  LOGO_TYPES,
  type LogoStyleInput,
  type LogoTypeInput,
} from '../types/logo-options';
import { collateralAnalysisSchema } from '../types/marketing-schemas';
import type { z } from 'zod';
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

const logoStrategistAgent = new Agent({
  model: openai('gpt-5'),
  system: `${logoGenerationSystemPrompt}

STRICT JSON OUTPUT RULES:
- Return only JSON matching the supplied schema.
- Use the exact ID values (lowercase, hyphenated) listed below for both logoConcept.type and logoConcept.style.

AVAILABLE LOGO TYPES (use the id on the left):
${logoTypeInstructions}

AVAILABLE LOGO STYLES (use the id on the left):
${logoStyleInstructions}`,
  experimental_output: Output.object({ schema: logoConceptSchema }),
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
    }),
  });

  return {
    object: result.experimental_output,
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

  const posterStrategistAgent = new Agent({
    model: openai('gpt-5'),
    system: createCollateralSystemPrompt(allowedCollateralTypes),
    experimental_output: Output.object({ schema: collateralAnalysisSchema }),
  });

  const result = await posterStrategistAgent.generate({
    prompt: `Brand: ${input.domain}
Description: ${input.description || 'N/A'}
Requested number of collateral types: 1
Allowed types (if constrained): ${allowedCollateralTypes}
`,
  });

  return {
    object: result.experimental_output,
    totalUsage: result.totalUsage,
    modelId: result.response?.modelId,
  };
}
