import { z } from 'zod';
import {
  LOGO_TYPES,
  LOGO_STYLES,
  LOGO_TYPE_RESOLVED_IDS,
  LOGO_STYLE_RESOLVED_IDS,
} from './logo-options';

const filteredTypes = Object.values(LOGO_TYPES).filter(
  (type) => type.id !== 'let-ai-choose',
);
const availableTypes = filteredTypes
  .map((type) => `'${type.name}' (${type.description})`)
  .join(', ');

const filteredStyles = Object.values(LOGO_STYLES).filter(
  (style) => style.id !== 'let-ai-choose',
);
const availableStyles = filteredStyles
  .map((style) => `'${style.name}' (${style.description})`)
  .join(', ');

const logoTypeResolvedEnum = z.enum(LOGO_TYPE_RESOLVED_IDS);
const logoStyleResolvedEnum = z.enum(LOGO_STYLE_RESOLVED_IDS);

export const tokenUsageSchema = z
  .object({
    inputTokens: z.number().nullable().optional(),
    outputTokens: z.number().nullable().optional(),
    totalTokens: z.number().nullable().optional(),
  })
  .optional();

export const logoConceptSchema = z.object({
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
      type: logoTypeResolvedEnum.describe(
        `Logo type from these options: ${availableTypes}. Choose the approach that best fits the brand.`,
      ),
      style: logoStyleResolvedEnum.describe(
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
          "Image generation prompt following this pattern: '[Style/mood] logo for [brand type] named [Brand], [thematic suggestions], [color direction]. The logo should [values/emotions], [applications].' Keep it suggestive rather than prescriptive, and include typography + domain text handling if relevant.",
        ),
    })
    .describe(
      'The best creative direction for the logo based on brand analysis and user preferences',
    ),
});

export type LogoConceptSchema = z.infer<typeof logoConceptSchema>;
