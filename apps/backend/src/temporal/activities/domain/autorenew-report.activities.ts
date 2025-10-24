import { Context } from '@temporalio/activity';
import { format } from 'date-fns';
import type { PaymentProvider, PaymentSelect } from '@namefi-astra/db/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { secrets } from '#lib/env';
import { sendMail } from '../../../mail/mail-client';
import React from 'react';
import { render } from '@react-email/components';
import { AutoRenewDailyReport } from '../../../mail/templates/autorenew-daily-report';

export interface AutoRenewMetrics {
  reportDate: Date;
  totalUsersProcessed: number;
  totalDomainsProcessed: number;
  successfulRenewals: number;
  failedRenewals: number;
  totalAmountChargedInUsd: number;
  totalAmountRefundedInUsd: number;
  paymentMethodBreakdown: Record<
    PaymentProvider,
    {
      count: number;
      amountInUsd: number;
    }
  >;
  failureBreakdown: {
    failedToCharge: number;
    registrarErrors: number;
    missingPriceData: number;
  };
  criticalDomains: Array<{
    domain: NamefiNormalizedDomain;
    userId: string;
    userEmail?: string;
    issue: string;
    registrar?: string;
    expirationDate?: Date;
    actionRequired: string;
  }>;
  userCommunication: {
    upcomingRenewalNotifications: number;
    successfulRenewalConfirmations: number;
    failedRenewalAlerts: number;
    paymentFailureNotifications: number;
  };
  executionMetrics: {
    totalExecutionTime: number;
    averageTimePerUser: number;
    childWorkflowsSpawned: number;
  };
  registrarBreakdown: Record<
    string,
    {
      successful: number;
      failed: number;
    }
  >;
  largestTransaction: {
    userId: string;
    amount: number;
    domainCount: number;
  };
  comparisonWithPreviousDay?: {
    renewalsDiff: number;
    revenueDiff: number;
    failuresDiff: number;
    successRateDiff: number;
  };
}

export interface AutoRenewReportInput {
  metrics: AutoRenewMetrics;
  workflowResults: {
    userId: string;
    userEmail?: string;
    status: 'success' | 'failure' | 'skipped';
    domainsProcessed?: number;
    amountChargedInUsd?: number;
    amountRefundedInUsd?: number;
    payments?: PaymentSelect[];
    failures?: {
      domain: NamefiNormalizedDomain;
      reason: string;
      registrar?: string;
    }[];
    successes?: {
      domain: NamefiNormalizedDomain;
      registrar?: string;
    }[];
  }[];
}

/**
 * Collect comprehensive metrics from auto-renewal workflow results
 */
export async function collectAutoRenewMetrics(
  input: AutoRenewReportInput,
): Promise<AutoRenewMetrics> {
  const ctx = Context.current();
  ctx.log.info('Collecting auto-renewal metrics');

  const { workflowResults } = input;
  const metrics = input.metrics || ({} as AutoRenewMetrics);

  // Calculate totals
  metrics.totalUsersProcessed = workflowResults.length;
  metrics.totalDomainsProcessed = workflowResults.reduce(
    (sum, result) => sum + (result.domainsProcessed || 0),
    0,
  );

  // Calculate success/failure counts
  const successResults = workflowResults.filter((r) => r.status === 'success');
  const failureResults = workflowResults.filter((r) => r.status === 'failure');

  metrics.successfulRenewals = successResults.reduce(
    (sum, result) => sum + (result.successes?.length || 0),
    0,
  );
  metrics.failedRenewals = failureResults.reduce(
    (sum, result) => sum + (result.failures?.length || 0),
    0,
  );

  // Calculate financial metrics
  metrics.totalAmountChargedInUsd = workflowResults.reduce(
    (sum, result) => sum + (result.amountChargedInUsd || 0),
    0,
  );
  metrics.totalAmountRefundedInUsd = workflowResults.reduce(
    (sum, result) => sum + (result.amountRefundedInUsd || 0),
    0,
  );

  // Payment method breakdown
  metrics.paymentMethodBreakdown = workflowResults.reduce(
    (breakdown, result) => {
      for (const payment of result.payments || []) {
        if (payment.paymentProvider && result.amountChargedInUsd) {
          if (!breakdown[payment.paymentProvider]) {
            breakdown[payment.paymentProvider] = { count: 0, amountInUsd: 0 };
          }
          breakdown[payment.paymentProvider].count += 1;
          breakdown[payment.paymentProvider].amountInUsd +=
            payment.amountInUSDCents / 100; // Convert cents to USD
        }
      }
      return breakdown;
    },
    {} as Record<PaymentProvider, { count: number; amountInUsd: number }>,
  );

  // Collect critical domains requiring action
  metrics.criticalDomains = [];
  for (const result of workflowResults) {
    if (result.failures) {
      for (const failure of result.failures) {
        let actionRequired = 'Manual investigation required';
        if (failure.reason.includes('price')) {
          actionRequired = 'Update pricing data';
        } else if (failure.reason.includes('locked')) {
          actionRequired = 'Unlock domain and retry';
        } else if (failure.reason.includes('timeout')) {
          actionRequired = 'Retry renewal';
        } else if (
          failure.reason.includes('balance') ||
          failure.reason.includes('payment')
        ) {
          actionRequired = 'Contact user about payment';
        }

        metrics.criticalDomains.push({
          domain: failure.domain,
          userId: result.userId,
          userEmail: result.userEmail,
          issue: failure.reason,
          registrar: failure.registrar,
          actionRequired,
        });
      }
    }
  }

  // Sort critical domains by urgency
  metrics.criticalDomains.sort((a, b) => {
    const urgencyOrder = [
      'Update pricing data',
      'Unlock domain and retry',
      'Retry renewal',
      'Contact user about payment',
      'Manual investigation required',
    ];
    return (
      urgencyOrder.indexOf(a.actionRequired) -
      urgencyOrder.indexOf(b.actionRequired)
    );
  });

  ctx.log.info('Auto-renewal metrics collected successfully', { metrics });
  return metrics;
}

