const INDEXABLE_PARK_ROOT_HOSTS: ReadonlySet<string> = new Set(['30003.click']);

export function bareHost(host: string | null | undefined): string {
  if (!host) return '';
  const normalized = host.trim().toLowerCase().replace(/\.$/, '');
  if (!normalized) return '';

  if (normalized.startsWith('[')) {
    const closingBracket = normalized.indexOf(']');
    return closingBracket > 0
      ? normalized.slice(1, closingBracket)
      : normalized;
  }

  return normalized.split(':')[0] ?? '';
}

export function isIndexableParkHost(host: string | null | undefined): boolean {
  return INDEXABLE_PARK_ROOT_HOSTS.has(bareHost(host));
}

export function isIndexableParkRoot(options: {
  host: string | null | undefined;
  pathname: string | null | undefined;
  search?: string | null | undefined;
}): boolean {
  return (
    isIndexableParkHost(options.host) &&
    (options.pathname?.trim() || '/') === '/' &&
    !options.search?.trim()
  );
}

export function shouldNoindexParkRequest(options: {
  host: string | null | undefined;
  pathname: string | null | undefined;
  search?: string | null | undefined;
}): boolean {
  return !isIndexableParkRoot(options);
}

export function buildParkCanonicalUrl(
  host: string | null | undefined,
): string | null {
  const normalizedHost = bareHost(host);
  if (!isIndexableParkHost(normalizedHost)) return null;
  return `https://${normalizedHost}/`;
}
