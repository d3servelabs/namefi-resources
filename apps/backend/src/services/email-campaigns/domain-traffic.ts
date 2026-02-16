import { subDays } from 'date-fns';
import pMap from 'p-map';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import {
  db,
  emailCampaignSendsTable,
  indexedDomainsTable,
  namefiNftOwnersCte,
  namefiNftOwnersView,
  usersTable,
} from '@namefi-astra/db';
import { privyUsersTableSchema } from '@namefi-astra/db/schemas/internal';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { createLogger } from '#lib/logger';
import { createGA4Client, type DateRange } from '#lib/analytics_client';
import { config, secrets } from '#lib/env';
import { EMAIL_CAMPAIGN_KEYS } from './constants';
import { toDate } from './utils';

const logger = createLogger({ module: 'email-campaign-traffic' });

const DOMAIN_CHUNK_SIZE = 100;
const MAX_DOMAINS_PER_USER = 5;
const GA4_RETRY_ATTEMPTS = 3;

export type DomainTrafficSignal = {
  domain: NamefiNormalizedDomain;
  weeklyQueries: number;
};

export type DomainTrafficCandidate = {
  userId: string;
  domains: DomainTrafficSignal[];
};

let cachedGa4Client: ReturnType<typeof createGA4Client> | null = null;

function getGa4Client() {
  if (cachedGa4Client) {
    return cachedGa4Client;
  }

  if (!secrets.GA4_PROPERTY_ID) {
    throw new Error('GA4_PROPERTY_ID is not configured');
  }

  cachedGa4Client = createGA4Client({
    propertyId: secrets.GA4_PROPERTY_ID,
    keyFilename: secrets.GA4_KEY_FILE_PATH,
  });

  return cachedGa4Client;
}

function formatGaDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function getRollingWeeklyTrafficDateRange(asOf: Date): DateRange {
  const asOfDay = toUtcDay(asOf);
  const endDate = subDays(asOfDay, 1);
  const startDate = subDays(endDate, 6);
  return {
    startDate: formatGaDate(startDate),
    endDate: formatGaDate(endDate),
  };
}

