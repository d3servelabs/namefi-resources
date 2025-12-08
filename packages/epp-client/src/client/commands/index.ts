/**
 * EPP Command Builders
 *
 * This module provides type-safe builders for all EPP commands,
 * organized by object type (domain, contact, host) and session commands.
 *
 * @example
 * import {
 *   buildLoginCommand,
 *   buildDomainCheckCommand,
 *   buildEppEnvelopeFromCommand,
 * } from "./commands";
 *
 * const loginCmd = buildLoginCommand({
 *   clID: "registrar",
 *   pw: "password",
 *   objURIs: [DOMAIN_NS, CONTACT_NS, HOST_NS],
 * });
 *
 * const envelope = buildEppEnvelopeFromCommand(loginCmd);
 *
 * @see RFC 5730 - Extensible Provisioning Protocol (EPP)
 * @see RFC 5731 - EPP Domain Name Mapping
 * @see RFC 5732 - EPP Host Mapping
 * @see RFC 5733 - EPP Contact Mapping
 */

// ============ Helpers ============

export { xmlTextNode, withNamespaces } from './helpers/xml-utils';
export { withEppBaseFields, type CommandOptions } from './helpers/base-fields';
export {
  EPP_NS,
  DOMAIN_NS,
  CONTACT_NS,
  HOST_NS,
  FEE_NS,
  SECDNS_NS,
  RGP_NS,
  IDN_NS,
  LAUNCH_NS,
} from './helpers/namespaces';

// ============ Session Commands ============

export {
  buildLoginCommand,
  buildLogoutCommand,
  buildPollReqCommand,
  buildPollAckCommand,
  type LoginOptions,
  type LoginPayload,
  type PollPayload,
} from './session';

// ============ Domain Commands ============

export {
  // Types
  type DomainStatus,
  type TransferOp,
  type DomainInfoOptions,
  type DomainCreateOptions,
  type DomainRenewOptions,
  type DomainTransferOptions,
  type DomainUpdateOptions,
  type DomainCheckPayload,
  type DomainInfoPayload,
  type DomainCreatePayload,
  type DomainRenewPayload,
  type DomainTransferPayload,
  type DomainUpdatePayload,
  // Commands
  buildDomainCheckCommand,
  buildDomainInfoCommand,
  buildDomainCreateCommand,
  buildDomainDeleteCommand,
  buildDomainRenewCommand,
  buildDomainTransferCommand,
  buildDomainUpdateCommand,
  buildChangeNsCommand,
  buildToggleLockTransferCommand,
} from './domain';

// ============ Contact Commands ============

export {
  // Types
  type ContactPostalInfo,
  type ContactInfoOptions,
  type ContactCreateOptions,
  type ContactStatus,
  type ContactUpdateOptions,
  type ContactCheckPayload,
  type ContactInfoPayload,
  type ContactCreatePayload,
  type ContactUpdatePayload,
  // Commands
  buildContactCheckCommand,
  buildContactInfoCommand,
  buildContactCreateCommand,
  buildContactDeleteCommand,
  buildContactUpdateCommand,
} from './contact';

// ============ Host Commands ============

export {
  // Types
  type HostAddr,
  type HostCreateOptions,
  type HostStatus,
  type HostUpdateOptions,
  type HostCheckPayload,
  type HostInfoPayload,
  type HostCreatePayload,
  type HostUpdatePayload,
  // Commands
  buildHostCheckCommand,
  buildHostInfoCommand,
  buildHostCreateCommand,
  buildHostDeleteCommand,
  buildHostUpdateCommand,
} from './host';

// ============ Envelope ============

export {
  buildEppEnvelopeFromCommand,
  buildHelloEnvelope,
  type FullEppEnvelope,
  type HelloEnvelope,
} from './envelope';

// Re-export EppCommandTypeXml type for convenience
export type { EppCommandTypeXml } from '../../data/schemas/epp-core';

export * from './extensions';
