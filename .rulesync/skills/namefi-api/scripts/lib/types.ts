export type Eip712Field = {
  name: string;
  type: string;
};

export type ManifestEntry = {
  label?: string;
  openapiUrl: string;
  requestBaseUrl: string;
  fallbackEnv?: string | null;
  useContractFallback?: boolean;
  notes?: string[];
};

export type Manifest = Record<string, ManifestEntry>;

export type CachedOpenApiDocument = {
  env: string;
  openapiUrl: string;
  requestBaseUrl: string;
  fetchedAt: string;
  document: Record<string, unknown>;
};

export type SchemaSummary = {
  type: string | null;
  ref: string | null;
  format: string | null;
  enumValues: string[];
  properties: string[];
  requiredProperties: string[];
  itemsType: string | null;
  itemsRef: string | null;
  variants: string[];
};

export type ParameterSummary = {
  name: string;
  in: string;
  required: boolean;
  description: string | null;
  schema: SchemaSummary | null;
};

export type MediaTypeSummary = {
  contentType: string;
  schema: SchemaSummary | null;
};

export type RequestBodySummary = {
  required: boolean;
  description: string | null;
  content: MediaTypeSummary[];
};

export type AuthKind = 'public' | 'authedOrPublic' | 'protected' | 'unknown';

export type AuthMode =
  | 'none'
  | 'eip712'
  | 'siwe-optional'
  | 'siwe-required'
  | 'unknown';

export type ResponseSummary = {
  status: string;
  description: string | null;
  content: MediaTypeSummary[];
};

export type Eip712Envelope = {
  payloadType: string;
  payload: Record<string, unknown>;
  timestamp: number;
  nonce: string;
};

export type TypedData = {
  domain: {
    name: string;
    version: string;
    chainId?: number;
    verifyingContract?: `0x${string}`;
  };
  types: Record<string, Eip712Field[]>;
  primaryType: string;
  message: Eip712Envelope;
};

export type PreparedHttpRequest = {
  method: string;
  path: string;
  resolvedPath: string;
  url: string;
  headers: Record<string, string>;
  missingPathParams: string[];
  body: unknown;
};

export type PreparedEip712Artifacts = {
  envelope: Eip712Envelope;
  typedData: TypedData;
  request: PreparedHttpRequest;
};

export type IndexedOperation = {
  env: string;
  requestBaseUrl: string;
  openapiUrl: string | null;
  method: string;
  path: string;
  operationId: string;
  summary: string | null;
  description: string | null;
  tags: string[];
  badgeNames: string[];
  parameters: ParameterSummary[];
  requestBody: RequestBodySummary | null;
  responses: ResponseSummary[];
  hasEip712: boolean;
  acceptedPrimaryTypes: string[];
  primaryType: string | null;
  payloadType: string | null;
  eip712Types: Record<string, Eip712Field[]> | null;
  authKind: AuthKind;
  authMode: AuthMode;
  authSource: string | null;
  publishedInEnvOpenapi: boolean;
  routeSource: 'openapi' | 'fallback-env-openapi' | 'contract';
  metadataSource: {
    summary: string | null;
    description: string | null;
    parameters: string | null;
    requestBody: string | null;
    responses: string | null;
    eip712: string | null;
  };
  fallbacksApplied: string[];
  warnings: string[];
};

export type EnvironmentIndex = {
  env: string;
  openapiUrl: string;
  requestBaseUrl: string;
  generatedAt: string;
  rawOperationCount: number;
  resolvedOperationCount: number;
  rawOperations: IndexedOperation[];
  resolvedOperations: IndexedOperation[];
  notes: string[];
};

export type ContractOperation = {
  operationId: string;
  method: string;
  path: string;
  summary: string | null;
  description: string | null;
  tags: string[];
  acceptedPrimaryTypes: string[];
  primaryType: string | null;
  payloadType: string | null;
  eip712Types: Record<string, Eip712Field[]> | null;
  contractPath: string[];
};

export type SourceAuthClassification = {
  operationId: string;
  authKind: Exclude<AuthKind, 'unknown'>;
  sourceFile: string;
};

export type ParsedArgs = {
  flags: Map<string, string | boolean>;
  positionals: string[];
};
