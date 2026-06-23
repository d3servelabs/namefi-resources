/**
 * Activities for NFT Management Reporting
 *
 * These activities handle data collection and Slack notification sending
 * for the comprehensive NFT management report using direct database queries.
 */

import { differenceInSeconds, format, subHours } from 'date-fns';
import { Context } from '@temporalio/activity';
import { formatDomainNameForDisplay } from '@namefi-astra/registrars/data/validations';
import {
  db,
  committedNamefiNftView,
  indexedDomainsTable,
  orderItemsTable,
  ordersTable,
  committedNamefiNftCte,
} from '@namefi-astra/db';
import { and, eq, sql, gte, isNull } from 'drizzle-orm';
import { temporalClient } from '../../../client';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import { secrets } from '#lib/env';
import { sendMail, type SendMailInput } from '../../../../mail/mail-client';
import { createElement } from 'react';
import { render } from '@react-email/components';
import { NftManagementReport } from '../../../../mail/templates/nft-management-report';
import type {
  CategorizedDomainEntry,
  CategorizedSections,
  KnownIssueExplanation,
  NftReportMeta,
  NftReportSummary,
  CategorySummary,
} from '../../../../mail/templates/nft-management-report.types';
import { loadKnownIssuesMap } from '#lib/nft-known-issues';

const SEND_TO_SLACK_DIRECT = false;

const MAX_GRACE_PERIOD_DAYS = 45;

const NFT_MANAGEMENT_ADMIN_URL = 'https://astra.namefi.io/admin/nft-management';

function getGitHubActionsUrl(): string {
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const repository =
    process.env.GITHUB_REPOSITORY || 'd3servelabs/namefi-astra';
  const runId = process.env.GITHUB_RUN_ID;

  if (runId) {
    return `${serverUrl}/${repository}/actions/runs/${runId}`;
  }

  return `${serverUrl}/${repository}/actions`;
}

export interface ReportMetrics {
  totalNfts: number;
  expiredDomains: number;
  canBurnNfts: number;
  dateMismatchNfts: number;
  missingDataNfts: number;
  poweredByNamefiDomains: number;
  regularDomains: number;
  activeWorkflows: {
    burnWorkflows: number;
    fixExpirationWorkflows: number;
    extendRegistrationWorkflows: number;
  };
  registrarBreakdown: Record<string, number>;
  chainBreakdown: Record<number, number>;
  criticalIssues: {
    expiredCanBurn: number;
    missingDataCannotFix: number;
    longOverdueExpired: number;
  };
  criticalDomains: DetailedNftData[];
  recentOrders: {
    totalOrderItems: number;
    totalRevenue: number;
    ordersByType: Record<string, number>;
    topDomains: Array<{
      domain: string;
      count: number;
      revenue: number;
    }>;
    allOrderItems: Array<{
      domain: string;
      type: string;
      amount: number;
      createdAt: Date;
      orderStatus: string;
      orderId: string;
    }>;
  };
  unmintedDomains: {
    totalCount: number;
    expiredCount: number;
    activeCount: number;
    missingFromRegistrarCount: number;
    registrarBreakdown: Record<string, number>;
    domains: UnmintedDomainData[];
  };
  /**
   * Domains bucketed into the four reportable issue categories used by the
   * email template. Populated by `buildCategorizedSections`. Each entry may
   * carry an attached `knownIssue` explanation if one is persisted.
   */
  categorized: CategorizedSections;
  /** ISO timestamp of when this metrics snapshot was produced. */
  generatedAt: string;
}

export interface DetailedNftData {
  normalizedDomainName: string;
  chainId: number;
  ownerAddress: string;
  nftExpirationTime: Date | null;
  domainExpirationTime: Date | null;
  registrarKey: string | null;
  isPoweredByNamefiDomain: boolean;
  canBurn: boolean;
  hasDateMismatch: boolean;
}

export interface UnmintedDomainData {
  normalizedDomainName: string;
  registrarKey: string;
  expirationTime: Date | null;
  lastIndexedAt: Date;
  isMissingFromRegistrar: boolean;
}

/**
 * Collect comprehensive NFT metrics from the database using direct queries
 */
export async function collectNftManagementMetrics(): Promise<ReportMetrics> {
  const ctx = Context.current();
  ctx.log.info('Starting comprehensive NFT metrics collection');

  try {
    // Get powered by namefi domains
    const poweredByNamefiDomains = [
      ...(await getPoweredByNamefi3PDomains()),
      'withharris.club',
      'withtrump.club',
      'defi.build',
    ];

    // Build the powered-by-namefi condition
    const isPoweredByNamefiCondition = sql<boolean>`array_to_string((string_to_array(${committedNamefiNftView.normalizedDomainName}, '.'))[2:], '.') = ANY(${sql.raw(`ARRAY[${poweredByNamefiDomains.map((d) => `'${d}'`).join(',')}]`)})`;

    // Build filters to exclude sepolia and test domains
    const isSepoliaCondition = sql<boolean>`${committedNamefiNftView.chainId} = 11155111`;
    const isTestDomainCondition = sql<boolean>`split_part(${committedNamefiNftView.normalizedDomainName}, '.', -1) LIKE 'test%'`;

    // Fetch all NFT data with computed fields, excluding sepolia and test domains
    const nftDataQuery = db
      .with(committedNamefiNftCte)
      .select({
        normalizedDomainName: committedNamefiNftView.normalizedDomainName,
        chainId: committedNamefiNftView.chainId,
        ownerAddress: committedNamefiNftView.ownerAddress,
        nftExpirationTime: committedNamefiNftView.expirationTime,
        domainExpirationTime: indexedDomainsTable.expirationTime,
        registrarKey: indexedDomainsTable.registrarKey,
        // Computed fields
        isPoweredByNamefiDomain: isPoweredByNamefiCondition.as(
          'is_powered_by_namefi_domain',
        ),
        effectiveDomainExpirationTime: sql<Date | null>`
          CASE
            WHEN ${isPoweredByNamefiCondition}
            THEN ${committedNamefiNftView.expirationTime}
            ELSE ${indexedDomainsTable.expirationTime}
          END
        `.as('effective_domain_expiration_time'),
        effectiveRegistrarKey: sql<string | null>`
          CASE
            WHEN ${isPoweredByNamefiCondition}
            THEN 'Powered by Namefi'
            ELSE ${indexedDomainsTable.registrarKey}
          END
        `.as('effective_registrar_key'),
        canBurn: sql<boolean>`
          CASE
            WHEN ${isPoweredByNamefiCondition}
            THEN false
            ELSE (
              ( ( NOW() - coalesce(${indexedDomainsTable.expirationTime}, NOW()) ) > interval '${sql.raw(MAX_GRACE_PERIOD_DAYS.toString())} days' )
              OR
              ( ( NOW() - ${committedNamefiNftView.expirationTime}) > interval '${sql.raw(MAX_GRACE_PERIOD_DAYS.toString())} days' )
              OR
              ${indexedDomainsTable.expirationTime} IS NULL
            )
          END
        `.as('can_burn'),
        hasDateMismatch: sql<boolean>`
          CASE
            WHEN ${isPoweredByNamefiCondition}
            THEN false
            WHEN ${committedNamefiNftView.expirationTime} IS NULL OR ${indexedDomainsTable.expirationTime} IS NULL
            THEN false
            ELSE ABS(EXTRACT(EPOCH FROM (${committedNamefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) > 86400
          END
        `.as('has_date_mismatch'),
      })
      .from(committedNamefiNftView)
      .leftJoin(
        indexedDomainsTable,
        eq(
          committedNamefiNftView.normalizedDomainName,
          indexedDomainsTable.normalizedDomainName,
        ),
      )
      .where(
        and(sql`NOT ${isSepoliaCondition}`, sql`NOT ${isTestDomainCondition}`),
      );

    const allNftsData = await nftDataQuery;

    ctx.log.info(`Collected ${allNftsData.length} total NFTs for analysis`);

    // Collect workflow metrics
    const workflowMetrics = await collectActiveWorkflowMetrics(ctx);

    // Collect recent order items (last 24 hours)
    const recentOrdersMetrics = await collectRecentOrdersMetrics(ctx);

    // Collect unminted domains (domains in index but not in NFT view)
    const unmintedDomainsMetrics = await collectUnmintedDomainsMetrics(ctx);

    // Load persisted known-issue explanations so we can mark acknowledged
    // domains in the categorized sections. Tolerates store outages.
    const knownIssuesMap = await loadKnownIssuesMap();

    // Analyze the collected data
    const metrics = analyzeNftData(
      allNftsData,
      workflowMetrics,
      recentOrdersMetrics,
      unmintedDomainsMetrics,
      knownIssuesMap,
    );

    ctx.log.info('NFT metrics collection completed', {
      totalNfts: metrics.totalNfts,
      criticalIssues: metrics.criticalIssues,
      activeWorkflows: metrics.activeWorkflows,
    });

    return metrics;
  } catch (error) {
    ctx.log.error('Failed to collect NFT management metrics', { error });
    throw error;
  }
}

