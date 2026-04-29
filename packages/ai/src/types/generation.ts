import type { StorageConfig } from '@namefi-astra/storage';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type {
  LogoStyle,
  LogoStyleInput,
  LogoType,
  LogoTypeInput,
  LogoTextTreatment,
  LogoTextTreatmentInput,
  LogoTypography,
  LogoTypographyInput,
} from './logo-options';
import type { GenerateVideoResult, LanguageModelUsage } from 'ai';

export type ImageModel =
  | 'gpt-image-1'
  | 'gpt-image-1.5'
  | 'gpt-image-2'
  | 'gemini-2.5-flash-image'
  | 'gemini-3-pro-image-preview';

export const ANIMATION_MODES = {
  cinematic: {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Wide-frame logo reveals with dramatic motion.',
  },
  looped: {
    id: 'looped',
    name: 'Looped',
    description: 'Square animated logos with restrained repeatable motion.',
  },
  'sheet-guided': {
    id: 'sheet-guided',
    name: 'Animation Sheet',
    description:
      'AI analyzes the logo, creates a motion-spec sheet, then animates from that sheet.',
  },
} as const;

export type AnimationMode = keyof typeof ANIMATION_MODES;

export const ANIMATION_MODE_IDS = [
  'cinematic',
  'looped',
  'sheet-guided',
] as const satisfies [AnimationMode, ...AnimationMode[]];

export const CINEMATIC_ANIMATION_MODELS = {
  'veo-3.1-generate-preview': {
    id: 'veo-3.1-generate-preview',
    name: 'Veo 3.1 Quality',
    description: 'Higher-quality motion and detail.',
  },
  'veo-3.1-fast-generate-preview': {
    id: 'veo-3.1-fast-generate-preview',
    name: 'Veo 3.1 Fast',
    description: 'Lower-latency animation generation.',
  },
} as const;

export type CinematicAnimationModel = keyof typeof CINEMATIC_ANIMATION_MODELS;

export const LOOPED_ANIMATION_MODELS = {
  'bytedance/seedance-2.0': {
    id: 'bytedance/seedance-2.0',
    name: 'Seedance 2.0',
    description: 'Highest-quality Seedance logo animation.',
  },
  'bytedance/seedance-2.0-fast': {
    id: 'bytedance/seedance-2.0-fast',
    name: 'Seedance 2.0 Fast',
    description: 'Faster Seedance 2.0 logo animation.',
  },
  'bytedance/seedance-v1.5-pro': {
    id: 'bytedance/seedance-v1.5-pro',
    name: 'Seedance 1.5 Pro',
    description: 'Legacy Seedance quality model.',
  },
  'bytedance/seedance-v1.0-pro': {
    id: 'bytedance/seedance-v1.0-pro',
    name: 'Seedance 1.0 Pro',
    description: 'Legacy faster Seedance model.',
  },
} as const;

export type LoopedAnimationModel = keyof typeof LOOPED_ANIMATION_MODELS;

export const ANIMATION_MODELS = {
  ...CINEMATIC_ANIMATION_MODELS,
  ...LOOPED_ANIMATION_MODELS,
} as const;

export type AnimationModel = keyof typeof ANIMATION_MODELS;

export const CINEMATIC_ANIMATION_MODEL_IDS = [
  'veo-3.1-generate-preview',
  'veo-3.1-fast-generate-preview',
] as const satisfies [CinematicAnimationModel, ...CinematicAnimationModel[]];

export const LOOPED_ANIMATION_MODEL_IDS = [
  'bytedance/seedance-2.0',
  'bytedance/seedance-2.0-fast',
  'bytedance/seedance-v1.5-pro',
  'bytedance/seedance-v1.0-pro',
] as const satisfies [LoopedAnimationModel, ...LoopedAnimationModel[]];

export const ANIMATION_MODEL_IDS = [
  ...CINEMATIC_ANIMATION_MODEL_IDS,
  ...LOOPED_ANIMATION_MODEL_IDS,
] as const satisfies [AnimationModel, ...AnimationModel[]];

export function isCinematicAnimationModel(
  model: AnimationModel,
): model is CinematicAnimationModel {
  return model in CINEMATIC_ANIMATION_MODELS;
}

export function isLoopedAnimationModel(
  model: AnimationModel,
): model is LoopedAnimationModel {
  return model in LOOPED_ANIMATION_MODELS;
}

export function getAnimationModeForModel(model: AnimationModel): AnimationMode {
  return isLoopedAnimationModel(model) ? 'looped' : 'cinematic';
}

