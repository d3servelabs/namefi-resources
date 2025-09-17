import type { UsageMetadata } from '@langchain/core/messages';
import type { StorageConfig } from '@namefi-astra/storage';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

export type Model = 'gpt-image-1' | 'gemini-2.5-flash-image-preview';

// Base concept interfaces
export interface BaseConcept {
  style: string;
  concept: string;
  prompt: string;
}

export interface LogoConcept extends BaseConcept {
  type: string;
}

export interface MarketingConcept extends BaseConcept {
  buyerAppeal: string;
}

// Base generated result interface
export interface BaseGeneratedResult {
  url: string;
  storagePath: string;
  generationCallId?: string;
  tokenUsage?: UsageMetadata;
  model: string;
}

export interface GeneratedLogo extends BaseGeneratedResult {
  concept: string;
  type: string;
  style: string;
}

export interface GeneratedImage extends BaseGeneratedResult {}

// Generation parameter interfaces
export interface BaseGenerationParams {
  storage: StorageConfig;
}

// Marketing collateral types supported by UI and prompt builder
export type MarketingCollateralType =
  | 'billboard'
  | 't_shirt'
  | 'coffee_mug'
  | 'cap'
  | 'hoodie'
  | 'pizza_box'
  | 'medal'
  | 'flag';

export interface GenerateLogoParams extends BaseGenerationParams {
  domain: NamefiNormalizedDomain;
  logoConcept: LogoConcept;
  model: Model;
}

export interface GenerateMarketingImageParams extends BaseGenerationParams {
  domain: NamefiNormalizedDomain;
  basedOnLogoCallId?: string;
  basedOnLogoPublicUrl?: string;
  model: Model;
  collateralType: MarketingCollateralType;
}
