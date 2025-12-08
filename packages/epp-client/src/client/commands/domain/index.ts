/**
 * EPP Domain commands.
 *
 * Domain commands manage internet domain name objects:
 * - check: Query domain availability
 * - info: Retrieve domain information
 * - create: Register a new domain
 * - delete: Remove a domain
 * - renew: Extend domain registration
 * - transfer: Transfer domain between registrars
 * - update: Modify domain attributes
 *
 * @see RFC 5731 - Extensible Provisioning Protocol (EPP) Domain Name Mapping
 */

// Types
export type {
  DomainCheckPayload,
  DomainInfoPayload,
  DomainCreatePayload,
  DomainRenewPayload,
  DomainTransferPayload,
  DomainUpdatePayload,
  DomainInfoOptions,
  DomainCreateOptions,
  DomainRenewOptions,
  DomainTransferOptions,
  DomainUpdateOptions,
  DomainStatus,
  TransferOp,
} from './types';

// Commands
export { buildDomainCheckCommand } from './check';
export { buildDomainInfoCommand } from './info';
export { buildDomainCreateCommand } from './create';
export { buildDomainDeleteCommand } from './delete';
export { buildDomainRenewCommand } from './renew';
export { buildDomainTransferCommand } from './transfer';
export { buildDomainUpdateCommand } from './update';
