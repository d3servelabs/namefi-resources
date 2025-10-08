import {
  fqdnLowercaseSchema,
  nameRegex,
  nameRegexString,
} from '@namefi-astra/zod-dns';
import { getAddress, isAddress } from 'viem';
import { z } from 'zod';

export const namefiNormalizedDomainRegex = nameRegex;

export const namefiNormalizedDomainSchema = z
  .string()
  .regex(new RegExp(`^${nameRegexString}$`))
  .brand<'NamefiNormalizedDomain'>();

/**
 * Converts a fully qualified domain name (FQDN) in lowercase to a Namefi normalized domain
 * by removing trailing dots and validating the format.
 *
 * @param fqdnLowercase - A lowercase FQDN (e.g., "example.com.")
 * @returns The normalized domain name without trailing dots
 * @throws Error if the domain cannot be normalized to a valid Namefi domain format
 */
export const fqdnLowercaseToNamefiNormalizedDomain = z
  .function({
    input: [fqdnLowercaseSchema],
    output: namefiNormalizedDomainSchema,
  })
  .implement((fqdnLowercase) => {
    // trimming trailing dots
    const trimmedFqdnLowercase = fqdnLowercase.replace(/\.+$/, '');
    // input should already be lowercase due to fqdnLowercaseSchema
    const normalizedDomain = trimmedFqdnLowercase;
    // validating the normalized domain
    if (!namefiNormalizedDomainRegex.test(normalizedDomain)) {
      throw new Error(
        `Invalid domain name ${fqdnLowercase}, we are unable to normalize it to a Namefi Normalized Domain.`,
      );
    }
    return normalizedDomain;
  });

export type NamefiNormalizedDomain = z.infer<
  typeof namefiNormalizedDomainSchema
>;

export const checksumWalletAddressSchema = z
  .string()
  .refine(isAddress, {
    message: 'Invalid wallet address',
  })
  .transform((address) => getAddress(address))
  .brand<'ChecksumWalletAddress'>();

export type ChecksumWalletAddress = z.infer<typeof checksumWalletAddressSchema>;
