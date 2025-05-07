import { z } from 'zod';

export function toASCII(domain: string): string {
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
 * - start with a letter or digit unless when it's the first label, it can be an underscore too
 * - each label can be up to 63 characters
 * - total length can be up to 255 characters
 */
export const nameRegexString =
  '[a-z0-9_]([a-z0-9-]{0,61}[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*';
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
export const fqdnLowercaseSchema = z.string().refine(
  (val) => val === '@' || fqdnLowercaseRegex.test(val),
  (val) => {
    return {
      message: `Invalid fully qualified domain name: "${val}". Must be "@" or a normalized, lowercase domain name with a trailing dot, Example: "example.com."`,
    };
  },
);

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
