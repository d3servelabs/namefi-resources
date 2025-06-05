import type { DynadotResponse } from '../common-types';

export type DynadotUnlockDomainCommandParams = {
  /**
   * The domain name you want to unlock
   */
  domain: string;
};

export type DynadotUnlockDomainCommandOutput = {
  UnlockDomainResponse: DynadotResponse<
    void,
    void,
    {
      DomainName?: string;
    }
  >;
};
