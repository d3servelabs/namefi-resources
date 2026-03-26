#!/usr/bin/env bun
import {
  findOperation,
  loadEnvironmentIndex,
  selectOperations,
} from './lib/index-data';
import { buildHttpRequest } from './lib/http-request';
import {
  getBooleanFlag,
  getStringFlag,
  isMainModule,
  parseArgs,
  printJson,
  requireStringFlag,
  writeError,
} from './lib/utils';

type TrialOffer = {
  normalizedDomainName: string;
  type: 'PARENT_DOMAIN' | 'EXACT_DOMAIN';
  trialDuration: number;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const env = requireStringFlag(args, 'env');
  const useRawOperations = getBooleanFlag(args, 'raw');
  const timeoutMs = Number.parseInt(
    getStringFlag(args, 'request-timeout-ms') ?? '30000',
    10,
  );
  const index = await loadEnvironmentIndex(env);
  const operation = findOperation(selectOperations(index, useRawOperations), {
    operationId: 'getDomainsAvailableForTrial',
  });

  if (!operation) {
    throw new Error(
      `Operation getDomainsAvailableForTrial was not found in ${env}. Refresh the cache first.`,
    );
  }

  const request = buildHttpRequest({ operation });
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(
      `Trial domains request failed with status ${response.status} ${response.statusText}`,
    );
  }

  const offers = (await response.json()) as TrialOffer[];
  printJson({
    env,
    operationId: operation.operationId,
    count: offers.length,
    offers,
  });
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
