import {
  db,
  indexedDomainsTable,
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
import { groupBy, isNil } from 'ramda';
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
import { secrets } from '#lib/env';
import { logger } from '#lib/logger';
import { computeChargesInUsdOrThrow } from '@namefi-astra/registrars/multi-year-pricing';
import { getDomainDurationConstraints } from './domains/duration-constraints';
import pMap from 'p-map';

export type NamefiNftSelect = typeof namefiNftTable.$inferSelect;

export const sldRegistrar = createRegistrarService({
  aws: {
    region: config.AWS_REGION,
    accessKeyId: secrets.AWS_ACCESS_KEY_ID,
    secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
  },
  dynadot: {
    gdgApiKey: secrets.DYNADOT_GDG_API_KEY,
    regularApiKey: secrets.DYNADOT_REGULAR_API_KEY,
    privateKey: secrets.DYNADOT_PRIVATE_KEY,
    accountId: secrets.DYNADOT_ACCOUNT_ID,
    baseUrl: config.DYNADOT_BASE_URL,
  },
  customLogger: logger,
  getRegistrarKeyForExistingDomain: async (domain: NamefiNormalizedDomain) => {
    const indexedDomain = await db.query.indexedDomainsTable.findFirst({
      where: eq(indexedDomainsTable.normalizedDomainName, domain),
    });
    if (indexedDomain) {
      return indexedDomain.registrarKey;
    }
    return null;
  },
  redisClientOptions: secrets.LIMITER_REDIS_HOST
    ? {
        host: secrets.LIMITER_REDIS_HOST,
        port: secrets.LIMITER_REDIS_PORT,
        username: secrets.LIMITER_REDIS_USER,
        password: secrets.LIMITER_REDIS_PASSWORD,
      }
    : undefined,
});

const generateUnavailableDomainInfo = (domain: NamefiNormalizedDomain) => ({
  domain,
  availability: false,
  pricingDetails: undefined,
  currentOwner: undefined,
  registrarKey: undefined,
  durationValidationInYears: {
    min: 1,
    max: 10,
  },
  importable: false,
});

export const getPoweredByNamefi3PDomains = () => {
  const fromDb: string[] = [];
  return Promise.resolve([
    ...fromDb,
    '0x.city',
    'taylor.cv',
  ] as NamefiNormalizedDomain[]);
};

// biome-ignore lint/suspicious/useAwait: it will be a db query in upcoming updates
export const getPoweredByNamefi3PHostnames = async () => {
  const directDomains = await getPoweredByNamefi3PDomains();
  const fromConfig = config.POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES;
  return Promise.resolve([...directDomains, ...fromConfig]);
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
  importable: boolean;
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
  const [nfts, pendingOrdersMap] = await Promise.all([
    db.query.namefiNftTable.findMany({
      where: (nft, { inArray }) => inArray(nft.normalizedDomainName, domains),
    }),
    checkIfDomainsHavePendingOrders(domains),
  ]);

  // Create a map of domain names to their corresponding NFT records for efficient lookup
  const nftMap = new Map(
    nfts.map((nft) => [nft.normalizedDomainName, nft]),
  ) as Map<NamefiNormalizedDomain, NamefiNftSelect>;

  const { sld = [], _3ld = [] } = groupBy((domain) => {
    // Parse the domain to extract its components
    const domainParseResult = parseDomain(domain);
    // Return default values for invalid or unsupported domains
    if (domainParseResult.type !== ParseResultType.Listed) {
      return 'invalid';
    }
    // if the domain has a pending order, return 'order-pending'
    if (pendingOrdersMap.get(domain)?.hasPendingOrders) {
      return 'orderPending';
    }

    const { levels } = getDomainLevels(domain);
    if (levels.length === 2) {
      return 'sld';
    }
    if (levels.length === 3) {
      return '_3ld';
    }

    return 'invalid';
  }, domains);

  const [sldDomainsResponse, _3ldDomainsResponse] = await Promise.all([
    _getSldDomainListInfo(sld, nftMap),
    Promise.all(
      _3ld.map(
        async (domain) => await _get3ldDomainListInfo(domain, nftMap, user),
      ),
    ),
  ]);

  const sldDomains = new Map(
    sldDomainsResponse?.map((domain) => [domain.domain, domain]) ?? [],
  );
  const _3ldDomains = new Map(
    _3ldDomainsResponse?.map((domain) => [domain.domain, domain]) ?? [],
  );

  return domains.map((domain) => {
    const domainInfo = sldDomains.get(domain) || _3ldDomains.get(domain);
    if (isNil(domainInfo)) {
      return generateUnavailableDomainInfo(domain);
    }
    return domainInfo;
  });
};

export const getPercentageRollout = (parentDomain: NamefiNormalizedDomain) => {
  // schedule of percentage
  let currentPercentage = 0;
  if (parentDomain === '0x.city') {
    const startDate = new Date('2025-05-05');

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
  }

  return currentPercentage;
};

const _getSldDomainListInfo = async (
  domains: NamefiNormalizedDomain[],
  nftMap: Map<NamefiNormalizedDomain, NamefiNftSelect>,
) => {
  const responseOrError = await resolve(
    sldRegistrar.bulkSearch(domains.map(toPunycodeDomainName)),
  );

  if (responseOrError.failed) {
    return domains.map(generateUnavailableDomainInfo);
  }

  const responses = responseOrError.result;
  return pMap(responses, async (response) => {
    const domain = response.domainName;

    // Look up the NFT and price information
    const nft = nftMap.get(domain);

    const pricingDetails = response.price;
    if (isNil(pricingDetails)) {
      return generateUnavailableDomainInfo(domain);
    }
    const available = response.available === DomainAvailability.AVAILABLE;
    const importable =
      !available &&
      isNil(nft) &&
      computeChargesInUsdOrThrow(pricingDetails.importPrice, 1) > 0;

    let durationConstraints = { minYears: 1, maxYears: 10 };
    try {
      durationConstraints = await getDomainDurationConstraints(domain);
    } catch (error) {
      logger.error(
        `Error getting duration constraints for ${domain}: ${error}`,
      );
    }

    return {
      domain: namefiNormalizedDomainSchema.parse(response.domainName),
      availability: available,
      importable,
      pricingDetails,
      currentOwner: nft?.ownerAddress,
      registrarKey: response.registrarKey,
      durationValidationInYears: {
        min: durationConstraints.minYears,
        max: durationConstraints.maxYears,
      },
    };
  });
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

  const poweredByNamefi3pDomains = await getPoweredByNamefi3PDomains();
  if (
    poweredByNamefi3pDomains.includes(parentDomain as NamefiNormalizedDomain)
  ) {
    const currentPercentage = getPercentageRollout(
      parentDomain as NamefiNormalizedDomain,
    );
    // we only enable a percentage of subdomain registrations
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
    let durationConstraints = { minYears: 1, maxYears: 10 };
    try {
      durationConstraints = await getDomainDurationConstraints(domain);
    } catch (error) {
      logger.error(
        `Error getting duration constraints for ${domain}: ${error}`,
      );
    }

    // Return domain information including availability, price, and current owner
    return {
      domain,
      availability: isNil(nft),
      importable: false,
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
      durationValidationInYears: {
        min: durationConstraints.minYears,
        max: durationConstraints.maxYears,
      },
      registrarKey: 'namefi',
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
