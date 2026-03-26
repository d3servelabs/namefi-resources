#!/usr/bin/env bun
import { fetchAllEip712Types } from './lib/live-auth';
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
  const timeoutMs = parseIntegerFlag(
    getStringFlag(args, 'request-timeout-ms'),
    30_000,
  );
  const result = await fetchAllEip712Types({ env, timeoutMs });

  printJson({
    env,
    request: result.request,
    count: Object.keys(result.response).length,
    types: result.response,
  });
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
