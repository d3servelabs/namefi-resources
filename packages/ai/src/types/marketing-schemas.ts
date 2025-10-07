import { z } from 'zod';
import { MARKETING_COLLATERAL_TYPE_RESOLVED_IDS } from './generation';

const collateralTypeEnum = z.enum(MARKETING_COLLATERAL_TYPE_RESOLVED_IDS);

export const collateralPickSchema = z.object({
  collateralType: collateralTypeEnum.describe(
    'One of the supported collateral types',
  ),
  prompt: z
    .string()
    .describe(
      'A refined image generation prompt explicitly tailored for the chosen collateral type, including material, lighting, context, and composition.',
    ),
});

export const collateralAnalysisSchema = z.object({
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
    .describe('One or more unique collateral picks, ordered by priority'),
});
