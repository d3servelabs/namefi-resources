import { LEGACY_RESOURCES_HOSTNAME_MAP } from '@/lib/resources-host-map';

const TRAILING_SLASH_REGEX = /\/$/;

function withProtocol(url: string): string {
  return url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `https://${url}`;
}

function normaliseBaseUrl(rawBaseUrl: string): string {
  const url = new URL(withProtocol(rawBaseUrl));
  const mappedHostname = LEGACY_RESOURCES_HOSTNAME_MAP[url.hostname];
  if (mappedHostname) {
    url.hostname = mappedHostname;
  }
  return url.origin;
}

function resolveDefaultBaseUrl(): string {
  const environment = process.env.ENVIRONMENT ?? process.env.NODE_ENV;
  if (environment === 'production') {
    return 'https://namefi.io';
  }
  const vercelProjectUrl =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (!vercelProjectUrl) {
    return 'https://localhost:5050';
  }
  return withProtocol(vercelProjectUrl);
}

export function resolveBaseUrl(): string {
  // Canonical URLs for /r content should resolve to the first-party site origin.
  const rawBaseUrl =
    process.env.CANONICAL_SITE_URL ??
    process.env.FIRST_PARTY_DEPLOYMENT_URL ??
    process.env.NEXT_PUBLIC_FIRST_PARTY_DEPLOYMENT_URL ??
    resolveDefaultBaseUrl();
  const normalisedBaseUrl = normaliseBaseUrl(rawBaseUrl);
  return normalisedBaseUrl.replace(TRAILING_SLASH_REGEX, '');
}
