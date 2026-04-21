import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { toASCII, verifyNormalized } from '@namefi-astra/zod-dns';
import { DEFAULT_RANKED_TLD_PAGE_SIZE, RANKED_TLDS } from './tld-rank';

export type RankedDomainSuggestionsResult = {
  domains: NamefiNormalizedDomain[];
  page: number;
  totalPages: number;
  nextPage: number | null;
  pageSize: number;
};

export type SafeRankedDomainSuggestionsResult =
  | {
      success: true;
      data: RankedDomainSuggestionsResult;
    }
  | {
      success: false;
      error: Error;
    };

/**
 * Generates the same ranked-TLD first-party suggestions as the API path.
 *
 * This throws for invalid search text to match the existing backend suggestion
 * behavior. UI render paths should use `safeGenerateRankedDomainSuggestions`
 * when invalid input is an expected typing state.
 */
export function generateRankedDomainSuggestions(
  query: string,
  page = 1,
  pageSize = DEFAULT_RANKED_TLD_PAGE_SIZE,
): RankedDomainSuggestionsResult {
  const sanitizedResult = sanitizeDomainSearchQueryResult(query);
  if (!sanitizedResult.success) {
    throw sanitizedResult.error;
  }

  return generateRankedDomainSuggestionsForSanitizedQuery(
    sanitizedResult.data,
    page,
    pageSize,
  );
}

/**
 * Non-throwing ranked suggestion wrapper for client render paths.
 */
export function safeGenerateRankedDomainSuggestions(
  query: string,
  page = 1,
  pageSize = DEFAULT_RANKED_TLD_PAGE_SIZE,
): SafeRankedDomainSuggestionsResult {
  const sanitizedResult = sanitizeDomainSearchQueryResult(query);
  if (!sanitizedResult.success) {
    return sanitizedResult;
  }

  return {
    success: true,
    data: generateRankedDomainSuggestionsForSanitizedQuery(
      sanitizedResult.data,
      page,
      pageSize,
    ),
  };
}

function generateRankedDomainSuggestionsForSanitizedQuery(
  sanitizedQuery: NamefiNormalizedDomain,
  page: number,
  pageSize: number,
): RankedDomainSuggestionsResult {
  const normalizedPageSize = Math.trunc(pageSize);
  const effectivePageSize =
    normalizedPageSize > 0 ? normalizedPageSize : DEFAULT_RANKED_TLD_PAGE_SIZE;
  const totalPages = Math.max(
    1,
    Math.ceil(RANKED_TLDS.length / effectivePageSize),
  );
  const currentPage = Math.min(Math.max(Math.trunc(page) || 1, 1), totalPages);

  const sliceStart = (currentPage - 1) * effectivePageSize;
  const rankedTldsForPage = RANKED_TLDS.slice(
    sliceStart,
    sliceStart + effectivePageSize,
  );
  const firstLabel = sanitizedQuery.split('.')[0];
  const domains = sanitizedQuery.includes('.')
    ? [
        sanitizedQuery,
        ...rankedTldsForPage.map((tld) => `${firstLabel}.${tld}`),
      ]
    : rankedTldsForPage.map((tld) => `${sanitizedQuery}.${tld}`);

  return {
    domains: filterNamefiNormalizedDomains(Array.from(new Set(domains))),
    page: currentPage,
    totalPages,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    pageSize: effectivePageSize,
  };
}

/**
 * Sanitizes search text using the existing backend suggestion semantics.
 *
 * This mirrors the backend suggestion sanitizer: strip URL path/query/hash
 * suffixes, trim, lowercase, collapse repeated dots, remove unsupported
 * characters, preserve valid `_` labels, and then validate with Namefi rules.
 */
export function sanitizeDomainSearchQuery(
  query: string,
): NamefiNormalizedDomain {
  const result = sanitizeDomainSearchQueryResult(query);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

function sanitizeDomainSearchQueryResult(query: string):
  | {
      success: true;
      data: NamefiNormalizedDomain;
    }
  | {
      success: false;
      error: Error;
    } {
  const cleaned = query
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .replace(/[/?#].*$/s, '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\.{2,}/g, '.')
    .replace(/^\.|\.$/g, '')
    .replace(/[^\p{L}\p{N}_\u2010\-.]/gu, '');

  if (!cleaned) {
    return { success: false, error: new Error('empty domain') };
  }

  const asciiLabels: string[] = [];
  for (const label of cleaned.split('.')) {
    const ascii = toASCII(label);
    if (ascii.length < 1 || ascii.length > 63) {
      return {
        success: false,
        error: new Error(`label "${label}" is invalid or >63 chars`),
      };
    }
    asciiLabels.push(ascii);
  }

  const asciiJoined = toASCII(asciiLabels.join('.'));

  if (!verifyNormalized(asciiJoined)) {
    return {
      success: false,
      error: new Error(
        'violates Namefi rules (lowercase a-z/0-9/-/_, max 255 chars)',
      ),
    };
  }

  const parsed = namefiNormalizedDomainSchema.safeParse(asciiJoined);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  return { success: true, data: parsed.data };
}

function filterNamefiNormalizedDomains(
  domains: string[],
): NamefiNormalizedDomain[] {
  const result: NamefiNormalizedDomain[] = [];
  for (const domain of domains) {
    const parsed = namefiNormalizedDomainSchema.safeParse(domain);
    if (parsed.success) {
      result.push(parsed.data);
    }
  }
  return result;
}
