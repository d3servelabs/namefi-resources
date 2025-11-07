import { Context } from '@temporalio/activity';
import { format } from 'date-fns';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { db } from '@namefi-astra/db';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  domainExportTrackingTable,
  namefiNftView,
  indexedDomainsTable,
} from '@namefi-astra/db/schema';
import { createLogger } from '#lib/logger';
import { sldRegistrar } from '#lib/namefi-registry';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { RDAP } from '@namefi-astra/registrars/lib/rdap-whois/rdap_client';
import { WhoisClient } from '@namefi-astra/registrars/lib/rdap-whois/whois_client';
import { sendMail } from '../../../mail/mail-client';

const logger = createLogger({ name: 'export-tracking' });

interface StatusHistoryEntry {
  timestamp: string;
  status: string;
  eppStatuses?: string[];
}

export interface DomainTransferStatus {
  domain: NamefiNormalizedDomain;
  chainId: number;
  ownerAddress: string;
  isLocked: boolean;
  eppStatuses?: string[];
  whoisData?: any;
  registrarKey?: string;
  inOurAccount: boolean;
  hasPendingTransfer: boolean;
  hasTransferPeriod: boolean;
}

/**
 * Check EPP/RDAP/WHOIS status for a domain with fallback
 * Priority: RDAP -> WHOIS
 */
export async function checkDomainTransferStatus(
  domain: NamefiNormalizedDomain,
): Promise<{
  eppStatuses?: string[];
  whoisData?: any;
  hasPendingTransfer: boolean;
  hasTransferPeriod: boolean;
}> {
  const activityContext = Context.current();
  logger.info({ domain }, 'Checking domain transfer status');

  activityContext.heartbeat({ domain, step: 'rdap_lookup' });

  const punyDomain = toPunycodeDomainName(domain);
  let eppStatuses: string[] | undefined;
  let whoisData: any;
  let hasPendingTransfer = false;
  let hasTransferPeriod = false;

  // Try RDAP first
  try {
    const rdapClient = RDAP;
    const rdapData = await rdapClient.queryDomain(punyDomain);

    if (rdapData?.status) {
      eppStatuses = rdapData.status;

      // Check for transfer-related statuses
      const statusesLower = rdapData.status.map((s) => s.toLowerCase());
      hasPendingTransfer = statusesLower.some(
        (s) =>
          s.includes('pendingtransfer') ||
          s.includes('pending transfer') ||
          s === 'pendingtransfer',
      );
      hasTransferPeriod = statusesLower.some(
        (s) =>
          s.includes('transferperiod') ||
          s.includes('transfer period') ||
          s === 'transferperiod',
      );
    }

    whoisData = rdapData;
    logger.info(
      { domain, eppStatuses, hasPendingTransfer, hasTransferPeriod },
      'RDAP lookup successful',
    );
  } catch (rdapError) {
    logger.warn(
      { domain, rdapError },
      'RDAP lookup failed, falling back to WHOIS',
    );

    activityContext.heartbeat({ domain, step: 'whois_lookup' });

    // Fallback to WHOIS
    try {
      const whoisClient = WhoisClient;
      const whoisResult = await whoisClient.queryDomain(punyDomain);
      whoisData = whoisResult;

      // Parse WHOIS data for status information
      if (whoisResult && typeof whoisResult === 'object') {
        const whoisText = JSON.stringify(whoisResult).toLowerCase();
        hasPendingTransfer =
          whoisText.includes('pending transfer') ||
          whoisText.includes('pendingtransfer');
        hasTransferPeriod =
          whoisText.includes('transfer period') ||
          whoisText.includes('transferperiod');
      }

      logger.info(
        { domain, hasPendingTransfer, hasTransferPeriod },
        'WHOIS lookup successful',
      );
    } catch (whoisError) {
      logger.error(
        { domain, rdapError, whoisError },
        'Both RDAP and WHOIS lookups failed',
      );
      // Continue without EPP status data
    }
  }

  return {
    eppStatuses,
    whoisData,
    hasPendingTransfer,
    hasTransferPeriod,
  };
}

/**
 * Check if a domain is still in our registrar account
 */
