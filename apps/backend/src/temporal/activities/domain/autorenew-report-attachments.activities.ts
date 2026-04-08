/**
 * Activities for generating auto-renewal report attachments (CSV and Markdown files)
 */

import { Context } from '@temporalio/activity';
import { format } from 'date-fns';
import type {
  AutoRenewMetrics,
  AutoRenewReportInput,
} from './autorenew-report.activities';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { getEppLockState } from './registrar.activities';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { determineActionRequired } from '../../shared/autorenew-utils';

/**
 * Generate comprehensive CSV report with all auto-renewal details
 */
export async function generateAutoRenewReportCsv(
  input: AutoRenewReportInput,
  metrics: AutoRenewMetrics,
): Promise<string> {
  const ctx = Context.current();
  ctx.log.info('Generating auto-renewal CSV report');

  const lines: string[] = [];

  // CSV Headers
  lines.push(
    [
      'Domain',
      'User ID',
      'User Email',
      'Status',
      'Registrar',
      'Amount Charged (USD)',
      'Amount Refunded (USD)',
      'Payment Provider',
      'Payment ID',
      'Error Reason',
      'Action Required',
      'Transaction Date',
    ].join(','),
  );

  // Process all workflow results for detailed rows
  for (const result of input.workflowResults) {
    const baseRow = {
      userId: result.userId,
      userEmail: result.userEmail || '',
    };
    const paymentProviders =
      result.payments?.map((p) => p.paymentProvider).join('; ') || '';
    const paymentIds = result.payments?.map((p) => p.id).join('; ') || '';

    // Add successful renewals
    if (result.successes) {
      for (const success of result.successes) {
        const domainCharge = result.chargeAmountByDomainLdh?.[success.domain];
        lines.push(
          [
            success.domain,
            baseRow.userId,
            baseRow.userEmail,
            'SUCCESS',
            formatRegistrarName(success.registrar || 'Unknown'),
            domainCharge != null ? domainCharge.toFixed(2) : '0.00',
            '0.00',
            paymentProviders,
            paymentIds,
            '',
            '',
            new Date().toISOString(),
          ]
            .map(escapeCSV)
            .join(','),
        );
      }
    }

    // Add failed renewals — refund equals the charge for that domain
    if (result.failures) {
      for (const failure of result.failures) {
        const domainCharge = result.chargeAmountByDomainLdh?.[failure.domain];
        const chargeStr =
          domainCharge != null ? domainCharge.toFixed(2) : '0.00';

        lines.push(
          [
            failure.domain,
            baseRow.userId,
            baseRow.userEmail,
            'FAILED',
            formatRegistrarName(failure.registrar || 'Unknown'),
            chargeStr,
            chargeStr, // refund = charge for failed domains
            paymentProviders,
            paymentIds,
            failure.reason,
            determineActionRequired(failure.reason),
            new Date().toISOString(),
          ]
            .map(escapeCSV)
            .join(','),
        );
      }
    }

    // Add skipped entries
    if (result.status === 'skipped' && result.domainsProcessed === 0) {
      lines.push(
        [
          'N/A',
          baseRow.userId,
          baseRow.userEmail,
          'SKIPPED',
          '',
          '0.00',
          '0.00',
          '',
          '',
          'No domains to process',
          '',
          new Date().toISOString(),
        ]
          .map(escapeCSV)
          .join(','),
      );
    }
  }

  // Add summary section
  lines.push('');
  lines.push('SUMMARY');
  lines.push(`Total Users Processed,${metrics.totalUsersProcessed}`);
  lines.push(`Total Domains Processed,${metrics.totalDomainsProcessed}`);
  lines.push(`Successful Renewals,${metrics.successfulRenewals}`);
  lines.push(`Failed Renewals,${metrics.failedRenewals}`);
  lines.push(
    `Total Amount Charged,$${metrics.totalAmountChargedInUsd.toFixed(2)}`,
  );
  lines.push(
    `Total Amount Refunded,$${metrics.totalAmountRefundedInUsd.toFixed(2)}`,
  );
  lines.push(
    `Net Revenue,$${(metrics.totalAmountChargedInUsd - metrics.totalAmountRefundedInUsd).toFixed(2)}`,
  );

  ctx.log.info(`Generated CSV with ${lines.length} lines`);
  return lines.join('\n');
}

