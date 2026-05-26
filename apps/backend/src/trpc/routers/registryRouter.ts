import {
  checksumWalletAddressSchema,
  NAMEFI_NFT_CONTRACT_ADDRESS,
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
import { inArray, sql } from 'drizzle-orm';
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
     * Resolve Namefi domain details for a batch of NFT `(chainId, tokenId)`
     * pairs. Powers the cross-marketplace "My Listings & Offers" panel on
     * `/domains`, which only has `(tokenAddress, tokenId)` from
     * OpenSea/Rarible orders and needs to display the human-readable
     * domain name + image.
     *
     * Returns one entry per input `tokenIds[i]` in the same order; a
     * `null` slot means the token isn't a Namefi domain on that chain
     * (either the contract address doesn't match the singleton Namefi
     * NFT contract, or the on-chain indexer has no row for that pair).
     */
    getDomainDetailsByTokenIds: publicProcedure
      .input(registryContract.getDomainDetailsByTokenIds.input)
      .output(registryContract.getDomainDetailsByTokenIds.output)
      .query(async ({ input }) => {
        const nullResults = {
          results: input.tokenIds.map(() => null),
        };
        // Single Namefi NFT contract address shared across chains. A
        // non-Namefi token can't be resolved here.
        if (
          input.contractAddress.toLowerCase() !==
          NAMEFI_NFT_CONTRACT_ADDRESS.toLowerCase()
        ) {
          return nullResults;
        }

        // Normalize each input tokenId to its canonical decimal form
        // (`String(BigInt(raw))`) so the lookup map keyed by the same
        // canonical form matches regardless of input encoding — e.g.
        // `"001"`, `"0x1"`, `" 1 "` all canonicalize to `"1"`. Invalid
        // inputs map to `null` and fall through to a null result slot
        // without using exceptions for control flow.
        const canonicalInputIds = input.tokenIds.map((raw) =>
          DECIMAL_OR_HEX_PATTERN.test(raw.trim())
            ? String(BigInt(raw.trim()))
            : null,
        );
        const queryBigInts = Array.from(
          new Set(canonicalInputIds.filter((id): id is string => id !== null)),
        ).map((id) => BigInt(id));
        if (queryBigInts.length === 0) return nullResults;

        const records = await db
          .with(namefiNftCte)
          .select({
            tokenId: namefiNftCte.tokenId,
            normalizedDomainName: namefiNftCte.normalizedDomainName,
            chainId: namefiNftCte.chainId,
            ownerAddress: namefiNftCte.ownerAddress,
            isLocked: namefiNftCte.isLocked,
            expirationTime: namefiNftCte.expirationTime,
          })
          .from(namefiNftCte)
          .where(
            sql`${namefiNftCte.chainId} = ${input.chainId} AND ${inArray(
              namefiNftCte.tokenId,
              queryBigInts,
            )}`,
          );

        const byCanonicalTokenId = new Map<string, (typeof records)[number]>();
        for (const row of records) {
          // `tokenId` is a `bigint` selected via `sql<bigint>` — `.toString()`
          // produces the same canonical decimal form as `canonicalInputIds`.
          byCanonicalTokenId.set(String(row.tokenId), row);
        }

        const chainSegment = chainSegmentForChainId(input.chainId);

        return {
          results: canonicalInputIds.map((canonicalId) => {
            if (canonicalId === null) return null;
            const row = byCanonicalTokenId.get(canonicalId);
            if (!row) return null;
            return {
              tokenId: canonicalId,
              chainId: row.chainId,
              normalizedDomainName: row.normalizedDomainName,
              expirationTime: row.expirationTime,
              ownerAddress: row.ownerAddress,
              isLocked: row.isLocked ?? false,
              imageUrl: `https://md.namefi.io/${chainSegment}/svg/${row.normalizedDomainName}/image.svg`,
              metadataUrl: `https://md.namefi.io/${row.normalizedDomainName}`,
            };
          }),
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

/**
 * Matches a non-empty decimal or `0x…` hex literal — the two input
 * encodings BigInt accepts without throwing. Used to gate
 * `getDomainDetailsByTokenIds` input normalization without resorting to
 * try/catch for control flow.
 */
const DECIMAL_OR_HEX_PATTERN = /^(?:\d+|0x[0-9a-fA-F]+)$/;

/**
 * Map an EVM chainId to the URL segment `md.namefi.io` uses for that
 * chain (e.g. `https://md.namefi.io/ethereum/svg/<domain>/image.svg`).
 * Falls back to `ethereum` for unknown chains so the URL is still
 * well-formed; the metadata CDN will 404 cleanly if the domain isn't
 * indexed there.
 */
function chainSegmentForChainId(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'ethereum';
    case 8453:
      return 'base';
    case 84532:
      return 'base-sepolia';
    case 11155111:
      return 'sepolia';
    default:
      return 'ethereum';
  }
}
