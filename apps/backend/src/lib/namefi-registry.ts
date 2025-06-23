import {
  db,
  type namefiNftTable,
  orderItemStatusSchema,
  orderItemsTable,
  orderStatusSchema,
  ordersTable,
} from '@namefi-astra/db';
import { createRegistrarService } from '@namefi-astra/registrars/registrars/main-registrar';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { addWeeks, isAfter, subDays } from 'date-fns';
import { ParseResultType, parseDomain } from 'parse-domain';
import { isNil } from 'ramda';
import { config } from '#lib/env';
import { userQualifiesForDomainNamePromo } from '#lib/userPromo';
import { getDomainLevels } from './get-domain-levels';
import {
  hashBasedPercentageRollouted,
  isReserved,
} from './namefi-registry-helpers';

import { DomainAvailability } from '@namefi-astra/registrars/lib/abstract-registrar/data/domain-availability';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';

import type { DomainPricingDetails } from '@namefi-astra/registrars/lib/abstract-registrar/index';
import { resolve } from '@namefi-astra/utils/promises/resolve';
import { and, eq, gt, inArray, or } from 'drizzle-orm';
import pMap from 'p-map';
import { secrets } from '#lib/env';
import { logger } from '#lib/logger';

export type NamefiNftSelect = typeof namefiNftTable.$inferSelect;

export const DOMAIN_DURATION_CONFIG = {
  min: 1,
  max: 10,
} as const;

export const sldRegistrar = createRegistrarService({
  AWS_REGION: config.AWS_REGION,
  AWS_ACCESS_KEY_ID: secrets.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: secrets.AWS_SECRET_ACCESS_KEY,
  DYNADOT_API_KEY: secrets.DYNADOT_API_KEY,
  DYNADOT_PRIVATE_KEY: secrets.DYNADOT_PRIVATE_KEY,
  DYNADOT_ACCOUNT_ID: secrets.DYNADOT_ACCOUNT_ID,
  DYNADOT_BASE_URL: config.DYNADOT_BASE_URL,
  customLogger: logger,
});

const generateUnavailableDomainInfo = (domain: NamefiNormalizedDomain) => ({
  domain,
  availability: false,
  pricingDetails: undefined,
  currentOwner: undefined,
  registrarKey: undefined,
  durationValidationInYears: DOMAIN_DURATION_CONFIG,
});

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

export type DomainAvailabilityInfo = {
  domain: NamefiNormalizedDomain;
  availability: boolean;
  /**
   * @remarks do not use this directly, only use computeChargesInUsdOrThrow
   */
  pricingDetails: DomainPricingDetails | undefined;
  /**
   * Current owner of the domain
   */
  currentOwner: string | undefined;
  registrarKey?: string;
  durationValidationInYears?: {
    min: number;
    max: number;
  };
};
/**
 * Retrieves information about a list of domain names including their availability, price, and current owner.
 * @param domains - Array of normalized domain names to query
 * @returns Array of domain information objects containing availability, price, and owner details
 */
