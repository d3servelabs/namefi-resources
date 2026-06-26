const INDEXABLE_PARK_ROOT_HOSTS: ReadonlySet<string> = new Set(['30003.click']);
const TRUSTED_DOMAIN_OVERRIDE_HOSTS: ReadonlySet<string> = new Set([
  'park.namefi.io',
  'park.astra.namefi.io',
]);

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

export function normalizeParkDomainParam(
  value: string | null | undefined,
): string {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  const unwrapped =
    trimmed.startsWith('<') && trimmed.endsWith('>')
      ? trimmed.slice(1, -1)
      : trimmed;
  return bareHost(unwrapped);
}

export function isIndexableParkHost(host: string | null | undefined): boolean {
  return INDEXABLE_PARK_ROOT_HOSTS.has(bareHost(host));
}

export function isTrustedDomainOverrideHost(
  host: string | null | undefined,
): boolean {
  const normalized = bareHost(host);
  return (
    TRUSTED_DOMAIN_OVERRIDE_HOSTS.has(normalized) ||
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized === '127.0.0.1' ||
    normalized === '0.0.0.0' ||
    normalized === '::1' ||
    normalized.endsWith('-d3servelabs.vercel.app')
  );
}

export function resolveTrustedParkHost(options: {
  host: string | null | undefined;
  originalHost?: string | null | undefined;
  forwardedHost?: string | null | undefined;
}): string {
  const host = bareHost(options.host);
  const forwardedHost = bareHost(options.forwardedHost);
  const originalHost = bareHost(options.originalHost);
  const overrideHost = originalHost || forwardedHost;
  return overrideHost && isTrustedDomainOverrideHost(host)
    ? overrideHost
    : host;
}

function effectiveIndexableHost(options: {
  host: string | null | undefined;
  domainOverride?: string | null | undefined;
}): string {
  const overrideHost = normalizeParkDomainParam(options.domainOverride);
  return isTrustedDomainOverrideHost(options.host) &&
    isIndexableParkHost(overrideHost)
    ? overrideHost
    : bareHost(options.host);
}

function isAllowedRootSearch(options: {
  host: string | null | undefined;
  search?: string | null | undefined;
  domainOverride?: string | null | undefined;
}): boolean {
  const search = options.search?.trim();
  if (!search) return true;

  const overrideHost = normalizeParkDomainParam(options.domainOverride);
  if (!isIndexableParkHost(overrideHost)) return false;

  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  const entries = Array.from(params.entries());
  if (entries.length !== 1) return false;

  const [key, value] = entries[0] ?? [];
  return (
    key === 'domain' &&
    normalizeParkDomainParam(value) === overrideHost &&
    isTrustedDomainOverrideHost(options.host) &&
    !isIndexableParkHost(options.host)
  );
}

export function isIndexableParkRoot(options: {
  host: string | null | undefined;
  pathname: string | null | undefined;
  search?: string | null | undefined;
  domainOverride?: string | null | undefined;
}): boolean {
  return (
    isIndexableParkHost(effectiveIndexableHost(options)) &&
    (options.pathname?.trim() || '/') === '/' &&
    isAllowedRootSearch(options)
  );
}

export function shouldNoindexParkRequest(options: {
  host: string | null | undefined;
  pathname: string | null | undefined;
  search?: string | null | undefined;
  domainOverride?: string | null | undefined;
}): boolean {
  return !isIndexableParkRoot(options);
}

export function buildParkCanonicalUrl(
  host: string | null | undefined,
  domainOverride?: string | null | undefined,
): string | null {
  const normalizedHost = effectiveIndexableHost({ host, domainOverride });
  if (!isIndexableParkHost(normalizedHost)) return null;
  return `https://${normalizedHost}/`;
}
