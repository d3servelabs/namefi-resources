export const OperationStatus = {
  ERROR: 'ERROR',
  FAILED: 'FAILED',
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  SUCCESSFUL: 'SUCCESSFUL',
} as const;

export type OperationStatus =
  (typeof OperationStatus)[keyof typeof OperationStatus];
