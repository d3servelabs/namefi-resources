import type { PunycodeDomainName } from '#lib/data/validations';

import type {
  DomainAvailability,
  DomainContactPrivacyEnum,
  DomainContacts,
  DomainPricingDetails,
  Nameservers,
  PriceWithCurrency,
  RenewOption,
  OperationStatus,
  OperationType,
} from '#lib/data/types';

export type RequiresActionMetadata = {
  actionType:
    | 'EPP_UNLOCK_REQUIRED'
    | 'EPP_AUTH_CODE_UPDATE_REQUIRED'
    | 'UNDETERMINED';
};

export type LongRunningOperationResult<T = any> = {
  operationId?: string | null;
  type: OperationType;
  status: OperationStatus;
  message?: string;
  response: T;
  metadata?: {};
} & (
  | {
      status: Exclude<OperationStatus, 'REQUIRES_ACTION'>;
      metadata?: {};
    }
  | {
      status: Extract<OperationStatus, 'REQUIRES_ACTION'>;
      metadata: RequiresActionMetadata;
    }
);

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

export type ResubmitImportDomainRequestInput = TransferDomainInput;
export type CancelImportDomainRequestInput = {
  domainName: PunycodeDomainName;
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

export type VerifyImportAuthCodeOutput = {
  transferable: boolean;
  reason?: string;
  response: any;
};
export type DomainQueryResult = {
  domainName: PunycodeDomainName;
  available: DomainAvailability;
  price: DomainPricingDetails | null | undefined;
  isPremium: boolean;
  supported: boolean;
};
