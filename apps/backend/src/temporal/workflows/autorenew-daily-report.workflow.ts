import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import type { SingleUserRenewalResult } from './autorenew-daily-emails.workflow';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';
import { formatDeferredRowReason } from '../shared/autorenew-utils';
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

    const chargeMap = result.chargeAmountByDomainLdh ?? {};
    const lookupCharge = (name: NamefiNormalizedDomain): number | null =>
      chargeMap[name] ?? null;

    // Authoritative, pre-categorized per-domain buckets.
    const domainCategories: NonNullable<
      AutoRenewReportInput['workflowResults'][number]['domainCategories']
    > = {
      renewed: (result.successes ?? []).map((s) => ({
        domain: s.domain.normalizedDomainName,
        registrar: s.domain.registrarKey,
        chargeAmountInUsd: lookupCharge(s.domain.normalizedDomainName),
      })),
      registrarFailed: (result.failures ?? []).map((f) => ({
        domain: f.domain.normalizedDomainName,
        registrar: f.domain.registrarKey,
        reason: f.error?.message || 'Unknown error',
        chargeAmountInUsd: lookupCharge(f.domain.normalizedDomainName),
      })),
      paymentFailed: [],
      deferredInsufficientBalance: (
        result.domainsSkippedDueToInsufficientFunds ?? []
      ).map((d) => ({
        domain: d.normalizedDomainName,
        registrar: d.registrarKey,
        chargeAmountInUsd: lookupCharge(d.normalizedDomainName),
      })),
      missingPrice: (result.domainsMissingPriceData ?? []).map((d) => ({
        domain: d.normalizedDomainName,
        registrar: d.registrarKey,
      })),
    };

    // When the user's full bill couldn't be covered at all (fits=0 path):
    // all `domainsThatCouldBeRenewed` are deferred (not payment-failed).
    // Otherwise (hard payment failure with no shortfall): payment-failed.
    if (result.paymentStatus === 'FAILED' && result.domainsThatCouldBeRenewed) {
      const isInsufficientBalance =
        typeof result.shortfallInUsdCents === 'number' &&
        result.shortfallInUsdCents > 0;
      // `reason` is only used in the paymentFailed branch; the deferred
      // branch doesn't need a per-row reason (downstream derives wording
      // from `shortfallInUsdCents` on the user object so the amount is
      // never ambiguously attributed to a single row's cost).
      const paymentFailedReason = result.message || 'Payment failed';

      for (const d of result.domainsThatCouldBeRenewed) {
        if (isInsufficientBalance) {
          domainCategories.deferredInsufficientBalance.push({
            domain: d.normalizedDomainName,
            registrar: d.registrarKey,
            chargeAmountInUsd: lookupCharge(d.normalizedDomainName),
          });
        } else {
          domainCategories.paymentFailed.push({
            domain: d.normalizedDomainName,
            registrar: d.registrarKey,
            reason: paymentFailedReason,
            chargeAmountInUsd: lookupCharge(d.normalizedDomainName),
          });
        }
      }
    }

    // Legacy `successes[]` / `failures[]` — kept populated so the
    // Markdown formatter and Slack path (which still read the loose
    // arrays) keep working. Deferred domains are intentionally NOT put
    // in `failures[]` when `paymentStatus === 'SUCCEEDED'` to avoid
    // double-counting alongside `domainCategories`.
    const legacyProcessedDomains: Array<{
      domain: NamefiNormalizedDomain;
      registrar?: string;
    }> = domainCategories.renewed.map((e) => ({
      domain: e.domain,
      registrar: e.registrar,
    }));
    const legacyFailedDomains: Array<{
      domain: NamefiNormalizedDomain;
      reason: string;
      registrar?: string;
    }> = [
      ...domainCategories.registrarFailed.map((e) => ({
        domain: e.domain,
        reason: e.reason,
        registrar: e.registrar,
      })),
      ...domainCategories.paymentFailed.map((e) => ({
        domain: e.domain,
        reason: e.reason,
        registrar: e.registrar,
      })),
      ...domainCategories.deferredInsufficientBalance.map((e) => ({
        domain: e.domain,
        // User-level run aggregates (required/balance/short). Per-row
        // cost is in `chargeAmountInUsd`.
        reason: formatDeferredRowReason({
          availableBalanceInUsd: result.availableBalanceInNfsc,
          shortfallInUsdCents: result.shortfallInUsdCents,
        }),
        registrar: e.registrar,
      })),
      ...domainCategories.missingPrice.map((e) => ({
        domain: e.domain,
        reason: 'Missing price data',
        registrar: e.registrar,
      })),
    ];

    // Snapshot (always populated when the workflow ran at all).
    const snapshot = {
      availableBalanceInNfsc: result.availableBalanceInNfsc,
      nfscBalancesByChain: result.nfscBalancesByChain,
      availablePaymentMethods: result.availablePaymentMethods,
      snapshotTakenAt: result.snapshotTakenAt,
    };

    workflowResults.push({
      userId: success.userId,
      userEmail: result.userEmail,
      status:
        result.paymentStatus === 'FAILED'
          ? 'failure'
          : result.paymentStatus === 'SKIPPED'
            ? 'skipped'
            : 'success',
      domainsProcessed:
        legacyProcessedDomains.length + legacyFailedDomains.length || 0,
      amountChargedInUsd: result.totalAmountInUsd || 0,
      amountRefundedInUsd: result.refundAmountInUsd || 0,
      totalAmountInUsd: result.totalAmountInUsd,
      shortfallInUsdCents: result.shortfallInUsdCents,
      snapshot,
      payments: result.payments,
      failures: legacyFailedDomains,
      successes: legacyProcessedDomains,
      chargeAmountByDomainLdh: result.chargeAmountByDomainLdh,
      domainCategories,
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
