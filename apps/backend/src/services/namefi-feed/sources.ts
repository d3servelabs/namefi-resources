import type { MlsListingSource } from '@namefi-astra/common/contract/mls-contract';
import { buildTweetUrl, normalizePublicHttpUrl } from './normalization';

export const X_FEED_SOURCE_ID = 'x';
export const NAMEFI_MARKETPLACE_FEED_SOURCE_ID = 'namefi_marketplace';
export const NAMEPROS_FEED_SOURCE_ID = 'namepros';
export const DNFORUM_FEED_SOURCE_ID = 'dnforum';

export const NAMEFI_FEED_AUTO_SCAN_SOURCES = [
  {
    id: X_FEED_SOURCE_ID,
    label: 'X',
    kind: 'social',
  },
  {
    id: NAMEPROS_FEED_SOURCE_ID,
    label: 'NamePros',
    kind: 'external',
  },
  {
    id: DNFORUM_FEED_SOURCE_ID,
    label: 'DNForum',
    kind: 'external',
  },
] as const;

export type NamefiFeedAutoScanSource =
  (typeof NAMEFI_FEED_AUTO_SCAN_SOURCES)[number]['id'];

export const DEFAULT_NAMEFI_FEED_ENABLED_SOURCES =
  NAMEFI_FEED_AUTO_SCAN_SOURCES.map((source) => source.id);

const SOURCE_ID_SPLIT_PATTERN = /[_\s-]+/;
const AUTO_SCAN_SOURCE_IDS = new Set<string>(
  NAMEFI_FEED_AUTO_SCAN_SOURCES.map((source) => source.id),
);

export function isNamefiFeedAutoScanSource(
  value: string,
): value is NamefiFeedAutoScanSource {
  return AUTO_SCAN_SOURCE_IDS.has(value);
}

export function normalizeNamefiFeedEnabledSources(
  sources: readonly unknown[],
): NamefiFeedAutoScanSource[] {
  const seen = new Set<NamefiFeedAutoScanSource>();

  for (const source of sources) {
    if (typeof source !== 'string' || !isNamefiFeedAutoScanSource(source)) {
      continue;
    }
    seen.add(source);
  }

  return Array.from(seen);
}

export function readNamefiFeedEnabledSourcesFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): NamefiFeedAutoScanSource[] {
  const enabledSources = metadata?.enabledSources;

  if (!Array.isArray(enabledSources)) {
    return [...DEFAULT_NAMEFI_FEED_ENABLED_SOURCES];
  }

  return normalizeNamefiFeedEnabledSources(enabledSources);
}

export function buildNamefiFeedAdminSources(
  enabledSources: readonly NamefiFeedAutoScanSource[],
) {
  const enabledSourceSet = new Set(enabledSources);

  return NAMEFI_FEED_AUTO_SCAN_SOURCES.map((source) => ({
    ...source,
    enabled: enabledSourceSet.has(source.id),
  }));
}

export function resolveNamefiFeedSource(input: {
  externalSource: string;
  sourceUrl: string | null | undefined;
  externalPostId: string | null | undefined;
}): MlsListingSource {
  const sourceId = normalizeSourceId(input.externalSource);
  const normalizedSourceUrl = normalizePublicHttpUrl(input.sourceUrl);

  if (sourceId === X_FEED_SOURCE_ID) {
    const externalPostId = input.externalPostId?.trim();
    return {
      id: X_FEED_SOURCE_ID,
      label: 'X',
      kind: 'social',
      url:
        normalizedSourceUrl ??
        (externalPostId ? buildTweetUrl(externalPostId) : 'https://x.com'),
    };
  }

  if (sourceId === NAMEFI_MARKETPLACE_FEED_SOURCE_ID) {
    return {
      id: NAMEFI_MARKETPLACE_FEED_SOURCE_ID,
      label: 'Namefi',
      kind: 'internal_marketplace',
      url: normalizedSourceUrl ?? 'https://namefi.io/feed',
    };
  }

  if (sourceId === NAMEPROS_FEED_SOURCE_ID) {
    return {
      id: NAMEPROS_FEED_SOURCE_ID,
      label: 'NamePros',
      kind: 'external',
      url:
        normalizedSourceUrl ??
        'https://www.namepros.com/marketplace/buy-domains/',
    };
  }

  if (sourceId === DNFORUM_FEED_SOURCE_ID) {
    return {
      id: DNFORUM_FEED_SOURCE_ID,
      label: 'DNForum',
      kind: 'external',
      url: normalizedSourceUrl ?? 'https://www.dnforum.com/forums/',
    };
  }

  return {
    id: sourceId,
    label: humanizeSourceId(sourceId),
    kind: 'external',
    url: normalizedSourceUrl ?? 'https://namefi.io/feed',
  };
}

function normalizeSourceId(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized || X_FEED_SOURCE_ID;
}

function humanizeSourceId(value: string) {
  const label = value
    .split(SOURCE_ID_SPLIT_PATTERN)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');

  return label || 'External';
}
