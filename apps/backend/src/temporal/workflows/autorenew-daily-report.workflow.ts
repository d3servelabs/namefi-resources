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

    // Domains deferred this cycle because NFSC balance was short. These
    // are surfaced as "failures" in the report with a specific reason so
    // operators can distinguish from hard failures.
    if (result.domainsSkippedDueToInsufficientFunds) {
      for (const domain of result.domainsSkippedDueToInsufficientFunds) {
        failedDomains.push({
          domain: domain.normalizedDomainName,
          reason: `Skipped due to insufficient balance${
            typeof result.shortfallInUsdCents === 'number'
              ? ` (short by $${(result.shortfallInUsdCents / 100).toFixed(2)})`
              : ''
          }`,
          registrar: domain.registrarKey,
        });
      }
    }

    // Handle payment failures
    if (result.paymentStatus === 'FAILED') {
      if (result.domainsThatCouldBeRenewed) {
        const paymentFailureReason =
          typeof result.shortfallInUsdCents === 'number' &&
          result.shortfallInUsdCents > 0
            ? `Skipped due to insufficient balance (short by $${(result.shortfallInUsdCents / 100).toFixed(2)})`
            : result.message || 'Payment failed';
        for (const domain of result.domainsThatCouldBeRenewed) {
          failedDomains.push({
            domain: domain.normalizedDomainName,
            reason: paymentFailureReason,
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
      status:
        result.paymentStatus === 'FAILED'
          ? 'failure'
          : result.paymentStatus === 'SKIPPED'
            ? 'skipped'
            : 'success',
      domainsProcessed: processedDomains.length + failedDomains.length || 0,
      amountChargedInUsd: result.totalAmountInUsd || 0,
      amountRefundedInUsd: result.refundAmountInUsd || 0,
      payments: result.payments,
      failures: failedDomains,
      successes: processedDomains,
      chargeAmountByDomainLdh: result.chargeAmountByDomainLdh,
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

  // Compute metrics via the collectAutoRenewMetrics activity.
  // The activity delegates to computeAutoRenewMetricsFromResults internally,
  // so we only pass the execution-time and notification count that the
  // pure function cannot derive from workflowResults alone.
  const seedMetrics = {
    executionMetrics: {
      totalExecutionTime: executionTime,
      averageTimePerUser: 0,
      childWorkflowsSpawned: 0,
    },
    userCommunication: {
      upcomingRenewalNotifications: successes.length,
      successfulRenewalConfirmations: 0,
      failedRenewalAlerts: 0,
      paymentFailureNotifications: 0,
    },
  } as AutoRenewMetrics;

  const finalMetrics = await collectAutoRenewMetrics({
    metrics: seedMetrics,
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