export async function isDomainInOurAccount(
  domain: NamefiNormalizedDomain,
): Promise<{ inOurAccount: boolean; registrarKey?: string }> {
  const activityContext = Context.current();
  logger.info({ domain }, 'Checking if domain is in our account');

  activityContext.heartbeat({ domain, step: 'checking_registrar' });

  try {
    const punyDomain = toPunycodeDomainName(domain);
    const domainDetails = await sldRegistrar.getDomainDetails(punyDomain);

    if (!domainDetails) {
      logger.info({ domain }, 'Domain not found in our account');
      return { inOurAccount: false };
    }

    // If we can get domain details, it's in our account
    const registrarKey = domainDetails.registrarKey || undefined;

    logger.info({ domain, registrarKey }, 'Domain found in our account');
    return { inOurAccount: true, registrarKey };
  } catch (error) {
    logger.warn({ domain, error }, 'Error checking domain in account');
    // If we get an error, assume it's not in our account
    return { inOurAccount: false };
  }
}

/**
 * Get unnotified domain export status changes
 */
export async function getUnnotifiedExportStatusChanges(): Promise<
  Array<{
    id: string;
    domain: NamefiNormalizedDomain;
    chainId: number;
    ownerAddress: string;
    status: string;
    previousStatus: string | null;
    statusChangedAt: Date;
  }>
> {
  logger.info('Getting unnotified export status changes');

  const unnotified = await db
    .select({
      id: domainExportTrackingTable.id,
      domain: domainExportTrackingTable.normalizedDomainName,
      chainId: domainExportTrackingTable.chainId,
      ownerAddress: domainExportTrackingTable.ownerAddress,
      status: domainExportTrackingTable.status,
      previousStatus: domainExportTrackingTable.previousStatus,
      statusChangedAt: domainExportTrackingTable.statusChangedAt,
    })
    .from(domainExportTrackingTable)
    .where(eq(domainExportTrackingTable.userNotified, false));

  logger.info({ count: unnotified.length }, 'Found unnotified status changes');

  return unnotified;
}

/**
 * Mark export tracking records as notified
 */
export async function markExportTrackingAsNotified(
  recordIds: string[],
): Promise<void> {
  if (recordIds.length === 0) {
    return;
  }

  logger.info(
    { count: recordIds.length },
    'Marking export tracking records as notified',
  );

  await db
    .update(domainExportTrackingTable)
    .set({
      userNotified: true,
      notifiedAt: new Date(),
    })
    .where(inArray(domainExportTrackingTable.id, recordIds));

  logger.info({ count: recordIds.length }, 'Marked records as notified');
}
/**
 * Get all locked NFTs that need export tracking
 */
export async function getLockedNftsForTracking(): Promise<
  Array<{
    chainId: number;
    normalizedDomainName: NamefiNormalizedDomain;
    ownerAddress: string;
  }>
> {
  logger.info('Getting locked NFTs for export tracking');

  const lockedNfts = await db
    .select({
      chainId: namefiNftView.chainId,
      normalizedDomainName: namefiNftView.normalizedDomainName,
      ownerAddress: namefiNftView.ownerAddress,
    })
    .from(namefiNftView)
    .where(eq(namefiNftView.isLocked, true));

  logger.info({ count: lockedNfts.length }, 'Found locked NFTs');

  return lockedNfts;
}

/**
 * Get existing tracking record for a domain
 */
export async function getExistingTrackingRecord(
  domain: NamefiNormalizedDomain,
  chainId: number,
): Promise<{
  id: string;
  status: string;
  statusHistory: unknown;
  registrarKey?: string | null;
} | null> {
  const records = await db
    .select({
      id: domainExportTrackingTable.id,
      status: domainExportTrackingTable.status,
      statusHistory: domainExportTrackingTable.statusHistory,
      registrarKey: domainExportTrackingTable.registrarKey,
    })
    .from(domainExportTrackingTable)
    .where(
      and(
        eq(domainExportTrackingTable.normalizedDomainName, domain),
        eq(domainExportTrackingTable.chainId, chainId),
      ),
    )
    .limit(1);

  return records[0] || null;
}

/**
 * Get domain registrar key from index
 */
export async function getDomainRegistrarFromIndex(
  domain: NamefiNormalizedDomain,
): Promise<string | null> {
  const entries = await db
    .select({
      registrarKey: indexedDomainsTable.registrarKey,
    })
    .from(indexedDomainsTable)
    .where(eq(indexedDomainsTable.normalizedDomainName, domain))
    .limit(1);

  return entries[0]?.registrarKey || null;
}

