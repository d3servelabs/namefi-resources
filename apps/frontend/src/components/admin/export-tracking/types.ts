export type ExportTrackingRecord = {
  id: string;
  normalizedDomainName: string;
  chainId: number;
  ownerAddress: string;
  status: string;
  previousStatus: string | null;
  statusHistory: Array<{
    timestamp: string;
    status: string;
    eppStatuses?: string[];
  }> | null;
  eppStatuses: string[] | null;
  registrarKey: string | null;
  statusChangedAt: Date;
  firstDetectedAt: Date;
  lastCheckedAt: Date;
  clientApprovedAt: Date | null;
  adminVerifiedAt: Date | null;
  verfyingAdminId: string | null;
  confirmedOutOfAccountAt: Date | null;
  nftBurnedAt: Date | null;
  nftBurnTxHash: string | null;
  pendingNotifiedAt: Date | null;
  userNotified: boolean;
  notifiedAt: Date | null;
  latestEvidence: {
    checkedAt?: string;
    evidenceSource?: 'DIRECT_REGISTRAR' | 'RDAP' | 'WHOIS' | 'NONE';
    accountCheck?: {
      inOurAccount?: boolean;
      confirmed?: boolean;
    };
    rdapTransferEvent?: {
      detected?: boolean;
      eventAction?: string;
      eventDate?: string;
    };
    decisionAction?: string;
    decisionReason?: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};
