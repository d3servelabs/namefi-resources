import { Context } from '@temporalio/activity';
import { differenceInHours, format, subHours } from 'date-fns';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { secrets } from '#lib/env';
import { sendMail } from '../../../mail/mail-client';
import React from 'react';
import { render } from '@react-email/components';
import { db, namefiNftCte } from '@namefi-astra/db';
import { and, eq, lt, sql, inArray, desc } from 'drizzle-orm';
import { namefiNftView, indexedDomainsTable } from '@namefi-astra/db';
import { createLogger } from '#lib/logger';
import { sldRegistrar } from '#lib/namefi-registry';
import { RDAP } from '@namefi-astra/registrars/lib/rdap-whois/rdap_client';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { ExportExpirationDailyReport } from '../../../mail/templates/export-expiration-daily-report';

const logger = createLogger({ name: 'export-expiration-report' });

export interface ExportedDomainInfo {
  domain: NamefiNormalizedDomain;
  chainId: number;
  ownerAddress: string;
  nftExpirationDate: Date;
  domainExpirationDate?: Date;
  status:
    | 'pending_transfer'
    | 'transfer_period'
    | 'confirmed_exported'
    | 'possibly_exported';
  registrar?: string;
  eppStatus?: string[];
  lastSeenInIndex?: Date;
  exportOperation?: {
    type: 'TRANSFER_OUT_DOMAIN' | 'EXPIRE_DOMAIN';
    operationId?: string;
    submittedDate?: Date;
  };
}

export interface ExpiredDomainInfo {
  domain: NamefiNormalizedDomain;
  chainId: number;
  ownerAddress: string;
  nftExpirationDate: Date;
  domainExpirationDate?: Date;
  daysSinceExpiration: number;
  registrar?: string;
  notFoundInIndex: boolean;
  notFoundInRegistrar: boolean;
}

export interface ExportExpirationMetrics {
  reportDate: Date;
  exportedDomains: {
    total: number;
    pendingTransfer: ExportedDomainInfo[];
    transferPeriod: ExportedDomainInfo[];
    confirmedExported: ExportedDomainInfo[];
    possiblyExported: ExportedDomainInfo[];
  };
  expiredDomains: {
    total: number;
    readyToBurn: ExpiredDomainInfo[];
  };
  registrarBreakdown: Record<string, number>;
}

/**
 * Collect metrics about domains being exported or already exported
 */
export async function collectExportedDomainsMetrics(): Promise<
  ExportExpirationMetrics['exportedDomains']
