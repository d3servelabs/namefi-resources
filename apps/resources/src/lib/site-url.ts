const TRAILING_SLASH_REGEX = /\/$/;

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
  return vercelProjectUrl.startsWith('https')
    ? vercelProjectUrl
    : `https://${vercelProjectUrl}`;
}

export function resolveBaseUrl(): string {
  // Canonical URLs for /r content should resolve to the first-party site origin.
  const rawBaseUrl =
    process.env.CANONICAL_SITE_URL ??
    process.env.FIRST_PARTY_DEPLOYMENT_URL ??
    process.env.NEXT_PUBLIC_FIRST_PARTY_DEPLOYMENT_URL ??
    resolveDefaultBaseUrl();
  const normalisedBaseUrl = rawBaseUrl.startsWith('https')
    ? rawBaseUrl
    : `https://${rawBaseUrl}`;
  return normalisedBaseUrl.replace(TRAILING_SLASH_REGEX, '');
}
