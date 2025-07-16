import type { UsageMetadata } from '@langchain/core/messages';
import type { StorageConfig } from '@namefi-astra/storage';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

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
  revisedPrompt?: string;
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

export interface GenerateLogoParams extends BaseGenerationParams {
  domain: NamefiNormalizedDomain;
  logoConcept: LogoConcept;
}

export interface GenerateMarketingImageParams extends BaseGenerationParams {
  domain: NamefiNormalizedDomain;
  basedOnLogoCallId?: string;
}
