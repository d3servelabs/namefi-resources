import type { MlsListingSource } from '@namefi-astra/common/contract/mls-contract';
import { buildTweetUrl, normalizePublicHttpUrl } from './normalization';

export const X_FEED_SOURCE_ID = 'x';
export const NAMEFI_MARKETPLACE_FEED_SOURCE_ID = 'namefi_marketplace';

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
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');

  return label || 'External';
}
