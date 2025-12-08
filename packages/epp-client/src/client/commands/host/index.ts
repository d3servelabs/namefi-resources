/**
 * EPP Host commands.
 *
 * This module provides builders for all EPP host-related commands
 * as defined in RFC 5732.
 *
 * @see RFC 5732 - Extensible Provisioning Protocol (EPP) Host Mapping
 */

// Types
export type {
  HostAddr,
  HostCreateOptions,
  HostStatus,
  HostUpdateOptions,
  HostCheckPayload,
  HostInfoPayload,
  HostCreatePayload,
  HostUpdatePayload,
} from './types';

// Commands
export { buildHostCheckCommand } from './check';
export { buildHostInfoCommand } from './info';
export { buildHostCreateCommand } from './create';
export { buildHostDeleteCommand } from './delete';
export { buildHostUpdateCommand } from './update';