> {
  const activityContext = Context.current();
  logger.info({ activityContext }, 'Collecting exported domains metrics');

  // Step 1: Get all locked NFTs (primary indicator of export)
  const lockedNfts = await db
    .with(namefiNftCte)
    .select({
      chainId: namefiNftView.chainId,
      normalizedDomainName: namefiNftView.normalizedDomainName,
      ownerAddress: namefiNftView.ownerAddress,
      expirationTime: namefiNftView.expirationTime,
    })
    .from(namefiNftView)
    .where(eq(namefiNftView.isLocked, true));

  logger.info({ count: lockedNfts.length }, 'Found locked NFTs');

  if (lockedNfts.length === 0) {
    return {
      total: 0,
      pendingTransfer: [],
      transferPeriod: [],
      confirmedExported: [],
      possiblyExported: [],
    };
  }

  // Step 2: Batch fetch all domain index entries for locked NFTs
  const domainNames = lockedNfts.map((nft) => nft.normalizedDomainName);
  const indexEntries = await db
    .select({
      normalizedDomainName: indexedDomainsTable.normalizedDomainName,
      registrarKey: indexedDomainsTable.registrarKey,
      expirationTime: indexedDomainsTable.expirationTime,
      lastIndexedAt: indexedDomainsTable.lastIndexedAt,
    })
    .from(indexedDomainsTable)
    .where(inArray(indexedDomainsTable.normalizedDomainName, domainNames));

  // Create a map for O(1) lookup
  const indexMap = new Map(
    indexEntries.map((entry) => [entry.normalizedDomainName, entry]),
  );

  logger.info(
    { indexEntriesFound: indexEntries.length },
    'Loaded domain index entries',
  );

  const exportedDomains: ExportedDomainInfo[] = [];

  // Step 3: For each locked NFT, determine export status
  for (const nft of lockedNfts) {
    const domain = nft.normalizedDomainName;

    activityContext.heartbeat({ domain, processing: 'locked NFT' });

    // Check if domain exists in index using the map
    const indexEntry = indexMap.get(domain);

    // Check if domain exists in registrars
    let registrarData: {
      found: boolean;
      registrar?: string;
      expired?: boolean;
    } = {
      found: false,
    };

    try {
      const punyDomain = toPunycodeDomainName(domain);
      const domainDetails = await sldRegistrar.getDomainDetails(punyDomain);
      if (domainDetails) {
        // The registrar is determined by checking which registrar the domain is with
        // We can infer this from the index or use a generic label
        registrarData = {
          found: true,
          registrar: indexEntry?.registrarKey || 'Unknown',
          expired:
            domainDetails.expirationTime &&
            domainDetails.expirationTime < new Date(),
        };
      }
    } catch (error) {
      logger.warn(
        { domain, error },
        'Failed to get domain details from registrar',
      );
    }

    // Check EPP status via RDAP
    let eppStatus: string[] | undefined;
    let isTransferPeriod = false;
    let isPendingTransfer = false;

    try {
      const rdapResponse = await RDAP.queryDomainStatus(domain);
      eppStatus = rdapResponse.status;

      // Check for transfer-related statuses
      if (eppStatus) {
        for (const status of eppStatus) {
          const statusLower = status.toLowerCase();
          if (
            statusLower.includes('pending transfer') ||
            statusLower === 'pending transfer'
          ) {
            isPendingTransfer = true;
          }
          if (
            statusLower.includes('transfer period') ||
            statusLower === 'transfer period'
          ) {
            isTransferPeriod = true;
          }
        }
      }
    } catch (error) {
      logger.warn({ domain, error }, 'Failed to query RDAP status');
    }

    // Determine export status based on collected data
    let status: ExportedDomainInfo['status'];

    if (isPendingTransfer) {
      status = 'pending_transfer';
    } else if (isTransferPeriod) {
      status = 'transfer_period';
    } else if (!indexEntry && !registrarData.found) {
      // Domain not found in index or registrar - confirmed exported
      status = 'confirmed_exported';
    } else if (!registrarData.found) {
      // Not in registrar but might be in index - possibly exported
      status = 'possibly_exported';
    } else {
      // Domain still active but locked - skip for now
      continue;
    }

    exportedDomains.push({
      domain,
      chainId: nft.chainId,
      ownerAddress: nft.ownerAddress,
      nftExpirationDate: nft.expirationTime,
      domainExpirationDate: indexEntry?.expirationTime,
      status,
      registrar: registrarData.registrar || indexEntry?.registrarKey,
      eppStatus,
      lastSeenInIndex: indexEntry?.lastIndexedAt,
    });
  }

  // Step 3: Check AWS R53 operations for TRANSFER_OUT and EXPIRE operations
  // Note: This would require accessing R53-specific methods which aren't exposed through the main registrar interface
  // For now, we rely on the domain index and registrar status checks above
  // Future enhancement: Add R53-specific operations checking if needed

  // Categorize results and sort by expiration date (ascending)
  const sortByNftExpiry = (a: ExportedDomainInfo, b: ExportedDomainInfo) =>
    a.nftExpirationDate.getTime() - b.nftExpirationDate.getTime();

  const result: ExportExpirationMetrics['exportedDomains'] = {
    total: exportedDomains.length,
    pendingTransfer: exportedDomains
      .filter((d) => d.status === 'pending_transfer')
      .sort(sortByNftExpiry),
    transferPeriod: exportedDomains
      .filter((d) => d.status === 'transfer_period')
      .sort(sortByNftExpiry),
    confirmedExported: exportedDomains
      .filter((d) => d.status === 'confirmed_exported')
      .sort(sortByNftExpiry),
    possiblyExported: exportedDomains
      .filter((d) => d.status === 'possibly_exported')
      .sort(sortByNftExpiry),
  };

  logger.info(
    {
      total: result.total,
      pendingTransfer: result.pendingTransfer.length,
      transferPeriod: result.transferPeriod.length,
      confirmedExported: result.confirmedExported.length,
      possiblyExported: result.possiblyExported.length,
    },
    'Collected exported domains metrics',
  );

  return result;
}