export const getDomainListInfo = async (
  domains: NamefiNormalizedDomain[],
  user?: { privyUserId: string } | null,
): Promise<DomainAvailabilityInfo[]> => {
  // Query the database for NFTs matching the provided domain names
  const nfts = await db.query.namefiNftTable.findMany({
    where: (nft, { inArray }) => inArray(nft.normalizedDomainName, domains),
  });

  // Create a map of domain names to their corresponding NFT records for efficient lookup
  const nftMap = new Map(
    nfts.map((nft) => [nft.normalizedDomainName, nft]),
  ) as Map<NamefiNormalizedDomain, NamefiNftSelect>;

  //get a map of domains that have pending orders
  const pendingOrdersMap = await checkIfDomainsHavePendingOrders(domains);

  return pMap(
    domains,
    async (domain) => {
      const unavailableDomainInfo = generateUnavailableDomainInfo(domain);

      // Parse the domain to extract its components
      const domainParseResult = parseDomain(domain);
      // Return default values for invalid or unsupported domains
      if (
        domainParseResult.type !== ParseResultType.Listed ||
        pendingOrdersMap.get(domain)?.hasPendingOrders
      ) {
        return unavailableDomainInfo;
      }

      const { levels } = getDomainLevels(domain);

      if (levels.length === 2) {
        return await _getSldDomainListInfo(domain, nftMap);
      }
      if (levels.length === 3) {
        return await _get3ldDomainListInfo(domain, nftMap, user);
      }

      return unavailableDomainInfo;
    },
    {
      concurrency: 5,
    },
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

const _getSldDomainListInfo = async (
  domain: NamefiNormalizedDomain,
  nftMap: Map<NamefiNormalizedDomain, NamefiNftSelect>,
) => {
  const unavailableDomainInfo = generateUnavailableDomainInfo(domain);

  // Look up the NFT and price information
  const nft = nftMap.get(domain);

  const responseOrError = await resolve(
    sldRegistrar.searchForDomain(toPunycodeDomainName(domain)),
  );

  if (responseOrError.failed) {
    return unavailableDomainInfo;
  }
  const response = responseOrError.result;

  return {
    domain: namefiNormalizedDomainSchema.parse(response.result.domainName),
    availability: response.result.available === DomainAvailability.AVAILABLE,
    pricingDetails: response.result.price,
    currentOwner: nft?.ownerAddress,
    registrarKey: response.registrarKey,
    durationValidationInYears: DOMAIN_DURATION_CONFIG,
  };
};

const _get3ldDomainListInfo = async (
  domain: NamefiNormalizedDomain,
  nftMap: Map<NamefiNormalizedDomain, NamefiNftSelect>,
  user?: { privyUserId: string } | null,
) => {
  const { parentDomain, levels } = getDomainLevels(domain);
  const unavailableDomainInfo = generateUnavailableDomainInfo(domain);
  const prefix = levels[2];

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

    // Look up the NFT and price information
    const nft = nftMap.get(domain);
    const isFreeMint = userQualifiesFor0xDotCity;
    const price = await getSubdomainPriceInUsd(domain, isFreeMint);

    // Return domain information including availability, price, and current owner
    return {
      domain,
      availability: isNil(nft),
      pricingDetails: {
        registrationPrice: {
          type: 'PER_YEAR',
          price: { amount: price, currency: 'USD' },
        },
        renewalPrice: {
          type: 'PER_YEAR',
          price: { amount: price, currency: 'USD' },
        },
        importPrice: {
          type: 'PER_YEAR',
          price: { amount: price, currency: 'USD' },
        },
      },
      currentOwner: nft?.ownerAddress,
      durationValidationInYears: DOMAIN_DURATION_CONFIG,
    } satisfies DomainAvailabilityInfo;
  }

  return unavailableDomainInfo;
};

/**
 * Checks if the domains have pending orders
 * @param domains - Array of domain names to check
 * @returns Array of domain names that have pending orders
 */
const checkIfDomainsHavePendingOrders = async (
  domains: NamefiNormalizedDomain[],
) => {
  const orderItems = await db
    .select({
      normalizedDomainName: orderItemsTable.normalizedDomainName,
    })
    .from(orderItemsTable)
    .leftJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(
      and(
        inArray(orderItemsTable.normalizedDomainName, domains),
        and(
          or(
            eq(orderItemsTable.status, orderItemStatusSchema.Enum.PROCESSING),
            and(
              eq(orderItemsTable.status, orderItemStatusSchema.Enum.CREATED),
              gt(orderItemsTable.createdAt, subDays(new Date(), 1)), //TODO: this is a temporary constraint, we should find a better way to do this or at least define certain limits for duration of unprocessed orders
              eq(ordersTable.status, orderStatusSchema.Enum.PROCESSING),
            ),
          ),
        ),
      ),
    );

  const pendingOrdersMap = new Map(
    domains.map((domain) => [domain, { hasPendingOrders: false }]),
  );

  for (const orderItem of orderItems) {
    pendingOrdersMap.set(
      orderItem.normalizedDomainName as NamefiNormalizedDomain,
      {
        hasPendingOrders: true,
      },
    );
  }

  return pendingOrdersMap;
};
