import type { DynadotCurrency, DynadotResponseCode } from '../common-types';

export type DynadotTldPriceCommandParams = {
  /**
   * 	You can decide the currency type and this parameter supported are "USD","CNY", "GBP","EUR","INR","CAD" and so on.If you missed this parameter,we will use the account default currency
   */
  currency?: DynadotCurrency;
  /**
   * The number of tlds to return per page
   */
  count_per_page?: number;
  /**
   * The page index to return
   */
  page_index?: number;
  /**
   * 1) RankAsc (Default)
   * 2) RankDesc
   * 3) NameAsc
   * 4) NameDesc
   * 5) SalesAsc
   * 6) SalesDesc
   * 7) LaunchDateAsc
   * 8) LaunchDateDesc
   * 9) CountAsc
   * 10) CountDesc
   * 11) RegistryAsc
   * 12) RegistryDesc
   *
   */
  sort?:
    | 'RankAsc'
    | 'RankDesc'
    | 'NameAsc'
    | 'NameDesc'
    | 'SalesAsc'
    | 'SalesDesc'
    | 'LaunchDateAsc'
    | 'LaunchDateDesc'
    | 'CountAsc'
    | 'CountDesc'
    | 'RegistryAsc'
    | 'RegistryDesc';
};

export type DynadotTldPriceDetails = {
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
};

export type DynadotTldPriceCommandOutput = {
  TldPriceResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
    PriceLevel: 'Regular Pricing' | string;
    Currency: DynadotCurrency;
    TldPrice: DynadotTldPriceDetails[];
  };
};
