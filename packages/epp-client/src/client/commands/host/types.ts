/**
 * Type definitions for EPP Host commands.
 *
 * @see RFC 5732 - Extensible Provisioning Protocol (EPP) Host Mapping
 */

import type { z } from 'zod';
import type {
  HostCheckTypeXml,
  HostInfoXml,
  HostCreateTypeXml,
  HostUpdateTypeXml,
} from '../../../data/schemas/epp-core';

// ============ Payload Types (for response parsing) ============

export type HostCheckPayload = z.infer<typeof HostCheckTypeXml>;
export type HostInfoPayload = z.infer<typeof HostInfoXml>;
export type HostCreatePayload = z.infer<typeof HostCreateTypeXml>;
export type HostUpdatePayload = z.infer<typeof HostUpdateTypeXml>;

// ============ Command Option Interfaces ============

/**
 * IP address for a host object.
 */
export interface HostAddr {
  /** IP version: "v4" for IPv4, "v6" for IPv6 */
  ip: 'v4' | 'v6';

  /** IP address string */
  addr: string;
}

/**
 * Options for host:create command.
 */
export interface HostCreateOptions {
  /** Fully qualified host name */
  name: string;

  /** IP addresses (required for internal hosts, i.e., hosts subordinate to a domain) */
  addr?: HostAddr[];
}

/**
 * Client-settable host status values.
 */
export type HostStatus = 'clientDeleteProhibited' | 'clientUpdateProhibited';

/**
 * Options for host:update command.
 */
export interface HostUpdateOptions {
  /** Host name to update */
  name: string;

  /** Elements to add */
  add?: {
    addr?: HostAddr[];
    statuses?: Array<{
      status: HostStatus;
      lang?: string;
      text?: string;
    }>;
  };

  /** Elements to remove */
  rem?: {
    addr?: HostAddr[];
    statuses?: Array<{
      status: HostStatus;
      lang?: string;
      text?: string;
    }>;
  };

  /** Elements to change */
  chg?: {
    /** New host name (for renaming) */
    name?: string;
  };
}
