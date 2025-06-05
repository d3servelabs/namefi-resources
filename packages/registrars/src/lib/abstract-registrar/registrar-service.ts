import type {
  ContactsMap,
  DomainAvailability,
  DomainContactPrivacyEnum,
  DomainContacts,
  DomainOwnershipOperation,
  DomainPriceDetails,
  DomainRegistration,
  DomainSummary,
  Nameservers,
  PriceWithCurrency,
  RdapDomainStatus,
  RenewOption,
} from './data';
import type { DnssecKey } from './data/dnssec';
import type { OperationStatus } from './data/operation-status';
import type { OperationType } from './data/operation-type';
import type {
  DomainSuggestion,
  DomainSuggestionsQueryResult,
} from './data/suggestions';

export type LongRunningOperationResult<T = any> = {
  operationId?: string | null;

  status: OperationStatus;
  type: OperationType;
  message?: string;
  response: T;
};

export type RegisterDomainInput = {
  domainName: string;
  durationInYears: number;
  renewOption: RenewOption;
  contacts: DomainContacts;
  privacy: DomainContactPrivacyEnum;
  price: PriceWithCurrency;
};

export type TransferDomainInput = {
  domainName: string;
  // durationInYears: number;
  // renewOption: RenewOption;
  contacts: DomainContacts;
  privacy: DomainContactPrivacyEnum;
  price: PriceWithCurrency;
  authCode: string;
  nameservers: Nameservers;
};

export type RenewDomainInput = {
  domainName: string;
  durationInYears: number;
  /**
   *  This is used as extra confirmation ([Dynadot] incase you want to use price re-confirmations before submission),
   *   but for now we are not doing re-confirmations, so there's no need to pass it
   */
  price?: PriceWithCurrency;
  currentExpirationDate: Date;
};

export type VerifyTransferInAuthCodeOutput = {
  transferable: boolean;
  reason?: string;
  response: any;
};

export abstract class AbstractRegistrarService<T extends string = string> {
  abstract readonly key: T;

  //#region DomainImport

  abstract registerDomain(
    args: RegisterDomainInput,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  abstract renewDomain(
    args: RenewDomainInput,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  abstract transferDomain(
    args: TransferDomainInput,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  //#endregion DomainImport

  //#region AuthCode
  abstract retrieveAuthCode(domainName: string, options?: any): Promise<string>;

  //#endregion AuthCode

  //#region Locks

  abstract lockDomain(
    domainName: string,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  abstract unlockDomain(
    domainName: string,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  //#endregion Locks

  abstract getDomainDetails(
    domainName: string,
    options?: any,
  ): Promise<DomainRegistration>;

  abstract getDomainStatus(
    domainName: string,
    options?: any,
  ): Promise<RdapDomainStatus>;

  abstract getDomainPrice(
    domainName: string,
    operation: DomainOwnershipOperation,
    options?: any,
  ): Promise<PriceWithCurrency>;

  //#region DNSSEC
  abstract addDelegationSigner(
    domainName: string,
    signingAttributes: DnssecKey,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  abstract removeDelegationSigner(
    domainName: string,
    publicKeyOrId: string,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  //#endregion DNSSEC

  //#region Domain Contacts
  abstract updateDomainContacts(
    domainName: string,
    contacts: Partial<DomainContacts>,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  abstract getDomainContacts(
    domainName: string,
    options?: any,
  ): Promise<DomainContacts>;

  abstract updateDomainContactsPrivacy(
    domainName: string,
    privacy: ContactsMap<DomainContactPrivacyEnum>,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  //#endregion Domain Contacts

  abstract searchForDomain(
    query: string,
    options?: any,
  ): Promise<DomainsQueryResult<T>>;

  abstract getSuggestions(
    query: string,
    suggestionCount: number,
    options?: any,
  ): Promise<DomainSuggestionsQueryResult<T>>;

  //#region Nameservers
  abstract setNameServers(
    domainName: string,
    nameservers: Nameservers,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  abstract getNameServers(
    domainName: string,
    options?: any,
  ): Promise<Nameservers>;

  //#endregion Nameservers

  abstract getOperationStatus(
    domainName: string,
    operationId: string,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  abstract setRenewOption(
    domainName: string,
    option: RenewOption,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  abstract getRenewOption(
    domainName: string,
    options?: any,
  ): Promise<RenewOption>;
  abstract listAllDomains(): Promise<DomainSummary[]>;

  setDomainLockState(domainName: string, activateLock: boolean, options?: any) {
    if (activateLock) {
      return this.lockDomain(domainName, options);
    }
    return this.unlockDomain(domainName, options);
  }
}

export type DomainsQueryResult<T extends string> = {
  result: {
    domainName: string;
    available: DomainAvailability;
    price: DomainPriceDetails;
  };
  suggestions: DomainSuggestion<T>[];
};
