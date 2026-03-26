#!/usr/bin/env bun
import { executeRequestCli } from './execute-eip712-request';
import { isMainModule, writeError } from './lib/utils';

if (isMainModule(import.meta)) {
  executeRequestCli().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
