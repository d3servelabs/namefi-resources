import { config } from '@/lib/env';
import { getHostname } from '@/lib/string';
import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';
import {
  getThirdPartyOriginCanonicalOrigin,
  type ThirdPartyOriginKey,
} from './keys';
import type { OriginConfig, OriginRuntime } from './types';

export const FIRST_PARTY_ORIGIN_URL = new URL(config.FIRST_PARTY_DEPLOYMENT_URL)
  .origin;

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

export function getStaticFirstPartyOriginRuntime(
  originConfig: OriginConfig,
): OriginRuntime {
  return {
    origin: FIRST_PARTY_ORIGIN_URL,
    isFirstPartyOrigin: true,
    thirdPartyHostname: null,
    config: originConfig,
  };
}

export function getStaticThirdPartyOriginRuntime(
  hostname: ThirdPartyOriginKey,
  originConfig: OriginConfig,
): OriginRuntime {
  return {
    origin: getThirdPartyOriginCanonicalOrigin(hostname),
    isFirstPartyOrigin: false,
    thirdPartyHostname: hostname,
    config: originConfig,
  };
}
