import { createHash } from 'node:crypto';
import { db } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { ParseResultType, parseDomain } from 'parse-domain';
import { isNil } from 'ramda';

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

/**
 * Retrieves information about a list of domain names including their availability, price, and current owner.
 * @param domains - Array of normalized domain names to query
 * @returns Array of domain information objects containing availability, price, and owner details
 */
export const getDomainListInfo = async (domains: NamefiNormalizedDomain[]) => {
  // Query the database for NFTs matching the provided domain names
  const nfts = await db.query.namefiNftTable.findMany({
    where: (nft, { inArray }) => inArray(nft.normalizedDomainName, domains),
  });

  // Create a map of domain names to their corresponding NFT records for efficient lookup
  const nftMap = new Map(nfts.map((nft) => [nft.normalizedDomainName, nft]));

  // Temporary hardcoded price mapping for parent domains
  //TODO: Replace with dynamic pricing system
  const parentDomainsToPriceMap = new Map([
    ['0x.city', 5],
    ['defi.build', 5],
  ]);

  return domains.map((domain) => {
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

    // Reconstruct the parent domain from the parsed components
    const parentDomain = [
      domainParseResult.domain,
      ...domainParseResult.topLevelDomains,
    ].join('.');

    // Look up the NFT and price information
    const nft = nftMap.get(domain);
    const price = parentDomainsToPriceMap.get(parentDomain);

    // Return domain information including availability, price, and current owner
    return {
      domain,
      availability: isNil(nft),
      priceInUSD: price,
      currentOwner: nft?.ownerAddress,
    };
  });
};

/**
 * @deprecated use getDomainListInfo instead
 */
export const getDomainInfo = getDomainListInfo;
