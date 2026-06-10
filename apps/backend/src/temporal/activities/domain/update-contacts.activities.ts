import type {
  ContactEntity,
  DomainContacts,
} from '@namefi-astra/registrars/data/types/index';
import { OperationStatus } from '@namefi-astra/registrars/data/types/operation-status';
import {
  type PunycodeDomainName,
  toPunycodeDomainName,
} from '@namefi-astra/registrars/data/validations';
import type { Registrars } from '@namefi-astra/registrars/registrars-keys';
import { Context } from '@temporalio/activity';
import pMap from 'p-map';
import { sldRegistrar } from '#lib/namefi-registry';
import { DEFAULT_CONTACT } from './registrar.activities';

/**
 * Selector for which domains an admin contact-update should target.
 *
 * - `domainList`: explicit set of domain names; the registrar for each is
 *   resolved from `listAllDomains()`. Domains not found at any configured
 *   registrar are skipped with a warning.
 * - `registrar`: all domains owned at the specified registrar (uses the
 *   registrar's own listing — no full fan-out).
 * - `tld`: all domains across registrars whose name ends with `.${tld}`.
 */
export type DomainContactsFilter =
  | { type: 'domainList'; domains: string[] }
  | { type: 'registrar'; registrar: Registrars }
  | { type: 'tld'; tld: string };

export interface DomainTarget {
  domain: string;
  registrar: Registrars;
}

export interface UpdateContactsProcessResult {
  domain: string;
  registrar: string;
  success: boolean;
  /**
   * True when the workflow fell back to DEFAULT_CONTACT because no contacts
   * were provided. The update is still submitted because the default may
   * have changed since the last write.
   */
  usedDefault: boolean;
  operationId?: string | null;
  status?: OperationStatus;
  error?: string;
}

export interface UpdateContactsSummary {
  totalDomains: number;
  successful: number;
  failed: number;
  defaultsApplied: number;
  failedDomains: Array<{ domain: string; registrar: string; error: string }>;
  byRegistrar: Record<
    string,
    { total: number; successful: number; failed: number }
  >;
}

/**
 * Resolve the list of domains targeted by the filter.
 */
