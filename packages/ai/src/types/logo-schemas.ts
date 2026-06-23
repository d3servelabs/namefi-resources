import { z } from 'zod';
import {
  LOGO_TYPES,
  LOGO_STYLES,
  LOGO_TYPE_RESOLVED_IDS,
  LOGO_STYLE_RESOLVED_IDS,
  LOGO_TEXT_TREATMENTS,
  LOGO_TYPOGRAPHY,
  LOGO_TEXT_TREATMENT_RESOLVED_IDS,
  LOGO_TYPOGRAPHY_RESOLVED_IDS,
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

const filteredTextTreatments = Object.values(LOGO_TEXT_TREATMENTS).filter(
  (treatment) => treatment.id !== 'let-ai-choose',
);
const availableTextTreatments = filteredTextTreatments
  .map((treatment) => `'${treatment.name}' (${treatment.description})`)
  .join(', ');

const filteredTypography = Object.values(LOGO_TYPOGRAPHY).filter(
  (option) => option.id !== 'let-ai-choose',
);
const availableTypography = filteredTypography
  .map((option) => `'${option.name}' (${option.description})`)
  .join(', ');

const logoTypeResolvedEnum = z.enum(LOGO_TYPE_RESOLVED_IDS);
const logoStyleResolvedEnum = z.enum(LOGO_STYLE_RESOLVED_IDS);
const logoTextTreatmentResolvedEnum = z.enum(LOGO_TEXT_TREATMENT_RESOLVED_IDS);
const logoTypographyResolvedEnum = z.enum(LOGO_TYPOGRAPHY_RESOLVED_IDS);
export const LOGO_COLOR_TREATMENT_IDS = [
  'one-color-classic',
  'brand-color-wordmark',
  'neutral-wordmark-color-mark',
  'duotone-mark',
  'accented-tld-dot',
  'split-wordmark-accent',
  'semantic-word-split',
  'tonal-wordmark-pair',
  'letterform-accent-system',
  'gradient-wordmark-controlled',
  'gradient-mark-solid-wordmark',
  'multicolor-symbol-neutral-wordmark',
  'badge-fill-reverse',
  'mascot-palette',
] as const;
export type LogoColorTreatment = (typeof LOGO_COLOR_TREATMENT_IDS)[number];
export const LOGO_COLOR_TREATMENTS: Record<LogoColorTreatment, string> = {
  'one-color-classic':
    'one-color classic: intentional single-color foreground logo for restraint and reproducibility',
  'brand-color-wordmark':
    'brand-color wordmark: domain text itself uses a solid primary or chromatic ink brand color with optional TLD/dot accent',
  'neutral-wordmark-color-mark':
    'chromatic wordmark + color mark: stable readable wordmark in designed chromatic ink with the symbol carrying stronger brand color; use when the symbol is the clear color hero',
  'duotone-mark':
    'duotone mark: two-part symbol or monogram uses two brand colors for distinct conceptual parts while wordmark uses designed chromatic ink; use only when the mark benefits from two-color structure',
  'accented-tld-dot':
    'accented TLD/dot: readable domain wordmark with the dot and/or TLD as the deliberate color accent',
  'split-wordmark-accent':
    'split wordmark accent: a meaningful pre-dot wordmark segment plus optional TLD/dot uses a secondary/accent color',
  'semantic-word-split':
    'semantic word split: compound or blended domain text uses different harmonized brand colors for meaningful word units before the dot',
  'tonal-wordmark-pair':
    'tonal wordmark pair: two related chromatic ink colors divide the pre-dot wordmark by word unit, syllable, or hierarchy for mature restrained brands',
  'letterform-accent-system':
    'letterform accent system: selected strokes, counters, crossbars, dots, swashes, or custom letter details inside the pre-dot wordmark carry brand color',
  'gradient-wordmark-controlled':
    'controlled gradient wordmark: domain text uses a subtle brand-color gradient or color transition while preserving exact readability',
  'gradient-mark-solid-wordmark':
    'gradient mark + solid wordmark: controlled brand gradient in the mark with solid readable chromatic wordmark text; use when the icon, not the text, should carry the main color movement',
  'multicolor-symbol-neutral-wordmark':
    'multicolor symbol + restrained wordmark: symbol carries 2-3 controlled brand colors while text uses readable chromatic ink',
  'badge-fill-reverse':
    'badge fill + reverse: colored badge/container or filled mark with reversed/high-contrast lettering',
  'mascot-palette':
    'mascot palette: mascot or concrete object uses multiple controlled brand colors with restrained text',
};
const logoColorTreatmentEnum = z.enum(LOGO_COLOR_TREATMENT_IDS);
export const LOGO_BACKGROUND_TREATMENT_IDS = [
  'mesh-fields',
  'diagonal-flow',
  'corner-bloom',
  'center-lit-vignette',
  'horizon-band',
  'side-light-wash',
  'split-field',
  'halo-orbit',
  'tonal-field',
  'grainy-color-field',
] as const;
export type LogoBackgroundTreatment =
  (typeof LOGO_BACKGROUND_TREATMENT_IDS)[number];
export const LOGO_BACKGROUND_TREATMENTS: Record<
  LogoBackgroundTreatment,
  string
> = {
  'mesh-fields':
    'mesh fields: broad overlapping palette-color fields with visible chromatic zones',
  'diagonal-flow':
    'diagonal flow: color movement from one corner or side toward the opposite edge',
  'corner-bloom':
    'corner bloom: one or two offset chromatic blooms entering from specific corners',
  'center-lit-vignette':
    'center-lit vignette: clean focal center with more chromatic color around the perimeter',
  'horizon-band':
    'horizon band: broad horizontal color transition with a clear top/bottom relationship',
  'side-light-wash':
    'side-light wash: one side carries the richer palette color while the opposite side stays calmer',
  'split-field':
    'split field: two or three large palette-color regions blended with soft seams',
  'halo-orbit':
    'halo orbit: orbital or circular gradient glow for cosmic, ring, portal, or orbit concepts only; no visible outline',
  'tonal-field':
    'tonal field: one dominant palette hue with one softened counter-accent',
  'grainy-color-field':
    'grainy color field: simple colored base with fine grain and one offset accent',
};
const logoBackgroundTreatmentEnum = z.enum(LOGO_BACKGROUND_TREATMENT_IDS);

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
      'Six role-based palette entries: Logo neutral/ink, Logo primary brand color, Logo secondary brand color, Logo accent/TLD/dot color, Background base, and Background gradient accents.',
    ),
  logoConcept: z
    .object({
      type: logoTypeResolvedEnum.describe(
        `Logo type from these options: ${availableTypes}. Choose the approach that best fits the brand.`,
      ),
      style: logoStyleResolvedEnum.describe(
        `Design style from these options: ${availableStyles}. Select the style that best represents the brand identity.`,
      ),
      textTreatment: logoTextTreatmentResolvedEnum.describe(
        `Text treatment from these options: ${availableTextTreatments}. Choose the lockup that best fits the brand.`,
      ),
      typography: logoTypographyResolvedEnum.describe(
        `Typography direction from these options: ${availableTypography}. Choose the style that best fits the brand.`,
      ),
      logoColorTreatment: logoColorTreatmentEnum.describe(
        `Foreground logo color treatment from these options: ${Object.entries(
          LOGO_COLOR_TREATMENTS,
        )
          .map(([id, description]) => `${id} (${description})`)
          .join(
            ', ',
          )}. Choose how color is applied to the logo itself, not the background.`,
      ),
      backgroundTreatment: logoBackgroundTreatmentEnum.describe(
        `Background treatment from these options: ${Object.entries(
          LOGO_BACKGROUND_TREATMENTS,
        )
          .map(([id, description]) => `${id} (${description})`)
          .join(
            ', ',
          )}. Choose a treatment that creates background variety while staying quiet behind the logo.`,
      ),
      concept: z
        .string()
        .describe(
          'Brief explanation of the creative direction and why it suits the brand',
        ),
      prompt: z
        .string()
        .describe(
          'Image generation prompt with visible text rules, logo type/style, typography, foreground logo color treatment, background treatment, palette roles, and composition constraints.',
        ),
    })
    .describe(
      'The best creative direction for the logo based on brand analysis and user preferences',
    ),
});

export type LogoConceptSchema = z.infer<typeof logoConceptSchema>;
