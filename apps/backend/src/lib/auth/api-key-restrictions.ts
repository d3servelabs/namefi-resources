import IPCIDR from 'ip-cidr';
import { isIP } from 'node:net';
import { logger } from '#lib/logger';

/**
 * API Key Restriction Validation
 *
 * This module provides utilities for validating IP/CIDR and origin restrictions
 * for PLAIN API keys. It handles:
 * - IPv4 and IPv6 address matching
 * - CIDR range matching
 * - Origin matching with wildcard support
 * - Request type validation (browser vs server)
 */

// ============ IP/CIDR Validation ============

/**
 * Validate that a string is a valid IP address or CIDR notation
 * Supports both IPv4 and IPv6
 *
 * @param value - The IP or CIDR string to validate
 * @returns True if the value is a valid IP address or CIDR range
 *
 * @example
 * isValidIpOrCidr('192.168.1.1')      // true (IPv4)
 * isValidIpOrCidr('10.0.0.0/8')       // true (IPv4 CIDR)
 * isValidIpOrCidr('2001:db8::1')      // true (IPv6)
 * isValidIpOrCidr('2001:db8::/32')    // true (IPv6 CIDR)
 * isValidIpOrCidr('invalid')          // false
 */
export function isValidIpOrCidr(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();

  // Check if it's a CIDR notation using the static method
  if (trimmed.includes('/')) {
    return IPCIDR.isValidCIDR(trimmed);
  }

  // Check if it's a plain IP address
  // isIP returns 0 for invalid, 4 for IPv4, 6 for IPv6
  return isIP(trimmed) !== 0;
}

const IPV4_MAPPED_IPV6_PREFIX = '::ffff:';
const IPV4_MAPPED_IPV6_HEX_REGEX = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/;

function decodeIpv4MappedAddress(ip: string): string | null {
  if (!ip.startsWith(IPV4_MAPPED_IPV6_PREFIX)) {
    return null;
  }

  const mappedAddress = ip.slice(IPV4_MAPPED_IPV6_PREFIX.length);
  if (isIP(mappedAddress) === 4) {
    return mappedAddress;
  }

  const hexSegments = IPV4_MAPPED_IPV6_HEX_REGEX.exec(mappedAddress);
  if (!hexSegments) {
    return null;
  }

  const [, highSegment, lowSegment] = hexSegments;
  if (!highSegment || !lowSegment) {
    return null;
  }

  const high = Number.parseInt(highSegment, 16);
  const low = Number.parseInt(lowSegment, 16);

  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join('.');
}

function normalizeIpv4MappedCidrPrefix(prefix: string): string {
  const prefixNumber = Number(prefix);
  if (
    !Number.isInteger(prefixNumber) ||
    prefixNumber < 96 ||
    prefixNumber > 128
  ) {
    return prefix;
  }

  return String(prefixNumber - 96);
}

function normalizeIp(ip: string): string {
  const lower = ip.toLowerCase();
  const [address = '', prefix] = lower.split('/', 2);
  const mappedAddress = decodeIpv4MappedAddress(address);

  if (!mappedAddress) {
    return lower;
  }

  if (prefix === undefined) {
    return mappedAddress;
  }

  return `${mappedAddress}/${normalizeIpv4MappedCidrPrefix(prefix)}`;
}

/**
 * Check if a client IP matches a single IP address or CIDR range
 *
 * @param clientIp - The client's IP address
 * @param ipOrCidr - The IP or CIDR to match against
 * @returns True if the client IP matches
 */
export function ipMatchesCidr(clientIp: string, ipOrCidr: string): boolean {
  try {
    const trimmedCidr = ipOrCidr.trim();
    const trimmedClient = clientIp.trim();
    const normalizedCidr = normalizeIp(trimmedCidr);
    const normalizedClient = normalizeIp(trimmedClient);

    // If it's a CIDR range, use IPCIDR to check containment
    if (normalizedCidr.includes('/')) {
      if (!IPCIDR.isValidCIDR(normalizedCidr)) {
        return false;
      }
      const cidr = new IPCIDR(normalizedCidr);
      return cidr.contains(normalizedClient);
    }

    // For exact IP match, normalize and compare
    return normalizedClient === normalizedCidr;
  } catch (error) {
    logger.debug({ error, clientIp, ipOrCidr }, 'Error matching IP to CIDR');
    return false;
  }
}

/**
 * Check if a client IP matches any entry in the allow list
 *
 * @param clientIp - The client's IP address
 * @param allowedIps - Array of allowed IPs and/or CIDR ranges
 * @returns True if the client IP matches at least one entry
 */
