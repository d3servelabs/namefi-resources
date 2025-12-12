import { exec } from 'node:child_process';
import { resolveNs } from 'node:dns/promises';
import util from 'node:util';
import { promisify } from 'node:util';
import { db, domainConfigTable } from '@namefi-astra/db';
import { computeDsDigest, parseDnskeyRecord } from '@namefi-astra/dns-tools';
import {
  type DnssecAlgorithms,
  DnssecDigestType,
  DnssecFlags,
  type DnssecKey,
} from '@namefi-astra/registrars/lib/abstract-registrar/data/dnssec';
import {
  type PunycodeDomainName,
  toPunycodeFqdn,
} from '@namefi-astra/registrars/lib/data/validations';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { WorkflowIdReusePolicy } from '@temporalio/common';
import { TRPCError } from '@trpc/server';
import { isEmpty, isNil, isNotEmpty, isNotNil } from 'ramda';
import { parse as tldtsParse } from 'tldts';
import { z } from 'zod';
import { config } from '#lib/env';
import { createLogger } from '#lib/logger';
import {
  getPoweredByNamefi3PDomains,
  sldRegistrar,
} from '#lib/namefi-registry';
import { temporalClient } from '../../temporal/client';
import { TEMPORAL_QUEUES } from '../../temporal/shared';
import { disableDnssecWorkflow } from '../../temporal/workflows/disable-dnssec.workflow';
import { enableDnssecWorkflow } from '../../temporal/workflows/enable-dnssec.workflow';
import { checkIfNameserversAreNamefiNameservers } from './nameservers';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';

util.inspect.defaultOptions.depth = null;

const execAsync = promisify(exec);

const _logger = createLogger({ module: 'domains-dnssec' });

// #region Delegation Signer
export async function associateDelegationSigner(
  domainName: PunycodeDomainName,
  signingConfig: DnssecKey,
) {
  const key = await sldRegistrar.addDelegationSigner(domainName, {
    algorithm: signingConfig.algorithm,
    publicKey: signingConfig.publicKey,
    flags: signingConfig.flags,
    keyTag: signingConfig.keyTag,
    digestType: signingConfig.digestType,
    digest: signingConfig.digest,
  });

  return key;
}

export async function associateDelegationSignerWithDefaultKey(
  domainName: PunycodeDomainName,
) {
  const signingConfig = await getZoneDnssecSigningConfig(domainName);
  return sldRegistrar.addDelegationSigner(domainName, signingConfig);
}

export async function disassociateDelegationSigner(
  domainName: PunycodeDomainName,
  _keyId?: string,
) {
  let keyId = _keyId;
  if (!keyId) {
    const domain = await sldRegistrar.getDomainDetails(domainName);
    if (isNil(domain.dnssecKeys) || isEmpty(domain.dnssecKeys)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'no-associated-keys',
      });
    }
    keyId =
      domain.dnssecKeys[0].id ||
      domain.dnssecKeys[0].publicKey ||
      domain.dnssecKeys[0].keyTag?.toString();
  }

  if (isNil(keyId)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'could-not-find-key-id',
    });
  }
  return sldRegistrar.removeDelegationSigner(domainName, keyId);
}

export async function checkDelegationSignerAssociationChangeRequest({
  domainName,
  registrarOperationId,
}: {
  domainName: PunycodeDomainName;
  registrarOperationId: string;
}) {
  const lrOperation = await sldRegistrar.getOperationStatus(
    domainName,
    registrarOperationId,
  );
  return lrOperation.status;
}

// #endregion Delegation Signer

// #region Zone DNSSEC

/**
 * Get the zone signing flag for a domain
 * @param domainName - The domain name to get the zone signing flag for
 * @returns {Promise<boolean>} - true if the zone signing flag is enabled, false otherwise
 */
