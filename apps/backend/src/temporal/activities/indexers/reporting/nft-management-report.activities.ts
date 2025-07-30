/**
 * Activities for NFT Management Reporting
 *
 * These activities handle data collection and Slack notification sending
 * for the comprehensive NFT management report using direct database queries.
 */

import { format } from 'date-fns';
import { Context } from '@temporalio/activity';
import {
  db,
  namefiNftOwnersView,
  namefiNftView,
  indexedDomainsTable,
} from '@namefi-astra/db';
import { and, eq, sql } from 'drizzle-orm';
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
    const isPoweredByNamefiCondition = sql<boolean>`array_to_string((string_to_array(${namefiNftOwnersView.normalizedDomainName}, '.'))[2:], '.') = ANY(${sql.raw(`ARRAY[${poweredByNamefiDomains.map((d) => `'${d}'`).join(',')}]`)})`;

    // Fetch all NFT data with computed fields
    const nftDataQuery = db
      .select({
        normalizedDomainName: namefiNftOwnersView.normalizedDomainName,
        chainId: namefiNftOwnersView.chainId,
        ownerAddress: namefiNftOwnersView.ownerAddress,
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
      .from(namefiNftOwnersView)
      .leftJoin(
        namefiNftView,
        and(
          eq(
            namefiNftOwnersView.normalizedDomainName,
            namefiNftView.normalizedDomainName,
          ),
          eq(namefiNftOwnersView.chainId, namefiNftView.chainId),
        ),
      )
      .leftJoin(
        indexedDomainsTable,
        eq(
          namefiNftOwnersView.normalizedDomainName,
          indexedDomainsTable.normalizedDomainName,
        ),
      );

    const allNftsData = await nftDataQuery;

    ctx.log.info(`Collected ${allNftsData.length} total NFTs for analysis`);

    // Collect workflow metrics
    const workflowMetrics = await collectActiveWorkflowMetrics(ctx);

    // Analyze the collected data
    const metrics = analyzeNftData(allNftsData, workflowMetrics);

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
 * Collect active workflow metrics from Temporal
 */
async function collectActiveWorkflowMetrics(ctx: Context) {
  const workflowMetrics = {
    burnWorkflows: 0,
    fixExpirationWorkflows: 0,
    extendRegistrationWorkflows: 0,
  };

  try {
    await temporalClient.connection.ensureConnected();

    // Get active burn workflows
    const burnWorkflowList = temporalClient.workflow.list({
      query: `WorkflowType = "ensureNftIsLockedAndBurnByNftName" AND ExecutionStatus = "Running"`,
    });

    let burnCount = 0;
    for await (const _ of burnWorkflowList) {
      burnCount++;
    }
    workflowMetrics.burnWorkflows = burnCount;

    // Get active fix expiration workflows
    const fixWorkflowList = temporalClient.workflow.list({
      query: `WorkflowType = "fixNftExpirationWorkflow" AND ExecutionStatus = "Running"`,
    });

    let fixCount = 0;
    for await (const _ of fixWorkflowList) {
      fixCount++;
    }
    workflowMetrics.fixExpirationWorkflows = fixCount;

    // Get active extend registration workflows
    const extendWorkflowList = temporalClient.workflow.list({
      query: `WorkflowType = "extendDomainRegistrationWorkflow" AND ExecutionStatus = "Running"`,
    });

    let extendCount = 0;
    for await (const _ of extendWorkflowList) {
      extendCount++;
    }
    workflowMetrics.extendRegistrationWorkflows = extendCount;
  } catch (error) {
    ctx.log.warn('Failed to collect workflow metrics', { error });
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
 * Analyze NFT data and generate comprehensive metrics
 */
function analyzeNftData(
  allNftsData: NftDataQueryResult[],
  activeWorkflows: {
    burnWorkflows: number;
    fixExpirationWorkflows: number;
    extendRegistrationWorkflows: number;
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
  };

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Analyze each NFT
  for (const nft of allNftsData) {
    // Basic categorization
    if (nft.isPoweredByNamefiDomain) {
      metrics.poweredByNamefiDomains++;
    } else {
      metrics.regularDomains++;
    }

    // Use effective domain expiration time for analysis
    const effectiveExpirationTime =
      nft.effectiveDomainExpirationTime || nft.domainExpirationTime;
    const isExpired = effectiveExpirationTime
      ? effectiveExpirationTime < now
      : true;

    if (isExpired) {
      metrics.expiredDomains++;
    }

    // Action-based categorization
    if (nft.canBurn) {
      metrics.canBurnNfts++;
      if (isExpired) {
        metrics.criticalIssues.expiredCanBurn++;
      }
    }

    // Handle missing data vs date mismatch separately
    if (nft.isPoweredByNamefiDomain) {
      // For powered by namefi domains, only check NFT date
      if (!nft.nftExpirationTime) {
        metrics.missingDataNfts++;
        metrics.criticalIssues.missingDataCannotFix++;
      }
    } else {
      // For regular domains, check both dates
      if (!nft.nftExpirationTime || !nft.domainExpirationTime) {
        metrics.missingDataNfts++;
        metrics.criticalIssues.missingDataCannotFix++;
      } else if (nft.hasDateMismatch) {
        // Only count as date mismatch if both dates exist but differ
        metrics.dateMismatchNfts++;
      }
    }

    // Long overdue expired domains (expired more than 30 days ago)
    if (effectiveExpirationTime && effectiveExpirationTime < thirtyDaysAgo) {
      metrics.criticalIssues.longOverdueExpired++;
    }

    // Registrar breakdown
    const registrar = nft.effectiveRegistrarKey || 'Unknown';
    metrics.registrarBreakdown[registrar] =
      (metrics.registrarBreakdown[registrar] || 0) + 1;

    // Chain breakdown
    metrics.chainBreakdown[nft.chainId] =
      (metrics.chainBreakdown[nft.chainId] || 0) + 1;
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

  const totalActiveWorkflows =
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
    '## 🔄 Active Workflows',
    `**Total Active:** ${totalActiveWorkflows.toLocaleString()}`,
    `• Burn Workflows: ${metrics.activeWorkflows.burnWorkflows.toLocaleString()}`,
    `• Fix Expiration: ${metrics.activeWorkflows.fixExpirationWorkflows.toLocaleString()}`,
    `• Extend Registration: ${metrics.activeWorkflows.extendRegistrationWorkflows.toLocaleString()}`,
    '',
    '## 🏢 Registrar Breakdown',
    ...Object.entries(metrics.registrarBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(
        ([registrar, count]) => `• **${registrar}:** ${count.toLocaleString()}`,
      ),
    '',
    '## ⛓️ Chain Distribution',
    ...Object.entries(metrics.chainBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([chainId, count]) => {
        const chainName =
          chainId === '1'
            ? 'Ethereum'
            : chainId === '8453'
              ? 'Base'
              : `Chain ${chainId}`;
        return `• **${chainName} (${chainId}):** ${count.toLocaleString()}`;
      }),
    '',
    '## 📈 Health Score',
    `**Overall Health:** ${calculateHealthScore(metrics)}`,
    generateHealthRecommendations(metrics),
    '',

    '## 🛠️ System Information',
    `**Report Generated:** ${new Date().toISOString()}`,
    '**Data Source:** Direct database queries (namefiNftOwnersView, indexedDomainsTable)',
    '**Admin Panel:** Available at /admin/nft-management',
    '',
    '## 📋 Quick Actions Available',
    '• **Burn expired NFTs** - Use admin panel or API',
    '• **Fix date mismatches** - Automated workflow available',
    '• **Extend registrations** - Admin-initiated workflow',
    '• **Monitor active workflows** - Real-time status in admin panel',
    '',
    '---',
    '*This report is generated automatically using the comprehensive NFT management system.*',
    '*For detailed analysis, visit the admin panel or review individual NFT records.*',
  ];

  const content = sections.join('\n');

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
      `• **URGENT:** Burn ${metrics.criticalIssues.expiredCanBurn} expired NFTs to free up blockchain space`,
    );
  }

  if (metrics.criticalIssues.missingDataCannotFix > 0) {
    recommendations.push(
      `• **REVIEW:** ${metrics.criticalIssues.missingDataCannotFix} NFTs have missing data requiring manual investigation`,
    );
  }

  if (metrics.criticalIssues.longOverdueExpired > 0) {
    recommendations.push(
      `• **CLEANUP:** ${metrics.criticalIssues.longOverdueExpired} domains expired over 30 days ago need immediate attention`,
    );
  }

  if (metrics.dateMismatchNfts - metrics.missingDataNfts > 0) {
    const fixableCount = metrics.dateMismatchNfts - metrics.missingDataNfts;
    recommendations.push(
      `• **MAINTENANCE:** ${fixableCount} date mismatches can be automatically fixed`,
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      '• **EXCELLENT:** No immediate action items identified! 🎉',
    );
  }

  return recommendations.join('\n');
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
      to: ['reporting@namefi.io'],
      subject: title,
      content: {
        html,
        plain,
      },
      from: 'NFT Management System <nft-reports@namefi.io>',
    });

    ctx.log.info(
      'Successfully sent NFT management report email to reporting@namefi.io',
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
