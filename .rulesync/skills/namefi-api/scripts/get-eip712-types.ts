#!/usr/bin/env bun
import {
  findOperation,
  loadEnvironmentIndex,
  selectOperations,
} from './lib/index-data';
import { fetchEip712TypesForMethod } from './lib/live-auth';
import {
  getBooleanFlag,
  getStringFlag,
  isMainModule,
  parseArgs,
  printJson,
  requireStringFlag,
  writeError,
} from './lib/utils';

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const env = requireStringFlag(args, 'env');
  const operationId = requireStringFlag(args, 'operationId');
  const useRawOperations = getBooleanFlag(args, 'raw');
  const timeoutMs = Number.parseInt(
    getStringFlag(args, 'request-timeout-ms') ?? '30000',
    10,
  );
  const index = await loadEnvironmentIndex(env);
  const operation = findOperation(selectOperations(index, useRawOperations), {
    operationId,
  });

  if (!operation) {
    throw new Error(`Operation ${operationId} was not found in ${env}.`);
  }

  const liveTypes = await fetchEip712TypesForMethod({
    env,
    method: operation.operationId,
    timeoutMs,
  });

  if (!liveTypes.response.found) {
    throw new Error(
      `Operation ${operationId} does not have live EIP-712 types.`,
    );
  }

  printJson({
    env,
    operationId: operation.operationId,
    method: operation.method,
    path: operation.path,
    authMode: operation.authMode,
    acceptedPrimaryTypes: liveTypes.response.acceptedPrimaryTypes,
    primaryType: liveTypes.response.acceptedPrimaryTypes[0] ?? null,
    payloadType:
      liveTypes.response.acceptedPrimaryTypes[0]?.replace(/Envelope$/, '') ??
      null,
    request: liveTypes.request,
    source: 'live-helper-endpoint',
    types: liveTypes.response.types,
  });
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