export function ipMatchesAllowList(
  clientIp: string,
  allowedIps: string[],
): boolean {
  if (!clientIp || !allowedIps || allowedIps.length === 0) {
    return false;
  }

  return allowedIps.some((ipOrCidr) => ipMatchesCidr(clientIp, ipOrCidr));
}

// ============ Origin Validation ============

/**
 * Valid origin pattern regex
 * Matches: http(s)://domain.tld or http(s)://*.domain.tld with optional port
 * Does not allow paths, query strings, or fragments
 */
const DNS_OR_IPV4_HOST_PATTERN = String.raw`[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*`;
const IPV6_HOST_PATTERN = String.raw`\[[0-9a-fA-F:.]+\]`;
const ORIGIN_PATTERN_REGEX = new RegExp(
  String.raw`^https?:\/\/(?:(?:\*\.)?${DNS_OR_IPV4_HOST_PATTERN}|${IPV6_HOST_PATTERN})(?::\d{1,5})?$`,
);

function isOriginOnlyUrl(url: URL): boolean {
  return url.pathname === '/' && !url.search && !url.hash;
}

/**
 * Validate that a string is a valid origin pattern
 * Supports wildcards like https://*.example.com
 *
 * @param pattern - The origin pattern to validate
 * @returns True if the pattern is valid
 *
 * @example
 * isValidOriginPattern('https://example.com')       // true
 * isValidOriginPattern('https://*.example.com')     // true
 * isValidOriginPattern('http://localhost:3000')     // true
 * isValidOriginPattern('http://localhost')          // true
 * isValidOriginPattern('https://example.com/')      // false (has trailing slash)
 * isValidOriginPattern('https://example.com/path')  // false (has path)
 * isValidOriginPattern('example.com')               // false (no protocol)
 */
