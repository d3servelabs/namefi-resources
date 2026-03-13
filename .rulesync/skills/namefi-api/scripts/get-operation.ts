#!/usr/bin/env bun
import {
  findOperation,
  loadEnvironmentIndex,
  selectOperations,
} from './lib/index-data';
import {
  getBooleanFlag,
  isMainModule,
  getStringFlag,
  parseArgs,
  printJson,
  requireStringFlag,
  writeError,
} from './lib/utils';

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const env = requireStringFlag(args, 'env');
  const operationId = getStringFlag(args, 'operationId');
  const method = getStringFlag(args, 'method');
  const path = getStringFlag(args, 'path');
  const useRawOperations = getBooleanFlag(args, 'raw');
  const index = await loadEnvironmentIndex(env);
  const operation = findOperation(selectOperations(index, useRawOperations), {
    operationId,
    method,
    path,
  });

  if (!operation) {
    throw new Error(
      'Operation not found. Pass --operationId=<id> or --method=<METHOD> --path=<path>.',
    );
  }

  printJson(operation);
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
