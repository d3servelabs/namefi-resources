import {
  type ContactEntity,
  DomainContactPrivacyEnum,
  type DomainContacts,
} from '@namefi-astra/registrars/data/types/index';
import { OperationStatus } from '@namefi-astra/registrars/data/types/operation-status';
import { RenewOption } from '@namefi-astra/registrars/data/types/renew-option';
import type { LongRunningOperationResult } from '@namefi-astra/registrars/abstract-registrar/types';
import {
  type PunycodeDomainName,
  toPunycodeDomainName,
} from '@namefi-astra/registrars/data/validations';
import { Registrars } from '@namefi-astra/registrars/registrars-keys';
import {
  type NamefiNormalizedDomain,
  matchAny,
  resolve,
  EppStatuses,
} from '@namefi-astra/utils';
import { ApplicationFailure, Context } from '@temporalio/activity';
import * as workflow from '@temporalio/workflow';
import { addYears, isSameDay } from 'date-fns';
import { decryptEppAuthCode } from '#lib/epp-code-encryption';
import { logger } from '#lib/logger';
import { sldRegistrar } from '#lib/namefi-registry';
import { RDAP } from '@namefi-astra/registrars/rdap-whois/rdap_client';
import { WhoisClient } from '@namefi-astra/registrars/rdap-whois/whois_client';
import { camelCase, noCase } from 'change-case';
import { config } from '#lib/env';
import {
  CENTRALNIC_OTE_TLDS,
  getCentralnicRegistrar,
} from '#lib/epp-registrars/centralnic';

/**
 * Poll the removal status of the DS record
 * @param input - The input object containing the registrar operation ID and domain name
 * @returns {Promise<OperationStatus>} - The operation status
 */
export async function pollRegistrarOperationStatus({
  registrarOperationId,
  domainName,
}: {
  registrarOperationId: string;
  domainName: PunycodeDomainName;
}): Promise<OperationStatus> {
  const lrOperation = await sldRegistrar.getOperationStatus(
    domainName,
    registrarOperationId,
  );
  switch (lrOperation.status) {
    case 'SUBMITTED':
    case 'IN_PROGRESS':
      throw new Error('Still IN_PROGRESS');
    default:
      return lrOperation.status;
  }
}

export async function getDomainDetails(domainName: PunycodeDomainName) {
  return await sldRegistrar.getDomainDetails(domainName);
}

/**
 * Transfers or registers a domain with the specified registrar provider.
 * Determines the operation type based on the input parameter and performs
 * the necessary actions to either transfer ownership of a domain or
 * register a new one.
 *
 * @param {string} operationType - The operation to perform. Either 'REGISTER', 'IMPORT', etc.
 * @param {Object} params - The parameters required for the operation.
 * @param {string} params.domain - The domain name to be transferred or registered.
 * @param {number} params.duration - The duration (in years) for domain registration.
 * @param {DomainContacts} params.domainContacts - Contact details for the domain owner.
 * @param {Providers} params.provider - The registrar provider to handle the operation.
 * @param {string} [params.authorizationCode] - The authorization code required for transferring a domain (optional).
 *
 * @return {Promise<LongRunningOperationResult>} A promise that resolves with the result of the long-running domain transfer or registration operation.
 */
export async function sendRegisterOrImportRequestToNamefiRegistrar(
  operationType: 'REGISTER' | 'IMPORT',
  {
    normalizedDomainName,
    durationInYears,
    registrarKey,
    encryptionKeyId,
    encryptedEppAuthorizationCode,
  }: {
    normalizedDomainName: NamefiNormalizedDomain;
    durationInYears: number;
    registrarKey: Registrars;
    encryptionKeyId?: string | null;
    encryptedEppAuthorizationCode?: string | null;
  },
): Promise<LongRunningOperationResult> {
  const isImport = operationType === 'IMPORT';

  const _domainNameLdh = toPunycodeDomainName(normalizedDomainName);

  const contacts: DomainContacts = {
    registrantContact: DEFAULT_CONTACT(
      _domainNameLdh,
      'registrant',
    ) as ContactEntity,
    adminContact: DEFAULT_CONTACT(_domainNameLdh, 'admin'),
    technicalContact: DEFAULT_CONTACT(_domainNameLdh, 'tech'),
    billingContact: DEFAULT_CONTACT(_domainNameLdh, 'tech'),
  };

  let authCode: string | null = null;
  if (isImport) {
    if (!(encryptedEppAuthorizationCode && encryptionKeyId)) {
      throw new Error(
        'EPP authorization code is required for import operations',
      );
    }
    authCode = await decryptEppAuthCode(
      encryptedEppAuthorizationCode,
      encryptionKeyId,
    );
    return sldRegistrar.transferDomain({
      domainName: _domainNameLdh as PunycodeDomainName,
      contacts,
      privacy: DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA,
      registrarKey,
      authCode,
      nameservers: [],
    });
  }
  return sldRegistrar.registerDomain({
    domainName: _domainNameLdh,
    contacts,
    privacy: DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA,
    registrarKey,
    durationInYears,
    renewOption: RenewOption.MANUAL,
  });
}

