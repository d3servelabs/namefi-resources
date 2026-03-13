#!/usr/bin/env bun
import {
  getStringFlag,
  isMainModule,
  parseArgs,
  writeError,
} from './lib/utils';
import { buildOperationIndexes } from './build-operation-index';
import { syncOpenApi } from './sync-openapi';

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const env = getStringFlag(args, 'env');

  await syncOpenApi(env);
  await buildOperationIndexes();
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
