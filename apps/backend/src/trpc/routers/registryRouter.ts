import {
  checksumWalletAddressSchema,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { registryContract } from '@namefi-astra/common/contract/registry-contract';
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
  getPoweredByNamefi3PDomainsDetails,
  getTldPricingTable,
} from '#lib/namefi-registry';
import { authedOrPublicProcedure, publicProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';
import { TRPCError } from '@trpc/server';
import { sql } from 'drizzle-orm';
import { resolveEnsNameToAddress } from '#lib/crypto/ens';

/**
 * Schema for parsing and validating an array of normalized domain names.
 * Used internally by handlers below to coerce raw user-typed strings into
 * the branded `NamefiNormalizedDomain` type before calling backend
 * services. The contract's input schema accepts the same array but
 * doesn't apply the `normalizeDomainName` transform — the handler does.
 */
const parseNormalizedDomainsArraySchema = z.array(
  z.string().transform(normalizeDomainName).pipe(namefiNormalizedDomainSchema),
);

export const registryRouter = createContractTRPCRouter<typeof registryContract>(
  {
    /**
     * Retrieves information for a list of domain names.
     * @param input.domains - Array of domain names to get information for
     * @returns Domain information for the provided domains
     */
    getDomainListInfo: authedOrPublicProcedure
      .input(registryContract.getDomainListInfo.input)
      .output(registryContract.getDomainListInfo.output)
      .query(({ input, ctx }) => getDomainListInfo(input.domains, ctx.user)),

    /**
     * Retrieves information for a single domain name.
     * @param input.domain - The domain name to get information for
     * @returns Domain information for the provided domain
     */
    getDomainInfo: authedOrPublicProcedure
      .input(registryContract.getDomainInfo.input)
      .output(registryContract.getDomainInfo.output)
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

    getTldPricingTable: authedOrPublicProcedure
      .input(registryContract.getTldPricingTable.input)
      .output(registryContract.getTldPricingTable.output)
      .query(async () => {
        const [tldPricing, pbnDomainDetails] = await Promise.all([
          getTldPricingTable(),
          getPoweredByNamefi3PDomainsDetails(),
        ]);
        const pbnDomains = pbnDomainDetails.map((domain) => ({
          normalizedDomainName: domain.normalizedDomainName,
          costPerYearInUsd: domain.costPerYearInUsdCents / 100,
        }));
        return { tldPricing, pbnDomains };
      }),

    getDomainsByOwner: publicProcedure
      .input(registryContract.getDomainsByOwner.input)
      .output(registryContract.getDomainsByOwner.output)
      .query(async ({ input }) => {
        // Normalize the identifier the same way the previous inline schema
        // did via `.transform((value) => value.trim())`.
        input = { identifier: input.identifier.trim() };
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
      .input(registryContract.queryDomain.input)
      .output(registryContract.queryDomain.output)
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
        const normalizeDomains =
          parseNormalizedDomainsArraySchema.parse(domains);
        return getDomainListInfo(normalizeDomains, ctx.user);
      }),

    get0xDotCityPercentageRollout: publicProcedure
      .input(registryContract.get0xDotCityPercentageRollout.input)
      .output(registryContract.get0xDotCityPercentageRollout.output)
      .query(async () => 100),
  },
);