export async function resubmitImportDomainRequestToNamefiRegistrar({
  normalizedDomainName,
  registrarKey,
  encryptionKeyId,
  encryptedEppAuthorizationCode,
}: {
  normalizedDomainName: NamefiNormalizedDomain;
  registrarKey: Registrars;
  encryptionKeyId?: string | null;
  encryptedEppAuthorizationCode?: string | null;
}): Promise<LongRunningOperationResult> {
  if (!(encryptedEppAuthorizationCode && encryptionKeyId)) {
    throw new Error('EPP authorization code is required for import operations');
  }

  const domainName = toPunycodeDomainName(normalizedDomainName);
  const authCode = await decryptEppAuthCode(
    encryptedEppAuthorizationCode,
    encryptionKeyId,
  );

  const contacts: DomainContacts = {
    registrantContact: DEFAULT_CONTACT(
      domainName,
      'registrant',
    ) as ContactEntity,
    adminContact: DEFAULT_CONTACT(domainName, 'admin'),
    technicalContact: DEFAULT_CONTACT(domainName, 'tech'),
    billingContact: DEFAULT_CONTACT(domainName, 'tech'),
  };

  return sldRegistrar.resubmitImportDomainRequest(
    {
      domainName: domainName as PunycodeDomainName,
      contacts,
      privacy: DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA,
      authCode,
      nameservers: [],
    },
    { overrideRegistrar: registrarKey },
  );
}

export async function cancelImportDomainRequestToNamefiRegistrar({
  normalizedDomainName,
  registrarKey,
}: {
  normalizedDomainName: NamefiNormalizedDomain;
  registrarKey: Registrars;
}): Promise<LongRunningOperationResult> {
  const domainName = toPunycodeDomainName(normalizedDomainName);
  return sldRegistrar.cancelImportDomainRequest(
    {
      domainName: domainName as PunycodeDomainName,
    },
    { overrideRegistrar: registrarKey },
  );
}

export async function pollRegisterOrImportDomainOperationStatus(
  normalizedDomainName: NamefiNormalizedDomain,
  registrarOperationId: string,
  registrarKey: Registrars,
): Promise<LongRunningOperationResult> {
  const ctx = Context.current();
  const domainName = toPunycodeDomainName(normalizedDomainName);

  ctx.log.info(
    `checkRegisterOrImportDomainOperationStatus - operationId: ${registrarOperationId}`,
  );

  const response = await sldRegistrar.getOperationStatus(
    domainName,
    registrarOperationId,
    { overrideRegistrar: registrarKey },
  );

  if (
    matchAny(
      response.status,
      OperationStatus.IN_PROGRESS,
      OperationStatus.SUBMITTED,
    )
  ) {
    throw new Error(`Operation status is ${response.status}`); // If the operation is still in progress, Temporal will retry the activity
  }

  return response; // If the operation is done (or status is unknown), Temporal will complete the activity
}

const ALLOW_EMAIL_LABELS = false;

export const DEFAULT_CONTACT = (
  _domain?: string,
  contactType: 'registrant' | 'admin' | 'tech' = 'registrant',
) => {
  const domain = ALLOW_EMAIL_LABELS ? _domain : undefined;
  return {
    countryCode: 'US',
    email: domain
      ? `whois-privacy+${domain}@namefi.io`
      : 'whois-privacy@namefi.io',
    city: 'Sunnyvale',
    organizationName: 'Namefi by D3Serve Labs',
    addressLines: ['1111 W EL CAMINO REAL', 'STE133x178 att D3ServeLabs'],
    fax: '+1.6503365691',
    phoneNumber: '+1.6503365691',
    zipCode: '94087',
    state: 'CA',
    firstName: 'Namefi',
    lastName: 'WHOIS Privacy',
    contactType: 'COMPANY',
    extraParams: [],
  };
};

