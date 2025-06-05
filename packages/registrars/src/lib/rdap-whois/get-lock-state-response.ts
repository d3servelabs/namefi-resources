import type { RdapDomainStatus } from './rdap-response';

export type GetLockStateResponse = {
  locked: boolean;
  status?: RdapDomainStatus[];
  isAddPeriod?: boolean;
  isTransferPeriod?: boolean;
};