/**
 * Process a single domain for export tracking
 */
export async function processSingleDomainExportStatus(input: {
  domain: NamefiNormalizedDomain;
  chainId: number;
  ownerAddress: string;
}): Promise<{
  action: 'created' | 'updated' | 'no_change' | 'skipped';
  status?: string;
  previousStatus?: string;
}> {
  const { domain, chainId, ownerAddress } = input;
  const activityContext = Context.current();

  logger.info({ domain, chainId }, 'Processing single domain export status');
  activityContext.heartbeat({ domain, step: 'checking_status' });

  const transferStatus = await checkDomainTransferStatus(domain);
  const accountCheck = await isDomainInOurAccount(domain);
  const indexRegistrarKey = await getDomainRegistrarFromIndex(domain);
  const registrarKey = accountCheck.registrarKey || indexRegistrarKey;

  let currentStatus:
    | 'PENDING_TRANSFER'
    | 'TRANSFER_PERIOD'
    | 'TRANSFER_COMPLETED'
    | 'TRANSFER_FAILED'
    | null = null;

  if (transferStatus.hasPendingTransfer) {
    currentStatus = 'PENDING_TRANSFER';
  } else if (transferStatus.hasTransferPeriod) {
    currentStatus = 'TRANSFER_PERIOD';
  } else if (!accountCheck.inOurAccount) {
    currentStatus = 'TRANSFER_COMPLETED';
  }

  if (!currentStatus) {
    logger.info({ domain }, 'Locked NFT with no transfer indicators, skipping');
    return { action: 'skipped' };
  }

  const existingRecord = await getExistingTrackingRecord(domain, chainId);

  if (existingRecord) {
    if (existingRecord.status !== currentStatus) {
      const statusHistory =
        (existingRecord.statusHistory as unknown as StatusHistoryEntry[]) || [];
      const newHistoryEntry: StatusHistoryEntry = {
        timestamp: new Date().toISOString(),
        status: currentStatus,
        eppStatuses: transferStatus.eppStatuses,
      };
      const updatedHistory = [...statusHistory, newHistoryEntry];

      await db
        .update(domainExportTrackingTable)
        .set({
          previousStatus: existingRecord.status as
            | 'PENDING_TRANSFER'
            | 'TRANSFER_PERIOD'
            | 'TRANSFER_COMPLETED'
            | 'TRANSFER_FAILED',
          status: currentStatus,
          statusHistory: updatedHistory,
          eppStatuses: transferStatus.eppStatuses,
          whoisData: transferStatus.whoisData,
          registrarKey,
          statusChangedAt: new Date(),
          lastCheckedAt: new Date(),
          transferCompletedAt:
            currentStatus === 'TRANSFER_COMPLETED' ? new Date() : undefined,
          userNotified: false,
        })
        .where(eq(domainExportTrackingTable.id, existingRecord.id));

      logger.info(
        {
          domain,
          previousStatus: existingRecord.status,
          newStatus: currentStatus,
        },
        'Updated domain export tracking status',
      );

      return {
        action: 'updated',
        status: currentStatus,
        previousStatus: existingRecord.status,
      };
    }

    await db
      .update(domainExportTrackingTable)
      .set({
        lastCheckedAt: new Date(),
        eppStatuses: transferStatus.eppStatuses,
        whoisData: transferStatus.whoisData,
      })
      .where(eq(domainExportTrackingTable.id, existingRecord.id));

    return { action: 'no_change', status: currentStatus };
  }

  const initialHistory: StatusHistoryEntry[] = [
    {
      timestamp: new Date().toISOString(),
      status: currentStatus,
      eppStatuses: transferStatus.eppStatuses,
    },
  ];

  await db.insert(domainExportTrackingTable).values({
    normalizedDomainName: domain,
    chainId,
    ownerAddress,
    status: currentStatus,
    statusHistory: initialHistory as any,
    eppStatuses: transferStatus.eppStatuses,
    whoisData: transferStatus.whoisData as any,
    registrarKey,
  });

  logger.info(
    { domain, status: currentStatus },
    'Created new export tracking record',
  );

  return { action: 'created', status: currentStatus };
}

/**
 * Get all domains in PENDING_TRANSFER status
 */
