#!/usr/bin/env bun
import { readFile } from 'node:fs/promises';
import {
  findOperation,
  loadEnvironmentIndex,
  selectOperations,
} from './lib/index-data';
import { prepareEip712Request } from './lib/prepare-auth';
import {
  getBooleanFlag,
  getStringFlag,
  isMainModule,
  parseArgs,
  printJson,
  requireStringFlag,
  writeError,
} from './lib/utils';

type OutputFormat = 'all' | 'typed-data' | 'envelope' | 'request';

function resolveFormat(rawFormat: string | null): OutputFormat {
  if (!rawFormat) {
    return 'all';
  }

  if (
    rawFormat === 'all' ||
    rawFormat === 'typed-data' ||
    rawFormat === 'envelope' ||
    rawFormat === 'request'
  ) {
    return rawFormat;
  }

  throw new Error(
    'Unsupported --format. Use all, typed-data, envelope, or request.',
  );
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

  throw new Error(`Pass ${label} with --${label} or --${label}-file.`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const env = requireStringFlag(args, 'env');
  const operationId = requireStringFlag(args, 'operationId');
  const useRawOperations = getBooleanFlag(args, 'raw');
  const format = resolveFormat(getStringFlag(args, 'format'));
  const timeoutMs = Number.parseInt(
    getStringFlag(args, 'request-timeout-ms') ?? '30000',
    10,
  );
  const index = await loadEnvironmentIndex(env);
  const operation = findOperation(selectOperations(index, useRawOperations), {
    operationId,
  });

  if (!operation) {
    throw new Error(`Operation ${operationId} was not found in ${env}.`);
  }

  const prepared = (await prepareEip712Request({
    env,
    operation,
    payload: await readJsonInput(
      getStringFlag(args, 'payload'),
      getStringFlag(args, 'payload-file'),
      'payload',
    ),
    pathParams:
      getStringFlag(args, 'path-params') ||
      getStringFlag(args, 'path-params-file')
        ? await readJsonInput(
            getStringFlag(args, 'path-params'),
            getStringFlag(args, 'path-params-file'),
            'path params',
          )
        : {},
    timeoutMs,
    chain: getStringFlag(args, 'chain')
      ? Number.parseInt(requireStringFlag(args, 'chain'), 10)
      : null,
    signerAddress: getStringFlag(args, 'signer-address'),
    primaryType: getStringFlag(args, 'primary-type'),
    timestamp: getStringFlag(args, 'timestamp')
      ? Number.parseInt(requireStringFlag(args, 'timestamp'), 10)
      : null,
    nonce: getStringFlag(args, 'nonce'),
  })) as {
    typedData: unknown;
    envelope: unknown;
    request: unknown;
  };

  if (format === 'typed-data') {
    printJson(prepared.typedData);
    return;
  }

  if (format === 'envelope') {
    printJson(prepared.envelope);
    return;
  }

  if (format === 'request') {
    printJson(prepared.request);
    return;
  }

  printJson(prepared);
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
