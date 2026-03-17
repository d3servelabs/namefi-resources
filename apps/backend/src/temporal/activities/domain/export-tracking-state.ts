export type DomainExportTrackingStatus =
  | 'NO_SIGNAL'
  | 'UNDETERMINED'
  | 'PENDING_TRANSFER'
  | 'TRANSFER_PERIOD'
  | 'TRANSFER_COMPLETED'
  | 'TRANSFER_FAILED'
  | 'NEEDS_ADMIN_REVIEW'
  | 'NOTIFIED'
  | 'RESOLVED';

export type TransferDecisionAction =
  | 'PENDING_TRANSFER'
  | 'TRANSFER_PERIOD'
  | 'TRANSFER_COMPLETED'
  | 'NO_SIGNAL'
  | 'UNDETERMINED';

export type ExportTrackingStatusHistoryEntry = {
  timestamp: string;
  status: string;
  eppStatuses?: string[];
};

export type ExportTrackingEmailType = 'pending' | 'complete';

export const EXPORT_BURN_ELIGIBLE_STATUSES = [
  'TRANSFER_COMPLETED',
  'NEEDS_ADMIN_REVIEW',
  'NOTIFIED',
] as const satisfies readonly DomainExportTrackingStatus[];

export const EXPORT_REVIEW_APPROVABLE_STATUSES = [
  'NEEDS_ADMIN_REVIEW',
  'TRANSFER_COMPLETED',
] as const satisfies readonly DomainExportTrackingStatus[];

export const EXPORT_REVIEW_RESOLVABLE_STATUSES = [
  'NEEDS_ADMIN_REVIEW',
  'NOTIFIED',
  'TRANSFER_COMPLETED',
] as const satisfies readonly DomainExportTrackingStatus[];

export const EXPORT_PENDING_EMAIL_STATUSES = [
  'PENDING_TRANSFER',
  'TRANSFER_PERIOD',
] as const satisfies readonly DomainExportTrackingStatus[];

export const EXPORT_COMPLETE_EMAIL_STATUSES = [
  'TRANSFER_COMPLETED',
  'NEEDS_ADMIN_REVIEW',
  'NOTIFIED',
  'RESOLVED',
] as const satisfies readonly DomainExportTrackingStatus[];

export function actionToTrackingStatus(
  action: TransferDecisionAction,
): DomainExportTrackingStatus | null {
  switch (action) {
    case 'NO_SIGNAL':
      return 'NO_SIGNAL';
    case 'UNDETERMINED':
      return 'UNDETERMINED';
    case 'PENDING_TRANSFER':
      return 'PENDING_TRANSFER';
    case 'TRANSFER_PERIOD':
      return 'TRANSFER_PERIOD';
    case 'TRANSFER_COMPLETED':
      return 'TRANSFER_COMPLETED';
    default:
      return null;
  }
}

export function mapDecisionToPersistedStatus(
  action: TransferDecisionAction,
): DomainExportTrackingStatus | null {
  if (action === 'TRANSFER_COMPLETED') {
    return 'NEEDS_ADMIN_REVIEW';
  }

  return actionToTrackingStatus(action);
}

function statusInSet(
  statuses: readonly DomainExportTrackingStatus[],
  status: string,
): boolean {
  return statuses.includes(status as DomainExportTrackingStatus);
}

export function canApproveExportTrackingStatus(status: string): boolean {
  return statusInSet(EXPORT_REVIEW_APPROVABLE_STATUSES, status);
}

export function canResolveExportTrackingStatus(status: string): boolean {
  return statusInSet(EXPORT_REVIEW_RESOLVABLE_STATUSES, status);
}

export function isBurnEligibleExportStatus(status: string): boolean {
  return statusInSet(EXPORT_BURN_ELIGIBLE_STATUSES, status);
}

export function getExportTrackingEmailType(
  status: string,
): ExportTrackingEmailType | null {
  if (statusInSet(EXPORT_PENDING_EMAIL_STATUSES, status)) {
    return 'pending';
  }

  if (statusInSet(EXPORT_COMPLETE_EMAIL_STATUSES, status)) {
    return 'complete';
  }

  return null;
}

export function isAdminApprovedForPendingNotification(input: {
  clientApprovedAt?: Date | null;
  adminVerifiedAt?: Date | null;
}): boolean {
  return Boolean(input.clientApprovedAt || input.adminVerifiedAt);
}

export function appendExportTrackingStatusHistory(
  statusHistory: ExportTrackingStatusHistoryEntry[] | null | undefined,
  status: DomainExportTrackingStatus,
  now: Date = new Date(),
): ExportTrackingStatusHistoryEntry[] {
  const history = statusHistory ?? [];
  return [
    ...history,
    {
      timestamp: now.toISOString(),
      status,
    },
  ];
}
