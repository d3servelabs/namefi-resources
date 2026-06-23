import { ToolLoopAgent, Output } from 'ai';
import type { LanguageModelUsage } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import {
  CINEMATIC_ANIMATION_MOTION_PRESETS,
  CINEMATIC_ANIMATION_MOTION_PRESET_RESOLVED_IDS,
  LOOPED_ANIMATION_MOTION_PRESETS,
  LOOPED_ANIMATION_MOTION_PRESET_RESOLVED_IDS,
  type AnimationMotionIntensity,
  type CinematicAnimationMotionPresetInput,
  type LoopedAnimationMotionPresetInput,
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
  LOGO_BACKGROUND_TREATMENTS,
  LOGO_COLOR_TREATMENTS,
  logoConceptSchema,
  type LogoConceptSchema,
} from '../types/logo-schemas';
import { logoAnalysisUserPrompt } from '../prompts/logo-generation';

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

const logoBackgroundTreatmentInstructions = Object.entries(
  LOGO_BACKGROUND_TREATMENTS,
)
  .map(([id, description]) => `- ${id} → ${description}`)
  .join('\n');

const logoColorTreatmentInstructions = Object.entries(LOGO_COLOR_TREATMENTS)
  .map(([id, description]) => `- ${id} → ${description}`)
  .join('\n');

const cinematicAnimationMotionResolvedEnum = z.enum(
  CINEMATIC_ANIMATION_MOTION_PRESET_RESOLVED_IDS,
);
const cinematicAnimationMotionInstructions = Object.values(
  CINEMATIC_ANIMATION_MOTION_PRESETS,
)
  .filter((preset) => preset.id !== 'let-ai-choose')
  .map((preset) => `- ${preset.id} → ${preset.name}: ${preset.description}`)
  .join('\n');

const loopedAnimationMotionResolvedEnum = z.enum(
  LOOPED_ANIMATION_MOTION_PRESET_RESOLVED_IDS,
);
const loopedAnimationMotionInstructions = Object.values(
  LOOPED_ANIMATION_MOTION_PRESETS,
)
  .filter((preset) => preset.id !== 'let-ai-choose')
  .map((preset) => `- ${preset.id} → ${preset.name}: ${preset.description}`)
  .join('\n');