/**
 * Collects metrics for order items created in the last 24 hours
 *
 * @param ctx - Temporal activity context for logging
 * @returns Object containing order metrics including totals, breakdowns, and individual items
 */
async function collectRecentOrdersMetrics(ctx: Context) {
  const recentOrdersMetrics = {
    totalOrderItems: 0,
    totalRevenue: 0,
    ordersByType: {} as Record<string, number>,
    topDomains: [] as Array<{ domain: string; count: number; revenue: number }>,
    allOrderItems: [] as Array<{
      domain: string;
      type: string;
      amount: number;
      createdAt: Date;
      orderStatus: string;
      orderId: string;
    }>,
  };

  try {
    // Get order items from the last 24 hours
    const twentyFourHoursAgo = subHours(new Date(), 24);

    const recentOrderItems = await db
      .select({
        normalizedDomainName: orderItemsTable.normalizedDomainName,
        amountInUSDCents: orderItemsTable.amountInUSDCents,
        type: orderItemsTable.type,
        createdAt: orderItemsTable.createdAt,
        orderStatus: ordersTable.status,
        orderId: orderItemsTable.orderId,
      })
      .from(orderItemsTable)
      .leftJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
      .where(
        and(
          gte(orderItemsTable.createdAt, twentyFourHoursAgo),
          // Only include completed or processing orders
          sql`${ordersTable.status} IN ('COMPLETED', 'PROCESSING')`,
        ),
      );

    ctx.log.info(`Found ${recentOrderItems.length} recent order items`);

    // Analyze the order items
    const domainStats = new Map<string, { count: number; revenue: number }>();

    for (const item of recentOrderItems) {
      recentOrdersMetrics.totalOrderItems++;
      recentOrdersMetrics.totalRevenue += item.amountInUSDCents || 0;

      // Count by type
      const type = item.type || 'UNKNOWN';
      recentOrdersMetrics.ordersByType[type] =
        (recentOrdersMetrics.ordersByType[type] || 0) + 1;

      // Track domain stats
      if (item.normalizedDomainName) {
        const existing = domainStats.get(item.normalizedDomainName) || {
          count: 0,
          revenue: 0,
        };
        domainStats.set(item.normalizedDomainName, {
          count: existing.count + 1,
          revenue: existing.revenue + (item.amountInUSDCents || 0),
        });
      }

      // Add to allOrderItems array for detailed reporting
      recentOrdersMetrics.allOrderItems.push({
        domain: item.normalizedDomainName || 'N/A',
        type: type,
        amount: item.amountInUSDCents || 0,
        createdAt: item.createdAt,
        orderStatus: item.orderStatus || 'UNKNOWN',
        orderId: item.orderId || 'N/A',
      });
    }

    // Get top 10 domains by order count
    recentOrdersMetrics.topDomains = Array.from(domainStats.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([domain, stats]) => ({
        domain,
        count: stats.count,
        revenue: stats.revenue,
      }));
  } catch (error) {
    ctx.log.warn('Failed to collect recent orders metrics', { error });
  }

  return recentOrdersMetrics;
}

/**
 * Collects metrics for domains that exist in indexedDomainsTable but NOT in committedNamefiNftView
 * These are "unminted" domains - registered with registrar but no NFT exists
 *
 * @param ctx - Temporal activity context for logging
 * @returns Object containing unminted domain metrics and details
 */
async function collectUnmintedDomainsMetrics(ctx: Context) {
  const unmintedDomainsMetrics = {
    totalCount: 0,
    expiredCount: 0,
    activeCount: 0,
    missingFromRegistrarCount: 0,
    registrarBreakdown: {} as Record<string, number>,
    domains: [] as UnmintedDomainData[],
  };

  try {
    // Build test domain filter for indexedDomainsTable
    // Exclude domains with TLD starting with 'test'
    const isTestDomainCondition = sql<boolean>`split_part(${indexedDomainsTable.normalizedDomainName}, '.', -1) LIKE 'test%'`;

    // Query: LEFT JOIN indexedDomainsTable with committedNamefiNftView
    // WHERE committedNamefiNftView.normalizedDomainName IS NULL (no matching NFT)
    const unmintedDomainsQuery = db
      .with(committedNamefiNftCte)
      .select({
        normalizedDomainName: indexedDomainsTable.normalizedDomainName,
        registrarKey: indexedDomainsTable.registrarKey,
        expirationTime: indexedDomainsTable.expirationTime,
        lastIndexedAt: indexedDomainsTable.lastIndexedAt,
        isMissingFromRegistrar: indexedDomainsTable.isMissingFromRegistrar,
      })
      .from(indexedDomainsTable)
      .leftJoin(
        committedNamefiNftView,
        eq(
          indexedDomainsTable.normalizedDomainName,
          committedNamefiNftView.normalizedDomainName,
        ),
      )
      .where(
        and(
          isNull(committedNamefiNftView.normalizedDomainName), // No matching NFT
          sql`NOT ${isTestDomainCondition}`, // Exclude test domains
        ),
      );

    const unmintedDomains = await unmintedDomainsQuery;

    ctx.log.info(`Found ${unmintedDomains.length} unminted domains`);

    const now = new Date();

    for (const domain of unmintedDomains) {
      unmintedDomainsMetrics.totalCount++;

      // Check if expired
      if (domain.expirationTime && domain.expirationTime < now) {
        unmintedDomainsMetrics.expiredCount++;
      } else if (domain.expirationTime) {
        unmintedDomainsMetrics.activeCount++;
      }

      // Check if missing from registrar
      if (domain.isMissingFromRegistrar) {
        unmintedDomainsMetrics.missingFromRegistrarCount++;
      }

      // Registrar breakdown
      const registrar = domain.registrarKey || 'Unknown';
      unmintedDomainsMetrics.registrarBreakdown[registrar] =
        (unmintedDomainsMetrics.registrarBreakdown[registrar] || 0) + 1;

      // Add to domains list
      unmintedDomainsMetrics.domains.push({
        normalizedDomainName: domain.normalizedDomainName,
        registrarKey: domain.registrarKey,
        expirationTime: domain.expirationTime,
        lastIndexedAt: domain.lastIndexedAt,
        isMissingFromRegistrar: domain.isMissingFromRegistrar,
      });
    }

    // Sort domains by expiration time (soonest first, null at end)
    unmintedDomainsMetrics.domains.sort((a, b) => {
      if (!a.expirationTime && !b.expirationTime) return 0;
      if (!a.expirationTime) return 1;
      if (!b.expirationTime) return -1;
      return a.expirationTime.getTime() - b.expirationTime.getTime();
    });
  } catch (error) {
    ctx.log.warn('Failed to collect unminted domains metrics', { error });
  }

  return unmintedDomainsMetrics;
}

