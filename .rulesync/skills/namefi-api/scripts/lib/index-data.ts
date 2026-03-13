import { indexPath } from './constants';
import { fileExists, readJsonFile } from './json';
import { loadManifest } from './manifest';
import type { EnvironmentIndex, IndexedOperation } from './types';

export async function loadEnvironmentIndex(
  env: string,
): Promise<EnvironmentIndex> {
  const filePath = indexPath(env);

  if (!fileExists(filePath)) {
    throw new Error(
      `Missing cached index for ${env}. Run bun .opencode/skill/namefi-api/scripts/refresh.ts first.`,
    );
  }

  return readJsonFile<EnvironmentIndex>(filePath);
}

export async function loadAllEnvironmentIndexes(): Promise<EnvironmentIndex[]> {
  const manifest = await loadManifest();
  const indexes: EnvironmentIndex[] = [];

  for (const env of Object.keys(manifest)) {
    indexes.push(await loadEnvironmentIndex(env));
  }

  return indexes;
}

export function selectOperations(
  index: EnvironmentIndex,
  useRawOperations: boolean,
): IndexedOperation[] {
  return useRawOperations ? index.rawOperations : index.resolvedOperations;
}

export function findOperation(
  operations: IndexedOperation[],
  selector: {
    operationId?: string | null;
    method?: string | null;
    path?: string | null;
  },
): IndexedOperation | null {
  if (selector.operationId) {
    return (
      operations.find(
        (operation) => operation.operationId === selector.operationId,
      ) ?? null
    );
  }

  if (selector.method && selector.path) {
    const normalizedMethod = selector.method.toUpperCase();
    return (
      operations.find(
        (operation) =>
          operation.method === normalizedMethod &&
          operation.path === selector.path,
      ) ?? null
    );
  }

  return null;
}
