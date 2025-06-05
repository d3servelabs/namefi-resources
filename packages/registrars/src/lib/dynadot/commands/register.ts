import type {
  DynadotContactInfo,
  DynadotCurrency,
  DynadotResponse,
} from '../common-types';

export type DynadotRegisterCommandParams = {
  /**
   * The domain name you want to register, only 1 domain can be registered per request
   */
  domain: string;

  /**
   * The language tag for the requested domain, only needed if the domain is an IDN
   */
  language?: string;

  /**
   * How long to register the domain for
   */
  duration: number;

  /**
   * You can decide the currency type and this parameter supported are "USD","CNY", "GBP","EUR","INR","CAD" and so on.If you missed this parameter,we will use the account default currency
   */
  currency?: DynadotCurrency;

  /**
   * If you want to register a premium domain, set it equal to "1" (optional)
   */
  premium?: '1';

  /**
   * The coupon code you want to apply to this command
   */
  coupon?: string;

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

  /**
   * The .AT, .BE, registrant name
   */
  option0?: string;

  /**
   * The .AT, .BE, registrant organization (optional)
   * 	For .AT, you can specify either option0, option1, or both
   */
  option1?: string;
};
export type DynadotRegisterCommandOutput = {
  RegisterResponse: DynadotResponse<
    'not_available',
    void,
    {
      DomainName: string;
      Expiration?: `${number}`;
    }
  >;
};
