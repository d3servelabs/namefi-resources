#!/usr/bin/env bun
import { indexPath } from './lib/constants';
import { writeJsonFile } from './lib/json';
import { loadManifest } from './lib/manifest';
import { loadContractOperations } from './lib/contract';
import {
  loadCachedOpenApiDocument,
  normalizeOpenApiOperations,
} from './lib/openapi';
import type {
  ContractOperation,
  EnvironmentIndex,
  IndexedOperation,
  Manifest,
} from './lib/types';
import {
  deepClone,
  isMainModule,
  payloadTypeFromPrimaryType,
  printJson,
  sameRoute,
  uniqueStrings,
  writeError,
} from './lib/utils';

function mapByOperationId<T extends { operationId: string }>(
  values: T[],
): Map<string, T> {
  return new Map(values.map((value) => [value.operationId, value]));
}

function fillFromFallback(
  target: IndexedOperation,
  field: keyof Pick<IndexedOperation, 'summary' | 'description'>,
  sourceLabel: string,
  value: string | null,
): void {
  if (!target[field] && value) {
    target[field] = value;
    target.metadataSource[field] = sourceLabel;
    target.fallbacksApplied.push(`filled-${field}-from-${sourceLabel}`);
  }
}

function applyOperationFallback(
  target: IndexedOperation,
  sourceLabel: string,
  sourceOperation: IndexedOperation,
): void {
  if (target.parameters.length === 0 && sourceOperation.parameters.length > 0) {
    target.parameters = deepClone(sourceOperation.parameters);
    target.metadataSource.parameters = sourceLabel;
    target.fallbacksApplied.push(`filled-parameters-from-${sourceLabel}`);
  }

  if (!target.requestBody && sourceOperation.requestBody) {
    target.requestBody = deepClone(sourceOperation.requestBody);
    target.metadataSource.requestBody = sourceLabel;
    target.fallbacksApplied.push(`filled-request-body-from-${sourceLabel}`);
  }

  if (target.responses.length === 0 && sourceOperation.responses.length > 0) {
    target.responses = deepClone(sourceOperation.responses);
    target.metadataSource.responses = sourceLabel;
    target.fallbacksApplied.push(`filled-responses-from-${sourceLabel}`);
  }

  if (
    target.acceptedPrimaryTypes.length === 0 &&
    sourceOperation.acceptedPrimaryTypes.length > 0
  ) {
    target.acceptedPrimaryTypes = [...sourceOperation.acceptedPrimaryTypes];
    target.fallbacksApplied.push(
      `filled-accepted-primary-types-from-${sourceLabel}`,
    );
  }

  if (!target.eip712Types && sourceOperation.eip712Types) {
    target.eip712Types = deepClone(sourceOperation.eip712Types);
    target.fallbacksApplied.push(`filled-eip712-types-from-${sourceLabel}`);
  }

  if (!target.metadataSource.eip712 && sourceOperation.eip712Types) {
    target.metadataSource.eip712 = sourceLabel;
  }

  target.hasEip712 =
    target.hasEip712 ||
    target.acceptedPrimaryTypes.length > 0 ||
    target.eip712Types !== null;
  target.primaryType = target.acceptedPrimaryTypes[0] ?? null;
  target.payloadType = payloadTypeFromPrimaryType(target.primaryType);
}

function applyContractFallback(
  target: IndexedOperation,
  sourceLabel: string,
  sourceOperation: ContractOperation,
): void {
  if (
    target.acceptedPrimaryTypes.length === 0 &&
    sourceOperation.acceptedPrimaryTypes.length > 0
  ) {
    target.acceptedPrimaryTypes = [...sourceOperation.acceptedPrimaryTypes];
    target.fallbacksApplied.push(
      `filled-accepted-primary-types-from-${sourceLabel}`,
    );
  }

  if (!target.eip712Types && sourceOperation.eip712Types) {
    target.eip712Types = deepClone(sourceOperation.eip712Types);
    target.fallbacksApplied.push(`filled-eip712-types-from-${sourceLabel}`);
  }

  if (!target.metadataSource.eip712 && sourceOperation.eip712Types) {
    target.metadataSource.eip712 = sourceLabel;
  }

  if (!target.summary && sourceOperation.summary) {
    target.summary = sourceOperation.summary;
    target.metadataSource.summary = sourceLabel;
    target.fallbacksApplied.push(`filled-summary-from-${sourceLabel}`);
  }

  if (!target.description && sourceOperation.description) {
    target.description = sourceOperation.description;
    target.metadataSource.description = sourceLabel;
    target.fallbacksApplied.push(`filled-description-from-${sourceLabel}`);
  }

  target.hasEip712 =
    target.hasEip712 ||
    target.acceptedPrimaryTypes.length > 0 ||
    target.eip712Types !== null;
  target.primaryType = target.acceptedPrimaryTypes[0] ?? null;
  target.payloadType = payloadTypeFromPrimaryType(target.primaryType);
}

