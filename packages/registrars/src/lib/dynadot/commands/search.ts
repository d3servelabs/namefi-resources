import type { DynadotCurrency, DynadotResponseCode } from '../common-types';

export type DynadotSearchCommandParams = {
  domain0: string;
  language0?: string;
  [d: `domain${number}`]: string;
  [l: `language${number}`]: string | undefined;
  show_price?: '1';
  currency?: DynadotCurrency;
};
export type DynadotSearchCommandOutput = {
  SearchResponse: {
    ResponseCode: DynadotResponseCode;
    SearchResults: [
      {
        DomainName: string;
        Available: 'yes' | 'no';
        Status?: 'success';
        Price: `${number} in ${DynadotCurrency}`; //Registration Price: 1.99 in USD and Renewal price: 9.99 in USD and Domain is not a Premium Domain'
      },
    ];
  };
};