export const ANIMATION_SOURCE_MODES = {
  'exact-frame': {
    id: 'exact-frame',
    name: 'Exact frame',
    description: 'Start from the selected logo image exactly as provided.',
  },
  'subject-reference': {
    id: 'subject-reference',
    name: 'Native composition',
    description:
      'Use the selected logo as a subject reference so Veo composes the shot itself.',
  },
} as const;

export type AnimationSourceMode = keyof typeof ANIMATION_SOURCE_MODES;

const animationSourceModeIds = Object.keys(
  ANIMATION_SOURCE_MODES,
) as AnimationSourceMode[];

export const ANIMATION_SOURCE_MODE_IDS = animationSourceModeIds as [
  AnimationSourceMode,
  ...AnimationSourceMode[],
];

const LET_AI_CHOOSE_ANIMATION_PRESET = {
  id: 'let-ai-choose',
  name: 'Let AI Choose',
  description: 'AI picks the strongest motion direction for this mode.',
} as const;

export const CINEMATIC_ANIMATION_MOTION_PRESETS = {
  'let-ai-choose': {
    ...LET_AI_CHOOSE_ANIMATION_PRESET,
  },
  'orbital-reveal': {
    id: 'orbital-reveal',
    name: 'Orbital Reveal',
    description:
      'A sweeping arc shot with light ribbons and layered depth around the logo.',
  },
  'energy-surge': {
    id: 'energy-surge',
    name: 'Energy Surge',
    description:
      'Power builds through the mark and releases in a controlled cinematic burst.',
  },
  'atmospheric-rise': {
    id: 'atmospheric-rise',
    name: 'Atmospheric Rise',
    description:
      'Mist, particles, and light shafts lift the logo into a hero reveal.',
  },
  'dimensional-parallax': {
    id: 'dimensional-parallax',
    name: 'Dimensional Parallax',
    description:
      'Depth layers and a camera push create a premium 3D illusion without changing the mark.',
  },
  'prismatic-bloom': {
    id: 'prismatic-bloom',
    name: 'Prismatic Bloom',
    description:
      'Refractions, lens flares, and glossy glints create a high-end reveal.',
  },
} as const;

export type CinematicAnimationMotionPresetId =
  keyof typeof CINEMATIC_ANIMATION_MOTION_PRESETS;

export const CINEMATIC_ANIMATION_MOTION_PRESET_IDS = [
  'let-ai-choose',
  'orbital-reveal',
  'energy-surge',
  'atmospheric-rise',
  'dimensional-parallax',
  'prismatic-bloom',
] as const satisfies [
  CinematicAnimationMotionPresetId,
  ...CinematicAnimationMotionPresetId[],
];

export type CinematicAnimationMotionPresetInput =
  (typeof CINEMATIC_ANIMATION_MOTION_PRESET_IDS)[number];

export const CINEMATIC_ANIMATION_MOTION_PRESET_RESOLVED_IDS = [
  'orbital-reveal',
  'energy-surge',
  'atmospheric-rise',
  'dimensional-parallax',
  'prismatic-bloom',
] as const satisfies [
  Exclude<CinematicAnimationMotionPresetId, 'let-ai-choose'>,
  ...Exclude<CinematicAnimationMotionPresetId, 'let-ai-choose'>[],
];

export type CinematicAnimationMotionPreset =
  (typeof CINEMATIC_ANIMATION_MOTION_PRESET_RESOLVED_IDS)[number];

export const LOOPED_ANIMATION_MOTION_PRESETS = {
  'let-ai-choose': {
    ...LET_AI_CHOOSE_ANIMATION_PRESET,
  },
  breathe: {
    id: 'breathe',
    name: 'Breathe',
    description: 'A slow in-place pulse in light and energy.',
  },
  'light-sweep': {
    id: 'light-sweep',
    name: 'Light Sweep',
    description: 'A restrained highlight pass glides across the mark.',
  },
  shimmer: {
    id: 'shimmer',
    name: 'Shimmer',
    description: 'A subtle reflective shimmer glides across key edges.',
  },
  'glow-pulse': {
    id: 'glow-pulse',
    name: 'Glow Pulse',
    description: 'A soft radiance brightens and fades without blooming out.',
  },
  'contour-trace': {
    id: 'contour-trace',
    name: 'Contour Trace',
    description: 'A clean light trace follows the logo contour and resolves.',
  },
  'ambient-orbit': {
    id: 'ambient-orbit',
    name: 'Ambient Orbit',
    description: 'Sparse ambient particles orbit around the logo.',
  },
  'micro-parallax': {
    id: 'micro-parallax',
    name: 'Micro Parallax',
    description: 'Tiny internal depth motion adds dimension without a reveal.',
  },
  'gradient-drift': {
    id: 'gradient-drift',
    name: 'Gradient Drift',
    description: 'Very slow movement in fills or background gradients.',
  },
} as const;