/**
 * Format the auto-renewal report for email/Slack
 */
export async function formatAutoRenewReport(
  metrics: AutoRenewMetrics,
): Promise<{ title: string; content: string }> {
  const ctx = Context.current();
  ctx.log.info('Formatting auto-renewal report');
  const reportDate = metrics.reportDate || new Date();
  const dateStr = reportDate.toISOString().split('T')[0];
  const title = `${dateStr} Auto-Renewal Daily Report`;

  const successRate =
    metrics.totalDomainsProcessed > 0
      ? (
          (metrics.successfulRenewals / metrics.totalDomainsProcessed) *
          100
        ).toFixed(1)
      : '0';

  const netRevenue =
    metrics.totalAmountChargedInUsd - metrics.totalAmountRefundedInUsd;

  // Build payment method breakdown
  let paymentBreakdown = '';
  for (const [method, data] of Object.entries(
    metrics.paymentMethodBreakdown || {},
  )) {
    const percentage =
      metrics.totalAmountChargedInUsd > 0
        ? ((data.amountInUsd / metrics.totalAmountChargedInUsd) * 100).toFixed(
            0,
          )
        : '0';
    paymentBreakdown += `- ${method}: $${data.amountInUsd.toFixed(2)} (${percentage}%)\n`;
  }

  // Build critical domains table
  let criticalDomainsTable = '';
  if (metrics.criticalDomains && metrics.criticalDomains.length > 0) {
    // Group by action required
    const criticalByAction: Record<string, typeof metrics.criticalDomains> = {};
    for (const domain of metrics.criticalDomains) {
      if (!criticalByAction[domain.actionRequired]) {
        criticalByAction[domain.actionRequired] = [];
      }
      criticalByAction[domain.actionRequired].push(domain);
    }

    for (const [action, domains] of Object.entries(criticalByAction)) {
      criticalDomainsTable += `\n### ${action} (${domains.length})\n\n`;
      criticalDomainsTable += '<div id="markdown-table">\n\n';
      criticalDomainsTable +=
        '| Domain | User | Issue | Registrar | Action |\n';
      criticalDomainsTable +=
        '|:------:|:----:|:-----:|:---------:|:------:|\n';

      // Show up to 10 domains per action type
      const displayDomains = domains.slice(0, 10);
      for (const domain of displayDomains) {
        const userDisplay = domain.userEmail || domain.userId.slice(0, 8);
        criticalDomainsTable += `| ${domain.domain} | ${userDisplay} | ${domain.issue.slice(0, 30)} | ${domain.registrar || 'Unknown'} | ${domain.actionRequired} |\n`;
      }

      if (domains.length > 10) {
        criticalDomainsTable += `\n*... and ${domains.length - 10} more domains requiring "${action}"*\n`;
      }

      criticalDomainsTable += '\n</div>\n';
    }
  }

  // Build registrar breakdown
  let registrarStats = '';
  for (const [registrar, stats] of Object.entries(
    metrics.registrarBreakdown || {},
  )) {
    registrarStats += `- ${registrar}: ${stats.successful} successful, ${stats.failed} failed\n`;
  }

  const content = `## 📊 Auto-Renewal Overview

**Date:** ${dateStr}
**Total Users Processed:** ${metrics.totalUsersProcessed}
**Total Domains Processed:** ${metrics.totalDomainsProcessed}
**Success Rate:** ${successRate}%

## 💰 Financial Summary

**Total Amount Charged:** $${metrics.totalAmountChargedInUsd.toFixed(2)} USD
**Total Amount Refunded:** $${metrics.totalAmountRefundedInUsd.toFixed(2)} USD
**Net Revenue:** $${netRevenue.toFixed(2)} USD

**Payment Methods Used:**
${paymentBreakdown || '- No payments processed'}

## ✅ Successful Renewals

**Domains Successfully Renewed:** ${metrics.successfulRenewals} (${successRate}%)
**Users with Successful Renewals:** ${metrics.totalUsersProcessed - (metrics.failureBreakdown?.failedToCharge || 0)}

### Registrar Breakdown:
${registrarStats || '- No registrar data available'}

## ❌ Failed Renewals

**Total Failures:** ${metrics.failedRenewals} (${((metrics.failedRenewals / Math.max(metrics.totalDomainsProcessed, 1)) * 100).toFixed(1)}%)

### Failure Breakdown:
- **🔴 Failed to Charge:** ${metrics.failureBreakdown?.failedToCharge || 0} domains
- **🟡 Registrar Errors:** ${metrics.failureBreakdown?.registrarErrors || 0} domains
- **🟠 Missing Price Data:** ${metrics.failureBreakdown?.missingPriceData || 0} domains

## 🚨 Critical Issues Requiring Action

${
  metrics.criticalDomains && metrics.criticalDomains.length > 0
    ? criticalDomainsTable
    : '✅ No critical issues requiring immediate action.'
}

## 📋 User Communication

**Email Notifications Sent:**
- Upcoming renewal notifications: ${metrics.userCommunication?.upcomingRenewalNotifications || 0}
- Successful renewal confirmations: ${metrics.userCommunication?.successfulRenewalConfirmations || 0}
- Failed renewal alerts: ${metrics.userCommunication?.failedRenewalAlerts || 0}
- Payment failure notifications: ${metrics.userCommunication?.paymentFailureNotifications || 0}

## 🛠️ System Health

**Workflow Execution Time:** ${Math.floor((metrics.executionMetrics?.totalExecutionTime || 0) / 60000)}m ${Math.floor(((metrics.executionMetrics?.totalExecutionTime || 0) % 60000) / 1000)}s
**Average Processing Time per User:** ${((metrics.executionMetrics?.averageTimePerUser || 0) / 1000).toFixed(1)}s
**Child Workflows Spawned:** ${metrics.executionMetrics?.childWorkflowsSpawned || 0}

## 🎯 Action Items Priority

${
  metrics.criticalDomains && metrics.criticalDomains.length > 0
    ? `
1. **URGENT:** Process ${metrics.failureBreakdown?.missingPriceData || 0} domains with missing price data
2. **HIGH:** Investigate registrar errors for ${metrics.failureBreakdown?.registrarErrors || 0} domains
3. **MEDIUM:** Review ${metrics.failureBreakdown?.failedToCharge || 0} payment failures
4. **LOW:** Monitor successful renewals for any post-renewal issues
`
    : '✅ All renewals processed successfully - no action items required'
}

${
  metrics.largestTransaction
    ? `
## 📈 Notable Transactions

**Largest Single Transaction:**
- User: ${metrics.largestTransaction.userId.slice(0, 8)}...
- Amount: $${metrics.largestTransaction.amount.toFixed(2)}
- Domains: ${metrics.largestTransaction.domainCount}
`
    : ''
}

---

*This report is generated automatically by the Auto-Renewal Daily Report workflow.*
*For detailed information, check the admin panel or Temporal workflow history.*`;

  return { title, content };
}

