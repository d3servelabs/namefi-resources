/**
 * Calling the Get Domain Push Request Command will get domain push request
 * https://www.dynadot.com/domain/api-commands#get_domain_push_request
 */
import type { DynadotResponseCode } from '../../common-types';

export type DynadotGetDomainPushRequestCommandParams = Record<string, never>;

export type DynadotGetDomainPushRequestCommandOutput = {
  GetDomainPushRequestResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
    PushDomain?: {
      PushDomainName: string;
    }[];
  };
};
