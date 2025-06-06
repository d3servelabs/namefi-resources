import { db, orderItemStatusSchema, orderStatusSchema } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { addWeeks, isAfter, subDays } from 'date-fns';
import { ParseResultType, parseDomain } from 'parse-domain';
import { isNil } from 'ramda';
import { config } from '#lib/env';
import { userQualifiesForDomainNamePromo } from '../trpc/routers/usersRouter';
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

export const getPoweredByNamefi3PDomains = () => {
  return Promise.resolve(['0x.city'] as NamefiNormalizedDomain[]);
};

// biome-ignore lint/suspicious/useAwait: it will be a db query in upcoming updates
export const getSubdomainPriceInUsd = async (
  _subdomain: string, // not using this
  isFreeMint: boolean,
) => {
  return isFreeMint ? 0 : 5;
};

/**
 * Retrieves information about a list of domain names including their availability, price, and current owner.
 * @param domains - Array of normalized domain names to query
 * @returns Array of domain information objects containing availability, price, and owner details
 */
export const getDomainListInfo = async (
  domains: NamefiNormalizedDomain[],
  user?: { privyUserId: string } | null,
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

      const prefix = domainParseResult.subDomains[0] as NamefiNormalizedDomain; //TODO: this only works for selling third level domains

      // Apex ‑ we currently don’t allow registering the parent domain itself
      if (!prefix) {
        return unavailableDomainInfo;
      }

      const parentDomain = domainParseResult.labels
        .slice(1)
        .join('.') as NamefiNormalizedDomain; //TODO: this only works for selling third level domains
      // Check if the domain is too short
      if (prefix.length <= 3) {
        return unavailableDomainInfo;
      }

      // Check if the domain is reserved
      if (isReserved(prefix)) {
        return unavailableDomainInfo;
      }

      // Currently only 0x.city is supported
      if (parentDomain === '0x.city') {
        const currentPercentage = get0xDotCityPercentageRollout();
        // we only enable a percentage of subdomain registrations for 0x.city
        // we use keccak256 to hash the domain and check if the last 4 bytes are less than PERCENT of the total number of subdomains
        const shouldRollout = hashBasedPercentageRollouted(
          domain,
          currentPercentage,
        );

        let userQualifiesFor0xDotCity = false;
        if (!shouldRollout) {
          if (!user?.privyUserId) {
            return unavailableDomainInfo;
          }
          userQualifiesFor0xDotCity = await userQualifiesForDomainNamePromo({
            normalizedDomainName: domain,
            user,
          });
          if (!userQualifiesFor0xDotCity) {
            return unavailableDomainInfo;
          }
        }

        const orderItemsWithOrder = await db.query.orderItemsTable.findMany({
          where: (orderItems, { and, ilike, or, gt, eq }) =>
            and(
              ilike(orderItems.normalizedDomainName, domain),
              or(
                eq(orderItems.status, orderItemStatusSchema.Enum.PROCESSING),
                and(
                  // CREATED should be also constrained by date, since we don't want old unprocessed orders to prevent repurchase
                  eq(orderItems.status, orderItemStatusSchema.Enum.CREATED),
                  gt(orderItems.createdAt, subDays(new Date(), 1)), //TODO: this is a temporary constraint, we should find a better way to do this or at least define certain limits for duration of unprocessed orders
                ),
              ),
            ),
          //TODO: temporary, use a leftjoin or a view instead
          with: {
            order: true,
          },
        });
        //TODO: temporary, use a leftjoin or a view instead
        const orderItems = orderItemsWithOrder.filter((orderItem) => {
          if (orderItem.status === orderItemStatusSchema.Enum.CREATED) {
            return (
              [
                orderStatusSchema.Enum.PROCESSING,
                orderStatusSchema.Enum.CREATED,
              ] as any
            ).includes(orderItem.order.status);
          }
          return true;
        });

        if (orderItems.length > 0) {
          return unavailableDomainInfo;
        }

        // Look up the NFT and price information
        const nft = nftMap.get(domain);
        const isFreeMint = userQualifiesFor0xDotCity;
        const price = await getSubdomainPriceInUsd(domain, isFreeMint);

        // Return domain information including availability, price, and current owner
        return {
          domain,
          availability: isNil(nft),
          priceInUSD: price,
          currentOwner: nft?.ownerAddress,
        };
      }

      return unavailableDomainInfo;
    }),
  );
};

export const get0xDotCityPercentageRollout = () => {
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
    currentPercentage = 1;
  }

  return currentPercentage;
};
