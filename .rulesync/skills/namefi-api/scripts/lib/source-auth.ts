import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { backendRoutersRoot, repoRoot } from './constants';
import type { SourceAuthClassification } from './types';

const ROUTER_FILE_SUFFIX = '.orpc.ts';
const OPERATION_AUTH_REGEX =
  /(?:^|\n)\s*\w+\s*:\s*(?:withAudit\(\s*)?(baseProcedure|publicProcedure|authedOrPublicProcedure|protectedProcedure)\b[\s\S]*?operationId:\s*['"]([^'"]+)['"]/g;

async function collectRouterFiles(directoryPath: string): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return collectRouterFiles(entryPath);
      }

      if (entry.isFile() && entry.name.endsWith(ROUTER_FILE_SUFFIX)) {
        return [entryPath];
      }

      return [];
    }),
  );

  return files.flat();
}

function normalizeAuthKind(
  procedureToken: string,
): SourceAuthClassification['authKind'] {
  switch (procedureToken) {
    case 'baseProcedure':
    case 'publicProcedure':
      return 'public';
    case 'authedOrPublicProcedure':
      return 'authedOrPublic';
    case 'protectedProcedure':
      return 'protected';
    default:
      throw new Error(`Unsupported auth procedure token: ${procedureToken}`);
  }
}

function extractAuthClassifications(
  filePath: string,
  content: string,
): SourceAuthClassification[] {
  const classifications: SourceAuthClassification[] = [];

  for (const match of content.matchAll(OPERATION_AUTH_REGEX)) {
    const procedureToken = match[1];
    const operationId = match[2];

    if (!procedureToken || !operationId) {
      continue;
    }

    classifications.push({
      operationId,
      authKind: normalizeAuthKind(procedureToken),
      sourceFile: relative(repoRoot, filePath),
    });
  }

  return classifications;
}

export async function loadSourceAuthClassifications(): Promise<
  Map<string, SourceAuthClassification>
> {
  const routerFiles = await collectRouterFiles(backendRoutersRoot);
  const classifications = new Map<string, SourceAuthClassification>();

  for (const filePath of routerFiles) {
    const content = await readFile(filePath, 'utf8');

    for (const classification of extractAuthClassifications(
      filePath,
      content,
    )) {
      if (!classifications.has(classification.operationId)) {
        classifications.set(classification.operationId, classification);
      }
    }
  }

  return classifications;
}
