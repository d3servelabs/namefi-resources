import type { DynadotCurrency, DynadotResponseCode } from '../common-types';

export type DynadotRenewCommandParams = {
  /**
   * The domain name you want to register, only 1 domain can be registered per request
   */
  domain: string;

  /**
   * How long to register the domain for
   */
  duration: number;

  /**
   * You can decide the currency type and this parameter supported are "USD","CNY", "GBP","EUR","INR","CAD" and so on.If you missed this parameter,we will use the account default currency
   */
  currency?: DynadotCurrency;

  /**
   *
   * You can add this parameter to the command to check the price detail for renewing this domain. NOTE: Adding this parameter to command, our api will not renew the domain, but only display the price info.
   */
  price_check?: 1;

  /**
   * The coupon code you want to apply to this command
   */
  coupon?: string;

  /**
   * You can add this parameter to the command to avoid the renewal if the domain requires late renewal fee. If domain does requires late renew fee to renew, and "no_renew_if_late_renew_fee_needed = 1" was passed in command, domain will not be renewed.
   */
  no_renew_if_late_renew_fee_needed?: 1;
};
export type DynadotRenewCommandOutput = {
  RenewResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
    DomainName: string;
    Expiration: `${number}`;
  };
};