export async function getPendingTransferDomains(): Promise<
  Array<{
    id: string;
    domain: NamefiNormalizedDomain;
    chainId: number;
    status: string;
    statusHistory: unknown;
  }>
> {
  logger.info('Getting pending transfer domains');

  const records = await db
    .select({
      id: domainExportTrackingTable.id,
      domain: domainExportTrackingTable.normalizedDomainName,
      chainId: domainExportTrackingTable.chainId,
      status: domainExportTrackingTable.status,
      statusHistory: domainExportTrackingTable.statusHistory,
    })
    .from(domainExportTrackingTable)
    .where(eq(domainExportTrackingTable.status, 'PENDING_TRANSFER'));

  logger.info({ count: records.length }, 'Found pending transfer domains');

  return records;
}

/**
 * Check a single pending transfer for completion or failure
 */
export async function checkSinglePendingTransfer(input: {
  id: string;
  domain: NamefiNormalizedDomain;
  currentStatus: string;
  statusHistory: unknown;
}): Promise<{
  action: 'failed' | 'completed' | 'still_pending';
  newStatus?: string;
}> {
  const { id, domain, currentStatus, statusHistory } = input;
  const activityContext = Context.current();

  logger.info({ domain, id }, 'Checking pending transfer');
  activityContext.heartbeat({ domain, step: 'checking_failure' });

  const transferStatus = await checkDomainTransferStatus(domain);
  const accountCheck = await isDomainInOurAccount(domain);

  if (!transferStatus.hasPendingTransfer && !transferStatus.hasTransferPeriod) {
    if (accountCheck.inOurAccount) {
      const history = (statusHistory as unknown as StatusHistoryEntry[]) || [];
      const newHistoryEntry: StatusHistoryEntry = {
        timestamp: new Date().toISOString(),
        status: 'TRANSFER_FAILED',
        eppStatuses: transferStatus.eppStatuses,
      };
      const updatedHistory = [...history, newHistoryEntry];

      await db
        .update(domainExportTrackingTable)
        .set({
          previousStatus: currentStatus as
            | 'PENDING_TRANSFER'
            | 'TRANSFER_PERIOD'
            | 'TRANSFER_COMPLETED'
            | 'TRANSFER_FAILED',
          status: 'TRANSFER_FAILED',
          statusHistory: updatedHistory,
          eppStatuses: transferStatus.eppStatuses,
          whoisData: transferStatus.whoisData,
          statusChangedAt: new Date(),
          lastCheckedAt: new Date(),
          userNotified: false,
        })
        .where(eq(domainExportTrackingTable.id, id));

      logger.info({ domain }, 'Transfer failed - domain back in our account');
      return { action: 'failed', newStatus: 'TRANSFER_FAILED' };
    }

    const history = (statusHistory as unknown as StatusHistoryEntry[]) || [];
    const newHistoryEntry: StatusHistoryEntry = {
      timestamp: new Date().toISOString(),
      status: 'TRANSFER_COMPLETED',
      eppStatuses: transferStatus.eppStatuses,
    };
    const updatedHistory = [...history, newHistoryEntry];

    await db
      .update(domainExportTrackingTable)
      .set({
        previousStatus: currentStatus as
          | 'PENDING_TRANSFER'
          | 'TRANSFER_PERIOD'
          | 'TRANSFER_COMPLETED'
          | 'TRANSFER_FAILED',
        status: 'TRANSFER_COMPLETED',
        statusHistory: updatedHistory,
        eppStatuses: transferStatus.eppStatuses,
        whoisData: transferStatus.whoisData,
        statusChangedAt: new Date(),
        lastCheckedAt: new Date(),
        transferCompletedAt: new Date(),
        userNotified: false,
      })
      .where(eq(domainExportTrackingTable.id, id));

    logger.info(
      { domain },
      'Transfer completed - domain no longer in our account',
    );
    return { action: 'completed', newStatus: 'TRANSFER_COMPLETED' };
  }

  await db
    .update(domainExportTrackingTable)
    .set({
      lastCheckedAt: new Date(),
      eppStatuses: transferStatus.eppStatuses,
      whoisData: transferStatus.whoisData,
    })
    .where(eq(domainExportTrackingTable.id, id));

  return { action: 'still_pending' };
}

/**
 * Export Tracking Report Generation
 */

