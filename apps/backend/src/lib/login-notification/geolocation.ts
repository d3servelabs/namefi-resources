import { lookup, type countries } from 'country-data-list';
import { logger } from '#lib/logger';
import type { RequestGeo } from '#lib/request-info';
import type { GeoLocationResult } from './types';

type CountryInfo = (typeof countries)['all'][number];
/**
 * Looks up a country record by ISO-3166-1 alpha-2 / CLDR region code.
 * `country-data-list` exposes `countries` as an indexed map plus `.all`; the
 * indexed lookup is what we want here. Returns `null` for unknown / unassigned
 * codes rather than throwing.
 */
function lookupCountryByCode(code: string | null | undefined): {
  name: string | null;
  emoji: string | null;
} {
  if (!code) return { name: null, emoji: null };
  const normalized = code.trim().toUpperCase();
  if (normalized.length !== 2) return { name: null, emoji: null };
  const results = lookup.countries({ alpha2: normalized });
  const record = (Array.isArray(results) ? results[0] : results) as
    | CountryInfo
    | undefined;
  if (!record) return { name: null, emoji: null };
  return {
    name: record.name ?? null,
    emoji: record.emoji ?? null,
  };
}

/**
 * Fills in missing `country` / `countryEmoji` fields on a partially-resolved
 * geo by looking up the country by `countryCode`. Existing non-null fields are
 * preserved — we never overwrite values that upstream providers gave us.
 */
function enrichCountryFromCode(geo: GeoLocationResult): GeoLocationResult {
  if (geo.country && geo.countryEmoji) return geo;
  const { name, emoji } = lookupCountryByCode(geo.countryCode);
  return {
    ...geo,
    country: geo.country ?? name,
    countryEmoji: geo.countryEmoji ?? emoji,
  };
}

function isPrivate172Address(ipAddress: string): boolean {
  if (!ipAddress.startsWith('172.')) {
    return false;
  }
  const parts = ipAddress.split('.');
  if (parts.length < 2) {
    return false;
  }
  const secondOctet = Number.parseInt(parts[1], 10);
  return secondOctet >= 16 && secondOctet <= 31;
}

interface IpApiResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  message?: string;
}

export const DEFAULT_GEO: GeoLocationResult = {
  city: null,
  region: null,
  country: null,
  countryCode: null,
  countryEmoji: null,
  subdivision: null,
  lat: null,
  lng: null,
};

/**
 * Merges a geo resolved by Google LB headers (city/subdivision/regionCode/
 * lat/lng only) into our richer `GeoLocationResult` shape, then enriches it
 * with the full country name and flag emoji via `country-data-list`.
 */
export function requestGeoToResult(geo: RequestGeo): GeoLocationResult {
  return enrichCountryFromCode({
    city: geo.city,
    region: geo.subdivision ?? geo.regionCode,
    country: null,
    countryCode: geo.regionCode,
    countryEmoji: null,
    subdivision: geo.subdivision,
    lat: geo.lat,
    lng: geo.lng,
  });
}

/**
 * Resolves geolocation for an IP. When `preResolved` is provided (e.g. from
 * Google LB headers) and has usable data, this returns immediately without
 * hitting the ip-api fallback — the LB's answer is authoritative.
 *
 * "Usable data" means *any* meaningful field — city, countryCode,
 * subdivision, or a coord pair. The LB sometimes resolves only some of
 * these (most commonly: lat/lng + subdivision but no city), and we'd
 * rather honor partial authoritative data than discard it and ask
 * ip-api.com.
 */
export async function getGeolocationFromIp(
  ipAddress: string,
  preResolved?: GeoLocationResult | null,
): Promise<GeoLocationResult> {
  if (
    preResolved &&
    (preResolved.city ||
      preResolved.countryCode ||
      preResolved.subdivision ||
      (preResolved.lat !== null && preResolved.lng !== null))
  ) {
    return preResolved;
  }

  if (
    !ipAddress ||
    ipAddress === 'unknown' ||
    ipAddress === '127.0.0.1' ||
    ipAddress === '::1' ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.') ||
    isPrivate172Address(ipAddress)
  ) {
    return DEFAULT_GEO;
  }

  try {
    const response = await fetch(
      `http://ip-api.com/json/${ipAddress}?fields=status,message,country,countryCode,region,regionName,city`,
      {
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      logger.warn(
        { ipAddress, status: response.status },
        'Failed to fetch geolocation data',
      );
      return DEFAULT_GEO;
    }

    const data = (await response.json()) as IpApiResponse;

    if (data.status !== 'success') {
      logger.warn(
        { ipAddress, message: data.message },
        'Geolocation API returned error',
      );
      return DEFAULT_GEO;
    }

    return enrichCountryFromCode({
      city: data.city || null,
      region: data.regionName || null,
      country: data.country || null,
      countryCode: data.countryCode || null,
      countryEmoji: null,
      subdivision: null,
      lat: null,
      lng: null,
    });
  } catch (error) {
    logger.warn({ error, ipAddress }, 'Error fetching geolocation data');
    return DEFAULT_GEO;
  }
}

export function formatGeolocation(geo: GeoLocationResult): string {
  const parts: string[] = [];

  if (geo.city) {
    parts.push(geo.city);
  }
  if (geo.region && geo.region !== geo.city) {
    parts.push(geo.region);
  }
  if (geo.country) {
    parts.push(geo.country);
  } else if (geo.countryCode) {
    parts.push(geo.countryCode);
  }

  const label = parts.length > 0 ? parts.join(', ') : 'Unknown location';
  return geo.countryEmoji ? `${geo.countryEmoji} ${label}` : label;
}