/**
 * Checks the status of EPP extend registration operations
 * This is used for polling until extending operation finishes
 * @param {Object} params - The parameters object
 * @param {string} params.operationId - Operation identifier to check
 * @returns {Promise<{status: OperationStatus}>} Operation status
 */
export async function pollEppExtendRegistrationStatus({
  normalizedDomainName,
  externalOperationId,
}: {
  normalizedDomainName: NamefiNormalizedDomain;
  externalOperationId: string;
}) {
  const domainName = toPunycodeDomainName(normalizedDomainName);
  const { status } = await sldRegistrar.getOperationStatus(
    domainName,
    externalOperationId,
  );

  switch (status) {
    case OperationStatus.ERROR:
    case OperationStatus.FAILED:
    case OperationStatus.SUCCESSFUL:
      return { status };
    default:
      throw new Error('Still in progress');
  }
}

/**
 * Gets the expiration time in seconds for a domain from registrar side
 * @param {Object} params - The parameters object
 * @param {string} params.domainNameLdh - The domain name in LDH format
 * @returns {Promise<number>} Expiration time in seconds
 */
export async function getEppExpirationTime({
  normalizedDomainName,
}: {
  normalizedDomainName: NamefiNormalizedDomain;
}): Promise<Date> {
  const domainName = toPunycodeDomainName(normalizedDomainName);
  const registration = await sldRegistrar.getDomainDetails(domainName);
  return new Date(registration.expirationTime);
}

/**
 * Submits an operation to extend domain registration to the registrar
 * Ideally You should have an existing operation in the database to avoid replays
 * @param {Object} params - The parameters object
 * @param {string} params.domainNameLdh - The domain name in LDH format
 * @param {number} params.durationInYears - Duration to extend registration in years
 * @returns {Promise<any>} Registrar operation response
 */
export async function submitOperationToExtendRegistrationToRegistrar({
  normalizedDomainName,
  durationInYears,
}: {
  normalizedDomainName: NamefiNormalizedDomain;
  durationInYears: number;
}) {
  const domainName = toPunycodeDomainName(normalizedDomainName);
  if (durationInYears <= 0 || !Number.isInteger(durationInYears)) {
    throw new Error('Invalid duration');
  }

  const registration = await sldRegistrar.getDomainDetails(domainName);
  const currentExpirationDate = new Date(registration.expirationTime);

  logger.debug(`Submitting Request to renew domain ${domainName}`);

  const renewReq = await resolve(
    sldRegistrar.renewDomain({
      domainName,
      durationInYears,
      currentExpirationDate,
    }),
  );

  if (
    renewReq.failed ||
    !matchAny(
      renewReq.result.status,
      OperationStatus.IN_PROGRESS,
      OperationStatus.SUBMITTED,
      OperationStatus.SUCCESSFUL,
    )
  ) {
    logger.error('Error Renew Operation Failed Registrar Level');
    throw workflow.ApplicationFailure.create({
      details: [{ renewReq }],
      message: 'Failed to renew',
      nonRetryable: false,
    });
  }

  logger.debug('Renew Operation Succeeded Registrar Level');
  return renewReq.result;
}

/**
 * Polls the EPP expiration time until it changes to a new date.
 *
 * @param normalizedDomainName - The domain name in LDH format.
 * @param durationInYears - The number of years to extend the registration.
 * @param previousExpirationTime - The previous expiration time.
 */
export async function pollAndExpectExpirationChange({
  normalizedDomainName,
  durationInYears,
  previousExpirationTime,
}: {
  normalizedDomainName: NamefiNormalizedDomain;
  durationInYears: number;
  previousExpirationTime: Date;
}) {
  const expectedExpirationTime = addYears(
    previousExpirationTime,
    durationInYears,
  );
  const newExpirationTime = await getEppExpirationTime({
    normalizedDomainName,
  });
  if (!isSameDay(newExpirationTime, expectedExpirationTime)) {
    throw workflow.ApplicationFailure.create({
      message: 'Still in progress',
      details: [{ newExpirationTime, expectedExpirationTime }],
      nonRetryable: false,
    });
  }
  return new Date(newExpirationTime).toISOString(); // Returning a string to force the caller to parse date, since it could be affected by serialization
}

