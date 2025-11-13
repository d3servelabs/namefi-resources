import { Context } from '@temporalio/activity';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { createLogger } from '#lib/logger';
import { sldRegistrar } from '#lib/namefi-registry';
import { temporalClient } from '#temporal/client';
import { sendMail } from '../../../mail/mail-client';
import { secrets, config } from '#lib/env';

const logger = createLogger({ name: 'bulk-burn-activities' });

export interface DomainToBurn {
  domain: NamefiNormalizedDomain;
  chainId: number;
  ownerAddress: string;
  nftExpirationDate: Date;
  daysSinceExpiration: number;
  registrar?: string;
}

export interface VerifyDomainsForBulkBurnResult {
  verifiedDomains: DomainToBurn[];
  skippedDomains: Array<{
    domain: NamefiNormalizedDomain;
    reason: string;
  }>;
  totalRegistrarDomains: number;
  verificationTime: Date;
}

/**
 * Verify domains are truly ready for bulk burn by checking against registrar
 * Uses efficient single listAllDomains() call for all registrars
 */
export async function verifyDomainsForBulkBurn(
  domains: DomainToBurn[],
): Promise<VerifyDomainsForBulkBurnResult> {
  const activityContext = Context.current();
  logger.info({ count: domains.length }, 'Verifying domains for bulk burn');

  const startTime = Date.now();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    // Fetch all domains from all registrars in one efficient call
    activityContext.heartbeat({ status: 'fetching registrar domains' });
    const registrarDomains = await sldRegistrar.listAllDomains();

    logger.info(
      { totalRegistrarDomains: registrarDomains.length },
      'Fetched all registrar domains',
    );

    // Create a Set of normalized domain names for O(1) lookup
    const registrarDomainSet = new Set<string>(
      registrarDomains.map((d) => d.domainName as string),
    );

    const verifiedDomains: DomainToBurn[] = [];
    const skippedDomains: Array<{
      domain: NamefiNormalizedDomain;
      reason: string;
    }> = [];

    // Check each domain
    for (const domain of domains) {
      activityContext.heartbeat({ processing: 'domain verification' });

      // Skip if domain still exists in registrar
      if (registrarDomainSet.has(domain.domain as string)) {
        skippedDomains.push({
          domain: domain.domain,
          reason: 'Domain still found in registrar account',
        });
        continue;
      }

      // Skip if NFT hasn't been expired for at least 30 days
      if (domain.nftExpirationDate > thirtyDaysAgo) {
        skippedDomains.push({
          domain: domain.domain,
          reason: `NFT expired less than 30 days ago (${domain.daysSinceExpiration} days)`,
        });
        continue;
      }

      // Domain is verified for burning
      verifiedDomains.push(domain);
    }

    const executionTime = Date.now() - startTime;
    logger.info(
      {
        totalDomains: domains.length,
        verifiedDomains: verifiedDomains.length,
        skippedDomains: skippedDomains.length,
        executionTimeMs: executionTime,
      },
      'Domain verification completed',
    );

    return {
      verifiedDomains,
      skippedDomains,
      totalRegistrarDomains: registrarDomains.length,
      verificationTime: now,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to verify domains for bulk burn');
    throw error;
  }
}

/**
 * Send notification to dev team about pending bulk burn workflow
 */
