#!/usr/bin/env bun
import { readFile } from 'node:fs/promises';
import {
  findOperation,
  loadEnvironmentIndex,
  selectOperations,
} from './lib/index-data';
import { buildHttpRequest } from './lib/http-request';
import {
  prepareEip712Request,
  prepareSiweAuthentication,
} from './lib/prepare-auth';
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

async function readJsonInput(
  inlineValue: string | null,
  filePath: string | null,
  label: string,
): Promise<Record<string, unknown>> {
  if (inlineValue) {
    return JSON.parse(inlineValue) as Record<string, unknown>;
  }

  if (filePath) {
    return JSON.parse(await readFile(filePath, 'utf8')) as Record<
      string,
      unknown
    >;
  }

  return {};
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const env = requireStringFlag(args, 'env');
  const operationId = requireStringFlag(args, 'operationId');
  const useRawOperations = getBooleanFlag(args, 'raw');
  const preferAuth = getBooleanFlag(args, 'prefer-auth');
  const timeoutMs = parseIntegerFlag(
    getStringFlag(args, 'request-timeout-ms'),
    30_000,
  ) as number;
  const chain = parseIntegerFlag(getStringFlag(args, 'chain'), null);
  const timestamp = parseIntegerFlag(getStringFlag(args, 'timestamp'), null);
  const payload = await readJsonInput(
    getStringFlag(args, 'payload'),
    getStringFlag(args, 'payload-file'),
    'payload',
  );
  const pathParams = await readJsonInput(
    getStringFlag(args, 'path-params'),
    getStringFlag(args, 'path-params-file'),
    'path params',
  );
  const index = await loadEnvironmentIndex(env);
  const operation = findOperation(selectOperations(index, useRawOperations), {
    operationId,
  });

  if (!operation) {
    throw new Error(`Operation ${operationId} was not found in ${env}.`);
  }

  if (operation.hasEip712) {
    printJson(
      await prepareEip712Request({
        env,
        operation,
        payload,
        pathParams,
        timeoutMs,
        chain,
        signerAddress: getStringFlag(args, 'signer-address'),
        primaryType: getStringFlag(args, 'primary-type'),
        timestamp,
        nonce: getStringFlag(args, 'nonce'),
      }),
    );
    return;
  }

  const shouldPrepareSiwe =
    operation.authMode === 'siwe-required' ||
    (operation.authMode === 'siwe-optional' && preferAuth);

  if (shouldPrepareSiwe) {
    const signerAddress = requireStringFlag(args, 'signer-address');
    printJson(
      await prepareSiweAuthentication({
        env,
        operation,
        payload,
        pathParams,
        timeoutMs,
        signerAddress,
        chain,
      }),
    );
    return;
  }

  printJson({
    env,
    operationId: operation.operationId,
    method: operation.method,
    path: operation.path,
    authKind: operation.authKind,
    authMode: operation.authMode,
    preparationMode: 'none',
    request: {
      ...buildHttpRequest({
        operation,
        payload,
        pathParams,
      }),
    },
    guidance:
      operation.authMode === 'siwe-optional'
        ? 'This operation can run anonymously. Re-run with --prefer-auth --signer-address=<0x...> to prepare a SIWE-authenticated variant.'
        : 'No authentication preparation is required for this operation.',
  });
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
