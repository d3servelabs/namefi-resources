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
import { R53Transformers } from '@namefi-astra/registrars/registrars/R53/transformers';
import type { Registrars } from '@namefi-astra/registrars/registrars/registrars-keys';
import { type NamefiNormalizedDomain, matchAny } from '@namefi-astra/utils';
import { Context } from '@temporalio/activity';
import { decryptEppAuthCode } from '#lib/epp-code-encryption';
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
    encryptionKeyId?: string;
    encryptedEppAuthorizationCode?: string;
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
      price: {
        price: 0,
        currency: 'USD',
      },
      contacts,
      privacy: DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA,
      registrarKey,
      authCode,
      nameservers: [],
    });
  }
  return sldRegistrar.registerDomain({
    domainName: _domainNameLdh,
    price: {
      price: 0,
      currency: 'USD',
    },
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
): Promise<OperationStatus> {
  const ctx = Context.current();
  const domainName = toPunycodeDomainName(normalizedDomainName);

  ctx.log.info(
    `checkRegisterOrImportDomainOperationStatus - operationId: ${registrarOperationId}`,
  );

  const response = await sldRegistrar.getOperationStatus(
    domainName,
    registrarOperationId,
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

  return R53Transformers.ContactTransformer.from({
    FirstName: 'D3Bridge',
    LastName: 'Domains',
    ContactType: 'COMPANY',
    OrganizationName: 'D3Serve',
    AddressLine1: '1111 W EL CAMINO REAL',
    AddressLine2: 'STE133x178 att D3ServeLabs',
    City: 'Sunnyvale',
    State: 'CA',
    CountryCode: 'US',
    ZipCode: '94087',
    PhoneNumber: '+1.6503365691',
    Email: domain
      ? `dns-${contactType}-contact+${domain}@d3bridge.xyz`
      : `dns-${contactType}-contact@d3bridge.xyz`,
  } as any);
};
