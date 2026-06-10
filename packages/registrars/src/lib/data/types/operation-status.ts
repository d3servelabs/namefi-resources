export const OperationStatus = {
  /**
   * Indicates that the operation has been submitted to the registrar. but it's not going through because of a technical issue.
   * Either invalid data or a missing required field. or IDN issue
   */
  ERROR: 'ERROR',
  /**
   * Indicates that the operation has been submitted to the registrar. but it's completly FAILED
   */
  FAILED: 'FAILED',
  /**
   * The operation is in progress
   */
  IN_PROGRESS: 'IN_PROGRESS',
  /**
   * Indicates that the operation has been submitted to the registrar.
   */
  SUBMITTED: 'SUBMITTED',
  /**
   * Indicates that the operation has been completed successfully.
   */
  SUCCESSFUL: 'SUCCESSFUL',
  /**
   * Indicates that the operation requires further action. like unlocking a domain in transfer-in for example. or updating EppAuthCode
   */
  REQUIRES_ACTION: 'REQUIRES_ACTION',
} as const;

export type OperationStatus =
  (typeof OperationStatus)[keyof typeof OperationStatus];
