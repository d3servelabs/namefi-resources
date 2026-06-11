import { z } from 'zod';

// Characters that the WHATWG URL parser treats as URL-grammar (userinfo '@',
// path '/' and '\', port ':', query '?', fragment '#', whitespace). Any of
// these would cause the parser to silently rewrite the hostname to something
// different from the input, e.g. "legit.com@evil.com" → "evil.com".
// We reject them upfront and return the raw input unchanged so that downstream
// nameRegex validation rejects it — never silently accepting a rewritten host.
const URL_GRAMMAR_CHARS = /[@/:?#\\\s]/;

/**
 * Converts an internationalized domain name to its ASCII/punycode form.
 *
 * Security note: if the input contains URL-grammar characters (`@`, `/`, `\`,
 * `:`, `?`, `#`, or whitespace) it is returned **unchanged** — intentionally
 * leaving it in a form that will fail the downstream `nameRegex` check.  This
 * prevents the WHATWG URL parser from silently rewriting the hostname to a
 * different domain (e.g. `"legit.com@evil.com"` → `"evil.com"`).
 */
export function toASCII(domain: string): string {
  if (URL_GRAMMAR_CHARS.test(domain)) {
    return domain;
  }
  try {
    const url = new URL(`https://${domain}`);
    return url.hostname;
  } catch {
    return domain;
  }
}

/**
 * Regex to validate that a domain name is normalized in Namefi flavor
 * @see https://regex101.com/r/9KIO7z/1
 * - lower case letters, digits, and hyphens, no uppercase letters, no special characters, no spaces
 * - start with a letter, digit, or underscore (underscores allowed for service names like _sip._tcp)
 * - each label can be up to 63 characters
 * - total length can be up to 255 characters
 */
export const nameRegexString =
  '[a-z0-9_]([a-z0-9-]{0,61}[a-z0-9_])?(\\.[a-z0-9_]([a-z0-9-]{0,61}[a-z0-9_])?)*';
export const nameRegex = new RegExp(`^${nameRegexString}$`);
export const fqdnLowercaseRegex = new RegExp(`^${nameRegexString}\\.$`);
export const nameSchema = z
  .string()
  .refine((name) => name === '@' || nameRegex.test(name), {
    message: `Invalid record name. Must be "@" or a normalized domain name (lowercase, digits, hyphens, underscores, no ending dot, max 255 chars, see regex: ${nameRegexString}).`,
  });

/**
 * Schema to validate that a fully qualified domain name is properly formatted.
 * Requires:
 * - Must match the {@link nameRegexString} pattern with a trailing dot
 *
 * @example
 * - Valid: "example.com."
 * - Invalid: "example.com", "Example.com.", "example.com.."
 */
export const fqdnLowercaseSchema = z
  .string()
  .refine((val) => val === '@' || fqdnLowercaseRegex.test(val), {
    error: (issue) => {
      const input =
        typeof issue.input === 'string' ? issue.input : String(issue.input);
      return `Invalid fully qualified domain name: "${input}". Must be "@" or a normalized, lowercase domain name with a trailing dot, Example: "example.com."`;
    },
  });

export const normalizeDomainName = (domainNameToNormalize: string) => {
  const possibleNormalized = toASCII(domainNameToNormalize)
    .toLowerCase()
    .replace(/\.+$/, ''); // Remove trailing dots

  if (!verifyNormalized(possibleNormalized)) {
    throw new Error(
      `Invalid domain name: "${domainNameToNormalize}". Unable to normalize according to Namefi rules (lowercase, digits, hyphens, underscores, max 255 chars). Please check your input.`,
    );
  }

  return possibleNormalized;
};

export const verifyNormalized = (domainName: string) => {
  return nameRegex.test(domainName);
};