export type LoopedAnimationMotionPresetId =
  keyof typeof LOOPED_ANIMATION_MOTION_PRESETS;

export const LOOPED_ANIMATION_MOTION_PRESET_IDS = [
  'let-ai-choose',
  'breathe',
  'light-sweep',
  'shimmer',
  'glow-pulse',
  'contour-trace',
  'ambient-orbit',
  'micro-parallax',
  'gradient-drift',
] as const satisfies [
  LoopedAnimationMotionPresetId,
  ...LoopedAnimationMotionPresetId[],
];

export type LoopedAnimationMotionPresetInput =
  (typeof LOOPED_ANIMATION_MOTION_PRESET_IDS)[number];

export const LOOPED_ANIMATION_MOTION_PRESET_RESOLVED_IDS = [
  'breathe',
  'light-sweep',
  'shimmer',
  'glow-pulse',
  'contour-trace',
  'ambient-orbit',
  'micro-parallax',
  'gradient-drift',
] as const satisfies [
  Exclude<LoopedAnimationMotionPresetId, 'let-ai-choose'>,
  ...Exclude<LoopedAnimationMotionPresetId, 'let-ai-choose'>[],
];

export type LoopedAnimationMotionPreset =
  (typeof LOOPED_ANIMATION_MOTION_PRESET_RESOLVED_IDS)[number];

export const ANIMATION_MOTION_PRESETS = {
  ...CINEMATIC_ANIMATION_MOTION_PRESETS,
  ...LOOPED_ANIMATION_MOTION_PRESETS,
} as const;

export type AnimationMotionPresetId = keyof typeof ANIMATION_MOTION_PRESETS;

export const ANIMATION_MOTION_PRESET_IDS = [
  ...CINEMATIC_ANIMATION_MOTION_PRESET_IDS,
  ...LOOPED_ANIMATION_MOTION_PRESET_IDS.filter(
    (presetId) => presetId !== 'let-ai-choose',
  ),
] as const satisfies [AnimationMotionPresetId, ...AnimationMotionPresetId[]];

export type AnimationMotionPresetInput =
  | CinematicAnimationMotionPresetInput
  | LoopedAnimationMotionPresetInput;

export type AnimationMotionPreset =
  | CinematicAnimationMotionPreset
  | LoopedAnimationMotionPreset;

export const ANIMATION_MOTION_PRESET_RESOLVED_IDS = [
  ...CINEMATIC_ANIMATION_MOTION_PRESET_RESOLVED_IDS,
  ...LOOPED_ANIMATION_MOTION_PRESET_RESOLVED_IDS,
] as const satisfies [AnimationMotionPreset, ...AnimationMotionPreset[]];

export const ANIMATION_MOTION_INTENSITIES = {
  subtle: {
    id: 'subtle',
    name: 'Subtle',
    description: 'Very restrained in-place motion.',
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    description: 'Noticeable motion while keeping the logo calm and stable.',
  },
  bold: {
    id: 'bold',
    name: 'Bold',
    description: 'The strongest motion allowed for a looped logo.',
  },
} as const;

export type AnimationMotionIntensity =
  keyof typeof ANIMATION_MOTION_INTENSITIES;

export const ANIMATION_MOTION_INTENSITY_IDS = [
  'subtle',
  'balanced',
  'bold',
] as const satisfies [AnimationMotionIntensity, ...AnimationMotionIntensity[]];

export const MARKETING_COLLATERAL_TYPES = [
  'billboard',
  'apparel',
  'vehicle',
  'product',
] as const;

export type MarketingCollateralType =
  (typeof MARKETING_COLLATERAL_TYPES)[number];

export type MarketingCollateralTypeInput =
  | MarketingCollateralType
  | 'let_ai_choose';

export const MARKETING_COLLATERAL_TYPE_RESOLVED_IDS = [
  ...MARKETING_COLLATERAL_TYPES,
] as [MarketingCollateralType, ...MarketingCollateralType[]];

export const MARKETING_COLLATERAL_TYPE_INPUT_IDS = [
  ...MARKETING_COLLATERAL_TYPES,
  'let_ai_choose',
] as [MarketingCollateralTypeInput, ...MarketingCollateralTypeInput[]];

export interface BaseConcept {
  concept: string;
  prompt: string;
}

export interface LogoConcept extends BaseConcept {
  type: LogoType;
  style: LogoStyle;
  textTreatment: LogoTextTreatment;
  typography: LogoTypography;
}

export interface MarketingConcept extends BaseConcept {
  collateralType: MarketingCollateralType;
  rationale: string;
  style: string;
}

export interface BaseAssetResult<TModelName extends string> {
  storagePath: string;
  url: string;
  model: TModelName;
}

