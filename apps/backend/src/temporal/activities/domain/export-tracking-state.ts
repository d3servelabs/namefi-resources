/**
 * Domain export tracking — state helpers.
 *
 * Statuses partition into three categories:
 *  - Transient: `NO_SIGNAL`, `UNDETERMINED` — produced by the decision
 *    function but not always persisted (NO_SIGNAL never creates a new row).
 *  - Active: `PENDING_TRANSFER`, `TRANSFER_PERIOD`, `NEEDS_ADMIN_REVIEW` —
 *    the row's `isActive` flag is `true`.
 *  - Terminal: `TRANSFER_COMPLETED`, `TRANSFER_FAILED`, `RESOLVED` — the
 *    row's `isActive` flag flips to `false` on the same UPDATE that
 *    transitions to one of these statuses. Terminal rows are frozen forever.
 *
 * Notification state (was the legacy `NOTIFIED` status value) lives in
 * dedicated per-email-type columns on `domain_export_tracking`; it is no
 * longer part of the tracking-status state machine.
 */
export type DomainExportTrackingStatus =
  | 'NO_SIGNAL'
  | 'UNDETERMINED'
  | 'PENDING_TRANSFER'
  | 'TRANSFER_PERIOD'
  | 'TRANSFER_COMPLETED'
  | 'TRANSFER_FAILED'
  | 'NEEDS_ADMIN_REVIEW'
  | 'RESOLVED';

export type TransferDecisionAction =
  | 'PENDING_TRANSFER'
  | 'TRANSFER_PERIOD'
  | 'TRANSFER_COMPLETED'
  | 'TRANSFER_FAILED'
  | 'NO_SIGNAL'
  | 'UNDETERMINED';

/**
 * Snapshot of evidence that produced a single status transition. Mirrors
 * the per-source shape stored on `domainExportTracking.latestEvidence` so
 * the timeline UI can render every historical decision the same way it
 * renders "current".
 *
 * Fields are optional so admin-driven transitions (verify / resolve) can
 * stamp a minimal snapshot without needing to fabricate evidence checks.
 */
export type ExportTrackingHistoryEvidenceSnapshot = {
  checkedAt?: string;
  decisionAction?: string;
  decisionReason?: string;
  /**
   * Per-source results captured at decision time. Structural-only so the
   * state helper avoids depending on the per-source types defined in
   * the activities module.
   */
  sources?: Array<{
    source: string;
    status: string;
    evidence?: unknown;
    error?: string;
    checkedAt: string;
  }>;
  eppStatuses?: string[];
  /** Free-form note for admin-driven transitions ("admin verify", "admin resolve"). */
  actor?: 'workflow' | 'admin' | 'system';
};

export type ExportTrackingStatusHistoryEntry = {
  timestamp: string;
  status: string;
  eppStatuses?: string[];
  /**
   * Human-readable explanation for this transition. For workflow-driven
   * transitions this matches the decision function's `reason`; for admin
   * actions it describes the action ("Admin verified", "Admin resolved").
   */
  reason?: string;
  /**
   * Snapshot of the evidence that produced this transition. Workflow
   * transitions copy from `latestEvidence`; admin transitions stamp a
   * minimal snapshot with `actor: 'admin'`.
   */
  evidence?: ExportTrackingHistoryEvidenceSnapshot;
};

export type ExportTrackingEmailType = 'pending' | 'failed' | 'complete';

/**
 * Statuses that mark a tracking row as terminal. App code MUST set
 * `isActive = false` in the same UPDATE that transitions to one of these.
 */
export const TERMINAL_STATUSES = [
  'TRANSFER_COMPLETED',
  'TRANSFER_FAILED',
  'RESOLVED',
] as const satisfies readonly DomainExportTrackingStatus[];