/**
 * Generate detailed Markdown report with complete tables
 */
export async function generateAutoRenewReportMarkdown(
  input: AutoRenewReportInput,
  metrics: AutoRenewMetrics,
): Promise<string> {
  const ctx = Context.current();
  ctx.log.info('Generating auto-renewal detailed Markdown report');

  const dateStr = format(metrics.reportDate || new Date(), 'MMM do, yyyy');
  let content = `# Auto-Renewal Detailed Report - ${dateStr}\n\n`;

  // Overview section
  content += '## Overview\n\n';
  content += `- **Total Users Processed:** ${metrics.totalUsersProcessed}\n`;
  content += `- **Total Domains Processed:** ${metrics.totalDomainsProcessed}\n`;
  content += `- **Successful Renewals:** ${metrics.successfulRenewals}\n`;
  content += `- **Failed Renewals:** ${metrics.failedRenewals}\n`;
  content += `- **Success Rate:** ${((metrics.successfulRenewals / Math.max(metrics.totalDomainsProcessed, 1)) * 100).toFixed(1)}%\n\n`;

  // Financial Summary
  content += '## Financial Summary\n\n';
  content += '| Metric | Amount |\n';
  content += '|--------|--------|\n';
  content += `| Total Charged | $${metrics.totalAmountChargedInUsd.toFixed(2)} |\n`;
  content += `| Total Refunded | $${metrics.totalAmountRefundedInUsd.toFixed(2)} |\n`;
  content += `| Net Revenue | $${(metrics.totalAmountChargedInUsd - metrics.totalAmountRefundedInUsd).toFixed(2)} |\n\n`;

  // Payment Method Breakdown
  if (Object.keys(metrics.paymentMethodBreakdown || {}).length > 0) {
    content += '## Payment Methods\n\n';
    content += '| Method | Count | Amount | Percentage |\n';
    content += '|--------|-------|--------|------------|\n';

    for (const [method, data] of Object.entries(
      metrics.paymentMethodBreakdown,
    )) {
      const percentage =
        metrics.totalAmountChargedInUsd > 0
          ? (
              (data.amountInUsd / metrics.totalAmountChargedInUsd) *
              100
            ).toFixed(1)
          : '0.0';
      content += `| ${method} | ${data.count} | $${data.amountInUsd.toFixed(2)} | ${percentage}% |\n`;
    }
    content += '\n';
  }

  // Registrar Breakdown
  if (Object.keys(metrics.registrarBreakdown || {}).length > 0) {
    content += '## Registrar Performance\n\n';
    content += '| Registrar | Successful | Failed | Total | Success Rate |\n';
    content += '|-----------|------------|--------|-------|-------------|\n';

    for (const [registrar, stats] of Object.entries(
      metrics.registrarBreakdown,
    )) {
      const total = stats.successful + stats.failed;
      const successRate =
        total > 0 ? ((stats.successful / total) * 100).toFixed(1) : '0.0';
      const displayName = formatRegistrarName(registrar);
      content += `| ${displayName} | ${stats.successful} | ${stats.failed} | ${total} | ${successRate}% |\n`;
    }
    content += '\n';
  }

  // All Critical Domains (no truncation)
  if (metrics.criticalDomains && metrics.criticalDomains.length > 0) {
    content += `## All Critical Domains Requiring Action (${metrics.criticalDomains.length} total)\n\n`;

    // Group by action required
    const criticalByAction: Record<string, typeof metrics.criticalDomains> = {};
    for (const domain of metrics.criticalDomains) {
      if (!criticalByAction[domain.actionRequired]) {
        criticalByAction[domain.actionRequired] = [];
      }
      criticalByAction[domain.actionRequired].push(domain);
    }

    for (const [action, domains] of Object.entries(criticalByAction)) {
      content += `### ${action} (${domains.length} domains)\n\n`;
      content += '| Domain | User ID | User Email | Issue | Registrar |\n';
      content += '|--------|---------|------------|-------|----------|\n';

      for (const domain of domains) {
        content += `| ${domain.domain} | ${domain.userId} | ${domain.userEmail || 'N/A'} | ${domain.issue} | ${formatRegistrarName(domain.registrar || 'Unknown')} |\n`;
      }
      content += '\n';
    }
  }

  // Detailed Transaction Log
  content += '## Detailed Transaction Log\n\n';
  content +=
    '| User ID | Email | Domains Processed | Status | Amount Charged | Amount Refunded | Payment Method |\n';
  content +=
    '|---------|-------|-------------------|--------|----------------|-----------------|----------------|\n';

  for (const result of input.workflowResults) {
    const paymentMethod =
      result.payments?.map((p) => p.paymentProvider).join(', ') || 'N/A';
    content += `| ${result.userId} | ${result.userEmail || 'N/A'} | ${result.domainsProcessed || 0} | ${result.status} | $${(result.amountChargedInUsd || 0).toFixed(2)} | $${(result.amountRefundedInUsd || 0).toFixed(2)} | ${paymentMethod} |\n`;
  }
  content += '\n';

  // System Health
  content += '## System Health Metrics\n\n';
  content += `- **Workflow Execution Time:** ${Math.floor((metrics.executionMetrics?.totalExecutionTime || 0) / 60000)}m ${Math.floor(((metrics.executionMetrics?.totalExecutionTime || 0) % 60000) / 1000)}s\n`;
  content += `- **Average Time per User:** ${((metrics.executionMetrics?.averageTimePerUser || 0) / 1000).toFixed(1)}s\n`;
  content += `- **Child Workflows Spawned:** ${metrics.executionMetrics?.childWorkflowsSpawned || 0}\n\n`;

  content += '---\n\n';
  content +=
    '*Generated automatically by the Auto-Renewal Daily Report workflow*\n';
  content += `*Report generated at: ${new Date().toISOString()}*\n`;

  ctx.log.info(
    `Generated detailed Markdown report with ${content.length} characters`,
  );
  return content;
}

