import { isIP } from 'node:net';
import {
  namefiNormalizedDomainSchema,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import * as currencyCodes from 'currency-codes';
import currencySymbolMap from 'currency-symbol-map';

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;
const EDGE_DOTS_PATTERN = /^\.+|\.+$/g;
const HANDLE_PATTERN = /^[a-z0-9_]+$/i;
const TLD_FILTER_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i;

const DEFAULT_SYMBOL_TO_CODE = new Map<string, string>([
  ['$', 'USD'],
  ['US$', 'USD'],
  ['USD$', 'USD'],
]);

export const DEFAULT_NAMEFI_FEED_SEARCH_QUERIES = [
  '("domain for sale" OR "premium domain" OR "domain name" OR "domain names" OR "domain portfolio") -is:retweet -is:reply',
  '("domain" OR "domain name" OR "domain names") ("for sale" OR selling OR "now available" OR "available for" OR "make an offer" OR "open to offers" OR "accepting offers" OR "buy it now" OR BIN OR OBO OR auction) -is:retweet -is:reply',
  '("domain" OR "domain name") ("price" OR "priced at" OR "$" OR "usd") -is:retweet -is:reply',
];

const BLOCKED_SALE_DOMAINS = new Set([
  't.co',
  'x.com',
  'twitter.com',
  'twimg.com',
  'pic.x.com',
  'pic.twitter.com',
  'pbs.twimg.com',
  'amazon.com',
  'amazon.in',
  'amzn.to',
  'shorturl.at',
  'bit.ly',
  'tinyurl.com',
  't.ly',
  'goo.gl',
  'ow.ly',
  'buff.ly',
  'lnkd.in',
  'linktr.ee',
  'open.kakao.com',
  'kakao.com',
  'fb.com',
  'fb.me',
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'youtu.be',
  'linkedin.com',
]);

const CURRENCY_NAME_TO_CODE = buildCurrencyNameToCodeIndex();
const SYMBOL_TO_CODES = buildSymbolToCodesIndex();

const BLOCKED_SALE_DOMAIN_SUFFIXES = Array.from(BLOCKED_SALE_DOMAINS);

export interface ListingCursor {
  sortAt: Date;
  id: string;
}

export function normalizeSaleDomain(
  value: string,
): NamefiNormalizedDomain | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const stripped = trimmed
    .replace(/^[\s"'`([{<]+/, '')
    .replace(/[\s"'`)\]}>.,;:!?]+$/, '');
  if (!stripped) {
    return null;
  }

  const withoutScheme = stripped.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  const host = withoutScheme
    .replace(/^www\./, '')
    .split(/[/?#]/, 1)[0]
    .split(':', 1)[0]
    .replace(/\.+$/, '')
    .trim();

  const parsed = namefiNormalizedDomainSchema.safeParse(host);
  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export function normalizeCurrencyCode(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const uppercase = normalized.toUpperCase();
  if (CURRENCY_CODE_PATTERN.test(uppercase) && currencyCodes.code(uppercase)) {
    return uppercase;
  }

  return (
    resolveEmbeddedCurrencyCode(uppercase) ??
    resolveCurrencyName(normalized) ??
    resolveCurrencySymbol(normalized)
  );
}

function resolveEmbeddedCurrencyCode(value: string): string | null {
  const embeddedCodeMatches = value.match(/\b([A-Z]{3})\b/g);
  if (!embeddedCodeMatches) {
    return null;
  }

  for (const candidate of embeddedCodeMatches) {
    if (currencyCodes.code(candidate)) {
      return candidate;
    }
  }

  return null;
}

function resolveCurrencyName(value: string): string | null {
  const normalizedName = normalizeCurrencyLookupKey(value);
  const nameMatch = CURRENCY_NAME_TO_CODE.get(normalizedName);
  if (nameMatch) {
    return nameMatch;
  }

  const singularNameMatch = CURRENCY_NAME_TO_CODE.get(
    normalizedName.endsWith('s') ? normalizedName.slice(0, -1) : normalizedName,
  );
  if (singularNameMatch) {
    return singularNameMatch;
  }

  const embeddedNameMatch = findEmbeddedCurrencyName(normalizedName);
  if (embeddedNameMatch) {
    return embeddedNameMatch;
  }

  return null;
}

function resolveCurrencySymbol(value: string): string | null {
  const symbolToken = value.replace(/[0-9.,\s]/g, '');
  if (symbolToken) {
    const defaultFromSymbol = DEFAULT_SYMBOL_TO_CODE.get(
      symbolToken.toUpperCase(),
    );
    if (defaultFromSymbol && currencyCodes.code(defaultFromSymbol)) {
      return defaultFromSymbol;
    }

    const symbolCandidates = resolveSymbolCandidates(symbolToken);
    if (symbolCandidates.length === 1) {
      return symbolCandidates[0] ?? null;
    }
  }

  return null;
}

export function normalizePriceAndCurrency(input: {
  askingPrice: string | null | undefined;
  askingCurrency: string | null | undefined;
}): { askingPrice: string | null; askingCurrency: string | null } {
  const inferredCurrency =
    normalizeCurrencyCode(input.askingCurrency) ??
    normalizeCurrencyCode(input.askingPrice);

  return {
    askingPrice: normalizeAskingPriceText(input.askingPrice, inferredCurrency),
    askingCurrency: inferredCurrency,
  };
}

function normalizeAskingPriceText(
  value: string | null | undefined,
  currencyCode: string | null,
): string | null {
  let normalized = normalizeOptionalText(value);
  if (!normalized) {
    return null;
  }

  if (currencyCode) {
    normalized = stripCurrencyFromPrice(normalized, currencyCode);
  }

  normalized = normalized
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();

  return normalized.length > 0 ? normalized : null;
}

function stripCurrencyFromPrice(value: string, currencyCode: string): string {
  const currency = currencyCodes.code(currencyCode);
  const tokens = [
    currencyCode,
    currency?.currency,
    currency?.currency?.endsWith('s')
      ? currency.currency.slice(0, -1)
      : currency?.currency
        ? `${currency.currency}s`
        : null,
    currencySymbolMap(currencyCode),
  ]
    .map((token) => token?.trim())
    .filter((token): token is string => Boolean(token));

  return tokens.reduce((current, token) => {
    if (token.length === 1 && !/[a-z0-9]/i.test(token)) {
      return current
        .replace(new RegExp(`^\\s*${escapeRegExp(token)}\\s*`, 'i'), '')
        .replace(new RegExp(`\\s*${escapeRegExp(token)}\\s*$`, 'i'), '');
    }

    const escaped = escapeRegExp(token);
    return current
      .replace(new RegExp(`^\\s*${escaped}\\s*`, 'i'), '')
      .replace(new RegExp(`\\s*${escaped}\\s*$`, 'i'), '')
      .replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '')
      .trim();
  }, value);
}

export function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function normalizePublicHttpUrl(
  value: string | null | undefined,
): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    if (url.username || url.password) {
      return null;
    }
    return isUnsafePublicHostname(url.hostname) ? null : url.toString();
  } catch {
    return null;
  }
}

export function normalizeHandle(
  value: string | null | undefined,
): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return null;
  }
  return normalized.startsWith('@') ? normalized : `@${normalized}`;
}

export function trimLeadingAt(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalText(value);
  if (!normalized) {
    return null;
  }
  return normalized.startsWith('@') ? normalized.slice(1) : normalized;
}

export function normalizeHandleLookup(value: string): string | null {
  const withoutAt = value.trim().replace(/^@/, '').toLowerCase();
  if (!withoutAt || !HANDLE_PATTERN.test(withoutAt)) {
    return null;
  }
  return withoutAt;
}

export function normalizeTldFilter(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim().toLowerCase().replace(EDGE_DOTS_PATTERN, '');
  if (!normalized || !TLD_FILTER_PATTERN.test(normalized)) {
    return null;
  }
  return normalized;
}

export function domainMatchesTld(domain: string, tld: string | null): boolean {
  if (!tld) {
    return true;
  }
  const normalizedDomain = domain.trim().toLowerCase();
  return normalizedDomain === tld || normalizedDomain.endsWith(`.${tld}`);
}

export function buildTweetUrl(tweetId: string): string {
  return `https://x.com/i/status/${encodeURIComponent(tweetId)}`;
}

export function buildSaleSearchQuery(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const suffix = [
    !/(^|\s)-is:retweet(\s|$)/i.test(trimmed) ? '-is:retweet' : null,
    !/(^|\s)-is:reply(\s|$)/i.test(trimmed) ? '-is:reply' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return suffix ? `${trimmed} ${suffix}` : trimmed;
}

export function extractTweetId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  const statusMatch = trimmed.match(/\/status(?:es)?\/(\d+)/i);
  return statusMatch?.[1] ?? null;
}

export function extractDomainsFromText(text: string): string[] {
  if (!text) {
    return [];
  }

  const results = new Set<string>();
  const pattern =
    /(?:^|[\s/])((?:[a-z0-9-]{1,63}\.)+[a-z]{2,})(?=$|[^a-z0-9.-])/gi;
  let match: RegExpExecArray | null = pattern.exec(text);

  while (match !== null) {
    const candidate = normalizeSaleDomain(match[1] ?? '');
    if (candidate && !isBlockedSaleDomain(candidate)) {
      results.add(candidate);
    }
    match = pattern.exec(text);
  }

  return Array.from(results);
}

export function isBlockedSaleDomain(domain: string): boolean {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (BLOCKED_SALE_DOMAINS.has(normalized)) {
    return true;
  }
  return BLOCKED_SALE_DOMAIN_SUFFIXES.some(
    (suffix) => normalized === suffix || normalized.endsWith(`.${suffix}`),
  );
}

export function mergeDomains(primary: string[], secondary: string[]): string[] {
  const merged = new Set<string>();
  for (const domain of [...primary, ...secondary]) {
    const normalized = normalizeSaleDomain(domain);
    if (normalized) {
      merged.add(normalized);
    }
  }
  return Array.from(merged);
}

export function encodeListingCursor(sortAt: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({
      sortAt: sortAt.toISOString(),
      id,
    }),
    'utf8',
  ).toString('base64url');
}

export function decodeListingCursor(
  value: string | null | undefined,
): ListingCursor | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    ) as { sortAt?: unknown; id?: unknown };
    if (typeof parsed.sortAt !== 'string' || typeof parsed.id !== 'string') {
      return null;
    }

    const sortAt = new Date(parsed.sortAt);
    const id = parsed.id.trim();
    if (Number.isNaN(sortAt.getTime()) || id.length === 0) {
      return null;
    }

    return { sortAt, id };
  } catch {
    return null;
  }
}

