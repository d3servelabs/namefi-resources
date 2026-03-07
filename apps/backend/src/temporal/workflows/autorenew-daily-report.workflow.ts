import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import type { SingleUserRenewalResult } from './autorenew-daily-emails.workflow';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';
import type {
  AutoRenewMetrics,
  AutoRenewReportInput,
} from '../activities/domain/autorenew-report.activities';

// Auto-renewal report activities
const {
  collectAutoRenewMetrics,
  formatAutoRenewReport,
  sendAutoRenewReportToSlackWithAttachments,
  sendAutoRenewReportEmailWithAttachments,
  checkDomainTransferPeriods,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: {
    ...shortRunningOpts,
    startToCloseTimeout: '5m',
  },
});

/**
 * Generate and send comprehensive auto-renewal report
 */
export async function generateAndSendInternalAutoRenewReportWorkflow({
  successes,
  failures,
  skipped,
  executionTime,
  forceSendReport,
}: {
  successes: Array<{
    status: 'fulfilled';
    userId: string;
    result: SingleUserRenewalResult;
  }>;
  failures: Array<{
    status: 'rejected';
    userId: string;
    error: Error;
  }>;
  skipped: Array<{
    status: string;
    userId: string;
  }>;
  executionTime: number;
  forceSendReport: boolean;
}) {
  workflow.log.info('Generating auto-renewal daily report');

  // Build workflow results for metrics collection
  const workflowResults: AutoRenewReportInput['workflowResults'] = [];

  // Process successful renewals
  for (const success of successes) {
    const result = success.result;
    if (!result) continue;

    const processedDomains: Array<{
      domain: NamefiNormalizedDomain;
      registrar?: string;
    }> = [];
    const failedDomains: Array<{
      domain: NamefiNormalizedDomain;
      reason: string;
      registrar?: string;
    }> = [];

    // Count successes and failures from the result
    if (result.successes) {
      for (const s of result.successes) {
        processedDomains.push({
          domain: s.domain.normalizedDomainName,
          registrar: s.domain.registrarKey,
        });
      }
    }

    if (result.failures) {
      for (const f of result.failures) {
        failedDomains.push({
          domain: f.domain.normalizedDomainName,
          reason: f.error?.message || 'Unknown error',
          registrar: f.domain.registrarKey,
        });
      }
    }

    // Handle payment failures
    if (result.paymentStatus === 'FAILED') {
      if (result.domainsThatCouldBeRenewed) {
        for (const domain of result.domainsThatCouldBeRenewed) {
          failedDomains.push({
            domain: domain.normalizedDomainName,
            reason: result.message || 'Payment failed',
            registrar: undefined,
          });
        }
      }
    }

    // Handle domains with missing price data
    for (const domain of result.domainsMissingPriceData) {
      failedDomains.push({
        domain: domain.normalizedDomainName,
        reason: 'Missing price data',
        registrar: domain.registrarKey,
      });
    }

    workflowResults.push({
      userId: success.userId,
      userEmail: result.userEmail,
      status: result.paymentStatus === 'FAILED' ? 'failure' : 'success',
      domainsProcessed: processedDomains.length + failedDomains.length || 0,
      amountChargedInUsd: result.totalAmountInUsd || 0,
      amountRefundedInUsd: result.refundAmountInUsd || 0,
      payments: result.payments,
      failures: failedDomains,
      successes: processedDomains,
    });
  }

  // Process workflow failures
  for (const failure of failures) {
    workflowResults.push({
      userId: failure.userId,
      status: 'failure',
      domainsProcessed: 0,
      amountChargedInUsd: 0,
      amountRefundedInUsd: 0,
      failures: [
        {
          domain: 'Unknown' as NamefiNormalizedDomain,
          reason: `Workflow failed: ${failure.error?.message || 'Unknown error'}`,
        },
      ],
    });
  }

  // Process skipped users
  for (const skip of skipped) {
    workflowResults.push({
      userId: skip.userId,
      status: 'skipped',
      domainsProcessed: 0,
      amountChargedInUsd: 0,
      amountRefundedInUsd: 0,
    });
  }

  // Calculate detailed metrics
  const metrics: AutoRenewMetrics = {
    reportDate: new Date(),
    totalUsersProcessed: workflowResults.length,
    totalDomainsProcessed: 0,
    successfulRenewals: 0,
    failedRenewals: 0,
    totalAmountChargedInUsd: 0,
    totalAmountRefundedInUsd: 0,
    paymentMethodBreakdown: {
      NFSC_BASE: { count: 0, amountInUsd: 0 },
      NFSC_ETHEREUM: { count: 0, amountInUsd: 0 },
      NFSC_ETHEREUM_SEPOLIA: { count: 0, amountInUsd: 0 },
      STRIPE: { count: 0, amountInUsd: 0 },
      X402: { count: 0, amountInUsd: 0 },
    },
    failureBreakdown: {
      failedToCharge: 0,
      registrarErrors: 0,
      missingPriceData: 0,
    },
    criticalDomains: [],
    userCommunication: {
      upcomingRenewalNotifications: successes.length,
      successfulRenewalConfirmations: 0,
      failedRenewalAlerts: 0,
      paymentFailureNotifications: 0,
    },
    executionMetrics: {
      totalExecutionTime: executionTime,
      averageTimePerUser:
        workflowResults.length > 0 ? executionTime / workflowResults.length : 0,
      childWorkflowsSpawned: workflowResults.length,
    },
    registrarBreakdown: {},
    largestTransaction: {
      userId: '',
      amount: 0,
      domainCount: 0,
    },
  };

  // Process metrics from results
  for (const result of workflowResults) {
    metrics.totalDomainsProcessed += result.domainsProcessed || 0;
    metrics.totalAmountChargedInUsd += result.amountChargedInUsd || 0;
    metrics.totalAmountRefundedInUsd += result.amountRefundedInUsd || 0;

    // Count successes and failures
    if (result.successes) {
      metrics.successfulRenewals += result.successes.length;
      for (const success of result.successes) {
        const registrar = success.registrar || 'Unknown';
        if (!metrics.registrarBreakdown[registrar]) {
          metrics.registrarBreakdown[registrar] = { successful: 0, failed: 0 };
        }
        metrics.registrarBreakdown[registrar].successful++;
      }
    }

    if (result.failures) {
      metrics.failedRenewals += result.failures.length;
      for (const failure of result.failures) {
        const registrar = failure.registrar || 'Unknown';
        if (!metrics.registrarBreakdown[registrar]) {
          metrics.registrarBreakdown[registrar] = { successful: 0, failed: 0 };
        }
        metrics.registrarBreakdown[registrar].failed++;

        // Categorize failures
        if (
          failure.reason.toLowerCase().includes('charge') ||
          failure.reason.toLowerCase().includes('payment')
        ) {
          metrics.failureBreakdown.failedToCharge++;
        } else if (failure.reason.toLowerCase().includes('price')) {
          metrics.failureBreakdown.missingPriceData++;
        } else {
          metrics.failureBreakdown.registrarErrors++;
        }

        // Add to critical domains if not a simple payment failure
        if (
          !failure.reason.toLowerCase().includes('insufficient') &&
          !failure.reason.toLowerCase().includes('declined')
        ) {
          metrics.criticalDomains.push({
            domain: failure.domain,
            userId: result.userId,
            userEmail: result.userEmail,
            issue: failure.reason,
            registrar: failure.registrar,
            actionRequired: _determineActionRequired(failure.reason),
          });
        }
      }
    }

    // Track payment methods
    if (result.payments && result.amountChargedInUsd) {
      for (const { paymentProvider, amountInUsdCents } of result.payments) {
        if (!metrics.paymentMethodBreakdown[paymentProvider]) {
          metrics.paymentMethodBreakdown[paymentProvider] = {
            count: 0,
            amountInUsd: 0,
          };
        }
        metrics.paymentMethodBreakdown[paymentProvider].count++;
        metrics.paymentMethodBreakdown[paymentProvider].amountInUsd +=
          amountInUsdCents / 100; // Convert cents to USD
      }
    }

    // Track largest transaction
    if (
      result.amountChargedInUsd &&
      result.amountChargedInUsd > metrics.largestTransaction.amount
    ) {
      metrics.largestTransaction = {
        userId: result.userId,
        amount: result.amountChargedInUsd,
        domainCount: result.domainsProcessed || 0,
      };
    }

    // Update communication counts
    if (result.status === 'success' && result.userEmail) {
      metrics.userCommunication.successfulRenewalConfirmations++;
    } else if (result.status === 'failure' && result.userEmail) {
      if (result.failures?.some((f) => f.reason.includes('payment'))) {
        metrics.userCommunication.paymentFailureNotifications++;
      } else {
        metrics.userCommunication.failedRenewalAlerts++;
      }
    }
  }

  // Collect final metrics
  const finalMetrics = await collectAutoRenewMetrics({
    metrics,
    workflowResults,
  });

  // Check domain transfer periods if there are domains to check
  if (finalMetrics.totalDomainsProcessed > 0) {
    const allDomains: NamefiNormalizedDomain[] = [];

    // Collect all processed domains
    for (const result of workflowResults) {
      if (result.successes) {
        for (const success of result.successes) {
          allDomains.push(success.domain);
        }
      }
      if (result.failures) {
        for (const failure of result.failures) {
          allDomains.push(failure.domain);
        }
      }
    }

    // Check transfer periods for all domains
    if (allDomains.length > 0) {
      try {
        const domainLockStatus = await checkDomainTransferPeriods(allDomains);

        // Update metrics with transfer period information
        finalMetrics.domainLockStatus = domainLockStatus;
        finalMetrics.domainsInTransferPeriod = Object.values(
          domainLockStatus,
        ).filter((d) => d.isTransferPeriod).length;
        finalMetrics.domainsInAddPeriod = Object.values(
          domainLockStatus,
        ).filter((d) => d.isAddPeriod).length;
        finalMetrics.lockedDomains = Object.values(domainLockStatus).filter(
          (d) => d.locked,
        ).length;
      } catch (error) {
        workflow.log.warn('Failed to check domain transfer periods', { error });
      }
    }
  }

  // Format the report
  const { title, content } = await formatAutoRenewReport(finalMetrics);

  // Determine if we should send the report
  const shouldSendReport =
    forceSendReport ||
    finalMetrics.failedRenewals > 0 ||
    finalMetrics.criticalDomains.length > 0 ||
    finalMetrics.totalDomainsProcessed > 0;

  if (shouldSendReport) {
    workflow.log.info('Sending auto-renewal report', {
      title,
      totalProcessed: finalMetrics.totalDomainsProcessed,
      failures: finalMetrics.failedRenewals,
      criticalIssues: finalMetrics.criticalDomains.length,
      domainsInTransferPeriod: finalMetrics.domainsInTransferPeriod || 0,
    });

    // Prepare report input for both Slack and email
    const reportInput: AutoRenewReportInput = {
      metrics: finalMetrics,
      workflowResults,
    };

    // Send to Slack with attachment notice
    await catchAndAlertLocally(
      async () => {
        await sendAutoRenewReportToSlackWithAttachments(
          title,
          content,
          reportInput,
          finalMetrics,
        );
      },
      {
        message: 'Failed to send auto-renewal report to Slack',
        details: { title },
      },
    );

    // Send via email with attachments
    await catchAndAlertLocally(
      async () => {
        await sendAutoRenewReportEmailWithAttachments(
          title,
          content,
          reportInput,
          finalMetrics,
        );
      },
      {
        message: 'Failed to send auto-renewal report email with attachments',
        details: { title },
      },
    );

    workflow.log.info('Auto-renewal report sent successfully');
  } else {
    workflow.log.info('No auto-renewal activity to report, skipping report');
  }
}

/**
 * Determine the action required based on the error message
 */
function _determineActionRequired(errorMessage: string): string {
  const lowerError = errorMessage.toLowerCase();

  if (lowerError.includes('price') || lowerError.includes('pricing')) {
    return 'Check pricing data';
  }
  if (lowerError.includes('locked')) {
    return 'Unlock domain and retry';
  }
  if (lowerError.includes('timeout')) {
    return 'Retry renewal';
  }
  if (lowerError.includes('api')) {
    return 'Check registrar API';
  }
  if (lowerError.includes('expired')) {
    return 'Domain already expired';
  }
  if (lowerError.includes('balance') || lowerError.includes('payment')) {
    return 'Contact user about payment';
  }
  return 'Manual investigation required';
}