/**
 * Collect metrics about expired domains ready to burn
 */
export async function collectExpiredDomainsMetrics(): Promise<
  ExportExpirationMetrics['expiredDomains']
> {
  const activityContext = Context.current();
  logger.info({ activityContext }, 'Collecting expired domains metrics');

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Step 1: Get all NFTs that expired more than 30 days ago
  const expiredNfts = await db
    .with(namefiNftCte)
    .select({
      chainId: namefiNftView.chainId,
      normalizedDomainName: namefiNftView.normalizedDomainName,
      ownerAddress: namefiNftView.ownerAddress,
      expirationTime: namefiNftView.expirationTime,
    })
    .from(namefiNftView)
    .where(lt(namefiNftView.expirationTime, thirtyDaysAgo));

  logger.info({ count: expiredNfts.length }, 'Found expired NFTs (>30 days)');

  if (expiredNfts.length === 0) {
    return {
      total: 0,
      readyToBurn: [],
    };
  }

  // Step 2: Batch fetch all domain index entries for expired NFTs
  const domainNames = expiredNfts.map((nft) => nft.normalizedDomainName);
  const latestIndexedRows = await db
    .select({
      lastIndexedAt: indexedDomainsTable.lastIndexedAt,
    })
    .from(indexedDomainsTable)
    .orderBy(desc(indexedDomainsTable.lastIndexedAt))
    .limit(1);
  const lastIndexedAt = latestIndexedRows[0]?.lastIndexedAt;
  const indexRecentlyUpdated =
    lastIndexedAt !== undefined && differenceInHours(now, lastIndexedAt) < 6;
  logger.trace({ recentlyIndexed: indexRecentlyUpdated }, 'Recently indexed');

  const indexEntries = await db
    .select({
      normalizedDomainName: indexedDomainsTable.normalizedDomainName,
      registrarKey: indexedDomainsTable.registrarKey,
      expirationTime: indexedDomainsTable.expirationTime,
      lastIndexedAt: indexedDomainsTable.lastIndexedAt,
    })
    .from(indexedDomainsTable)
    .where(inArray(indexedDomainsTable.normalizedDomainName, domainNames));

  // Create a map for O(1) lookup
  const indexMap = new Map(
    indexEntries.map((entry) => [entry.normalizedDomainName, entry]),
  );

  logger.info(
    { indexEntriesFound: indexEntries.length },
    'Loaded domain index entries for expired NFTs',
  );

  const readyToBurn: ExpiredDomainInfo[] = [];

  // Step 3: For each expired NFT, verify it's truly gone
  for (const nft of expiredNfts) {
    const domain = nft.normalizedDomainName;

    activityContext.heartbeat({ domain, processing: 'expired NFT' });

    // Check if domain exists in index using the map
    const indexEntry = indexMap.get(domain);

    const notFoundInIndex = !indexEntry;
    const expiredInIndex =
      indexEntry?.expirationTime && indexEntry.expirationTime < new Date();
    const mightBeExpiredButNotUpdatedInIndex =
      !indexRecentlyUpdated && !expiredInIndex;
    const domainRecentlyUpdated =
      indexEntry && differenceInHours(now, indexEntry.lastIndexedAt) < 2 * 24; // 2 days
    const expiredInIndexForAWhile =
      indexRecentlyUpdated && !domainRecentlyUpdated && expiredInIndex;
    logger.trace(
      {
        notFoundInIndex,
        expiredInIndex,
        mightBeExpiredButNotUpdatedInIndex,
        expiredInIndexForAWhile,
        domain,
      },
      'Index entry details',
    );
    // Only check registrar if not found in index or index shows expired
    let notFoundInRegistrar = false;

    if (notFoundInIndex || mightBeExpiredButNotUpdatedInIndex) {
      try {
        const punyDomain = toPunycodeDomainName(domain);
        const domainDetails = await sldRegistrar.getDomainDetails(punyDomain);
        if (!domainDetails) {
          notFoundInRegistrar = true;
        } else if (
          domainDetails.expirationTime &&
          domainDetails.expirationTime < now
        ) {
          // Domain found but expired in registrar too
          notFoundInRegistrar = true;
        }
      } catch (error) {
        // If we can't find it, consider it not found
        logger.debug({ domain, error }, 'Domain not found in registrar');
        notFoundInRegistrar = true;
      }
    }

    // Domain is ready to burn if:
    // 1. Expired > 2 weeks ago
    // 2. Not found in index OR found but expired in index
    // 3. Not found in registrar OR found but expired in registrar
    if ((notFoundInIndex && notFoundInRegistrar) || expiredInIndexForAWhile) {
      const daysSinceExpiration = Math.floor(
        (now.getTime() - nft.expirationTime.getTime()) / (24 * 60 * 60 * 1000),
      );

      readyToBurn.push({
        domain,
        chainId: nft.chainId,
        ownerAddress: nft.ownerAddress,
        nftExpirationDate: nft.expirationTime,
        domainExpirationDate: indexEntry?.expirationTime,
        daysSinceExpiration,
        registrar: indexEntry?.registrarKey,
        notFoundInIndex,
        notFoundInRegistrar,
      });
    }
  }

  logger.info({ count: readyToBurn.length }, 'Found domains ready to burn');

  // Sort by NFT expiration date (ascending)
  readyToBurn.sort(
    (a, b) => a.nftExpirationDate.getTime() - b.nftExpirationDate.getTime(),
  );

  return {
    total: readyToBurn.length,
    readyToBurn,
  };
}