export async function getZoneSigningFlag(
  domainName: PunycodeDomainName,
): Promise<boolean> {
  const normalizedDomainName = namefiNormalizedDomainSchema.parse(domainName);
  const config = await db.query.domainConfigTable.findFirst({
    where: (config, { eq }) =>
      eq(config.normalizedDomainName, normalizedDomainName),
  });
  return config?.dnssecEnabled ?? false;
}

/**
 * Set the zone signing flag for a domain
 * @param domainName - The domain name to set the zone signing flag for
 * @param enable - true if the zone signing flag should be enabled, false otherwise
 */
export async function setZoneSigningFlag(
  domainName: PunycodeDomainName,
  enable: boolean,
) {
  const normalizedDomainName = namefiNormalizedDomainSchema.parse(domainName);
  await db
    .insert(domainConfigTable)
    .values({
      normalizedDomainName,
      dnssecEnabled: enable,
    })
    .onConflictDoUpdate({
      target: [domainConfigTable.normalizedDomainName],
      set: {
        dnssecEnabled: enable,
      },
    });
}

/**
 * Get the zone DNSSEC signing config for a domain
 * @param domainName - The domain name to get the zone DNSSEC signing config for
 * @returns {Promise<DnssecKey>} - The zone DNSSEC signing config
 */
export async function getZoneDnssecSigningConfig(
  domainName: PunycodeDomainName,
): Promise<DnssecKey> {
  const dnskey = parseDnskeyRecord(config.DNSSEC_DNSKEY_PUBLIC_RECORD);
  const keyTag = config.DNSSEC_DNSKEY_KEY_TAG;

  const digest = computeDsDigest(
    domainName,
    dnskey.flags,
    dnskey.protocol,
    dnskey.algorithm,
    dnskey.publicKey,
    DnssecDigestType.SHA_256,
  );

  return {
    algorithm: dnskey.algorithm as DnssecAlgorithms,
    publicKey: dnskey.publicKey,
    flags: DnssecFlags.KSK,
    keyTag,
    digestType: DnssecDigestType.SHA_256,
    digest,
    keyData: dnskey,
  };
}
// #endregion Zone DNSSEC

// #region Auto DNSSEC

/**
 * Get the DNSSEC status details for a domain
 * @param domainName - The domain name to get the DNSSEC status details for
 * @returns {Promise<DnssecStatusDetails>} - The DNSSEC status details
 */
export async function getDnssecStatusDetails(domainName: PunycodeDomainName) {
  const parsedDomainName = parseDomainName(domainName);
  if (!parsedDomainName.valid) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid domain name',
    });
  }
  if (parsedDomainName.registryType === 'subdomain') {
    const allowedThirdPartyDomains = await getPoweredByNamefi3PDomains();
    if (
      !allowedThirdPartyDomains.includes(parsedDomainName.immediateParentDomain)
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'This domain is not supported',
      });
    }

    return {
      dnssecStatus: 'parent-zone-managed',
      supportsDnssec: true,
      hasDelegationSigner: true,
      isUsingNamefiDelegationSigner: true,
      zoneHasActiveDnssec: true,
      isUsingNamefiNameservers: true,
    };
  }

  const [details, isZoneSigningEnabled, zoneSigningConfig] = await Promise.all([
    sldRegistrar.getDomainDetails(domainName),
    getZoneSigningFlag(domainName),
    getZoneDnssecSigningConfig(domainName),
  ]);

  _logger.trace({ details, isZoneSigningEnabled });

  const hasDelegationSigner =
    isNotNil(details.dnssecKeys) && isNotEmpty(details.dnssecKeys);
  const isUsingNamefiDelegationSigner = details.dnssecKeys?.some(
    (key) =>
      key.keyTag === config.DNSSEC_DNSKEY_KEY_TAG &&
      key.flags === zoneSigningConfig.flags &&
      key.digestType === zoneSigningConfig.digestType &&
      key.digest?.toLowerCase() === zoneSigningConfig.digest?.toLowerCase(),
  );
  const isUsingNamefiNameservers = checkIfNameserversAreNamefiNameservers(
    details.nameservers,
  );

  return {
    dnssecStatus: 'zone-managed',
    supportsDnssec: details.supportsDnssec,
    hasDelegationSigner,
    delegationSigners: details.dnssecKeys,
    isUsingNamefiDelegationSigner,
    zoneHasActiveDnssec: isZoneSigningEnabled,
    zoneSigningConfig,
    isUsingNamefiNameservers,
  };
}