export interface BaseGenerationResult extends BaseAssetResult<ImageModel> {
  tokenUsage?: LanguageModelUsage;
}

export interface GeneratedLogo extends BaseGenerationResult {
  concept: string;
  type: LogoType;
  style: LogoStyle;
}

export interface GeneratedImage extends BaseGenerationResult {}

export interface GeneratedAnimationVideo
  extends BaseAssetResult<AnimationModel> {
  thumbnailStoragePath: string;
  thumbnailUrl: string;
  mimeType: 'video/mp4';
}

export interface LogoPlanAnalysis {
  brandAttributes: string[];
  targetAudience: string;
  visualIdentity: string;
  colorPalette: string[];
  logoConcept: LogoConcept;
}

export interface CollateralPick {
  collateralType: MarketingCollateralType;
  prompt: string;
}

export interface CollateralAnalysis {
  brandAttributes: string[];
  targetAudience: string;
  rationale: string;
  picks: CollateralPick[];
}

export interface BaseWorkflowStorageInput {
  storage: StorageConfig;
}

export interface LogoConceptInput {
  domain: NamefiNormalizedDomain;
  brandDescription?: string;
  preferredType?: LogoTypeInput;
  preferredStyle?: LogoStyleInput;
  preferredTextTreatment?: LogoTextTreatmentInput;
  preferredTypography?: LogoTypographyInput;
}

export interface LogoGenerationInput
  extends BaseWorkflowStorageInput,
    LogoConceptInput {
  model: ImageModel;
  textTreatment?: LogoTextTreatmentInput;
  typography?: LogoTypographyInput;
}

export interface MarketingGenerationInput extends BaseWorkflowStorageInput {
  domain: NamefiNormalizedDomain;
  model: ImageModel;
  description?: string;
  referenceLogoUrl?: string;
  collateralType?: MarketingCollateralTypeInput;
}

interface BaseAnimationGenerationInput extends BaseWorkflowStorageInput {
  domain: NamefiNormalizedDomain;
  description?: string;
  referenceLogoUrl: string;
}

export interface CinematicAnimationGenerationInput
  extends BaseAnimationGenerationInput {
  mode: 'cinematic';
  sourceMode?: AnimationSourceMode;
  motionPreset: CinematicAnimationMotionPresetId;
  model: CinematicAnimationModel;
}

export interface LoopedAnimationGenerationInput
  extends BaseAnimationGenerationInput {
  mode: 'looped';
  motionPreset: LoopedAnimationMotionPresetId;
  motionIntensity: AnimationMotionIntensity;
  model: LoopedAnimationModel;
}

export interface SheetGuidedAnimationGenerationInput
  extends BaseAnimationGenerationInput {
  mode: 'sheet-guided';
  model: LoopedAnimationModel;
  sheetModel: 'gpt-image-2';
}

export type AnimationGenerationInput =
  | CinematicAnimationGenerationInput
  | LoopedAnimationGenerationInput
  | SheetGuidedAnimationGenerationInput;

interface BaseAnimationAnalysis<
  TModeValue extends AnimationMode,
  TPresetValue extends AnimationMotionPreset,
> {
  mode: TModeValue;
  brandAttributes: string[];
  targetAudience: string;
  rationale: string;
  resolvedMotionPreset: TPresetValue;
  direction: string;
  model: string;
  tokenUsage?: LanguageModelUsage;
}

export type CinematicAnimationAnalysis = BaseAnimationAnalysis<
  'cinematic',
  CinematicAnimationMotionPreset
>;

export type LoopedAnimationAnalysis = BaseAnimationAnalysis<
  'looped',
  LoopedAnimationMotionPreset
>;

export interface SheetGuidedAnimationAnalysis {
  mode: 'sheet-guided';
  brandAttributes: string[];
  targetAudience: string;
  rationale: string;
  direction: string;
  model: string;
  tokenUsage?: LanguageModelUsage;
  logoVisualSummary: string;
  animationConcept: string;
  shapeNotes: string[];
  stagePlan: Array<{
    label: string;
    timeRange: string;
    visualState: string;
    motionInstruction: string;
  }>;
  sheetPrompt: string;
  videoPrompt: string;
}

export type AnimationAnalysis =
  | CinematicAnimationAnalysis
  | LoopedAnimationAnalysis
  | SheetGuidedAnimationAnalysis;

export interface GeneratedAnimationSheet extends BaseGenerationResult {
  prompt: string;
}

export interface AnimationGenerationResult {
  analysis: AnimationAnalysis;
  prompt: string;
  video: GeneratedAnimationVideo;
  animationSheet?: GeneratedAnimationSheet;
  warnings: GenerateVideoResult['warnings'];
  providerMetadata?: GenerateVideoResult['providerMetadata'];
}
