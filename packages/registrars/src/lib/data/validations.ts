import punycode from 'punycodejs';
import { BRAND, z } from 'zod';

/**
 * Represents a domain name string with branded type for type safety.
 * A domain name without trailing dot.
 */
export type DomainName = string & {
  readonly __brand: {
    readonly domainName: true;
  };
};

/**
 * Represents a Fully Qualified Domain Name (FQDN) with trailing dot.
 * This type enforces that the string ends with a dot.
 */
export type Fqdn = `${string}.` & {
  readonly __brand: {
    readonly domainName: true;
    readonly fqdn: true;
  };
};

/**
 * Represents a Fully Qualified Domain Name in ASCII Punycode format with trailing dot.
 * Used for internationalized domain names in their ASCII representation.
 */
export type PunycodeFqdn = `${string}.` & {
  readonly __brand: {
    readonly domainName: true;
    readonly charset: 'ascii';
    readonly punycode: true;
    readonly fqdn: true;
  };
};

/**
 * Represents a domain name in ASCII Punycode format without trailing dot.
 * Used for internationalized domain names in their ASCII representation.
 */
export type PunycodeDomainName = string & {
  [BRAND]: {
    readonly NamefiNormalizedDomain: true; // This is a hack to allow the type to be used in the NamefiNormalizedDomain type
  };
  readonly __brand: {
    readonly domainName: true;
    readonly charset: 'ascii';
    readonly punycode: true;
  };
};

/**
 * Represents a Fully Qualified Domain Name in Unicode format with trailing dot.
 * Allows for human-readable internationalized domain names.
 */
export type UnicodeFqdn = `${string}.` & {
  readonly __brand: {
    readonly domainName: true;
    readonly charset: 'unicode';
    readonly fqdn: true;
  };
};

/**
 * Represents a domain name in Unicode format without trailing dot.
 * Allows for human-readable internationalized domain names.
 */
export type UnicodeDomainName = string & {
  readonly __brand: {
    readonly domainName: true;
    readonly charset: 'unicode';
  };
};

/**
 * Zod schema for validating individual domain labels.
 * Domain labels must be between 1 and 63 characters in length.
 * @todo Add regex to check if the label is valid
 */
export const domainLabelSchema = z.string().min(1).max(63); // add regex to check if the label is valid

/**
 * Zod schema for validating Unicode FQDNs.
 * Ensures the string ends with a dot and all domain labels are valid.
 */
export const unicodeFqdnSchema = z
  .string()
  .endsWith('.', { message: 'FQDN must end with a dot' })
  .refine(
    (value) => {
      // TODO: add regex to check if the domain is valid and conforms to IDN rules
      return value
        .split('.')
        .slice(0, -1) // remove the last label (the root zone)
        .every((part) => domainLabelSchema.safeParse(part).success);
    },
    {
      message: 'Domain labels must be between 1 and 63 characters',
    },
  )
  .transform((value) => value as UnicodeFqdn);

/**
 * Zod schema for validating Punycode FQDNs.
 * Ensures the string ends with a dot and all domain labels are valid.
 */
export const punycodeFqdnSchema = z
  .string()
  .endsWith('.', { message: 'FQDN must end with a dot' })
  .refine(
    (value) => {
      // TODO: add regex to check if the domain is valid and conforms to IDN rules
      return value
        .split('.')
        .slice(0, -1) // remove the last label (the root zone)
        .every((part) => domainLabelSchema.safeParse(part).success);
    },
    {
      message: 'Domain labels must be between 1 and 63 characters',
    },
  )
  .transform((value) => value as PunycodeFqdn);

/**
 * Converts a string to a Punycode FQDN.
 * Trims the string, converts it to lowercase, and applies Punycode encoding.
 *
 * @param value - The domain name string to convert
 * @returns The Punycode FQDN
 * @throws Error if the resulting string is not a valid Punycode FQDN
 */
export function toPunycodeFqdn(value: string): PunycodeFqdn {
  const result = z
    .string()
    .trim()
    .transform((value) =>
      punycode.toASCII(`${value.toLowerCase().replace(/\.$/g, '').trim()}.`),
    )
    .parse(value);
  assertPunycodeFqdn(result);
  return result;
}

/**
 * Checks if a string is a valid Punycode FQDN.
 *
 * @param value - The string to check
 * @returns Boolean indicating if the string is a valid Punycode FQDN
 */
export function isPunycodeFqdn(value: string): value is PunycodeFqdn {
  return punycodeFqdnSchema.safeParse(value).success;
}

/**
 * Asserts that a string is a valid Punycode FQDN.
 *
 * @param value - The string to validate
 * @throws Error if the string is not a valid Punycode FQDN
 */
export function assertPunycodeFqdn(
  value: string,
): asserts value is PunycodeFqdn {
  const result = punycodeFqdnSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `Invalid Punycode FQDN. Provided: (${value}) . Details: ${result.error.message}`,
    );
  }
}