export function coerceDate(value: Date | string | null): Date | null {
  if (value === null) {
    return null;
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function buildCurrencyNameToCodeIndex(): Map<string, string> {
  const index = new Map<string, string>();

  for (const entry of currencyCodes.data) {
    const key = normalizeCurrencyLookupKey(entry.currency);
    const existing = index.get(key);

    if (!existing || entry.code < existing) {
      index.set(key, entry.code);
    }
  }

  return index;
}

function buildSymbolToCodesIndex(): Map<string, string[]> {
  const grouped = new Map<string, Set<string>>();

  for (const code of currencyCodes.codes()) {
    const symbol = currencySymbolMap(code)?.trim();
    if (!symbol) {
      continue;
    }

    const set = grouped.get(symbol) ?? new Set<string>();
    set.add(code);
    grouped.set(symbol, set);
  }

  const result = new Map<string, string[]>();
  for (const [symbol, codes] of grouped) {
    result.set(symbol, Array.from(codes).sort());
  }

  return result;
}

function normalizeCurrencyLookupKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[._-]+/g, ' ')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveSymbolCandidates(symbol: string): string[] {
  const candidates = new Set<string>();

  for (const key of [symbol, symbol.toUpperCase()]) {
    const values = SYMBOL_TO_CODES.get(key);
    if (!values) {
      continue;
    }
    for (const value of values) {
      candidates.add(value);
    }
  }

  return Array.from(candidates).sort();
}

function findEmbeddedCurrencyName(value: string): string | null {
  const candidates = Array.from(CURRENCY_NAME_TO_CODE.entries()).sort(
    ([left], [right]) => right.length - left.length,
  );

  for (const [name, code] of candidates) {
    const plural = name.endsWith('s') ? name : `${name}s`;
    const pattern = new RegExp(
      `(^|\\s)(?:${escapeRegExp(name)}|${escapeRegExp(plural)})(\\s|$)`,
      'i',
    );
    if (pattern.test(value)) {
      return code;
    }
  }

  return null;
}

function isUnsafePublicHostname(hostname: string): boolean {
  const normalized = hostname
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');
  if (
    !normalized ||
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal')
  ) {
    return true;
  }

  const ipVersion = isIP(normalized);
  if (ipVersion === 4) {
    return isUnsafeIpv4Address(normalized);
  }
  if (ipVersion === 6) {
    return isUnsafeIpv6Address(normalized);
  }

  return false;
}

function isUnsafeIpv4Address(address: string): boolean {
  const parts = address.split('.').map((part) => Number(part));
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true;
  }

  const [first = 0, second = 0, third = 0] = parts;
  return (
    first === 0 ||
    first === 10 ||
    (first === 100 && second >= 64 && second <= 127) ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 192 && second === 88 && third === 99) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224
  );
}

function isUnsafeIpv6Address(address: string): boolean {
  return (
    address === '::' ||
    address === '::1' ||
    address.startsWith('::ffff:') ||
    address.startsWith('fc') ||
    address.startsWith('fd') ||
    address.startsWith('fe80:')
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
