import type { DynadotResponse } from '../common-types';

export type DynadotDomainInfoCommandParams = {
  /**
   * only 1 domain can be registered per request
   */
  domain: string;
};
export type DynadotDomainInfoCommandOutput = {
  DomainInfoResponse: DynadotResponse<
    void,
    'could not find domain in your account',
    {
      DomainInfo: DynadotDomainInfo;
    }
  >;
};
export type DynadotDomainInfo = {
  Name: string;
  /**
   * in millis
   */
  Expiration: `${number}`;
  /**
   * in millis
   */
  Registration: `${number}`;
  NameServerSettings: {
    Type: 'Dynadot Parking';
    WithAds: 'Yes';
  };
  Whois: {
    Registrant: {
      ContactId: `${number}`;
    };
    Admin: {
      ContactId: `${number}`;
    };
    Technical: {
      ContactId: `${number}`;
    };
    Billing: {
      ContactId: `${number}`;
    };
  };
  Locked: 'yes' | 'no';
  Disabled: 'yes' | 'no';
  UdrpLocked: 'yes' | 'no';
  RegistrantUnverified: 'yes' | 'no';
  Hold: 'yes' | 'no';
  Privacy: 'none' | 'full' | string;
  isForSale: 'yes' | 'no';
  RenewOption: 'no renew option' | 'manual renewal' | string;
  Note: string;
  Folder: {
    FolderId: `${number}`;
    FolderName: '(no folder)' | string;
  };
};
