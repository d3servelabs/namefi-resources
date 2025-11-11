/**
 * Daily Export & Expiration Report Workflow
 *
 * This workflow generates and sends a comprehensive daily report about
 * domains being exported/transferred out and domains that have expired
 * and are ready to be burned.
 *
 * Scheduled to run daily at 15:00 UTC
 */

import * as workflow from '@temporalio/workflow';
import { shortRunningOpts, TEMPORAL_ENUMS, TEMPORAL_QUEUES } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import { catchAndAlertLocally } from '../shared/workflow-helpers/catch-and-alert-locally';
import {
  bulkBurnExpiredDomainsWorkflow,
  generateBulkBurnWorkflowId,
} from './bulk-burn-expired-domains.workflow';
import type { DomainToBurn } from '../activities/domain/bulk-burn.activities';

// Activity proxies for export/expiration reporting
const {
  collectExportExpirationMetrics,
  formatExportExpirationReport,
  sendExportExpirationReportToSlack,
  sendExportExpirationReportEmail,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: {
    ...shortRunningOpts,
    startToCloseTimeout: '20m', // Allow time for comprehensive data collection from multiple sources
  },
});

// Activity proxies for bulk burn workflow management
const { checkForExistingBulkBurnWorkflow, sendPendingBurnNotification } =
  typedProxyActivities({
    temporalEnum: TEMPORAL_ENUMS.DOMAINS,
    options: {
      ...shortRunningOpts,
    },
  });

export interface ExportExpirationDailyReportWorkflowInput {
  /**
   * Whether to force send the report even if no domains are found
   * @default false
   */
  forceSend?: boolean;

  /**
   * Custom report title override
   */
  customTitle?: string;
}

export interface ExportExpirationDailyReportWorkflowOutput {
  reportSent: boolean;
  slackSent: boolean;
  emailSent: boolean;
  reportTitle: string;
  metricsCollected: {
    totalExportedDomains: number;
    totalExpiredDomains: number;
    pendingTransfer: number;
    transferPeriod: number;
    confirmedExported: number;
    readyToBurn: number;
  };
  executionTimeMs: number;
  skippedReason?: string;
}

/**
 * Workflow to generate and send daily export/expiration report
 */
