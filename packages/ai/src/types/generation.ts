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
import type { LanguageModelUsage } from 'ai';

export type ImageModel =
  | 'gpt-image-1'
  | 'gpt-image-1.5'
  | 'gemini-2.5-flash-image'
  | 'gemini-3-pro-image-preview';

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
}

export interface MarketingConcept extends BaseConcept {
  collateralType: MarketingCollateralType;
  rationale: string;
  style: string;
}

export interface BaseGenerationResult {
  storagePath: string;
  url: string;
  model: ImageModel;
  tokenUsage?: LanguageModelUsage;
}

export interface GeneratedLogo extends BaseGenerationResult {
  concept: string;
  type: LogoType;
  style: LogoStyle;
}

export interface GeneratedImage extends BaseGenerationResult {}

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