export async function sendPendingBurnNotification(
  workflowId: string,
  domainCount: number,
): Promise<void> {
  logger.info({ workflowId, domainCount }, 'Sending pending burn notification');

  try {
    const baseUrl = config.APP_URL || 'https://namefi.io';
    const workflowUrl = `${baseUrl}/admin/bulk-burn/${encodeURIComponent(workflowId)}`;

    const subject = `[Pending Action] Bulk Burn Workflow Awaiting Approval - ${domainCount} domains`;
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #d9534f;">⚠️ Bulk Burn Workflow Awaiting Admin Approval</h2>

          <p>A bulk burn workflow is currently waiting for admin approval.</p>

          <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Workflow Details</h3>
            <ul style="list-style: none; padding-left: 0;">
              <li><strong>Workflow ID:</strong> <code>${workflowId}</code></li>
              <li><strong>Domains Ready to Burn:</strong> ${domainCount}</li>
              <li><strong>Status:</strong> Waiting for approval signal</li>
            </ul>
          </div>

          <div style="margin: 30px 0;">
            <a href="${workflowUrl}"
               style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Review & Approve Workflow
            </a>
          </div>

          <p>
            In the admin dashboard, you can:
          </p>
          <ul>
            <li><strong>Approve:</strong> Select domains to burn and send approval signal</li>
            <li><strong>Cancel:</strong> Cancel the bulk burn operation</li>
          </ul>

          <p style="margin-top: 20px;">
            <a href="${workflowUrl}" style="color: #007bff;">View Workflow Details →</a>
          </p>

          <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
            This is an automated notification from the NameFi domain management system.
          </p>
        </body>
      </html>
    `;

    await sendMail({
      to: ['dev-team@d3serve.xyz'],
      subject,
      content: {
        html: htmlContent,
      },
    });

    logger.info('Pending burn notification sent successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to send pending burn notification');
    throw error;
  }
}

/**
 * Send completion notification for bulk burn workflow
 */
export async function sendBulkBurnCompletionNotification(
  workflowId: string,
  results: {
    totalRequested: number;
    successCount: number;
    failureCount: number;
    successfulBurns: Array<{ domain: NamefiNormalizedDomain; txHash: string }>;
    failedBurns: Array<{ domain: NamefiNormalizedDomain; error: string }>;
    cancelled: boolean;
  },
): Promise<void> {
  logger.info(
    { workflowId, results },
    'Sending bulk burn completion notification',
  );

  try {
    const status = results.cancelled ? 'Cancelled' : 'Completed';
    const subject = `Bulk Burn Workflow ${status} - ${results.successCount}/${results.totalRequested} successful`;

    let burnsList = '';
    if (results.successfulBurns.length > 0) {
      burnsList += '<h4>✅ Successfully Burned:</h4><ul>';
      for (const burn of results.successfulBurns) {
        burnsList += `<li><strong>${burn.domain}</strong> - TX: ${burn.txHash}</li>`;
      }
      burnsList += '</ul>';
    }

    if (results.failedBurns.length > 0) {
      burnsList += '<h4>❌ Failed Burns:</h4><ul>';
      for (const burn of results.failedBurns) {
        burnsList += `<li><strong>${burn.domain}</strong> - Error: ${burn.error}</li>`;
      }
      burnsList += '</ul>';
    }

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: ${results.cancelled ? '#ffc107' : '#28a745'};">
            ${results.cancelled ? '⚠️' : '✅'} Bulk Burn Workflow ${status}
          </h2>

          <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Summary</h3>
            <ul style="list-style: none; padding-left: 0;">
              <li><strong>Workflow ID:</strong> ${workflowId}</li>
              <li><strong>Total Requested:</strong> ${results.totalRequested}</li>
              <li><strong>Successful Burns:</strong> ${results.successCount}</li>
              <li><strong>Failed Burns:</strong> ${results.failureCount}</li>
              <li><strong>Status:</strong> ${status}</li>
            </ul>
          </div>

          ${burnsList}

          <p style="color: #6c757d; font-size: 12px; margin-top: 30px;">
            This is an automated notification from the NameFi domain management system.
          </p>
        </body>
      </html>
    `;

    await sendMail({
      to: ['dev-team@d3serve.xyz'],
      subject,
      content: {
        html: htmlContent,
      },
    });

    logger.info('Bulk burn completion notification sent successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to send completion notification');
    throw error;
  }
}

/**
 * Check if there's an existing bulk burn workflow running
 */
export async function checkForExistingBulkBurnWorkflow(): Promise<{
  exists: boolean;
  workflowId?: string;
  status?: string;
}> {
  logger.info('Checking for existing bulk burn workflow');

  try {
    // Query for workflows with the bulk burn prefix that are in RUNNING state
    const workflowIdPrefix = 'bulk-burn-expired-domains-';

    // List workflows that match the pattern
    const workflows = temporalClient.workflow.list({
      query: `WorkflowId STARTS_WITH "${workflowIdPrefix}" AND ExecutionStatus="Running"`,
    });

    // Get the first matching workflow
    for await (const workflow of workflows) {
      logger.info(
        { workflowId: workflow.workflowId, status: workflow.status },
        'Found existing bulk burn workflow',
      );

      return {
        exists: true,
        workflowId: workflow.workflowId,
        status: workflow.status?.name || 'RUNNING',
      };
    }

    logger.info('No existing bulk burn workflow found');
    return { exists: false };
  } catch (error) {
    logger.error({ error }, 'Failed to check for existing workflow');
    throw error;
  }
}