export const listAllDomains = async (
  ...args: Parameters<typeof sldRegistrar.listAllDomains>
) => sldRegistrar.listAllDomains(...args);

export async function lockEppDomain(
  domainNameLdh: PunycodeDomainName,
): Promise<{
  status: OperationStatus;
  operationId: string | null | undefined;
}> {
  const res = await sldRegistrar.setDomainLockState(domainNameLdh, true);
  return {
    status: res.status,
    operationId: res.operationId,
  };
}

export async function unlockEppDomain(
  domainNameLdh: PunycodeDomainName,
): Promise<{
  status: OperationStatus;
  operationId: string | null | undefined;
}> {
  try {
    logger.debug(`Unlocking EPP domain: ${domainNameLdh}`);
    const res = await sldRegistrar.setDomainLockState(domainNameLdh, false);
    logger.debug(`Unlocked EPP domain: ${domainNameLdh}`);
    return {
      status: res.status,
      operationId: res.operationId,
    };
  } catch (error: any) {
    logger.error(
      `Error unlocking EPP domain: ${domainNameLdh}: ${error.message}`,
      error.stack,
    );
    throw error;
  }
}

/**
 * Get the EPP lock state for a domain
 *
 * @param domainNameLdh - The domain name to get the EPP lock state for
 * @returns Promise<GetLockStateResponse> The EPP lock state for the domain
 */
export async function getEppLockState(
  domainNameLdh: PunycodeDomainName | NamefiNormalizedDomain,
): Promise<GetLockStateResponse> {
  logger.debug(`Getting EPP lock state for domain: ${domainNameLdh}`);

  const getFromPublic = async (): Promise<
    [Error | null, GetLockStateResponse | null]
  > => {
    const [error, res] = await resolve(
      _getLockStateFromRdapAndWhois(domainNameLdh),
    );
    if (res && !error) {
      logger.trace(
        `Retrieved EPP lock state for domain: ${domainNameLdh}, locked: ${res}`,
      );

      return [null, res];
    }

    logger.trace(
      `Error getting EPP lock state for domain: ${domainNameLdh}: ${error.message}`,
      error.stack,
    );
    return [error, null];
  };

  const getFromRegistrar = async (): Promise<
    [Error | null, GetLockStateResponse | null]
  > => {
    const [_error, status] = await resolve(
      sldRegistrar.getDomainStatus(toPunycodeDomainName(domainNameLdh)),
    );
    if (_error || !status) {
      logger.trace(
        `Error getting domain status for domain: ${domainNameLdh}: ${_error.message}`,
        _error.stack,
      );
      return [_error, null];
    }
    const eppStatusRdap = status.map((s) => {
      const trimmedSnakeCase = s.trim().replaceAll(/\s+/g, '_');
      const trimmedSnakeCaseLower = trimmedSnakeCase.includes('_')
        ? trimmedSnakeCase.toLowerCase()
        : trimmedSnakeCase;

      return noCase(camelCase(trimmedSnakeCaseLower));
    });

    const result: GetLockStateResponse = {
      isAddPeriod: eppStatusRdap.some((status) =>
        status.includes('add period'),
      ),
      isTransferPeriod: eppStatusRdap.some((status) =>
        status.includes('transfer period'),
      ),
      locked: eppStatusRdap.some((status) =>
        status.includes('transfer prohibited'),
      ),
      status: eppStatusRdap,
    };
    return [null, result];
  };

  /**
   * Determines the order of calls to get EPP lock state based on the configuration.
   * If CENTRALNIC_KEY is not nil, it will prioritize getting the lock state from the registrar.
   */
  const centralNicSandboxEnabled = [
    Registrars.CentralNic_OTE_01,
    Registrars.CentralNic_OTE_02,
  ].includes(config.CENTRALNIC_KEY as any);
  const awayRegistrar = [
    Registrars.CentralNic_OTE_01,
    Registrars.CentralNic_OTE_02,
  ].find((registrar) => registrar !== config.CENTRALNIC_KEY);

  const getFromAwaySandboxRegistrar = async (): Promise<
    [Error | null, GetLockStateResponse | null]
  > => {
    if (!awayRegistrar) return [Error('Away Registrar not setup'), null];
    const registrar = getCentralnicRegistrar(awayRegistrar, undefined);
    const [_error, status] = await resolve(
      registrar.getDomainStatus(toPunycodeDomainName(domainNameLdh)),
    );
    if (_error || !status) {
      logger.trace(
        `Error getting domain status for domain: ${domainNameLdh}: ${_error.message}`,
        _error.stack,
      );
      return [_error, null];
    }
    const eppStatusRdap = status.map((s) => {
      const trimmedSnakeCase = s.trim().replaceAll(/\s+/g, '_');
      const trimmedSnakeCaseLower = trimmedSnakeCase.includes('_')
        ? trimmedSnakeCase.toLowerCase()
        : trimmedSnakeCase;

      return noCase(camelCase(trimmedSnakeCaseLower));
    });

    const result: GetLockStateResponse = {
      isAddPeriod: eppStatusRdap.some((status) =>
        status.includes('add period'),
      ),
      isTransferPeriod: eppStatusRdap.some((status) =>
        status.includes('transfer period'),
      ),
      locked: eppStatusRdap.some((status) =>
        status.includes('transfer prohibited'),
      ),
      status: eppStatusRdap,
    };
    return [null, result];
  };

  const orderedCalls = centralNicSandboxEnabled
    ? [getFromAwaySandboxRegistrar, getFromRegistrar]
    : [getFromPublic, getFromRegistrar];

  for (let i = 0; i < orderedCalls.length; i++) {
    const [error, result] = await orderedCalls[i]();
    if (result) {
      const status = EppStatuses.fromArrayOrThrow(result.status);
      return {
        isAddPeriod: status.hasStatus('add period'),
        isTransferPeriod: status.hasStatus('transfer period'),
        locked: status.hasClientOrServerStatus('transfer prohibited'),
        status: status.getRdapStatuses(),
      };
    }
    if (error && i === orderedCalls.length - 1) {
      throw error;
    }
  }
  throw new ApplicationFailure('Not found');
}

