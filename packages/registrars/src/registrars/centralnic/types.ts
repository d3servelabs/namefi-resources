import type Bottleneck from 'bottleneck';
import type pino from 'pino';
import type { DomainIndexFunctions } from './domain-index';
import type { Nameservers } from '#lib/abstract-registrar/index';
import type { Registrars } from '../registrars-keys';

/**
 * Connection pool configuration.
 */
export interface EppPoolConfig {
  /** Minimum number of connections to keep open (default: 1) */
  min?: number;
  /** Maximum number of connections (default: 5) */
  max?: number;
  /** Time to wait for a connection before timeout (default: 30000ms) */
  acquireTimeoutMs?: number;
  /** Idle time before connection is closed (default: 600000ms / 10min) */
  idleTimeoutMs?: number;
}

/**
 * Rate limiting configuration.
 */
export interface RateLimitConfig {
  /** Maximum requests per second (default: 200) */
  maxRequestsPerSecond?: number;
  /** Maximum concurrent requests (default: 50) */
  maxConcurrent?: number;
  /** Redis connection for distributed rate limiting */
  redisConnection?: Bottleneck.IORedisConnection | Bottleneck.RedisConnection;
}

/**
 * CentralNic EPP connection and authentication configuration.
 */
export interface CentralNicConfig {
  overrideRegistrarKey?: Registrars;
  /** EPP server hostname (e.g., "epp.centralnicregistry.com") */
  host: string;
  /** EPP server port (default: 700) */
  port?: number;
  /** Use TLS connection (default: true) */
  tls?: boolean;
  /** Client/Registrar ID for EPP login */
  clID: string;
  /** Password for EPP login */
  pw: string;
  /** TLDs this account can manage (e.g., ["com", "net", "org"]) */
  supportedTlds: string[];
  /** Custom logger instance */
  customLogger?: pino.Logger;

  // ============ New Configuration Options ============

  /** Connection pool settings */
  pool?: EppPoolConfig;

  /** Rate limiting settings */
  rateLimit?: RateLimitConfig;

  /** Domain index functions for inventory management */
  domainIndex?: DomainIndexFunctions;

  /** Log raw XML requests/responses (default: false) */
  logXml?: boolean;

  /** Log parsed EPP objects (default: false) */
  logParsed?: boolean;

  /** Account key identifier (for multi-account setups) */
  accountKey?: string;

  defaultRegistrant: string;

  defaultContacts?: {
    type: 'billing' | 'tech' | 'admin';
    id: string;
  }[];

  defaultNameservers?: Nameservers;

  // ============ Legacy/Backward Compatibility ============

  /**
   * @deprecated Use rateLimit.redisConnection instead
   * Rate limiter connection for distributed limiting
   */
  connection?: Bottleneck.IORedisConnection | Bottleneck.RedisConnection;

  readonly eppAuthCodePrivateKey: string;
}

/** EPP namespace URIs */
export const EPP_NAMESPACES = {
  EPP: 'urn:ietf:params:xml:ns:epp-1.0',
  DOMAIN: 'urn:ietf:params:xml:ns:domain-1.0',
  CONTACT: 'urn:ietf:params:xml:ns:contact-1.0',
  HOST: 'urn:ietf:params:xml:ns:host-1.0',
  FEE: 'urn:ietf:params:xml:ns:epp:fee-1.0',
  SECDNS: 'urn:ietf:params:xml:ns:secDNS-1.1',
} as const;

/** EPP result codes (RFC 5730 Section 3) */
export const EPP_SUCCESS_CODES = {
  /** Command completed successfully */
  SUCCESS: 1000,
  /** Command completed successfully; action pending */
  SUCCESS_PENDING: 1001,
  /** Command completed successfully; no messages */
  SUCCESS_NO_MESSAGES: 1300,
  /** Command completed successfully; ack to dequeue */
  SUCCESS_ACK_TO_DEQUEUE: 1301,
  /** Command completed successfully; ending session */
  SUCCESS_LOGOUT: 1500,
} as const;

