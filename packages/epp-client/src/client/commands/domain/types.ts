/**
 * Type definitions for EPP Domain commands.
 *
 * @see RFC 5731 - Extensible Provisioning Protocol (EPP) Domain Name Mapping
 */

import type { z } from 'zod';
import type {
  DomainMNameTypeXml,
  DomainInfoTypeXml,
  DomainCreateTypeXml,
  DomainRenewTypeXml,
  DomainTransferTypeXml,
  DomainUpdateTypeXml,
} from '../../../data/schemas/epp-core';

// ============ Payload Types (for response parsing) ============

export type DomainCheckPayload = z.infer<typeof DomainMNameTypeXml>;
export type DomainInfoPayload = z.infer<typeof DomainInfoTypeXml>;
export type DomainCreatePayload = z.infer<typeof DomainCreateTypeXml>;
export type DomainRenewPayload = z.infer<typeof DomainRenewTypeXml>;
export type DomainTransferPayload = z.infer<typeof DomainTransferTypeXml>;
export type DomainUpdatePayload = z.infer<typeof DomainUpdateTypeXml>;

// ============ Command Option Interfaces ============

/**
 * Options for domain:info command.
 */
export interface DomainInfoOptions {
  /** Domain name to query */
  name: string;

  /** Which hosts to return: all, delegated, subordinate, or none */
  hosts?: 'all' | 'del' | 'sub' | 'none';

  /** Authorization info for domains not sponsored by the client */
  authInfo?: string;
}

/**
 * Options for domain:create command.
 */
export interface DomainCreateOptions {
  /** Domain name to create */
  name: string;

  /** Registration period */
  period?: { value: number; unit: 'y' | 'm' };

  /** Nameserver hostnames */
  ns?: string[];

  /** Registrant contact ID */
  registrant?: string;

  /** Associated contacts */
  contacts?: Array<{ type: 'admin' | 'tech' | 'billing'; id: string }>;

  /** Authorization info (password) for the domain */
  authInfo: string;
}

/**
 * Options for domain:renew command.
 */
export interface DomainRenewOptions {
  /** Domain name to renew */
  name: string;

  /** Current expiration date (YYYY-MM-DD format) */
  curExpDate: string;

  /** Renewal period */
  period?: { value: number; unit: 'y' | 'm' };
}

/**
 * Transfer operation type.
 */
export type TransferOp = 'query' | 'request' | 'approve' | 'cancel' | 'reject';

/**
 * Options for domain:transfer command.
 */
export interface DomainTransferOptions {
  /** Transfer operation type */
  op: TransferOp;

  /** Domain name to transfer */
  name: string;

  /** Authorization info from current registrant */
  authInfo?: string;

  /** Registration period to add upon successful transfer */
  period?: { value: number; unit: 'y' | 'm' };
}

/**
 * Client-settable domain status values.
 *
 * Note: Server status values (serverHold, serverDeleteProhibited, etc.)
 * can only be set by the server, not by clients.
 */
export type DomainStatus =
  | 'clientDeleteProhibited'
  | 'clientHold'
  | 'clientRenewProhibited'
  | 'clientTransferProhibited'
  | 'clientUpdateProhibited';

/**
 * Options for domain:update command.
 */
export interface DomainUpdateOptions {
  /** Domain name to update */
  name: string;

  /** Elements to add */
  add?: {
    ns?: string[];
    contacts?: Array<{ type: 'admin' | 'tech' | 'billing'; id: string }>;
    statuses?: Array<{ status: DomainStatus; lang?: string; text?: string }>;
  };

  /** Elements to remove */
  rem?: {
    ns?: string[];
    contacts?: Array<{ type: 'admin' | 'tech' | 'billing'; id: string }>;
    statuses?: Array<{ status: DomainStatus; lang?: string; text?: string }>;
  };

  /** Elements to change */
  chg?: {
    registrant?: string;
    authInfo?: string;
  };
}