export async function pollAndExpectEppLockStateChange(
  domainNameLdh: PunycodeDomainName | NamefiNormalizedDomain,
  newLockState: { locked: boolean },
): Promise<GetLockStateResponse> {
  const res = await getEppLockState(domainNameLdh);
  if (res.locked !== newLockState.locked) {
    throw workflow.ApplicationFailure.create({
      message: `EPP lock is still ${res.locked ? 'locked' : 'unlocked'}`,
      details: [{ res }],
      nonRetryable: false,
    });
  }
  return res;
}

export type GetLockStateResponse = {
  locked: boolean;
  isAddPeriod: boolean;
  isTransferPeriod: boolean;
  status: string[];
};
const USE_MOCK_REGISTRARS = false;

async function _getLockStateFromRdapAndWhois(
  domain: string,
): Promise<GetLockStateResponse> {
  if (USE_MOCK_REGISTRARS) {
    return {
      locked: false,
      isAddPeriod: false,
      isTransferPeriod: false,
      status: [],
    };
  }
  let res: GetLockStateResponse | null = null;
  const errors: {
    rdapError?: string;
    whoisError?: string;
  } = {};

  const [rdapError, rdapRes] = await resolve(RDAP.getLockState(domain));

  if (rdapError) {
    errors.rdapError = rdapError.message;
    logger.trace(`getLockState: RDAP failed ${rdapError}`);
  }

  if (rdapRes) {
    res = {
      locked: rdapRes.locked,
      isAddPeriod: rdapRes.isAddPeriod ?? false,
      isTransferPeriod: rdapRes.isTransferPeriod ?? false,
      status: rdapRes.status ?? [],
    };
  }

  if (!res) {
    const [whoisError, whoisRes] = await resolve(
      WhoisClient.getLockState(domain),
    );
    if (whoisError) {
      errors.whoisError = whoisError.message;
      logger.trace(`getLockState: WHOIS failed ${whoisError}`);
    }
    if (whoisRes) {
      res = {
        locked: whoisRes.locked,
        isAddPeriod: whoisRes.isAddPeriod ?? false,
        isTransferPeriod: whoisRes.isTransferPeriod ?? false,
        status: whoisRes.status ?? [],
      };
    }
  }

  if (!res) {
    throw workflow.ApplicationFailure.create({
      message: 'could not get lock state',
      details: [{ errors }],
      nonRetryable: false,
    });
  }
  return res;
}