/**
 * Collect all metrics for the export/expiration report
 */
export async function collectExportExpirationMetrics(): Promise<ExportExpirationMetrics> {
  logger.info('Collecting export/expiration metrics');

  const [exportedDomains, expiredDomains] = await Promise.all([
    collectExportedDomainsMetrics(),
    collectExpiredDomainsMetrics(),
  ]);

  // Build registrar breakdown (include both exported and expired domains)
  const registrarBreakdown: Record<string, number> = {};

  for (const domain of [
    ...exportedDomains.pendingTransfer,
    ...exportedDomains.transferPeriod,
    ...exportedDomains.confirmedExported,
    ...exportedDomains.possiblyExported,
    ...expiredDomains.readyToBurn,
  ]) {
    if (domain.registrar) {
      registrarBreakdown[domain.registrar] =
        (registrarBreakdown[domain.registrar] || 0) + 1;
    }
  }

  const metrics: ExportExpirationMetrics = {
    reportDate: new Date(),
    exportedDomains,
    expiredDomains,
    registrarBreakdown,
  };

  logger.info(
    {
      totalExported: exportedDomains.total,
      totalExpired: expiredDomains.total,
    },
    'Collected all export/expiration metrics',
  );

  return metrics;
}

/**
 * Helper function to get chain name from chain ID
 */
function getChainName(chainId: number): string {
  switch (chainId) {
    case 1:
      return 'Ethereum';
    case 8453:
      return 'Base';
    case 11155111:
      return 'Sepolia';
    default:
      return `Chain ${chainId}`;
  }
}

/**
 * Helper function to format owner address
 */
function formatOwnerAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Generate CSV content for exported domains
 */
