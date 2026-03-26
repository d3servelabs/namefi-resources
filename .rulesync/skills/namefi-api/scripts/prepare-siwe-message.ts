#!/usr/bin/env bun
import { buildHttpRequest } from './lib/http-request';
import {
  findOperation,
  loadEnvironmentIndex,
  selectOperations,
} from './lib/index-data';
import { prepareSiweAuthentication } from './lib/prepare-auth';
import type { IndexedOperation } from './lib/types';
import {
  getBooleanFlag,
  getStringFlag,
  isMainModule,
  parseArgs,
  printJson,
  requireStringFlag,
  writeError,
} from './lib/utils';

function parseIntegerFlag(
  value: string | null,
  fallbackValue: number | null,
): number | null {
  if (!value) {
    return fallbackValue;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid integer value: ${value}`);
  }

  return parsed;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const env = requireStringFlag(args, 'env');
  const signerAddress = requireStringFlag(args, 'signer-address');
  const useRawOperations = getBooleanFlag(args, 'raw');
  const timeoutMs = parseIntegerFlag(
    getStringFlag(args, 'request-timeout-ms'),
    30_000,
  ) as number;
  const chain = parseIntegerFlag(getStringFlag(args, 'chain'), null);
  const operationId = getStringFlag(args, 'operationId');
  const index = await loadEnvironmentIndex(env);
  const operations = selectOperations(index, useRawOperations);
  const operation = operationId
    ? findOperation(operations, { operationId })
    : null;

  if (operation) {
    const resolvedOperation: IndexedOperation = operation;
    printJson(
      await prepareSiweAuthentication({
        env,
        operation: resolvedOperation,
        payload: {},
        pathParams: {},
        timeoutMs,
        signerAddress,
        chain,
      }),
    );
    return;
  }

  const placeholderOperation = findOperation(operations, {
    operationId: 'getUserDomains',
  });

  if (!placeholderOperation) {
    throw new Error(
      `Operation getUserDomains was not found in ${env}. Refresh the cache first.`,
    );
  }

  const fallbackOperation: IndexedOperation = placeholderOperation;

  const prepared = await prepareSiweAuthentication({
    env,
    operation: fallbackOperation,
    payload: {},
    pathParams: {},
    timeoutMs,
    signerAddress,
    chain,
  });

  printJson({
    ...prepared,
    request: buildHttpRequest({
      operation: fallbackOperation,
      payload: {},
      pathParams: {},
      headers: { 'x-namefi-siwe-token': '<fill after verify>' },
    }),
  });
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