/**
 * Converts a string to a Unicode FQDN.
 * Trims the string, converts it to lowercase, and applies Unicode decoding.
 *
 * @param value - The domain name string to convert
 * @returns The Unicode FQDN
 * @throws Error if the resulting string is not a valid Unicode FQDN
 */
export function toUnicodeFqdn(value: string): UnicodeFqdn {
  const result = z
    .string()
    .trim()
    .transform((value) =>
      punycode.toUnicode(`${value.toLowerCase().replace(/\.$/g, '').trim()}.`),
    )
    .parse(value);
  assertUnicodeFqdn(result);
  return result;
}

/**
 * Checks if a string is a valid Unicode FQDN.
 *
 * @param value - The string to check
 * @returns Boolean indicating if the string is a valid Unicode FQDN
 */
export function isUnicodeFqdn(value: string): value is UnicodeFqdn {
  return unicodeFqdnSchema.safeParse(value).success;
}

/**
 * Asserts that a string is a valid Unicode FQDN.
 *
 * @param value - The string to validate
 * @throws Error if the string is not a valid Unicode FQDN
 */
export function assertUnicodeFqdn(value: string): asserts value is UnicodeFqdn {
  const result = unicodeFqdnSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `Invalid Unicode FQDN. Provided: (${value}) . Details: ${result.error.message}`,
    );
  }
}

// #region Punycode Domain Name

/**
 * Zod schema for validating Unicode Domain Names.
 * Ensures the string ends with a dot and all domain labels are valid.
 */
export const unicodeDomainNameSchema = z
  .string()
  .refine(
    (value) => {
      // TODO: add regex to check if the domain is valid and conforms to IDN rules
      return value
        .split('.')
        .every((part) => domainLabelSchema.safeParse(part).success);
    },
    {
      message: 'Domain labels must be between 1 and 63 characters',
    },
  )
  .transform((value) => value as UnicodeDomainName);

/**
 * Zod schema for validating Punycode Domain Names.
 * Ensures the string ends with a dot and all domain labels are valid.
 */
export const punycodeDomainNameSchema = z
  .string()
  .refine(
    (value) => {
      // TODO: add regex to check if the domain is valid and conforms to IDN rules
      return value
        .split('.')
        .every((part) => domainLabelSchema.safeParse(part).success);
    },
    {
      message: 'Domain labels must be between 1 and 63 characters',
    },
  )
  .transform((value) => value as PunycodeDomainName);

/**
 * Converts a string to a Punycode Domain Name.
 * Trims the string, converts it to lowercase, and applies Punycode encoding.
 *
 * @param value - The domain name string to convert
 * @returns The Unicode Domain Name
 * @throws Error if the resulting string is not a valid Unicode Domain Name
 */
export function toUnicodeDomainName(value: string): UnicodeDomainName {
  const result = z
    .string()
    .trim()
    .transform((value) => punycode.toUnicode(value.toLowerCase()))
    .parse(value);
  assertUnicodeDomainName(result);
  return result;
}

/**
 * Checks if a string is a valid Unicode Domain Name.
 *
 * @param value - The string to check
 * @returns Boolean indicating if the string is a valid Unicode Domain Name
 */
export function isUnicodeDomainName(value: string): value is UnicodeDomainName {
  return unicodeDomainNameSchema.safeParse(value).success;
}

/**
 * Asserts that a string is a valid Punycode Domain Name.
 *
 * @param value - The string to validate
 * @throws Error if the string is not a valid Unicode Domain Name
 */
export function assertUnicodeDomainName(
  value: string,
): asserts value is UnicodeDomainName {
  const result = unicodeDomainNameSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `Invalid Unicode Domain Name. Provided: (${value}) . Details: ${result.error.message}`,
    );
  }
}

/**
 * Converts a string to a Punycode Domain Name.
 * Trims the string, converts it to lowercase, and applies Unicode decoding.
 *
 * @param value - The domain name string to convert
 * @returns The Punycode Domain Name
 * @throws Error if the resulting string is not a valid Punycode Domain Name
 */
export function toPunycodeDomainName(value: string): PunycodeDomainName {
  const result = z
    .string()
    .trim()
    .transform((value) =>
      punycode.toASCII(value.toLowerCase()).replace(/\.$/, ''),
    )
    .parse(value);
  assertPunycodeDomainName(result);
  return result;
}

/**
 * Checks if a string is a valid Punycode Domain Name.
 *
 * @param value - The string to check
 * @returns Boolean indicating if the string is a valid Punycode Domain Name
 */
export function isPunycodeDomainName(
  value: string,
): value is PunycodeDomainName {
  return punycodeDomainNameSchema.safeParse(value).success;
}

/**
 * Asserts that a string is a valid Punycode Domain Name.
 *
 * @param value - The string to validate
 * @throws Error if the string is not a valid Punycode Domain Name
 */
export function assertPunycodeDomainName(
  value: string,
): asserts value is PunycodeDomainName {
  const result = punycodeDomainNameSchema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `Invalid Punycode Domain Name. Provided: (${value}) . Details: ${result.error.message}`,
    );
  }
}

// #endregion