function generateExportedDomainsCSV(
  exportedDomains: ExportExpirationMetrics['exportedDomains'],
): string {
  const allDomains = [
    ...exportedDomains.pendingTransfer,
    ...exportedDomains.transferPeriod,
    ...exportedDomains.confirmedExported,
    ...exportedDomains.possiblyExported,
  ];

  // CSV header
  let csv =
    'Domain,Status,Chain ID,Chain Name,Owner Address,Registrar,NFT Expiry,Domain Expiry,EPP Status,Last Seen,Operation\n';

  // CSV rows
  for (const domain of allDomains) {
    const chainName = getChainName(domain.chainId);
    const nftExpiry = format(domain.nftExpirationDate, 'yyyy-MM-dd');
    const domainExpiry = domain.domainExpirationDate
      ? format(domain.domainExpirationDate, 'yyyy-MM-dd')
      : '';
    const eppStatus = domain.eppStatus ? domain.eppStatus.join('; ') : '';
    const lastSeen = domain.lastSeenInIndex
      ? format(domain.lastSeenInIndex, 'yyyy-MM-dd')
      : '';
    const operation = domain.exportOperation?.type || '';

    csv += `"${domain.domain}","${domain.status}",${domain.chainId},"${chainName}","${domain.ownerAddress}","${domain.registrar || ''}","${nftExpiry}","${domainExpiry}","${eppStatus}","${lastSeen}","${operation}"\n`;
  }

  return csv;
}

/**
 * Generate CSV content for expired domains
 */
function generateExpiredDomainsCSV(
  expiredDomains: ExportExpirationMetrics['expiredDomains'],
): string {
  // CSV header
  let csv =
    'Domain,Chain ID,Chain Name,Owner Address,Registrar,NFT Expiry,Domain Expiry,Days Since Expiration,Not Found In Index,Not Found In Registrar\n';

  // CSV rows
  for (const domain of expiredDomains.readyToBurn) {
    const chainName = getChainName(domain.chainId);
    const nftExpiry = format(domain.nftExpirationDate, 'yyyy-MM-dd');
    const domainExpiry = domain.domainExpirationDate
      ? format(domain.domainExpirationDate, 'yyyy-MM-dd')
      : '';

    csv += `"${domain.domain}",${domain.chainId},"${chainName}","${domain.ownerAddress}","${domain.registrar || ''}","${nftExpiry}","${domainExpiry}",${domain.daysSinceExpiration},${domain.notFoundInIndex},${domain.notFoundInRegistrar}\n`;
  }

  return csv;
}

/**
 * Generate JSON content for all metrics
 */
function generateMetricsJSON(metrics: ExportExpirationMetrics): string {
  // Create a serializable version of the metrics
  const jsonData = {
    reportDate: format(metrics.reportDate, 'yyyy-MM-dd HH:mm:ss'),
    exportedDomains: {
      total: metrics.exportedDomains.total,
      pendingTransfer:
        metrics.exportedDomains.pendingTransfer.map(formatDomainForJSON),
      transferPeriod:
        metrics.exportedDomains.transferPeriod.map(formatDomainForJSON),
      confirmedExported:
        metrics.exportedDomains.confirmedExported.map(formatDomainForJSON),
      possiblyExported:
        metrics.exportedDomains.possiblyExported.map(formatDomainForJSON),
    },
    expiredDomains: {
      total: metrics.expiredDomains.total,
      readyToBurn: metrics.expiredDomains.readyToBurn.map(
        formatExpiredDomainForJSON,
      ),
    },
    registrarBreakdown: metrics.registrarBreakdown,
  };

  return JSON.stringify(jsonData, null, 2);
}

/**
 * Helper to format exported domain for JSON
 */
function formatDomainForJSON(domain: ExportedDomainInfo) {
  return {
    domain: domain.domain,
    status: domain.status,
    chainId: domain.chainId,
    chainName: getChainName(domain.chainId),
    ownerAddress: domain.ownerAddress,
    registrar: domain.registrar,
    nftExpirationDate: format(domain.nftExpirationDate, 'yyyy-MM-dd'),
    domainExpirationDate: domain.domainExpirationDate
      ? format(domain.domainExpirationDate, 'yyyy-MM-dd')
      : null,
    eppStatus: domain.eppStatus,
    lastSeenInIndex: domain.lastSeenInIndex
      ? format(domain.lastSeenInIndex, 'yyyy-MM-dd')
      : null,
    exportOperation: domain.exportOperation,
  };
}

