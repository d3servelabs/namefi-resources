import {
  checksumWalletAddressSchema,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { db, namefiNftCte } from '@namefi-astra/db';
import { normalizeDomainName } from '@namefi-astra/zod-dns';
import {
  adjectives,
  colors,
  uniqueNamesGenerator,
} from 'unique-names-generator';
import { z } from 'zod';
import {
  getDomainListInfo,
  getPoweredByNamefi3PDomains,
} from '#lib/namefi-registry';
import {
  authedOrPublicProcedure,
  createTRPCRouter,
  publicProcedure,
} from '../base';
import { TRPCError } from '@trpc/server';
import { sql } from 'drizzle-orm';
import { resolveEnsNameToAddress } from '#lib/crypto/ens';

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
  getDomainListInfo: authedOrPublicProcedure
    .input(
      z.object({
        domains: parseNormalizedDomainsArraySchema,
      }),
    )
    .query(({ input, ctx }) => getDomainListInfo(input.domains, ctx.user)),

  /**
   * Retrieves information for a single domain name.
   * @param input.domain - The domain name to get information for
   * @returns Domain information for the provided domain
   */
  getDomainInfo: authedOrPublicProcedure
    .input(
      z.object({
        domain: namefiNormalizedDomainSchema.describe(
          'The domain to check availability for',
        ),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { domain } = input;

      const availability = await getDomainListInfo([domain], ctx.user);

      if (availability.length !== 1) {
        return {
          domain: domain,
          availability: false,
        };
      }
      return availability[0];
    }),

  getDomainsByOwner: publicProcedure
    .input(
      z.object({
        identifier: z
          .string()
          .min(1)
          .describe('Wallet address or ENS name to retrieve NFT ownership data')
          .transform((value) => value.trim()),
      }),
    )
    .query(async ({ input }) => {
      const parsedWallet = checksumWalletAddressSchema.safeParse(
        input.identifier,
      );

      let walletAddress: string | null = null;
      let ensName: string | null = null;

      if (parsedWallet.success) {
        walletAddress = parsedWallet.data;
      } else {
        const possibleEns = input.identifier.toLowerCase();
        if (!possibleEns.includes('.')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Enter a valid wallet address or ENS name',
          });
        }

        const resolvedAddress = await resolveEnsNameToAddress(possibleEns);
        if (!resolvedAddress) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Unable to resolve ENS name to a wallet address',
          });
        }
        walletAddress = resolvedAddress;
        ensName = possibleEns;
      }

      const walletAddressLowercase = walletAddress.toLowerCase();

      const records = await db
        .with(namefiNftCte)
        .select({
          normalizedDomainName: namefiNftCte.normalizedDomainName,
          chainId: namefiNftCte.chainId,
          ownerAddress: namefiNftCte.ownerAddress,
          tokenId: namefiNftCte.tokenId,
          expirationTime: namefiNftCte.expirationTime,
        })
        .from(namefiNftCte)
        .where(
          sql`LOWER(${namefiNftCte.ownerAddress}) = ${walletAddressLowercase}`,
        )
        .orderBy(namefiNftCte.normalizedDomainName);

      return {
        walletAddress,
        ensName,
        domains: records.map((record) => ({
          normalizedDomainName: record.normalizedDomainName,
          chainId: record.chainId,
          ownerAddress: record.ownerAddress,
          tokenId: record.tokenId ? record.tokenId.toString() : null,
          expirationTime: record.expirationTime,
        })),
      };
    }),

  /**
   * Generates domain name suggestions based on a query string.
   * Combines the query with adjectives and colors to create unique domain names.
   * @param input.query - Base query string to generate suggestions from
   * @param input.parentDomains - Optional array of parent domains to append to generated names
   * @returns Domain information for all generated domain suggestions
   */
  queryDomain: authedOrPublicProcedure
    .input(
      z.object({
        // The base query string to generate domain suggestions from
        query: z.string(),
        // Optional array of parent domains
        parentDomains: z
          .array(namefiNormalizedDomainSchema)
          .optional()
          .default([]),
      }),
    )
    .query(async ({ input, ctx }) => {
      const poweredByNamefi3pDomains = await getPoweredByNamefi3PDomains();
      const allParentDomainsAreValid = input.parentDomains.every((domain) =>
        poweredByNamefi3pDomains.includes(domain),
      );

      if (!allParentDomainsAreValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid parent domains',
        });
      }
      const domains: string[] = [];
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
      return getDomainListInfo(normalizeDomains, ctx.user);
    }),

  get0xDotCityPercentageRollout: publicProcedure.query(async () => 100),
});
