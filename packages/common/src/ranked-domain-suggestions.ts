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
 * Returns an empty result page when search text contains no usable domain-label
 * characters, so user-entered search text does not produce a parser error UX.
 */
export function generateRankedDomainSuggestions(
  query: string,
  page = 1,
  pageSize = DEFAULT_RANKED_TLD_PAGE_SIZE,
): RankedDomainSuggestionsResult {
  const sanitizedResult = sanitizeDomainSearchQueryResult(query);
  if (!sanitizedResult.success) {
    return createEmptyRankedDomainSuggestionsResult(page, pageSize);
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
  return {
    success: true,
    data: generateRankedDomainSuggestions(query, page, pageSize),
  };
}

function createEmptyRankedDomainSuggestionsResult(
  page: number,
  pageSize: number,
): RankedDomainSuggestionsResult {
  const normalizedPageSize = Math.trunc(pageSize);
  const effectivePageSize =
    normalizedPageSize > 0 ? normalizedPageSize : DEFAULT_RANKED_TLD_PAGE_SIZE;

  return {
    domains: [],
    page: Math.max(Math.trunc(page) || 1, 1),
    totalPages: 1,
    nextPage: null,
    pageSize: effectivePageSize,
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
 * Strip URL path/query/hash suffixes and ports, then convert each label to the
 * closest Namefi-valid label so search can keep moving for typo-heavy input.
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
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .replace(/[/?#].*$/s, '')
    .replace(/:\d+$/g, '')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.|\.$/g, '');

  if (!cleaned) {
    return { success: false, error: new Error('empty domain') };
  }

  const asciiLabels: string[] = [];
  for (const label of cleaned.split('.')) {
    const ascii = sanitizeDomainSearchLabel(label);
    if (ascii) {
      asciiLabels.push(ascii);
    }
  }

  if (asciiLabels.length === 0) {
    return { success: false, error: new Error('empty domain') };
  }

  const domainLabels = trimDomainLabelsToMaxLength(asciiLabels);
  if (domainLabels.length === 0) {
    return { success: false, error: new Error('empty domain') };
  }

  const asciiJoined = domainLabels.join('.');

  if (!verifyNormalized(asciiJoined)) {
    return {
      success: false,
      error: new Error('unable to sanitize search query'),
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

function toASCIIDomainLabel(label: string): string {
  if (isASCII(label)) {
    return label;
  }

  return toASCII(label);
}

function sanitizeDomainSearchLabel(label: string): string | null {
  const cleaned = label
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/[\u2010-\u2015\u2212]/g, '-');
  if (!cleaned) {
    return null;
  }

  const labelWithValidUnderscores = [...cleaned]
    .map((character, index, characters) =>
      character === '_' && index > 0 && index < characters.length - 1
        ? '-'
        : character,
    )
    .join('')
    .replace(/^-+|-+$/g, '');
  if (!labelWithValidUnderscores) {
    return null;
  }

  const ascii = toASCIIDomainLabel(labelWithValidUnderscores)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!ascii) {
    return null;
  }

  return trimDomainLabel(ascii);
}

function trimDomainLabel(label: string): string | null {
  const trimmed = label.slice(0, 63).replace(/-+$/g, '');

  return trimmed.length > 0 ? trimmed : null;
}

function trimDomainLabelsToMaxLength(labels: string[]): string[] {
  const result: string[] = [];
  let remainingLength = 255;

  for (const label of labels) {
    const separatorLength = result.length > 0 ? 1 : 0;
    const availableLength = remainingLength - separatorLength;
    if (availableLength <= 0) {
      break;
    }

    if (label.length <= availableLength) {
      result.push(label);
      remainingLength -= separatorLength + label.length;
      continue;
    }

    const trimmedLabel = trimDomainLabel(label.slice(0, availableLength));
    if (trimmedLabel) {
      result.push(trimmedLabel);
    }
    break;
  }

  return result;
}

function isASCII(value: string): boolean {
  return [...value].every((character) => character.charCodeAt(0) <= 0x7f);
}
