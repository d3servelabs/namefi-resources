export type EvidenceSourceEntry = {
  source:
    | 'AccountCheck'
    | 'DomainIndex'
    | 'RDAPStatus'
    | 'RDAPEvents'
    | 'WHOIS'
    | 'DirectRegistrar';
  status:
    | 'positive_pending'
    | 'positive_period'
    | 'positive_completed'
    | 'positive_failed'
    | 'negative'
    | 'no_data'
    | 'error';
  evidence?: unknown;
  error?: string;
  checkedAt: string;
};

export type EvidenceSnapshot = {
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
  sources?: EvidenceSourceEntry[];
  eppStatuses?: string[];
  actor?: 'workflow' | 'admin' | 'system';
};

export type ExportTrackingRecord = {
  id: string;
  normalizedDomainName: string;
  chainId: number;
  ownerAddress: string;
  status: string;
  previousStatus: string | null;
  isActive: boolean;
  statusHistory: Array<{
    timestamp: string;
    status: string;
    eppStatuses?: string[];
    reason?: string;
    evidence?: EvidenceSnapshot;
  }> | null;
  eppStatuses: string[] | null;
  registrarKey: string | null;
  statusChangedAt: Date;
  firstDetectedAt: Date;
  lastCheckedAt: Date;
  clientApprovedAt: Date | null;
  adminVerifiedAt: Date | null;
  verifyingAdminId: string | null;
  confirmedOutOfAccountAt: Date | null;
  nftBurnedAt: Date | null;
  nftBurnTxHash: string | null;
  pendingExportEmailSentAt: Date | null;
  pendingExportEmailLastAttemptAt: Date | null;
  pendingExportEmailAttempts: number;
  pendingExportEmailLastError: string | null;
  pendingExportEmailRecipient: string | null;
  failedExportEmailSentAt: Date | null;
  failedExportEmailLastAttemptAt: Date | null;
  failedExportEmailAttempts: number;
  failedExportEmailLastError: string | null;
  failedExportEmailRecipient: string | null;
  completedExportEmailSentAt: Date | null;
  completedExportEmailLastAttemptAt: Date | null;
  completedExportEmailAttempts: number;
  completedExportEmailLastError: string | null;
  completedExportEmailRecipient: string | null;
  pendingNotifiedAt?: Date | null;
  userNotified?: boolean;
  notifiedAt?: Date | null;
  latestEvidence: EvidenceSnapshot | null;
  createdAt: Date;
  updatedAt: Date;
};
