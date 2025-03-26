import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { normalizeDomainName } from '@namefi-astra/zod-dns';
import {
  adjectives,
  colors,
  uniqueNamesGenerator,
} from 'unique-names-generator';
import { z } from 'zod';
import { getDomainListInfo } from '#services/namefi-registry';
import { createTRPCRouter, publicProcedure } from '../base';

/**
 * Schema for parsing and validating an array of normalized domain names.
 * Uses namefi's normalized domain schema for validation.
 */
const parseNormalizedDomainsArraySchema = z.array(
  z.string().transform(normalizeDomainName).pipe(namefiNormalizedDomainSchema),
);

export const registryRouter = createTRPCRouter({
  /**
   * Retrieves information for a list of domain names.
   * @param input.domains - Array of domain names to get information for
   * @returns Domain information for the provided domains
   */
  getDomainListInfo: publicProcedure
    .input(
      z.object({
        domains: parseNormalizedDomainsArraySchema,
      }),
    )
    .query(({ input }) => getDomainListInfo(input.domains)),
  /**
   * Generates domain name suggestions based on a query string.
   * Combines the query with adjectives and colors to create unique domain names.
   * @param input.query - Base query string to generate suggestions from
   * @param input.parentDomains - Optional array of parent domains to append to generated names
   * @returns Domain information for all generated domain suggestions
   */
  queryDomain: publicProcedure
    .input(
      z.object({
        // The base query string to generate domain suggestions from
        query: z.string(),
        // Optional array of parent domains, defaults to ["0x.city", "defi.build"]
        parentDomains: z
          .enum(['0x.city', 'defi.build'])
          .array()
          .optional()
          .default(['0x.city', 'defi.build']),
      }),
    )
    .query(async ({ input }) => {
      const domains = [];
      // Configure the length of generated name combinations
      const generatedNamesLengths = [1, 2];
      // Number of suggestions to generate per name length
      const suggestionsCountPerNameLength = 5;

      for (const parentDomain of input.parentDomains) {
        // Add the direct query as a subdomain
        domains.push(`${input.query}.${parentDomain}`);

        for (const length of generatedNamesLengths) {
          for (let i = 0; i < suggestionsCountPerNameLength; i++) {
            // Generate unique name combinations using adjectives and colors
            const shortName = uniqueNamesGenerator({
              dictionaries: [adjectives, colors],
              length,
              style: 'lowerCase',
              separator: '-',
              seed: input.query,
            });
            // Combine generated name with query and parent domain
            domains.push(`${shortName}-${input.query}.${parentDomain}`);
          }
        }
      }

      // Normalize and validate all generated domain names
      const normalizeDomains = parseNormalizedDomainsArraySchema.parse(domains);
      return getDomainListInfo(normalizeDomains);
    }),
});
