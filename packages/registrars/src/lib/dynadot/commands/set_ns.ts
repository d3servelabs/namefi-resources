import type { DynadotResponseCode } from '../common-types';

export type DynadotSetNsCommandParams = {
  /**
   * The domain name you want to set, 100 domains can be set per request, make sure they are separated by commas
   */
  domain: string;

  /**
   *
   * The name servers to set your domain to use, you can specify up to 13 name servers, but they must already be in your account
   */
  ns0?: string;
  ns1?: string;
  ns2?: string;
  ns3?: string;
  ns4?: string;
  ns5?: string;
  ns6?: string;
  ns7?: string;
  ns8?: string;
  ns9?: string;
  ns10?: string;
  ns11?: string;
  ns12?: string;
};
export type DynadotSetNsCommandOutput = {
  SetNsResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
  };
};
