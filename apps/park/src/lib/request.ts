const DOMAIN_QUERY_KEYS = ['domain', 'ldh', 'hostname'];

const QUERY_HEADER_NAMES = [
  'x-invoke-query',
  'x-middleware-request-query',
  'x-nextjs-route-query',
  'x-nextjs-query',
];

const URL_HEADER_NAMES = [
  'x-forwarded-uri',
  'x-original-url',
  'x-rewrite-url',
  'x-next-url',
  'x-invoke-path',
  'x-invoke-url',
];

function sanitizeDomain(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return normalized.replace(/\.$/, '') || null;
}

function extractFromSearchParams(
  params: URLSearchParams | null,
): string | null {
  if (!params) return null;
  for (const key of DOMAIN_QUERY_KEYS) {
    const value = params.get(key);
    const sanitized = sanitizeDomain(value);
    if (sanitized) {
      return sanitized;
    }
  }
  return null;
}

function parseSearchParams(candidate: string | null): URLSearchParams | null {
  if (!candidate) return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;

  if (trimmed.includes('?')) {
    const searchIndex = trimmed.indexOf('?');
    if (searchIndex >= 0 && searchIndex < trimmed.length - 1) {
      return new URLSearchParams(trimmed.slice(searchIndex + 1));
    }
  }

  if (trimmed.includes('=')) {
    return new URLSearchParams(trimmed);
  }

  return null;
}

type HeaderSource = {
  get(name: string): string | null;
};

export function getDomainQueryParam(headersList: HeaderSource): string | null {
  for (const headerName of QUERY_HEADER_NAMES) {
    const params = parseSearchParams(headersList.get(headerName));
    const domain = extractFromSearchParams(params);
    if (domain) {
      return domain;
    }
  }

  for (const headerName of URL_HEADER_NAMES) {
    const params = parseSearchParams(headersList.get(headerName));
    const domain = extractFromSearchParams(params);
    if (domain) {
      return domain;
    }
  }

  const referer = headersList.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      const domain = extractFromSearchParams(url.searchParams);
      if (domain) {
        return domain;
      }
    } catch {
      // ignore invalid referer values
    }
  }

  return null;
}
