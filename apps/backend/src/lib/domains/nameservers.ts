import { resolveNs } from 'node:dns/promises';
import type { Nameserver } from '@namefi-astra/registrars/lib/abstract-registrar/data/nameservers';
import {
  type PunycodeDomainName,
  type PunycodeFqdn,
  toPunycodeDomainName,
  toPunycodeFqdn,
} from '@namefi-astra/registrars/lib/data/validations';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { config } from '#lib/env';
import { createLogger } from '#lib/logger';
import { sldRegistrar } from '#lib/namefi-registry';
import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import { db } from '@namefi-astra/db';
import { isBefore, subHours } from 'date-fns';
import {
  changeNameserversWorkflow,
  resetNameserversWorkflow,
  type ChangeNameserversWorkflowInput,
} from '../../temporal/workflows';

const _logger = createLogger({ module: 'domains-nameservers' });

/**
 * The result of comparing arrays of nameservers to expected nameservers
 */
export type NameserversComparisonResult = {
  /**
   * True if the nameservers are an exact match, i.e. arrays are the equivalent
   */
  isExactMatch: boolean;
  /**
   * True if the nameservers are a complete mismatch, i.e. no nameservers are in common
   */
  isCompleteMismatch: boolean;
  /**
   * True if the nameservers are using other nameservers along with the expected nameservers
   */
  isUsingOtherNameserversAlongWithExpectedNameservers: boolean;
  /**
   * True if the nameservers are using all the expected nameservers, ie; nameservers array includes all the expected nameservers
   */
  isUsingAllExpectedNameservers: boolean;
  /**
   * The nameservers that are used but not in the expected nameservers
   */
  usedNameserversNotInExpected: Set<Nameserver>;
  /**
   * The nameservers that are not used but are in the expected nameservers
   */
  unusedExpectedNameservers: Set<Nameserver>;
  /**
   * The nameservers that are in both the nameservers and expected nameservers
   * if isExactMatch is true or isUsingAllExpectedNameservers is true, this will be the same as expectedNameservers
   * if isCompleteMismatch is true, this will be an empty set
   */
  intersection: Set<Nameserver>;
  /**
   * The nameservers that are in the nameservers but not in the expected nameservers
   * if isExactMatch is true, this will be an empty set
   * if isCompleteMismatch is true, this will be the same as nameservers
   */
  difference: Set<Nameserver>;
};

/**
 * Compares nameservers to expected nameservers
 * @param nameservers - The nameservers to compare
 * @param expectedNameservers - The expected nameservers
 * @returns {NameserversComparisonResult} - The comparison result
 */
export function compareNameservers(
  nameservers: Nameserver[],
  expectedNameservers: Nameserver[],
) {
  const usedNameserversNotInExpected = new Set(nameservers);
  const unusedExpectedNameservers = new Set(expectedNameservers);

  // Initialize sets for the intersection and difference
  const intersection = new Set<Nameserver>();
  const difference = new Set<Nameserver>();

  // Find the intersection of the nameservers and expected nameservers
  expectedNameservers.forEach((ns) => {
    if (usedNameserversNotInExpected.has(ns)) {
      usedNameserversNotInExpected.delete(ns);
      unusedExpectedNameservers.delete(ns);
      intersection.add(ns);
    } else {
      difference.add(ns);
    }
  });

  usedNameserversNotInExpected.forEach((ns) => {
    difference.add(ns);
  });

  const isUsingAllExpectedNameservers = unusedExpectedNameservers.size === 0;
  const isUsingOtherNameserversAlongWithExpectedNameservers =
    isUsingAllExpectedNameservers && usedNameserversNotInExpected.size > 0;

  const isExactMatch = difference.size === 0;
  const isCompleteMismatch = intersection.size === 0;

  return {
    isExactMatch,
    isCompleteMismatch,
    isUsingOtherNameserversAlongWithExpectedNameservers,
    isUsingAllExpectedNameservers,
    usedNameserversNotInExpected,
    unusedExpectedNameservers,
    intersection,
    difference,
  };
}

/**
 * Checks if a domain is using the Namefi Astra nameservers
 * @param nameservers - The nameservers to check
 * @returns {boolean} - True if the domain is using the Namefi Astra nameservers, false otherwise
 */