function rewriteFallbackMetadataSources(
  target: IndexedOperation,
  sourceLabel: string,
): void {
  target.metadataSource = {
    summary: target.summary ? sourceLabel : null,
    description: target.description ? sourceLabel : null,
    parameters: target.parameters.length > 0 ? sourceLabel : null,
    requestBody: target.requestBody ? sourceLabel : null,
    responses: target.responses.length > 0 ? sourceLabel : null,
    eip712:
      target.acceptedPrimaryTypes.length > 0 || target.eip712Types !== null
        ? sourceLabel
        : null,
  };
}

function resolveOperation(
  env: string,
  rawOperation: IndexedOperation,
  fallbackOperation: IndexedOperation | null,
  contractOperation: ContractOperation | null,
): IndexedOperation {
  const resolved = deepClone(rawOperation);
  const fallbackLabel = fallbackOperation
    ? `${fallbackOperation.env}-openapi`
    : null;

  if (fallbackOperation && sameRoute(rawOperation, fallbackOperation)) {
    fillFromFallback(
      resolved,
      'summary',
      fallbackLabel as string,
      fallbackOperation.summary,
    );
    fillFromFallback(
      resolved,
      'description',
      fallbackLabel as string,
      fallbackOperation.description,
    );
    applyOperationFallback(
      resolved,
      fallbackLabel as string,
      fallbackOperation,
    );
  }

  if (contractOperation && sameRoute(rawOperation, contractOperation)) {
    applyContractFallback(resolved, 'contract', contractOperation);
  }

  if (
    (!resolved.eip712Types || resolved.acceptedPrimaryTypes.length === 0) &&
    fallbackOperation &&
    !sameRoute(rawOperation, fallbackOperation)
  ) {
    resolved.warnings.push(
      `Skipped ${fallbackOperation.env} fallback for ${rawOperation.operationId} because ${env} publishes a different route.`,
    );
  }

  if (
    (!resolved.eip712Types || resolved.acceptedPrimaryTypes.length === 0) &&
    contractOperation &&
    !sameRoute(rawOperation, contractOperation)
  ) {
    resolved.warnings.push(
      `Skipped contract fallback for ${rawOperation.operationId} because ${env} publishes a different route.`,
    );
  }

  resolved.tags = uniqueStrings(resolved.tags);
  resolved.badgeNames = uniqueStrings(resolved.badgeNames);
  resolved.hasEip712 =
    resolved.hasEip712 ||
    resolved.acceptedPrimaryTypes.length > 0 ||
    resolved.eip712Types !== null;
  resolved.primaryType = resolved.acceptedPrimaryTypes[0] ?? null;
  resolved.payloadType = payloadTypeFromPrimaryType(resolved.primaryType);

  return resolved;
}

function sortOperations(values: IndexedOperation[]): IndexedOperation[] {
  return values.sort(
    (left, right) =>
      left.operationId.localeCompare(right.operationId) ||
      left.method.localeCompare(right.method) ||
      left.path.localeCompare(right.path),
  );
}

