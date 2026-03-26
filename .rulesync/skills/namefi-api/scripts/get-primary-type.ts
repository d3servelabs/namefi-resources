#!/usr/bin/env bun
import { readFile } from 'node:fs/promises';
import {
  findOperation,
  loadEnvironmentIndex,
  selectOperations,
} from './lib/index-data';
import { fetchEip712TypesForMethod } from './lib/live-auth';
import { selectPrimaryType } from './lib/prepare-auth';
import {
  getBooleanFlag,
  getStringFlag,
  isMainModule,
  parseArgs,
  printJson,
  requireStringFlag,
  writeError,
} from './lib/utils';

async function readJsonInput(
  inlineValue: string | null,
  filePath: string | null,
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
  const jsonOutput = getBooleanFlag(args, 'json');
  const timeoutMs = Number.parseInt(
    getStringFlag(args, 'request-timeout-ms') ?? '30000',
    10,
  );
  const payload = await readJsonInput(
    getStringFlag(args, 'payload'),
    getStringFlag(args, 'payload-file'),
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

  const primaryType = selectPrimaryType({
    acceptedPrimaryTypes: liveTypes.response.acceptedPrimaryTypes,
    types: liveTypes.response.types,
    payload,
    requestedPrimaryType: getStringFlag(args, 'primary-type'),
  });
  const payloadType = primaryType.replace(/Envelope$/, '');

  if (jsonOutput) {
    printJson({
      env,
      operationId: operation.operationId,
      primaryType,
      payloadType,
      acceptedPrimaryTypes: liveTypes.response.acceptedPrimaryTypes,
      request: liveTypes.request,
      source: 'live-helper-endpoint',
    });
    return;
  }

  process.stdout.write(`${primaryType}\n`);
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
