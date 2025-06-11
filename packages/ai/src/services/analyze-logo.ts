import { z } from 'zod';
import { MODEL_CONFIGS } from '../lib/config/models';
import { LOGO_STYLES, LOGO_TYPES } from '../lib/types/logo-options';
import {
  createAnalysisModel,
  performStructuredAnalysis,
} from '../lib/utils/analysis';
import {
  logoAnalysisUserPrompt,
  logoGenerationSystemPrompt,
} from '../prompts/logo-generation';

// Get available types and styles from config
const availableTypes = Object.entries(LOGO_TYPES)
  .map(([_key, type]) => `'${type.name}' (${type.description})`)
  .join(', ');

const availableStyles = Object.entries(LOGO_STYLES)
  .map(([_key, style]) => `'${style.name}' (${style.description})`)
  .join(', ');

// Schema for single logo concept - focused on themes and brand values
const logoConceptSchema = z.object({
  brandAttributes: z
    .array(z.string())
    .describe('Key brand attributes, values, and personality traits'),
  targetAudience: z
    .string()
    .describe('Primary target audience and market positioning'),
  visualIdentity: z
    .string()
    .describe('Overall visual direction and mood for the brand'),
  colorPalette: z
    .array(z.string())
    .describe(
      "Suggested colors with emotional associations (e.g., 'Warm orange - energy and friendliness', 'Deep navy - trust and professionalism')",
    ),
  logoConcept: z
    .object({
      type: z
        .string()
        .describe(
          `Logo type from these options: ${availableTypes}. Choose the approach that best fits the brand.`,
        ),
      style: z
        .string()
        .describe(
          `Design style from these options: ${availableStyles}. Select the style that best represents the brand identity.`,
        ),
      concept: z
        .string()
        .describe(
          'Brief explanation of the creative direction and why it suits the brand',
        ),
      prompt: z
        .string()
        .describe(
          "Image generation prompt following this pattern: '[Style/mood] logo for [brand type] named [Brand], [thematic suggestions], [color direction]. The logo should [values/emotions], [applications].' Keep it suggestive rather than prescriptive.",
        ),
    })
    .describe(
      'The best creative direction for the logo based on brand analysis and user preferences',
    ),
});

export type LogoConcept = z.infer<typeof logoConceptSchema>;

export function analyzeLogoRequirements(
  brandName: string,
  description: string | undefined,
  logoType: string | undefined,
  logoStyle: string | undefined,
): Promise<LogoConcept> {
  const chatModel = createAnalysisModel(MODEL_CONFIGS.LOGO_ANALYSIS);

  const userPrompt = logoAnalysisUserPrompt({
    brandName,
    description,
    logoType,
    logoStyle,
  });

  return performStructuredAnalysis(
    chatModel,
    logoConceptSchema,
    'logo_concept',
    logoGenerationSystemPrompt,
    userPrompt,
  );
}
