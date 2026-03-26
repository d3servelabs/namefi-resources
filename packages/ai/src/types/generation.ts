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
  | 'gemini-2.5-flash-image'
  | 'gemini-3-pro-image-preview';

export const ANIMATION_MODELS = {
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

export type AnimationModel = keyof typeof ANIMATION_MODELS;

const animationModelIds = Object.keys(ANIMATION_MODELS) as AnimationModel[];

export const ANIMATION_MODEL_IDS = animationModelIds as [
  AnimationModel,
  ...AnimationModel[],
];

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

export const ANIMATION_MOTION_PRESETS = {
  'let-ai-choose': {
    id: 'let-ai-choose',
    name: 'Let AI Choose',
    description:
      'AI picks the strongest cinematic motion direction for this brand.',
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
  'light-sweep': {
    id: 'light-sweep',
    name: 'Light Sweep',
    description: 'A controlled light pass across the logo surface.',
    legacy: true,
  },
  'glow-pulse': {
    id: 'glow-pulse',
    name: 'Glow Pulse',
    description: 'A restrained glow that gently brightens and fades.',
    legacy: true,
  },
  'particle-orbit': {
    id: 'particle-orbit',
    name: 'Particle Orbit',
    description: 'Small particles orbit the logo without obscuring it.',
    legacy: true,
  },
  'contour-trace': {
    id: 'contour-trace',
    name: 'Contour Trace',
    description: 'A clean line traces the logo silhouette.',
    legacy: true,
  },
  shimmer: {
    id: 'shimmer',
    name: 'Shimmer',
    description: 'A subtle metallic shimmer glides across key edges.',
    legacy: true,
  },
} as const;

export const ANIMATION_MOTION_PRESET_KNOWN_IDS = [
  'let-ai-choose',
  'orbital-reveal',
  'energy-surge',
  'atmospheric-rise',
  'dimensional-parallax',
  'prismatic-bloom',
  'light-sweep',
  'glow-pulse',
  'particle-orbit',
  'contour-trace',
  'shimmer',
] as const;

export type AnimationMotionPresetId =
  (typeof ANIMATION_MOTION_PRESET_KNOWN_IDS)[number];

export const ANIMATION_MOTION_PRESET_IDS = [
  'let-ai-choose',
  'orbital-reveal',
  'energy-surge',
  'atmospheric-rise',
  'dimensional-parallax',
  'prismatic-bloom',
] as const;

export type AnimationMotionPresetInput =
  (typeof ANIMATION_MOTION_PRESET_IDS)[number];

export const ANIMATION_MOTION_PRESET_RESOLVED_IDS = [
  'orbital-reveal',
  'energy-surge',
  'atmospheric-rise',
  'dimensional-parallax',
  'prismatic-bloom',
] as const;

export type AnimationMotionPreset =
  (typeof ANIMATION_MOTION_PRESET_RESOLVED_IDS)[number];

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

export interface BaseAssetResult<TModel extends string> {
  storagePath: string;
  url: string;
  model: TModel;
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

export interface AnimationGenerationInput extends BaseWorkflowStorageInput {
  domain: NamefiNormalizedDomain;
  description?: string;
  referenceLogoUrl: string;
  sourceMode?: AnimationSourceMode;
  motionPreset: AnimationMotionPresetId;
  model: AnimationModel;
}

export interface AnimationAnalysis {
  brandAttributes: string[];
  targetAudience: string;
  rationale: string;
  resolvedMotionPreset: AnimationMotionPresetId;
  direction: string;
  model: string;
  tokenUsage?: LanguageModelUsage;
}

export interface AnimationGenerationResult {
  analysis: AnimationAnalysis;
  prompt: string;
  video: GeneratedAnimationVideo;
  warnings: GenerateVideoResult['warnings'];
  providerMetadata?: GenerateVideoResult['providerMetadata'];
}