export interface ExportTrackingReportMetrics {
  reportDate: Date;
  totalTracked: number;
  statusBreakdown: {
    pendingTransfer: number;
    transferPeriod: number;
    transferCompleted: number;
    transferFailed: number;
  };
  domains: Array<{
    domain: NamefiNormalizedDomain;
    chainId: number;
    ownerAddress: string;
    status: string;
    previousStatus: string | null;
    statusChangedAt: Date;
    firstDetectedAt: Date;
    lastCheckedAt: Date;
    eppStatuses?: string[] | null;
    registrarKey?: string | null;
    statusHistory: unknown;
  }>;
}

/**
 * Collect export tracking metrics for report
 */
export async function collectExportTrackingMetrics(): Promise<ExportTrackingReportMetrics> {
  logger.info('Collecting export tracking metrics for report');

  const allRecords = await db
    .select({
      domain: domainExportTrackingTable.normalizedDomainName,
      chainId: domainExportTrackingTable.chainId,
      ownerAddress: domainExportTrackingTable.ownerAddress,
      status: domainExportTrackingTable.status,
      previousStatus: domainExportTrackingTable.previousStatus,
      statusChangedAt: domainExportTrackingTable.statusChangedAt,
      firstDetectedAt: domainExportTrackingTable.firstDetectedAt,
      lastCheckedAt: domainExportTrackingTable.lastCheckedAt,
      eppStatuses: domainExportTrackingTable.eppStatuses,
      registrarKey: domainExportTrackingTable.registrarKey,
      statusHistory: domainExportTrackingTable.statusHistory,
    })
    .from(domainExportTrackingTable);

  const statusBreakdown = {
    pendingTransfer: allRecords.filter((r) => r.status === 'PENDING_TRANSFER')
      .length,
    transferPeriod: allRecords.filter((r) => r.status === 'TRANSFER_PERIOD')
      .length,
    transferCompleted: allRecords.filter(
      (r) => r.status === 'TRANSFER_COMPLETED',
    ).length,
    transferFailed: allRecords.filter((r) => r.status === 'TRANSFER_FAILED')
      .length,
  };

  const metrics: ExportTrackingReportMetrics = {
    reportDate: new Date(),
    totalTracked: allRecords.length,
    statusBreakdown,
    domains: allRecords,
  };

  logger.info(
    {
      totalTracked: metrics.totalTracked,
      statusBreakdown: metrics.statusBreakdown,
    },
    'Collected export tracking metrics',
  );

  return metrics;
}

/**
 * Generate CSV content for export tracking report
 */
function generateExportTrackingCSV(
  metrics: ExportTrackingReportMetrics,
): string {
  let csv =
    'Domain,Status,Previous Status,Chain ID,Owner Address,Registrar,Status Changed At,First Detected At,Last Checked At,EPP Statuses\n';

  for (const domain of metrics.domains) {
    const statusChangedAt = format(
      domain.statusChangedAt,
      'yyyy-MM-dd HH:mm:ss',
    );
    const firstDetectedAt = format(
      domain.firstDetectedAt,
      'yyyy-MM-dd HH:mm:ss',
    );
    const lastCheckedAt = format(domain.lastCheckedAt, 'yyyy-MM-dd HH:mm:ss');
    const eppStatuses = domain.eppStatuses
      ? (domain.eppStatuses as string[]).join('; ')
      : '';

    csv += `"${domain.domain}","${domain.status}","${domain.previousStatus || ''}",${domain.chainId},"${domain.ownerAddress}","${domain.registrarKey || ''}","${statusChangedAt}","${firstDetectedAt}","${lastCheckedAt}","${eppStatuses}"\n`;
  }

  return csv;
}

/**
 * Generate JSON content for export tracking report
 */
function generateExportTrackingJSON(
  metrics: ExportTrackingReportMetrics,
): string {
  const jsonData = {
    reportDate: format(metrics.reportDate, 'yyyy-MM-dd HH:mm:ss'),
    totalTracked: metrics.totalTracked,
    statusBreakdown: metrics.statusBreakdown,
    domains: metrics.domains.map((domain) => ({
      domain: domain.domain,
      status: domain.status,
      previousStatus: domain.previousStatus,
      chainId: domain.chainId,
      ownerAddress: domain.ownerAddress,
      registrarKey: domain.registrarKey,
      statusChangedAt: format(domain.statusChangedAt, 'yyyy-MM-dd HH:mm:ss'),
      firstDetectedAt: format(domain.firstDetectedAt, 'yyyy-MM-dd HH:mm:ss'),
      lastCheckedAt: format(domain.lastCheckedAt, 'yyyy-MM-dd HH:mm:ss'),
      eppStatuses: domain.eppStatuses,
      statusHistory: domain.statusHistory,
    })),
  };

  return JSON.stringify(jsonData, null, 2);
}

