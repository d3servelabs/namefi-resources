import type { DynadotContactInfo, DynadotResponseCode } from '../common-types';

export type DynadotSetWhoisCommandParams = {
  /**
   * The domain name you want to set, 100 domains can be set per request, make sure they are separated by commas
   */
  domain: string;

  /**
   * The registrant contact you want to use on the domain
   */
  registrant_contact?: DynadotContactInfo;

  /**
   * The admin contact you want to use on the domain
   */
  admin_contact?: DynadotContactInfo;

  /**
   * The technical contact you want to use on the domain
   */
  technical_contact?: DynadotContactInfo;

  /**
   * The billing contact you want to use on the domain
   */
  billing_contact?: DynadotContactInfo;
};
export type DynadotSetWhoisCommandOutput = {
  SetWhoisResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
  };
};
