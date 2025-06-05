import type { DynadotCurrency, DynadotResponse } from '../common-types';

export type DynadotGetAccountBalanceCommandParams = Record<string, never>;
export type DynadotGetAccountBalanceCommandOutput = {
  GetAccountBalanceResponse: DynadotResponse<
    void,
    void,
    {
      BalanceList: [
        {
          Currency: DynadotCurrency;
          Amount: `${number}`;
        },
      ];
    }
  >;
};
