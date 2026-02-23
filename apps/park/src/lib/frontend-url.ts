import { config } from '@/lib/env';
import { getPoweredByNamefiApex } from '@/lib/theme';

const DEFAULT_FRONTEND_URL = 'https://namefi.io';
const NAMEFI_PRODUCTION_HOST = 'namefi.io';
const NAMEFI_DEVELOPMENT_HOST = 'namefi.dev';

interface FrontendResolutionOptions {
  domain?: string | null;
  host?: string | null;
}

interface BuildFrontendUrlOptions extends FrontendResolutionOptions {
  baseUrl?: string;
}

function getConfiguredFrontendUrl(): URL {
  try {
    return new URL(config.FRONTEND_URL);
  } catch {
    return new URL(DEFAULT_FRONTEND_URL);
  }
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost')
  );
}

function resolvePbnFrontendHostname(
  pbnApex: string,
  configuredHostname: string,
): string {
  if (
    configuredHostname === NAMEFI_DEVELOPMENT_HOST ||
    configuredHostname.endsWith(`.${NAMEFI_DEVELOPMENT_HOST}`)
  ) {
    return `${pbnApex}.astra.${NAMEFI_DEVELOPMENT_HOST}`;
  }

  if (
    configuredHostname === NAMEFI_PRODUCTION_HOST ||
    configuredHostname.endsWith(`.${NAMEFI_PRODUCTION_HOST}`)
  ) {
    return pbnApex;
  }

  if (isLocalHostname(configuredHostname)) {
    return `${pbnApex}.localhost`;
  }

  return pbnApex;
}

export function resolvePbnApex(
  options?: FrontendResolutionOptions,
): string | null {
  if (!options) return null;

  const domainMatch = getPoweredByNamefiApex(options.domain);
  if (domainMatch) return domainMatch;

  return getPoweredByNamefiApex(options.host);
}

export function getFrontendBaseUrl(
  options?: FrontendResolutionOptions,
): string {
  const configuredUrl = getConfiguredFrontendUrl();
  const pbnApex = resolvePbnApex(options);

  if (!pbnApex) {
    return configuredUrl.toString();
  }

  const pbnFrontendUrl = new URL(configuredUrl.toString());
  pbnFrontendUrl.hostname = resolvePbnFrontendHostname(
    pbnApex,
    configuredUrl.hostname.toLowerCase(),
  );
  return pbnFrontendUrl.toString();
}

export function buildFrontendUrl(
  pathname: string,
  options?: BuildFrontendUrlOptions,
): string {
  const baseUrl = options?.baseUrl ?? getFrontendBaseUrl(options);
  return new URL(pathname, baseUrl).toString();
}
