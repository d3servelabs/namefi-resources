import { config } from '@/lib/env';

export type ParkTheme = string;

const thirdPartyHostnames = config.POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.map(
  (hostname) => hostname.toLowerCase(),
);

const thirdPartyHostnameSet = new Set(thirdPartyHostnames);

const additionalHostnameMap = new Map(
  Object.entries(config.ADDITIONAL_HOSTNAME_MAP ?? {}).map(
    ([hostname, apex]) => [hostname.toLowerCase(), apex.toLowerCase()],
  ),
);

function normalizeHostname(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed.startsWith('[') && trimmed.includes(']')) {
    const closingIndex = trimmed.indexOf(']');
    if (closingIndex > 1) {
      return trimmed.slice(1, closingIndex).replace(/\.$/, '');
    }
  }
  const withoutPort = trimmed.split(':')[0] ?? trimmed;
  return withoutPort.replace(/\.$/, '') || null;
}

function matchPoweredByNamefiHostname(hostname: string): string | null {
  if (thirdPartyHostnameSet.has(hostname)) {
    return hostname;
  }
  const mapped = additionalHostnameMap.get(hostname);
  if (mapped) {
    return mapped;
  }

  for (const apex of thirdPartyHostnameSet) {
    if (hostname.endsWith(`.${apex}`)) {
      return apex;
    }
  }

  return null;
}

export function getPoweredByNamefiApex(value?: string | null): string | null {
  const normalized = normalizeHostname(value);
  if (!normalized) return null;
  return matchPoweredByNamefiHostname(normalized);
}

export function resolveParkTheme(options?: {
  host?: string | null;
  domainOverride?: string | null;
}): ParkTheme {
  if (!options) return 'astra';

  const hostMatch = getPoweredByNamefiApex(options.host);
  if (hostMatch) return hostMatch;

  const domainMatch = getPoweredByNamefiApex(options.domainOverride);
  if (domainMatch) return domainMatch;

  const normalizedHost = normalizeHostname(options.host);
  const normalizedDomain = normalizeHostname(options.domainOverride);

  if (
    normalizedHost?.includes('.poweredby.') ||
    normalizedDomain?.includes('.poweredby.')
  ) {
    return 'pbn';
  }

  return 'astra';
}

export function isPoweredByNamefiDomain(value?: string | null): boolean {
  return getPoweredByNamefiApex(value) !== null;
}
