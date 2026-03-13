#!/usr/bin/env bun
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { buildEip712Artifacts } from './lib/eip712-request';
import {
  findOperation,
  loadEnvironmentIndex,
  selectOperations,
} from './lib/index-data';
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

async function readJsonInput(
  inlineValue: string | null,
  filePath: string | null,
  label: string,
): Promise<Record<string, unknown>> {
  if (inlineValue) {
    return JSON.parse(inlineValue) as Record<string, unknown>;
  }

  if (filePath) {
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as Record<string, unknown>;
  }

  throw new Error(`Pass ${label} with --${label} or --${label}-file.`);
}

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

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const env = requireStringFlag(args, 'env');
  const operationId = requireStringFlag(args, 'operationId');
  const format = resolveFormat(getStringFlag(args, 'format'));
  const useRawOperations = getBooleanFlag(args, 'raw');
  const payload = await readJsonInput(
    getStringFlag(args, 'payload'),
    getStringFlag(args, 'payload-file'),
    'payload',
  );
  const pathParams =
    getStringFlag(args, 'path-params') ||
    getStringFlag(args, 'path-params-file')
      ? await readJsonInput(
          getStringFlag(args, 'path-params'),
          getStringFlag(args, 'path-params-file'),
          'path params',
        )
      : {};
  const timestampValue = getStringFlag(args, 'timestamp');
  const timestamp = timestampValue
    ? Number.parseInt(timestampValue, 10)
    : Math.floor(Date.now() / 1000);
  const nonce =
    getStringFlag(args, 'nonce') ?? `0x${randomBytes(32).toString('hex')}`;
  const index = await loadEnvironmentIndex(env);
  const operation = findOperation(selectOperations(index, useRawOperations), {
    operationId,
  });

  if (!operation) {
    throw new Error(`Operation ${operationId} was not found in ${env}.`);
  }

  const { envelope, typedData, request } = buildEip712Artifacts({
    operation,
    payload,
    pathParams,
    timestamp,
    nonce,
  });

  if (format === 'typed-data') {
    printJson(typedData);
    return;
  }

  if (format === 'envelope') {
    printJson(envelope);
    return;
  }

  if (format === 'request') {
    printJson(request);
    return;
  }

  printJson({
    env,
    operationId: operation.operationId,
    method: operation.method,
    path: operation.path,
    primaryType: operation.primaryType,
    payloadType: operation.payloadType,
    eip712Source: operation.metadataSource.eip712,
    publishedInEnvOpenapi: operation.publishedInEnvOpenapi,
    envelope,
    typedData,
    request,
  });
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
