import { logger } from '#lib/logger';
import type { GeoLocationResult } from './types';

interface IpApiResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  message?: string;
}

export async function getGeolocationFromIp(
  ipAddress: string,
): Promise<GeoLocationResult> {
  const defaultResult: GeoLocationResult = {
    city: null,
    region: null,
    country: null,
    countryCode: null,
  };

  if (
    !ipAddress ||
    ipAddress === 'unknown' ||
    ipAddress === '127.0.0.1' ||
    ipAddress === '::1' ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.') ||
    ipAddress.startsWith('172.')
  ) {
    return defaultResult;
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
      return defaultResult;
    }

    const data = (await response.json()) as IpApiResponse;

    if (data.status !== 'success') {
      logger.warn(
        { ipAddress, message: data.message },
        'Geolocation API returned error',
      );
      return defaultResult;
    }

    return {
      city: data.city || null,
      region: data.regionName || null,
      country: data.country || null,
      countryCode: data.countryCode || null,
    };
  } catch (error) {
    logger.warn({ error, ipAddress }, 'Error fetching geolocation data');
    return defaultResult;
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
  }

  return parts.length > 0 ? parts.join(', ') : 'Unknown location';
}