/**
 * Collects metrics for workflows that ran in the last 24 hours from Temporal server
 *
 * This replaces the previous active workflow metrics to provide a report of what actually
 * happened in the last day rather than what's currently running.
 *
 * @param ctx - Temporal activity context for logging
 * @returns Object containing counts of workflows that executed in the last 24 hours by type
 */
async function collectActiveWorkflowMetrics(ctx: Context) {
  const workflowMetrics = {
    burnWorkflows: 0,
    fixExpirationWorkflows: 0,
    extendRegistrationWorkflows: 0,
  };

  try {
    await temporalClient.connection.ensureConnected();

    // Calculate 24 hours ago timestamp for query filter
    const twentyFourHoursAgo = subHours(new Date(), 24);
    const startTimeFilter = twentyFourHoursAgo.toISOString();

    // Get burn workflows from last 24 hours (any status - completed, failed, running)
    const burnWorkflowList = temporalClient.workflow.list({
      query: `WorkflowType = "ensureNftIsLockedAndBurnByNftName" AND StartTime >= "${startTimeFilter}"`,
    });

    let burnCount = 0;
    for await (const _ of burnWorkflowList) {
      burnCount++;
    }
    workflowMetrics.burnWorkflows = burnCount;

    // Get fix expiration workflows from last 24 hours
    const fixWorkflowList = temporalClient.workflow.list({
      query: `WorkflowType = "fixNftExpirationWorkflow" AND StartTime >= "${startTimeFilter}"`,
    });

    let fixCount = 0;
    for await (const _ of fixWorkflowList) {
      fixCount++;
    }
    workflowMetrics.fixExpirationWorkflows = fixCount;

    // Get extend registration workflows from last 24 hours
    const extendWorkflowList = temporalClient.workflow.list({
      query: `WorkflowType = "extendDomainRegistrationWorkflow" AND StartTime >= "${startTimeFilter}"`,
    });

    let extendCount = 0;
    for await (const _ of extendWorkflowList) {
      extendCount++;
    }
    workflowMetrics.extendRegistrationWorkflows = extendCount;

    ctx.log.info('Collected workflow metrics for last 24 hours', {
      burnWorkflows: burnCount,
      fixExpirationWorkflows: fixCount,
      extendRegistrationWorkflows: extendCount,
      startTimeFilter,
    });
  } catch (error) {
    ctx.log.warn('Failed to collect workflow metrics for last 24 hours', {
      error,
    });
  }

  return workflowMetrics;
}

interface NftDataQueryResult {
  normalizedDomainName: string;
  chainId: number;
  ownerAddress: string;
  nftExpirationTime: Date | null;
  domainExpirationTime: Date | null;
  registrarKey: string | null;
  isPoweredByNamefiDomain: boolean;
  effectiveDomainExpirationTime: Date | null;
  effectiveRegistrarKey: string | null;
  canBurn: boolean;
  hasDateMismatch: boolean;
}

/**
 * Updates domain type counters based on whether the NFT is a powered-by-namefi domain
 *
 * @param nft - The NFT data to categorize
 * @param metrics - The metrics object to update (WARNING: This object is mutated)
 */
function updateDomainTypeCategorization(
  nft: NftDataQueryResult,
  metrics: ReportMetrics,
): void {
  if (nft.isPoweredByNamefiDomain) {
    metrics.poweredByNamefiDomains++;
  } else {
    metrics.regularDomains++;
  }
}

/**
 * Analyzes domain expiration status and updates expired domain counter
 *
 * @param nft - The NFT data containing expiration information
 * @param metrics - The metrics object to update (WARNING: This object is mutated)
 * @param now - Current timestamp for expiration comparison
 * @returns Object containing expiration status and effective expiration time
 */
function analyzeAndUpdateExpirationStatus(
  nft: NftDataQueryResult,
  metrics: ReportMetrics,
  now: Date,
): { isExpired: boolean; effectiveExpirationTime: Date | null } {
  const effectiveExpirationTime =
    nft.effectiveDomainExpirationTime || nft.domainExpirationTime;
  const isExpired = effectiveExpirationTime
    ? effectiveExpirationTime < now
    : true;

  if (isExpired) {
    metrics.expiredDomains++;
  }

  return { isExpired, effectiveExpirationTime };
}

/**
 * Validates NFT data integrity and updates metrics for missing data and date mismatches
 *
 * @param nft - The NFT data to validate
 * @param metrics - The metrics object to update (WARNING: This object is mutated)
 * @returns True if the NFT has critical data validation issues, false otherwise
 */
function validateNftDataAndUpdateMetrics(
  nft: NftDataQueryResult,
  metrics: ReportMetrics,
): boolean {
  let isCritical = false;

  if (nft.isPoweredByNamefiDomain) {
    // For powered by namefi domains, only check NFT date
    if (!nft.nftExpirationTime) {
      metrics.missingDataNfts++;
      metrics.criticalIssues.missingDataCannotFix++;
      isCritical = true;
    }
  } else {
    // For regular domains, check both dates
    if (!nft.nftExpirationTime || !nft.domainExpirationTime) {
      metrics.missingDataNfts++;
      metrics.criticalIssues.missingDataCannotFix++;
      isCritical = true;
    } else if (nft.hasDateMismatch) {
      // Only count as date mismatch if both dates exist but differ
      metrics.dateMismatchNfts++;
      isCritical = true;
    }
  }

  return isCritical;
}

/**
 * Updates registrar and chain distribution breakdowns in metrics
 *
 * @param nft - The NFT data containing registrar and chain information
 * @param metrics - The metrics object to update (WARNING: This object is mutated)
 */
