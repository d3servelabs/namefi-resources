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