/**
 * Helper to format expired domain for JSON
 */
function formatExpiredDomainForJSON(domain: ExpiredDomainInfo) {
  return {
    domain: domain.domain,
    chainId: domain.chainId,
    chainName: getChainName(domain.chainId),
    ownerAddress: domain.ownerAddress,
    registrar: domain.registrar,
    nftExpirationDate: format(domain.nftExpirationDate, 'yyyy-MM-dd'),
    domainExpirationDate: domain.domainExpirationDate
      ? format(domain.domainExpirationDate, 'yyyy-MM-dd')
      : null,
    daysSinceExpiration: domain.daysSinceExpiration,
    notFoundInIndex: domain.notFoundInIndex,
    notFoundInRegistrar: domain.notFoundInRegistrar,
  };
}

/**
 * Format the export/expiration report content
 */
export async function formatExportExpirationReport(
  metrics: ExportExpirationMetrics,
): Promise<{ title: string; content: string }> {
  logger.info('Formatting export/expiration report');

  const { exportedDomains, expiredDomains, reportDate } = metrics;

  const title = `📊 Domain Export & Expiration Report - ${format(reportDate, 'MMM dd, yyyy')}`;

  let content = `# ${title}\n\n`;
  content += `Generated at: ${format(reportDate, 'yyyy-MM-dd HH:mm:ss')} UTC\n\n`;
  content += '═══════════════════════════════════════════════════\n\n';

  // Section 1: Domains Being Exported/Exported
  content += '## 📤 DOMAINS BEING EXPORTED/EXPORTED\n\n';
  content += `**Total Domains in Export Process:** ${exportedDomains.total}\n\n`;

  if (exportedDomains.pendingTransfer.length > 0) {
    content += `### 🔄 Pending Transfer (${exportedDomains.pendingTransfer.length} domains)\n\n`;
    content += 'Transfer requests have been initiated for these domains:\n\n';
    content += '<div id="markdown-table">\n\n';
    content +=
      '| Domain | Chain ID | Owner | Registrar | NFT Expiry | Domain Expiry | EPP Status |\n';
    content +=
      '|:-------|:---------|:------|:----------|:-----------|:--------------|:-----------|\n';
    for (const domain of exportedDomains.pendingTransfer) {
      const eppStatus = domain.eppStatus ? domain.eppStatus.join(', ') : '-';
      const nftExpiry = format(domain.nftExpirationDate, 'yyyy-MM-dd');
      const domainExpiry = domain.domainExpirationDate
        ? format(domain.domainExpirationDate, 'yyyy-MM-dd')
        : '-';
      content += `| ${domain.domain} | ${getChainName(domain.chainId)} | ${formatOwnerAddress(domain.ownerAddress)} | ${domain.registrar || '-'} | ${nftExpiry} | ${domainExpiry} | ${eppStatus} |\n`;
    }
    content += '\n</div>\n\n';
  }

  if (exportedDomains.transferPeriod.length > 0) {
    content += `### ✅ Transfer Period (${exportedDomains.transferPeriod.length} domains)\n\n`;
    content +=
      'Domains have been transferred and are in the 60-day holding period:\n\n';
    content += '<div id="markdown-table">\n\n';
    content +=
      '| Domain | Chain ID | Owner | Registrar | NFT Expiry | Domain Expiry | Last Seen |\n';
    content +=
      '|:-------|:---------|:------|:----------|:-----------|:--------------|:----------|\n';
    for (const domain of exportedDomains.transferPeriod) {
      const nftExpiry = format(domain.nftExpirationDate, 'yyyy-MM-dd');
      const domainExpiry = domain.domainExpirationDate
        ? format(domain.domainExpirationDate, 'yyyy-MM-dd')
        : '-';
      const lastSeen = domain.lastSeenInIndex
        ? format(domain.lastSeenInIndex, 'yyyy-MM-dd')
        : '-';
      content += `| ${domain.domain} | ${getChainName(domain.chainId)} | ${formatOwnerAddress(domain.ownerAddress)} | ${domain.registrar || '-'} | ${nftExpiry} | ${domainExpiry} | ${lastSeen} |\n`;
    }
    content += '\n</div>\n\n';
  }

  if (exportedDomains.confirmedExported.length > 0) {
    content += `### ⚠️ Confirmed Exported (${exportedDomains.confirmedExported.length} domains)\n\n`;
    content += 'NFTs are locked and domains are not found in registrars:\n\n';
    content += '<div id="markdown-table">\n\n';
    content +=
      '| Domain | Chain ID | Owner | Registrar | NFT Expiry | Domain Expiry | Last Seen | Operation |\n';
    content +=
      '|:-------|:---------|:------|:----------|:-----------|:--------------|:----------|:----------|\n';
    for (const domain of exportedDomains.confirmedExported) {
      const nftExpiry = format(domain.nftExpirationDate, 'yyyy-MM-dd');
      const domainExpiry = domain.domainExpirationDate
        ? format(domain.domainExpirationDate, 'yyyy-MM-dd')
        : '-';
      const lastSeen = domain.lastSeenInIndex
        ? format(domain.lastSeenInIndex, 'yyyy-MM-dd')
        : '-';
      const operation = domain.exportOperation
        ? domain.exportOperation.type
        : '-';
      content += `| ${domain.domain} | ${getChainName(domain.chainId)} | ${formatOwnerAddress(domain.ownerAddress)} | ${domain.registrar || '-'} | ${nftExpiry} | ${domainExpiry} | ${lastSeen} | ${operation} |\n`;
    }
    content += '\n</div>\n\n';
  }

  if (exportedDomains.possiblyExported.length > 0) {
    content += `### ❓ Possibly Exported (${exportedDomains.possiblyExported.length} domains)\n\n`;
    content += 'NFTs are locked but export status unclear:\n\n';
    content += '<div id="markdown-table">\n\n';
    content +=
      '| Domain | Chain ID | Owner | Registrar | NFT Expiry | Domain Expiry |\n';
    content +=
      '|:-------|:---------|:------|:----------|:-----------|:--------------|\n';
    for (const domain of exportedDomains.possiblyExported) {
      const nftExpiry = format(domain.nftExpirationDate, 'yyyy-MM-dd');
      const domainExpiry = domain.domainExpirationDate
        ? format(domain.domainExpirationDate, 'yyyy-MM-dd')
        : '-';
      content += `| ${domain.domain} | ${getChainName(domain.chainId)} | ${formatOwnerAddress(domain.ownerAddress)} | ${domain.registrar || '-'} | ${nftExpiry} | ${domainExpiry} |\n`;
    }
    content += '\n</div>\n\n';
  }

  if (exportedDomains.total === 0) {
    content += '✨ No domains currently in export process.\n\n';
  }

  content += '\n═══════════════════════════════════════════════════\n\n';

  // Section 2: Expired Domains Ready to Burn
  content += '## 🔥 EXPIRED AND READY TO BURN\n\n';
  content += `**Total Domains Ready to Burn:** ${expiredDomains.total}\n\n`;

  if (expiredDomains.readyToBurn.length > 0) {
    content +=
      'These domains have been expired for >14 days and are not found in registrars:\n\n';
    content += '<div id="markdown-table">\n\n';
    content +=
      '| Domain | Chain ID | Owner | Registrar | NFT Expiry | Domain Expiry | Days Ago |\n';
    content +=
      '|:-------|:---------|:------|:----------|:-----------|:--------------|:---------|\n';
    for (const domain of expiredDomains.readyToBurn) {
      const nftExpiry = format(domain.nftExpirationDate, 'yyyy-MM-dd');
      const domainExpiry = domain.domainExpirationDate
        ? format(domain.domainExpirationDate, 'yyyy-MM-dd')
        : '-';
      content += `| ${domain.domain} | ${getChainName(domain.chainId)} | ${formatOwnerAddress(domain.ownerAddress)} | ${domain.registrar || '-'} | ${nftExpiry} | ${domainExpiry} | ${domain.daysSinceExpiration} |\n`;
    }
    content += '\n</div>\n\n';
  } else {
    content += '✨ No domains ready to burn at this time.\n\n';
  }

  content += '\n═══════════════════════════════════════════════════\n\n';

  // Section 3: Summary Statistics
  content += '## 📊 Summary Statistics\n\n';
  content += `- **Total Domains Monitored:** ${exportedDomains.total + expiredDomains.total}\n`;
  content += `- **Export Operations:** ${exportedDomains.total}\n`;
  content += `  - Pending Transfer: ${exportedDomains.pendingTransfer.length}\n`;
  content += `  - Transfer Period: ${exportedDomains.transferPeriod.length}\n`;
  content += `  - Confirmed Exported: ${exportedDomains.confirmedExported.length}\n`;
  content += `  - Possibly Exported: ${exportedDomains.possiblyExported.length}\n`;
  content += `- **Expired Domains:** ${expiredDomains.total}\n`;

  if (Object.keys(metrics.registrarBreakdown).length > 0) {
    content += '\n### Registrar Breakdown\n\n';
    for (const [registrar, count] of Object.entries(
      metrics.registrarBreakdown,
    )) {
      content += `- ${registrar}: ${count}\n`;
    }
  }

  logger.info(
    { titleLength: title.length, contentLength: content.length },
    'Report formatted',
  );

  return { title, content };
}