function updateRegistrarAndChainBreakdowns(
  nft: NftDataQueryResult,
  metrics: ReportMetrics,
): void {
  // Registrar breakdown
  const registrar = nft.effectiveRegistrarKey || 'Unknown';
  metrics.registrarBreakdown[registrar] =
    (metrics.registrarBreakdown[registrar] || 0) + 1;

  // Chain breakdown
  metrics.chainBreakdown[nft.chainId] =
    (metrics.chainBreakdown[nft.chainId] || 0) + 1;
}

/**
 * Analyzes a single NFT record and updates all relevant metrics
 *
 * This function performs comprehensive analysis of an NFT including:
 * - Domain type categorization (powered-by-namefi vs regular)
 * - Expiration status evaluation
 * - Burn eligibility assessment
 * - Data validation and critical issue identification
 * - Long overdue domain detection
 * - Critical domain tracking
 * - Registrar and chain distribution updates
 *
 * @param nft - The NFT data to analyze
 * @param metrics - The metrics object to update (WARNING: This object is mutated extensively)
 * @param now - Current timestamp for expiration comparison
 * @param thirtyDaysAgo - Timestamp 30 days ago for long overdue detection
 */
function analyzeNftRecordAndUpdateMetrics(
  nft: NftDataQueryResult,
  metrics: ReportMetrics,
  now: Date,
  thirtyDaysAgo: Date,
): void {
  updateDomainTypeCategorization(nft, metrics);

  const { isExpired, effectiveExpirationTime } =
    analyzeAndUpdateExpirationStatus(nft, metrics, now);

  let isCritical = false;

  // Action-based categorization
  if (nft.canBurn) {
    metrics.canBurnNfts++;
    if (isExpired) {
      metrics.criticalIssues.expiredCanBurn++;
      isCritical = true;
    }
  }

  // Handle missing data vs date mismatch
  if (validateNftDataAndUpdateMetrics(nft, metrics)) {
    isCritical = true;
  }

  // Long overdue expired domains (expired more than 30 days ago)
  if (effectiveExpirationTime && effectiveExpirationTime < thirtyDaysAgo) {
    metrics.criticalIssues.longOverdueExpired++;
    isCritical = true;
  }

  // Add to critical domains if it has any critical issues
  if (isCritical) {
    metrics.criticalDomains.push({
      normalizedDomainName: nft.normalizedDomainName,
      chainId: nft.chainId,
      ownerAddress: nft.ownerAddress,
      nftExpirationTime: nft.nftExpirationTime,
      domainExpirationTime: nft.effectiveDomainExpirationTime,
      registrarKey: nft.effectiveRegistrarKey,
      isPoweredByNamefiDomain: nft.isPoweredByNamefiDomain,
      canBurn: nft.canBurn,
      hasDateMismatch: nft.hasDateMismatch,
    });
  }

  updateRegistrarAndChainBreakdowns(nft, metrics);
}
/**
 * Analyzes NFT data and generates comprehensive metrics for reporting
 *
 * This function processes all NFT records and combines them with workflow and order data
 * to create a complete metrics overview. It categorizes domains, identifies critical issues,
 * and aggregates data for various breakdowns.
 *
 * @param allNftsData - Array of NFT records from database queries
 * @param activeWorkflows - Current workflow execution counts by type
 * @param recentOrdersMetrics - Order metrics from the last 24 hours (WARNING: Contains mutated data)
 * @returns Complete metrics object ready for report formatting
 */
function analyzeNftData(
  allNftsData: NftDataQueryResult[],
  activeWorkflows: {
    burnWorkflows: number;
    fixExpirationWorkflows: number;
    extendRegistrationWorkflows: number;
  },
  recentOrdersMetrics: {
    totalOrderItems: number;
    totalRevenue: number;
    ordersByType: Record<string, number>;
    topDomains: Array<{ domain: string; count: number; revenue: number }>;
    allOrderItems: Array<{
      domain: string;
      type: string;
      amount: number;
      createdAt: Date;
      orderStatus: string;
      orderId: string;
    }>;
  },
  unmintedDomainsMetrics: {
    totalCount: number;
    expiredCount: number;
    activeCount: number;
    missingFromRegistrarCount: number;
    registrarBreakdown: Record<string, number>;
    domains: UnmintedDomainData[];
  },
  knownIssuesMap: Map<string, KnownIssueExplanation>,
): ReportMetrics {
  const now = new Date();

  const metrics: ReportMetrics = {
    totalNfts: allNftsData.length,
    expiredDomains: 0,
    canBurnNfts: 0,
    dateMismatchNfts: 0,
    missingDataNfts: 0,
    poweredByNamefiDomains: 0,
    regularDomains: 0,
    activeWorkflows,
    registrarBreakdown: {},
    chainBreakdown: {},
    criticalIssues: {
      expiredCanBurn: 0,
      missingDataCannotFix: 0,
      longOverdueExpired: 0,
    },
    criticalDomains: [],
    recentOrders: recentOrdersMetrics,
    unmintedDomains: unmintedDomainsMetrics,
    categorized: {
      dateMismatch: [],
      domainExistsMissingNft: [],
      nftExistsMissingDomainNotExpired: [],
      expired: [],
    },
    generatedAt: now.toISOString(),
  };

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Analyze each NFT for legacy counters / critical-domains list
  for (const nft of allNftsData) {
    analyzeNftRecordAndUpdateMetrics(nft, metrics, now, thirtyDaysAgo);
  }

  // Bucket every domain into one of the four reportable categories
  metrics.categorized = buildCategorizedSections(
    allNftsData,
    unmintedDomainsMetrics.domains,
    knownIssuesMap,
    now,
  );

  return metrics;
}

function isoOrNull(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date instanceof Date
    ? date.toISOString()
    : new Date(date).toISOString();
}

function attachKnownIssue(
  entry: CategorizedDomainEntry,
  knownIssuesMap: Map<string, KnownIssueExplanation>,
): CategorizedDomainEntry {
  const known = knownIssuesMap.get(entry.normalizedDomainName);
  if (known) {
    entry.knownIssue = known;
  }
  return entry;
}

/**
 * Assigns NFT and unminted-domain rows into mutually exclusive categories
 * for the report email. Powered-by-namefi domains are excluded since their
 * expiration semantics differ and they don't have a registrar comparison.
 *
 * Precedence (highest first):
 *   EXPIRED -> NFT_EXISTS_MISSING_DOMAIN -> DATE_MISMATCH (NFT side)
 *   EXPIRED -> DOMAIN_EXISTS_MISSING_NFT (unminted side)
 */
