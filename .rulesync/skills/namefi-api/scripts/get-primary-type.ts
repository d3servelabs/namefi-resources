#!/usr/bin/env bun
import {
  findOperation,
  loadEnvironmentIndex,
  selectOperations,
} from './lib/index-data';
import {
  getBooleanFlag,
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
  const jsonOutput = getBooleanFlag(args, 'json');
  const index = await loadEnvironmentIndex(env);
  const operation = findOperation(selectOperations(index, useRawOperations), {
    operationId,
  });

  if (!operation) {
    throw new Error(`Operation ${operationId} was not found in ${env}.`);
  }

  if (!operation.primaryType) {
    throw new Error(
      `Operation ${operationId} does not have a resolved primary type.`,
    );
  }

  if (jsonOutput) {
    printJson({
      env,
      operationId: operation.operationId,
      primaryType: operation.primaryType,
      payloadType: operation.payloadType,
      source: operation.metadataSource.eip712,
    });
    return;
  }

  process.stdout.write(`${operation.primaryType}\n`);
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
