export const MAX_GRACE_PERIOD_DAYS = 90; /* 90 days is the max grace period for any registrar */
export const DATE_MISMATCH_THRESHOLD_SECONDS = 86400;

export type NftManagementFilterRow = {
  normalizedDomainName: string;
  chainId: number;
  ownerAddress: string;
  autoRenewEnabled: string | null;
  domainStatus: string;
  nftStatus: string;
  nftExpirationTime: Date | null;
  domainExpirationTime: Date | null;
  registrarKey: string | null;
  dateState: string;
  userId: string | null;
  privyUserId: string | null;
  displayName: string | null;
  primaryEmail: string | null;
  isPoweredByNamefiDomain: string;
  canBurn: string;
  hasMissingData: string;
  hasDateMismatch: string;
  needsExpirationReview: string;
  isExpired: string;
};