export async function exportExpirationDailyReportWorkflow({
  forceSend = false,
  customTitle,
}: ExportExpirationDailyReportWorkflowInput = {}): Promise<ExportExpirationDailyReportWorkflowOutput> {
  const startTime = Date.now();

  workflow.log.info('Starting export/expiration daily report workflow', {
    forceSend,
    customTitle,
  });

  try {
    // Step 1: Collect comprehensive export/expiration metrics
    workflow.log.info('Collecting export/expiration metrics');
    const metrics = await collectExportExpirationMetrics();

    const totalExportedDomains = metrics.exportedDomains.total;
    const totalExpiredDomains = metrics.expiredDomains.total;

    workflow.log.info('Export/expiration metrics collected successfully', {
      totalExportedDomains,
      totalExpiredDomains,
      pendingTransfer: metrics.exportedDomains.pendingTransfer.length,
      transferPeriod: metrics.exportedDomains.transferPeriod.length,
      confirmedExported: metrics.exportedDomains.confirmedExported.length,
      possiblyExported: metrics.exportedDomains.possiblyExported.length,
      readyToBurn: metrics.expiredDomains.readyToBurn.length,
    });

    // Step 2: Format the report
    workflow.log.info('Formatting export/expiration report');
    const { title: reportTitle, content } =
      await formatExportExpirationReport(metrics);

    const finalTitle = customTitle || reportTitle;

    // Step 3: Decide whether to send the report
    const shouldSendReport =
      forceSend || totalExportedDomains > 0 || totalExpiredDomains > 0;

    let reportSent = false;
    let slackSent = false;
    let emailSent = false;
    let skippedReason: string | undefined;

    if (shouldSendReport) {
      // Step 4: Send report to Slack
      workflow.log.info('Sending export/expiration report to Slack', {
        reportTitle: finalTitle,
        contentLength: content.length,
      });

      await catchAndAlertLocally(
        async () => {
          await sendExportExpirationReportToSlack(finalTitle, content);
          slackSent = true;
        },
        {
          message: 'Failed to send export/expiration report to Slack',
          details: { reportTitle: finalTitle },
        },
      );

      // Step 5: Send report via email
      workflow.log.info(
        'Sending export/expiration report email to reporting@namefi.io',
        {
          reportTitle: finalTitle,
          contentLength: content.length,
        },
      );

      await catchAndAlertLocally(
        async () => {
          await sendExportExpirationReportEmail(finalTitle, content, metrics);
          emailSent = true;
        },
        {
          message: 'Failed to send export/expiration report email',
          details: { reportTitle: finalTitle },
        },
      );

      reportSent = slackSent || emailSent;

      if (reportSent) {
        workflow.log.info('Export/expiration report sent successfully', {
          slackSent,
          emailSent,
        });
      }
    } else {
      skippedReason = 'No exported or expired domains found, report not sent';
      workflow.log.info('Skipping report send', { reason: skippedReason });
    }

    // Step 6: Trigger bulk burn workflow if there are domains ready to burn
    if (metrics.expiredDomains.readyToBurn.length > 0) {
      workflow.log.info('Checking for bulk burn workflow', {
        readyToBurnCount: metrics.expiredDomains.readyToBurn.length,
      });

      await catchAndAlertLocally(
        async () => {
          // Check if there's already a bulk burn workflow running
          const existingWorkflow = await checkForExistingBulkBurnWorkflow();

          if (existingWorkflow.exists && existingWorkflow.workflowId) {
            workflow.log.info(
              'Bulk burn workflow already exists and waiting for approval',
              {
                workflowId: existingWorkflow.workflowId,
                status: existingWorkflow.status,
              },
            );

            // Send pending action notification
            await sendPendingBurnNotification(
              existingWorkflow.workflowId,
              metrics.expiredDomains.readyToBurn.length,
            );
          } else {
            workflow.log.info('Starting new bulk burn workflow', {
              domainCount: metrics.expiredDomains.readyToBurn.length,
            });

            // Convert ExpiredDomainInfo to DomainToBurn format
            const domainsToBurn: DomainToBurn[] =
              metrics.expiredDomains.readyToBurn.map((d) => ({
                domain: d.domain,
                chainId: d.chainId,
                ownerAddress: d.ownerAddress,
                nftExpirationDate: d.nftExpirationDate,
                daysSinceExpiration: d.daysSinceExpiration,
                registrar: d.registrar,
              }));

            // Start bulk burn workflow
            const bulkBurnWorkflowId = generateBulkBurnWorkflowId();
            await workflow.startChild(bulkBurnExpiredDomainsWorkflow, {
              workflowId: bulkBurnWorkflowId,
              args: [
                {
                  domains: domainsToBurn,
                  approvalTimeoutDays: 7,
                },
              ],
              taskQueue: TEMPORAL_QUEUES.DEFAULT,
              parentClosePolicy: 'ABANDON',
            });

            workflow.log.info('Bulk burn workflow started', {
              workflowId: bulkBurnWorkflowId,
            });
          }
        },
        {
          message: 'Failed to trigger or check bulk burn workflow',
          details: {
            readyToBurnCount: metrics.expiredDomains.readyToBurn.length,
          },
        },
      );
    } else {
      workflow.log.info(
        'No domains ready to burn, skipping bulk burn workflow',
      );
    }

    const executionTimeMs = Date.now() - startTime;

    const output: ExportExpirationDailyReportWorkflowOutput = {
      reportSent,
      slackSent,
      emailSent,
      reportTitle: finalTitle,
      metricsCollected: {
        totalExportedDomains,
        totalExpiredDomains,
        pendingTransfer: metrics.exportedDomains.pendingTransfer.length,
        transferPeriod: metrics.exportedDomains.transferPeriod.length,
        confirmedExported: metrics.exportedDomains.confirmedExported.length,
        readyToBurn: metrics.expiredDomains.readyToBurn.length,
      },
      executionTimeMs,
      skippedReason,
    };

    workflow.log.info('Export/expiration daily report workflow completed', {
      output,
    });

    return output;
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;

    workflow.log.error('Export/expiration daily report workflow failed', {
      error,
      executionTimeMs,
    });

    // Return partial results even on failure
    return {
      reportSent: false,
      slackSent: false,
      emailSent: false,
      reportTitle: customTitle || 'Export/Expiration Report (Failed)',
      metricsCollected: {
        totalExportedDomains: 0,
        totalExpiredDomains: 0,
        pendingTransfer: 0,
        transferPeriod: 0,
        confirmedExported: 0,
        readyToBurn: 0,
      },
      executionTimeMs,
      skippedReason: `Workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Helper function to generate a unique workflow ID for manual triggers
 */
export function generateExportExpirationReportWorkflowId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `export-expiration-daily-report-${timestamp}`;
}
