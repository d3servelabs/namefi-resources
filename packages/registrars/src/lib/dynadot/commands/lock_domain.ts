import type { DynadotResponse } from '../common-types';

export type DynadotLockDomainCommandParams = {
  /**
   * The domain name you want to lock
   */
  domain: string;
};

export type DynadotLockDomainCommandOutput = {
  LockDomainResponse: DynadotResponse<
    void,
    `this domain has been locked already: ${string}`,
    {
      DomainName?: string;
    }
  >;
};
