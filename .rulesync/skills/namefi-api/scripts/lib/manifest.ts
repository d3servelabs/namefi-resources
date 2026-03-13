import { manifestPath } from './constants';
import { readJsonFile } from './json';
import type { Manifest, ManifestEntry } from './types';
import { asBoolean, asString, asStringArray, isRecord } from './utils';

const OPENAPI_DOC_SUFFIX_REGEX = /\/openapi\/doc\.json$/;

function inferRequestBaseUrl(openapiUrl: string): string {
  return openapiUrl.replace(OPENAPI_DOC_SUFFIX_REGEX, '');
}

function normalizeManifestEntry(env: string, rawEntry: unknown): ManifestEntry {
  if (typeof rawEntry === 'string') {
    return {
      openapiUrl: rawEntry,
      requestBaseUrl: inferRequestBaseUrl(rawEntry),
      useContractFallback: true,
    };
  }

  if (!isRecord(rawEntry)) {
    throw new Error(`Manifest entry for ${env} must be a string or object.`);
  }

  const openapiUrl = asString(rawEntry.openapiUrl);
  if (!openapiUrl) {
    throw new Error(`Manifest entry for ${env} is missing openapiUrl.`);
  }

  return {
    label: asString(rawEntry.label) ?? undefined,
    openapiUrl,
    requestBaseUrl:
      asString(rawEntry.requestBaseUrl) ?? inferRequestBaseUrl(openapiUrl),
    fallbackEnv: asString(rawEntry.fallbackEnv),
    useContractFallback: asBoolean(rawEntry.useContractFallback) ?? true,
    notes: asStringArray(rawEntry.notes),
  };
}

export async function loadManifest(): Promise<Manifest> {
  const rawManifest = await readJsonFile<Record<string, unknown>>(manifestPath);
  const manifest: Manifest = {};

  for (const [env, rawEntry] of Object.entries(rawManifest)) {
    manifest[env] = normalizeManifestEntry(env, rawEntry);
  }

  return manifest;
}

export function resolveRequestedEnvironments(
  manifest: Manifest,
  requestedEnv: string | null,
): string[] {
  if (!requestedEnv) {
    return Object.keys(manifest);
  }

  if (!(requestedEnv in manifest)) {
    throw new Error(
      `Unknown environment ${requestedEnv}. Available environments: ${Object.keys(manifest).join(', ')}`,
    );
  }

  return [requestedEnv];
}
