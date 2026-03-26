#!/usr/bin/env bun
import { fetchEip712TypesForMethod } from './lib/live-auth';
import {
  getStringFlag,
  isMainModule,
  parseArgs,
  printJson,
  requireStringFlag,
  writeError,
} from './lib/utils';

function parseIntegerFlag(value: string | null, fallbackValue: number): number {
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
  const operationId =
    getStringFlag(args, 'operationId') ?? getStringFlag(args, 'method');

  if (!operationId) {
    throw new Error('Missing required flag --operationId or --method');
  }
  const timeoutMs = parseIntegerFlag(
    getStringFlag(args, 'request-timeout-ms'),
    30_000,
  );
  const result = await fetchEip712TypesForMethod({
    env,
    method: operationId,
    timeoutMs,
  });

  printJson({
    env,
    operationId,
    request: result.request,
    ...result.response,
  });
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
