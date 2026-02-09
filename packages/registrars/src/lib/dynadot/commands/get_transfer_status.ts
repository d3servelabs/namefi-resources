import type { DynadotResponse } from '../common-types';

export type DynadotGetTransferStatusCommandParams = {
  /**
   * The domain name you want to get transfer status for, only 1 domain can be entered per request
   */
  domain: string;

  /**
   *
   * The transfer type you want to get transfer status for (transfer in or transfer away)
   */
  transfer_type: 'in' | 'away';
};
export type DynadotGetTransferStatusCommandOutput = {
  GetTransferStatusResponse: DynadotResponse<
    void,
    `can not find transferring order for ${string}`,
    {
      TransferList?: {
        OrderId: string;
        TransferStatus: DynadotTransferStatus;
        FailedReason: DynadotTransferFailedReason;
        /**
         * ms since epoch
         */
        ExpirationDate: `${number}`;
      }[];
    }
  >;
};

export const DynadotTransferStatus = Object.freeze({
  LOCKED: 'Locked',
  WAITING: 'Waiting',
  FAILED: 'Failed',
  NONE: 'None',
  AUTH_CODE_NEEDED: 'Auth Code Needed',
  CANCELLED: 'Cancelled',
  APPROVED: 'Approved',
  TRANSFERRED: 'Transferred',
});
export type DynadotTransferStatus =
  (typeof DynadotTransferStatus)[keyof typeof DynadotTransferStatus];

export const DynadotTransferFailedReason = Object.freeze({
  TRANSFER_PENDING: 'Transfer Pending',
  TRANSFER_FAILED: 'Transfer Failed',
  AUTH_CODE_IS_INVALID: 'Auth code is invalid',
  TRANSFER_CANCELLED: 'Transfer Cancelled',
});
export type DynadotTransferFailedReason =
  (typeof DynadotTransferFailedReason)[keyof typeof DynadotTransferFailedReason];