/**
 * Send export tracking report via email
 */
export async function sendExportTrackingReportEmail(
  metrics: ExportTrackingReportMetrics,
): Promise<void> {
  logger.info('Sending export tracking report email');

  try {
    const dateStr = format(metrics.reportDate, 'yyyy-MM-dd');
    const title = `📊 Domain Export Tracking Report - ${format(metrics.reportDate, 'MMM dd, yyyy')}`;

    // Generate HTML content
    let htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            h1 { color: #2c3e50; }
            h2 { color: #34495e; margin-top: 30px; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #3498db; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .metrics { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .status-pending { color: #f39c12; font-weight: bold; }
            .status-period { color: #3498db; font-weight: bold; }
            .status-completed { color: #27ae60; font-weight: bold; }
            .status-failed { color: #e74c3c; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p><strong>Generated at:</strong> ${format(metrics.reportDate, 'yyyy-MM-dd HH:mm:ss')} UTC</p>

          <div class="metrics">
            <h2>📈 Summary</h2>
            <ul>
              <li><strong>Total Domains Tracked:</strong> ${metrics.totalTracked}</li>
              <li><span class="status-pending">Pending Transfer:</span> ${metrics.statusBreakdown.pendingTransfer}</li>
              <li><span class="status-period">Transfer Period (60-day lock):</span> ${metrics.statusBreakdown.transferPeriod}</li>
              <li><span class="status-completed">Transfer Completed:</span> ${metrics.statusBreakdown.transferCompleted}</li>
              <li><span class="status-failed">Transfer Failed:</span> ${metrics.statusBreakdown.transferFailed}</li>
            </ul>
          </div>

          <h2>📋 Domain Details</h2>
          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Status</th>
                <th>Previous Status</th>
                <th>Chain</th>
                <th>Registrar</th>
                <th>Status Changed</th>
              </tr>
            </thead>
            <tbody>
    `;

    for (const domain of metrics.domains) {
      const statusClass =
        domain.status === 'PENDING_TRANSFER'
          ? 'status-pending'
          : domain.status === 'TRANSFER_PERIOD'
            ? 'status-period'
            : domain.status === 'TRANSFER_COMPLETED'
              ? 'status-completed'
              : 'status-failed';

      htmlContent += `
              <tr>
                <td>${domain.domain}</td>
                <td class="${statusClass}">${domain.status}</td>
                <td>${domain.previousStatus || '-'}</td>
                <td>${domain.chainId}</td>
                <td>${domain.registrarKey || '-'}</td>
                <td>${format(domain.statusChangedAt, 'yyyy-MM-dd HH:mm')}</td>
              </tr>
      `;
    }

    htmlContent += `
            </tbody>
          </table>

          <p><em>This is an automated report. Detailed data is available in the attached CSV and JSON files.</em></p>
        </body>
      </html>
    `;

    // Generate attachments
    const attachments = [];

    if (metrics.totalTracked > 0) {
      const csv = generateExportTrackingCSV(metrics);
      attachments.push({
        filename: `export-tracking-${dateStr}.csv`,
        content: csv,
        contentType: 'text/csv',
      });
    }

    const json = generateExportTrackingJSON(metrics);
    attachments.push({
      filename: `export-tracking-${dateStr}.json`,
      content: json,
      contentType: 'application/json',
    });

    await sendMail({
      to: ['reports+exports@d3serve.xyz'],
      subject: title,
      content: {
        html: htmlContent,
      },
      attachments,
    });

    logger.info(
      {
        attachmentCount: attachments.length,
        recipient: 'reports+exports@d3serve.xyz',
      },
      'Export tracking report email sent successfully',
    );
  } catch (error) {
    logger.error({ error }, 'Failed to send export tracking report email');
    throw error;
  }
}