const logoStrategistAgent = new ToolLoopAgent({
  model: openai('gpt-5.4'),
  instructions: `You are a senior brand identity strategist creating one production-ready logo strategy for a domain-based brand.

STRICT JSON OUTPUT RULES:
- Return only JSON matching the supplied schema.
- Use the exact ID values (lowercase, hyphenated) listed below for logoConcept.type, logoConcept.style, logoConcept.textTreatment, logoConcept.typography, logoConcept.logoColorTreatment, and logoConcept.backgroundTreatment.
- Never output "let-ai-choose". If the user selected "Let AI Choose", actively choose exactly one resolved finite option from the available IDs.

AVAILABLE LOGO TYPES (use the id on the left):
${logoTypeInstructions}

AVAILABLE LOGO STYLES (use the id on the left):
${logoStyleInstructions}

AVAILABLE TEXT TREATMENTS (use the id on the left):
${logoTextTreatmentInstructions}

AVAILABLE TYPOGRAPHY STYLES (use the id on the left):
${logoTypographyInstructions}

AVAILABLE LOGO COLOR TREATMENTS (use the id on the left):
${logoColorTreatmentInstructions}

LOGO COLOR TREATMENT SELECTION RULES:
- These options describe foreground logo color application only, not the background.
- This output is a finished parked-domain image, not a reusable transparent brand asset. The domain text is a primary visual element and should have an intentional color treatment.
- Design the wordmark color as a small color system rooted in hierarchy, semantic meaning, contrast, and color harmony. Avoid arbitrary rainbow letters.
- Do not default the domain wordmark to plain black. Use black only when it is the strongest deliberate aesthetic choice; otherwise use a dark chromatic ink, brand color, semantic word split, split accent, TLD/dot accent, tonal pair, letterform accent, or controlled wordmark gradient.
- Use one-color-classic only when restraint, premium formality, institutional authority, legal/finance seriousness, architecture, or a stark editorial look is the strongest signal. It is not a fallback for legibility.
- Prefer semantic-word-split when the pre-dot brand label contains clear meaningful units, compounds, blends, or contrasting ideas such as pixel+mango, aurora+ledger, citrus+harbor, word+mint, or letter+luxe.
- Prefer tonal-wordmark-pair for premium, finance, trust, editorial, luxury, professional, architecture, or calm brands that need richer text color than one dark wordmark but should avoid loud multicolor type.
- Prefer letterform-accent-system for typography, design, art, studio, creator, type, script, monogram, or custom-lettering concepts where colored strokes/counters/dots can make the wordmark feel crafted.
- Prefer gradient-wordmark-controlled for expressive digital, light, motion, neon, creative, entertainment, AI, future, energy, or transformation concepts where color transition is conceptually meaningful.
- Prefer brand-color-wordmark or gradient-wordmark-controlled when typography is the main visual asset, especially for short, expressive, creative, playful, tech, art, fashion, or consumer domains.
- For parked-domain images, the full domain text often occupies as much visual importance as the mark. When the wordmark is visually co-primary, choose a text-led treatment before a mark-led treatment.
- If textTreatment is tld-highlight, dot-integrated, or custom-lettering, first consider semantic-word-split, split-wordmark-accent, tonal-wordmark-pair, letterform-accent-system, brand-color-wordmark, or gradient-wordmark-controlled. Choose accented-tld-dot only when the suffix is the main text color idea. Choose a mark-led treatment only when the mark itself is the clearest color concept.
- Do not default to duotone-mark. Choose it only when the mark has two meaningful conceptual parts or a clear two-material/two-force contrast.
- If logoConcept.type is wordmark, choose an intentional text-forward treatment such as semantic-word-split, tonal-wordmark-pair, letterform-accent-system, gradient-wordmark-controlled, brand-color-wordmark, split-wordmark-accent, badge-fill-reverse, or one-color-classic when justified.
- If logoConcept.type is not wordmark, choose the most precise treatment: semantic-word-split when domain text contains meaningful parts; tonal-wordmark-pair when the wordmark needs mature chromatic richness; letterform-accent-system when typography craft is central; brand-color-wordmark when the domain text should be the color anchor; accented-tld-dot only when the TLD/dot is the main text feature; split-wordmark-accent when a word segment or letter detail deserves emphasis; neutral-wordmark-color-mark for a simple colored symbol where the symbol is the color hero; gradient-mark-solid-wordmark only when energy, motion, tech, light, or transformation is primarily expressed by the mark; multicolor-symbol-neutral-wordmark for creative, playful, food, wellness, or multifaceted symbols; badge-fill-reverse for seals, shields, app-like badges, stamps, or contained marks; mascot-palette for characters or concrete mascots; duotone-mark only for two-part marks.
- If textTreatment is tld-highlight and the mark does not need multiple colors, prefer semantic-word-split, split-wordmark-accent, tonal-wordmark-pair, letterform-accent-system, brand-color-wordmark, or gradient-wordmark-controlled over accented-tld-dot, duotone-mark, or gradient-mark-solid-wordmark.
- If the domain suggests a premium, secure, legal, finance, or institutional brand, prefer tonal-wordmark-pair, one-color-classic, neutral-wordmark-color-mark, brand-color-wordmark, badge-fill-reverse, or a restrained accented-tld-dot before duotone-mark.
- For any treatment except one-color-classic, the selected color logic should affect the pre-dot brand label when appropriate; do not make the TLD/dot the only colored text element by default.
- The background must not be the only colorful part of the identity unless one-color-classic is selected.
- Keep foreground colors controlled and brand-like; avoid rainbow effects, arbitrary colors, and low-contrast color-on-color text.

AVAILABLE BACKGROUND TREATMENTS (use the id on the left):
${logoBackgroundTreatmentInstructions}

BACKGROUND TREATMENT SELECTION RULES:
- These options are gradient layout strategies only, not extra symbols, rings, paths, or decorative graphics.
- Do not choose a treatment because it seems safest for legibility; every treatment must preserve a clean focal zone.
- Choose the treatment that best fits the domain meaning, palette, mark concept, and visual energy.
- Use halo-orbit only for orbital, cosmic, circular-motion, ring, portal, navigation, or explicit halo concepts. It is not a default background.
- For art, fashion, editorial, and creative domains, prefer corner-bloom, side-light-wash, split-field, mesh-fields, tonal-field, or grainy-color-field.
- For food, hospitality, natural, travel, and place-based domains, prefer horizon-band, side-light-wash, mesh-fields, tonal-field, or grainy-color-field.
- For technology, games, tools, and futuristic domains, prefer diagonal-flow, mesh-fields, split-field, corner-bloom, or halo-orbit only when conceptually justified.`,
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

export const cinematicAnimationMotionPlanSchema = z.object({
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
  motionPreset: cinematicAnimationMotionResolvedEnum.describe(
    'The single best motion preset for this brand and request.',
  ),
  direction: z
    .string()
    .describe(
      'A prompt-ready cinematic direction describing camera work, action, context, and ambiance for the logo animation.',
    ),
});

export const loopedAnimationMotionPlanSchema = z.object({
  brandAttributes: z
    .array(z.string())
    .describe('Key brand attributes, values, and personality traits'),
  targetAudience: z
    .string()
    .describe('Primary target audience and market positioning'),
  rationale: z
    .string()
    .describe(
      'Why this looped motion direction best reinforces the brand without turning into a cinematic reveal.',
    ),
  motionPreset: loopedAnimationMotionResolvedEnum.describe(
    'The single best loop-friendly motion preset for this brand and request.',
  ),
  direction: z
    .string()
    .describe(
      'A prompt-ready square logo loop direction that preserves the mark and returns to the starting state.',
    ),
});

export const sheetGuidedAnimationMotionPlanSchema = z.object({
  brandAttributes: z
    .array(z.string())
    .describe('Key brand attributes, values, and personality traits'),
  targetAudience: z
    .string()
    .describe('Primary target audience and market positioning'),
  rationale: z
    .string()
    .describe(
      'Why this sheet-guided motion direction is the strongest fit for the uploaded logo.',
    ),
  logoVisualSummary: z
    .string()
    .describe(
      'Concise visual analysis of the uploaded logo: geometry, text, colors, contrast, distinctive shapes, and motion-safe constraints.',
    ),
  animationConcept: z
    .string()
    .describe(
      'The tailored motion concept that should be shown in the animation sheet.',
    ),
  shapeNotes: z
    .array(z.string())
    .min(3)
    .max(8)
    .describe(
      'Concrete notes for how the actual logo shapes, strokes, negative space, or letterforms should move or assemble.',
    ),
  stagePlan: z
    .array(
      z.object({
        label: z.string(),
        timeRange: z.string(),
        visualState: z.string(),
        motionInstruction: z.string(),
      }),
    )
    .min(4)
    .max(6)
    .describe(
      'Four to six 8-second timeline stages for the animation sheet and final video.',
    ),
  direction: z
    .string()
    .describe(
      'A prompt-ready motion direction for the final video, grounded in the uploaded logo and stage plan.',
    ),
  sheetPrompt: z
    .string()
    .describe(
      'A prompt-ready custom animation sheet image prompt for GPT Image 2, grounded in the uploaded logo analysis. It may use text labels, stage numbers, timing scales, captions, and easing notes, but must avoid arrows, arrowheads, chevrons, pointer icons, callout lines, guide marks, and motion-path strokes.',
    ),
  videoPrompt: z
    .string()
    .describe(
      'A prompt-ready Seedance video prompt that follows the generated animation sheet as reference.',
    ),
});

function createCinematicAnimationSystemPrompt(available: string) {
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

function createLoopedAnimationSystemPrompt(available: string) {
  return `You are a motion designer creating square animated logo loops.

GOAL:
- Pick the single strongest loop-friendly motion direction for this brand.
- Favor subtle, brand-safe, repeatable motion over cinematic reveals.
- Keep the logo centered, recognizable, legible, and visually stable.

AVAILABLE MOTION PRESETS:
${available}

RULES:
- Return only JSON matching the schema.
- Choose exactly one motionPreset from the allowed IDs above.
- If the user prompt constrains the allowed motion presets, you must choose only from that constrained set.
- The result must read as a 1:1 animated logo, not a scene, trailer, or hero reveal.
- No scene cuts, no environment building, no extra text, no mascots, and no morphing into a different mark.
- Camera movement must be minimal or absent.
- The ending state must closely match the starting state so the loop feels clean.
- Keep the motion material-aware, restrained, and brand-coherent.`;
}

function createSheetGuidedAnimationSystemPrompt() {
  return `You are a senior motion director designing an 8-second logo animation through a visual animation sheet.

You will receive the actual logo image. Analyze that image first, then choose a tailored animation that fits the logo's geometry, letterforms, colors, contrast, and brand description.

GOAL:
- Produce a motion plan that will be turned into a GPT Image 2 animation sheet and then a Seedance video.
- The sheet must guide timing, transformation, staging, and final logo lockup clearly enough for image-to-video generation without using visual motion artifacts that can leak into the video.
- Favor logo-specific construction, morph, trace, reveal, or material behavior over generic effects.

RULES:
- Return only JSON matching the schema.
- Use the uploaded logo as the source of truth. Do not invent a new mark, new text, mascot, or unrelated object.
- Plan a total duration of exactly 8 seconds.
- stagePlan must contain 4 to 6 clear stages with explicit time ranges that cover 0.0s to 8.0s.
- The final stage must resolve to the original logo, fully legible, centered, and intact.
- shapeNotes must describe actual visual features from the uploaded logo, not generic placeholder shapes.
- sheetPrompt must be a custom GPT Image 2 prompt tailored to the uploaded logo and motion concept.
- sheetPrompt may ask for text labels, stage numbers, captions, timing scales, timing bars, timecodes, and easing notes, preferably in margins or outside the logo artwork.
- sheetPrompt must not ask for arrows, arrowheads, chevrons, pointer icons, callout lines, guide marks, path lines, vector strokes, or motion trails that could be copied as visible animation content.
- videoPrompt must tell Seedance to follow the animation sheet reference closely while rendering only logo-derived visual content and matching the staged timing.`;
}

type StructuredGenerationResult<T> = {
  object: T;
  totalUsage: LanguageModelUsage;
  modelId?: string;
};

interface StrategyGenerationOptions {
  abortSignal?: AbortSignal;
}

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
  options: StrategyGenerationOptions = {},
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
    abortSignal: options.abortSignal,
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
  options: StrategyGenerationOptions = {},
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
    abortSignal: options.abortSignal,
  });

  return {
    object: result.output,
    totalUsage: result.totalUsage,
    modelId: result.response?.modelId,
  };
}

