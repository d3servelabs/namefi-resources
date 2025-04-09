import { createHash } from 'node:crypto';
import { db } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { ParseResultType, parseDomain } from 'parse-domain';
import { isNil } from 'ramda';
import { config } from '#lib/env';

const _mockDeterministicRandomAvailability = (
  domainLdh: NamefiNormalizedDomain,
) => {
  // use the domainLdh to generate a deterministic random number
  const hash = createHash('sha256').update(domainLdh).digest('hex');
  const randomNumber = Number.parseInt(hash.slice(0, 8), 16) % 100;
  return randomNumber > 50;
};

const _mockDeterministicRandomOwner = (domain: NamefiNormalizedDomain) => {
  // use the domainLdh to generate a deterministic random owner
  const hash = createHash('sha256').update(domain).digest('hex');
  return hash.slice(0, 8);
};

// TODO: move to trpc, used only by apps/backend/src/trpc/routers/searchRouter.test.ts
export const _mockGetDomainInfo = async (domains: NamefiNormalizedDomain[]) => {
  // MOCK response. Respond the query term as is, plus 2 variations of it.
  return domains.map((domain: NamefiNormalizedDomain) => ({
    domain,
    availability: _mockDeterministicRandomAvailability(domain),
    priceInUSD: 5, // XXX: always 5 USD for mock
    currentOwner: _mockDeterministicRandomOwner(domain),
    // expiration date will not be supplied for now as we are not creating a concept of expiration date in pilot phase.
  }));
};

// biome-ignore lint/suspicious/useAwait: it will be a db query in upcoming updates
export const getPoweredByNamefi3PDomains = async () => {
  const fromDb: string[] = [];
  const fromConfig =
    config.ADDITIONAL_POWERED_BY_NAMEFI_THIRD_PARTY_DOMAINS as string[];
  return Promise.resolve([...fromDb, ...fromConfig]);
};

// biome-ignore lint/suspicious/useAwait: it will be a db query in upcoming updates
export const getSubdomainPriceInUsd = async (subdomain: string) => {
  return 5;
};

/**
 * Retrieves information about a list of domain names including their availability, price, and current owner.
 * @param domains - Array of normalized domain names to query
 * @returns Array of domain information objects containing availability, price, and owner details
 */
// TODO: move to trpc, used only by apps/backend/src/trpc/routers/registryRouter.ts, apps/backend/src/trpc/routers/searchRouter.ts, apps/backend/src/trpc/routers/searchRouter.test.ts
export const getDomainListInfo = async (domains: NamefiNormalizedDomain[]) => {
  // Query the database for NFTs matching the provided domain names
  const nfts = await db.query.namefiNftTable.findMany({
    where: (nft, { inArray }) => inArray(nft.normalizedDomainName, domains),
  });

  // Create a map of domain names to their corresponding NFT records for efficient lookup
  const nftMap = new Map(nfts.map((nft) => [nft.normalizedDomainName, nft]));

  return Promise.all(
    domains.map(async (domain) => {
      // Parse the domain to extract its components
      const domainParseResult = parseDomain(domain);
      // Return default values for invalid or unsupported domains
      if (domainParseResult.type !== ParseResultType.Listed) {
        return {
          domain,
          availability: false,
          priceInUSD: null,
          currentOwner: null,
        };
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