export function isTerminalStatus(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

/**
 * Statuses for which NFT burn eligibility may apply. Includes the terminal
 * `TRANSFER_COMPLETED` because burns can lag the terminal transition; the
 * burn query filters by status + `nftBurnedAt IS NULL` rather than by
 * `isActive`.
 */
export const EXPORT_BURN_ELIGIBLE_STATUSES = [
  'TRANSFER_COMPLETED',
  'NEEDS_ADMIN_REVIEW',
] as const satisfies readonly DomainExportTrackingStatus[];

/**
 * Statuses an admin can transition to TRANSFER_COMPLETED via "Approve".
 * Only `NEEDS_ADMIN_REVIEW` qualifies: TRANSFER_COMPLETED is the terminal
 * target, so approving it is a no-op.
 */
export const EXPORT_REVIEW_APPROVABLE_STATUSES = [
  'NEEDS_ADMIN_REVIEW',
] as const satisfies readonly DomainExportTrackingStatus[];

/**
 * Statuses an admin can transition to RESOLVED via "Resolve". Only
 * `NEEDS_ADMIN_REVIEW` qualifies; terminal rows are already closed.
 */
export const EXPORT_REVIEW_RESOLVABLE_STATUSES = [
  'NEEDS_ADMIN_REVIEW',
] as const satisfies readonly DomainExportTrackingStatus[];

export const EXPORT_PENDING_EMAIL_STATUSES = [
  'PENDING_TRANSFER',
  'TRANSFER_PERIOD',
] as const satisfies readonly DomainExportTrackingStatus[];

/**
 * Statuses for which the export-failed email applies. Only TRANSFER_FAILED
 * is a legitimate trigger; the row is terminal and the user should be told
 * the export did not go through.
 */
export const EXPORT_FAILED_EMAIL_STATUSES = [
  'TRANSFER_FAILED',
] as const satisfies readonly DomainExportTrackingStatus[];

/**
 * Statuses for which an export-complete email is the applicable template.
 * Both NEEDS_ADMIN_REVIEW (pre-admin-gate) and TRANSFER_COMPLETED
 * (post-admin-gate) accept this email — admins may resend on a terminal row
 * for support purposes.
 */
export const EXPORT_COMPLETE_EMAIL_STATUSES = [
  'TRANSFER_COMPLETED',
  'NEEDS_ADMIN_REVIEW',
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
    case 'TRANSFER_FAILED':
      return 'TRANSFER_FAILED';
    default:
      return null;
  }
}

/**
 * Admin-gate policy: the decision function may return TRANSFER_COMPLETED,
 * but the workflow never persists that status directly on a fresh detection.
 * Instead the row goes to NEEDS_ADMIN_REVIEW so an admin can verify before
 * any user-facing side effects (notification, burn) happen.
 *
 * The admin "Verify" action then transitions NEEDS_ADMIN_REVIEW →
 * TRANSFER_COMPLETED + `isActive = false`.
 *
 * Callers that need to distinguish "decision was TRANSFER_COMPLETED" (to set
 * `transferCompletedAt` / `confirmedOutOfAccountAt`) from "row status is now
 * TRANSFER_COMPLETED" should branch on the decision action, not the
 * persisted status.
 */
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

  if (statusInSet(EXPORT_FAILED_EMAIL_STATUSES, status)) {
    return 'failed';
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

/**
 * Append a transition to the status-history array. Each entry carries the
 * reason and evidence snapshot that produced the transition so the timeline
 * UI can render every step end-to-end without consulting external logs.
 *
 * `extras.now` defaults to `new Date()`. All other fields are optional;
 * unspecified evidence is fine for admin-driven transitions.
 */
export function appendExportTrackingStatusHistory(
  statusHistory: ExportTrackingStatusHistoryEntry[] | null | undefined,
  status: DomainExportTrackingStatus,
  extras: {
    reason?: string;
    evidence?: ExportTrackingHistoryEvidenceSnapshot;
    eppStatuses?: string[];
    now?: Date;
  } = {},
): ExportTrackingStatusHistoryEntry[] {
  const history = statusHistory ?? [];
  const now = extras.now ?? new Date();
  const entry: ExportTrackingStatusHistoryEntry = {
    timestamp: now.toISOString(),
    status,
  };
  if (extras.eppStatuses && extras.eppStatuses.length > 0) {
    entry.eppStatuses = extras.eppStatuses;
  }
  if (extras.reason) {
    entry.reason = extras.reason;
  }
  if (extras.evidence) {
    entry.evidence = extras.evidence;
  }
  return [...history, entry];
}
