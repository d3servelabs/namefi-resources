import type { PunycodeDomainName } from '#lib/data/validations';
import type {
  ContactsMap,
  DomainAvailability,
  DomainContactPrivacyEnum,
  DomainContacts,
  DomainOwnershipOperation,
  DomainPricingDetails,
  DomainRegistration,
  DomainSummary,
  Nameservers,
  PriceWithCurrency,
  PricingDetails,
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
  domainName: PunycodeDomainName;
  durationInYears: number;
  renewOption: RenewOption;
  contacts: DomainContacts;
  privacy: DomainContactPrivacyEnum;
  // price: PriceWithCurrency;
};

export type TransferDomainInput = {
  domainName: PunycodeDomainName;
  // durationInYears: number;
  // renewOption: RenewOption;
  contacts: DomainContacts;
  privacy: DomainContactPrivacyEnum;
  // price: PriceWithCurrency;
  authCode: string;
  nameservers: Nameservers;
};

export type RenewDomainInput = {
  domainName: PunycodeDomainName;
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
  abstract retrieveAuthCode(
    domainName: PunycodeDomainName,
    options?: any,
  ): Promise<string>;

  //#endregion AuthCode

  //#region Locks

  abstract lockDomain(
    domainName: PunycodeDomainName,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  abstract unlockDomain(
    domainName: PunycodeDomainName,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  //#endregion Locks

  abstract getDomainDetails(
    domainName: PunycodeDomainName,
    options?: any,
  ): Promise<DomainRegistration>;

  abstract getDomainStatus(
    domainName: PunycodeDomainName,
    options?: any,
  ): Promise<RdapDomainStatus>;

  abstract getDomainPrice(
    domainName: PunycodeDomainName,
    operation: DomainOwnershipOperation,
    options?: any,
  ): Promise<PricingDetails>;

  //#region DNSSEC
  abstract addDelegationSigner(
    domainName: PunycodeDomainName,
    signingAttributes: DnssecKey,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  abstract removeDelegationSigner(
    domainName: PunycodeDomainName,
    publicKeyOrId: string,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  //#endregion DNSSEC

  //#region Domain Contacts
  abstract updateDomainContacts(
    domainName: PunycodeDomainName,
    contacts: Partial<DomainContacts>,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  abstract getDomainContacts(
    domainName: PunycodeDomainName,
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
  ): Promise<DomainQueryResult>;

  abstract bulkSearch(
    queries: string[],
    options?: any,
  ): Promise<DomainQueryResult[]>;

  abstract getSuggestions(
    query: string,
    suggestionCount: number,
    options?: any,
  ): Promise<DomainSuggestionsQueryResult<T>>;

  //#region Nameservers
  abstract setNameServers(
    domainName: PunycodeDomainName,
    nameservers: Nameservers,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  abstract getNameServers(
    domainName: PunycodeDomainName,
    options?: any,
  ): Promise<Nameservers>;

  //#endregion Nameservers

  abstract getOperationStatus(
    domainName: PunycodeDomainName,
    operationId: string,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  abstract setRenewOption(
    domainName: PunycodeDomainName,
    option: RenewOption,
    options?: any,
  ): Promise<LongRunningOperationResult>;

  abstract getRenewOption(
    domainName: PunycodeDomainName,
    options?: any,
  ): Promise<RenewOption>;
  abstract listAllDomains(): Promise<DomainSummary[]>;

  setDomainLockState(
    domainName: PunycodeDomainName,
    activateLock: boolean,
    options?: any,
  ) {
    if (activateLock) {
      return this.lockDomain(domainName, options);
    }
    return this.unlockDomain(domainName, options);
  }
}

export type DomainQueryResult = {
  domainName: PunycodeDomainName;
  available: DomainAvailability;
  price: DomainPricingDetails | null | undefined;
  isPremium: boolean;
};
