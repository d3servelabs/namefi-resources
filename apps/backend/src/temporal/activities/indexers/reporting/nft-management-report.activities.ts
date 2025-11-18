/**
 * Activities for NFT Management Reporting
 *
 * These activities handle data collection and Slack notification sending
 * for the comprehensive NFT management report using direct database queries.
 */

import { differenceInSeconds, format, subHours } from 'date-fns';
import { Context } from '@temporalio/activity';
import {
  db,
  namefiNftView,
  indexedDomainsTable,
  orderItemsTable,
  ordersTable,
  namefiNftCte,
} from '@namefi-astra/db';
import { and, eq, sql, gte } from 'drizzle-orm';
import { temporalClient } from '../../../client';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import { secrets } from '#lib/env';
import { sendMail } from '../../../../mail/mail-client';
import React from 'react';
import { render } from '@react-email/components';
import { NftManagementReport } from '../../../../mail/templates/nft-management-report';

const MAX_GRACE_PERIOD_DAYS = 45;

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
    const isPoweredByNamefiCondition = sql<boolean>`array_to_string((string_to_array(${namefiNftView.normalizedDomainName}, '.'))[2:], '.') = ANY(${sql.raw(`ARRAY[${poweredByNamefiDomains.map((d) => `'${d}'`).join(',')}]`)})`;

    // Build filters to exclude sepolia and test domains
    const isSepoliaCondition = sql<boolean>`${namefiNftView.chainId} = 11155111`;
    const isTestDomainCondition = sql<boolean>`split_part(${namefiNftView.normalizedDomainName}, '.', -1) LIKE 'test%'`;

    // Fetch all NFT data with computed fields, excluding sepolia and test domains
    const nftDataQuery = db
      .with(namefiNftCte)
      .select({
        normalizedDomainName: namefiNftView.normalizedDomainName,
        chainId: namefiNftView.chainId,
        ownerAddress: namefiNftView.ownerAddress,
        nftExpirationTime: namefiNftView.expirationTime,
        domainExpirationTime: indexedDomainsTable.expirationTime,
        registrarKey: indexedDomainsTable.registrarKey,
        // Computed fields
        isPoweredByNamefiDomain: isPoweredByNamefiCondition.as(
          'is_powered_by_namefi_domain',
        ),
        effectiveDomainExpirationTime: sql<Date | null>`
          CASE 
            WHEN ${isPoweredByNamefiCondition}
            THEN ${namefiNftView.expirationTime}
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
              ( ( NOW() - ${namefiNftView.expirationTime}) > interval '${sql.raw(MAX_GRACE_PERIOD_DAYS.toString())} days' )
              OR
              ${indexedDomainsTable.expirationTime} IS NULL
            )
          END
        `.as('can_burn'),
        hasDateMismatch: sql<boolean>`
          CASE 
            WHEN ${isPoweredByNamefiCondition}
            THEN false
            WHEN ${namefiNftView.expirationTime} IS NULL OR ${indexedDomainsTable.expirationTime} IS NULL
            THEN false
            ELSE ABS(EXTRACT(EPOCH FROM (${namefiNftView.expirationTime} - ${indexedDomainsTable.expirationTime}))) > 86400
          END
        `.as('has_date_mismatch'),
      })
      .from(namefiNftView)
      .leftJoin(
        indexedDomainsTable,
        eq(
          namefiNftView.normalizedDomainName,
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

    // Analyze the collected data
    const metrics = analyzeNftData(
      allNftsData,
      workflowMetrics,
      recentOrdersMetrics,
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
): ReportMetrics {
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
  };

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Analyze each NFT
  for (const nft of allNftsData) {
    analyzeNftRecordAndUpdateMetrics(nft, metrics, now, thirtyDaysAgo);
  }

  return metrics;
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

  const sections = [
    '## 📊 Overall NFT Statistics',
    `**Total NFTs:** ${metrics.totalNfts.toLocaleString()}`,
    `**Powered by Namefi:** ${metrics.poweredByNamefiDomains.toLocaleString()}`,
    `**Regular Domains:** ${metrics.regularDomains.toLocaleString()}`,
    '',
    '## ⚠️ Critical Issues Overview',
    `**Expired Domains:** ${metrics.expiredDomains.toLocaleString()} (${expiredPercentage}%)`,
    `**Can Burn NFTs:** ${metrics.canBurnNfts.toLocaleString()} (${canBurnPercentage}%)`,
    `**Date Mismatches:** ${metrics.dateMismatchNfts.toLocaleString()} (${dateMismatchPercentage}%)`,
    `**Missing Data (Cannot Fix):** ${metrics.missingDataNfts.toLocaleString()}`,
    '',
    '## 🔥 Critical Action Items',
    `**Expired & Burnable:** ${metrics.criticalIssues.expiredCanBurn.toLocaleString()} NFTs need immediate burn action`,
    `**Missing Data Issues:** ${metrics.criticalIssues.missingDataCannotFix.toLocaleString()} NFTs cannot be automatically fixed`,
    `**Long Overdue (30+ days expired):** ${metrics.criticalIssues.longOverdueExpired.toLocaleString()} domains`,
    '',
    '## 🔄 Workflows (Last 24 Hours)',
    `**Total Workflows:** ${totalRecentWorkflows.toLocaleString()}

- Burn Workflows: ${metrics.activeWorkflows.burnWorkflows.toLocaleString()}
- Fix Expiration: ${metrics.activeWorkflows.fixExpirationWorkflows.toLocaleString()}
- Extend Registration: ${metrics.activeWorkflows.extendRegistrationWorkflows.toLocaleString()}`,
    '',
    '## 🛒 Recent Orders (Last 24 Hours)',
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
    '## 🏢 Registrar Breakdown',
    Object.entries(metrics.registrarBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(
        ([registrar, count]) => `- **${registrar}:** ${count.toLocaleString()}`,
      )
      .join('\n'),
    '',
    '## ⛓️ Chain Distribution',
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
    '## 📈 Health Score',
    `**Overall Health:** ${calculateHealthScore(metrics)}`,
    generateHealthRecommendations(metrics),
    '',

    '## 🛠️ System Information',
    `**Report Generated:** ${new Date().toISOString()}`,
    '**Data Source:** Direct database queries (namefiNftOwnersView, indexedDomainsTable)',
    '**Admin Panel:** Available at https://astra.namefi.io/admin/nft-management',
    '',
    '## 📋 Quick Actions Available',
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
    '</div>',
    '',
    '---',
    '*This report is generated automatically using the comprehensive NFT management system.*',
    '*For detailed analysis, visit the admin panel or review individual NFT records.*',
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

  if (recommendations.length === 0) {
    recommendations.push(
      '- **EXCELLENT:** No immediate action items identified! 🎉',
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
    return '## 📦 All Order Items (Last 24 Hours)\n\n✅ **No order items found in the last 24 hours.**';
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
    '## 📦 All Order Items (Last 24 Hours)',
    '',
    `**${allOrderItems.length} order items** in the last 24 hours:`,
    '',
    ...tableRows,
  ].join('\n');
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
  if (domain.canBurn) issues.push('🔥 Can Burn');
  if (domain.hasDateMismatch) issues.push('📅 Date Mismatch');
  if (!domain.nftExpirationTime || !domain.domainExpirationTime)
    issues.push('❓ Missing Data');
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
    return '## 🎯 Critical Domains\n\n✅ **No critical domains found!** All NFTs are in good health.';
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
      `| ${domain.normalizedDomainName} | ${chainName} | ${issues.join(', ')} | ${domainExpiration} | ${nftExpiration} | ${registrar} | ${actions.join(', ') || 'Review'} |`,
    );
  }

  return [
    '## 🎯 Critical Domains',
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

/**
 * Send the formatted report via email to reporting@namefi.io
 */
export async function sendNftManagementReportEmail(
  title: string,
  content: string,
): Promise<void> {
  const ctx = Context.current();

  try {
    // Create React email template
    const emailTemplate = React.createElement(NftManagementReport, {
      title,
      reportContent: content,
    });

    // Render the template to HTML and plain text
    const html = await render(emailTemplate);
    const plain = await render(emailTemplate, { plainText: true });

    await sendMail({
      to: ['reports+nft@d3serve.xyz'],
      subject: title,
      content: {
        html,
        plain,
      },
      from: 'NFT Management System <noreply@d3serve.xyz>',
    });

    ctx.log.info(
      'Successfully sent NFT management report email to reports+nft@d3serve.xyz',
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