/**
 * Enables DNSSEC for a domain using a provided KSK or by creating a new one.
 * is a simplified version of enableDnssecForDomain that doesn't track operations.
 * @param {string} domainName - The domain name to enable DNSSEC for
 * @param {DnssecKey} [ksk] - Optional Key Signing Key (KSK). If not provided, a new one will be created
 * @returns {Promise<any>} - Returns the result of associating the DS record
 */
export async function enableAutoDnssecForDomain(
  domainName: PunycodeDomainName,
  userId?: string,
) {
  _logger.assign({
    operation: 'ENABLE_DNSSEC',
    actor: userId ? `user:${userId}` : 'system',
    domainName,
  });

  _logger.debug(`Submitting Request to enable DNSSEC for domain ${domainName}`);

  try {
    const workflowInput = { domainName };
    await temporalClient.workflow.start(enableDnssecWorkflow, {
      taskQueue: TEMPORAL_QUEUES.DOMAINS,
      workflowId: enableDnssecWorkflow.generateId(workflowInput),
      workflowIdReusePolicy: WorkflowIdReusePolicy.ALLOW_DUPLICATE,
      args: [workflowInput],
    });

    _logger.debug('EnableDnssec Temporal Workflow Started Successfully');
  } catch (error) {
    _logger.fatal('EnableDnssec Temporal Workflow Start Failed');
    _logger.error({ error }, 'Temporal Error');
    throw error;
  }
}

/**
 * Enables DNSSEC for a domain using a provided KSK or by creating a new one.
 * is a simplified version of enableDnssecForDomain that doesn't track operations.
 * @param {string} domainName - The domain name to enable DNSSEC for
 * @param {DnssecKey} [ksk] - Optional Key Signing Key (KSK). If not provided, a new one will be created
 * @returns {Promise<any>} - Returns the result of associating the DS record
 */
export async function enableAutoDnssecForDomainImmediate(
  domainName: PunycodeDomainName,
) {
  //Add DS record to parent zone
  await associateDelegationSignerWithDefaultKey(domainName);
  await setZoneSigningFlag(domainName, true);
}

/**
 * Get active DNSSEC operation workflows
 * @param domainName - The domain name to get the active DNSSEC operation workflows for
 * @returns {Promise<boolean>} - true if there are active DNSSEC operation workflows, false otherwise
 */
export async function getActiveDnssecOperationWorkflows(
  domainName: PunycodeDomainName,
) {
  const enableWorkflowId = enableDnssecWorkflow.generateId({ domainName });
  const disableWorkflowId = disableDnssecWorkflow.generateId({ domainName });
  const workflows = await temporalClient.workflow.list({
    query: `TaskQueue = '${TEMPORAL_QUEUES.DOMAINS}' AND ExecutionStatus = 'Running' AND (WorkflowId = '${disableWorkflowId}' OR WorkflowId = '${enableWorkflowId}')`,
  });

  for await (const workflow of workflows) {
    const status = await workflow.status;
    if (status.name === 'RUNNING') {
      return {
        operation: (workflow.workflowId.includes('disable-dnssec')
          ? 'REMOVE_DNSSEC'
          : 'ENABLE_DNSSEC') as 'REMOVE_DNSSEC' | 'ENABLE_DNSSEC',
        workflowId: workflow.workflowId,
        runId: workflow.runId,
        workflowType: workflow.type,
        status: status.name,
      };
    }
  }
  return null;
}

