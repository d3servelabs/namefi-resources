import { db } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { addWeeks, isAfter } from 'date-fns';
import { ParseResultType, parseDomain } from 'parse-domain';
import { isNil } from 'ramda';
import { config } from '#lib/env';
import {
  hashBasedPercentageRollouted,
  isReserved,
} from './namefi-registry-helpers';

// biome-ignore lint/suspicious/useAwait: it will be a db query in upcoming updates
export const getPoweredByNamefi3PHostnames = async () => {
  const fromDb: string[] = [];
  const fromConfig = config.POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES;
  return Promise.resolve([...fromDb, ...fromConfig]);
};

// biome-ignore lint/suspicious/useAwait: it will be a db query in upcoming updates
export const getSubdomainPriceInUsd = async (_subdomain: string) => {
  return 5;
};

/**
 * Retrieves information about a list of domain names including their availability, price, and current owner.
 * @param domains - Array of normalized domain names to query
 * @returns Array of domain information objects containing availability, price, and owner details
 */
export const getDomainListInfo = async (
  domains: NamefiNormalizedDomain[],
): Promise<
  {
    domain: NamefiNormalizedDomain;
    availability: boolean;
    priceInUSD: number | undefined;
    currentOwner: string | undefined;
  }[]
> => {
  // Query the database for NFTs matching the provided domain names
  const nfts = await db.query.namefiNftTable.findMany({
    where: (nft, { inArray }) => inArray(nft.normalizedDomainName, domains),
  });

  // Create a map of domain names to their corresponding NFT records for efficient lookup
  const nftMap = new Map(nfts.map((nft) => [nft.normalizedDomainName, nft]));

  return Promise.all(
    domains.map(async (domain) => {
      const unavailableDomainInfo = {
        domain,
        availability: false,
        priceInUSD: undefined,
        currentOwner: undefined,
      };
      // Parse the domain to extract its components
      const domainParseResult = parseDomain(domain);
      // Return default values for invalid or unsupported domains
      if (domainParseResult.type !== ParseResultType.Listed) {
        return unavailableDomainInfo;
      }

      const prefix = domainParseResult.subDomains[0] as NamefiNormalizedDomain;

      // Apex ‑ we currently don’t allow registering the parent domain itself
      if (!prefix) return unavailableDomainInfo;

      const parentDomain = domainParseResult.subDomains
        .slice(1)
        .join('.') as NamefiNormalizedDomain;
      // Check if the domain is too short
      if (prefix.length <= 3) return unavailableDomainInfo;

      // Check if the domain is reserved
      if (isReserved(prefix)) return unavailableDomainInfo;

      if (parentDomain === '0x.city') {
        // schedule of percentage
        const startDate = new Date('2025-05-05');
        let currentPercentage = 0;
        const today = new Date();

        if (isAfter(today, addWeeks(startDate, 3))) {
          currentPercentage = 100;
        } else if (isAfter(today, addWeeks(startDate, 2))) {
          currentPercentage = 30;
        } else if (isAfter(today, addWeeks(startDate, 1))) {
          currentPercentage = 10;
        } else {
          currentPercentage = 0;
        }
        // we only enable a percentage of subdomain registrations for 0x.city
        // we use keccak256 to hash the domain and check if the last 4 bytes are less than PERCENT of the total number of subdomains
        if (!hashBasedPercentageRollouted(domain, currentPercentage))
          return unavailableDomainInfo;
      }

      // Look up the NFT and price information
      const nft = nftMap.get(domain);
      const price = await getSubdomainPriceInUsd(domain);

      // Return domain information including availability, price, and current owner
      return {
        domain,
        availability: isNil(nft),
        priceInUSD: price,
        currentOwner: nft?.ownerAddress,
      };
    }),
  );
};
