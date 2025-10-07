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

const logoTypesList = Object.values(LOGO_TYPES)
  .filter((type) => type.id !== 'let-ai-choose')
  .map((type) => `${type.name} — ${type.description}`)
  .join('\n');

const logoStylesList = Object.values(LOGO_STYLES)
  .filter((style) => style.id !== 'let-ai-choose')
  .map((style) => `${style.name} — ${style.description}`)
  .join('\n');

const logoStrategistAgent = new Agent({
  model: openai('gpt-4o'),
  system: `You are a seasoned brand strategist and creative director. You distill a brand's essence into a single, best-fit logo concept.\n\nWhen provided with brand inputs, you must:\n- analyze the brand's attributes, audience, and positioning\n- recommend a visual identity direction\n- select a single logo concept (type + style) that best supports the brand's goals\n- craft a production-ready image prompt for the selected concept\n\nAvailable logo types:\n${logoTypesList}\n\nAvailable styles:\n${logoStylesList}\n\nRespond only with JSON that matches the provided schema.`,
  experimental_output: Output.object({ schema: logoConceptSchema }),
});

const posterStrategistAgent = new Agent({
  model: openai('gpt-4o'),
  system:
    'You are a senior experiential designer. Given a brand domain and optional context, you recommend the most impactful marketing collateral concepts.\n\nFor each concept, you must reason about:\n- where the collateral appears and which audience it targets\n- how the logo is integrated (placement, scale, materials)\n- scene composition, lighting, and mood\n- storytelling elements that make the concept persuasive\n\nReturn only JSON adhering to the schema supplied at request time.',
  experimental_output: Output.object({ schema: collateralAnalysisSchema }),
});

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
    prompt: `Domain: ${input.domain}\nDescription: ${input.description || 'N/A'}\nPreferred type: ${input.preferredType || 'N/A'}\nPreferred style: ${input.preferredStyle || 'N/A'}`,
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

  const result = await posterStrategistAgent.generate({
    prompt: `Brand: ${input.domain}\nDescription: ${input.description || 'N/A'}\nAllowed collateral types: ${allowedCollateralTypes}`,
  });

  return {
    object: result.experimental_output,
    totalUsage: result.totalUsage,
    modelId: result.response?.modelId,
  };
}
