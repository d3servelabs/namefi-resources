import {
  type ContactEntity,
  DomainContactPrivacyEnum,
  type DomainContacts,
} from '@namefi-astra/registrars/lib/abstract-registrar/data/index';
import { OperationStatus } from '@namefi-astra/registrars/lib/abstract-registrar/data/operation-status';
import { RenewOption } from '@namefi-astra/registrars/lib/abstract-registrar/data/renew-option';
import type { LongRunningOperationResult } from '@namefi-astra/registrars/lib/abstract-registrar/registrar-service';
import {
  type PunycodeDomainName,
  toPunycodeDomainName,
} from '@namefi-astra/registrars/lib/data/validations';
import type { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import {
  type NamefiNormalizedDomain,
  matchAny,
  resolve,
} from '@namefi-astra/utils';
import { Context } from '@temporalio/activity';
import * as workflow from '@temporalio/workflow';
import { addYears, isSameDay } from 'date-fns';
import { decryptEppAuthCode } from '#lib/epp-code-encryption';
import { logger } from '#lib/logger';
import { sldRegistrar } from '#lib/namefi-registry';

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

export async function pollRegisterOrImportDomainOperationStatus(
  normalizedDomainName: NamefiNormalizedDomain,
  registrarOperationId: string,
  registrarKey: Registrars,
): Promise<OperationStatus> {
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

  return response.status; // If the operation is done (or status is unknown), Temporal will complete the activity
}

const ALLOW_EMAIL_LABELS = false;

const DEFAULT_CONTACT = (
  _domain?: string,
  contactType: 'registrant' | 'admin' | 'tech' = 'registrant',
) => {
  const domain = ALLOW_EMAIL_LABELS ? _domain : undefined;
  return {
    countryCode: 'US',
    email: domain
      ? `dns-${contactType}-contact+${domain}@d3bridge.xyz`
      : `dns-${contactType}-contact@d3bridge.xyz`,
    city: 'Sunnyvale',
    organizationName: 'D3Serve',
    addressLines: ['1111 W EL CAMINO REAL', 'STE133x178 att D3ServeLabs'],
    fax: '+1.6503365691',
    phoneNumber: '+1.6503365691',
    zipCode: '94087',
    state: 'CA',
    firstName: 'D3Bridge',
    lastName: 'Domains',
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

  logger.info(`Submitting Request to renew domain ${domainName}`);

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

  logger.info('Renew Operation Succeeded Registrar Level');
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
