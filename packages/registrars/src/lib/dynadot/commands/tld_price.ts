import type { DynadotCurrency, DynadotResponseCode } from '../common-types';

export type DynadotTldPriceCommandParams = {
  /**
   * 	You can decide the currency type and this parameter supported are "USD","CNY", "GBP","EUR","INR","CAD" and so on.If you missed this parameter,we will use the account default currency
   */
  currency?: DynadotCurrency;
};

export type DynadotTldPriceCommandOutput = {
  TldPriceResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
    PriceLevel: 'Regular Pricing' | string;
    Currency: DynadotCurrency;
    TldPrice: {
      Tld: `.${string}`;
      Usage: `Usage`;
      Price: {
        Unit: `(Price/1 year)`;
        Register: `${number}`;
        Renew: `${number}`;
        Transfer: `${number}`;
        Restore: `${number}`;
      };
      Privacy: 'Yes' | `NO` | string;
      GracePeriod: {
        Unit: '(Grace Period/days)';
        Renew: `${number}`;
        Delete: `${number}`;
      };
      IDN: 'Yes' | `NO` | string;
      Restrictions: '--' | string;
    }[];
  };
};