function buildCategorizedSections(
  allNftsData: NftDataQueryResult[],
  unmintedDomains: UnmintedDomainData[],
  knownIssuesMap: Map<string, KnownIssueExplanation>,
  now: Date,
): CategorizedSections {
  const sections: CategorizedSections = {
    dateMismatch: [],
    domainExistsMissingNft: [],
    nftExistsMissingDomainNotExpired: [],
    expired: [],
  };

  for (const nft of allNftsData) {
    if (nft.isPoweredByNamefiDomain) continue;

    // Use registrar expiration when available; otherwise fall back to the
    // NFT's own expiration so that an orphaned-but-already-expired NFT is
    // bucketed as EXPIRED rather than NFT_EXISTS_MISSING_DOMAIN.
    const expirationForCategorization =
      nft.domainExpirationTime ?? nft.nftExpirationTime;
    const isExpired = expirationForCategorization
      ? expirationForCategorization < now
      : false;

    if (isExpired && expirationForCategorization) {
      sections.expired.push(
        attachKnownIssue(
          {
            normalizedDomainName: nft.normalizedDomainName,
            chainId: nft.chainId,
            ownerAddress: nft.ownerAddress,
            registrarKey: nft.effectiveRegistrarKey,
            nftExpirationTime: isoOrNull(nft.nftExpirationTime),
            domainExpirationTime: isoOrNull(expirationForCategorization),
            isExpired: true,
          },
          knownIssuesMap,
        ),
      );
      continue;
    }

    if (!nft.domainExpirationTime) {
      // NFT row exists, registrar join failed, and the NFT itself is not
      // expired (or has no expiration data). Expired orphaned NFTs are
      // already routed to the EXPIRED bucket above.
      sections.nftExistsMissingDomainNotExpired.push(
        attachKnownIssue(
          {
            normalizedDomainName: nft.normalizedDomainName,
            chainId: nft.chainId,
            ownerAddress: nft.ownerAddress,
            registrarKey: nft.effectiveRegistrarKey,
            nftExpirationTime: isoOrNull(nft.nftExpirationTime),
            domainExpirationTime: null,
            isExpired: false,
          },
          knownIssuesMap,
        ),
      );
      continue;
    }

    if (nft.hasDateMismatch && nft.nftExpirationTime) {
      const diffSeconds = Math.round(
        (nft.nftExpirationTime.getTime() - nft.domainExpirationTime.getTime()) /
          1000,
      );
      sections.dateMismatch.push(
        attachKnownIssue(
          {
            normalizedDomainName: nft.normalizedDomainName,
            chainId: nft.chainId,
            ownerAddress: nft.ownerAddress,
            registrarKey: nft.effectiveRegistrarKey,
            nftExpirationTime: isoOrNull(nft.nftExpirationTime),
            domainExpirationTime: isoOrNull(nft.domainExpirationTime),
            expirationDiffSeconds: diffSeconds,
            isExpired: false,
          },
          knownIssuesMap,
        ),
      );
    }
  }

  for (const domain of unmintedDomains) {
    // Domains that the registrar no longer returns are "gone from the
    // registrar" rather than "expired at the registrar". Their stored
    // expirationTime is the last known value (usually in the past), which
    // would incorrectly inflate the EXPIRED bucket. They're already tracked
    // in `unmintedDomainsMetrics.missingFromRegistrarCount` for the TLDR.
    if (domain.isMissingFromRegistrar) continue;

    const isExpired = domain.expirationTime
      ? domain.expirationTime < now
      : false;

    if (isExpired && domain.expirationTime) {
      sections.expired.push(
        attachKnownIssue(
          {
            normalizedDomainName: domain.normalizedDomainName,
            registrarKey: domain.registrarKey,
            nftExpirationTime: null,
            domainExpirationTime: isoOrNull(domain.expirationTime),
            isExpired: true,
          },
          knownIssuesMap,
        ),
      );
      continue;
    }

    sections.domainExistsMissingNft.push(
      attachKnownIssue(
        {
          normalizedDomainName: domain.normalizedDomainName,
          registrarKey: domain.registrarKey,
          nftExpirationTime: null,
          domainExpirationTime: isoOrNull(domain.expirationTime),
          isExpired: false,
        },
        knownIssuesMap,
      ),
    );
  }

  // Sort each bucket for deterministic, scannable output
  sections.dateMismatch.sort(
    (a, b) =>
      Math.abs(b.expirationDiffSeconds ?? 0) -
      Math.abs(a.expirationDiffSeconds ?? 0),
  );
  sections.domainExistsMissingNft.sort((a, b) =>
    sortByDateAsc(a.domainExpirationTime, b.domainExpirationTime),
  );
  sections.nftExistsMissingDomainNotExpired.sort((a, b) =>
    sortByDateAsc(a.nftExpirationTime, b.nftExpirationTime),
  );
  sections.expired.sort((a, b) =>
    sortByDateAsc(a.domainExpirationTime, b.domainExpirationTime),
  );

  return sections;
}

function sortByDateAsc(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -1 : 1;
}

function summarizeCategory(entries: CategorizedDomainEntry[]): CategorySummary {
  const acknowledged = entries.filter((e) => e.knownIssue).length;
  return {
    total: entries.length,
    acknowledged,
    needsReview: entries.length - acknowledged,
  };
}

