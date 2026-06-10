/**
 * Transfer status types for domain transfers.
 *
 * Based on EPP RFC 5731 domain:trStatus values.
 */

export type TransferStatus =
  | 'pending'
  | 'clientApproved'
  | 'serverApproved'
  | 'clientRejected'
  | 'serverRejected'
  | 'clientCancelled'
  | 'serverCancelled';

/**
 * Information about a pending domain transfer.
 */
export interface PendingTransferInfo {
  /** Domain name being transferred */
  domainName: string;

  /** Current transfer status */
  status: TransferStatus;

  /** Requesting (gaining) registrar ID */
  requestingRegistrarId: string;

  /** Date the transfer was requested */
  requestDate: Date;

  /** Acting (losing) registrar ID */
  actionRegistrarId: string;

  /** Deadline for action on the transfer */
  actionDate: Date;

  /** New expiration date if transfer completes */
  expirationDate?: Date;
}
