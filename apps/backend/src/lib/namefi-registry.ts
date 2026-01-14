import {
  db,
  pbnIssuanceReservationsTable,
  namefiNftOwnersView,
  namefiNftOwnersCte,
  orderItemStatusSchema,
  orderItemsTable,
  orderStatusSchema,
  ordersTable,
  usersTable,
  type PoweredByNamefiDomainSelect,
} from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import type { DomainAvailabilityInfo } from '@namefi-astra/contracts/domain-availability';
import { subDays } from 'date-fns';
import { ParseResultType, parseDomain } from 'parse-domain';
import { groupBy, isNil, pluck, filter, isNotNil, last } from 'ramda';
import { config } from '#lib/env';
import { userQualifiesForDomainNamePromo } from '#lib/user-promo';
import { getDomainLevels } from './get-domain-levels';
import {
  hashBasedPercentageRollouted,
  isReservedKeywordForParentDomain,
} from './namefi-registry-helpers';

import { DomainAvailability } from '@namefi-astra/registrars/lib/abstract-registrar/data/domain-availability';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';

import type {
  DomainPricingDetails,
  PricingDetails,
} from '@namefi-astra/registrars/lib/abstract-registrar/index';
import { resolve } from '@namefi-astra/utils/promises/resolve';
import { and, eq, gt, inArray, isNull, or, sql, ne } from 'drizzle-orm';
import { logger } from '#lib/logger';
import { computeChargesInUsdOrThrow } from '@namefi-astra/registrars/multi-year-pricing';
import { getDomainDurationConstraints } from './domains/duration-constraints';
import pMap from 'p-map';
import { maybeGetUserEmail } from '#temporal/activities/notify.activities';
import type { NamefiNftOwnersSelect } from '@namefi-astra/db';
import { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import { sldRegistrar } from './epp-registrars';

export { sldRegistrar };

const generateUnavailableDomainInfo = (
  domain: NamefiNormalizedDomain,
  supported = false,
) => ({
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
  supported: supported,
});

const HARDCODED_3P_DOMAINS_NAMES = [
  '0x.city',
  'taylor.cv',
  'ali.cv',
  'li.cv',
  'muller.cv',
  'kumar.cv',
  'victor.cv',
  'starts.today',
  'ends.today',
  'promos.today',
  'available.today',
  'discounts.today',
] as NamefiNormalizedDomain[];

const HARDCODED_3P_DOMAINS = HARDCODED_3P_DOMAINS_NAMES.map(
  (domain) =>
    ({
      normalizedDomainName: domain,
      startRolloutAt: domain === '0x.city' ? subDays(new Date(), 1) : null,
      costPerYearInUsdCents: 500,
      enabled: domain === '0x.city',
      additionalAllowedHostnames: filter(isNotNil, [
        ...(config.NAMEFI_FIRST_PARTY_HOSTNAMES.includes('poweredby.namefi.io')
          ? [`${domain}.astra.namefi.io`, `${domain}.poweredby.namefi.io`]
          : []),
        ...(config.NAMEFI_FIRST_PARTY_HOSTNAMES.includes('poweredby.namefi.dev')
          ? [`${domain}.astra.namefi.dev`, `${domain}.poweredby.namefi.dev`]
          : []),
        ...(config.NAMEFI_FIRST_PARTY_HOSTNAMES.includes('localhost')
          ? [`${domain}.localhost`]
          : []),
      ]),
      durationConstraints: {
        minDurationInYears: 1,
        maxDurationInYears: 1,
      },
      additionalReservedNames: [],
      ownerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
    }) satisfies PoweredByNamefiDomainSelect,
);

const HARDCODED_ADDITIONAL_ALLOWED_HOSTNAMES_MAP = new Map(
  HARDCODED_3P_DOMAINS.flatMap((domain) => {
    return domain.additionalAllowedHostnames.map((hostname) => [
      hostname,
      domain.normalizedDomainName,
    ]);
  }),
);

export const getPoweredByNamefi3PDomainsDetails = async () => {
  const poweredbyNamefiDomains =
    await db.query.poweredbyNamefiDomainsTable.findMany();
  const namesFromDb: string[] = pluck(
    'normalizedDomainName',
    poweredbyNamefiDomains,
  );
  const fromConfig = HARDCODED_3P_DOMAINS.filter(
    (domain) => !namesFromDb.includes(domain.normalizedDomainName),
  );
  return [...poweredbyNamefiDomains, ...fromConfig];
};

export const getSinglePoweredByNamefi3PDomainsDetails = async (
  normalizeDomainName: NamefiNormalizedDomain,
) => {
  const fromDb = await db.query.poweredbyNamefiDomainsTable.findFirst({
    where: (table, { eq }) =>
      eq(table.normalizedDomainName, normalizeDomainName),
  });

  if (fromDb) {
    return fromDb;
  }

  const fromConfig = HARDCODED_3P_DOMAINS.find(
    (domain) => domain.normalizedDomainName === normalizeDomainName,
  );
  return fromConfig ?? null;
};

export const getPoweredByNamefi3PDomains = async () => {
  const poweredbyNamefiDomains = await getPoweredByNamefi3PDomainsDetails();
  const fromDb: string[] = pluck(
    'normalizedDomainName',
    poweredbyNamefiDomains,
  );

  return Array.from(new Set(fromDb as NamefiNormalizedDomain[]));
};

export const getPoweredByNamefiDomainFromHostname = async (
  _hostname: string,
) => {
  const hostname = _hostname.toLowerCase().trim();

  const fromHardcoded =
    HARDCODED_ADDITIONAL_ALLOWED_HOSTNAMES_MAP.get(hostname);
  if (fromHardcoded) {
    return fromHardcoded;
  }
  if (HARDCODED_3P_DOMAINS_NAMES.includes(hostname as NamefiNormalizedDomain)) {
    return hostname;
  }

  const poweredbyNamefiDomains =
    await db.query.poweredbyNamefiDomainsTable.findFirst({
      where: (domain, { and, or, eq }) =>
        and(
          or(
            sql<boolean>`${hostname} = ANY(${domain.additionalAllowedHostnames})`,
            eq(domain.normalizedDomainName, hostname as NamefiNormalizedDomain),
          ),
          eq(domain.enabled, true),
        ),
      columns: { normalizedDomainName: true },
    });

  return poweredbyNamefiDomains?.normalizedDomainName;
};

export const getPoweredByNamefi3PHostnames = async () => {
  const poweredbyNamefiDomains = await getPoweredByNamefi3PDomainsDetails();

  return Array.from(
    new Set(
      poweredbyNamefiDomains.flatMap((domain) => [
        ...(domain.additionalAllowedHostnames ?? []),
        domain.normalizedDomainName,
      ]),
    ),
  );
};

export const getSubdomainPriceInUsd = async (
  _subdomain: NamefiNormalizedDomain,
  isFreeMint: boolean,
) => {
  if (isFreeMint) return 0;
  const { parentDomain, levels } = getDomainLevels(_subdomain);
  // Validate that this is actually a subdomain
  if (!(levels?.length >= 3)) {
    logger.warn(
      `getSubdomainPriceInUsd called with non-subdomain: ${_subdomain}`,
    );
    return null;
  }
  if (!parentDomain) {
    logger.warn(
      `getSubdomainPriceInUsd cannot determine parent domain for subdomain ${_subdomain}`,
    );
    return null;
  }
  const poweredbyNamefiDomain =
    await getSinglePoweredByNamefi3PDomainsDetails(parentDomain);
  if (
    !poweredbyNamefiDomain ||
    poweredbyNamefiDomain.enabled === false ||
    isNil(poweredbyNamefiDomain.costPerYearInUsdCents)
  ) {
    return null;
  }
  return poweredbyNamefiDomain.costPerYearInUsdCents / 100;
};

export type { DomainAvailabilityInfo };

export type TldPricingInfo = {
  tld: string;
  registrarKey: Registrars;
  /**
   * Price (USD) for one year of registration.
   */
  registrationPriceUsdPerYear: number | null;
  /**
   * Price (USD) for one year of renewal.
   */
  renewalPriceUsdPerYear: number | null;
  /**
   * Price (USD) for one year transfer/import.
   */
  transferPriceUsdPerYear: number | null;
};

type TldPricingBestEntry = {
  registrarKey: Registrars;
  pricing: DomainPricingDetails;
  registrationUsdPerYear: number | null;
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
  const [nfts, pendingOrdersMap, reservedDomainsMap] = await Promise.all([
    db
      .with(namefiNftOwnersCte)
      .select()
      .from(namefiNftOwnersView)
      .where(inArray(namefiNftOwnersView.normalizedDomainName, domains)),
    checkIfDomainsHavePendingOrders(domains),
    checkIfDomainsAreReserved(domains, user),
  ]);

  // Create a map of domain names to their corresponding NFT records for efficient lookup
  const nftMap = new Map(
    nfts.map((nft) => [nft.normalizedDomainName, nft]),
  ) as Map<NamefiNormalizedDomain, NamefiNftOwnersSelect>;

  const { eppDomain = [], subdomain = [] } = groupBy((domain) => {
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
    // if the domain is reserved to a different user (exact domain match), return 'unavailable'
    if (reservedDomainsMap.get(domain)?.isReservedToDifferentUser) {
      return 'unavailable';
    }

    const { levels } = getDomainLevels(domain);
    if (!(levels.length >= 2)) {
      return 'invalid';
    }
    if (levels.length === 2) {
      return 'eppDomain';
    }
    if (levels.length >= 3) {
      return 'subdomain';
    }

    return 'invalid';
  }, domains);

  const [eppDomainsResponse, subdomainsResponse] = await Promise.all([
    _getEppDomainListInfo(eppDomain, nftMap),
    Promise.all(
      subdomain.map(
        async (domain) => await _getSubdomainListInfo(domain, nftMap, user),
      ),
    ),
  ]);

  const eppDomains = new Map(
    eppDomainsResponse?.map((domain) => [domain.domain, domain]) ?? [],
  );
  const subdomains = new Map(
    subdomainsResponse?.map((domain) => [domain.domain, domain]) ?? [],
  );

  return domains.map((domain) => {
    const domainInfo = eppDomains.get(domain) || subdomains.get(domain);
    if (isNil(domainInfo)) {
      return generateUnavailableDomainInfo(domain);
    }
    return domainInfo;
  });
};

export const getTldPricingTable = async (): Promise<TldPricingInfo[]> => {
  const registrarsPricing = await sldRegistrar.getRegistrarsTldPricing();
  const bestByTld = new Map<string, TldPricingBestEntry>();

  const registrarEntries = Object.entries(registrarsPricing) as [
    Registrars,
    Record<string, DomainPricingDetails>,
  ][];

  for (const [registrarKey, tldPricingMap] of registrarEntries) {
    for (const [tld, pricing] of Object.entries(tldPricingMap)) {
      const registrationUsdPerYear = getUsdAmountPerYear(
        pricing.registrationPrice,
      );
      const existing = bestByTld.get(tld);

      if (
        !existing ||
        shouldReplaceBestEntry(existing, {
          registrarKey,
          registrationUsdPerYear,
        })
      ) {
        bestByTld.set(tld, {
          registrarKey,
          pricing,
          registrationUsdPerYear,
        });
      }
    }
  }

  return Array.from(bestByTld.entries())
    .map(([tld, entry]) => ({
      tld,
      registrarKey: entry.registrarKey,
      registrationPriceUsdPerYear: entry.registrationUsdPerYear,
      renewalPriceUsdPerYear: getUsdAmountPerYear(entry.pricing.renewalPrice),
      transferPriceUsdPerYear: getUsdAmountPerYear(entry.pricing.importPrice),
    }))
    .sort((a, b) => a.tld.localeCompare(b.tld));
};

const getUsdAmountPerYear = (
  pricingDetails?: PricingDetails | null,
): number | null => {
  if (!pricingDetails) {
    return null;
  }

  return computeChargesInUsdOrThrow(pricingDetails, 1);
};

const shouldReplaceBestEntry = (
  current: TldPricingBestEntry,
  candidate: Pick<
    TldPricingBestEntry,
    'registrarKey' | 'registrationUsdPerYear'
  >,
) => {
  const currentUsd = current.registrationUsdPerYear;
  const candidateUsd = candidate.registrationUsdPerYear;

  if (candidateUsd === null) {
    return false;
  }

  if (currentUsd === null) {
    return true;
  }

  if (candidateUsd < currentUsd) {
    return true;
  }

  if (candidateUsd === currentUsd) {
    return preferRegistrar(candidate.registrarKey, current.registrarKey);
  }

  return false;
};

const preferRegistrar = (
  candidate: Registrars,
  current: Registrars,
): boolean => {
  const priority = {
    [Registrars.DynadotGdg]: 1,
    [Registrars.DynadotRegular]: 2,
  };

  const candidatePriority = priority[candidate];
  const currentPriority = priority[current];

  if (candidatePriority === undefined || currentPriority === undefined) {
    return false;
  }

  return candidatePriority < currentPriority;
};

const _getEppDomainListInfo = async (
  domains: NamefiNormalizedDomain[],
  nftMap: Map<NamefiNormalizedDomain, NamefiNftOwnersSelect>,
) => {
  const responseOrError = await resolve(
    sldRegistrar.bulkSearch(domains.map(toPunycodeDomainName)),
  );

  if (responseOrError.failed) {
    return domains.map((domain) => generateUnavailableDomainInfo(domain, true));
  }

  const responses = responseOrError.result;
  return pMap(responses, async (response) => {
    const domain = response.domainName;

    // Look up the NFT and price information
    const nft = nftMap.get(domain);

    const pricingDetails = response.price;
    if (isNil(pricingDetails)) {
      logger.debug(
        { domain, response },
        `No pricing details found for ${domain}`,
      );
      return generateUnavailableDomainInfo(domain, response.supported);
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
      supported: response.supported,
    };
  });
};

const _getSubdomainListInfo = async (
  domain: NamefiNormalizedDomain,
  nftMap: Map<NamefiNormalizedDomain, NamefiNftOwnersSelect>,
  user?: { privyUserId: string } | null,
) => {
  const { parentDomain, levels } = getDomainLevels(domain);
  const prefix = last(levels);

  if (!parentDomain || !prefix) {
    return generateUnavailableDomainInfo(domain, false);
  }

  const poweredByNamefiDomain =
    await getSinglePoweredByNamefi3PDomainsDetails(parentDomain);

  if (isNil(poweredByNamefiDomain) || poweredByNamefiDomain.enabled === false) {
    return generateUnavailableDomainInfo(domain, false);
  }

  // Check if the domain is reserved
  if (await isReservedKeywordForParentDomain(parentDomain, prefix)) {
    return generateUnavailableDomainInfo(domain, false);
  }

  const startDate = poweredByNamefiDomain.startRolloutAt
    ? new Date(poweredByNamefiDomain.startRolloutAt)
    : null;
  const currentPercentage = startDate && startDate < new Date() ? 100 : 0;

  // we only enable a percentage of subdomain registrations
  // we use keccak256 to hash the domain and check if the last 4 bytes are less than PERCENT of the total number of subdomains
  const shouldRollout = hashBasedPercentageRollouted(domain, currentPercentage);

  if (!shouldRollout && parentDomain !== '0x.city') {
    return generateUnavailableDomainInfo(domain, true);
  }

  let isFreeMint = false;
  if (!shouldRollout && parentDomain === '0x.city') {
    if (!user?.privyUserId) {
      return generateUnavailableDomainInfo(domain, true);
    }
    const userQualifiesFor0xDotCity = await userQualifiesForDomainNamePromo({
      normalizedDomainName: domain,
      user,
    });
    if (!userQualifiesFor0xDotCity) {
      return generateUnavailableDomainInfo(domain, true);
    }
    isFreeMint = userQualifiesFor0xDotCity;
  }

  // Look up the NFT and price information
  const nft = nftMap.get(domain);
  const price = await getSubdomainPriceInUsd(domain, isFreeMint);
  if (isNil(price)) {
    return generateUnavailableDomainInfo(domain, false);
  }
  let durationConstraints = { minYears: 1, maxYears: 10 };
  try {
    durationConstraints = await getDomainDurationConstraints(domain);
  } catch (error) {
    logger.error(`Error getting duration constraints for ${domain}: ${error}`);
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
    supported: true,
  } satisfies DomainAvailabilityInfo;
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
            eq(orderItemsTable.status, orderItemStatusSchema.enum.PROCESSING),
            and(
              eq(orderItemsTable.status, orderItemStatusSchema.enum.CREATED),
              gt(orderItemsTable.createdAt, subDays(new Date(), 1)), //TODO: this is a temporary constraint, we should find a better way to do this or at least define certain limits for duration of unprocessed orders
              eq(ordersTable.status, orderStatusSchema.enum.PROCESSING),
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

/**
 * Checks if the domains are reserved (exact domain matches only)
 * Excludes gifts intended for the current user
 * @param domains - Array of domain names to check
 * @param user - Current user (if any) to exclude their reservations from unavailable list
 * @returns Map of domain names to reservation status
 */
const checkIfDomainsAreReserved = async (
  domains: NamefiNormalizedDomain[],
  user?: { privyUserId: string } | null,
) => {
  // Build base conditions for reservations that block availability
  const conditions = [
    inArray(pbnIssuanceReservationsTable.exactDomainName, domains),
    eq(pbnIssuanceReservationsTable.status, 'CREATED'),
    eq(pbnIssuanceReservationsTable.reserveHold, true),
    or(
      isNull(pbnIssuanceReservationsTable.reservationExpirationDate),
      gt(pbnIssuanceReservationsTable.reservationExpirationDate, new Date()),
    ),
  ];

  // If user is provided, exclude reservations intended for this user
  if (user?.privyUserId) {
    const currentUser = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.privyUserId, user.privyUserId))
      .limit(1);

    if (currentUser.length > 0) {
      // Get the current user's email to check against email-based reservations
      const email = await maybeGetUserEmail(currentUser[0].id);

      // Exclude reservations that are intended for the current user by adding conditions that filter out:
      // 1. Reservations with no recipient user ID but matching the current user's email
      // 2. Reservations with a recipient user ID that matches the current user
      conditions.push(
        or(
          // Case 1: Email-based reservations (no recipient user ID set)
          and(
            isNull(pbnIssuanceReservationsTable.recipientUserId),
            // Only add email condition if we have an email for the user
            email
              ? ne(pbnIssuanceReservationsTable.recipientEmail, email)
              : undefined,
          ),
          // Case 2: User ID-based reservations
          ne(pbnIssuanceReservationsTable.recipientUserId, currentUser[0].id),
        ),
      );
    }
  }

  const reservedDomains = await db
    .select({
      exactDomainName: pbnIssuanceReservationsTable.exactDomainName,
    })
    .from(pbnIssuanceReservationsTable)
    .where(and(...conditions));

  const reservedDomainsMap = new Map(
    domains.map((domain) => [domain, { isReservedToDifferentUser: false }]),
  );

  for (const reservedDomain of reservedDomains) {
    if (reservedDomain.exactDomainName) {
      reservedDomainsMap.set(reservedDomain.exactDomainName, {
        isReservedToDifferentUser: true,
      });
    }
  }

  return reservedDomainsMap;
};
