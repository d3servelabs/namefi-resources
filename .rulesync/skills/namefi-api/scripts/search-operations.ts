#!/usr/bin/env bun
import {
  loadAllEnvironmentIndexes,
  loadEnvironmentIndex,
  selectOperations,
} from './lib/index-data';
import {
  getBooleanFlag,
  getStringFlag,
  isMainModule,
  parseArgs,
  printJson,
  writeError,
} from './lib/utils';

function scoreOperation(
  operation: {
    operationId: string;
    method: string;
    path: string;
    summary: string | null;
    description: string | null;
    tags: string[];
    badgeNames: string[];
  },
  query: string,
): number {
  const normalizedQuery = query.toLowerCase();
  let score = 0;

  if (operation.operationId.toLowerCase() === normalizedQuery) {
    score += 200;
  } else if (operation.operationId.toLowerCase().includes(normalizedQuery)) {
    score += 100;
  }

  const route = `${operation.method} ${operation.path}`.toLowerCase();
  if (route.includes(normalizedQuery)) {
    score += 80;
  }

  if (operation.summary?.toLowerCase().includes(normalizedQuery)) {
    score += 60;
  }

  if (operation.description?.toLowerCase().includes(normalizedQuery)) {
    score += 30;
  }

  if (
    operation.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
  ) {
    score += 25;
  }

  if (
    operation.badgeNames.some((badge) =>
      badge.toLowerCase().includes(normalizedQuery),
    )
  ) {
    score += 15;
  }

  return score;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const query =
    getStringFlag(args, 'query') ?? args.positionals.join(' ').trim();

  if (!query) {
    throw new Error(
      'Pass a search string with --query or as a positional argument.',
    );
  }

  const env = getStringFlag(args, 'env');
  const useRawOperations = getBooleanFlag(args, 'raw');
  const limitValue = getStringFlag(args, 'limit');
  const limit = limitValue ? Number.parseInt(limitValue, 10) : 10;
  const indexes = env
    ? [await loadEnvironmentIndex(env)]
    : await loadAllEnvironmentIndexes();
  const matches = indexes
    .flatMap((index) =>
      selectOperations(index, useRawOperations).map((operation) => ({
        env: index.env,
        operation,
        score: scoreOperation(operation, query),
      })),
    )
    .filter((match) => match.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.env.localeCompare(right.env) ||
        left.operation.operationId.localeCompare(right.operation.operationId),
    )
    .slice(0, Number.isNaN(limit) ? 10 : limit)
    .map(({ env: matchEnv, operation, score }) => ({
      env: matchEnv,
      score,
      operationId: operation.operationId,
      method: operation.method,
      path: operation.path,
      summary: operation.summary,
      tags: operation.tags,
      primaryType: operation.primaryType,
      publishedInEnvOpenapi: operation.publishedInEnvOpenapi,
      routeSource: operation.routeSource,
    }));

  printJson({ query, count: matches.length, results: matches });
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