/**
 * Send the export/expiration report to Slack
 */
export async function sendExportExpirationReportToSlack(
  title: string,
  content: string,
): Promise<void> {
  logger.info('Sending export/expiration report to Slack');

  const webhookUrl = secrets.NAMEFI_ASSET_REPORT_SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn('No Slack webhook URL configured, skipping Slack notification');
    logger.info('Report would have been sent', {
      title,
      contentLength: content.length,
    });
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: title,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: title,
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: content.substring(0, 3000), // Slack has a 3000 char limit for text blocks
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Slack webhook returned ${response.status}: ${await response.text()}`,
      );
    }

    logger.info('Report sent to Slack successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to send report to Slack');
    throw error;
  }
}

/**
 * Send the export/expiration report via email
 */
export async function sendExportExpirationReportEmail(
  title: string,
  content: string,
  metrics: ExportExpirationMetrics,
): Promise<void> {
  logger.info('Sending export/expiration report email');

  try {
    const html = await render(
      React.createElement(ExportExpirationDailyReport, {
        title,
        content,
        metrics,
      }),
    );

    // Generate attachments
    const dateStr = format(metrics.reportDate, 'yyyy-MM-dd');
    const attachments = [];

    // Add exported domains CSV
    if (metrics.exportedDomains.total > 0) {
      const exportedCsv = generateExportedDomainsCSV(metrics.exportedDomains);
      attachments.push({
        filename: `exported-domains-${dateStr}.csv`,
        content: exportedCsv,
        contentType: 'text/csv',
      });
    }

    // Add expired domains CSV
    if (metrics.expiredDomains.total > 0) {
      const expiredCsv = generateExpiredDomainsCSV(metrics.expiredDomains);
      attachments.push({
        filename: `expired-domains-${dateStr}.csv`,
        content: expiredCsv,
        contentType: 'text/csv',
      });
    }

    // Add comprehensive JSON
    const metricsJson = generateMetricsJSON(metrics);
    attachments.push({
      filename: `export-expiration-report-${dateStr}.json`,
      content: metricsJson,
      contentType: 'application/json',
    });

    await sendMail({
      to: ['reporting@namefi.io'],
      subject: title,
      content: {
        html,
      },
      attachments,
    });

    logger.info(
      { attachmentCount: attachments.length },
      'Report email sent successfully with attachments',
    );
  } catch (error) {
    logger.error({ error }, 'Failed to send report email');
    throw error;
  }
}