export async function listDomainsForContactsUpdate(
  filter: DomainContactsFilter,
): Promise<DomainTarget[]> {
  const ctx = Context.current();

  if (filter.type === 'registrar') {
    ctx.log.info(`Listing domains for registrar ${filter.registrar}`);
    const all = await sldRegistrar.listAllDomains({
      registrar: filter.registrar,
    });
    return all.map((d) => ({
      domain: d.domainName,
      registrar: d.registrarKey,
    }));
  }

  if (filter.type === 'domainList') {
    if (filter.domains.length === 0) return [];

    // Normalize user-supplied entries to punycode (toPunycodeDomainName
    // trims, lowercases, and ASCII-encodes) so Unicode/IDN inputs match
    // the registrar's domain names. Invalid entries are dropped with a
    // warning rather than treated as silently missing.
    type NormalizedInput = { orig: string; puny: PunycodeDomainName };
    const inputs: NormalizedInput[] = [];
    for (const d of filter.domains) {
      try {
        inputs.push({ orig: d, puny: toPunycodeDomainName(d) });
      } catch (e) {
        ctx.log.warn(
          `Invalid domain in domainList: "${d}" — ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
    if (inputs.length === 0) return [];

    const all = await sldRegistrar.listAllDomains();
    const wanted = new Set(inputs.map((i) => i.puny));
    const found = all
      .filter((d) => wanted.has(d.domainName))
      .map((d) => ({
        domain: d.domainName,
        registrar: d.registrarKey,
      }));
    const foundSet = new Set(found.map((f) => f.domain));
    const missing = inputs
      .filter((i) => !foundSet.has(i.puny))
      .map((i) => i.orig);
    if (missing.length > 0) {
      ctx.log.warn(
        `Skipping ${missing.length} domain(s) not found at any registrar: ${missing.join(', ')}`,
      );
    }
    return found;
  }

  if (filter.type === 'tld') {
    const tld = filter.tld.replace(/^\./, '').toLowerCase();
    ctx.log.info(`Listing domains for TLD .${tld}`);
    const all = await sldRegistrar.listAllDomains();
    return all
      .filter((d) => d.domainName.endsWith(`.${tld}`))
      .map((d) => ({
        domain: d.domainName,
        registrar: d.registrarKey,
      }));
  }

  throw new Error(
    `Unsupported domain contacts filter type: ${(filter as { type: string }).type}`,
  );
}

function buildDefaultContacts(domainName: PunycodeDomainName): DomainContacts {
  return {
    registrantContact: DEFAULT_CONTACT(
      domainName,
      'registrant',
    ) as ContactEntity,
    adminContact: DEFAULT_CONTACT(domainName, 'admin'),
    technicalContact: DEFAULT_CONTACT(domainName, 'tech'),
    billingContact: DEFAULT_CONTACT(domainName, 'tech'),
  };
}

/**
 * Submit a contact update for a single domain.
 *
 * When `contacts` is omitted/null, the full DEFAULT_CONTACT set is submitted
 * — we still push the update because DEFAULT_CONTACT may have changed since
 * the last write.
 *
 * The registrar's `updateDomainContacts` is asynchronous; this activity
 * returns success once the registrar has accepted the request (SUBMITTED /
 * IN_PROGRESS / SUCCESSFUL). Operational completion is the registrar's
 * responsibility — admins can verify via the returned `operationId`.
 */
export async function updateContactsForDomain(
  target: DomainTarget,
  contacts?: Partial<DomainContacts> | null,
  dryRun = false,
): Promise<UpdateContactsProcessResult> {
  const ctx = Context.current();
  const usedDefault = !contacts;
  const result: UpdateContactsProcessResult = {
    domain: target.domain,
    registrar: target.registrar,
    success: false,
    usedDefault,
  };

  const domainName = toPunycodeDomainName(target.domain);
  const resolvedContacts: Partial<DomainContacts> =
    contacts ?? buildDefaultContacts(domainName);

  if (dryRun) {
    ctx.log.info(
      `[DRY RUN] Would update contacts for ${target.domain} (${target.registrar})${usedDefault ? ' using DEFAULT_CONTACT' : ''}`,
    );
    result.success = true;
    return result;
  }

  try {
    const operationResult = await sldRegistrar.updateDomainContacts(
      domainName,
      resolvedContacts,
      { overrideRegistrar: target.registrar },
    );
    result.operationId = operationResult.operationId;
    result.status = operationResult.status;
    if (
      operationResult.status === OperationStatus.SUBMITTED ||
      operationResult.status === OperationStatus.IN_PROGRESS ||
      operationResult.status === OperationStatus.SUCCESSFUL
    ) {
      result.success = true;
      ctx.log.info(
        `Submitted contact update for ${target.domain} (${target.registrar})${usedDefault ? ' using DEFAULT_CONTACT' : ''}, op=${operationResult.operationId}, status=${operationResult.status}`,
      );
    } else {
      result.error = `Operation rejected with status: ${operationResult.status}`;
      ctx.log.error(
        `Failed to update contacts for ${target.domain} (${target.registrar}): ${result.error}`,
      );
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    ctx.log.error(
      `Error updating contacts for ${target.domain} (${target.registrar}): ${result.error}`,
    );
  }
  return result;
}

/**
 * Bulk-submit contact updates with concurrency control. Individual failures
 * are captured per-domain and never fail the batch.
 */
export async function updateContactsForDomains(
  targets: DomainTarget[],
  contacts?: Partial<DomainContacts> | null,
  concurrency = 5,
  dryRun = false,
): Promise<UpdateContactsProcessResult[]> {
  const ctx = Context.current();
  ctx.log.info(
    `Processing ${targets.length} domains for contact update (concurrency=${concurrency}, dryRun=${dryRun}, usingDefault=${!contacts})`,
  );
  if (targets.length === 0) return [];
  return pMap(targets, (t) => updateContactsForDomain(t, contacts, dryRun), {
    concurrency,
  });
}

export async function generateUpdateContactsSummary(
  results: UpdateContactsProcessResult[],
): Promise<UpdateContactsSummary> {
  const total = results.length;
  const successful = results.filter((r) => r.success).length;
  const failed = total - successful;
  const defaultsApplied = results.filter((r) => r.usedDefault).length;
  const failedDomains = results
    .filter((r) => !r.success)
    .map((r) => ({
      domain: r.domain,
      registrar: r.registrar,
      error: r.error ?? 'Unknown error',
    }));
  const byRegistrar = results.reduce(
    (acc, r) => {
      const key = r.registrar || 'unknown';
      if (!acc[key]) acc[key] = { total: 0, successful: 0, failed: 0 };
      acc[key].total++;
      if (r.success) acc[key].successful++;
      else acc[key].failed++;
      return acc;
    },
    {} as Record<string, { total: number; successful: number; failed: number }>,
  );
  return {
    totalDomains: total,
    successful,
    failed,
    defaultsApplied,
    failedDomains,
    byRegistrar,
  };
}

export async function logUpdateContactsSummary(
  summary: UpdateContactsSummary,
  dryRun = false,
): Promise<void> {
  const ctx = Context.current();
  ctx.log.info('============================================================');
  ctx.log.info(`${dryRun ? 'DRY RUN ' : ''}UPDATE DOMAIN CONTACTS SUMMARY`);
  ctx.log.info('============================================================');
  ctx.log.info(`Total domains processed: ${summary.totalDomains}`);
  ctx.log.info(`Successful: ${summary.successful}`);
  ctx.log.info(`Failed: ${summary.failed}`);
  ctx.log.info(
    `Defaults applied (no contacts provided): ${summary.defaultsApplied}`,
  );
  if (summary.failed > 0) {
    ctx.log.warn('Failed domains:');
    for (const f of summary.failedDomains) {
      ctx.log.warn(`  - ${f.domain} (${f.registrar}): ${f.error}`);
    }
  }
  ctx.log.info('By Registrar:');
  for (const [r, stats] of Object.entries(summary.byRegistrar)) {
    ctx.log.info(
      `  ${r}: ${stats.successful}/${stats.total} successful (${stats.failed} failed)`,
    );
  }
  ctx.log.info('============================================================');
}
