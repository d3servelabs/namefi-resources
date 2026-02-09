/**
 * Calling the Set Domain Push Request Command will set domain push request
 * https://www.dynadot.com/domain/api-commands#set_domain_push_request
 */
import type { DynadotResponseCode } from '../../common-types';

export type DynadotSetDomainPushRequestCommandParams = {
  /**
   * The domain name of the order to be processed
   */
  domains: string;

  /**
   * The action of the order to be processed, you can choose "accept" or "decline"
   */
  action: 'accept' | 'decline';
};

export type DynadotSetDomainPushRequestCommandOutput = {
  SetDomainPushRequestResponse: {
    ResponseCode: DynadotResponseCode;
    Status: 'success' | string;
  };
};