function buildReportSummary(metrics: ReportMetrics): NftReportSummary {
  const dateMismatch = summarizeCategory(metrics.categorized.dateMismatch);
  const domainExistsMissingNft = summarizeCategory(
    metrics.categorized.domainExistsMissingNft,
  );
  const nftExistsMissingDomainNotExpired = summarizeCategory(
    metrics.categorized.nftExistsMissingDomainNotExpired,
  );
  const expired = summarizeCategory(metrics.categorized.expired);
  return {
    totalNfts: metrics.totalNfts,
    dateMismatch,
    domainExistsMissingNft,
    nftExistsMissingDomainNotExpired,
    expired,
    knownIssuesTotal:
      dateMismatch.acknowledged +
      domainExistsMissingNft.acknowledged +
      nftExistsMissingDomainNotExpired.acknowledged +
      expired.acknowledged,
  };
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const s = String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

function buildCategoryCsv(entries: CategorizedDomainEntry[]): string {
  const headers = [
    'Domain',
    'Registrar',
    'ChainId',
    'DomainExpiration',
    'NftExpiration',
    'Owner',
    'DiffSeconds',
    'IsExpired',
    'KnownIssue',
    'AcknowledgedBy',
    'AcknowledgedAt',
  ];
  const rows = entries.map((e) =>
    [
      csvEscape(e.normalizedDomainName),
      csvEscape(e.registrarKey ?? ''),
      csvEscape(e.chainId ?? ''),
      csvEscape(e.domainExpirationTime ?? ''),
      csvEscape(e.nftExpirationTime ?? ''),
      csvEscape(e.ownerAddress ?? ''),
      csvEscape(e.expirationDiffSeconds ?? ''),
      csvEscape(e.isExpired ? 'true' : 'false'),
      csvEscape(e.knownIssue?.explanation ?? ''),
      csvEscape(e.knownIssue?.acknowledgedBy ?? ''),
      csvEscape(e.knownIssue?.acknowledgedAt ?? ''),
    ].join(','),
  );
  return [headers.map(csvEscape).join(','), ...rows].join('\n');
}

function buildCsvAttachments(
  metrics: ReportMetrics,
  reportDate: string,
): NonNullable<SendMailInput['attachments']> {
  const attachments: NonNullable<SendMailInput['attachments']> = [];
  const sections: Array<{
    key: keyof CategorizedSections;
    filenamePart: string;
    minToAttach: number;
  }> = [
    { key: 'expired', filenamePart: 'expired-domains', minToAttach: 1 },
    { key: 'dateMismatch', filenamePart: 'date-mismatch', minToAttach: 20 },
    {
      key: 'domainExistsMissingNft',
      filenamePart: 'domain-missing-nft',
      minToAttach: 20,
    },
    {
      key: 'nftExistsMissingDomainNotExpired',
      filenamePart: 'nft-missing-domain',
      minToAttach: 20,
    },
  ];

  for (const section of sections) {
    const entries = metrics.categorized[section.key];
    if (entries.length < section.minToAttach) continue;
    attachments.push({
      filename: `${section.filenamePart}-${reportDate}.csv`,
      content: buildCategoryCsv(entries),
      contentType: 'text/csv',
    });
  }

  return attachments;
}

/**
 * Format the comprehensive metrics into a Slack-friendly message
 */
export async function formatNftManagementReport(
  metrics: ReportMetrics,
): Promise<{
  title: string;
  content: string;
}> {
  const ctx = Context.current();
  ctx.log.info('Formatting NFT management report');

  const reportDate = format(new Date(), 'yyyy-MM-dd');
  const title = `${reportDate} Comprehensive NFT Management Report`;
  const githubActionsUrl = getGitHubActionsUrl();

  const totalRecentWorkflows =
    metrics.activeWorkflows.burnWorkflows +
    metrics.activeWorkflows.fixExpirationWorkflows +
    metrics.activeWorkflows.extendRegistrationWorkflows;

  // Calculate percentages
  const expiredPercentage =
    metrics.totalNfts > 0
      ? ((metrics.expiredDomains / metrics.totalNfts) * 100).toFixed(1)
      : '0';
  const canBurnPercentage =
    metrics.totalNfts > 0
      ? ((metrics.canBurnNfts / metrics.totalNfts) * 100).toFixed(1)
      : '0';
  const dateMismatchPercentage =
    metrics.totalNfts > 0
      ? ((metrics.dateMismatchNfts / metrics.totalNfts) * 100).toFixed(1)
      : '0';

  // Build TLDR critical actions
  const tldrActions: string[] = [];
  if (metrics.dateMismatchNfts > 0) {
    tldrActions.push(
      `- **Date Mismatch:** ${metrics.dateMismatchNfts.toLocaleString()} NFTs have expiration date mismatch (>1 day difference)`,
    );
  }
  if (metrics.missingDataNfts > 0) {
    tldrActions.push(
      `- **Missing NFT Data:** ${metrics.missingDataNfts.toLocaleString()} NFTs have missing expiration data`,
    );
  }
  if (metrics.unmintedDomains.totalCount > 0) {
    tldrActions.push(
      `- **Unminted Domains:** ${metrics.unmintedDomains.totalCount.toLocaleString()} domains in registrar index without NFTs (${metrics.unmintedDomains.activeCount.toLocaleString()} active, ${metrics.unmintedDomains.expiredCount.toLocaleString()} expired)`,
    );
  }

  const tldrSection =
    tldrActions.length > 0
      ? ['## TLDR - Critical Actions Required', '', ...tldrActions, '']
      : ['## TLDR - No Critical Actions Required', ''];

  const sections = [
    ...tldrSection,
    '## Overall NFT Statistics',
    `**Total NFTs:** ${metrics.totalNfts.toLocaleString()}`,
    `**Powered by Namefi:** ${metrics.poweredByNamefiDomains.toLocaleString()}`,
    `**Regular Domains:** ${metrics.regularDomains.toLocaleString()}`,
    '',
    '## Critical Issues Overview',
    `**Expired Domains:** ${metrics.expiredDomains.toLocaleString()} (${expiredPercentage}%)`,
    `**Can Burn NFTs:** ${metrics.canBurnNfts.toLocaleString()} (${canBurnPercentage}%)`,
    `**Date Mismatches:** ${metrics.dateMismatchNfts.toLocaleString()} (${dateMismatchPercentage}%)`,
    `**Missing Data (Cannot Fix):** ${metrics.missingDataNfts.toLocaleString()}`,
    '',
    '## Critical Action Items',
    `**Expired & Burnable:** ${metrics.criticalIssues.expiredCanBurn.toLocaleString()} NFTs need immediate burn action`,
    `**Missing Data Issues:** ${metrics.criticalIssues.missingDataCannotFix.toLocaleString()} NFTs cannot be automatically fixed`,
    `**Long Overdue (30+ days expired):** ${metrics.criticalIssues.longOverdueExpired.toLocaleString()} domains`,
    '',
    '## Unminted Domains Summary',
    `**Total Unminted:** ${metrics.unmintedDomains.totalCount.toLocaleString()} domains in registrar index without NFTs`,
    `**Active (Not Expired):** ${metrics.unmintedDomains.activeCount.toLocaleString()}`,
    `**Expired:** ${metrics.unmintedDomains.expiredCount.toLocaleString()}`,
    `**Missing from Registrar:** ${metrics.unmintedDomains.missingFromRegistrarCount.toLocaleString()}`,
    '',
    '**Unminted by Registrar:**',
    ...Object.entries(metrics.unmintedDomains.registrarBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(
        ([registrar, count]) => `- **${registrar}:** ${count.toLocaleString()}`,
      ),
    '',
    '## Workflows (Last 24 Hours)',
    `**Total Workflows:** ${totalRecentWorkflows.toLocaleString()}

- Burn Workflows: ${metrics.activeWorkflows.burnWorkflows.toLocaleString()}
- Fix Expiration: ${metrics.activeWorkflows.fixExpirationWorkflows.toLocaleString()}
- Extend Registration: ${metrics.activeWorkflows.extendRegistrationWorkflows.toLocaleString()}`,
    '',
    '## Recent Orders (Last 24 Hours)',
    `**Total Order Items:** ${metrics.recentOrders.totalOrderItems.toLocaleString()}`,
    `**Total Revenue:** $${(metrics.recentOrders.totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    '**Orders by Type:**',
    ...Object.entries(metrics.recentOrders.ordersByType)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => `- **${type}:** ${count.toLocaleString()}`),
    '',
    '**Top Domains:**',
    ...metrics.recentOrders.topDomains
      .slice(0, 5)
      .map(
        ({ domain, count, revenue }) =>
          `- **${domain}:** ${count.toLocaleString()} order${count !== 1 ? 's' : ''} ($${(revenue / 100).toFixed(2)})`,
      ),
    '',
    '## Registrar Breakdown',
    Object.entries(metrics.registrarBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(
        ([registrar, count]) => `- **${registrar}:** ${count.toLocaleString()}`,
      )
      .join('\n'),
    '',
    '## Chain Distribution',
    Object.entries(metrics.chainBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([_chainId, count]) => {
        const chainId = Number.parseInt(_chainId);
        const chainName =
          chainId === 1
            ? 'Ethereum'
            : chainId === 8453
              ? 'Base'
              : `Chain ${chainId}`;
        return `- **${chainName} (${chainId}):** ${count.toLocaleString()}`;
      })
      .join('\n'),
    '',
    '## Health Score',
    `**Overall Health:** ${calculateHealthScore(metrics)}`,
    generateHealthRecommendations(metrics),
    '',

    '## System Information',
    `**Report Generated:** ${new Date().toISOString()}`,
    '**Data Source:** Direct database queries (committedNamefiNftOwnersView, indexedDomainsTable)',
    `**Admin Panel:** ${NFT_MANAGEMENT_ADMIN_URL}`,
    `**GitHub Actions:** ${githubActionsUrl}`,
    '',
    '## Quick Actions Available',
    `- **Burn expired NFTs** - Use admin panel or API
- **Fix date mismatches** - Automated workflow available
- **Extend registrations** - Admin-initiated workflow
- **View workflow history** - Recent workflow activity in admin panel`,
    '',
    '<div id="markdown-table">',
    '',
    formatCriticalDomainsTable(metrics.criticalDomains),
    '',
    formatAllOrderItemsTable(metrics.recentOrders.allOrderItems),
    '',
    formatUnmintedDomainsTable(metrics.unmintedDomains.domains),
    '',
    '</div>',
    '',
    '---',
    '*This report is generated automatically using the comprehensive NFT management system.*',
    `*For detailed analysis, visit the [admin panel](${NFT_MANAGEMENT_ADMIN_URL}) or review individual NFT records.*`,
  ];

  const content = sections.join('\n\n');

  ctx.log.info('NFT management report formatted successfully');

  return { title, content };
}

function calculateHealthScore(metrics: ReportMetrics): string {
  if (metrics.totalNfts === 0) return '✅ Perfect (No NFTs to manage)';

  let score = 100;

  // Deduct points for issues
  const expiredPercentage = (metrics.expiredDomains / metrics.totalNfts) * 100;
  const dateMismatchPercentage =
    (metrics.dateMismatchNfts / metrics.totalNfts) * 100;
  const missingDataPercentage =
    (metrics.missingDataNfts / metrics.totalNfts) * 100;

  score -= expiredPercentage * 0.5; // 0.5 points per % expired
  score -= dateMismatchPercentage * 0.3; // 0.3 points per % with date mismatch
  score -= missingDataPercentage * 0.8; // 0.8 points per % with missing data (more serious)

  score = Math.max(0, Math.round(score));

  if (score >= 95) return `🟢 Excellent (${score}/100)`;
  if (score >= 85) return `🟡 Good (${score}/100)`;
  if (score >= 70) return `🟠 Needs Attention (${score}/100)`;
  return `🔴 Critical (${score}/100)`;
}

function generateHealthRecommendations(metrics: ReportMetrics): string {
  const recommendations: string[] = [];

  if (metrics.criticalIssues.expiredCanBurn > 0) {
    recommendations.push(
      `- **URGENT:** Burn ${metrics.criticalIssues.expiredCanBurn} expired NFTs to free up blockchain space`,
    );
  }

  if (metrics.criticalIssues.missingDataCannotFix > 0) {
    recommendations.push(
      `- **REVIEW:** ${metrics.criticalIssues.missingDataCannotFix} NFTs have missing data requiring manual investigation`,
    );
  }

  if (metrics.criticalIssues.longOverdueExpired > 0) {
    recommendations.push(
      `- **CLEANUP:** ${metrics.criticalIssues.longOverdueExpired} domains expired over 30 days ago need immediate attention`,
    );
  }

  if (metrics.dateMismatchNfts - metrics.missingDataNfts > 0) {
    const fixableCount = metrics.dateMismatchNfts - metrics.missingDataNfts;
    recommendations.push(
      `- **MAINTENANCE:** ${fixableCount} date mismatches can be automatically fixed`,
    );
  }

  if (metrics.unmintedDomains.activeCount > 0) {
    recommendations.push(
      `- **ATTENTION:** ${metrics.unmintedDomains.activeCount} active domains have not been minted as NFTs`,
    );
  }

  if (metrics.unmintedDomains.expiredCount > 0) {
    recommendations.push(
      `- **CLEANUP:** ${metrics.unmintedDomains.expiredCount} expired domains in index without NFTs may need removal`,
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      '- **EXCELLENT:** No immediate action items identified!',
    );
  }

  return recommendations.join('\n');
}

/**
 * Formats all order items from the last 24 hours into a markdown table
 *
 * @param allOrderItems - Array of order item data to format
 * @returns Markdown formatted table section with all order items, or empty state message
 */
function formatAllOrderItemsTable(
  allOrderItems: Array<{
    domain: string;
    type: string;
    amount: number;
    createdAt: Date;
    orderStatus: string;
    orderId: string;
  }>,
): string {
  if (allOrderItems.length === 0) {
    return '## All Order Items (Last 24 Hours)\n\n✅ **No order items found in the last 24 hours.**';
  }

  // Sort order items by creation date (newest first)
  const sortedItems = allOrderItems.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const tableRows = [
    '| Domain | Type | Amount | Status | Order ID | Created At |',
    '|--------|------|--------|--------|----------|------------|',
  ];

  for (const item of sortedItems) {
    const amount = `$${(item.amount / 100).toFixed(2)}`;
    const createdAt = format(new Date(item.createdAt), 'MMM do, HH:mm');
    const domain =
      item.domain.length > 25
        ? `${item.domain.substring(0, 25)}...`
        : item.domain;
    const orderId =
      item.orderId.length > 12
        ? `${item.orderId.substring(0, 12)}...`
        : item.orderId;

    tableRows.push(
      `| ${domain} | ${item.type} | ${amount} | ${item.orderStatus} | ${orderId} | ${createdAt} |`,
    );
  }

  return [
    '## All Order Items (Last 24 Hours)',
    '',
    `**${allOrderItems.length} order items** in the last 24 hours:`,
    '',
    ...tableRows,
  ].join('\n');
}

/**
 * Formats unminted domains into a markdown table
 *
 * @param unmintedDomains - Array of unminted domain data to format
 * @returns Markdown formatted table section with unminted domains
 */
function formatUnmintedDomainsTable(
  unmintedDomains: UnmintedDomainData[],
): string {
  if (unmintedDomains.length === 0) {
    return '## Unminted Domains (No NFT)\n\n✅ **No unminted domains found.** All domains have corresponding NFTs.';
  }

  // Limit to first 50 for report readability
  const domainsToShow = unmintedDomains.slice(0, 50);
  const hasMore = unmintedDomains.length > 50;

  const tableRows = [
    '| Domain | Registrar | Expiration | Status |',
    '|--------|-----------|------------|--------|',
  ];

  const now = new Date();

  for (const domain of domainsToShow) {
    const expirationDate = domain.expirationTime
      ? format(domain.expirationTime, 'MMM do, yyyy')
      : 'Unknown';
    const lastIndexed = format(domain.lastIndexedAt, 'MMM do, HH:mm');
    const isExpired = domain.expirationTime && domain.expirationTime < now;

    let status = isExpired ? '🔴 Expired' : '🟢 Active';
    if (domain.isMissingFromRegistrar) {
      status = '🟡 Missing from Registrar';
    }

    const domainName = formatDomainNameForDisplay(domain.normalizedDomainName);

    tableRows.push(
      `| ${domainName} | ${domain.registrarKey} | ${expirationDate} | ${status} |`,
    );
  }

  const sections = [
    '## Unminted Domains (No NFT)',
    '',
    `**${unmintedDomains.length} domains** in registry without corresponding NFTs:`,
    '',
    ...tableRows,
  ];

  if (hasMore) {
    sections.push(
      '',
      `*... and ${unmintedDomains.length - 50} more domains not shown*`,
    );
  }

  return sections.join('\n');
}

/**
 * Converts a numeric chain ID to a human-readable chain name
 *
 * @param chainId - The numeric chain identifier
 * @returns Human-readable chain name (e.g., "Ethereum", "Base", or "Chain {id}")
 */
function getChainName(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'Ethereum';
    case 8453:
      return 'Base';
    default:
      return `Chain ${chainId}`;
  }
}

/**
 * Generates a list of critical issues for a domain as emoji-prefixed strings
 *
 * @param domain - The detailed NFT data to analyze for issues
 * @returns Array of issue descriptions with emoji prefixes
 */
function getCriticalDomainIssues(domain: DetailedNftData): string[] {
  const issues = [];
  if (domain.canBurn) issues.push('🔴 Can Burn');
  if (domain.hasDateMismatch) issues.push('🟡 Date Mismatch');
  if (!domain.nftExpirationTime || !domain.domainExpirationTime)
    issues.push('🟠 Missing Data');
  return issues;
}

/**
 * Determines available remediation actions for a critical domain
 *
 * @param domain - The detailed NFT data to analyze for available actions
 * @returns Array of action names that can be performed on this domain
 */
function getCriticalDomainActions(domain: DetailedNftData): string[] {
  const actions = [];
  if (domain.canBurn) actions.push('Burn');
  if (
    domain.hasDateMismatch &&
    domain.nftExpirationTime &&
    domain.domainExpirationTime
  )
    actions.push('Fix Date');
  return actions;
}

/**
 * Formats critical domains into a markdown table with severity-based sorting
 *
 * @param criticalDomains - Array of critical domain data to format
 * @returns Markdown formatted table section with critical domains, or success message if none
 */
function formatCriticalDomainsTable(
  criticalDomains: DetailedNftData[],
): string {
  if (criticalDomains.length === 0) {
    return '## Critical Domains\n\n✅ **No critical domains found!** All NFTs are in good health.';
  }

  // Sort critical domains by severity (can burn first, then by expiration date)
  const sortedDomains = criticalDomains.sort((a, b) => {
    // Priority: can burn domains first
    if (a.canBurn && !b.canBurn) return -1;
    if (!a.canBurn && b.canBurn) return 1;

    // Then by expiration date (earliest first)
    const aExpiration = a.domainExpirationTime || new Date(0);
    const bExpiration = b.domainExpirationTime || new Date(0);
    return differenceInSeconds(aExpiration, bExpiration);
  });

  const tableRows = [
    '| Domain | Chain | Issues | Domain Expiration | NFT Expiration | Registrar | Actions |',
    '|--------|-------|--------|-------------------|----------------|-----------|---------|',
  ];

  for (const domain of sortedDomains) {
    const chainName = getChainName(domain.chainId);
    const issues = getCriticalDomainIssues(domain);
    const actions = getCriticalDomainActions(domain);

    const domainExpiration = domain.domainExpirationTime
      ? format(domain.domainExpirationTime, 'MMM do, yyyy')
      : 'Unknown';

    const nftExpiration = domain.nftExpirationTime
      ? format(domain.nftExpirationTime, 'MMM do, yyyy')
      : 'Unknown';

    const registrar = domain.registrarKey || 'Unknown';

    tableRows.push(
      `| ${formatDomainNameForDisplay(domain.normalizedDomainName)} | ${chainName} | ${issues.join(', ')} | ${domainExpiration} | ${nftExpiration} | ${registrar} | ${actions.join(', ') || 'Review'} |`,
    );
  }

  return [
    '## Critical Domains',
    '',
    `**${criticalDomains.length} domains** require immediate attention:`,
    '',
    ...tableRows,
  ].join('\n');
}
/**
 * Send the formatted report to Slack (if webhook URL is configured)
 */
export async function sendNftManagementReportToSlack(
  title: string,
  content: string,
): Promise<void> {
  if (!SEND_TO_SLACK_DIRECT) {
    return;
  }
  const ctx = Context.current();
  const webhookUrl = secrets.NAMEFI_ASSET_REPORT_SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    ctx.log.warn(
      'No Slack webhook URL configured, skipping Slack notification',
    );
    ctx.log.info('Report would have been sent', {
      title,
      contentLength: content.length,
    });
    return;
  }

  try {
    const blocks = getSlackTextBlocks(content);

    const message = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: title,
          },
        },
        ...blocks,
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    ctx.log.info('Successfully sent NFT management report to Slack');
  } catch (error) {
    ctx.log.error('Failed to send NFT management report to Slack', { error });
    throw error;
  }
}

export interface SendNftManagementReportEmailInput {
  title: string;
  metrics: ReportMetrics;
}

/**
 * Send the structured report via email. Renders the NftManagementReport
 * template directly from the metrics' `categorized` sections, and attaches
 * CSV exports for the expired bucket plus any other oversize sections.
 */
export async function sendNftManagementReportEmail(
  input: SendNftManagementReportEmailInput,
): Promise<void> {
  const ctx = Context.current();
  const { title, metrics } = input;

  try {
    const summary = buildReportSummary(metrics);
    const meta: NftReportMeta = {
      generatedAt: metrics.generatedAt,
      adminUrl: NFT_MANAGEMENT_ADMIN_URL,
      githubActionsUrl: getGitHubActionsUrl(),
    };

    const emailTemplate = createElement(NftManagementReport, {
      title,
      summary,
      categorized: metrics.categorized,
      meta,
    });

    const html = await render(emailTemplate);
    const plain = await render(emailTemplate, { plainText: true });

    const reportDate = format(new Date(metrics.generatedAt), 'yyyy-MM-dd');
    const attachments = buildCsvAttachments(metrics, reportDate);

    await sendMail({
      to: [
        'reports+nft@d3serve.xyz',
        'asset-report-aaaao27zt2zkdocu7mqxfdxvzm@namefi.slack.com',
      ],
      subject: title,
      content: { html, plain },
      from: 'NFT Management System <noreply@d3serve.xyz>',
      attachments,
    });

    ctx.log.info(
      'Successfully sent NFT management report email to reports+nft@d3serve.xyz',
      {
        attachmentCount: attachments.length,
        knownIssuesTotal: summary.knownIssuesTotal,
      },
    );
  } catch (error) {
    ctx.log.error('Failed to send NFT management report email', { error });
    throw error;
  }
}

function getSlackTextBlocks(content: string) {
  const charLimitPerBlock = 3000;
  const blocks = [];

  // Split content into manageable chunks
  const lines = content.split('\n');
  let currentBlock = '';

  for (const line of lines) {
    const potentialBlock = currentBlock + (currentBlock ? '\n' : '') + line;

    if (potentialBlock.length > charLimitPerBlock && currentBlock) {
      // Add current block and start new one
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: currentBlock,
        },
      });
      currentBlock = line;
    } else {
      currentBlock = potentialBlock;
    }
  }

  // Add the last block
  if (currentBlock) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: currentBlock,
      },
    });
  }

  return blocks;
}
