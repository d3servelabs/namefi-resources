const TRAILING_SLASH_REGEX = /\/$/;

export function resolveBaseUrl(): string {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? 'localhost:3002';
  const normalisedBaseUrl = rawBaseUrl.startsWith('https')
    ? rawBaseUrl
    : `https://${rawBaseUrl}`;
  return normalisedBaseUrl.replace(TRAILING_SLASH_REGEX, '');
}
