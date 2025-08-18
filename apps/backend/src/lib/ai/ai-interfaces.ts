export interface NamefiGptDocument {
  explain?: string;
  appraisal?: string;
  namefiGptVersion?: string;
  ldh: string;
}

export interface DomainAnalysisResult {
  tokenId: bigint;
  explain?: string;
  appraisal?: string;
  unicode?: string;
  namefiGptVersion?: string;
}

export interface AiProcessingConfig {
  batchSize?: number;
  maxDomains?: number;
  regenerateAll?: boolean;
  openaiApiKey?: string;
  namefiGptLimit?: number;
}
