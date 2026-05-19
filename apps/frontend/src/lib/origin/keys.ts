type ThirdPartyOriginRegistryEntry = {
  routeSegment: string;
  canonicalOrigin: `https://${string}`;
};

export const THIRD_PARTY_ORIGIN_REGISTRY = {
  aave: {
    routeSegment: 'aave',
    canonicalOrigin: 'https://aave.astra.namefi.io',
  },
  uniswap: {
    routeSegment: 'uniswap',
    canonicalOrigin: 'https://uniswap.astra.namefi.io',
  },
  '0x.city': {
    routeSegment: '0x-city',
    canonicalOrigin: 'https://0x.city',
  },
  'token.com': {
    routeSegment: 'token-com',
    canonicalOrigin: 'https://token.com',
  },
  'taylor.cv': {
    routeSegment: 'taylor-cv',
    canonicalOrigin: 'https://taylor.cv',
  },
  'ali.cv': {
    routeSegment: 'ali-cv',
    canonicalOrigin: 'https://ali.cv',
  },
  'li.cv': {
    routeSegment: 'li-cv',
    canonicalOrigin: 'https://li.cv',
  },
  'muller.cv': {
    routeSegment: 'muller-cv',
    canonicalOrigin: 'https://muller.cv',
  },
  'kumar.cv': {
    routeSegment: 'kumar-cv',
    canonicalOrigin: 'https://kumar.cv',
  },
  'victor.cv': {
    routeSegment: 'victor-cv',
    canonicalOrigin: 'https://victor.cv',
  },
  'starts.today': {
    routeSegment: 'starts-today',
    canonicalOrigin: 'https://starts.today',
  },
  'ends.today': {
    routeSegment: 'ends-today',
    canonicalOrigin: 'https://ends.today',
  },
  'promos.today': {
    routeSegment: 'promos-today',
    canonicalOrigin: 'https://promos.today',
  },
  'available.today': {
    routeSegment: 'available-today',
    canonicalOrigin: 'https://available.today',
  },
  'discounts.today': {
    routeSegment: 'discounts-today',
    canonicalOrigin: 'https://discounts.today',
  },
} as const satisfies Record<string, ThirdPartyOriginRegistryEntry>;

export type ThirdPartyOriginKey = keyof typeof THIRD_PARTY_ORIGIN_REGISTRY;

export type ThirdPartyOriginRouteSegment =
  (typeof THIRD_PARTY_ORIGIN_REGISTRY)[ThirdPartyOriginKey]['routeSegment'];

export const THIRD_PARTY_ORIGIN_KEYS = Object.keys(
  THIRD_PARTY_ORIGIN_REGISTRY,
) as ThirdPartyOriginKey[];

export function isThirdPartyOriginKey(
  hostname: string,
): hostname is ThirdPartyOriginKey {
  return Object.hasOwn(THIRD_PARTY_ORIGIN_REGISTRY, hostname);
}

export function getThirdPartyOriginRouteSegment(hostname: ThirdPartyOriginKey) {
  return THIRD_PARTY_ORIGIN_REGISTRY[hostname].routeSegment;
}

export function getThirdPartyOriginCanonicalOrigin(
  hostname: ThirdPartyOriginKey,
) {
  return THIRD_PARTY_ORIGIN_REGISTRY[hostname].canonicalOrigin;
}

export const THIRD_PARTY_ORIGIN_ROUTE_SEGMENTS = Object.fromEntries(
  Object.entries(THIRD_PARTY_ORIGIN_REGISTRY).map(([hostname, metadata]) => [
    hostname,
    metadata.routeSegment,
  ]),
) as {
  [Key in ThirdPartyOriginKey]: (typeof THIRD_PARTY_ORIGIN_REGISTRY)[Key]['routeSegment'];
};

const THIRD_PARTY_ORIGIN_LANDING_PATH_PATTERN =
  /^\/site\/[^/]+\/landing\/[^/]+$/;

export function isLandingPath(pathname: string) {
  return (
    pathname === '/' || THIRD_PARTY_ORIGIN_LANDING_PATH_PATTERN.test(pathname)
  );
}
