import type { DomainContacts } from '@namefi-astra/registrars/lib/abstract-registrar/data/index';
import * as workflow from '@temporalio/workflow';
import { TEMPORAL_ENUMS, shortRunningOpts } from '../shared';
import { typedProxyActivities } from '../shared/workflow-helpers/typed-proxy-activities';
import type {
  DomainContactsFilter,
  UpdateContactsProcessResult,
  UpdateContactsSummary,
} from '../activities/domain/update-contacts.activities';

export interface AdminUpdateDomainContactsWorkflowInput {
  /**
   * Selector for which domains to update.
   * - `domainList`: explicit list of domain names.
   * - `registrar`: all domains owned at the specified registrar.
   * - `tld`: all domains under the given TLD across registrars.
   */
  filter: DomainContactsFilter;
  /**
   * Contacts to write. When omitted/null the workflow re-submits the full
   * current DEFAULT_CONTACT set — the default may have changed since the
   * last write, so re-submitting keeps the registrar in sync.
   */
  contacts?: Partial<DomainContacts> | null;
  /** Per-domain concurrency. Defaults to 5. */
  concurrency?: number;
  /** When true, log the plan and skip the actual registrar call. */
  dryRun?: boolean;
}

export interface AdminUpdateDomainContactsWorkflowOutput {
  dryRun: boolean;
  filter: DomainContactsFilter;
  usedDefault: boolean;
  domainsTargeted: number;
  results: UpdateContactsProcessResult[];
  summary: UpdateContactsSummary;
  hasFailures: boolean;
  executionDurationSeconds: number;
}

const {
  listDomainsForContactsUpdate,
  updateContactsForDomains,
  generateUpdateContactsSummary,
  logUpdateContactsSummary,
} = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DOMAINS,
  options: {
    scheduleToStartTimeout: '2 minutes',
    startToCloseTimeout: '30 minutes',
    retry: {
      initialInterval: '30 seconds',
      maximumInterval: '5 minutes',
      backoffCoefficient: 2,
      maximumAttempts: 3,
    },
  },
});

const { generalAlertNamefi, criticalAlertNamefi } = typedProxyActivities({
  temporalEnum: TEMPORAL_ENUMS.DEFAULT,
  options: shortRunningOpts,
});

/**
 * Admin workflow to (re)submit WHOIS contact details for a set of domains.
 *
 * Use cases:
 * - Push the latest DEFAULT_CONTACT to a registrar after the default has
 *   been edited (omit `contacts`).
 * - Apply a custom contact set to a curated list of domains.
 *
 * The workflow is intentionally fire-and-forget at the registrar level: it
 * waits for the registrar to accept the request (SUBMITTED / IN_PROGRESS /
 * SUCCESSFUL) and records the `operationId` per domain. Long-running
 * propagation is the registrar's responsibility.
 */
export async function adminUpdateDomainContactsWorkflow({
  filter,
  contacts,
  concurrency = 5,
  dryRun = false,
}: AdminUpdateDomainContactsWorkflowInput): Promise<AdminUpdateDomainContactsWorkflowOutput> {
  const startTime = Date.now();
  const usedDefault = !contacts;
  // p-map requires concurrency to be a positive integer; admins may pass
  // 0, NaN, or a float. Floor + clamp, falling back to the default.
  const flooredConcurrency = Math.floor(concurrency);
  const safeConcurrency =
    Number.isFinite(flooredConcurrency) && flooredConcurrency >= 1
      ? flooredConcurrency
      : 5;

  workflow.log.info('Starting admin update domain contacts workflow', {
    filter,
    usedDefault,
    dryRun,
    concurrency: safeConcurrency,
  });

  try {
    const targets = await listDomainsForContactsUpdate(filter);
    workflow.log.info(`Resolved ${targets.length} domain(s) for filter`, {
      filter,
    });

    if (targets.length === 0) {
      const summary = await generateUpdateContactsSummary([]);
      const executionDurationSeconds = Math.round(
        (Date.now() - startTime) / 1000,
      );
      return {
        dryRun,
        filter,
        usedDefault,
        domainsTargeted: 0,
        results: [],
        summary,
        hasFailures: false,
        executionDurationSeconds,
      };
    }

    const results = await updateContactsForDomains(
      targets,
      contacts ?? null,
      safeConcurrency,
      dryRun,
    );
    const summary = await generateUpdateContactsSummary(results);
    await logUpdateContactsSummary(summary, dryRun);

    const hasFailures = summary.failed > 0;

    if (hasFailures && !dryRun) {
      await criticalAlertNamefi({
        workflowInfo: workflow.workflowInfo(),
        message: `Admin contact update failed for ${summary.failed} of ${summary.totalDomains} domain(s)`,
        level: 'error',
        details: {
          summary,
          failedDomains: summary.failedDomains.slice(0, 10),
          filter,
          usedDefault,
        },
      });
    } else if (!dryRun && summary.successful > 0) {
      await generalAlertNamefi({
        workflowInfo: workflow.workflowInfo(),
        message: `Admin contact update completed: ${summary.successful}/${summary.totalDomains} submitted`,
        level: 'info',
        details: { summary, filter, usedDefault },
      });
    }

    const executionDurationSeconds = Math.round(
      (Date.now() - startTime) / 1000,
    );

    return {
      dryRun,
      filter,
      usedDefault,
      domainsTargeted: targets.length,
      results,
      summary,
      hasFailures,
      executionDurationSeconds,
    };
  } catch (error: any) {
    workflow.log.error('Admin update domain contacts workflow failed', {
      error,
    });
    await criticalAlertNamefi({
      workflowInfo: workflow.workflowInfo(),
      message: `Admin contact update workflow failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
      level: 'error',
      details: { filter, usedDefault, dryRun },
    });
    throw error;
  }
}

/**
 * Deterministic 32-bit FNV-1a hash. Used to fingerprint a normalized
 * `domainList` so two different lists of the same length on the same day
 * don't collide on the same workflow ID.
 */
function fnv1aHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

adminUpdateDomainContactsWorkflow.generateId = (
  input: AdminUpdateDomainContactsWorkflowInput,
): string => {
  let filterId: string;
  if (input.filter.type === 'domainList') {
    const fingerprint = fnv1aHash(
      [...input.filter.domains]
        .map((d) => d.trim().toLowerCase().replace(/\.+$/, ''))
        .sort()
        .join('|'),
    );
    filterId = `list-${input.filter.domains.length}-${fingerprint}`;
  } else if (input.filter.type === 'registrar') {
    filterId = `registrar-${input.filter.registrar}`;
  } else {
    filterId = `tld-${input.filter.tld.replace(/^\./, '')}`;
  }
  const dateStr = new Date().toISOString().split('T')[0];
  const dryRunSuffix = input.dryRun ? '-[dry-run]' : '';
  const usedDefaultSuffix = input.contacts ? '' : '-[default]';
  return `admin-update-domain-contacts-[${filterId}]-[${dateStr}]${usedDefaultSuffix}${dryRunSuffix}`;
};