export function isValidOriginPattern(pattern: string): boolean {
  if (!pattern || typeof pattern !== 'string') {
    return false;
  }

  const trimmed = pattern.trim();

  // Must match the origin pattern regex
  if (!ORIGIN_PATTERN_REGEX.test(trimmed)) {
    return false;
  }

  // Additional validation: wildcard can only appear at the beginning of the host
  const url = trimmed.replace('://*.', '://wildcard.');
  try {
    const parsed = new URL(url);
    // Ensure no path (other than /), query, or fragment
    if (!isOriginOnlyUrl(parsed)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an origin matches a pattern (supports wildcards)
 *
 * @param origin - The actual origin from the request
 * @param pattern - The pattern to match against (may contain wildcard)
 * @returns True if the origin matches the pattern
 *
 * @example
 * originMatchesPattern('https://example.com', 'https://example.com')           // true
 * originMatchesPattern('https://api.example.com', 'https://*.example.com')     // true
 * originMatchesPattern('https://www.example.com', 'https://*.example.com')     // true
 * originMatchesPattern('https://example.com', 'https://*.example.com')         // false (no subdomain)
 * originMatchesPattern('https://evil.com', 'https://example.com')              // false
 */
export function originMatchesPattern(origin: string, pattern: string): boolean {
  try {
    const trimmedOrigin = origin.trim().toLowerCase();
    const trimmedPattern = pattern.trim().toLowerCase();
    const originUrl = new URL(trimmedOrigin);

    if (!isOriginOnlyUrl(originUrl)) {
      return false;
    }

    // Check if pattern has a wildcard
    if (trimmedPattern.includes('://*.')) {
      // Extract the base domain from the pattern
      // https://*.example.com -> example.com
      const patternBase = trimmedPattern.replace('://*.', '://');
      const patternUrl = new URL(patternBase);

      if (!isOriginOnlyUrl(patternUrl)) {
        return false;
      }

      // Protocols must match
      if (
        patternUrl.protocol !== originUrl.protocol ||
        patternUrl.port !== originUrl.port
      ) {
        return false;
      }

      // Origin hostname must end with .baseDomain
      // e.g., api.example.com must end with .example.com
      const expectedSuffix = `.${patternUrl.hostname}`;
      return originUrl.hostname.endsWith(expectedSuffix);
    }

    const patternUrl = new URL(trimmedPattern);
    if (!isOriginOnlyUrl(patternUrl)) {
      return false;
    }

    // Exact match by origin tuple (case-insensitive, default ports normalized)
    return (
      originUrl.protocol === patternUrl.protocol &&
      originUrl.hostname === patternUrl.hostname &&
      originUrl.port === patternUrl.port
    );
  } catch (error) {
    logger.debug(
      { error, origin, pattern },
      'Error matching origin to pattern',
    );
    return false;
  }
}

/**
 * Check if an origin matches any entry in the allow list
 *
 * @param origin - The actual origin from the request
 * @param allowedOrigins - Array of allowed origin patterns
 * @returns True if the origin matches at least one pattern
 */
export function originMatchesAllowList(
  origin: string,
  allowedOrigins: string[],
): boolean {
  if (!origin || !allowedOrigins || allowedOrigins.length === 0) {
    return false;
  }

  return allowedOrigins.some((pattern) =>
    originMatchesPattern(origin, pattern),
  );
}

// ============ Combined Validation ============

/**
 * API key restriction configuration
 */
export interface ApiKeyRestrictions {
  /** Allowed IP addresses and CIDR ranges */
  allowedIps: string[] | null;
  /** Allowed origin patterns (with wildcard support) */
  allowedOrigins: string[] | null;
  /** Whether browser requests (with Origin header) are allowed */
  allowBrowserRequests: boolean;
  /** Whether server requests (without Origin header) are allowed */
  allowServerRequests: boolean;
}

/**
 * Result of restriction validation
 */
export interface RestrictionValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate all restrictions for a PLAIN API key request
 *
 * Validation logic:
 * 1. Check request type (browser vs server) based on Origin header presence
 * 2. If browser request: check allowBrowserRequests, then allowedOrigins
 * 3. If server request: check allowServerRequests
 * 4. Check allowedIps regardless of request type
 *
 * @param clientIp - The client's IP address (null if unknown)
 * @param origin - The Origin header value (null if not present)
 * @param restrictions - The API key's restriction configuration
 * @returns Validation result with error message if invalid
 */
export function validateApiKeyRestrictions(
  clientIp: string | null,
  origin: string | null,
  restrictions: ApiKeyRestrictions,
): RestrictionValidationResult {
  const {
    allowedIps,
    allowedOrigins,
    allowBrowserRequests,
    allowServerRequests,
  } = restrictions;

  // Determine request type based on Origin header presence
  const isBrowserRequest = origin !== null && origin !== '';

  if (isBrowserRequest) {
    // Browser request: has Origin header
    if (!allowBrowserRequests) {
      return {
        valid: false,
        error: 'Browser requests are not allowed for this API key',
      };
    }

    // Validate origin if allowedOrigins is configured
    if (allowedOrigins && allowedOrigins.length > 0) {
      if (!originMatchesAllowList(origin, allowedOrigins)) {
        return {
          valid: false,
          error: 'Origin not allowed for this API key',
        };
      }
    }
  } else {
    // Server request: no Origin header
    if (!allowServerRequests) {
      return {
        valid: false,
        error: 'Server requests are not allowed for this API key',
      };
    }
    // Validate IP if allowedIps is configured
    if (allowedIps && allowedIps.length > 0) {
      if (!clientIp) {
        return {
          valid: false,
          error: 'Could not determine client IP address',
        };
      }

      if (!ipMatchesAllowList(clientIp, allowedIps)) {
        return {
          valid: false,
          error: 'IP address not allowed for this API key',
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Validate an array of IP/CIDR values for storage
 * Used when creating or updating API key restrictions
 *
 * @param ips - Array of IP addresses and/or CIDR ranges
 * @returns Object with valid flag and error message if invalid
 */
export function validateIpList(
  ips: string[],
): RestrictionValidationResult & { invalidEntries?: string[] } {
  if (!ips || ips.length === 0) {
    return { valid: true };
  }

  const invalidEntries = ips.filter((ip) => !isValidIpOrCidr(ip.trim()));

  if (invalidEntries.length > 0) {
    return {
      valid: false,
      error: `Invalid IP/CIDR entries: ${invalidEntries.join(', ')}`,
      invalidEntries,
    };
  }

  return { valid: true };
}

/**
 * Validate an array of origin patterns for storage
 * Used when creating or updating API key restrictions
 *
 * @param origins - Array of origin patterns
 * @returns Object with valid flag and error message if invalid
 */
export function validateOriginList(
  origins: string[],
): RestrictionValidationResult & { invalidEntries?: string[] } {
  if (!origins || origins.length === 0) {
    return { valid: true };
  }

  const invalidEntries = origins.filter(
    (origin) => !isValidOriginPattern(origin.trim()),
  );

  if (invalidEntries.length > 0) {
    return {
      valid: false,
      error: `Invalid origin patterns: ${invalidEntries.join(', ')}`,
      invalidEntries,
    };
  }

  return { valid: true };
}
