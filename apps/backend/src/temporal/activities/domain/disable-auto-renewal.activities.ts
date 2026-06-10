import { sldRegistrar } from '#lib/namefi-registry';
import type { Registrars } from '@namefi-astra/registrars/registrars-keys';
import pMap from 'p-map';
import { Context } from '@temporalio/activity';
import { RenewOption } from '@namefi-astra/registrars/data/types/renew-option';

/**
 * Result of processing a single domain for auto-renewal disabling
 */
export interface DomainAutoRenewalProcessResult {
  domain: string;
  registrar: string;
  success: boolean;
  previousState: RenewOption;
  error?: string;
  skipped?: boolean; // true if domain already had auto-renewal disabled
}

/**
 * Summary report of the auto-renewal disabling operation
 */
export interface AutoRenewalDisablingSummary {
  totalDomains: number;
  successful: number;
  failed: number;
  alreadyDisabled: number;
  actuallyChanged: number;
  failedDomains: Array<{
    domain: string;
    registrar: string;
    error: string;
  }>;
  byRegistrar: Record<
    string,
    {
      total: number;
      successful: number;
      failed: number;
    }
  >;
}

/**
 * Get all domains that currently have auto-renewal enabled across all registrars
 * @param registrar Optional registrar filter to target specific registrar only
 * @returns Array of domains with auto-renewal enabled
 */
export async function getDomainsWithAutoRenewalEnabled(
  registrar?: Registrars,
): Promise<Array<{ domain: string; registrar: string }>> {
  const ctx = Context.current();

  ctx.log.info('Fetching domains with auto-renewal enabled', { registrar });

  // Get all domains from the specified registrar(s)
  const allDomains = await sldRegistrar.listAllDomains(
    registrar ? { registrar } : undefined,
  );

  ctx.log.info(`Found ${allDomains.length} domains total`);

  // Filter domains that have auto-renewal enabled
  const domainsWithAutoRenewal: Array<{ domain: string; registrar: string }> =
    [];

  let checkedCount = 0;
  for (const domainInfo of allDomains) {
    checkedCount++;
    if (checkedCount % 50 === 0) {
      ctx.log.info(`Checked ${checkedCount}/${allDomains.length} domains...`);
    }

    if (domainInfo.autoRenewOption === RenewOption.AUTOMATIC) {
      domainsWithAutoRenewal.push({
        domain: domainInfo.domainName,
        registrar: domainInfo.registrarKey,
      });
    }
  }

  ctx.log.info(
    `Found ${domainsWithAutoRenewal.length} domains with auto-renewal enabled`,
  );

  return domainsWithAutoRenewal;
}

/**
 * Disable auto-renewal for a single domain
 * @param domain Domain name to process
 * @param registrar Registrar key for the domain
 * @param dryRun If true, only simulate the operation without making changes
 * @returns Result of the processing operation
 */