type CinematicAnimationMotionPlan = z.infer<
  typeof cinematicAnimationMotionPlanSchema
>;

export interface CinematicAnimationStrategyInput {
  domain: NamefiNormalizedDomain;
  description?: string;
  motionPreset?: CinematicAnimationMotionPresetInput;
}

export async function generateCinematicAnimationStrategy(
  input: CinematicAnimationStrategyInput,
): Promise<StructuredGenerationResult<CinematicAnimationMotionPlan>> {
  const allowedMotionPresets =
    input.motionPreset && input.motionPreset !== 'let-ai-choose'
      ? input.motionPreset
      : 'orbital-reveal, energy-surge, atmospheric-rise, dimensional-parallax, prismatic-bloom';

  const animationStrategistAgent = new ToolLoopAgent({
    model: openai('gpt-5.2'),
    instructions: createCinematicAnimationSystemPrompt(
      cinematicAnimationMotionInstructions,
    ),
    output: Output.object({ schema: cinematicAnimationMotionPlanSchema }),
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

type LoopedAnimationMotionPlan = z.infer<
  typeof loopedAnimationMotionPlanSchema
>;
type SheetGuidedAnimationMotionPlan = z.infer<
  typeof sheetGuidedAnimationMotionPlanSchema
>;

export interface LoopedAnimationStrategyInput {
  domain: NamefiNormalizedDomain;
  description?: string;
  motionPreset?: LoopedAnimationMotionPresetInput;
  motionIntensity: AnimationMotionIntensity;
}

export async function generateLoopedAnimationStrategy(
  input: LoopedAnimationStrategyInput,
): Promise<StructuredGenerationResult<LoopedAnimationMotionPlan>> {
  const allowedMotionPresets =
    input.motionPreset && input.motionPreset !== 'let-ai-choose'
      ? input.motionPreset
      : 'breathe, light-sweep, shimmer, glow-pulse, contour-trace, ambient-orbit, micro-parallax, gradient-drift';

  const animationStrategistAgent = new ToolLoopAgent({
    model: openai('gpt-5.2'),
    instructions: createLoopedAnimationSystemPrompt(
      loopedAnimationMotionInstructions,
    ),
    output: Output.object({ schema: loopedAnimationMotionPlanSchema }),
  });

  const result = await animationStrategistAgent.generate({
    prompt: `Brand: ${input.domain}
Description: ${input.description || 'N/A'}
Requested number of motion directions: 1
Allowed motion presets (if constrained): ${allowedMotionPresets}
Requested motion intensity: ${input.motionIntensity}
`,
  });

  return {
    object: result.output,
    totalUsage: result.totalUsage,
    modelId: result.response?.modelId,
  };
}

export interface SheetGuidedAnimationStrategyInput {
  domain: NamefiNormalizedDomain;
  description?: string;
  referenceLogo: Uint8Array;
  referenceLogoMediaType: string;
}

export async function generateSheetGuidedAnimationStrategy(
  input: SheetGuidedAnimationStrategyInput,
): Promise<StructuredGenerationResult<SheetGuidedAnimationMotionPlan>> {
  const animationStrategistAgent = new ToolLoopAgent({
    model: openai('gpt-5.2'),
    instructions: createSheetGuidedAnimationSystemPrompt(),
    output: Output.object({ schema: sheetGuidedAnimationMotionPlanSchema }),
  });

  const result = await animationStrategistAgent.generate({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Brand: ${input.domain}
Description: ${input.description || 'N/A'}
Requested number of motion directions: 1
Target output: one 8-second sheet-guided logo animation, using the uploaded logo as the visual source of truth.
`,
          },
          {
            type: 'image',
            image: input.referenceLogo,
            mediaType: input.referenceLogoMediaType,
          },
        ],
      },
    ],
  });

  return {
    object: result.output,
    totalUsage: result.totalUsage,
    modelId: result.response?.modelId,
  };
}