function buildResolvedOperations(args: {
  env: string;
  manifest: Manifest;
  rawOperations: IndexedOperation[];
  rawOperationsByEnv: Map<string, IndexedOperation[]>;
  contractOperationsById: Map<string, ContractOperation>;
}): IndexedOperation[] {
  const config = args.manifest[args.env];
  const fallbackOperations = config.fallbackEnv
    ? (args.rawOperationsByEnv.get(config.fallbackEnv) ?? [])
    : [];

  const fallbackOperationsById = mapByOperationId(fallbackOperations);
  const rawOperationsById = mapByOperationId(args.rawOperations);
  const resolvedOperations = args.rawOperations.map((rawOperation) =>
    resolveOperation(
      args.env,
      rawOperation,
      fallbackOperationsById.get(rawOperation.operationId) ?? null,
      config.useContractFallback !== false
        ? (args.contractOperationsById.get(rawOperation.operationId) ?? null)
        : null,
    ),
  );

  if (config.fallbackEnv) {
    for (const fallbackOperation of fallbackOperations) {
      if (rawOperationsById.has(fallbackOperation.operationId)) {
        continue;
      }

      const clonedOperation = deepClone(fallbackOperation);
      clonedOperation.env = args.env;
      clonedOperation.requestBaseUrl = config.requestBaseUrl;
      clonedOperation.openapiUrl = config.openapiUrl;
      clonedOperation.publishedInEnvOpenapi = false;
      clonedOperation.routeSource = 'fallback-env-openapi';
      rewriteFallbackMetadataSources(
        clonedOperation,
        `${config.fallbackEnv}-openapi`,
      );
      clonedOperation.fallbacksApplied = uniqueStrings([
        ...clonedOperation.fallbacksApplied,
        `added-from-${config.fallbackEnv}-openapi`,
      ]);
      clonedOperation.warnings = uniqueStrings([
        ...clonedOperation.warnings,
        `Not published in ${args.env} OpenAPI. Added from ${config.fallbackEnv} fallback metadata.`,
      ]);
      resolvedOperations.push(clonedOperation);
    }
  }

  return sortOperations(resolvedOperations);
}

function buildNotes(
  rawOperations: IndexedOperation[],
  resolvedOperations: IndexedOperation[],
): string[] {
  const notes = [
    'Ignore the published OpenAPI servers array. Use requestBaseUrl from openapi.docs.json instead.',
  ];

  const fallbackOnlyOperations = resolvedOperations
    .filter((operation) => !operation.publishedInEnvOpenapi)
    .map((operation) => operation.operationId);
  if (fallbackOnlyOperations.length > 0) {
    notes.push(
      `Added fallback-only operations: ${fallbackOnlyOperations.join(', ')}`,
    );
  }

  const backfilledEip712Operations = rawOperations
    .filter(
      (operation) =>
        operation.metadataSource.eip712 &&
        operation.metadataSource.eip712 !== 'openapi',
    )
    .map((operation) => operation.operationId);
  if (backfilledEip712Operations.length > 0) {
    notes.push(
      `Backfilled EIP-712 metadata for: ${backfilledEip712Operations.join(', ')}`,
    );
  }

  const warningOperations = rawOperations
    .filter((operation) => operation.warnings.length > 0)
    .map((operation) => operation.operationId);
  if (warningOperations.length > 0) {
    notes.push(`Skipped unsafe fallbacks for: ${warningOperations.join(', ')}`);
  }

  return notes;
}

function summarizeIndex(index: EnvironmentIndex): Record<string, unknown> {
  return {
    env: index.env,
    openapiUrl: index.openapiUrl,
    requestBaseUrl: index.requestBaseUrl,
    rawOperationCount: index.rawOperationCount,
    resolvedOperationCount: index.resolvedOperationCount,
    notes: index.notes,
  };
}

export async function buildOperationIndexes(): Promise<void> {
  const manifest = await loadManifest();
  const contractOperations = await loadContractOperations();
  const contractOperationsById = mapByOperationId(contractOperations);
  const rawOperationsByEnv = new Map<string, IndexedOperation[]>();

  for (const [env, config] of Object.entries(manifest)) {
    const cachedDocument = await loadCachedOpenApiDocument(env);
    rawOperationsByEnv.set(
      env,
      normalizeOpenApiOperations({ env, config, cached: cachedDocument }),
    );
  }

  const summaries: Record<string, unknown>[] = [];

  for (const [env, config] of Object.entries(manifest)) {
    const rawOperations = rawOperationsByEnv.get(env) ?? [];
    const resolvedOperations = buildResolvedOperations({
      env,
      manifest,
      rawOperations,
      rawOperationsByEnv,
      contractOperationsById,
    });
    const index: EnvironmentIndex = {
      env,
      openapiUrl: config.openapiUrl,
      requestBaseUrl: config.requestBaseUrl,
      generatedAt: new Date().toISOString(),
      rawOperationCount: rawOperations.length,
      resolvedOperationCount: resolvedOperations.length,
      rawOperations,
      resolvedOperations,
      notes: uniqueStrings([
        ...(config.notes ?? []),
        ...buildNotes(rawOperations, resolvedOperations),
      ]),
    };

    await writeJsonFile(indexPath(env), index);
    summaries.push(summarizeIndex(index));
  }

  printJson({ indexes: summaries });
}

async function main(): Promise<void> {
  await buildOperationIndexes();
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
