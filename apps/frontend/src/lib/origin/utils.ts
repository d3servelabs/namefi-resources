import { config } from '@/lib/env';
import { getHostname } from '@/lib/utils';
import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';
import { originConfig } from './config';
import type { OriginConfig, OriginInfo } from './types';

/**
 * Get the host from server-side headers
 */
export function getOriginFromServerHeaders(
  headersList: ReadonlyHeaders,
): string | null {
  try {
    const host = headersList.get('x-forwarded-host');
    const protocol = headersList.get('x-forwarded-proto');
    const origin = host && protocol ? `${protocol}://${host}` : null;
    return origin;
  } catch (e) {
    console.error('Error accessing headers:', e);
    return null;
  }
}

/**
 * Checks if the provided origin is a NameFI first-party origin
 */
export function isNamefiFirstPartyOrigin(origin: string): boolean {
  const hostname = getHostname(origin);
  return config.NAMEFI_FIRST_PARTY_HOSTNAMES.includes(hostname);
}

/**
 * Gets the domain for a powered-by-NameFI third-party origin
 * Returns null when there is no third-party origin
 */
export function getDomainForPoweredByNamefiThirdPartyOrigin(
  origin: string,
): string | null {
  const hostname = getHostname(origin);

  if (config.POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.includes(hostname)) {
    return hostname;
  }

  return config.ADDITIONAL_HOSTNAME_MAP[hostname] || null;
}

/**
 * Get full origin configuration based on current origin
 */
export function getOriginConfig(origin: string | null): OriginConfig {
  if (!origin) {
    return originConfig.firstParty;
  }

  // Check if it's a third-party origin
  const thirdPartyDomain = getDomainForPoweredByNamefiThirdPartyOrigin(origin);
  if (thirdPartyDomain && originConfig.thirdParty[thirdPartyDomain]) {
    return originConfig.thirdParty[thirdPartyDomain];
  }

  return originConfig.firstParty;
}

export function getOriginInfo(origin: string): OriginInfo {
  const isFirstPartyOrigin = isNamefiFirstPartyOrigin(origin);
  const hostname = getHostname(origin);
  const processedHostname = isFirstPartyOrigin
    ? hostname
    : getDomainForPoweredByNamefiThirdPartyOrigin(origin) || hostname;

  return {
    isFirstPartyOrigin,
    thirdPartyHostname: processedHostname,
    config: getOriginConfig(origin),
  };
}