export const checkIfNameserversAreNamefiNameservers = (
  nameservers: Nameserver[],
): boolean => {
  const comparisonResult = compareNameservers(
    nameservers,
    config.NAMEFI_ASTRA_NAMESERVERS,
  );
  return comparisonResult.isExactMatch;
};
/**
 *  executes the checkIfNameserversAreNamefiNameservers activity
 *  temporal requires activities to be async
 */
export const checkIfNameserversAreNamefiNameserversActivity = async (
  nameservers: Nameserver[],
): Promise<boolean> => {
  return checkIfNameserversAreNamefiNameservers(nameservers);
};

/**
 * Checks if a domain is using the legacy Namefi nameservers
 * @param nameservers - The nameservers to check
 * @returns {boolean} - True if the domain is using the legacy Namefi nameservers, false otherwise
 */
export const checkIfNameserversAreLegacyNamefiNameservers = (
  nameservers: Nameserver[],
): boolean => {
  const comparisonResult = compareNameservers(nameservers, [
    toPunycodeFqdn('ns1.namefi.io.'),
    toPunycodeFqdn('ns2.namefi.io.'),
  ]);
  return comparisonResult.isUsingAllExpectedNameservers; // TODO: decide if we want to use the isExactMatch or the isUsingAllExpectedNameservers
};

/**
 * Checks if a domain is using the Namefi Astra nameservers
 * @param normalizedDomainName - The normalized domain name to check
 * @returns {Promise<boolean>} - True if the domain is using the Namefi Astra nameservers, false otherwise
 */
export const checkIfUsingNamefiNameservers = async (
  normalizedDomainName: NamefiNormalizedDomain,
) => {
  const nameservers = await sldRegistrar.getNameServers(
    toPunycodeDomainName(normalizedDomainName),
  );
  return checkIfNameserversAreNamefiNameservers(nameservers);
  // TODO: if there's an advanced user that wants to use fallback nameservers, we should return comparisonResult.isUsingAllExpectedNameservers
};

/**
 * Checks if a domain is using the legacy Namefi nameservers
 * @param normalizedDomainName - The normalized domain name to check
 * @returns {Promise<boolean>} - True if the domain is using the legacy Namefi nameservers, false otherwise
 */
export const checkIfUsingLegacyNamefiNameservers = async (
  normalizedDomainName: NamefiNormalizedDomain,
) => {
  const nameservers = await sldRegistrar.getNameServers(
    toPunycodeDomainName(normalizedDomainName),
  );

  return checkIfNameserversAreLegacyNamefiNameservers(nameservers);
};

/**
 * Retrieves current nameservers for a domain
 * @param {string} domain - e.g. "example.com"
 * @returns {Promise<string[]>} - Array of nameservers for the domain
 */
export async function getPropagatedNameservers(
  domain: PunycodeDomainName,
): Promise<PunycodeFqdn[]> {
  try {
    _logger.debug(`Querying NS records for domain "${domain}"...`);

    // Query nameservers directly for the domain
    const foundNameservers = (await resolveNs(domain)).map(toPunycodeFqdn);

    _logger.debug(
      {
        domain,
        foundNameservers,
      },
      `Found ${foundNameservers.length} NS records for "${domain}"`,
    );

    // Format nameservers with trailing dots
    return foundNameservers;
  } catch (error: any) {
    _logger.error(
      `Failed to get nameservers for "${domain}": ${error.message}`,
    );
    throw error;
  }
}

/**
 * Retrieves the default nameservers for Namefi Astra
 * @returns {Nameserver[]} - Array of default nameservers
 */
export function getDefaultNameservers(): Promise<Nameserver[]> {
  return Promise.resolve(config.NAMEFI_ASTRA_NAMESERVERS);
}

export type DomainNameserversIndexResult = {
  nameservers: Nameserver[];
  isUsingNamefiNameservers: boolean;
  lastUpdatedAt: Date;
};

export async function getDomainNameserversFromIndex(
  normalizedDomainName: NamefiNormalizedDomain,
  options?: { maxAgeInHours?: number },
): Promise<DomainNameserversIndexResult | null> {
  const maxAgeInHours = options?.maxAgeInHours;

  const record = await db.query.indexedDomainsTable.findFirst({
    columns: {
      nameservers: true,
      nameserversLastUpdatedAt: true,
      lastIndexedAt: true,
      isUsingNamefiNameservers: true,
    },
    where: (table, { eq }) =>
      eq(table.normalizedDomainName, normalizedDomainName),
  });

  if (!record || record.nameservers.length === 0) {
    return null;
  }

  const lastUpdatedAt =
    record.nameserversLastUpdatedAt ?? record.lastIndexedAt ?? null;

  if (
    maxAgeInHours &&
    (!lastUpdatedAt ||
      isBefore(lastUpdatedAt, subHours(new Date(), maxAgeInHours)))
  ) {
    return null;
  }

  return {
    nameservers: record.nameservers as Nameserver[],
    isUsingNamefiNameservers: record.isUsingNamefiNameservers,
    lastUpdatedAt,
  };
}