async function withRetries<T>(
  action: () => Promise<T>,
  {
    label,
    attempts = GA4_RETRY_ATTEMPTS,
  }: {
    label: string;
    attempts?: number;
  },
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      const delay = Math.min(2000, 250 * 2 ** (attempt - 1));
      logger.warn({ label, attempt, error, delay }, 'Retrying GA4 request');
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed GA4 request (${label})`);
}

function normalizeAnalyticsDomain(
  value: string,
): NamefiNormalizedDomain | null {
  const cleaned = value.trim().toLowerCase().replace(/\.$/, '');
  if (!cleaned) return null;
  const parsed = namefiNormalizedDomainSchema.safeParse(cleaned);
  return parsed.success ? parsed.data : null;
}

async function fetchWeeklyTrafficCountsForDomains({
  domains,
  dateRange,
  threshold,
}: {
  domains: NamefiNormalizedDomain[];
  dateRange: DateRange;
  threshold: number;
}): Promise<Map<NamefiNormalizedDomain, number>> {
  if (domains.length === 0) return new Map();

  if (!secrets.GA4_PROPERTY_ID) {
    logger.warn('GA4 is not configured; skipping traffic checks');
    return new Map();
  }

  const client = getGa4Client();
  const chunks: NamefiNormalizedDomain[][] = [];
  for (let i = 0; i < domains.length; i += DOMAIN_CHUNK_SIZE) {
    chunks.push(domains.slice(i, i + DOMAIN_CHUNK_SIZE));
  }

  const results = await pMap(
    chunks,
    async (chunk, index) => {
      const label = `ga4-traffic-chunk-${index + 1}`;
      return withRetries(
        () =>
          client.runReport({
            dateRanges: [dateRange],
            metrics: [{ name: 'eventCount' }],
            dimensions: [{ name: 'customEvent:domain' }],
            dimensionFilter: {
              andGroup: {
                expressions: [
                  {
                    filter: {
                      fieldName: 'eventName',
                      stringFilter: {
                        matchType: 'EXACT',
                        value: 'dns_query',
                      },
                    },
                  },
                  {
                    filter: {
                      fieldName: 'customEvent:domain',
                      inListFilter: {
                        values: chunk,
                      },
                    },
                  },
                ],
              },
            },
            metricFilter: {
              filter: {
                fieldName: 'eventCount',
                numericFilter: {
                  operation: 'GREATER_THAN_OR_EQUAL',
                  value: {
                    int64Value: threshold.toString(),
                  },
                },
              },
            },
            orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
            limit: chunk.length,
          }),
        { label },
      );
    },
    { concurrency: 2 },
  );

  const counts = new Map<NamefiNormalizedDomain, number>();
  for (const response of results) {
    for (const row of response.rows ?? []) {
      const domainValue = row.dimensionValues?.[0]?.value;
      if (!domainValue) continue;
      const normalized = normalizeAnalyticsDomain(domainValue);
      if (!normalized) continue;
      const count = Number.parseInt(row.metricValues?.[0]?.value ?? '0', 10);
      if (!Number.isFinite(count) || count < threshold) continue;
      counts.set(normalized, count);
    }
  }

  return counts;
}

export async function getDomainTrafficCampaignCandidates({
  periodStart,
  userIdFilter,
  thresholdOverride,
  asOf,
}: {
  periodStart: Date | string;
  userIdFilter?: string[];
  thresholdOverride?: number;
  asOf?: Date | string;
}): Promise<DomainTrafficCandidate[]> {
  const periodStartDate = toDate(periodStart);
  const asOfDate = toDate(asOf ?? new Date());
  const threshold =
    thresholdOverride ?? config.EMAIL_DOMAIN_TRAFFIC_WEEKLY_THRESHOLD;

  if (!Number.isFinite(threshold) || threshold <= 0) {
    logger.warn(
      { threshold },
      'Invalid traffic threshold; skipping traffic campaign',
    );
    return [];
  }

  const hasEmailCondition = sql<boolean>`NULLIF(TRIM(${privyUsersTableSchema.email}), '') IS NOT NULL`;
  const conditions = [
    eq(usersTable.subscribeToEmails, true),
    hasEmailCondition,
    eq(indexedDomainsTable.isUsingNamefiNameservers, true),
    isNull(emailCampaignSendsTable.id),
  ];

  if (userIdFilter && userIdFilter.length > 0) {
    conditions.push(inArray(usersTable.id, userIdFilter));
  }

  // We only check analytics for domains that already pass all other criteria.
  const candidateRows = await db
    .with(namefiNftOwnersCte)
    .select({
      userId: usersTable.id,
      domainName: namefiNftOwnersView.normalizedDomainName,
    })
    .from(namefiNftOwnersView)
    .innerJoin(
      indexedDomainsTable,
      eq(
        indexedDomainsTable.normalizedDomainName,
        namefiNftOwnersView.normalizedDomainName,
      ),
    )
    .innerJoin(
      privyUsersTableSchema,
      sql`LOWER(${namefiNftOwnersView.ownerAddress}) = ANY(array_lowercase(${privyUsersTableSchema.wallets}))`,
    )
    .innerJoin(
      usersTable,
      eq(usersTable.privyUserId, privyUsersTableSchema.privyUserId),
    )
    .leftJoin(
      emailCampaignSendsTable,
      and(
        eq(emailCampaignSendsTable.userId, usersTable.id),
        eq(
          emailCampaignSendsTable.campaignKey,
          EMAIL_CAMPAIGN_KEYS.DOMAIN_TRAFFIC_SURGE,
        ),
        eq(emailCampaignSendsTable.periodStart, periodStartDate),
        inArray(emailCampaignSendsTable.status, ['SENT', 'PENDING']),
      ),
    )
    .where(and(...conditions))
    .groupBy(usersTable.id, namefiNftOwnersView.normalizedDomainName);

  if (candidateRows.length === 0) {
    logger.debug('No candidate domains for traffic campaign');
    return [];
  }

  const domainToUserIds = new Map<NamefiNormalizedDomain, Set<string>>();
  for (const row of candidateRows) {
    const users = domainToUserIds.get(row.domainName) ?? new Set();
    users.add(row.userId);
    domainToUserIds.set(row.domainName, users);
  }

  const candidateDomains = Array.from(domainToUserIds.keys());

  const dateRange = getRollingWeeklyTrafficDateRange(asOfDate);
  // NOTE: We query customEvent:domain so subdomains stay separate.
  // If we later aggregate subdomain traffic into roots, adjust here.
  const trafficCounts = await fetchWeeklyTrafficCountsForDomains({
    domains: candidateDomains,
    dateRange,
    threshold,
  }).catch((error) => {
    logger.error({ error }, 'Failed to fetch weekly traffic counts');
    return new Map<NamefiNormalizedDomain, number>();
  });

  if (trafficCounts.size === 0) {
    logger.debug('No domains crossed weekly traffic threshold');
    return [];
  }

  const userToDomains = new Map<string, DomainTrafficSignal[]>();
  for (const [domain, count] of trafficCounts.entries()) {
    const userIds = domainToUserIds.get(domain);
    if (!userIds) continue;
    for (const userId of userIds) {
      const list = userToDomains.get(userId) ?? [];
      list.push({ domain, weeklyQueries: count });
      userToDomains.set(userId, list);
    }
  }

  const candidates: DomainTrafficCandidate[] = [];
  for (const [userId, domains] of userToDomains.entries()) {
    const sorted = [...domains].sort(
      (a, b) => b.weeklyQueries - a.weeklyQueries,
    );
    const limited = sorted.slice(0, MAX_DOMAINS_PER_USER);
    if (limited.length > 0) {
      candidates.push({ userId, domains: limited });
    }
  }

  logger.debug(
    {
      candidateUsers: candidates.length,
      candidateDomains: candidateDomains.length,
      threshold,
      dateRange,
    },
    'Prepared traffic campaign candidates',
  );

  return candidates;
}
