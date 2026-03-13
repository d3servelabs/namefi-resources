#!/usr/bin/env bun
import { snapshotPath } from './lib/constants';
import { writeJsonFile } from './lib/json';
import { loadManifest, resolveRequestedEnvironments } from './lib/manifest';
import { countOpenApiOperations } from './lib/openapi';
import type { CachedOpenApiDocument } from './lib/types';
import {
  getStringFlag,
  isMainModule,
  parseArgs,
  printJson,
  writeError,
} from './lib/utils';

export async function syncOpenApi(
  requestedEnv: string | null = null,
): Promise<void> {
  const manifest = await loadManifest();
  const environments = resolveRequestedEnvironments(manifest, requestedEnv);

  const results = await Promise.all(
    environments.map(async (env) => {
      const config = manifest[env];
      const response = await fetch(config.openapiUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${config.openapiUrl}: ${response.status} ${response.statusText}`,
        );
      }

      const document = (await response.json()) as Record<string, unknown>;
      const cachedDocument: CachedOpenApiDocument = {
        env,
        openapiUrl: config.openapiUrl,
        requestBaseUrl: config.requestBaseUrl,
        fetchedAt: new Date().toISOString(),
        document,
      };

      await writeJsonFile(snapshotPath(env), cachedDocument);

      return {
        env,
        openapiUrl: config.openapiUrl,
        requestBaseUrl: config.requestBaseUrl,
        fetchedAt: cachedDocument.fetchedAt,
        operationCount: countOpenApiOperations(document),
      };
    }),
  );

  printJson({ synced: results });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  await syncOpenApi(getStringFlag(args, 'env'));
}

if (isMainModule(import.meta)) {
  main().catch((error) => {
    writeError(error);
    process.exit(1);
  });
}
