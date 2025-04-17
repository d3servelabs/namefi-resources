import { config } from '@/lib/env';
import { getHostname } from '@/lib/utils';
import type { Metadata } from 'next';
import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';

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
  return config.NAMEFI_FIRST_PARTY_ORIGINS.includes(hostname);
}

/**
 * Gets the domain for a powered-by-NameFI third-party origin
 * Returns null when there is no third-party origin
 */
export function getDomainForPoweredByNamefiThirdPartyOrigin(
  origin: string,
): string | null {
  const hostname = getHostname(origin);

  if (config.POWERED_BY_NAMEFI_THIRD_PARTY_ORIGINS.includes(hostname)) {
    return hostname;
  }

  return config.ADDITIONAL_ORIGIN_TO_HOSTNAME_MAP[hostname] || null;
}

/**
 * Metadata configuration by origin type
 */
export type OriginMetadataConfig = {
  firstParty: Metadata;
  thirdParty: Record<string, Metadata>;
};

/**
 * Default metadata configuration
 */
export const metadataConfig: OriginMetadataConfig = {
  firstParty: {
    title: 'Powered by NameFI',
    description: 'Buy and sell domains with ease',
  },
  thirdParty: {
    '0x.city': {
      title: '0x.city - Powered by NameFI',
      description: 'Buy and sell 0x.city domains with ease',
    },
    'defi.build': {
      title: 'defi.build - Powered by NameFI',
      description: 'Buy and sell defi.build domains with ease',
    },
  },
};

/**
 * Get metadata configuration based on current origin
 */
export function getMetadataForOrigin(origin: string): Metadata {
  // Check if it's a third-party origin
  const thirdPartyDomain = getDomainForPoweredByNamefiThirdPartyOrigin(origin);
  if (thirdPartyDomain && metadataConfig.thirdParty[thirdPartyDomain]) {
    return metadataConfig.thirdParty[thirdPartyDomain];
  }

  return metadataConfig.firstParty;
}