export async function disableAutoRenewalForDomain(
  domain: string,
  registrar: string,
  dryRun = false,
): Promise<DomainAutoRenewalProcessResult> {
  const ctx = Context.current();

  const result: DomainAutoRenewalProcessResult = {
    domain,
    registrar,
    success: false,
    previousState: RenewOption.MANUAL,
  };

  try {
    // Get current renewal option
    const currentRenewOption = await sldRegistrar.getRenewOption(domain as any);
    result.previousState = currentRenewOption;

    // Skip if already set to manual
    if (currentRenewOption === RenewOption.MANUAL) {
      result.success = true;
      result.skipped = true;
      ctx.log.info(
        `Domain ${domain} (${registrar}) already has auto-renewal disabled`,
      );
      return result;
    }

    if (dryRun) {
      ctx.log.info(
        `[DRY RUN] Would disable auto-renewal for ${domain} (${registrar})`,
      );
      result.success = true;
      return result;
    }

    // Disable auto-renewal
    const operationResult = await sldRegistrar.setRenewOption(
      domain as any,
      RenewOption.MANUAL,
    );

    if (operationResult.status === 'SUCCESSFUL') {
      result.success = true;
      ctx.log.info(
        `Successfully disabled auto-renewal for ${domain} (${registrar})`,
      );
    } else {
      result.error = `Operation failed with status: ${operationResult.status}`;
      ctx.log.error(
        `Failed to disable auto-renewal for ${domain} (${registrar}): ${result.error}`,
      );
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    ctx.log.error(`Error processing ${domain} (${registrar}): ${result.error}`);
  }

  return result;
}

/**
 * Process multiple domains to disable auto-renewal with concurrency control
 * @param domains Array of domains to process
 * @param concurrency Number of domains to process simultaneously
 * @param dryRun If true, only simulate the operations without making changes
 * @returns Array of processing results
 */
export async function disableAutoRenewalForDomains(
  domains: Array<{ domain: string; registrar: string }>,
  concurrency = 5,
  dryRun = false,
): Promise<DomainAutoRenewalProcessResult[]> {
  const ctx = Context.current();

  ctx.log.info(
    `Processing ${domains.length} domains with concurrency ${concurrency}, dryRun: ${dryRun}`,
  );

  if (domains.length === 0) {
    return [];
  }

  // Process domains with concurrency control
  const results = await pMap(
    domains,
    async ({ domain, registrar }) => {
      return disableAutoRenewalForDomain(domain, registrar, dryRun);
    },
    {
      concurrency,
    },
  );

  return results;
}

/**
 * Generate a comprehensive summary report of the auto-renewal disabling operation
 * @param results Array of domain processing results
 * @param dryRun Whether this was a dry run operation
 * @returns Summary report object
 */
export async function generateAutoRenewalDisablingSummary(
  results: DomainAutoRenewalProcessResult[],
  dryRun = false,
): Promise<AutoRenewalDisablingSummary> {
  const total = results.length;
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const alreadyDisabled = results.filter(
    (r) => r.success && r.previousState === RenewOption.MANUAL,
  ).length;
  const actuallyChanged = results.filter(
    (r) => r.success && r.previousState === RenewOption.AUTOMATIC && !r.skipped,
  ).length;

  const failedDomains = results
    .filter((r) => !r.success)
    .map((r) => ({
      domain: r.domain,
      registrar: r.registrar,
      error: r.error || 'Unknown error',
    }));

  // Group by registrar
  const byRegistrar = results.reduce(
    (acc, result) => {
      if (!acc[result.registrar]) {
        acc[result.registrar] = { total: 0, successful: 0, failed: 0 };
      }
      acc[result.registrar].total++;
      if (result.success) {
        acc[result.registrar].successful++;
      } else {
        acc[result.registrar].failed++;
      }
      return acc;
    },
    {} as Record<string, { total: number; successful: number; failed: number }>,
  );

  return {
    totalDomains: total,
    successful,
    failed,
    alreadyDisabled,
    actuallyChanged,
    failedDomains,
    byRegistrar,
  };
}

/**
 * Log a detailed summary report to the temporal logger
 * @param summary Summary report object
 * @param dryRun Whether this was a dry run operation
 */
export async function logAutoRenewalDisablingSummary(
  summary: AutoRenewalDisablingSummary,
  dryRun = false,
): Promise<void> {
  const ctx = Context.current();

  ctx.log.info('============================================================');
  ctx.log.info(`${dryRun ? 'DRY RUN ' : ''}AUTO-RENEWAL DISABLING SUMMARY`);
  ctx.log.info('============================================================');
  ctx.log.info(`Total domains processed: ${summary.totalDomains}`);
  ctx.log.info(`Successful operations: ${summary.successful}`);
  ctx.log.info(`Failed operations: ${summary.failed}`);
  ctx.log.info(`Already had auto-renewal disabled: ${summary.alreadyDisabled}`);
  ctx.log.info(
    `${dryRun ? 'Would have changed' : 'Actually changed'}: ${summary.actuallyChanged}`,
  );

  if (summary.failed > 0) {
    ctx.log.warn('Failed domains:');
    for (const failed of summary.failedDomains) {
      ctx.log.warn(
        `  - ${failed.domain} (${failed.registrar}): ${failed.error}`,
      );
    }
  }

  ctx.log.info('By Registrar:');
  for (const [registrar, stats] of Object.entries(summary.byRegistrar)) {
    ctx.log.info(
      `  ${registrar}: ${stats.successful}/${stats.total} successful (${stats.failed} failed)`,
    );
  }

  ctx.log.info('============================================================');
}