/**
 * TODO support 3ld domains
 * Sets the nameservers for a domain
 * @param domainName - The domain name to set the nameservers for
 * @param nameservers - The nameservers to set for the domain
 */
export async function setNameserversForDomain({
  domainName,
  nameservers,
}: {
  domainName: PunycodeDomainName;
  nameservers: Nameserver[];
}) {
  const domain = toPunycodeDomainName(domainName);
  const punycodeNameservers = nameservers.map((nameserver) =>
    toPunycodeFqdn(nameserver),
  );
  return await sldRegistrar.setNameServers(domain, punycodeNameservers);
}

/**
 * TODO support 3ld domains
 * Retrieves the nameservers for a domain
 * @param domainName - The domain name to get the nameservers for
 * @returns The nameservers for the domain
 */
export async function getNameserversForDomain(domainName: PunycodeDomainName) {
  const registrarNameservers = await sldRegistrar.getNameServers(domainName);
  return registrarNameservers;
}

/**
 * Submits a reset nameservers workflow for a domain
 * @param domainName - The domain name to submit the reset nameservers workflow for
 */
export async function submitResetNameserversWorkflow(
  domainName: PunycodeDomainName,
) {
  const workflowInput = {
    domainName: toPunycodeDomainName(domainName),
  };
  const workflowId = resetNameserversWorkflow.generateId({
    domainName,
  });
  await temporalClient.workflow.start(resetNameserversWorkflow, {
    args: [workflowInput],
    workflowId,
    taskQueue: TEMPORAL_QUEUES.DOMAINS,
    workflowIdReusePolicy: 'ALLOW_DUPLICATE',
    workflowIdConflictPolicy: 'USE_EXISTING',
  });
}

/**
 * Submits a nameservers change workflow for a domain
 * @param domainName - The domain name to submit the nameservers change workflow for
 * @param nameservers - The nameservers to set for the domain
 */
export async function submitNameserversChangeWorkflow(
  domainName: PunycodeDomainName,
  nameservers: Nameserver[],
) {
  const workflowInput: ChangeNameserversWorkflowInput = {
    domainName: toPunycodeDomainName(domainName),
    nameservers: nameservers.map((nameserver) => toPunycodeFqdn(nameserver)),
  };
  const workflowId = changeNameserversWorkflow.generateId(workflowInput);
  await temporalClient.workflow.start(changeNameserversWorkflow, {
    args: [workflowInput],
    workflowId,
    taskQueue: TEMPORAL_QUEUES.DOMAINS,
    workflowIdReusePolicy: 'ALLOW_DUPLICATE',
    workflowIdConflictPolicy: 'FAIL',
  });
}

/**
 * Queries the active nameservers change workflow for a domain
 * @param domainName - The domain name to query the active nameservers change workflow for
 * @returns {Promise<{operation: 'CHANGE_NAMESERVERS' | 'RESET_NAMESERVERS', workflowId: string, runId: string, workflowType: string, status: string} | null>} - The active nameservers change workflow for the domain
 */
export async function queryActiveNameserversChangeWorkflow(
  domainName: PunycodeDomainName,
) {
  const changeNsId = changeNameserversWorkflow.generateId({
    domainName,
    nameservers: [],
  });
  const resetNsId = resetNameserversWorkflow.generateId({ domainName });
  const workflows = await temporalClient.workflow.list({
    query: `TaskQueue = '${TEMPORAL_QUEUES.DOMAINS}' AND ExecutionStatus = 'Running' AND (WorkflowId = '${changeNsId}' OR WorkflowId = '${resetNsId}')`,
  });

  for await (const workflow of workflows) {
    const status = await workflow.status;
    if (status.name === 'RUNNING') {
      return {
        operation: workflow.workflowId.includes('change-nameservers')
          ? 'CHANGE_NAMESERVERS'
          : 'RESET_NAMESERVERS',
        workflowId: workflow.workflowId,
        runId: workflow.runId,
        workflowType: workflow.type,
        status: status.name,
      };
    }
  }
  return null;
}
