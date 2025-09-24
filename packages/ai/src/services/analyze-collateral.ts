import { z } from 'zod';
import { MODEL_CONFIGS } from '../lib/config/models';
import {
  type AnalysisResult,
  createAnalysisModel,
  performStructuredAnalysis,
} from '../lib/utils/analysis';
import type { MarketingCollateralType } from '../lib/types';

// Schema for collateral analysis with optional multiple picks
const collateralPickSchema = z.object({
  collateralType: z
    .enum(['billboard', 'apparel', 'vehicle', 'product'])
    .describe('One of the supported collateral types'),
  prompt: z
    .string()
    .describe(
      'A refined image generation prompt explicitly tailored for the chosen collateral type, including any nuances like material, lighting, context, and composition',
    ),
});

const collateralAnalysisSchema = z.object({
  brandAttributes: z
    .array(z.string())
    .describe('Key brand attributes, values, and personality traits'),
  targetAudience: z
    .string()
    .describe('Primary target audience and market positioning'),
  rationale: z
    .string()
    .describe(
      'Reasoning for why the selected collateral type(s) best showcase the brand and logo in this context',
    ),
  picks: z
    .array(collateralPickSchema)
    .min(1)
    .describe('One or more unique collateral picks, ordered by priority'),
});

export type CollateralAnalysis = z.infer<typeof collateralAnalysisSchema>;

export function analyzeCollateralRequirements(
  brandName: string,
  description: string | undefined,
  desiredCount = 1,
  allowedTypes?: MarketingCollateralType[],
): Promise<AnalysisResult<CollateralAnalysis>> {
  const chatModel = createAnalysisModel(MODEL_CONFIGS.DOMAIN_ANALYSIS);

  const available = allowedTypes
    ? allowedTypes.join(', ')
    : ['billboard', 'apparel', 'vehicle', 'product'].join(', ');

  const system = `You are a marketing creative director. Choose the most effective marketing collateral type(s) for showcasing a brand's logo.

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

  const user = `Brand: ${brandName}
Description: ${description || 'N/A'}
Requested number of collateral types: ${Math.max(1, Math.floor(desiredCount || 1))}
Allowed types (if constrained): ${available}
`;

  return performStructuredAnalysis(
    chatModel,
    collateralAnalysisSchema,
    'marketing_collateral_analysis',
    system,
    user,
  );
}