export const EPP_ERROR_CODES = {
  /** Unknown command */
  UNKNOWN_COMMAND: 2000,
  /** Command syntax error */
  COMMAND_SYNTAX_ERROR: 2001,
  /** Command use error */
  COMMAND_USE_ERROR: 2002,
  /** Required parameter missing */
  REQUIRED_PARAM_MISSING: 2003,
  /** Parameter value range error */
  PARAM_VALUE_RANGE_ERROR: 2004,
  /** Parameter value syntax error */
  PARAM_VALUE_SYNTAX_ERROR: 2005,
  /** Unimplemented protocol version */
  UNIMPLEMENTED_PROTOCOL_VERSION: 2100,
  /** Unimplemented command */
  UNIMPLEMENTED_COMMAND: 2101,
  /** Unimplemented option */
  UNIMPLEMENTED_OPTION: 2102,
  /** Unimplemented extension */
  UNIMPLEMENTED_EXTENSION: 2103,
  /** Billing failure */
  BILLING_FAILURE: 2104,
  /** Object is not eligible for renewal */
  OBJECT_NOT_ELIGIBLE_FOR_RENEWAL: 2105,
  /** Object is not eligible for transfer */
  OBJECT_NOT_ELIGIBLE_FOR_TRANSFER: 2106,
  /** Authentication error */
  AUTHENTICATION_ERROR: 2200,
  /** Authorization error */
  AUTHORIZATION_ERROR: 2201,
  /** Invalid authorization information */
  INVALID_AUTH_INFO: 2202,
  /** Object pending transfer */
  OBJECT_PENDING_TRANSFER: 2300,
  /** Object not pending transfer */
  OBJECT_NOT_PENDING_TRANSFER: 2301,
  /** Object exists */
  OBJECT_EXISTS: 2302,
  /** Object does not exist */
  OBJECT_DOES_NOT_EXIST: 2303,
  /** Object status prohibits operation */
  OBJECT_STATUS_PROHIBITS: 2304,
  /** Object association prohibits operation */
  OBJECT_ASSOCIATION_PROHIBITS: 2305,
  /** Parameter value policy error */
  PARAM_VALUE_POLICY_ERROR: 2306,
  /** Unimplemented object service */
  UNIMPLEMENTED_OBJECT_SERVICE: 2307,
  /** Data management policy violation */
  DATA_MANAGEMENT_POLICY_VIOLATION: 2308,
  /** Command failed */
  COMMAND_FAILED: 2400,
  /** Command failed; server closing connection */
  COMMAND_FAILED_SERVER_CLOSING: 2500,
  /** Authentication error; server closing connection */
  AUTH_ERROR_SERVER_CLOSING: 2501,
  /** Session limit exceeded; server closing connection */
  SESSION_LIMIT_EXCEEDED: 2502,
} as const;

/**
 * Check if an EPP result code indicates success.
 */
export function isEppSuccessCode(code: number): boolean {
  return code >= 1000 && code < 2000;
}

/**
 * EPP domain status values that can be set by clients.
 * See RFC 5731 Section 2.3.
 */
export const EPP_CLIENT_DOMAIN_STATUSES = {
  CLIENT_DELETE_PROHIBITED: 'clientDeleteProhibited',
  CLIENT_HOLD: 'clientHold',
  CLIENT_RENEW_PROHIBITED: 'clientRenewProhibited',
  CLIENT_TRANSFER_PROHIBITED: 'clientTransferProhibited',
  CLIENT_UPDATE_PROHIBITED: 'clientUpdateProhibited',
} as const;

/**
 * EPP domain status values set by the server.
 */
export const EPP_SERVER_DOMAIN_STATUSES = {
  SERVER_DELETE_PROHIBITED: 'serverDeleteProhibited',
  SERVER_HOLD: 'serverHold',
  SERVER_RENEW_PROHIBITED: 'serverRenewProhibited',
  SERVER_TRANSFER_PROHIBITED: 'serverTransferProhibited',
  SERVER_UPDATE_PROHIBITED: 'serverUpdateProhibited',
  PENDING_CREATE: 'pendingCreate',
  PENDING_DELETE: 'pendingDelete',
  PENDING_RENEW: 'pendingRenew',
  PENDING_TRANSFER: 'pendingTransfer',
  PENDING_UPDATE: 'pendingUpdate',
  OK: 'ok',
  INACTIVE: 'inactive',
} as const;

export type EppClientDomainStatus =
  (typeof EPP_CLIENT_DOMAIN_STATUSES)[keyof typeof EPP_CLIENT_DOMAIN_STATUSES];
export type EppServerDomainStatus =
  (typeof EPP_SERVER_DOMAIN_STATUSES)[keyof typeof EPP_SERVER_DOMAIN_STATUSES];
export type EppDomainStatus = EppClientDomainStatus | EppServerDomainStatus;