/**
 * Send auto-renewal report to Slack (if webhook URL is configured)
 */
export async function sendAutoRenewReportToSlack(
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

    ctx.log.info('Successfully sent auto-renewal report to Slack');
  } catch (error) {
    ctx.log.error('Failed to send auto-renewal report to Slack', { error });
    throw error;
  }
}

/**
 * Send auto-renewal report via email to reporting@namefi.io
 */
export async function sendAutoRenewReportEmail(
  title: string,
  content: string,
): Promise<void> {
  const ctx = Context.current();

  try {
    // Create React email template
    const emailTemplate = React.createElement(AutoRenewDailyReport, {
      title,
      reportContent: content,
    });

    // Render the template to HTML and plain text
    const html = await render(emailTemplate);
    const plain = await render(emailTemplate, { plainText: true });

    await sendMail({
      to: ['reports+autorenew@d3serve.xyz'],
      subject: title,
      content: {
        html,
        plain,
      },
      from: 'Auto-Renewal System <noreply@d3serve.xyz>',
    });

    ctx.log.info(
      'Successfully sent auto-renewal report email to reports+autorenew@d3serve.xyz',
    );
  } catch (error) {
    ctx.log.error('Failed to send auto-renewal report email', { error });
    throw error;
  }
}

/**
 * Convert content into Slack text blocks with proper size limits
 */
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
