/**
 * Daily NFT Management Report Workflow
 *
 * This workflow generates and sends a comprehensive daily report about
 * NFT management status including critical issues, metrics, and health scores.
 *
 * Scheduled to run daily at 14:00 UTC
 */

import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';

// Activity proxies for NFT management reporting
const {
  collectNftManagementMetrics,
  formatNftManagementReport,
  sendNftManagementReportToSlack,
  sendNftManagementReportEmail,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.INDEXERS,
  options: {
    ...shortRunningOpts,
    startToCloseTimeout: '15m', // Allow time for comprehensive data collection
  },
});
const SEND_TO_SLACK = false;

export interface NftManagementDailyReportWorkflowInput {
  /**
   * Whether to force send the report even if no critical issues are found
   * @default false
   */
  forceSend?: boolean;

  /**
   * Custom report title override
   */
  customTitle?: string;
}

export interface NftManagementDailyReportWorkflowOutput {
  reportSent: boolean;
  slackSent: boolean;
  emailSent: boolean;
  reportTitle: string;
  metricsCollected: {
    totalNfts: number;
    criticalIssuesCount: number;
    activeWorkflowsCount: number;
  };
  executionTimeMs: number;
  skippedReason?: string;
}

/**
 * Workflow to generate and send daily NFT management report
 */
export async function nftManagementDailyReportWorkflow({
  forceSend = false,
  customTitle,
}: NftManagementDailyReportWorkflowInput = {}): Promise<NftManagementDailyReportWorkflowOutput> {
  const startTime = Date.now();

  workflow.log.info('Starting NFT management daily report workflow', {
    forceSend,
    customTitle,
  });

  try {
    // Step 1: Collect comprehensive NFT management metrics
    workflow.log.info('Collecting NFT management metrics');
    const metrics = await collectNftManagementMetrics();

    const totalCriticalIssues =
      metrics.criticalIssues.expiredCanBurn +
      metrics.criticalIssues.missingDataCannotFix +
      metrics.criticalIssues.longOverdueExpired;

    const totalRecentWorkflows =
      metrics.activeWorkflows.burnWorkflows +
      metrics.activeWorkflows.fixExpirationWorkflows +
      metrics.activeWorkflows.extendRegistrationWorkflows;

    workflow.log.info('NFT metrics collected successfully', {
      totalNfts: metrics.totalNfts,
      totalCriticalIssues,
      totalRecentWorkflows,
    });

    // Step 2: Format the report (markdown — used by Slack path)
    workflow.log.info('Formatting NFT management report');
    const { title: reportTitle, content } =
      await formatNftManagementReport(metrics);

    const finalTitle = customTitle || reportTitle;

    // Counts of each new categorized bucket that still need review
    // (acknowledged known-issue rows are excluded from the trigger logic).
    const needsReviewCounts = {
      dateMismatch: metrics.categorized.dateMismatch.filter(
        (e) => !e.knownIssue,
      ).length,
      domainExistsMissingNft: metrics.categorized.domainExistsMissingNft.filter(
        (e) => !e.knownIssue,
      ).length,
      nftExistsMissingDomainNotExpired:
        metrics.categorized.nftExistsMissingDomainNotExpired.filter(
          (e) => !e.knownIssue,
        ).length,
    };

    // Step 3: Decide whether to send the report
    const shouldSendReport =
      forceSend ||
      totalCriticalIssues > 0 ||
      totalRecentWorkflows > 0 ||
      needsReviewCounts.dateMismatch > 0 ||
      needsReviewCounts.domainExistsMissingNft > 0 ||
      needsReviewCounts.nftExistsMissingDomainNotExpired > 0;

    let reportSent = false;
    let slackSent = false;
    let emailSent = false;
    let skippedReason: string | undefined;

    if (shouldSendReport) {
      // Step 4: Send report to Slack
      workflow.log.info('Sending NFT management report to Slack', {
        reportTitle: finalTitle,
        contentLength: content.length,
      });

      await catchAndAlertLocally(
        async () => {
          if (SEND_TO_SLACK) {
            await sendNftManagementReportToSlack(finalTitle, content);
            slackSent = true;
          }
        },
        {
          message: 'Failed to send NFT management report to Slack',
          details: { reportTitle: finalTitle },
        },
      );

      // Step 5: Send report via email (structured template + CSV attachments)
      workflow.log.info(
        'Sending NFT management report email to reporting@namefi.io',
        {
          reportTitle: finalTitle,
          needsReviewCounts,
        },
      );

      await catchAndAlertLocally(
        async () => {
          await sendNftManagementReportEmail({
            title: finalTitle,
            metrics,
          });
          emailSent = true;
        },
        {
          message: 'Failed to send NFT management report email',
          details: { reportTitle: finalTitle },
        },
      );

      reportSent = slackSent || emailSent;

      if (reportSent) {
        workflow.log.info('NFT management report sent successfully', {
          slackSent,
          emailSent,
        });
      }
    } else {
      skippedReason =
        'No critical issues or recent workflows found, report not sent';
      workflow.log.info('Skipping report send', { reason: skippedReason });
    }

    const executionTimeMs = Date.now() - startTime;

    const output: NftManagementDailyReportWorkflowOutput = {
      reportSent,
      slackSent,
      emailSent,
      reportTitle: finalTitle,
      metricsCollected: {
        totalNfts: metrics.totalNfts,
        criticalIssuesCount: totalCriticalIssues,
        activeWorkflowsCount: totalRecentWorkflows,
      },
      executionTimeMs,
      skippedReason,
    };

    workflow.log.info('NFT management daily report workflow completed', {
      output,
    });

    return output;
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;

    workflow.log.error('NFT management daily report workflow failed', {
      error,
      executionTimeMs,
    });

    // Return partial results even on failure
    return {
      reportSent: false,
      slackSent: false,
      emailSent: false,
      reportTitle: customTitle || 'NFT Management Report (Failed)',
      metricsCollected: {
        totalNfts: 0,
        criticalIssuesCount: 0,
        activeWorkflowsCount: 0,
      },
      executionTimeMs,
      skippedReason: `Workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Helper function to generate a unique workflow ID for manual triggers
 */
export function generateNftManagementReportWorkflowId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `nft-management-daily-report-${timestamp}`;
}