/**
 * Disables DNSSEC for a domain
 * @param domainName - The domain name to disable DNSSEC for
 * @param userId - The user ID to associate with the operation
 * @returns {Promise<void>} - Returns the result of disabling DNSSEC
 */
export async function disableDnssecForDomain(
  domainName: PunycodeDomainName,
  userId?: string,
) {
  _logger.assign({
    operation: 'REMOVE_DNSSEC',
    actor: userId ? `user:${userId}` : 'system',
    domainName,
  });

  _logger.debug(
    `Submitting Request to disable DNSSEC for domain ${domainName}`,
  );

  try {
    const workflowInput = { domainName };
    await temporalClient.workflow.start(disableDnssecWorkflow, {
      taskQueue: TEMPORAL_QUEUES.DOMAINS,
      workflowId: disableDnssecWorkflow.generateId(workflowInput),
      workflowIdReusePolicy: WorkflowIdReusePolicy.ALLOW_DUPLICATE,
      args: [workflowInput],
    });

    _logger.debug('DisableDnssec Temporal Workflow Started Successfully');
  } catch (error) {
    _logger.fatal('DisableDnssec Temporal Workflow Start Failed');
    _logger.error('Temporal Error', error);
    throw error;
  }
}

// #endregion Auto DNSSEC

/**
 * Check if a domain has DS records published at its parent zone.
 * @param {string} domain - e.g. "example.com"
 * @returns {Promise<boolean>} - true if DS record exists, false otherwise
 */
export async function checkDsRecordExists(
  domain: PunycodeDomainName,
): Promise<boolean> {
  try {
    const parsed = tldtsParse(domain);

    if (isNil(parsed.domain) || isNil(parsed.publicSuffix)) {
      throw new Error(`Could not parse a valid public suffix for "${domain}".`);
    }

    const parentZone = parsed.publicSuffix;
    _logger.debug(
      `Parent zone of "${domain}" is "${parentZone}". Querying NS records...`,
    );

    // Get parent nameservers
    const parentNameservers = (await resolveNs(parentZone)).map(toPunycodeFqdn);

    if (isEmpty(parentNameservers)) {
      throw new Error(`No NS records found for parent zone "${parentZone}".`);
    }

    _logger.debug(
      {
        parentZone,
        parentNameservers,
      },
      `Found ${parentNameservers.length} NS records for "${parentZone}"`,
    );

    // Try each parent nameserver until we get a response
    for (const ns of parentNameservers) {
      const { stdout: dsOutput } = await execAsync(
        `dig @${ns} +noall +answer ${domain} DS`,
      );

      const answers = dsOutput.split('\n').filter((line) => line.trim() !== '');

      const parsedAnswers = answers.map(parseDnsAnswer);

      if (
        parsedAnswers.some((answer) => answer?.name === toPunycodeFqdn(domain))
      ) {
        return true;
      }
    }

    return false;
  } catch (error: any) {
    _logger.error(
      `Failed to check DS record for "${domain}": ${error.message}`,
    );
    throw error;
  }
}

const DnsAnswerSchema = z.object({
  name: z.string(),
  ttl: z.coerce.number(),
  type: z.string(),
  data: z.string(),
});
const DNS_RECORD_REGEX =
  /^(?<name>.*?)[\s\t]+(?<ttl>\d+?)[\s\t]+IN[\s\t]+(?<type>.*?)[\s\t]+(?<data>.*)$/;

/**
 * parse a string dns answer into a object
 * @param answer - the dns answer to parse
 * @returns the parsed answer
 */
function parseDnsAnswer(answer: string) {
  const parsedAnswer = DNS_RECORD_REGEX.exec(answer);
  if (!parsedAnswer) {
    return null;
  }
  const validatedAnswer = DnsAnswerSchema.parse(parsedAnswer.groups);

  return validatedAnswer;
}