/**
 * Check domain transfer periods using RDAP
 */
export async function checkDomainTransferPeriods(
  domains: NamefiNormalizedDomain[],
): Promise<
  Record<
    NamefiNormalizedDomain,
    {
      isTransferPeriod: boolean;
      isAddPeriod: boolean;
      locked: boolean;
      error?: boolean;
    }
  >
> {
  const ctx = Context.current();
  ctx.log.info(`Checking transfer periods for ${domains.length} domains`);

  const results: Record<string, any> = {};

  // Process domains in batches to avoid rate limiting
  const batchSize = 10;
  const delayMs = 1000; // 1 second delay between batches

  for (let i = 0; i < domains.length; i += batchSize) {
    const batch = domains.slice(i, i + batchSize);

    // Process batch in parallel
    const batchPromises = batch.map(async (domain) => {
      try {
        const lockState = await getEppLockState(toPunycodeDomainName(domain));
        results[domain] = {
          isTransferPeriod: lockState.isTransferPeriod,
          isAddPeriod: lockState.isAddPeriod,
          locked: lockState.locked,
        };
      } catch (error) {
        ctx.log.warn(`Failed to get lock state for ${domain}`, { error });
        results[domain] = {
          isTransferPeriod: false,
          isAddPeriod: false,
          locked: false,
          error: true,
        };
      }
    });

    await Promise.all(batchPromises);

    // Add delay between batches (except for the last batch)
    if (i + batchSize < domains.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const transferPeriodCount = Object.values(results).filter(
    (r: any) => r.isTransferPeriod,
  ).length;
  const addPeriodCount = Object.values(results).filter(
    (r: any) => r.isAddPeriod,
  ).length;
  const lockedCount = Object.values(results).filter(
    (r: any) => r.locked,
  ).length;
  const errorCount = Object.values(results).filter((r: any) => r.error).length;

  ctx.log.info('Domain transfer period check complete', {
    total: domains.length,
    transferPeriod: transferPeriodCount,
    addPeriod: addPeriodCount,
    locked: lockedCount,
    errors: errorCount,
  });

  return results;
}

/**
 * Helper function to escape CSV values
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Helper function to format registrar names
 */
function formatRegistrarName(registrar: string): string {
  switch (registrar) {
    case 'dynadot_gdg':
      return 'Dynadot (GDG)';
    case 'dynadot_regular':
      return 'Dynadot (Regular)';
    case 'route53':
      return 'Route 53';
    default:
      return registrar || 'Unknown';
  }
}
