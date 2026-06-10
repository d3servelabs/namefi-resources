import type { MlsFeedSourceFilter } from '@namefi-astra/common/contract/mls-contract';

const LEADING_AT_SYMBOL = /^@/;
const HANDLE_PATTERN = /^[a-z0-9_.-]+$/i;
const HANDLE_EDGE_SEPARATOR_PATTERN = /^[.-]|[.-]$/;
const HANDLE_CONSECUTIVE_SEPARATOR_PATTERN = /[.-]{2}/;
const SOURCE_PATTERN = /^[a-z0-9_]+$/i;
const MLS_FEED_SOURCE_ID_BY_VALUE = {
  x: true,
  namepros: true,
  dnforum: true,
  namefi_marketplace: true,
} satisfies Record<MlsFeedSourceFilter, true>;
const MLS_FEED_SOURCE_LABEL_BY_ID = {
  x: 'X',
  namepros: 'NamePros',
  dnforum: 'DNForum',
  namefi_marketplace: 'Namefi',
} satisfies Record<MlsFeedSourceFilter, string>;
const MLS_FEED_SOURCE_ID_SET = new Set<string>(
  Object.keys(MLS_FEED_SOURCE_ID_BY_VALUE),
);

export type MlsFeedSourceId = MlsFeedSourceFilter;

export function normalizeMlsHandle(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return null;
  }

  return normalized.startsWith('@') ? normalized : `@${normalized}`;
}

export function normalizeMlsHandleSlug(value: string): string | null {
  const normalized = value.trim().replace(LEADING_AT_SYMBOL, '');
  if (!isValidMlsHandleSlug(normalized)) {
    return null;
  }

  return normalized.toLowerCase();
}

function isValidMlsHandleSlug(value: string): boolean {
  return (
    Boolean(value) &&
    HANDLE_PATTERN.test(value) &&
    !HANDLE_EDGE_SEPARATOR_PATTERN.test(value) &&
    !HANDLE_CONSECUTIVE_SEPARATOR_PATTERN.test(value)
  );
}

export function normalizeMlsFeedSource(value: string): MlsFeedSourceId | null {
  const normalized = value.trim().toLowerCase();
  if (
    !normalized ||
    !SOURCE_PATTERN.test(normalized) ||
    !MLS_FEED_SOURCE_ID_SET.has(normalized)
  ) {
    return null;
  }

  return normalized as MlsFeedSourceId;
}

export function getMlsFeedSourceLabel(
  source: MlsFeedSourceId | null,
): string | null {
  return source ? MLS_FEED_SOURCE_LABEL_BY_ID[source] : null;
}

export function getMlsHandlePath(
  source: string | null | undefined,
  handle: string | null,
): string | null {
  const normalizedSource = source ? normalizeMlsFeedSource(source) : null;
  const normalizedHandle = normalizeMlsHandle(handle);
  if (!normalizedSource || !normalizedHandle) {
    return null;
  }

  const slug = normalizeMlsHandleSlug(normalizedHandle);
  if (!slug) {
    return null;
  }

  return `/feed/users/${encodeURIComponent(normalizedSource)}/${encodeURIComponent(slug)}`;
}
