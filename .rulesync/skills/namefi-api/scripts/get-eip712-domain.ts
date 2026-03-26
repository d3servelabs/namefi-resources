#!/usr/bin/env bun
import { fetchEip712Domain } from './lib/live-auth';
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
  const chain = parseIntegerFlag(getStringFlag(args, 'chain'), 1);
  const timeoutMs = parseIntegerFlag(
    getStringFlag(args, 'request-timeout-ms'),
    30_000,
  );
  const result = await fetchEip712Domain({ env, chain, timeoutMs });

  printJson({
    env,
    chain,
    request: result.request,
    domain: result.response,
  });
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
