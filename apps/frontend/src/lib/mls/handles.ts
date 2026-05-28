const LEADING_AT_SYMBOL = /^@/;
const HANDLE_PATTERN = /^[a-z0-9_]+$/i;

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
  if (!normalized || !HANDLE_PATTERN.test(normalized)) {
    return null;
  }

  return normalized.toLowerCase();
}

export function getMlsHandlePath(handle: string | null): string | null {
  const normalizedHandle = normalizeMlsHandle(handle);
  if (!normalizedHandle) {
    return null;
  }

  const slug = normalizeMlsHandleSlug(normalizedHandle);
  if (!slug) {
    return null;
  }

  return `/feed/platform/twitter/users/${encodeURIComponent(slug)}`;
}
