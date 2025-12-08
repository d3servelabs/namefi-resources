/**
 * EPP Contact commands.
 *
 * This module provides builders for all EPP contact-related commands
 * as defined in RFC 5733.
 *
 * @see RFC 5733 - Extensible Provisioning Protocol (EPP) Contact Mapping
 */

// Types
export type {
  ContactPostalInfo,
  ContactInfoOptions,
  ContactCreateOptions,
  ContactStatus,
  ContactUpdateOptions,
  ContactCheckPayload,
  ContactInfoPayload,
  ContactCreatePayload,
  ContactUpdatePayload,
} from './types';

// Commands
export { buildContactCheckCommand } from './check';
export { buildContactInfoCommand } from './info';
export { buildContactCreateCommand } from './create';
export { buildContactDeleteCommand } from './delete';
export { buildContactUpdateCommand } from './update';
